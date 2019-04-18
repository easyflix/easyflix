package net.creasource.webflix.routes

import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.testkit.ScalatestRouteTest
import akka.util.Timeout
import net.creasource.Application
import net.creasource.json.JsonSupport
import net.creasource.util.WithLibrary
import net.creasource.webflix.Library.Local
import net.creasource.webflix.LibraryFile
import net.creasource.webflix.LibraryFile.Id
import net.creasource.webflix.actors.LibrarySupervisor.{AddLibrary, ScanLibrary}
import org.scalatest.{Matchers, WordSpecLike}

import scala.concurrent.Await

class VideosRoutesTest
  extends WordSpecLike
    with Matchers
    with WithLibrary
    with ScalatestRouteTest
    with JsonSupport {

  val application = Application()
  var testFile: LibraryFile with Id = _
  var testFolder: LibraryFile with Id = _

  override def afterAll(): Unit = {
    application.shutdown()
    super.afterAll()
  }

  override def beforeAll(): Unit = {
    super.beforeAll()
    import akka.pattern.ask

    import scala.concurrent.duration._
    implicit val timeout: Timeout = 2.seconds
    val fileF = for {
      _ <- application.libraries ? AddLibrary(Local("name", libraryPath))
      files <- (application.libraries ? ScanLibrary("name")).mapTo[Seq[LibraryFile with Id]]
    } yield {
      (files.find(file => !file.isDirectory).get, files.find(file => file.isDirectory).get)
    }
    val (testFile, testFolder) = Await.result(fileF, 2.seconds)
    this.testFile = testFile
    this.testFolder = testFolder
  }

  "Videos routes" should {

    val route = VideosRoutes.routes(application)

    "return a OK status for GETs on /{id}" in {

      Get(s"/${testFile.id}") ~> route ~> check {
        status shouldEqual StatusCodes.OK
        // Test with a real file
        /*responseEntity should matchPattern {
          case HttpEntity.Default(ContentType(MediaTypes.`video/x-msvideo` , _), _, _) =>
        }*/
      }

    }

    "return a BadRequest for GETs on /{id} if id is a folder" in {

      Get(s"/${testFolder.id}") ~> route ~> check {
        status shouldEqual StatusCodes.BadRequest
        entityAs[String] shouldEqual "Requested id does not match any video file"
      }

    }

    "return a NotFound status for GETs on /unknown" in {

      Get(s"/unknown") ~> route ~> check {
        status shouldEqual StatusCodes.NotFound
      }

    }

  }


}
