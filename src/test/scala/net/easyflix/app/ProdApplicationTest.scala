package net.easyflix.app

import cats.effect.{IO, Timer}
import net.easyflix.app.Application.Stopped
import org.scalatest.{Matchers, WordSpecLike}

import scala.concurrent.ExecutionContext

class ProdApplicationTest extends WordSpecLike with Matchers {

  "An Application" should {

    "start and stop" in {

      val app = ProdApplication

      implicit val timer: Timer[IO] = IO.timer(ExecutionContext.global)

      val program = for {
        _ <- app.start
        _ <- app.run { case (_, _, _) => IO.unit }
        _ <- app.stop
      } yield ()

      program.runA(Stopped).unsafeRunSync()

    }

  }

}
