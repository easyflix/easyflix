package net.easyflix.app
import akka.actor.{ActorRef, ActorSystem, Props}
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{HttpRequest, HttpResponse, StatusCodes}
import akka.http.scaladsl.server.Directives.pathPrefix
import akka.http.scaladsl.server.Route
import akka.stream.{ActorMaterializer, KillSwitches, SharedKillSwitch}
import akka.util.ByteString
import cats.effect.IO
import com.typesafe.config.Config
import net.easyflix.actors.{LibrarySupervisor, SocketActor, TMDBActor}
import net.easyflix.events.ApplicationBus
import net.easyflix.http.actors.{SocketSinkActor, SocketSinkSupervisor}
import net.easyflix.model.TMDBConfiguration
import net.easyflix.routes.Routes
import net.easyflix.tmdb
import org.slf4j.Logger

import scala.concurrent.duration._
import scala.concurrent.{ExecutionContext, Future}
import scala.util.{Failure, Success}

object ProdApplication extends Application[(Logger, SharedKillSwitch, Http.ServerBinding)] {

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

  def createTmdbActor(tmdbConf: TMDBConfiguration, bus: ApplicationBus, conf: Config, sys: ActorSystem, mat: ActorMaterializer): IO[ActorRef] =
    IO { sys.actorOf(TMDBActor.props(tmdbConf, bus, conf)(mat), "tmdb") }

  def startServer(
      host: String,
      port: Int,
      routes: Route)(implicit sys: ActorSystem, mat: ActorMaterializer): IO[Http.ServerBinding] =
    IO.fromFuture(IO(Http().bindAndHandle(Route.handlerFlow(routes), host, port)))

  def loadTmdbConfig(conf: Config)(implicit sys: ActorSystem, mat: ActorMaterializer): IO[TMDBConfiguration] = {
    import spray.json._
    import spray.json.DefaultJsonProtocol._
    implicit val ec: ExecutionContext = sys.dispatcher
    def makeRequest[A: RootJsonReader](uri: String): Future[A] =
      Http().singleRequest(HttpRequest(uri = s"https://api.themoviedb.org$uri")).transformWith {
        case Success(HttpResponse(StatusCodes.OK, _, entity, _)) =>
          entity.dataBytes.runFold(ByteString(""))(_ ++ _).map { body =>
            body.utf8String.parseJson.convertTo[A]
          }
        case Success(HttpResponse(code, _, entity, _)) =>
          entity.discardBytes()
          Future.failed(new Exception(s"Could not retrieve TMDB configuration. Response code is: $code"))
        case Failure(exception) => Future.failed(exception)
      }
    val getApiKey: IO[String] = IO { conf.getString("tmdb.api-key") }
    def loadConfiguration(key: String): IO[tmdb.Configuration] =
      IO.fromFuture(IO(makeRequest[tmdb.Configuration](tmdb.Configuration.get(key))))
    def loadLanguages(key: String): IO[tmdb.Configuration.Languages] =
      IO.fromFuture(IO(makeRequest[tmdb.Configuration.Languages](tmdb.Configuration.Language.get(key))))
    for {
      key <- getApiKey
      conf <- loadConfiguration(key)
      lang <- loadLanguages(key)
    } yield TMDBConfiguration(conf.images, lang)
  }

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
         _ <- IO(log.info("Loading TMDB configuration"))
        tc <- loadTmdbConfig(conf)(sys, mat)
      tmdb <- createTmdbActor(tc, bus, conf, sys, mat)
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
