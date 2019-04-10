package net.creasource.web

import java.nio.file.{Path, Paths}

import akka.{Done, NotUsed}
import akka.actor.{Actor, Props}
import akka.stream.alpakka.file.scaladsl.Directory
import akka.stream.scaladsl.{Sink, Source}
import me.nimavat.shortid.ShortId
import net.creasource.core.Application
import net.creasource.model._

import scala.util.{Failure, Success}

object LibraryActor {

  case object GetLibraries

  case class GetLibraryFile(id: String)
  case object GetLibraryFiles

  case class AddLibrary(library: Library)
  sealed trait AddLibraryResult
  case class AddLibrarySuccess(library: Library) extends AddLibraryResult
  case class AddLibraryError(error: String) extends AddLibraryResult

  case class RemoveLibrary(name: String)
  sealed trait RemoveLibraryResult
  case object RemoveLibrarySuccess extends RemoveLibraryResult
  case class RemoveLibraryError(error: String) extends RemoveLibraryResult

//  case class ScanLibrary(library: Library)

  def props()(implicit application: Application): Props = Props(new LibraryActor)

}

class LibraryActor()(implicit val application: Application) extends Actor {

  import LibraryActor._
  import application.materializer
  import context.dispatcher

  var libraries: Seq[Library] = Seq.empty

  var libraryFiles: Map[String, LibraryFile] = Map.empty

  case class AddLibraryFile(file: LibraryFile)

  override def receive: Receive = {

    case AddLibraryFile(file) => libraryFiles += (file.id -> file)

    case GetLibraries => sender ! libraries

    case GetLibraryFiles => sender ! libraryFiles.values.toSeq

    case GetLibraryFile(id) => sender ! libraryFiles.get(id)

/*    case ScanLibrary(library) =>
      val f: Future[Done] = scanLibrary(library).runWith(Sink.ignore)
      val s = sender()
      f foreach (s ! _)*/

    case AddLibrary(library) =>
      if (library.name == "") {
        sender() ! AddLibraryError("Library name is empty")
      } else if (libraries.map(_.name).contains(library.name)) {
        sender() ! AddLibraryError("A library with that name already exists")
      } else if (library.path.toString == "") {
        sender() ! AddLibraryError("Library path is empty")
      } else if (!library.path.toFile.exists) {
        sender() ! AddLibraryError("Library path does not exist")
      } else if (!library.path.toFile.isDirectory) {
        sender() ! AddLibraryError("Library path is not a directory")
      } else if (!library.path.toFile.canRead) {
        sender() ! AddLibraryError("Library path is not readable")
      }  else if (libraries.map(_.path).contains(library.path)) {
        sender() ! AddLibraryError("A library with that path already exists")
      } else {
        libraries +:= library
        val s = sender()
        scanLibrary(library).runWith(Sink.ignore).onComplete {
          case Success(Done) => s ! AddLibrarySuccess(library)
          case Failure(exception) => s ! AddLibraryError(s"An error occurred while scanning library: ${exception.getMessage}")
        }
      }

    case RemoveLibrary(name) =>
      libraries.find(_.name == name).foreach(lib => libraries = libraries.diff(Seq(lib)))
      libraryFiles = libraryFiles.filter {
        case (_, file) => !file.parent.startsWith(name)
      }
      sender() ! RemoveLibrarySuccess
  }

  def scanLibrary(library: Library): Source[LibraryFile, NotUsed] = {
    def getParentPathRelativeToLibrary(path: Path) = {
      Paths.get(library.name).resolve(library.path.relativize(path)).getParent
    }
    Directory.walk(library.path)
      .filter(path => path != library.path)
      .map(path => {
        val file = path.toFile
        if (file.isFile) {
          VideoFormat.getFormat(file) match {
            case Some(format) => Some(Video(
              parent = getParentPathRelativeToLibrary(path),
              name = file.getName,
              size = file.length,
              format = format,
              filePath = path
            ))
            case _ => None
          }
        } else {
          Some(Folder(
            id = ShortId.generate(),
            parent = getParentPathRelativeToLibrary(path),
            name = file.getName,
          ))
        }
      })
      .collect[LibraryFile] { case Some(libraryFile) => libraryFile }
      .alsoTo(Sink.foreach(file => {
        println(file)
        self ! AddLibraryFile(file)
      }))
  }

}
