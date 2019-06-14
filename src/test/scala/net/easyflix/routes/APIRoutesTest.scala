package net.easyflix.routes

import akka.actor.ActorRef
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.testkit._
import com.typesafe.config.ConfigFactory
import net.easyflix.app.{ProdApplication, ProdConfiguration}
import net.easyflix.events.ApplicationBus
import net.easyflix.json.JsonSupport
import net.easyflix.model.{Library, LibraryFile}
import net.easyflix.util.WithLibrary
import org.scalatest.{Matchers, WordSpecLike}
import spray.json._

class APIRoutesTest
  extends WordSpecLike
    with Matchers
    with WithLibrary
    with ScalatestRouteTest
    with JsonSupport {

  val app: ProdApplication = ProdApplication
  val bus: ApplicationBus = new ApplicationBus
  val libraries: ActorRef = app.createLibrariesActor(bus, system, materializer).unsafeRunSync()
  val config: ProdConfiguration = app.parseConfiguration(ConfigFactory.load().getConfig("easyflix")).unsafeRunSync()
  val tmdb: ActorRef = app.createTmdbActor(null, bus, config, system, materializer).unsafeRunSync()

  override def afterAll(): Unit = super.afterAll()

  "API routes (libraries)" should {

    val route = new APIRoutes(libraries, tmdb).routes

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

    "return a BadRequest for consecutive POSTs on /libraries" in {
      Post("/libraries", lib.toJson) ~> route ~> check {
        status shouldEqual StatusCodes.BadRequest
        responseAs[JsValue] shouldEqual JsObject(
          "control" -> "name".toJson,
          "code" -> "alreadyExists".toJson,
          "value" -> JsNull
        )
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
        val obj = responseAs[JsObject]
        obj.fields("files") should be (JsArray())
        obj.fields("library").asJsObject.fields("name").convertTo[String] should be (lib.name)
      }
    }

    "return a 404 for GETs on /library/unknown" in {
      Get(s"/libraries/unknown") ~> route ~> check {
        status shouldEqual StatusCodes.NotFound
        responseAs[JsValue] shouldEqual JsString("No library with that name")
      }
    }

    "return files for POSTs on /library/{name}/scan" in {
      Post(s"/libraries/${lib.name}/scan") ~> route ~> check {
        status shouldEqual StatusCodes.OK
        responseAs[Seq[LibraryFile]].length shouldEqual libraryFiles.length + 1
      }
    }

    "return a 404 for POSTs on /library/unknown/scan" in {
      Post(s"/libraries/unknown/scan") ~> route ~> check {
        status shouldEqual StatusCodes.NotFound
        responseAs[JsValue] shouldEqual JsString("No library with that name")
      }
    }

    "return an Accepted status for DELETEs on /library/{name}" in {
      Delete(s"/libraries/${lib.name}") ~> route ~> check {
        status shouldEqual StatusCodes.Accepted
        responseAs[String] shouldEqual ""
      }
    }

    "return an empty array for GETs on /libraries (2)" in {
      Thread.sleep(100) // Remove this test ?
      Get("/libraries") ~> route ~> check {
        status shouldEqual StatusCodes.OK
        responseAs[Seq[Library]] shouldEqual Seq.empty
      }
    }

  }

}
