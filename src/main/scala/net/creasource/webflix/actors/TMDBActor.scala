package net.creasource.webflix.actors

import akka.Done
import akka.actor.{Actor, ActorRef, PoisonPill, Props, Stash, Status}
import akka.event.Logging
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{HttpRequest, HttpResponse, ResponseEntity, StatusCodes}
import akka.stream.OverflowStrategy
import akka.stream.scaladsl.{Flow, Keep, Sink, Source}
import akka.util.ByteString
import net.creasource.{Application, tmdb}
import net.creasource.exceptions.NotFoundException
import net.creasource.webflix.LibraryFile.Tags
import net.creasource.webflix.events.{FileAdded, MovieAdded, MovieUpdate}
import net.creasource.webflix.{Configuration, LibraryFile, Movie, Show}
import spray.json.DefaultJsonProtocol._

import scala.concurrent.Future
import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}

object TMDBActor {

  case object GetConfig
  case object GetMovies
  case object GetTVShows
  case class GetMovie(id: Int)
  case class GetTVShow(id: Int)

  def props()(implicit application: Application): Props = Props(new TMDBActor)

  sealed trait Context
  case object ConfigurationContext extends Context
  case object LanguagesContext extends Context

  sealed abstract class RuntimeContext(val log: String) extends Context
  case class MovieSearchContext(query: String, year: Int) extends RuntimeContext(s"Search movie: $query")
  case class MovieDetailsContext(id: Int) extends RuntimeContext(s"Movie details: $id")
  case class TVSearchContext(query: String) extends RuntimeContext(s"Search TV: $query")
  case class TVDetailsContext(id: Int) extends RuntimeContext(s"TV Details: $id")
  case class TVSeasonContext(id: Int, season: Int) extends RuntimeContext(s"TV Season: $id - S$season")
  case class TVEpisodeContext(id: Int, season: Int, episode: Int) extends RuntimeContext(s"TV Episode: $id - S$season/E$episode")

  sealed trait Metadata
  case class MovieMetadata(name: String, year: Int, tags: List[String]) extends Metadata
  case class TVEpisodeMetadata(name: String, season: Int, episode: Int, tags: List[String]) extends Metadata
  case class UnknownMetadata(tags: List[String]) extends Metadata
}

class TMDBActor()(implicit application: Application) extends Actor with Stash {

  import TMDBActor._
  import application.{materializer, system}
  import context.dispatcher

  val logger = Logging(context.system, this)

  private val api_key = application.config.getString("tmdb.api-key")

  application.bus.subscribe(self, classOf[FileAdded])

  val (tmdbActor: ActorRef, connectionPool: Http.HostConnectionPool) =
    Source.actorRef(10000, OverflowStrategy.dropNew)
      .via(Flow[(HttpRequest, Context)].throttle(40, 10.seconds))
      .viaMat(Http().cachedHostConnectionPoolHttps[Context]("api.themoviedb.org"))(Keep.both)
      .log("TMDB error")
      .to(Sink.actorRef(self, Done))
      .run()

  /**
    * Load configuration
    */
  Seq(ConfigurationContext, LanguagesContext)
    .map(createRequest)
    .foreach(tmdbActor ! _)

