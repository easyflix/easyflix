package net.creasource.webflix.routes

import akka.http.scaladsl.testkit._
import akka.pattern.ask
import net.creasource.Application
import net.creasource.json.JsonSupport
import net.creasource.util.WithLibrary
import net.creasource.webflix.Library
import net.creasource.webflix.actors.LibrarySupervisor
import org.scalatest.{Matchers, Suite, WordSpecLike}

import scala.concurrent.duration._

class APIRoutesTest extends Suite
  with WordSpecLike
  with Matchers
  with WithLibrary
  with ScalatestRouteTest
  with JsonSupport {

  val application = Application()

  "API routes" should {

    val route = APIRoutes.routes(application)

    val lib = Library.Local("name", libraryPath)

    "return an empty array for GETs on /libraries" in {

      Get("/libraries") ~> route ~> check {
        responseAs[Seq[Library]] shouldEqual Seq.empty
      }

    }

    "return a library for POSTs on /libraries" in {

      Post("/libraries", lib.toJson) ~> route ~> check {
        responseAs[Library] shouldEqual lib
      }

    }

    "return created libraries for GETs on /libraries" in {

      Get("/libraries") ~> route ~> check {
        responseAs[Seq[Library]] shouldEqual Seq(lib)
      }

    }

  }

  override def afterAll(): Unit = {
    application.shutdown()
    super.afterAll()
  }

}
