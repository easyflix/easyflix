package net.creasource

import java.io.File
import java.net.{URI, URL, URLEncoder}
import java.nio.file.{FileSystems, Path, Paths}

import akka.{Done, NotUsed}
import akka.stream.{ActorMaterializer, KillSwitch, KillSwitches}
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.alpakka.file.scaladsl.DirectoryChangesSource
import akka.stream.scaladsl.{Flow, Keep, Sink, Source}
import net.creasource.core.Application
import net.creasource.model.{Folder, Library, LibraryFile, Video, VideoFormat}

import scala.concurrent.{Await, Future}
import scala.concurrent.duration._
import spray.json._
import spray.json.DefaultJsonProtocol._

class MainTest extends SimpleTest {

  var application: Application = _

  lazy implicit val materializer: ActorMaterializer = application.materializer

  override def beforeAll() {
    application = new Application()
  }

  override def afterAll() {
    application.shutdown()
  }

  "Webflix" should {

    "a" in {

      import akka.stream.alpakka.file.scaladsl.Directory

      val libraryPath = Paths.get("D:\\Vidéos\\Avatar - The Legend of Korra")

      val source: Source[Path, NotUsed] = Directory.walk(libraryPath)

      val f = source
          .filter(path => path !== libraryPath)
          .map(path => {
            val file = path.toFile
            if (file.isFile) {
              VideoFormat.getFormat(file) match {
                case Some(format) => Some(Video(
                  path = path,
                  name = file.getName,
                  parent = path.getParent,
                  size = file.length,
                  url = new URL("http", "localhost", "/" + URLEncoder.encode(file.getName, "UTF-8")),
                  format = format
                ))
                case _ => None
              }
            } else {
              Some(Folder(
                path = path,
                name = file.getName,
                parent = path.getParent,
                numberOfVideos = 0)
              )
            }
          })
          .collect { case Some(libraryFile) => libraryFile }
          .concat[LibraryFile, NotUsed](Source.single(Library(path = libraryPath, name = "Vidéos", numberOfVideos = 0)))
          .map(_.toJson)
          .runWith(Sink.seq)

      val r = Await.result(f, 20.seconds)

      println(r.length)
      println(r.mkString("[\n", ",\n", "\n]"))

/*      val changes: Source[(Path, DirectoryChange), NotUsed] =
        DirectoryChangesSource(Paths.get("D:/Vidéos"), pollInterval = 1.second, maxBufferSize = 1000)

      val (killSwitch, seq: Future[Seq[(Path, DirectoryChange)]]) =
        changes
          .viaMat(KillSwitches.single)(Keep.right)
          .toMat(Sink.seq)(Keep.both)
          .run()

      Thread.sleep(30000)

      killSwitch.shutdown()

      val r2 = Await.result(seq, 1.seconds)

      println(r2.toString())*/

    }

  }

}
