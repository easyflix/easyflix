package net.creasource.webflix.actors

import akka.actor.{Actor, ActorRef, PoisonPill, Props, Stash, Terminated}
import akka.event.Logging
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{HttpRequest, HttpResponse, StatusCodes}
import akka.stream.OverflowStrategy
import akka.stream.scaladsl.{Flow, Keep, Sink, Source}
import akka.util.ByteString
import akka.{Done, NotUsed}
import net.creasource.Application
import net.creasource.tmdb.{Configuration, MovieDetails, SearchMovies}
import net.creasource.webflix.events.{FileAdded, MovieAdded, MovieDetailsAdded}
import net.creasource.webflix.{LibraryFile, Movie}
import spray.json._

import scala.concurrent.Future
import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}

object TMDBActor {

  case object GetConfig
  case object GetMovies
  case object GetTVShows
  case class GetMovieDetails(id: Int)

  def props()(implicit application: Application): Props = Props(new TMDBActor)

}

class TMDBActor()(implicit application: Application) extends Actor with Stash {

  import TMDBActor._
  import application.{materializer, system}
  import context.dispatcher

  val logger = Logging(context.system, this)

  sealed trait Context
  case class MovieId(id: Int) extends Context
  case class MovieMetadata(name: String, year: Int, rest: String, file: LibraryFile) extends Context
  case class ShowMetadata(name: String, episode: String, rest: String, file: LibraryFile) extends Context
  case object ConfigurationContext extends Context

  private val api_key = application.config.getString("tmdb.api-key")

  var requests: Map[ActorRef, Int] = Map.empty

  application.bus.subscribe(self, classOf[FileAdded])

  val poolClientFlow: Flow[
      (HttpRequest, Context),
      (Try[HttpResponse], Context),
      Http.HostConnectionPool
  ] =
    Flow[(HttpRequest, Context)].throttle(40, 11.seconds)
      .viaMat(Http().cachedHostConnectionPoolHttps[Context]("api.themoviedb.org"))(Keep.right)

  val searchSink: Sink[LibraryFile, Http.HostConnectionPool] = {
    Flow[LibraryFile]
      .filter(!_.isDirectory)
      .filter(!_.name.matches("(?i).*sample.*"))
      .map(extractMeta) // Option[Metadata]
      /*.alsoTo(Sink.foreach {
        case (None, file) => TODO do something when no metadata has been extracted
      })*/
      .collect { case Some(meta) => meta } // Metadata
      .map(createRequest) // Option[(HttpRequest, Metadata)]
      .collect { case Some(req) => req } // (HttpRequest, Metadata)
      .viaMat(poolClientFlow)(Keep.right) // (Try[HttpResponse], Metadata) + mat
      /*.alsoTo(Sink.foreach{ // TODO do something when response is a failure
        case (Success(value), file) =>
        case (Failure(e), file) =>
      })*/
      .collect { case (Success(value), file) => (value, file) } // (HttpResponse, Metadata)
      .mapAsync(4)(parseSearchResponse.tupled) // (Option[SearchMovies], Metadata)
      .collect { case (Some(searchMovies), metadata) => (searchMovies, metadata) } // (SearchMovies, Metadata)
      .to(Sink.actorRef(self, Done))
  }

  val movieDetailsSink: Sink[Movie, NotUsed] =
    Flow[Movie]
      .map(_.id)
      .map(id => HttpRequest(uri = MovieDetails.get(id, api_key)) -> MovieId(id))
      .via(poolClientFlow)
      .collect { case (Success(value), file) => (value, file) }
      .mapAsync(4)(parseMovieDetailsResponse.tupled)
      .collect { case Some(movieDetails) => movieDetails }
      .to(Sink.actorRef(self, Done))

  val (searchActor, connectionPool) =
    Source.actorRef(10000, OverflowStrategy.dropNew)
      .toMat(searchSink)(Keep.both)
      .run()

