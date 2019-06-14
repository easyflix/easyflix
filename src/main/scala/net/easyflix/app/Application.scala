package net.easyflix.app

import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import cats.data.IndexedStateT
import cats.effect.{CancelToken, IO}
import cats.implicits._
import com.typesafe.config.{Config, ConfigFactory}
import org.slf4j.{Logger, LoggerFactory}

import scala.concurrent.Promise

object Application {

  sealed trait State
  final case class Started[T](stop: CancelToken[IO], resources: IO[T]) extends State
  final case object Stopped extends State

}

trait Application[T] {

  import Application._

  def loadConfig: IO[Config] =
    IO { ConfigFactory.load().getConfig("easyflix") }

  def createLogger = IO { LoggerFactory.getLogger(this.getClass.getCanonicalName) }

  def createSystem(config: Config): IO[ActorSystem] =
    IO { ActorSystem("Easyflix", config) }

  def createMaterializer(system: ActorSystem): IO[ActorMaterializer] =
    IO { ActorMaterializer()(system) }

  def shutdown(logger: Logger, system: ActorSystem, materializer: ActorMaterializer): IO[Unit] =
    for {
      _ <- IO { logger.info("Shutting down actor system") }
      _ <- IO { materializer.shutdown() }
      _ <- IO.fromFuture { IO(system.terminate()) }
    } yield ()

  val loadResources: IO[(Logger, Config, ActorSystem, ActorMaterializer)] = {
    for {
      logger <- createLogger
      _ <- IO { logger.info("Creating actor system") }
      config <- loadConfig
      system <- createSystem(config)
      materializer <- createMaterializer(system)
    } yield (logger, config, system, materializer)
  }

  def acquire(logger: Logger, config: Config, system: ActorSystem, mat: ActorMaterializer): IO[T]

  def release: T => IO[Unit]

  def start: IndexedStateT[IO, Stopped.type, Started[T], Unit] = IndexedStateT { _ =>
    val resourcePromise = Promise[T]()
    val start: IO[Unit] =
      loadResources.bracket { case (l, c, s, m) =>
        for {
          t <- acquire(l, c, s, m).attempt
          _ <- IO.pure(t.fold(resourcePromise.failure, resourcePromise.success))
          _ <- IO.fromEither(t)
          _ <- IO.never
        } yield ()
      } {
        case (l, _, s, m) => shutdown(l, s, m)
      }
    start.runCancelable {
      case Left(_) => IO.unit // IO { throwable.printStackTrace(Console.err) }
      case Right(_) => IO.unit
    }.map(stop => (Started[T](stop, IO.fromFuture(IO(resourcePromise.future))), ())).toIO
  }

  def stop: IndexedStateT[IO, Started[T], Stopped.type, Unit] = IndexedStateT {
    case Started(stop, t) => t.flatMap(release) *> stop.map(_ => (Stopped, ()))
  }

  def run(io: T => IO[Unit]): IndexedStateT[IO, Started[T], Started[T], Either[Throwable, Unit]] = IndexedStateT {
    case s @ Started(_, t) => t.flatMap(io).attempt.map(e => (s, e))
  }

}
