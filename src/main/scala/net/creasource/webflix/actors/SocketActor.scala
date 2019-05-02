package net.creasource.webflix.actors

import akka.actor.{Actor, Props, Stash}
import akka.event.Logging
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.server.RouteResult.route2HandlerFlow
import akka.stream.ActorMaterializer
import akka.stream.scaladsl.{Sink, Source}
import net.creasource.Application
import net.creasource.json.{JsonMessage, JsonSupport}
import net.creasource.webflix.events.{FileAdded, LibraryUpdate}
import spray.json._

import scala.collection.immutable.Seq
import scala.concurrent.Future
import scala.concurrent.duration._

object SocketActor {
  def props(xhrRoutes: Route)(implicit materializer: ActorMaterializer, app: Application): Props = Props(new SocketActor(xhrRoutes))
}

/**
  * The Actor that receives socket messages as JsValue objects and sends back to the client through its parent.
  *
  * @param xhrRoutes XHR routes that this socket can handle
  * @param materializer An actor materializer
  */
class SocketActor(xhrRoutes: Route)(implicit materializer: ActorMaterializer, app: Application) extends Actor with Stash with JsonSupport {

  import context.dispatcher

  private val logger = Logging(context.system, this)

  private val client = context.parent

  val askTimeout: akka.util.Timeout = 2.seconds

  app.bus.subscribe(self, classOf[FileAdded])
  app.bus.subscribe(self, classOf[LibraryUpdate])

  override def receive: Receive = {

    case FileAdded(file) => client ! JsonMessage("FileAdded", 0, file.toJson).toJson

    case LibraryUpdate(lib) => client ! JsonMessage("LibraryUpdate", 0, lib.toJson).toJson

    case value: JsValue =>
      handleMessages.applyOrElse(value, (v: JsValue) => logger.warning("Unhandled client Json message:\n{}", v.prettyPrint))

/*    case NewTracks(tracks) =>
      logger.debug("Received new tracks. Sending notification to client.")
      client ! JsonMessage("TracksAdded", 0, tracks.toJson).toJson

    case DeletedTracks(tracks) =>
      logger.debug("Tracks have been deleted. Sending notification to client.")
      client ! JsonMessage("TracksDeleted", 0, tracks.toJson).toJson

    case a @ Notify(message) =>
      implicit val writer: JsonWriter[Any] = a.writer
      logger.debug("Notifying client: " + message.toJson)
      client ! JsonMessage("Notify", 0, message.toJson).toJson*/

    case value => logger.error("Unhandled message: {}", value.toString)

  }

  def handleMessages: PartialFunction[JsValue, Unit] = {

    case JsonMessage("HttpRequest", id, entity) =>
      val f = toHttpResponse(entity.convertTo[HttpRequest])
      f foreach { response =>
        client ! JsonMessage("HttpResponse", id, response.toJson).toJson
      }
      f.failed foreach { failure =>
        client ! JsonMessage("HttpResponse", id, JsObject(
          "status" -> 500.toJson,
          "statusText" -> "Internal Server Error".toJson,
          "entity" -> failure.getMessage.toJson
        )).toJson
      }

/*    case JsonMessage("ScanLibrary", id, _) =>
      logger.info("Scanning library")
      val scanFuture: Future[Done] = for {
        f1 <- (app.libraryActor ? ScanLibrary)(askTimeout).mapTo[Source[Track, NotUsed]]
        f2 <- f1.watch(self)
                .groupedWithin(15, 100.milliseconds)
                .map(tracks => JsonMessage("TracksAdded", id, tracks.toJson).toJson)
                .runWith(Sink.foreach(client ! _))
      } yield f2
      scanFuture onComplete {
        case Success(Done) =>
          logger.info("Library scan succeeded")
          client ! JsonMessage("LibraryScanned", id, JsNull).toJson
        case Failure(t)    =>
          logger.error(t, "Library scan failed")
          client ! JsonMessage("LibraryScannedFailed", id, JsString(t.getMessage)).toJson
      }

    case JsonMessage("GetTracks", id, _) =>
      logger.info("Retrieving tracks")
      val f = (app.libraryActor ? GetTracks)(askTimeout).mapTo[Seq[Track]]
      f.foreach(tracks => {
        client ! JsonMessage("TracksTotal", id, tracks.length.toJson).toJson
        tracks.grouped(100).toSeq.foreach(group =>
          client ! JsonMessage("TracksAdded", id, group.toJson).toJson
        )
        client ! JsonMessage("TracksRetrieved", id, JsNull).toJson
      })*/

    case a @ JsonMessage(_, _, _) =>
      logger.warning("Unhandled JsonMessage: " + a.prettyPrint)

    case v: JsValue =>
      logger.warning("Unhandled JsValue message: " + v.prettyPrint)

  }

  val toHttpResponse: HttpRequest => Future[HttpResponse] = route2Response(xhrRoutes)

  def route2Response(route: Route)(implicit materializer: ActorMaterializer): HttpRequest => Future[HttpResponse] =
    request => route2HandlerFlow(route).runWith(Source.single[HttpRequest](request), Sink.head)._2

}