  val movieActor: ActorRef = context.actorOf(Props(new Actor {
    var movies: Map[Int, Movie] = Map.empty
    var movieSearches: Map[MovieSearchContext, Seq[LibraryFile with Tags]] = Map.empty
    override def receive: Receive = {
      // Public actor API
      case GetMovies => sender() ! movies.values.toSeq
      case GetMovie(id) =>
        movies.get(id) match {
          case Some(movie) => sender() ! movie
          case _ => sender() ! Status.Failure(NotFoundException("Movie not found"))
        }
      // From parent
      case (MovieMetadata(name, year, _), file: LibraryFile with Tags) =>
        val searchContext = MovieSearchContext(name, year)
        movieSearches.get(searchContext) match {
          case Some(files) =>
            movieSearches += searchContext -> (files :+ file)
          case None =>
            tmdbActor ! createRequest(searchContext)
            movieSearches += searchContext -> Seq(file)
        }
      case (searchContext: MovieSearchContext, result: tmdb.SearchMovies) =>
        movieSearches.get(searchContext).foreach(files =>
          if (result.total_results > 0) {
            val head = result.results.head
            val movie = movies.get(head.id)
              .map(movie => movie.copy(files = movie.files ++ files))
              .getOrElse(
                Movie(
                  id = head.id,
                  title = head.title,
                  original_title = head.original_title,
                  original_language = head.original_language,
                  release_date = head.release_date,
                  poster = head.poster_path,
                  backdrop = head.backdrop_path,
                  overview = head.overview,
                  vote_average = head.vote_average,
                  files = files,
                  details = None
                )
              )
            movies += head.id -> movie
            logger.info("Received search results for: " + movie.title)
            tmdbActor ! createRequest(MovieDetailsContext(movie.id))
            application.bus.publish(MovieAdded(movie))
          }
        )
      case details: Movie.Details =>
        movies.get(details.id).foreach { movie =>
          val cleanedDetails = details.copy(
            credits = details.credits.copy(
              crew = details.credits.crew.filter(_.job == "Director"),
              cast = details.credits.cast.take(7)
            )
          )
          logger.info("Received movie details for: " + movie.title)
          application.bus.publish(MovieUpdate(cleanedDetails))
          movies += movie.id -> movie.withDetails(cleanedDetails)
        }
    }
  }))

  val tvActor: ActorRef = context.actorOf(Props(new Actor {
    var shows: Map[Int, Show] = Map.empty
    var showSearches: Map[TVSearchContext, Seq[LibraryFile with Tags]] = Map.empty
    override def receive: Receive = {
      // Public actor API
      case GetTVShows => sender() ! shows.values.toSeq
      case GetTVShow(id) =>
        shows.get(id) match {
          case Some(show) => sender() ! show
          case _ => sender() ! Status.Failure(NotFoundException("TV show not found"))
        }
      //
      case (TVEpisodeMetadata(name, _, _, _), file: LibraryFile with Tags) =>
        val searchContext = TVSearchContext(name)
        showSearches.get(searchContext) match {
          case Some(files) =>
            showSearches += searchContext -> (files :+ file)
          case None =>
            tmdbActor ! createRequest(searchContext)
            showSearches += searchContext -> Seq(file)
        }
      case (searchContext: TVSearchContext, result: tmdb.SearchTVShows) =>
        showSearches.get(searchContext).foreach(files =>
          if (result.total_results > 0) {
            val head = result.results.head
            val show = shows.get(head.id)
              .map(show => show.copy(files = show.files ++ files))
              .getOrElse(
                Show(
                  id = head.id,
                  name = head.name,
                  original_name = head.original_name,
                  original_language = head.original_language,
                  origin_country = head.origin_country,
                  first_air_date = head.first_air_date,
                  poster = head.poster_path,
                  backdrop = head.backdrop_path,
                  overview = head.overview,
                  vote_average = head.vote_average,
                  files = files,
                  details = None
                )
              )
            shows += head.id -> show
            logger.info("Received search results for show: " + show.name)
            tmdbActor ! createRequest(TVDetailsContext(show.id))
            /*show.files.foreach(file =>
              tmdbActor ! createRequest(TVEpisodeContext())
            )*/
//            application.bus.publish(MovieAdded(movie))
          }
        )
      case details: Show.Details =>
        shows.get(details.id).foreach { show =>
          logger.info("Received show details for: " + show.name)
          // application.bus.publish(MovieUpdate(cleanedDetails))
          shows += show.id -> show.withDetails(details)
        }
    }
  }))

  override def receive: Receive = loading(Configuration(None, None))

  case class Images(images: net.creasource.tmdb.Configuration.Images)
  case class Languages(languages: net.creasource.tmdb.Configuration.Languages)

