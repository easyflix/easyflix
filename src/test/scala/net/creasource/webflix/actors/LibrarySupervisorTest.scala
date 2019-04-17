package net.creasource.webflix.actors

import akka.Done
import akka.actor.Status
import akka.testkit.TestActorRef
import net.creasource.exceptions.NotFoundException
import net.creasource.util.{SimpleActorTest, WithLibrary}
import net.creasource.webflix.Library

class LibrarySupervisorTest extends SimpleActorTest with WithLibrary {

  "A LibrarySupervisor" should {

    val supervisor = TestActorRef(LibrarySupervisor.props()) //system.actorOf(LibrarySupervisor.props())

    "add a Library successfully" in {

      supervisor ! LibrarySupervisor.AddLibrary(Library.Local("name", libraryPath))

      expectMsg(LibrarySupervisor.AddLibrarySuccess)

    }

    "fail to add a library with a name already defined" in {

      supervisor ! LibrarySupervisor.AddLibrary(Library.Local("name", libraryPath))

      expectMsg(LibrarySupervisor.AddLibraryFailure("name", "alreadyExists", None))

    }

    "retrieve libraries" in {

      supervisor ! LibrarySupervisor.GetLibraries

      expectMsg(Seq(Library.Local("name", libraryPath)))

    }

    "get a library by name" in {

      supervisor ! LibrarySupervisor.GetLibrary("name")

      expectMsg(Library.Local("name", libraryPath))

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

    }

    "remove a library successfully" in {

      supervisor ! LibrarySupervisor.RemoveLibrary("name")

      expectMsg(Done)

    }

    "add a Library successfully regardless of special characters in name" in {

      Thread.sleep(10)

      supervisor ! LibrarySupervisor.AddLibrary(Library.Local("""nameéà@ç-.+*_8/\\'"#;,%$£&~^""", libraryPath))

      expectMsg(LibrarySupervisor.AddLibrarySuccess)

    }

  }

}
