package net.easyflix.app

import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import cats.effect.IO
import com.typesafe.config.Config
import net.easyflix.app.BaseApplication._
import org.scalatest.{Matchers, WordSpecLike}

class BaseApplicationTest extends WordSpecLike with Matchers {

  "A BaseApplication" should {

    val app = new BaseApplication[String] {
      def acquire(conf: Config, sys: ActorSystem, mat: ActorMaterializer): IO[String] = IO.pure("resources")
      def release(resource: String): IO[Unit] = IO.unit
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
        r <- app.run(t => IO.raiseError(ex(t)))
        _ <- app.stop
      } yield r

      val result: Either[Throwable, Unit] = program.runA(Stopped).unsafeRunSync()

      result.isLeft shouldBe true
      result.left.get.getMessage shouldBe "resources"

    }

    "report start failures immediately" in {

      case object CustomException extends Exception("boom")

      val app = new BaseApplication[Unit] {
        def acquire(conf: Config, sys: ActorSystem, mat: ActorMaterializer): IO[Unit] =
          IO.raiseError(CustomException)
        def release(resource: Unit): IO[Unit] = IO.unit
      }

      val program = for {
        _ <- app.start
        _ <- app.stop
      } yield ()

      assertThrows[CustomException.type](program.runA(BaseApplication.Stopped).unsafeRunSync())

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
