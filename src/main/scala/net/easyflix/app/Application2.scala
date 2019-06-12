package net.easyflix.app
import akka.actor.{ActorRef, ActorSystem}
import akka.stream.ActorMaterializer
import cats.effect.{IO, Timer}
import com.typesafe.config.Config
import net.easyflix.actors.{LibrarySupervisor, TMDBActor}
import net.easyflix.events.ApplicationBus

import scala.concurrent.{ExecutionContext, Promise}
import scala.concurrent.duration._

class Application2 extends BaseApplication {

  implicit val timer: Timer[IO] = IO.timer(ExecutionContext.global)

  val createApplicationBus: IO[ApplicationBus] =
    IO.pure(new ApplicationBus)

  def createLibrariesActor(system: ActorSystem): IO[ActorRef] =
    IO { system.actorOf(LibrarySupervisor.props()(???), "libraries") }

  def createTmdbActor(system: ActorSystem): IO[ActorRef] =
    IO { system.actorOf(TMDBActor.props()(???), "tmdb") }

  def startServer: IO[ActorRef] = ???

  def waitForTermination: IO[Unit] = IO.sleep(10.seconds)

  override def initialize(config: Config, system: ActorSystem, mat: ActorMaterializer): IO[Unit] =
    for {
      _ <- IO(println("Initializing"))
      _ <- createApplicationBus
    } yield ()


  /*  def initialize(config: Config, system: ActorSystem, materializer: ActorMaterializer): IO[T]*/
  /*    for {
        _ <- createApplicationBus
        //_ <- createLibrariesActor(system)
        //_ <- createTmdbActor(system)
        // _ <- startServer
        //_ <- waitForTermination
        // _ <- IO.sleep(10.seconds)
      } yield ()*/

}
