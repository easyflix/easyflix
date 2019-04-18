package net.creasource.webflix.actors

import java.nio.file.Path

import akka.Done
import akka.actor.SupervisorStrategy.{Restart, Stop}
import akka.actor._
import akka.event.Logging
import akka.pattern.ask
import me.nimavat.shortid.ShortId
import net.creasource.Application
import net.creasource.exceptions.{NotFoundException, ValidationErrorException}
import net.creasource.json.JsonSupport
import net.creasource.webflix.{Library, LibraryFile}

import scala.concurrent.Future
import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}

object LibrarySupervisor extends JsonSupport {

  case object Purge
  case class Purge(paths: Seq[Path])

  case object GetLibraries
  case class AddLibrary(library: Library)
  case class GetLibrary(name: String)
  case class GetLibraryFiles(name: String)
  case class ScanLibrary(name: String)
  case class RemoveLibrary(name: String)
  case class GetFileById(id: String)

  def props()(implicit app: Application): Props = Props(new LibrarySupervisor())

}

class LibrarySupervisor()(implicit val app: Application) extends Actor {

  import LibrarySupervisor._
  import context.dispatcher

  val logger = Logging(context.system, this)

  var libraries: Map[String, (ActorRef, Library)] = Map.empty

  // Map of file path to file id
  var paths: Map[Path, String] = Map.empty

  case class ProcessFiles(files: Seq[LibraryFile], requester: ActorRef)

  override def receive: Receive = {

    case GetLibraries => sender() ! libraries.values.map(_._2).toSeq

    case GetLibrary(name: String) =>
      libraries.get(name).map(_._2) match {
        case Some(library) => sender() ! library
        case _ => sender() ! Status.Failure(NotFoundException("No library with that name"))
      }

    case GetLibraryFiles(name) =>
      val client = sender()
      libraries.get(name) match {
        case Some((actorRef, _)) =>
          val filesFuture = (actorRef ? LibraryActor.GetFiles)(1.minute).mapTo[Seq[LibraryFile]]
          filesFuture.onComplete {
            case Success(files) => self ! ProcessFiles(files, client)
            case Failure(exception) => client ! Status.Failure(exception)
          }
        case None => client ! Status.Failure(NotFoundException("No library with that name"))
      }

    case GetFileById(id) =>
      val client = sender()
      paths.find { case (_, identifier) => identifier == id }.map(_._1) match {
        case Some(path) =>
          libraries.get(path.subpath(0, 1).toString).map(_._1) match {
            case Some(actorRef) => actorRef forward LibraryActor.GetFile(path)
            case None =>
              logger.warning(s"Couldn't find the corresponding library if id ($id). Path is: $path")
              client ! Status.Failure(NotFoundException("No file with that id"))
              self ! Purge(Seq(path))
          }
        case _ => client ! Status.Failure(NotFoundException("No file with that id"))
      }

    case ScanLibrary(name) =>
      libraries.get(name).map(_._1) match {
        case Some(actorRef) => actorRef forward LibraryActor.Scan
        case None => sender() ! Status.Failure(NotFoundException("No library with that name"))
      }

    case AddLibrary(library) =>
      if (library.name == "") {
        sender() ! valError("name", "required")
      } else if (library.name.contains(":")) {
        sender() ! valError("name", "pattern")
      } else if (libraries.keys.exists(_ == library.name)) {
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
      }  else if (libraries.values.map(_._2.path).exists(_ == library.path)) {
        sender() ! valError("path", "alreadyExists")
      } else if (libraries.values.map(_._2.path).exists(path => path.startsWith(library.path) || library.path.startsWith(path))) {
        sender() ! valError("path", "noChildren")
      } else {
        val actorName = libraries.size + "-" + library.name.replaceAll("""[^0-9a-zA-Z-_\.\*\$\+:@&=,!~';]""", "")
        Try(context.actorOf(LibraryActor.props(library), actorName)) match {
          case Success(actorRef) =>
            context.watch(actorRef)
            libraries += (library.name -> (actorRef -> library))
            sender() ! library
          case Failure(cause) =>
            sender() ! valError("other", "failure", Some(cause.getMessage))
        }
      }

    case RemoveLibrary(name) =>
      libraries
        .get(name)
        .foreach { case (actorRef, library) =>
          context.stop(actorRef)
          libraries -= name
          paths --= paths.keys.filter(_.startsWith(library.name))
        }
      sender() ! Done

    case ProcessFiles(files, requester) =>
      val withIds = files.map { file =>
        if (paths.isDefinedAt(file.path)) {
          file.withId(paths(file.path))
        } else {
          file.withId(ShortId.generate())
        }
      }
      requester ! withIds
      withIds.foreach(file => paths += (file.path -> file.id))

    case Terminated(_) => // libraries -= actorRef

    case Purge =>
      // First delete ids for paths that don't belong to any library
      val pathsToDelete = paths.collect{ case (path, _) if libraries.get(path.subpath(0, 1).toString).isEmpty => path }
      paths --= pathsToDelete
      // Then request each file to its corresponding library
      val f1: Iterable[Future[(Path, Try[LibraryFile])]] = paths.map{ case (path, _) =>
        (libraries(path.subpath(0, 1).toString)._1 ? LibraryActor.GetFile(path))(2.seconds)
          .mapTo[LibraryFile]
          .map(f => (path, Success(f)))
          .recover{ case x => (path, Failure(x)) }
      }
      // Collect the failed future and get the corresponding id
      val f2: Future[Iterable[Path]] = Future.sequence(f1).map(_.collect{ case (path, Failure(NotFoundException(_))) => path })
      f2.map(r => Purge(r.toSeq)).foreach(self ! _)

    case Purge(pathsToPurge) => paths --= pathsToPurge

  }

  def valError(control: String, code: String, value: Option[String] = None) =
    Status.Failure(ValidationErrorException(control, code, value))

  override def supervisorStrategy: SupervisorStrategy = OneForOneStrategy() {
    case _: ActorInitializationException => Stop
    case _: ActorKilledException         => Stop
    case _: DeathPactException           => Stop
    case _: Exception                    => Restart
  }

}
