package net.easyflix.app

import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import cats.data.IndexedStateT
import cats.effect.{CancelToken, IO}
import cats.implicits._
import com.typesafe.config.{Config, ConfigFactory}

import scala.concurrent.Promise

object BaseApplication {
  sealed trait State
  case class Started[T](stop: CancelToken[IO], resources: IO[T]) extends State
  case object Stopped extends State

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
      _ <- IO { println("Shutting down actor system") }
      _ <- IO { materializer.shutdown() }
      _ <- IO.fromFuture { IO(system.terminate()) }
    } yield ()

}

trait BaseApplication[T] {

  import BaseApplication._

  def acquire(config: Config, system: ActorSystem, mat: ActorMaterializer): IO[T]

  def release(resource: T): IO[Unit]

  def start: IndexedStateT[IO, Stopped.type, Started[T], IO[Unit]] = IndexedStateT { _ =>
    val resultPromise = Promise[Unit]()
    val resourcePromise = Promise[T]()
    val start: IO[Unit] =
      loadResources.bracket { case (c, s, m) =>
        for {
          t <- acquire(c, s, m).attempt
          _ <- IO.pure(t.fold(resourcePromise.failure, resourcePromise.success))
          _ <- IO.fromEither(t) *> IO.fromFuture(IO(resultPromise.future))
        } yield ()
      } {
        case (_, s, m) => shutdown(s, m)
      }
    val stop: IO[Unit] =
      IO { resultPromise.trySuccess(()) }.flatMap {
        case false => IO.fromFuture(IO.pure(resultPromise.future))
        case true  => IO.unit
      }
    val state = Started[T](stop, IO.fromFuture(IO(resourcePromise.future)))
    start.runAsync {
      case Left(throwable) => IO { resultPromise.failure(throwable) }
      case Right(_) => IO.unit
    }.map(_ => (state, IO.fromFuture(IO(resultPromise.future)))).toIO
  }

  def stop: IndexedStateT[IO, Started[T], Stopped.type, Unit] = IndexedStateT {
    case Started(stop, t) => t.flatMap(release) *> stop.map(_ => (Stopped, ()))
  }

  def run(io: T => IO[Unit]): IndexedStateT[IO, Started[T], Started[T], Either[Throwable, Unit]] = IndexedStateT {
    case s @ Started(_, t) => t.flatMap(io).attempt.map(e => (s, e))
  }

}
