package net.creasource.webflix

import akka.stream.KillSwitches
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.scaladsl.{Keep, Sink}
import net.creasource.util.{SimpleTest, WithLibrary}

import scala.concurrent.Await
import scala.concurrent.duration._

class LibraryTest extends SimpleTest with WithLibrary {

  "A LocalLibrary" should {

    val pollInterval = 100.milliseconds

    "scan root directory recursively" in {
      val lib = Library.Local("name", libraryPath)
      val future = lib.scan().runWith(Sink.seq)
      val files = Await.result(future, 2.seconds)

      files.length should be (libraryFiles.length + 1)

      files.head.name should be ("library")
      files.head.isDirectory should be (true)

      files.map(_.path) should be (libraryPath +: libraryFiles.map(_._1))
    }

    "scan a sub directory" in {
      val lib = Library.Local("name", libraryPath)
      val folder = libraryPath.relativize(libraryFiles.head._1)
      val future = lib.scan(folder).runWith(Sink.seq)
      val files = Await.result(future, 2.seconds)

      files.length should be (2)

      files.head.name should be (folder.getFileName.toString)
      files.head.isDirectory should be (true)
      files.head.path should be (libraryPath.resolve(folder))

      files.map(_.name) should contain ("movie.1.1.avi")
    }

    "watch root directory" in {
      val lib = Library.Local("name", libraryPath, pollInterval)
      val (ks, future) = lib
        .watch()
        .viaMat(KillSwitches.single)(Keep.right)
        .toMat(Sink.seq)(Keep.both)
        .run()

      uncreatedFiles.head.toFile.createNewFile()
      val fileName = uncreatedFiles.head.getFileName.toString

      Thread.sleep(pollInterval.toMillis * 2)

      ks.shutdown()

      val files = Await.result(future, 1.second)

      files.length should be (1)
      files.head should matchPattern { case (LibraryFile(`fileName`, _, false, _, _), DirectoryChange.Creation) => }
    }

    "watch a sub directory" in {
      val lib = Library.Local("name", libraryPath, pollInterval)
      val (ks, future) = lib
        .watch(libraryFiles.head._1) // folder1
        .viaMat(KillSwitches.single)(Keep.right)
        .toMat(Sink.seq)(Keep.both)
        .run()

      uncreatedFiles(1).toFile.createNewFile() // folder1/movie.1.2.avi
      val fileName = uncreatedFiles(1).getFileName.toString

      Thread.sleep(pollInterval.toMillis * 2)

      ks.shutdown()

      val files = Await.result(future, 1.second)

      files.length should be (1)
      files.head should matchPattern { case (LibraryFile(`fileName`, _, false, _, _), DirectoryChange.Creation) => }
    }

  }

}
