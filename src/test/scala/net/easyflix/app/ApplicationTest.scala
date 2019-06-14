package net.easyflix.app

import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import cats.effect.IO
import net.easyflix.app.Application._
import org.scalatest.{Matchers, WordSpecLike}
import org.slf4j.Logger

class ApplicationTest extends WordSpecLike with Matchers {

  "A BaseApplication" should {

    val app = new Application[String] {
      def acquire(log: Logger, sys: ActorSystem, mat: ActorMaterializer): IO[String] =
        IO.pure("resources")
      def release: String => IO[Unit] = _ => IO.unit
    }

    "start and stop" in {

      val program = for {
        _ <- app.start
        _ <- app.stop
      } yield ()

      program.runA(Stopped).unsafeRunSync()

    }

    "run some IO with side effects" in {

      var run: Boolean = false

      val program = for {
        _ <- app.start
        _ <- app.run(_ => IO { run = true })
        _ <- app.stop
      } yield ()

      program.runA(Stopped).unsafeRunSync()

      run shouldBe true

    }

    "report run failures" in {

      def ex(msg: String) = new Exception(msg)

      val program = for {
        _ <- app.start
        r <- app.run(t => IO.raiseError[Unit](ex(t)))
        _ <- app.stop
      } yield r

      val result: Either[Throwable, Unit] = program.runA(Stopped).unsafeRunSync()

      result.isLeft shouldBe true
      result.left.get.getMessage shouldBe "resources"

    }

    "report start failures immediately" in {

      case object CustomException extends Exception("boom")

      val app = new Application[Unit] {
        def acquire(logger: Logger, sys: ActorSystem, mat: ActorMaterializer): IO[Unit] =
          IO.raiseError(CustomException)
        def release: Unit => IO[Unit] = _ => IO.unit
      }

      val program = for {
        _ <- app.start
        _ <- app.stop
      } yield ()

      assertThrows[CustomException.type](program.runA(Application.Stopped).unsafeRunSync())

    }

    "start asynchronously" in {

      val program = for {
        r <- app.start
      } yield r

      val result: Unit = program.runA(Stopped).unsafeRunSync()

      result should ===(())

    }

  }

}
