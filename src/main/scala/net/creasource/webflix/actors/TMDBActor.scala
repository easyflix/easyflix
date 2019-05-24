package net.creasource.webflix.actors

import akka.Done
import akka.actor.{Actor, ActorRef, PoisonPill, Props, Stash, Status}
import akka.event.Logging
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{HttpRequest, HttpResponse, ResponseEntity, StatusCodes}
import akka.stream.OverflowStrategy
import akka.stream.scaladsl.{Flow, Keep, Sink, Source}
import akka.util.ByteString
import net.creasource.exceptions.NotFoundException
import net.creasource.webflix.events._
import net.creasource.webflix._
import net.creasource.{Application, tmdb}
import spray.json.DefaultJsonProtocol._

import scala.concurrent.Future
import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}

object TMDBActor {

  case object GetConfig
  case object GetMovies
  case object GetShows
  case class GetMovie(id: Int)
  case class GetShow(id: Int)

  def props()(implicit application: Application): Props = Props(new TMDBActor)

  sealed trait Context
  case object ConfigurationContext extends Context
  case object LanguagesContext extends Context

  sealed abstract class RuntimeContext(val log: String) extends Context
  case class MovieSearchContext(query: String, year: Int) extends RuntimeContext(s"Search movie: $query")
  case class MovieDetailsContext(id: Int) extends RuntimeContext(s"Movie details: $id")
  case class TVSearchContext(query: String) extends RuntimeContext(s"Search TV: $query")
  case class TVDetailsContext(id: Int) extends RuntimeContext(s"TV Details: $id")
  // case class TVSeasonContext(id: Int, season: Int) extends RuntimeContext(s"TV Season: $id - S$season")
  case class TVEpisodeContext(id: Int, season: Int, episode: Int) extends RuntimeContext(s"TV Episode: $id - S$season/E$episode")

  sealed trait Metadata
  case class MovieMetadata(name: String, year: Int, file: LibraryFile) extends Metadata
  case class TVEpisodeMetadata(name: String, season: Int, episode: Int, file: LibraryFile) extends Metadata
  case class UnknownMetadata(file: LibraryFile) extends Metadata
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
    var movieSearches: Map[MovieSearchContext, Set[LibraryFile]] = Map.empty
    override def receive: Receive = {
      // Public actor API
      case GetMovies => sender() ! movies.values.toSeq
      case GetMovie(id) =>
        movies.get(id) match {
          case Some(movie) => sender() ! movie
          case _ => sender() ! Status.Failure(NotFoundException("Movie not found"))
        }
      // From parent
      case MovieMetadata(name, year, file) =>
        val searchContext = MovieSearchContext(name, year)
        movieSearches.get(searchContext) match {
          case Some(files) =>
            movieSearches += searchContext -> (files + file)
          case None =>
            tmdbActor ! createRequest(searchContext)
            movieSearches += searchContext -> Set(file)
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
            movieSearches -= searchContext
          } else {
            // TODO deal with empty search results
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
    var showSearches: Map[TVSearchContext, Set[LibraryFile]] = Map.empty
    override def receive: Receive = {
      // Public actor API
      case GetShows => sender() ! shows.values.toSeq
      case GetShow(id) =>
        shows.get(id) match {
          case Some(show) => sender() ! show
          case _ => sender() ! Status.Failure(NotFoundException("TV show not found"))
        }
      //
      case TVEpisodeMetadata(name, _, _, file) =>
        val searchContext = TVSearchContext(name)
        showSearches.get(searchContext) match {
          case Some(files) =>
            showSearches += searchContext -> (files + file)
          case None =>
            tmdbActor ! createRequest(searchContext)
            showSearches += searchContext -> Set(file)
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
                  details = None,
                  episodes = List.empty
                )
              )
            shows += head.id -> show
            logger.info("Received search results for show: " + show.name)
            tmdbActor ! createRequest(TVDetailsContext(show.id))
            show.files.map(
              file => TVEpisodeContext(show.id, file.seasonNumber.get, file.episodeNumber.get)
            )
            // .distinct
            // Filter episodes for which we already have a result
            .filter(context => !shows.values
              .filter(_.id == show.id)
              .flatMap(_.episodes)
              .map(ep => TVEpisodeContext(show.id, ep.season_number, ep.episode_number))
              .toSeq.contains(context)
            ).foreach(tmdbActor ! createRequest(_))
            application.bus.publish(ShowAdded(show))
            showSearches -= searchContext
          }
        )
      case details: Show.Details =>
        shows.get(details.id).foreach { show =>
          logger.info("Received show details for: " + show.name)
          val cleanedDetails = details.copy(
            credits = details.credits.copy(
              crew = List.empty,
              cast = details.credits.cast.take(7)
            )
          )
          application.bus.publish(ShowUpdate(cleanedDetails))
          shows += show.id -> show.withDetails(cleanedDetails)
        }
      case (TVEpisodeContext(id, seasonNumber, episodeNumber), episode: Episode) =>
        shows.get(id).foreach { show =>
          val cleanedEpisode = episode.copy(
            crew = episode.crew.filter(p => p.job == "Director" || p.job == "Writer")
          )
          logger.info(s"Received episode details for show: ${show.name} - $seasonNumber/$episodeNumber")
          shows += show.id -> show.withEpisode(cleanedEpisode) // TODO check if this episodes exists already
          application.bus.publish(ShowAdded(show.withEpisode(cleanedEpisode))) // TODO publish only an update
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
        .map(extractMeta)
        .foreach {
          case meta: MovieMetadata =>
            movieActor ! meta
          case meta: TVEpisodeMetadata =>
            tvActor ! meta
          case UnknownMetadata(_) => // TODO
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
        case episodeContext: TVEpisodeContext =>
          parseEntity[Episode](entity).foreach(tvActor ! (episodeContext, _))
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
    case GetShows => tvActor forward GetShows
    case GetShow(id) => tvActor forward GetShow(id)

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
        TVEpisodeMetadata(
          title.trim.toLowerCase,
          season.toInt,
          episode.toInt,
          file.withTags(extractTags(rest))
            .withSeasonNumber(season.toInt)
            .withEpisodeNumber(episode.toInt)
        )
      case movie(title, year, _, rest) =>
        MovieMetadata(
          title.trim.toLowerCase,
          year.toInt,
          file.withTags(extractTags(rest))
        )
      case _ => UnknownMetadata(file.withTags(extractTags(file.name)))
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
      tmdb.MovieDetails.get(api_key, id, append_to_response = Some("credits"))
    case TVSearchContext(query) =>
      tmdb.SearchTVShows.get(api_key, query)
    case TVDetailsContext(id) =>
      tmdb.TVDetails.get(api_key, id, append_to_response = Some("credits"))
    case TVEpisodeContext(id, season, episode) =>
      tmdb.TVEpisodeDetails.get(api_key, id, season, episode)
  }

  def parseEntity[T](entity: ResponseEntity)(implicit reader: spray.json.RootJsonReader[T]): Future[T] = {
    import spray.json._
    entity.dataBytes.runFold(ByteString(""))(_ ++ _).flatMap { body =>
      val f = Future(body.utf8String.parseJson.convertTo[T])
      f.failed.foreach(exception =>
        logger.error(exception, "Error parsing response entity: " + body.utf8String)
      )
      f
    }
  }

  override def postStop(): Unit = {
    connectionPool.shutdown()
  }

}
