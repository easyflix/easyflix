package net.creasource.webflix.actors

import akka.Done
import akka.actor.{Actor, ActorRef, PoisonPill, Props, Stash, Terminated}
import akka.event.Logging
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{HttpRequest, HttpResponse, ResponseEntity, StatusCodes}
import akka.stream.OverflowStrategy
import akka.stream.scaladsl.{Flow, Keep, Sink, Source}
import akka.util.ByteString
import net.creasource.Application
import net.creasource.tmdb.{Configuration, MovieDetails, SearchMovies}
import net.creasource.webflix.events.{FileAdded, MovieAdded}
import net.creasource.webflix.{LibraryFile, Movie, MovieExt}
import spray.json._

import scala.concurrent.Future
import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}

object TMDBActor {

  case object GetConfig
  case object GetMovies
  case object GetTVShows
  case class GetMovieExt(id: Int)

  def props()(implicit application: Application): Props = Props(new TMDBActor)

  sealed trait Context
  case object ConfigurationContext extends Context

  sealed trait RuntimeContext extends Context
  case class MovieId(id: Int) extends RuntimeContext
  case class MovieMetadata(name: String, year: Int, rest: String, file: LibraryFile) extends RuntimeContext
  case class ShowMetadata(name: String, episode: String, rest: String, file: LibraryFile) extends RuntimeContext

}

class TMDBActor()(implicit application: Application) extends Actor with Stash {

  import TMDBActor._
  import application.{materializer, system}
  import context.dispatcher

  val logger = Logging(context.system, this)

  private val api_key = application.config.getString("tmdb.api-key")

  var requests: Map[ActorRef, Int] = Map.empty

  application.bus.subscribe(self, classOf[FileAdded])

  val (tmdb: ActorRef, connectionPool: Http.HostConnectionPool) =
    Source.actorRef(10000, OverflowStrategy.dropNew)
      .via(Flow[(HttpRequest, Context)].throttle(40, 10.seconds))
      .viaMat(Http().cachedHostConnectionPoolHttps[Context]("api.themoviedb.org"))(Keep.both)
      .log("TMDB error")
      .to(Sink.actorRef(self, Done))
      .run()

  def search(file: LibraryFile): Unit = {
    Seq(file)
      .filter(!_.isDirectory)
      .filter(!_.name.matches("(?i).*sample.*"))
      .map(extractMeta)
      .collect { case Some(meta) => meta }
      .map(createRequest)
      .collect { case Some(reqContext) => reqContext }
      .foreach(tmdb ! _)
  }

  def requestDetails(movie: Movie): Unit = {
    Seq(MovieId(movie.id))
      .map(createRequest)
      .collect { case Some(reqContext) => reqContext }
      .foreach(tmdb ! _)
  }

  /**
    * Load configuration
    */
  Seq(ConfigurationContext)
    .map(createRequest)
    .collect{ case Some(req) => req }
    .foreach(tmdb ! _)

  override def receive: Receive = loading

  def loading: Receive = {

    case (Success(HttpResponse(StatusCodes.OK, _, entity, _)), ConfigurationContext) =>
      parseEntity[Configuration](entity).foreach(self ! _)

    case (Success(HttpResponse(_, _, entity, _)), ConfigurationContext) =>
      entity.discardBytes()
      logger.error("Got a non-200 response for configuration request.")
      self ! PoisonPill // TODO

    case config @ Configuration(_, _) =>
      unstashAll()
      logger.info("Configuration loaded successfully")
      context.become(behavior(config, Seq.empty, Seq.empty))

    case _ => stash()
  }

