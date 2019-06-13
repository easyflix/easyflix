package net.easyflix.app
import akka.actor.{ActorRef, ActorSystem, Props}
import akka.http.scaladsl.Http
import akka.http.scaladsl.server.Directives.pathPrefix
import akka.http.scaladsl.server.Route
import akka.stream.{ActorMaterializer, KillSwitches, SharedKillSwitch}
import cats.effect.IO
import com.typesafe.config.Config
import net.easyflix.actors.{LibrarySupervisor, SocketActor, TMDBActor}
import net.easyflix.events.ApplicationBus
import net.easyflix.http.actors.{SocketSinkActor, SocketSinkSupervisor}
import net.easyflix.routes.Routes

import scala.concurrent.duration._

object Application2 extends BaseApplication[(SharedKillSwitch, Http.ServerBinding)] {

  def createSocketProps(conf: Config, bus: ApplicationBus, apiRoute: Route, mat: ActorMaterializer): IO[Props] = IO {
    val socketActorProps: Props = SocketActor.props(pathPrefix("api")(Route.seal(apiRoute)), bus, conf)(mat)
    SocketSinkActor.props(socketActorProps)(mat)
  }

  def createVideosRoute(libs: ActorRef): IO[Route] =
    IO { Routes.createVideosRoute(libs) }

  def createApiRoute(
      libs: ActorRef,
      tmdb: ActorRef): IO[Route] =
    IO { Routes.createApiRoute(libs, tmdb) }

  def createRoute(
      conf: Config,
      api: Route,
      vid: Route,
      ss: ActorRef,
      sp: Props,
      sk: SharedKillSwitch): IO[Route] =
    IO { Routes.createRoute(conf, api, vid, ss, sp, sk) }

  val createSocketKillSwitch: IO[SharedKillSwitch] =
    IO.pure(KillSwitches.shared("sockets"))

  val createApplicationBus: IO[ApplicationBus] =
    IO.pure(new ApplicationBus)

  def createSocketSupervisor(sys: ActorSystem): IO[ActorRef] =
    IO { sys.actorOf(SocketSinkSupervisor.props(), "sockets") }

  def createLibrariesActor(bus: ApplicationBus, sys: ActorSystem, mat: ActorMaterializer): IO[ActorRef] =
    IO { sys.actorOf(LibrarySupervisor.props(bus)(mat), "libraries") }

  def createTmdbActor(bus: ApplicationBus, conf: Config, sys: ActorSystem, mat: ActorMaterializer): IO[ActorRef] =
    IO { sys.actorOf(TMDBActor.props(bus, conf)(mat), "tmdb") }

  def startServer(host: String, port: Int, routes: Route)(implicit sys: ActorSystem, mat: ActorMaterializer)
      : IO[Http.ServerBinding] =
    IO.fromFuture(IO(Http().bindAndHandle(Route.handlerFlow(routes), host, port)))

  override def acquire(conf: Config, sys: ActorSystem, mat: ActorMaterializer): IO[(SharedKillSwitch, Http.ServerBinding)] =
    for {
         _ <- IO(println("Creating top actors and routes"))
       bus <- createApplicationBus
        sk <- createSocketKillSwitch
        ss <- createSocketSupervisor(sys)
      libs <- createLibrariesActor(bus, sys, mat)
      tmdb <- createTmdbActor(bus, conf, sys, mat)
       api <- createApiRoute(libs, tmdb)
       vid <- createVideosRoute(libs)
        sp <- createSocketProps(conf, bus, api, mat)
     route <- createRoute(conf, api, vid, ss, sp, sk)
         _ <- IO(println("Starting server"))
       hsb <- startServer("0.0.0.0", 8081, route)(sys, mat)
    } yield (sk, hsb)

  override def release: ((SharedKillSwitch, Http.ServerBinding)) => IO[Unit] = { case (ks, hsb) =>
    for {
      _ <- IO(println("Stopping server"))
      _ <- IO.fromFuture(IO(hsb.unbind())) // Unbind = accept no new connections
      _ <- IO(ks.shutdown())
      _ <- IO.fromFuture(IO(hsb.terminate(10.seconds)))
    } yield ()
  }
}
