package net.easyflix.app

import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import cats.effect.IO
import com.typesafe.config.Config
import net.easyflix.app.BaseApplication._
import org.scalatest.{Matchers, WordSpecLike}

import scala.concurrent.duration._

class BaseApplicationTest extends WordSpecLike with Matchers {

  "A BaseApplication" should {

    import cats.implicits._

    val app = new BaseApplication[String] {
      def acquire(conf: Config, sys: ActorSystem, mat: ActorMaterializer): IO[String] =
        IO(println("acquire")) *> IO.pure("resources")
      def release(resource: String): IO[Unit] = IO(println("release")) *> IO.unit
    }

    "start and stop" in {

      val program = for {
        _ <- app.start
        _ <- app.stop
      } yield ()

      program.runA(Stopped).unsafeRunSync()

    }

    "run some IO" in {

      val program = for {
        _ <- app.start
        _ <- app.run(r => IO(println(r)))
        _ <- app.stop
      } yield ()

      program.runA(Stopped).unsafeRunSync()

    }

    "report run failures" in {

      val ex = new Exception("boom")

      val program = for {
        _ <- app.start
        r <- app.run(_ => IO.raiseError(ex))
        _ <- app.stop
      } yield r

      val result: Either[Throwable, Unit] = program.runA(Stopped).unsafeRunSync()

      result shouldBe Left(ex)

    }

    "report start failures immediately" in {

      val ex = new Exception("boom")

      val app = new BaseApplication[Unit] {
        def acquire(conf: Config, sys: ActorSystem, mat: ActorMaterializer): IO[Unit] =
          IO.raiseError(ex)
        def release(resource: Unit): IO[Unit] = IO.unit
      }

      val program = for {
        s <- app.start
        _ <- app.stop
      } yield s

      assertThrows[Exception](program.runA(BaseApplication.Stopped).unsafeRunSync())

    }

    "start asynchronously" in {

      val program = for {
        r <- app.start
      } yield r

      val result: IO[Unit] = program.runA(Stopped).unsafeRunSync()

      result.unsafeRunTimed(1.second) shouldBe None

    }

  }

}
