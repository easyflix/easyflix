package net.easyflix.app

import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import cats.effect.{IO, Timer}
import net.easyflix.app.Application.Stopped
import net.easyflix.model.TMDBConfiguration
import org.scalatest.{Matchers, WordSpecLike}

import scala.concurrent.ExecutionContext

class ProdApplicationTest extends WordSpecLike with Matchers {

  class TestProdApp extends ProdApplication {
    import net.easyflix.tmdb
    // So that we don't need a valid API key for tests
    override def loadTmdbConfig(conf: ProdConfiguration)
                               (implicit sys: ActorSystem, mat: ActorMaterializer): IO[TMDBConfiguration] = {
      IO.pure(TMDBConfiguration(
        tmdb.Configuration.Images("", "", List.empty, List.empty, List.empty, List.empty, List.empty),
        List.empty)
      )
    }
  }

  "An Application" should {

    "start and stop" in {

      val app = new TestProdApp

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
