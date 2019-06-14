package net.easyflix.actors

import akka.Done
import akka.actor.{Actor, ActorRef, Props, Stash, Status}
import akka.event.Logging
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{HttpRequest, HttpResponse, ResponseEntity, StatusCodes}
import akka.stream.scaladsl.{Flow, Keep, Sink, Source}
import akka.stream.{KillSwitch, KillSwitches, Materializer, OverflowStrategy}
import akka.util.ByteString
import com.typesafe.config.Config
import net.easyflix.events._
import net.easyflix.exceptions.NotFoundException
import net.easyflix.model._
import net.easyflix.tmdb

import scala.concurrent.Future
import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}

object TMDBActor {

  case object GetConfig
  case object GetMovies
  case object GetShows
  final case class GetMovie(id: Int)
  final case class GetShow(id: Int)

  def props(tmdbConf: TMDBConfiguration, bus: ApplicationBus, config: Config)(implicit materializer: Materializer): Props =
    Props(new TMDBActor(tmdbConf, bus, config))

  sealed abstract class Context(val log: String)
  private final case class MovieSearchContext(query: String, year: Int) extends Context(s"Search movie: $query")
  private final case class MovieDetailsContext(id: Int) extends Context(s"Movie details: $id")
  private final case class TVSearchContext(query: String) extends Context(s"Search TV: $query")
  private final case class TVDetailsContext(id: Int) extends Context(s"TV Details: $id")
  private final case class TVEpisodeContext(id: Int, season: Int, episode: Int) extends Context(s"TV Episode: $id - S$season/E$episode")

  sealed trait Metadata
  private final case class MovieMetadata(name: String, year: Int, file: LibraryFile) extends Metadata
  private final case class TVEpisodeMetadata(name: String, season: Int, episode: Int, file: LibraryFile) extends Metadata
  private final case class UnknownMetadata(file: LibraryFile) extends Metadata
}

