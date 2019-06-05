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
import net.creasource.webflix.events._
import pdi.jwt.{JwtAlgorithm, JwtSprayJson}
import spray.json._

import scala.concurrent.Future
import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}

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

  private val key = app.config.getString("auth.key")
  private val algo = JwtAlgorithm.HS256

  private val classMap: Map[String, Class[_]] = Map(
    "FileAdded"     -> classOf[FileAdded],
    "LibraryUpdate" -> classOf[LibraryUpdate],
    "MovieAdded"    -> classOf[MovieAdded],
    "MovieDeleted"  -> classOf[MovieDeleted],
    "MovieUpdate"   -> classOf[MovieUpdate],
    "ShowAdded"     -> classOf[ShowAdded],
    "ShowDeleted"   -> classOf[ShowDeleted],
    "ShowUpdate"    -> classOf[ShowUpdate]
  )

  private var subscriptions: Map[String, Int] = Map.empty

  app.system.scheduler.scheduleOnce(3.seconds, self, 'timeout)

  override def receive: Receive = authenticating

  def authenticating: Receive = {

    case value: JsValue => value match {
      case JsonMessage("Authorization", 0, JsString(token)) =>
        JwtSprayJson.decodeJson(token, key, Seq(algo)) match {
          case Success(_) =>
            context.become(behavior)
          case Failure(exception) =>
            logger.warning("Socket authentication failed! {}", exception.getMessage)
            context.stop(self)
        }
      case v =>
        logger.warning("Received unknown message instead of Authorization: {}", v.prettyPrint)
        context.stop(self)
    }

    case 'timeout =>
      logger.warning("Authentication timeout! Stopping Socket Actor.")
      context.stop(self)

  }

  def behavior: Receive = {

    case 'timeout => // ignore

    case FileAdded(file) =>     client ! JsonMessage("FileAdded", 0, file.toJson).toJson
    case LibraryUpdate(lib) =>  client ! JsonMessage("LibraryUpdate", 0, lib.toJson).toJson
    case MovieAdded(movie) =>   client ! JsonMessage("MovieAdded", 0, movie.toJson).toJson
    case MovieDeleted(id) =>    client ! JsonMessage("MovieDeleted", 0, id.toJson).toJson
    case MovieUpdate(update) => client ! JsonMessage("MovieUpdate", 0, update.toJson).toJson
    case ShowAdded(show) =>     client ! JsonMessage("ShowAdded", 0, show.toJson).toJson
    case ShowDeleted(id) =>     client ! JsonMessage("ShowDeleted", 0, id.toJson).toJson
    case ShowUpdate(update) =>  client ! JsonMessage("ShowUpdate", 0, update.toJson).toJson

    // Client sent messages
    case value: JsValue if sender() == client => handleMessage(value)

    case value => logger.error("Unhandled message: {}", value.toString)

  }

  def handleMessage: JsValue => Unit = {

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

    case JsonMessage("Subscribe", 0, JsString(channel)) =>
      subscriptions.get(channel) match {
        case Some(subscription) =>
          subscriptions += channel -> (subscription + 1)
        case None =>
          Try {
            app.bus.subscribe(self, classMap(channel))
            subscriptions += channel -> 1
          }
      }

    case JsonMessage("Unsubscribe", 0, JsString(channel)) =>
      subscriptions.get(channel) match {
        case Some(1) =>
          Try {
            app.bus.unsubscribe(self, classMap(channel))
            subscriptions -= channel
          }
        case Some(value) =>
          subscriptions += channel -> (value - 1)
        case None => // do nothing
      }

    case a @ JsonMessage(_, _, _) =>
      logger.warning("Unhandled JsonMessage: " + a.prettyPrint)

    case v: JsValue =>
      logger.warning("Unhandled JsValue message: " + v.prettyPrint)

  }

  val toHttpResponse: HttpRequest => Future[HttpResponse] = route2Response(xhrRoutes)

  def route2Response(route: Route)(implicit materializer: ActorMaterializer): HttpRequest => Future[HttpResponse] =
    request => route2HandlerFlow(route).runWith(Source.single[HttpRequest](request), Sink.head)._2

}

