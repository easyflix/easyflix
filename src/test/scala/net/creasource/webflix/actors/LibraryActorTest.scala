package net.creasource.webflix.actors

import akka.actor.Status
import net.creasource.util.{SimpleActorTest, WithLibrary}
import net.creasource.webflix.{Library, LibraryFile}

import scala.concurrent.duration._

class LibraryActorTest extends SimpleActorTest with WithLibrary {

  "A LibraryActor" should {

    val pollInterval = 100.milliseconds
    val actor = system.actorOf(LibraryActor.props(Library.Local("name", libraryPath,pollInterval)))

    "scan its library" in {

      actor ! LibraryActor.Scan

      expectMsgPF() {
        case files: Seq[_] => files.length should be (libraryFiles.length + 1)
      }

      actor ! LibraryActor.Scan

      expectMsgPF() {
        case files: Seq[_] => files.length should be (libraryFiles.length + 1)
      }

    }

    "fail to scan if already scanning" in {

      actor ! LibraryActor.Scan
      actor ! LibraryActor.Scan

      expectMsgPF() {
        case Status.Failure(exception) => exception.getMessage should be ("A scan is already in progress")
      }

      expectMsgPF() {
        case files: Seq[_] => files.length should be (libraryFiles.length + 1)
      }

    }

    "return scanned files" in {

      actor ! LibraryActor.GetFiles

      expectMsgPF() {
        case files: Seq[_] => files.length should be (libraryFiles.length + 1)
      }

    }

    "watch its library recursively for file creation" in {

      uncreatedFiles.head.toFile.createNewFile()

      Thread.sleep(pollInterval.toMillis * 2)

      actor ! LibraryActor.GetFiles

      expectMsgPF() {
        case files: Seq[_] =>
          files.length should be (libraryFiles.length + 2)
          files.map(_.asInstanceOf[LibraryFile].name) should contain (uncreatedFiles.head.getFileName.toString)
      }

      uncreatedFiles(1).toFile.createNewFile()

      Thread.sleep(pollInterval.toMillis * 2)

      actor ! LibraryActor.GetFiles

      expectMsgPF() {
        case files: Seq[_] =>
          files.length should be (libraryFiles.length + 3)
          files.map(_.asInstanceOf[LibraryFile].name) should contain (uncreatedFiles(1).getFileName.toString)
      }

    }

    "watch its library recursively for file deletion" in {

      uncreatedFiles.head.toFile.delete()

      Thread.sleep(pollInterval.toMillis * 2)

      actor ! LibraryActor.GetFiles

      expectMsgPF() {
        case files: Seq[_] =>
          files.length should be (libraryFiles.length + 2)
          files.map(_.asInstanceOf[LibraryFile].name) should not contain uncreatedFiles.head.getFileName.toString
      }

      uncreatedFiles(1).toFile.delete()

      Thread.sleep(pollInterval.toMillis * 2)

      actor ! LibraryActor.GetFiles

      expectMsgPF() {
        case files: Seq[_] =>
          files.length should be (libraryFiles.length + 1)
          files.map(_.asInstanceOf[LibraryFile].name) should not contain uncreatedFiles(1).getFileName.toString
      }

    }

    "watch newly created sub-folders" in {

      uncreatedSubFolders.head.toFile.mkdir()

      Thread.sleep(pollInterval.toMillis * 2)

      actor ! LibraryActor.GetFiles

      expectMsgPF() {
        case files: Seq[_] =>
          files.length should be (libraryFiles.length + 2)
          files.map(_.asInstanceOf[LibraryFile].name) should contain (uncreatedSubFolders.head.getFileName.toString)
      }

      uncreatedSubFiles.head.toFile.createNewFile()

      Thread.sleep(pollInterval.toMillis * 2)

      actor ! LibraryActor.GetFiles

      expectMsgPF() {
        case files: Seq[_] => files.length should be (libraryFiles.length + 3)
      }

    }

  }

}
