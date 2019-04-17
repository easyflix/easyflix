package net.creasource.webflix.actors

import akka.Done
import akka.actor.SupervisorStrategy.{Restart, Stop}
import akka.actor._
import akka.event.Logging
import net.creasource.Application
import net.creasource.exceptions.{NotFoundException, ValidationErrorException}
import net.creasource.json.JsonSupport
import net.creasource.webflix.Library

import scala.util.{Failure, Success, Try}

object LibrarySupervisor extends JsonSupport {

  case object GetLibraries
  case class AddLibrary(library: Library)
  case class GetLibrary(name: String)
  case class GetLibraryFiles(name: String)
  case class ScanLibrary(name: String)
  case class RemoveLibrary(name: String)

  def props()(implicit app: Application): Props = Props(new LibrarySupervisor())

}

class LibrarySupervisor()(implicit val app: Application) extends Actor {

  import LibrarySupervisor._

  val logger = Logging(context.system, this)

  var libraries: Map[ActorRef, Library] = Map.empty

  def valError(control: String, code: String, value: Option[String] = None) =
    Status.Failure(ValidationErrorException(control, code, value))

  override def receive: Receive = {

    case GetLibraries => sender() ! libraries.values.toSeq

    case GetLibrary(name: String) =>
      libraries.values.toSeq.find(_.name == name) match {
        case Some(library) => sender() ! library
        case _ => sender() ! Status.Failure(NotFoundException("No library with that name"))
      }

    case GetLibraryFiles(name) =>
      libraries.find{ case (_, library) => library.name == name }.map(_._1) match {
        case Some(actorRef) => actorRef forward LibraryActor.GetFiles
        case None => sender() ! Status.Failure(NotFoundException("No library with that name"))
      }

    case ScanLibrary(name) =>
      libraries.find{ case (_, library) => library.name == name }.map(_._1) match {
        case Some(actorRef) => actorRef forward LibraryActor.Scan
        case None => sender() ! Status.Failure(NotFoundException("No library with that name"))
      }

    case AddLibrary(library) =>
      if (library.name == "") {
        sender() ! valError("name", "required")
      } else if (library.name.contains(":")) {
        sender() ! valError("name", "pattern")
      } else if (libraries.values.map(_.name).toSeq.contains(library.name)) {
        sender() ! valError("name", "alreadyExists")
      } else if (library.path.toString == "") {
        sender() ! valError("path", "required")
      } else if (!library.path.isAbsolute) {
        sender() ! valError("path", "notAbsolute")
      } else if (!library.path.toFile.exists) {
        sender() ! valError("path", "doesNotExist")
      } else if (!library.path.toFile.isDirectory) {
        sender() ! valError("path", "notDirectory")
      } else if (!library.path.toFile.canRead) {
        sender() ! valError("path", "notReadable")
      }  else if (libraries.values.toSeq.map(_.path).contains(library.path)) {
        sender() ! valError("path", "alreadyExists")
      } else if (libraries.values.toSeq.map(_.path).exists(path => path.startsWith(library.path) || library.path.startsWith(path))) {
        sender() ! valError("path", "noChildren")
      } else {
        val actorName = libraries.size + "-" + library.name.replaceAll("""[^0-9a-zA-Z-_\.\*\$\+:@&=,!~';]""", "")
        Try(context.actorOf(LibraryActor.props(library), actorName)) match {
          case Success(actorRef) =>
            context.watch(actorRef)
            libraries += (actorRef -> library)
            sender() ! library
          case Failure(cause) =>
            sender() ! valError("other", "failure", Some(cause.getMessage))
        }
      }

    case Terminated(actorRef) => libraries -= actorRef

    case RemoveLibrary(name) =>
      libraries
        .find { case (_, library) => library.name == name }
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
