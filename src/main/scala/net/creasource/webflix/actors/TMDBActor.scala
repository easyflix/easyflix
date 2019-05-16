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
import net.creasource.webflix.events.{FileAdded, MovieAdded, MovieUpdate}
import net.creasource.webflix.{Configuration, LibraryFile, Movie}
import spray.json.DefaultJsonProtocol._

import scala.concurrent.Future
import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}

object TMDBActor {

  case object GetConfig
  case object GetMovies
  case object GetTVShows
  case class GetMovie(id: Int)

  def props()(implicit application: Application): Props = Props(new TMDBActor)

  sealed trait Context
  case object ConfigurationContext extends Context
  case object LanguagesContext extends Context

  sealed abstract class RuntimeContext(val name: String) extends Context
  case class MovieSearchContext(query: String, year: Int, file: LibraryFile with LibraryFile.Tags) extends RuntimeContext(s"Search movie: $query")
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
        context.become(behavior(configuration, Map.empty))
      } else {
        context.become(loading(configuration))
      }

    case Languages(languages) =>
      val configuration = config.copy(languages = Some(languages))
      if (configuration.languages.isDefined & configuration.images.isDefined) {
        unstashAll()
        logger.info("Configuration loaded successfully")
        context.become(behavior(configuration, Map.empty))
      } else {
        context.become(loading(configuration))
      }

    case _ => stash()
  }

  def behavior(
    config: Configuration,
    movies: Map[Int, Movie]
  ): Receive = {

    // Events
    case FileAdded(file) =>
      Seq(file)
        .filter(!_.isDirectory)
        .filter(!_.name.matches("(?i).*sample.*"))
        .filter(file => !movies.values.map(_.file.path).toSeq.contains(file.path))
        .map(extractMeta)
        .foreach {
          case MovieMetadata(name, year, tags) =>
            val context = MovieSearchContext(name, year, file.withTags(tags))
            tmdbActor ! createRequest(context)
          case TVEpisodeMetadata(name, season, episode, tags) =>
          case UnknownMetadata(tags) =>
        }

    // TMDB responses
    case (Success(HttpResponse(StatusCodes.OK, _, entity, _)), requestContext: RuntimeContext) =>
      requestContext match {
        case MovieSearchContext(_, _, file) =>
          parseEntity[tmdb.SearchMovies](entity).foreach { search =>
            if (search.total_results > 0) {
              val head = search.results.head
              self ! Movie(
                head.id,
                head.title,
                head.original_title,
                head.original_language,
                head.release_date,
                head.poster_path,
                head.backdrop_path,
                head.overview,
                head.vote_average,
                file,
                None
              )
            }
          }
        case MovieDetailsContext(_) =>
          parseEntity[Movie.Details](entity).foreach(self ! _)
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
      logger.info(s"Rescheduling request in $retryIn seconds: " + requestContext.name)
      system.scheduler.scheduleOnce(FiniteDuration(retryIn, SECONDS))(tmdbActor ! createRequest(requestContext))

    case (Success(HttpResponse(_, _, entity, _)), _) =>
      entity.discardBytes()
      logger.warning("Unhandled response")

    case (Failure(exception), requestContext) =>
      logger.error("An error occurred for context: " + requestContext, exception)

    // Actor API
    case GetConfig => sender() ! config

    case GetMovies => sender() ! movies.values.toSeq

    case GetMovie(id) =>
      movies.values.find(_.id == id) match {
        case Some(movie) => sender() ! movie
        case _ => sender() ! Status.Failure(NotFoundException("Movie not found"))
      }

    // Internal (self-sent messages)
    case movie: Movie =>
      logger.info("Received search results for: " + movie.title)
      tmdbActor ! createRequest(MovieDetailsContext(movie.id))
      application.bus.publish(MovieAdded(movie))
      context become behavior(config, movies + (movie.id -> movie))

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
        context become behavior(config, movies + (movie.id -> movie.withDetails(cleanedDetails)))
      }

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
      case show(title, _, season, episode, rest) => TVEpisodeMetadata(title.trim, season.toInt, episode.toInt, extractTags(rest))
      case movie(title, year, _, rest) => MovieMetadata(title.trim, year.toInt, extractTags(rest))
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
    case MovieSearchContext(name, year, _) =>
      tmdb.SearchMovies.get(api_key, name, year = Some(year))
    case MovieDetailsContext(id) =>
      tmdb.MovieDetails.get(id, api_key, append_to_response = Some("credits"))
    case TVSearchContext(query) =>
      tmdb.SearchTVShows.get(api_key, query)
    case TVDetailsContext(id) =>
      // tmdb.TVEpisodeDetails.get()
      ???
    case TVSeasonContext(id, season) =>
      ???
    case TVEpisodeContext(id, season, episode) =>
      // tmdb.TVEpisodeDetails.get
      ???
  }

  def parseEntity[T](entity: ResponseEntity)(implicit reader: spray.json.RootJsonReader[T]): Future[T] = {
    import spray.json._
    entity.dataBytes.runFold(ByteString(""))(_ ++ _).flatMap { body =>
      Future(body.utf8String.parseJson.convertTo[T])
    }
  }

  override def postStop(): Unit = {
    connectionPool.shutdown()
  }

}
