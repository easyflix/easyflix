package net.easyflix.app

import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import cats.data.IndexedStateT
import cats.effect.{CancelToken, IO}
import com.typesafe.config.{Config, ConfigFactory}
import net.easyflix.app.BaseApplication.{Started, Stopped}

import scala.concurrent.Promise

object BaseApplication {
  sealed trait State
  case class Started(cancel: CancelToken[IO]) extends State
  case object Stopped extends State
}

trait BaseApplication {

  val loadConfig: IO[Config] =
    IO { ConfigFactory.load().getConfig("easyflix") }

  def createSystem(config: Config): IO[ActorSystem] =
    IO { ActorSystem("Easyflix", config) }

  def createMaterializer(system: ActorSystem): IO[ActorMaterializer] =
    IO { ActorMaterializer()(system) }

  val loadResources: IO[(Config, ActorSystem, ActorMaterializer)] = {
    for {
      _ <- IO(println("Creating Actor System"))
      config <- loadConfig
      system <- createSystem(config)
      materializer <- createMaterializer(system)
    } yield (config, system, materializer)
  }

  def shutdown(system: ActorSystem, materializer: ActorMaterializer): IO[Unit] =
    for {
      _ <- IO { println("Shutting down") }
      _ <- IO { materializer.shutdown() }
      _ <- IO.fromFuture { IO(system.terminate()) }
    } yield ()

  def initialize(config: Config, system: ActorSystem, mat: ActorMaterializer): IO[Unit]

  def start: IndexedStateT[IO, Stopped.type, Started, Promise[Unit]] = IndexedStateT { _ =>
    val promise = Promise[Unit]()
    val start: IO[Unit] = loadResources.bracket { case (c, s, m) =>
      for {
        _ <- initialize(c, s, m)
        _ <- IO.fromFuture(IO(promise.future))
      } yield ()
    } {
      case (_, s, m) => shutdown(s, m)
    }
    val stop: IO[Unit] =
      IO { promise.trySuccess(()) }.flatMap {
        case false => IO.fromFuture(IO.pure(promise.future))
        case true  => IO.unit
      }
    start.runAsync {
      case Left(throwable) => IO { promise.failure(throwable) }
      case Right(_) => IO.unit
    }.map(_ => (Started(stop), promise)).toIO
  }

  def stop: IndexedStateT[IO, Started, Stopped.type, Unit] = IndexedStateT {
    case Started(cancel) => cancel.map(_ => (Stopped, ()))
  }

  def run(io: IO[Unit]): IndexedStateT[IO, Started, Started, Unit] = IndexedStateT {
    case s @ Started(_) => io.map(_ => (s, ()))
  }

}
