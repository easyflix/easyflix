package net.easyflix

import akka.actor.{ActorSystem, Props}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server._
import ch.megard.akka.http.cors.scaladsl.CorsDirectives.{cors, corsRejectionHandler}
import net.easyflix.http.{SPAWebServer, SocketWebServer}
import net.easyflix.actors.SocketActor
import net.easyflix.app.Application
import net.easyflix.routes.{APIRoutes, AuthRoutes, VideosRoutes}

import scala.io.StdIn

/**
  * The Main class that bootstraps the application.
  */
object Main extends App with SPAWebServer with SocketWebServer {

  implicit private val app: Application = new Application

  private val host = app.config.getString("http.host")
  private val port = app.config.getInt("http.port")
  private val stopOnReturn = app.config.getBoolean("http.stop-on-return")

  override implicit val system: ActorSystem = app.system

  private val authRoutes = new AuthRoutes(app.config)
  private val apiRoutes = new APIRoutes(app.libraries, app.tmdb)
  private val videosRoutes = new VideosRoutes(app.libraries)

  override val socketActorProps: Props =
    SocketActor.props(pathPrefix("api")(Route.seal(apiRoutes.routes)), app.bus, app.config)

  override val routes: Route = concat(
    handleRejections(corsRejectionHandler) {
      cors() {
        concat(
          pathPrefix("auth")(Route.seal(authRoutes.routes)),
          pathPrefix("api")(Route.seal(authRoutes.authenticated(apiRoutes.routes))),
        )
      }
    },
    pathPrefix("videos")(Route.seal(authRoutes.cookieAuthenticated(videosRoutes.routes))),
    pathPrefix("socket")(Route.seal(socketRoute)),
    super.routes
  )

  val startFuture = start(host, port)

  startFuture.failed.foreach(t => {
    stop().onComplete(_ => {
      system.log.error(t, "An error occurred while starting the server!")
      app.shutdown()
      System.exit(1)
    })
  })

  startFuture foreach { _ =>
    if (stopOnReturn) {
      system.log.info(s"Press RETURN to stop...")
      StdIn.readLine()
      stop().onComplete(_ => app.shutdown())
    }
  }

}
