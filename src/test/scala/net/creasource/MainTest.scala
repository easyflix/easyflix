package net.creasource

import java.io.File
import java.net.{URI, URL, URLEncoder}
import java.nio.file.{FileSystems, Path, Paths}

import akka.{Done, NotUsed}
import akka.stream.{ActorMaterializer, KillSwitch, KillSwitches}
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.alpakka.file.scaladsl.DirectoryChangesSource
import akka.stream.scaladsl.{Flow, Keep, Sink, Source}
import me.nimavat.shortid.ShortId
import net.creasource.core.Application
import net.creasource.model.{Folder, Library, LibraryFile, Video, VideoFormat}

import scala.concurrent.{Await, Future}
import scala.concurrent.duration._
import spray.json._
import spray.json.DefaultJsonProtocol._
import akka.pattern.ask
import net.creasource.web.LibraryActor.{GetLibraryFiles, ScanLibrary}

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

      val videos = Library(name = "Vidéos", path = Paths.get("D:\\Vidéos\\Avatar - The Legend of Korra"))

      val f = (application.libraryActor ? ScanLibrary(videos))(10.seconds)

      Await.result(f, 10.seconds)

      val f1 = (application.libraryActor ? GetLibraryFiles)(10.seconds).mapTo[Seq[LibraryFile]]

      val r = Await.result(f1, 10.seconds)

      r.foreach(println)
      /*      import akka.stream.alpakka.file.scaladsl.Directory

            val videos = Library(name = "Vidéos", path = Paths.get("D:\\Vidéos\\Avatar - The Legend of Korra"))

            val source: Source[Path, NotUsed] = Directory.walk(videos.path)

            def getParentPathRelativeToLibrary(path: Path) = {
              Paths.get(videos.name).resolve(videos.path.relativize(path)).getParent
            }

            val f = source
                .filter(path => path !== videos.path)
                .map(path => {
                  val file = path.toFile
                  if (file.isFile) {
                    VideoFormat.getFormat(file) match {
                      case Some(format) => Some(Video(
                        parent = getParentPathRelativeToLibrary(path),
                        name = file.getName,
                        size = file.length,
                        format = format,
                        filePath = path
                      ))
                      case _ => None
                    }
                  } else {
                    Some(Folder(
                      id = ShortId.generate(),
                      parent = getParentPathRelativeToLibrary(path),
                      name = file.getName,
                    ))
                  }
                })
                .collect[LibraryFile] { case Some(libraryFile) => libraryFile }
                .map(_.toJson)
                .runWith(Sink.seq)

            val r = Await.result(f, 20.seconds)

            println(r.length)
            println(r.mkString("[\n", ",\n", "\n]"))*/

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
