package net.easyflix.routes

import java.nio.file.Paths

import akka.actor.ActorRef
import akka.http.scaladsl.model.{ContentType, HttpEntity, MediaTypes, StatusCodes}
import akka.http.scaladsl.testkit.ScalatestRouteTest
import akka.util.Timeout
import net.easyflix.actors.LibrarySupervisor.{AddLibrary, ScanLibrary}
import net.easyflix.app.ProdApplication
import net.easyflix.events.ApplicationBus
import net.easyflix.json.JsonSupport
import net.easyflix.model.Library.{FTP, Local}
import net.easyflix.model.LibraryFile
import net.easyflix.util.{WithFTPServer, WithLibrary}
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

  var testFile: LibraryFile = _
  var testFolder: LibraryFile = _
  var ftpFile: LibraryFile = _

  val bus: ApplicationBus = new ApplicationBus
  val libraries: ActorRef = ProdApplication.createLibrariesActor(bus, system, materializer).unsafeRunSync()

  override def beforeAll(): Unit = {
    super.beforeAll()
    import akka.pattern.ask

    import scala.concurrent.duration._
    implicit val askTimeout: Timeout = 2.seconds
    val (testFile, testFolder, ftpFile) = (for {
      _ <- libraries ? AddLibrary(Local("local", libraryPath))
      _ <- libraries ? AddLibrary(FTP("ftp", Paths.get(""), "localhost", ftpPort, userName, userPass, passive = false, FTP.Types.FTPS))
      files <- (libraries ? ScanLibrary("local")).mapTo[Seq[LibraryFile]]
      files2 <- (libraries ? ScanLibrary("ftp")).mapTo[Seq[LibraryFile]]
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

    val route = new VideosRoutes(libraries).routes

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
