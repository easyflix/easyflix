package net.creasource.webflix

import java.nio.file.Paths

import akka.stream.KillSwitches
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.scaladsl.{Keep, Sink}
import net.creasource.util.{SimpleTest, WithFTPServer, WithLibrary}
import org.scalatest.time.{Seconds, Span}

import scala.concurrent.duration._

class LibraryTest extends SimpleTest with WithLibrary with WithFTPServer  {

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
      files.head should matchPattern { case (LibraryFile(`fileName`, _, false, _, _, "name"), DirectoryChange.Creation) => }
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
      val fileName = uncreatedFiles.head.getFileName.toString

      Thread.sleep(pollInterval.toMillis * 2)

      ks.shutdown()

      val files = future.futureValue

      files.length should be (2) // Modification and Deletion
      files.last should matchPattern { case (LibraryFile(`fileName`, _, false, _, _, "name"), DirectoryChange.Deletion) => }
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
      files.head should matchPattern { case (LibraryFile(`fileName`, _, false, _, _, "name"), DirectoryChange.Creation) => }
    }

/*    "fail to create with an invalid name" in {

      val regex = """^[^\\/:*?"<>|\r\n]+$""".r

      val invalidName = "<invalid>"

      invalidName match {
        case regex(_*) => fail()
        case _ =>
      }

      assertThrows[java.lang.IllegalArgumentException](Library.Local(invalidName, Paths.get("")))

    }*/

  }

  "A FTP Library" should {

    "instantiate" in {

      val lib = Library.FTP("Ftp-library", Paths.get(""), "localhost", ftpPort, userName, userPass, passive = true, Library.FTP.Types.FTPS)

      val files = lib.scan().runWith(Sink.seq).futureValue(timeout(Span(10, Seconds)))

      println(files.filter(_.isDirectory)) // Fails


    }

  }

}