  val movieDetailsActor: ActorRef = Source.actorRef(10000, OverflowStrategy.dropNew)
      .toMat(movieDetailsSink)(Keep.left)
      .run()

  /**
    * Load configuration
    */
  Source.single((HttpRequest(uri = Configuration.get(api_key)), ConfigurationContext))
    .via(poolClientFlow)
    .runWith(Sink.foreach {
      case (Success(HttpResponse(StatusCodes.OK, _, entity, _)), _) =>
        entity.dataBytes.runFold(ByteString(""))(_ ++ _).foreach { body =>
          self ! body.utf8String.parseJson.convertTo[Configuration]
        }
      case (Success(response: HttpResponse), _) =>
        logger.error("Received a non-200 response for the configuration request: " + response.status)
        response.discardEntityBytes()
      case (Failure(exception: Exception), _) =>
        logger.error(exception, "Could not load configuration.")
    })

  override def receive: Receive = loading

  def loading: Receive = {
    case config @ Configuration(_, _) =>
      unstashAll()
      logger.info("Configuration loaded successfully")
      context.become(behavior(config, Seq.empty, Seq.empty))
    case _ =>
      stash()
  }

  def behavior(config: Configuration, movies: Seq[Movie], moviesDetails: Seq[MovieDetails]): Receive = {

    case FileAdded(file) =>
      if (!movies.map(_.path).contains(file.path))
        searchActor ! file

    case GetMovies => sender() ! movies

    case GetConfig => sender() ! config

    case (search: SearchMovies, metadata: MovieMetadata) =>
      if (search.total_results > 0) {
        val head = search.results.head
        val movie = Movie(head.id, head.title, head.poster_path, head.backdrop_path, head.overview, metadata.file.path)
        movieDetailsActor ! movie
        application.bus.publish(MovieAdded(movie))
        context become behavior(config, movies :+ movie, moviesDetails)
      }

    case movieDetails: MovieDetails =>
      context become behavior(config, movies, moviesDetails :+ movieDetails)
      application.bus.publish(MovieDetailsAdded(movieDetails))
      requests.find(_._2 == movieDetails.id).foreach(_._1 ! movieDetails)

    case GetMovieDetails(id) =>
      moviesDetails.find(_.id == id) match {
        case Some(movieDetails) =>
          sender() ! movieDetails
        case None =>
          context.watch(sender())
          requests += (sender() -> id)
      }

    case Terminated(actorRef) => requests -= actorRef

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
      case ShowMetadata(_, _, _, _) => None
      case MovieMetadata(name, year, _, _) => Some(SearchMovies.get(api_key, name, year = Some(year)))
      case _ => None
    }
    uriOpt.map(uri => (HttpRequest(uri = uri), context))
  }

  def parseSearchResponse: (HttpResponse, Context) => Future[(Option[SearchMovies], Context)] = (response, metadata) => {
    response match {
      case HttpResponse(StatusCodes.OK, _, entity, _) =>
        entity.dataBytes.runFold(ByteString(""))(_ ++ _).map {
          body => parseEntity(body).toOption -> metadata
        }
      case resp @ HttpResponse(_, _, _, _) =>
        resp.discardEntityBytes()
        Future.successful(None -> metadata)
    }
  }

  def parseMovieDetailsResponse: (HttpResponse, Context) => Future[Option[MovieDetails]] = (response, _) => {
    response match {
      case HttpResponse(StatusCodes.OK, _, entity, _) =>
        entity.dataBytes.runFold(ByteString(""))(_ ++ _).map {
          body => Try(body.utf8String.parseJson.convertTo[MovieDetails]).toOption
        }
      case resp @ HttpResponse(_, _, _, _) =>
        resp.discardEntityBytes()
        Future.successful(None)
    }
  }

  def parseEntity(entity: ByteString): Try[SearchMovies] = {
    Try(entity.utf8String.parseJson.convertTo[SearchMovies])
  }

  override def postStop(): Unit = {
    searchActor ! PoisonPill
    connectionPool.shutdown()
  }

}
