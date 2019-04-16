package net.creasource.webflix.actors

import akka.Done
import akka.actor.SupervisorStrategy.{Restart, Stop}
import akka.actor.{Actor, ActorInitializationException, ActorKilledException, ActorRef, DeathPactException, OneForOneStrategy, Props, SupervisorStrategy, Terminated}
import akka.event.Logging
import net.creasource.Application
import net.creasource.json.JsonSupport
import net.creasource.webflix.{Library, LibraryFile}
import spray.json.RootJsonFormat

import scala.util.{Failure, Success, Try}

object LibrarySupervisor extends JsonSupport {

  case object GetLibraries
  case class GetLibrary(libraryName: String)
  case class GetLibraryFiles(libraryName: String)

  case class ScanLibrary(libraryName: String)

  case class AddLibrary(library: Library)
  sealed trait AddLibraryResult
  case object AddLibrarySuccess extends AddLibraryResult
  case class AddLibraryFailure(control: String, code: String, value: Option[String]) extends AddLibraryResult
  object AddLibraryFailure {
    def apply(control: String, code: String): AddLibraryFailure = apply(control, code, None)
    implicit val format: RootJsonFormat[AddLibraryFailure] = jsonFormat3(AddLibraryFailure.apply)
  }

  case class RemoveLibrary(libraryName: String)

  def props()(implicit app: Application): Props = Props(new LibrarySupervisor())

}

class LibrarySupervisor()(implicit val app: Application) extends Actor {

  import LibrarySupervisor._

  val logger = Logging(context.system, this)

  var libraries: Map[ActorRef, Library] = Map.empty

  override def receive: Receive = {

    case GetLibraries => sender() ! libraries.values.toSeq

    case GetLibrary(name: String) => sender() ! libraries.values.toSeq.find(_.name == name)

    case GetLibraryFiles(name) =>
      libraries.find{ case (_, library) => library.name == name }.map(_._1) match {
        case Some(actorRef) => actorRef forward LibraryActor.GetFiles
        case None => sender() ! Seq.empty[LibraryFile]
      }

    case ScanLibrary(name) =>
      libraries.find{ case (_, library) => library.name == name }.map(_._1) match {
        case Some(actorRef) => actorRef forward LibraryActor.Scan
        case None => sender() ! LibraryActor.ScanFailure(new RuntimeException("No library with that name"))
      }

    case AddLibrary(library) =>
      if (library.name == "") {
        sender() ! AddLibraryFailure("name", "required")
      } else if (library.name.contains(":")) {
        sender() ! AddLibraryFailure("name", "pattern")
      } else if (libraries.values.map(_.name).toSeq.contains(library.name)) {
        sender() ! AddLibraryFailure("name", "alreadyExists")
      } else if (library.path.toString == "") {
        sender() ! AddLibraryFailure("path", "required")
      } else if (!library.path.isAbsolute) {
        sender() ! AddLibraryFailure("path", "notAbsolute")
      } else if (!library.path.toFile.exists) {
        sender() ! AddLibraryFailure("path", "doesNotExist")
      } else if (!library.path.toFile.isDirectory) {
        sender() ! AddLibraryFailure("path", "notDirectory")
      } else if (!library.path.toFile.canRead) {
        sender() ! AddLibraryFailure("path", "notReadable")
      }  else if (libraries.values.toSeq.map(_.path).contains(library.path)) {
        sender() ! AddLibraryFailure("path", "alreadyExists")
      } else if (libraries.values.toSeq.map(_.path).exists(path => path.startsWith(library.path) || library.path.startsWith(path))) {
        sender() ! AddLibraryFailure("path", "noChildren")
      } else {
        val actorName = library.name.replaceAll("""[^0-9a-zA-Z-_\.\*\$\+:@&=,!~';]""", "") + "-" + libraries.size
        Try(context.actorOf(LibraryActor.props(library), actorName)) match {
          case Success(actorRef) =>
            context.watch(actorRef)
            libraries += (actorRef -> library)
            sender() ! AddLibrarySuccess
          case Failure(cause) =>
            sender() ! AddLibraryFailure("other", "failure", Some(cause.getMessage))
        }
      }

    case Terminated(actorRef) => libraries -= actorRef

    case RemoveLibrary(libraryName) =>
      libraries
        .find { case (_, library) => library.name == libraryName }
        .map(_._1)
        .foreach(actorRef => context.stop(actorRef))
      sender() ! Done

  }

  override def supervisorStrategy: SupervisorStrategy = OneForOneStrategy() {
    case _: ActorInitializationException => Stop
    case _: ActorKilledException         => Stop
    case _: DeathPactException           => Stop
    case _: Exception                    => Restart
  }

}
