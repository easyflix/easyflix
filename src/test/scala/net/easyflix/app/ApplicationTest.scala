package net.easyflix.app

import cats.effect.{IO, Timer}
import net.easyflix.app.BaseApplication.Stopped
import org.scalatest.{Matchers, WordSpecLike}

import scala.concurrent.ExecutionContext

class ApplicationTest extends WordSpecLike with Matchers {

  "An Application" should {

    "start and stop" in {

      val app = Application2

      implicit val timer: Timer[IO] = IO.timer(ExecutionContext.global)

      val program = for {
        _ <- app.start
        _ <- app.stop
      } yield ()

      program.runA(Stopped).unsafeRunSync()

    }

  }

}
