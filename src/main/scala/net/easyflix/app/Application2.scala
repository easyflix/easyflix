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
import org.slf4j.Logger

import scala.concurrent.duration._

object Application2 extends BaseApplication[(Logger, SharedKillSwitch, Http.ServerBinding)] {

  def createSocketProps(conf: Config, bus: ApplicationBus, apiRoute: Route, mat: ActorMaterializer): IO[Props] =
    IO {
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

  def startServer(
      host: String,
      port: Int,
      routes: Route)(implicit sys: ActorSystem, mat: ActorMaterializer): IO[Http.ServerBinding] =
    IO.fromFuture(IO(Http().bindAndHandle(Route.handlerFlow(routes), host, port)))

  override def acquire(
      log: Logger,
      conf: Config,
      sys: ActorSystem,
      mat: ActorMaterializer): IO[(Logger, SharedKillSwitch, Http.ServerBinding)] =
    for {
         _ <- IO(log.info("Creating top actors and routes"))
       bus <- createApplicationBus
        sk <- createSocketKillSwitch
        ss <- createSocketSupervisor(sys)
      libs <- createLibrariesActor(bus, sys, mat)
      tmdb <- createTmdbActor(bus, conf, sys, mat)
       api <- createApiRoute(libs, tmdb)
       vid <- createVideosRoute(libs)
        sp <- createSocketProps(conf, bus, api, mat)
     route <- createRoute(conf, api, vid, ss, sp, sk)
         _ <- IO(log.info("Starting server"))
       hsb <- startServer("0.0.0.0", 8081, route)(sys, mat)
         _ <- IO(log.info("Server online at http://127.0.0.1:8081"))
    } yield (log, sk, hsb)

  override def release: ((Logger, SharedKillSwitch, Http.ServerBinding)) => IO[Unit] = { case (log, ks, hsb) =>
    for {
      _ <- IO(log.info("Stopping server"))
      _ <- IO.fromFuture(IO(hsb.unbind())) // Unbind = accept no new connections
      _ <- IO(ks.shutdown())
      _ <- IO.fromFuture(IO(hsb.terminate(10.seconds)))
    } yield ()
  }
}
