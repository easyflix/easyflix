package net.easyflix.routes

import akka.actor.{ActorRef, Props, Status}
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.model.headers._
import akka.http.scaladsl.model.ws.Message
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.{RejectionHandler, Route}
import akka.pattern.ask
import akka.stream.scaladsl.{Flow, Keep, Sink, Source}
import akka.stream.{OverflowStrategy, SharedKillSwitch}
import ch.megard.akka.http.cors.scaladsl.CorsDirectives.{cors, corsRejectionHandler}
import com.typesafe.config.Config

import scala.concurrent.duration._

object Routes {

  val SPARoute: Route =
    encodeResponse {
      headerValueByName("Accept") { accept =>
        val serveIndexIfNotFound: RejectionHandler =
          RejectionHandler.newBuilder()
            .handleNotFound {
              if (accept.contains("text/html")) {
                respondWithHeader(RawHeader("Cache-Control", "no-cache")) { // TODO raw header
                  getFromResource("web/index.html")
                }
              } else {
                complete(StatusCodes.NotFound, "The requested resource could not be found.")
              }
            }
            .result()
        handleRejections(serveIndexIfNotFound) {
          respondWithHeader(RawHeader("Cache-Control", "max-age=86400")) { // TODO don't use raw header
            getFromResourceDirectory("web")
          }
        }
      }
    }

  def createApiRoute(
      librariesActor: ActorRef,
      tmdbActor: ActorRef): Route = {
    new APIRoutes(librariesActor, tmdbActor).routes
  }

  def createVideosRoute(librariesActor: ActorRef): Route = {
    new VideosRoutes(librariesActor).routes
  }

  def createRoute(
      config: Config,
      apiRoute: Route,
      videosRoute: Route,
      socketSupervisor: ActorRef,
      socketSinkProps: Props,
      socketKillSwitch: SharedKillSwitch): Route = {

    val authRoutes = new AuthRoutes(config)

    def socketFlow(sinkActor: ActorRef): Flow[Message, Message, Unit] = {
      Flow.fromSinkAndSourceMat(
        Sink.actorRef(sinkActor, Status.Success(())),
        Source.actorRef(1000, OverflowStrategy.fail)
      )(Keep.right).mapMaterializedValue(sourceActor => sinkActor ! sourceActor)
    }

    def socketRoute: Route =
      extractUpgradeToWebSocket { _ =>
        onSuccess((socketSupervisor ? socketSinkProps)(1.second).mapTo[ActorRef]) { sinkActor: ActorRef =>
          handleWebSocketMessages(socketFlow(sinkActor).via(socketKillSwitch.flow))
        }
      }

    concat(
      handleRejections(corsRejectionHandler) {
        cors() {
          concat(
            pathPrefix("auth")(Route.seal(authRoutes.routes)),
            pathPrefix("api")(Route.seal(authRoutes.authenticated(apiRoute))),
          )
        }
      },
      pathPrefix("videos")(Route.seal(authRoutes.cookieAuthenticated(videosRoute))),
      pathPrefix("socket")(Route.seal(socketRoute)),
      SPARoute
    )

  }

}
