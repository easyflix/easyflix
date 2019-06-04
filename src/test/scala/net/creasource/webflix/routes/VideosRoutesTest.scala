package net.creasource.webflix.routes

import java.nio.file.Paths

import akka.http.scaladsl.model.{ContentType, HttpEntity, MediaTypes, StatusCodes}
import akka.http.scaladsl.testkit.ScalatestRouteTest
import akka.util.Timeout
import net.creasource.Application
import net.creasource.json.JsonSupport
import net.creasource.util.{WithFTPServer, WithLibrary}
import net.creasource.webflix.Library.{FTP, Local}
import net.creasource.webflix.LibraryFile
import net.creasource.webflix.actors.LibrarySupervisor.{AddLibrary, ScanLibrary}
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.time.{Seconds, Span}
import org.scalatest.{Matchers, WordSpecLike}

class VideosRoutesTest
  extends WordSpecLike
    with Matchers
    with WithLibrary
    with ScalatestRouteTest
    with JsonSupport
    with WithFTPServer
    with ScalaFutures {

  val application = Application()
  var testFile: LibraryFile = _
  var testFolder: LibraryFile = _
  var ftpFile: LibraryFile = _

  override def afterAll(): Unit = {
    application.shutdown()
    super.afterAll()
  }

  override def beforeAll(): Unit = {
    super.beforeAll()
    import akka.pattern.ask

    import scala.concurrent.duration._
    implicit val askTimeout: Timeout = 2.seconds
    val (testFile, testFolder, ftpFile) = (for {
      _ <- application.libraries ? AddLibrary(Local("local", libraryPath))
      _ <- application.libraries ? AddLibrary(FTP("ftp", Paths.get(""), "localhost", ftpPort, userName, userPass, passive = false, FTP.Types.FTPS))
      files <- (application.libraries ? ScanLibrary("local")).mapTo[Seq[LibraryFile]]
      files2 <- (application.libraries ? ScanLibrary("ftp")).mapTo[Seq[LibraryFile]]
    } yield {
      (
        files.find(file => !file.isDirectory).get,
        files.find(file => file.isDirectory).get,
        files2.find(file => !file.isDirectory).get
      )
    }).futureValue(timeout(Span(5, Seconds)))
    this.testFile = testFile
    this.testFolder = testFolder
    this.ftpFile = ftpFile
  }

  "Videos routes" should {

    val route = new VideosRoutes(application).routes

    "return a OK status for GETs on /{id}" in {

      Get(s"/local/${testFile.id}") ~> route ~> check {
        status shouldEqual StatusCodes.OK
        // TODO Test with a real file
        /*responseEntity should matchPattern {
          case HttpEntity.Default(ContentType(MediaTypes.`video/x-msvideo` , _), _, _) =>
        }*/
      }

      Get(s"/ftp/${ftpFile.id}") ~> route ~> check {
        status shouldEqual StatusCodes.OK
        // TODO Test with a real file
        responseEntity should be (HttpEntity.empty(ContentType(MediaTypes.`video/x-msvideo`)))
      }

    }

    "return a BadRequest for GETs on /{id} if id is a folder" in {

      Get(s"/local/${testFolder.id}") ~> route ~> check {
        status shouldEqual StatusCodes.BadRequest
        entityAs[String] shouldEqual "Requested id does not match any video file"
      }

    }

    "return a NotFound status for GETs on /unknown" in {

      Get(s"/local/unknown") ~> route ~> check {
        status shouldEqual StatusCodes.NotFound
      }

    }

  }


}
