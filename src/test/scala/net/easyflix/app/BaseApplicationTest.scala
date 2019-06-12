package net.easyflix.app

import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import cats.effect.IO
import com.typesafe.config.Config
import org.scalatest.{Matchers, WordSpecLike}

import scala.concurrent.Promise
import scala.util.Success

class BaseApplicationTest extends WordSpecLike with Matchers {

  "A BaseApplication" should {

    "start and stop" in {

      val app2 = new BaseApplication {
        def initialize(config: Config, system: ActorSystem, mat: ActorMaterializer): IO[Unit] =
          IO.unit
      }

      val program = for {
        p <- app2.start
        _ <- app2.stop
      } yield p

      val p: Promise[Unit] = program.runA(BaseApplication.Stopped).unsafeRunSync()

      p.future.value shouldEqual Some(Success(()))

    }

  }

}