  def loading(config: Configuration): Receive = {

    case (Success(HttpResponse(StatusCodes.OK, _, entity, _)), ConfigurationContext) =>
      parseEntity[net.creasource.tmdb.Configuration](entity).foreach { conf =>
        self ! Images(conf.images)
      }

    case (Success(HttpResponse(StatusCodes.OK, _, entity, _)), LanguagesContext) =>
      parseEntity[net.creasource.tmdb.Configuration.Languages](entity).foreach { languages =>
        self ! Languages(languages)
      }

    case (Success(HttpResponse(_, _, entity, _)), requestContext) =>
      requestContext match {
        case ConfigurationContext =>
          entity.discardBytes()
          logger.error("Got a non-200 response for configuration request.")
          self ! PoisonPill // TODO
        case LanguagesContext =>
          entity.discardBytes()
          logger.error("Got a non-200 response for languages request.")
          self ! PoisonPill // TODO
        case _ => stash()
      }

    case (Failure(exception), requestContext) =>
      logger.error("An error occurred for context: " + requestContext, exception)

    case Images(images) =>
      val configuration = config.copy(images = Some(images))
      if (configuration.languages.isDefined & configuration.images.isDefined) {
        unstashAll()
        logger.info("Configuration loaded successfully")
        context.become(behavior(configuration))
      } else {
        context.become(loading(configuration))
      }

    case Languages(languages) =>
      val configuration = config.copy(languages = Some(languages))
      if (configuration.languages.isDefined & configuration.images.isDefined) {
        unstashAll()
        logger.info("Configuration loaded successfully")
        context.become(behavior(configuration))
      } else {
        context.become(loading(configuration))
      }

    case _ => stash()
  }

  def behavior(config: Configuration): Receive = {

    // Events
    case FileAdded(file) =>
      Seq(file)
        .filter(!_.isDirectory)
        .filter(!_.name.matches("(?i).*sample.*"))
        // .filter(file => !movies.values.map(_.file.path).toSeq.contains(file.path)) // TODO
        .map(extractMeta)
        .foreach {
          case meta @ MovieMetadata(_, _, tags) =>
            movieActor ! (meta, file.withTags(tags))
          case meta @ TVEpisodeMetadata(_ ,_, _, tags) =>
            tvActor ! (meta, file.withTags(tags))
          case UnknownMetadata(tags) =>
        }

    // TMDB responses
    case (Success(HttpResponse(StatusCodes.OK, _, entity, _)), requestContext: RuntimeContext) =>
      requestContext match {
        case searchContext: MovieSearchContext =>
          parseEntity[tmdb.SearchMovies](entity).foreach(movieActor ! (searchContext, _))
        case _: MovieDetailsContext =>
          parseEntity[Movie.Details](entity).foreach(movieActor ! _)
        case searchContext: TVSearchContext =>
          parseEntity[tmdb.SearchTVShows](entity).foreach(tvActor ! (searchContext, _))
        case _: TVDetailsContext =>
          parseEntity[Show.Details](entity).foreach(tvActor ! _)
        /*case TVSearchContext(_, files) =>
          parseEntity[tmdb.SearchTVShows](entity).foreach { search =>
            if (search.total_results > 0) {
              val head = search.results.head
              self ! TVShow(
                id = head.id,
                poster_path = head.poster_path,
                backdrop_path = head.backdrop_path,
                vote_average = head.vote_average,
                overview = head.overview,
                first_air_date = head.first_air_date,
                original_language = head.original_language,
                origin_country = head.origin_country,
                name = head.name,
                original_name = head.original_name,
                files = files
              )
            }
          }*/
        case _ =>
          entity.discardBytes()
          ???
      }

    case (Success(HttpResponse(StatusCodes.TooManyRequests, headers, entity, _)), requestContext: RuntimeContext) =>
      entity.discardBytes()
      val retryIn = headers
        .find(_.lowercaseName == "retry-after")
        .flatMap(header => Try(header.value.toInt).toOption)
        .getOrElse(1)
      logger.info(s"Rescheduling request in $retryIn seconds: " + requestContext.log)
      system.scheduler.scheduleOnce(FiniteDuration(retryIn, SECONDS))(tmdbActor ! createRequest(requestContext))

    case (Success(HttpResponse(code, _, entity, _)), _) =>
      entity.discardBytes()
      logger.warning(s"Unhandled response: $code")

    case (Failure(exception), requestContext) =>
      logger.error("An error occurred for context: " + requestContext, exception)

    // Actor API
    case GetConfig => sender() ! config
    case GetMovies => movieActor forward GetMovies
    case GetMovie(id) => movieActor forward GetMovie(id)

    // Internal (self-sent messages)
/*  case show: TVShow => {
      logger.info("Received search results for: " + show.name)
      // tmdbActor ! createRequest(TVDetailsContext(show.id))
      // application.bus.publish(MovieAdded(movie))
      context become behavior(config, movies, shows + (show.id -> show), tvSearchContexts)
    }*/

  }

