package net.creasource.webflix.actors

import akka.Done
import akka.actor.{Actor, PoisonPill, Props}
import akka.event.Logging
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{HttpRequest, HttpResponse, StatusCodes}
import akka.stream.scaladsl.{Flow, Keep, Sink, Source}
import akka.stream.{KillSwitches, OverflowStrategy}
import akka.util.ByteString
import net.creasource.Application
import net.creasource.tmdb.SearchMovies
import net.creasource.webflix.events.{FileAdded, MovieAdded}
import net.creasource.webflix.{LibraryFile, Movie}

import scala.concurrent.duration._
import scala.concurrent.{Await, Future}
import scala.util.{Success, Try}

object TMDBActor {

  case object GetMovies
  case object GetTVShows

  def props()(implicit application: Application): Props = Props(new TMDBActor)

}

class TMDBActor()(implicit application: Application) extends Actor {

  import TMDBActor._
  import application.{materializer, system}

  val logger = Logging(context.system, this)

  sealed trait Metadata {
    val file: LibraryFile
  }
  case class MovieMetadata(name: String, year: Int, rest: String, file: LibraryFile) extends Metadata
  case class ShowMetadata(name: String, episode: String, rest: String, file: LibraryFile) extends Metadata

  private val api_key = application.config.getString("tmdb.api-key")

  application.bus.subscribe(self, classOf[FileAdded])

  val poolClientFlow: Flow[
      (HttpRequest, Metadata),
      (Try[HttpResponse], Metadata),
      Http.HostConnectionPool
  ] =
    Http().cachedHostConnectionPoolHttps[Metadata]("api.themoviedb.org")

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
      .via(Flow[(HttpRequest, Metadata)].throttle(40, 11.seconds)) // Throttle
      .viaMat(poolClientFlow)(Keep.right) // (Try[HttpResponse], Metadata) + mat
      /*.alsoTo(Sink.foreach{ // TODO do something when response is a failure
        case (Success(value), file) =>
        case (Failure(e), file) =>
      })*/
      .collect { case (Success(value), file) => (value, file) } // (HttpResponse, Metadata)
      .mapAsync(4)(parseResponse.tupled) // (Option[SearchMovies], Metadata)
      .collect { case (Some(searchMovies), metadata) => (searchMovies, metadata) } // (SearchMovies, Metadata)
      .to(Sink.actorRef(self, Done))
  }

  val ((searchActor, ks), connectionPool) =
    Source.actorRef(10000, OverflowStrategy.dropNew)
      .viaMat(KillSwitches.single)(Keep.both)
      .toMat(searchSink)(Keep.both)
      .run()

  override def receive: Receive = behavior(Seq.empty)

  def behavior(movies: Seq[Movie]): Receive = {

    case FileAdded(file) =>
      if (!file.isDirectory) {
        logger.info("New file received: " + file.name)
        searchActor ! file
      }

    case GetMovies => sender() ! movies

    case (search: SearchMovies, _: MovieMetadata) =>
      if (search.total_results > 0) {
        val head = search.results.head
        val movie = Movie(head.title, head.poster_path, head.backdrop_path, head.overview)
        application.bus.publish(MovieAdded(movie))
        context become behavior(movies :+ movie)
      }

  }

  def extractMeta(file: LibraryFile): Option[Metadata] = {
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

  def createRequest: Metadata => Option[(HttpRequest, Metadata)] = metadata => {
    val uriOpt = metadata match {
      case ShowMetadata(_, _, _, _) => None
      case MovieMetadata(name, year, _, _) => Some(SearchMovies.get(api_key, name, year = Some(year)))
    }
    uriOpt.map(uri => (HttpRequest(uri = uri), metadata))
  }

  def parseResponse: (HttpResponse, Metadata) => Future[(Option[SearchMovies], Metadata)] = (response, metadata) => {
    import application.system.dispatcher
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

  def parseEntity(entity: ByteString): Try[SearchMovies] = {
    import spray.json._
    Try(entity.utf8String.parseJson.convertTo[SearchMovies])
  }

  override def postStop(): Unit = {
    searchActor ! PoisonPill
    ks.shutdown()
    Await.result(connectionPool.shutdown(), 10.seconds)
  }

}
