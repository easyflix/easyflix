package net.easyflix.model

import java.nio.file.Paths

import akka.actor.ActorSystem
import akka.stream.{ActorMaterializer, KillSwitches}
import akka.stream.scaladsl.{Keep, Sink}
import net.easyflix.model.LibraryFileChange.{Creation, Deletion}
import net.easyflix.util.{WithFTPServer, WithLibrary}
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.{Matchers, WordSpecLike}
import org.scalatest.time.{Seconds, Span}

import scala.concurrent.duration._

class LibraryTest extends WordSpecLike with Matchers with WithLibrary with ScalaFutures with WithFTPServer  {

  implicit val system: ActorSystem = ActorSystem("TestSystem")
  implicit val materializer: ActorMaterializer = ActorMaterializer()

  "A Local Library" should {

    val pollInterval = 100.milliseconds

    "scan root directory recursively" in {
      val lib = Library.Local("name", libraryPath)
      val files = lib.scan().runWith(Sink.seq).futureValue

      files.length should be (libraryFiles.length + 1)

      files.head.name should be ("library")
      files.head.path should be (Paths.get(lib.name))
      files.head.isDirectory should be (true)

      val relativePaths = lib.relativizePath(libraryPath) +: libraryFiles.map(a => lib.relativizePath(a._1))

      files.map(_.path) should be (relativePaths)
    }

    "scan a sub directory" in {
      val lib = Library.Local("name", libraryPath)
      val folder = lib.relativizePath(libraryFiles.head._1)// Paths.get(lib.name).resolve(libraryPath.relativize(libraryFiles.head._1))
      val files = lib.scan(folder).runWith(Sink.seq).futureValue

      files.length should be (libraryFiles.map(_._1).count(path => path.startsWith(libraryFiles.head._1)))

      files.head.name should be (folder.getFileName.toString)
      files.head.isDirectory should be (true)
      files.head.path should be (lib.relativizePath(libraryFiles.head._1))

      files.map(_.name) should contain ("movie.1.1.avi")
    }

    "watch root directory for file creation" in {
      val lib = Library.Local("name", libraryPath, pollInterval = pollInterval)
      val (ks, future) = lib
        .watch()
        .viaMat(KillSwitches.single)(Keep.right)
        .toMat(Sink.seq)(Keep.both)
        .run()

      uncreatedFiles.head.toFile.createNewFile()
      val fileName = uncreatedFiles.head.getFileName.toString

      Thread.sleep(pollInterval.toMillis * 2)

      ks.shutdown()

      val files = future.futureValue

      files.length should be (1)
      files.head should matchPattern { case Creation(LibraryFile(_, `fileName`, _, false, _, _, "name", _, _, _)) => }
    }

    "watch root directory for file deletion" in {
      uncreatedFiles.head.toFile.createNewFile()

      val lib = Library.Local("name", libraryPath, pollInterval = pollInterval)
      val (ks, future) = lib
        .watch()
        .viaMat(KillSwitches.single)(Keep.right)
        .toMat(Sink.seq)(Keep.both)
        .run()

      uncreatedFiles.head.toFile.delete()
      val filePath = lib.relativizePath(uncreatedFiles.head)

      Thread.sleep(pollInterval.toMillis * 2)

      ks.shutdown()

      val files = future.futureValue

      files.length should be (1)
      files.last should matchPattern { case Deletion(`filePath`) => }
    }

    "watch a sub directory" in {
      val lib = Library.Local("name", libraryPath, pollInterval = pollInterval)
      val folder = lib.relativizePath(libraryFiles.head._1)
      val (ks, future) = lib
        .watch(folder) // folder1
        .viaMat(KillSwitches.single)(Keep.right)
        .toMat(Sink.seq)(Keep.both)
        .run()

      uncreatedFiles(1).toFile.createNewFile() // folder1/movie.1.2.avi
      val fileName = uncreatedFiles(1).getFileName.toString

      Thread.sleep(pollInterval.toMillis * 2)

      ks.shutdown()

      val files = future.futureValue

      files.length should be (1)
      files.head should matchPattern { case Creation(LibraryFile(_, `fileName`, _, false, _, _, "name", _, _, _)) => }
    }

  }

  "A FTP Library" should {

    // TODO write tests for FTP libraries
    "instantiate" in {

      val lib = Library.FTP("Ftp-library", Paths.get(""), "localhost", ftpPort, userName, userPass, passive = true, Library.FTP.Types.FTPS)

      val files = lib.scan().runWith(Sink.seq).futureValue(timeout(Span(10, Seconds)))

      println(files.filter(_.isDirectory)) // Fails


    }

  }

}