class TMDBActor(
    tmdbConf: TMDBConfiguration,
    bus: ApplicationBus,
    config: Config)(implicit materializer: Materializer) extends Actor with Stash {

  import TMDBActor._
  import context.dispatcher

  val logger = Logging(context.system, this)

  private val api_key = config.getString("tmdbApiKey")

  bus.subscribe(self, classOf[FileAdded])
  bus.subscribe(self, classOf[FileDeleted])
  bus.subscribe(self, classOf[LibraryDeleted])

  val ((tmdbActor: ActorRef, poolKillSwitch: KillSwitch), connectionPool: Http.HostConnectionPool) =
    Source.actorRef(10000, OverflowStrategy.dropNew)
      .via(Flow[(HttpRequest, Context)].throttle(40, 10.seconds))
      .viaMat(KillSwitches.single)(Keep.both)
      .viaMat(Http()(context.system).cachedHostConnectionPoolHttps[Context]("api.themoviedb.org"))(Keep.both)
      .log("TMDB error")
      .to(Sink.actorRef(self, Done))
      .run()

  val moviesActor: ActorRef = context.actorOf(Props(new Actor {
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
      case FileDeleted(path) =>
        movies.values.find(_.files.map(_.path).contains(path)).foreach{ movie =>
          val updated = movie.copy(files = movie.files.filter(_.path != path))
          if (updated.files.isEmpty) {
            bus.publish(MovieDeleted(movie.id))
            movies -= movie.id
          } else {
            bus.publish(MovieAdded(updated))
            movies += movie.id -> updated
          }
        }
      case LibraryDeleted(name) =>
        logger.info(name + " has been deleted")
        movies.values.filter(_.files.map(_.libraryName).contains(name)).foreach{ movie =>
          logger.info("found movie for that library " + movie.title)
          val updated = movie.copy(files = movie.files.filter(_.libraryName != name))
          if (updated.files.isEmpty) {
            bus.publish(MovieDeleted(movie.id))
            movies -= movie.id
          } else {
            bus.publish(MovieAdded(updated))
            movies += movie.id -> updated
          }
        }
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
            val initial = Movie(
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
            val movie = movies.get(head.id) match {
              case Some(m) => initial.withFiles(m.files)
              case None => initial
            }
            movies += head.id -> movie
            logger.info("Received search results for: " + movie.title)
            tmdbActor ! createRequest(MovieDetailsContext(movie.id))
            bus.publish(MovieAdded(movie))
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
          bus.publish(MovieUpdate(cleanedDetails))
          movies += movie.id -> movie.withDetails(cleanedDetails)
        }
    }
  }), "movies")

  val showsActor: ActorRef = context.actorOf(Props(new Actor {
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
      // From parent
      case FileDeleted(path) =>
        shows.values.find(_.files.map(_.path).contains(path)).foreach{ show =>
          val updated = show.copy(files = show.files.filter(_.path != path))
          if (updated.files.isEmpty) {
            bus.publish(ShowDeleted(show.id))
            shows -= show.id
          } else {
            bus.publish(ShowAdded(updated))
            shows += show.id -> updated
          }
        }
      case LibraryDeleted(name) =>
        shows.values.filter(_.files.map(_.libraryName).contains(name)).foreach{ show =>
          val updated = show.copy(files = show.files.filter(_.libraryName != name))
          if (updated.files.isEmpty) {
            bus.publish(ShowDeleted(show.id))
            shows -= show.id
          } else {
            bus.publish(ShowAdded(updated))
            shows += show.id -> updated
          }
        }
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
            val initial = Show(
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
            val show = shows.get(head.id) match {
              case Some(s) => initial.withFiles(s.files)
              case None => initial
            }
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
            bus.publish(ShowAdded(show))
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
          bus.publish(ShowUpdate(cleanedDetails))
          shows += show.id -> show.withDetails(cleanedDetails)
        }
      case (TVEpisodeContext(id, seasonNumber, episodeNumber), episode: Episode) =>
        shows.get(id).foreach { show =>
          val cleanedEpisode = episode.copy(
            crew = episode.crew.filter(p => p.job == "Director" || p.job == "Writer")
          )
          logger.info(s"Received episode details for show: ${show.name} - $seasonNumber/$episodeNumber")
          shows += show.id -> show.withEpisode(cleanedEpisode) // TODO check if this episodes exists already
          bus.publish(ShowAdded(show.withEpisode(cleanedEpisode))) // TODO publish only an update
        }
    }
  }), "shows")

  override def receive: Receive = {

    // Events
    case FileAdded(file) =>
      Seq(file)
        .filter(!_.isDirectory)
        .filter(!_.name.matches("(?i).*sample.*"))
        .map(extractMeta)
        .foreach {
          case meta: MovieMetadata =>
            moviesActor ! meta
          case meta: TVEpisodeMetadata =>
            showsActor ! meta
          case UnknownMetadata(_) => // TODO
        }

    case fileDeleted: FileDeleted =>
      moviesActor ! fileDeleted
      showsActor ! fileDeleted

    case libraryDeleted: LibraryDeleted =>
      moviesActor ! libraryDeleted
      showsActor ! libraryDeleted

    // TMDB responses
    case (Success(HttpResponse(StatusCodes.OK, _, entity, _)), requestContext: Context) =>
      requestContext match {
        case searchContext: MovieSearchContext =>
          parseEntity[tmdb.SearchMovies](entity).foreach(moviesActor ! (searchContext, _))
        case _: MovieDetailsContext =>
          parseEntity[Movie.Details](entity).foreach(moviesActor ! _)
        case searchContext: TVSearchContext =>
          parseEntity[tmdb.SearchTVShows](entity).foreach(showsActor ! (searchContext, _))
        case _: TVDetailsContext =>
          parseEntity[Show.Details](entity).foreach(showsActor ! _)
        case episodeContext: TVEpisodeContext =>
          parseEntity[Episode](entity).foreach(showsActor ! (episodeContext, _))
      }

    case (Success(HttpResponse(StatusCodes.TooManyRequests, headers, entity, _)), requestContext: Context) =>
      entity.discardBytes()
      val retryIn = headers
        .find(_.lowercaseName == "retry-after")
        .flatMap(header => Try(header.value.toInt).toOption)
        .getOrElse(1)
      logger.info(s"Rescheduling request in $retryIn seconds: " + requestContext.log)
      context.system.scheduler.scheduleOnce(FiniteDuration(retryIn, SECONDS))(tmdbActor ! createRequest(requestContext))

    case (Success(HttpResponse(code, _, entity, _)), ct) =>
      entity.discardBytes()
      logger.warning(s"Unhandled response: $code, $ct")

    case (Failure(exception), requestContext) =>
      logger.error("An error occurred for context: " + requestContext, exception)

    // Actor API
    case GetConfig => sender() ! tmdbConf
    case GetMovies => moviesActor forward GetMovies
    case GetMovie(id) => moviesActor forward GetMovie(id)
    case GetShows => showsActor forward GetShows
    case GetShow(id) => showsActor forward GetShow(id)

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
      if (lower.endsWith("avi"))
        tags +:= "avi"
      if (lower.endsWith("mov"))
        tags +:= "mov"
      if (lower.contains("480p"))
        tags +:= "480p"
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
    case MovieSearchContext(name, year) =>
      tmdb.SearchMovies.get(api_key, name, year = Some(year), primary_release_year = Some(year))
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
      val f = Future.fromTry(Try(body.utf8String.parseJson.convertTo[T]))
      f.failed.foreach { exception =>
        logger.error(exception, "Error parsing response entity: " + body.utf8String)
      }
      f
    }
  }

  override def postStop(): Unit = {
    poolKillSwitch.shutdown()
    connectionPool.shutdown()
  }

}
