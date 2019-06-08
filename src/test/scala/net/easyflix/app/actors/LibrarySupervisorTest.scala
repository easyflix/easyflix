package net.easyflix.app.actors

import akka.Done
import akka.actor.Status
import akka.testkit.TestActorRef
import net.easyflix.exceptions.{NotFoundException, ValidationException}
import net.easyflix.util.{SimpleActorTest, WithLibrary}
import net.easyflix.app.{Library, LibraryFile}

class LibrarySupervisorTest extends SimpleActorTest with WithLibrary {

  "A LibrarySupervisor" should {

    val supervisor = TestActorRef[LibrarySupervisor](LibrarySupervisor.props()) //system.actorOf(LibrarySupervisor.props())

    "add a Library successfully" in {

      supervisor ! LibrarySupervisor.AddLibrary(Library.Local("name", libraryPath))

      expectMsgPF() {
        case Library.Local("name", `libraryPath`, _, _, _) =>
      }

    }

    "fail to add a library with a name or path already defined" in {

      supervisor ! LibrarySupervisor.AddLibrary(Library.Local("name", libraryPath))

      expectMsg(Status.Failure(ValidationException("name", "alreadyExists", None)))

    }

    "retrieve libraries" in {

      supervisor ! LibrarySupervisor.GetLibraries

      val libs: Seq[Library] = expectMsgType[Seq[Library]]

      libs.head.name should be ("name")
      libs.head.path should be (libraryPath)
      libs.length should be (1)

    }

    "get a library by name" in {

      supervisor ! LibrarySupervisor.GetLibrary("name")

      expectMsgType[Library.Local]

      supervisor ! LibrarySupervisor.GetLibrary("badName")

      expectMsg(Status.Failure(NotFoundException("No library with that name")))

    }

    "scan a library by name" in {

      supervisor ! LibrarySupervisor.ScanLibrary("name")

      expectMsgPF() {
        case files: Seq[_] => files.length should be (libraryFiles.length + 1)
      }

      supervisor ! LibrarySupervisor.ScanLibrary("badName")

      expectMsgPF() {
        case Status.Failure(NotFoundException(message)) => message should be ("No library with that name")
      }

    }

    "retrieve files by library name" in {

      supervisor ! LibrarySupervisor.GetLibraryFiles("name")

      expectMsgPF() {
        case files: Seq[_] => files.length should be (libraryFiles.length + 1)
      }

      supervisor ! LibrarySupervisor.GetLibraryFiles("badName")

      expectMsg(Status.Failure(NotFoundException("No library with that name")))

    }

    "retrieve files by id" in {

      import akka.pattern.ask

      import scala.concurrent.duration._

      val files = (supervisor ? LibrarySupervisor.GetLibraryFiles("name"))(2.seconds)
        .mapTo[Seq[LibraryFile]]
        .futureValue

      files.length should be (libraryFiles.length + 1)

      supervisor ! LibrarySupervisor.GetFileById("name", files.head.id)

      expectMsg(files.head)

      supervisor ! LibrarySupervisor.GetFileById("name", files.last.id)

      expectMsg(files.last)

      supervisor ! LibrarySupervisor.GetFileById("name", "unknown")

      expectMsg(Status.Failure(NotFoundException("No file with that id")))

    }

    "remove a library successfully" in {

      supervisor ! LibrarySupervisor.RemoveLibrary("name")

      expectMsg(Done)

    }

    "add a Library successfully regardless of special characters in name" in {

      Thread.sleep(20)

      val lib = Library.Local("""naméà@""", libraryPath)

      supervisor ! LibrarySupervisor.AddLibrary(lib)

      expectMsgType[Library.Local]

    }

    /*"purge" in {

      val r = """(?:[^\\/:*?"<>|\r\n]+\\)*""".r

      """nameéà@ç-.+*_8/\\'"#;,%$£&~^""" match {
        case r(_*) => println("true")
        case _ => println("false")
      }

      supervisor.underlyingActor.paths.toSeq.length should be (0)

      supervisor ! LibrarySupervisor.Purge

      expectNoMessage()

      supervisor ! LibrarySupervisor.ScanLibrary("""nameéà@ç-.+*_8/\\'"#;,%$£&~^""")
      expectMsgPF() {
        case files: Seq[_] => files.length should be (libraryFiles.length + 1)
      }

      supervisor.underlyingActor.paths.toSeq.length should be (libraryFiles.length + 1)

    }*/

  }

}
