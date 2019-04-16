package net.creasource.webflix.actors

import akka.Done
import akka.actor.SupervisorStrategy.{Restart, Stop}
import akka.actor.{Actor, ActorInitializationException, ActorKilledException, ActorRef, DeathPactException, OneForOneStrategy, Props, SupervisorStrategy, Terminated}
import akka.event.Logging
import net.creasource.Application
import net.creasource.webflix.{Library, LibraryFile}

import scala.util.{Failure, Success, Try}

object LibrarySupervisor {

  case object GetLibraries
  case class GetLibrary(libraryName: String)
  case class GetLibraryFiles(libraryName: String)

  case class ScanLibrary(libraryName: String)

  case class AddLibrary(library: Library)
  sealed trait AddLibraryResult
  case object AddLibrarySuccess extends AddLibraryResult
  case object AddLibraryFailure extends AddLibraryResult

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
      if (libraries.values.map(_.name).toSeq.contains(library.name)) {
        sender() ! AddLibraryFailure
      } else {
        Try(context.actorOf(LibraryActor.props(library), library.name)) match {
          case Success(actorRef) =>
            context.watch(actorRef)
            libraries += (actorRef -> library)
            sender() ! AddLibrarySuccess
          case Failure(_) =>
            sender() ! AddLibraryFailure
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