  def behavior(config: Configuration, movies: Seq[Movie], movieExts: Seq[MovieExt]): Receive = {

    // Events
    case FileAdded(file) =>
      if (!movies.map(_.file.path).contains(file.path))
        search(file)

    // TMDB responses
    case (Success(HttpResponse(StatusCodes.OK, _, entity, _)), requestContext: RuntimeContext) =>
      requestContext match {
        case MovieMetadata(_, _, _, file) =>
          parseEntity[SearchMovies](entity).foreach { search =>
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
                file
              )
            }
          }
        case ShowMetadata(_, _, _, _) =>
          entity.discardBytes() // TODO
        case MovieId(_) =>
          val f = parseEntity[MovieExt](entity)
          f.failed.foreach(logger.error(_, "error!"))
          f.foreach(self ! _)
      }

    case (Success(HttpResponse(StatusCodes.TooManyRequests, headers, entity, _)), requestContext: RuntimeContext) =>
      entity.discardBytes()
      val retryIn = headers
        .find(_.lowercaseName == "retry-after")
        .flatMap(header => Try(header.value.toInt).toOption)
        .getOrElse(1)
      requestContext match {
        case MovieMetadata(_, _, _, file) =>
          logger.info(s"Rescheduling in $retryIn seconds: " + file.name)
          system.scheduler.scheduleOnce(FiniteDuration(retryIn, SECONDS))(search(file))
        case ShowMetadata(_, _, _, _) => // TODO
        case MovieId(id) =>
          logger.info(s"Rescheduling in $retryIn seconds: " + id)
          system.scheduler.scheduleOnce(FiniteDuration(retryIn, SECONDS)) {
            movies.find(_.id == id).foreach(requestDetails)
          }
      }

    case (Success(HttpResponse(_, _, entity, _)), _) =>
      entity.discardBytes()
      logger.warning("Unhandled response")

    case (Failure(exception), runtimeContext) =>
      logger.error("An error occurred for context: " + runtimeContext, exception)

    // Requests
    case GetConfig => sender() ! config

    case GetMovies => sender() ! movies

    case GetMovieExt(id) =>
      movieExts.find(_.id == id) match {
        case Some(details) =>
          sender() ! details
        case None =>
          context.watch(sender())
          requests += (sender() -> id)
      }

    // Internal
    case movie: Movie =>
      logger.info("Received search results for: " + movie.title)
      requestDetails(movie)
      application.bus.publish(MovieAdded(movie))
      context become behavior(config, movies :+ movie, movieExts)

    case detailsExt: MovieExt =>
      val details = detailsExt.copy(
        credits = detailsExt.credits.copy(
          crew = detailsExt.credits.crew.filter(_.job == "Director"),
          cast = detailsExt.credits.cast.take(7)
        )
      )
      logger.info("Received movie details for: " + details.title)
      requests.find(_._2 == details.id).foreach(_._1 ! details)
      context become behavior(config, movies, movieExts :+ details)

    case Terminated(actorRef) => requests -= actorRef

  }

  def parseEntity[T](entity: ResponseEntity)(implicit reader: RootJsonReader[T]): Future[T] = {
    entity.dataBytes.runFold(ByteString(""))(_ ++ _).flatMap { body =>
      Future(body.utf8String.parseJson.convertTo[T])
    }
  }

  def extractMeta(file: LibraryFile): Option[Context] = {
    val show = """^(.+)([Ss]\d{1,2}[Ee]\d{1,2})(.*)$""".r
    val movie = """^(.+)((19|20)\d{2})(.*)$""".r

    def clean(name: String): String = name
      .replaceAll("\\.", " ")
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replaceAll("""\(|\)""", "")
      .replaceAll("""\[|\]""", "")
      .replaceAll("[ ]+", " ")

    clean(file.name) match {
      case show(title, episode, rest) => Some(ShowMetadata(title.trim, episode, rest, file))
      case movie(title, year, _, rest) => Some(MovieMetadata(title.trim, year.toInt, rest, file))
      case _ => None
    }
  }

  def createRequest: Context => Option[(HttpRequest, Context)] = context => {
    val uriOpt = context match {
      case ShowMetadata(_, _, _, _) =>
        None // TODO
      case MovieMetadata(name, year, _, _) =>
        Some(SearchMovies.get(api_key, name, year = Some(year)))
      case MovieId(id) =>
        Some(MovieDetails.get(id, api_key, append_to_response = Some("credits")))
      case ConfigurationContext =>
        Some(Configuration.get(api_key))
    }
    uriOpt.map(uri => (HttpRequest(uri = uri), context))
  }

  override def postStop(): Unit = {
    connectionPool.shutdown()
  }

}
