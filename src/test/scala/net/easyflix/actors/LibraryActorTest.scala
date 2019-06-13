package net.easyflix.actors

import java.nio.file.Paths

import akka.actor.Status
import net.easyflix.events.ApplicationBus
import net.easyflix.exceptions.NotFoundException
import net.easyflix.model.{Library, LibraryFile}
import net.easyflix.util.{SimpleActorTest, WithLibrary}

import scala.concurrent.duration._

class LibraryActorTest extends SimpleActorTest with WithLibrary {

  val bus = new ApplicationBus

  "A LibraryActor" should {

    val pollInterval = 100.milliseconds
    val actor = system.actorOf(LibraryActor.props(Library.Local("name", libraryPath, pollInterval = pollInterval), bus))

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

    "retrieve a file by path" in {

      actor ! LibraryActor.GetFiles

      val files: Seq[_] = expectMsgPF() { case files: Seq[_] => files }

      val path = files.head.asInstanceOf[LibraryFile].path

      actor ! LibraryActor.GetFile(path)

      expectMsg(files.head)

      actor ! LibraryActor.GetFile(Paths.get("unknown"))

      expectMsg(Status.Failure(NotFoundException("No file with that path")))

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

      uncreatedFiles.head.toFile.createNewFile()

      Thread.sleep(pollInterval.toMillis * 2)

      actor ! LibraryActor.GetFiles

      expectMsgPF() {
        case files: Seq[_] =>
          files.length should be (libraryFiles.length + 2)
          files.map(_.asInstanceOf[LibraryFile].name) should contain (uncreatedFiles.head.getFileName.toString)
      }

      uncreatedFiles.head.toFile.delete()

      Thread.sleep(pollInterval.toMillis * 2)

      actor ! LibraryActor.GetFiles

      expectMsgPF() {
        case files: Seq[_] =>
          files.length should be (libraryFiles.length + 1)
          files.map(_.asInstanceOf[LibraryFile].name) should not contain uncreatedFiles.head.getFileName.toString
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