  def extractMeta(file: LibraryFile): Metadata = {
    val show = """^(.+)([Ss](\d{1,2})[Ee](\d{1,2}))(.*)$""".r
    val movie = """^(.+)((19|20)\d{2})(.*)$""".r

    def clean(name: String): String = name
      .replaceAll("\\.", " ")
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replaceAll("""\(|\)""", "")
      .replaceAll("""\[|\]""", "")
      .replaceAll("[ ]+", " ")

    def extractTags(rest: String): List[String] = {
      var tags = List.empty[String]
      val lower = rest.toLowerCase
      if (lower.contains("h264") || lower.contains("x264"))
        tags +:= "x264"
      if (lower.contains("h265") || lower.contains("x265"))
        tags +:= "x265"
      if (lower.endsWith("mkv"))
        tags +:= "mkv"
      if (lower.endsWith("mp4"))
        tags +:= "mp4"
      if (lower.contains("720p"))
        tags +:= "720p"
      if (lower.contains("1080p"))
        tags +:= "1080p"
      tags
    }

    clean(file.name) match {
      case show(title, _, season, episode, rest) =>
        TVEpisodeMetadata(title.trim.toLowerCase, season.toInt, episode.toInt, extractTags(rest))
      case movie(title, year, _, rest) =>
        MovieMetadata(title.trim.toLowerCase, year.toInt, extractTags(rest))
      case _ => UnknownMetadata(extractTags(file.name))
    }
  }

  def createRequest: Context => (HttpRequest, Context) = context => {
    (HttpRequest(uri = contextToUri(context)), context)
  }

  def contextToUri(context: Context): String = context match {
    case ConfigurationContext =>
      tmdb.Configuration.get(api_key)
    case LanguagesContext =>
      tmdb.Configuration.Language.get(api_key)
    case MovieSearchContext(name, year) =>
      tmdb.SearchMovies.get(api_key, name, year = Some(year))
    case MovieDetailsContext(id) =>
      tmdb.MovieDetails.get(id, api_key, append_to_response = Some("credits"))
    case TVSearchContext(query) =>
      tmdb.SearchTVShows.get(api_key, query)
    case TVDetailsContext(id) =>
      tmdb.TVDetails.get(id, api_key)
    case TVSeasonContext(id, season) =>
      ???
    case TVEpisodeContext(id, season, episode) =>
      // tmdb.TVEpisodeDetails.get
      ???
  }

  def parseEntity[T](entity: ResponseEntity)(implicit reader: spray.json.RootJsonReader[T]): Future[T] = {
    import spray.json._
    entity.dataBytes.runFold(ByteString(""))(_ ++ _).flatMap { body =>
      val f = Future(body.utf8String.parseJson.convertTo[T])
      f.failed.foreach(exception => logger.error(exception, "Error parsing response entity: " + body.utf8String))
      f
    }
  }

  override def postStop(): Unit = {
    connectionPool.shutdown()
  }

}
