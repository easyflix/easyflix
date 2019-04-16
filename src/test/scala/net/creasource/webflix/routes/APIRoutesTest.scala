package net.creasource.webflix.routes

import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.testkit._
import net.creasource.Application
import net.creasource.json.JsonSupport
import net.creasource.util.WithLibrary
import net.creasource.webflix.Library
import org.scalatest.{Matchers, Suite, WordSpecLike}
import spray.json.{JsArray, JsObject}

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
        status shouldEqual StatusCodes.OK
        responseAs[Seq[Library]] shouldEqual Seq.empty
      }

    }

    "return a library for POSTs on /libraries" in {

      Post("/libraries", lib.toJson) ~> route ~> check {
        status shouldEqual StatusCodes.OK
        responseAs[Library] shouldEqual lib
      }

    }

    "return created libraries for GETs on /libraries" in {

      Get("/libraries") ~> route ~> check {
        status shouldEqual StatusCodes.OK
        responseAs[Seq[Library]] shouldEqual Seq(lib)
      }

    }

    "return an object for GETs on /library/{name}" in {

      Get(s"/libraries/${lib.name}") ~> route ~> check {
        status shouldEqual StatusCodes.OK
        responseAs[JsObject] shouldEqual JsObject(
          "library" -> lib.toJson,
          "files" -> JsArray()
        )
      }

    }

    "return an empty response for DELETEs on /library/{name}" in {

      Delete(s"/libraries/${lib.name}") ~> route ~> check {
        status shouldEqual StatusCodes.Accepted
        responseAs[String] shouldEqual ""
      }

    }

    "return an empty array for GETs on /libraries (2)" in {

      Get("/libraries") ~> route ~> check {
        status shouldEqual StatusCodes.OK
        responseAs[Seq[Library]] shouldEqual Seq.empty
      }

    }

  }

  override def afterAll(): Unit = {
    application.shutdown()
    super.afterAll()
  }

}
