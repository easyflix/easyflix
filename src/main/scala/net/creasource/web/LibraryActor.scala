package net.creasource.web

import java.nio.file.{Path, Paths}

import akka.actor.{Actor, Props}
import akka.event.Logging
import akka.stream.alpakka.file.scaladsl.Directory
import akka.stream.scaladsl.{Flow, Sink, Source}
import akka.{Done, NotUsed}
import me.nimavat.shortid.ShortId
import net.creasource.core.Application
import net.creasource.model.{LibraryFile, _}
import spray.json._

import scala.collection.immutable.Seq
import scala.util.{Failure, Success}

object LibraryActor extends JsonSupport {

  case object GetLibraries

  case class GetLibraryFile(id: String)
  case object GetLibraryFiles

  case class AddLibrary(library: Library)
  sealed trait AddLibraryResult
  case class AddLibrarySuccess(library: Library, files: Seq[LibraryFile]) extends AddLibraryResult

  object AddLibrarySuccess extends JsonSupport {
    implicit val writer: RootJsonWriter[AddLibrarySuccess] = (success: AddLibrarySuccess) =>
      JsObject("library" -> success.library.toJson, "files" -> success.files.toJson)
  }

  case class AddLibraryError(control: String, code: String, value: Option[String]) extends AddLibraryResult

  object AddLibraryError {
    def apply(control: String, code: String): AddLibraryError = apply(control, code, None)
    implicit val format: RootJsonFormat[AddLibraryError] = jsonFormat3(AddLibraryError.apply)
  }

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

  private val logger = Logging(context.system, this)

  var libraries: Seq[Library] = Seq.empty

  var libraryFiles: Map[String, LibraryFile] = Map.empty

  override def receive: Receive = {

    case file: LibraryFile => libraryFiles += (file.id -> file)

    case GetLibraries => sender ! libraries

    case GetLibraryFiles => sender ! libraryFiles.values.toSeq

    case GetLibraryFile(id) => sender ! libraryFiles.get(id)

/*    case ScanLibrary(library) =>
      val f: Future[Done] = scanLibrary(library).runWith(Sink.ignore)
      val s = sender()
      f foreach (s ! _)*/

    case AddLibrary(library) =>
      if (library.name == "") {
        sender() ! AddLibraryError("name", "required")
      } else if (library.name.contains(":")) {
        sender() ! AddLibraryError("name", "pattern")
      } else if (libraries.map(_.name).contains(library.name)) {
        sender() ! AddLibraryError("name", "alreadyExists")
      } else if (library.path.toString == "") {
        sender() ! AddLibraryError("path", "required")
      } else if (!library.path.isAbsolute) {
        sender() ! AddLibraryError("path", "notAbsolute")
      } else if (!library.path.toFile.exists) {
        sender() ! AddLibraryError("path", "doesNotExist")
      } else if (!library.path.toFile.isDirectory) {
        sender() ! AddLibraryError("path", "notDirectory")
      } else if (!library.path.toFile.canRead) {
        sender() ! AddLibraryError("path", "notReadable")
      }  else if (libraries.map(_.path).contains(library.path)) {
        sender() ! AddLibraryError("path", "alreadyExists")
      } else if (libraries.map(_.path).exists(path => path.startsWith(library.path) || library.path.startsWith(path))) {
        sender() ! AddLibraryError("path", "noChildren")
      } else {
        libraries +:= library
        val client = sender()
        logger.info(s"Scanning library: ${library.path}")
        scanLibrary(library)
          .alsoTo(Sink.actorRef(self, Done)) // Sink.foreach(file => self ! AddLibraryFile(file)))
          .runWith(Sink.seq)
          .onComplete {
            case Success(files) => client ! AddLibrarySuccess(library, files)
            case Failure(exception) => client ! AddLibraryError("other", "failure", Some(exception.getMessage))
          }
      }

    case Done => logger.info("Scan complete")

    case akka.actor.Status.Failure(cause) => logger.error("Scan failed!", cause)

    case RemoveLibrary(name) =>
      libraries.find(_.name == name).foreach(lib => libraries = libraries.diff(Seq(lib)))
      libraryFiles = libraryFiles.filter {
        case (_, file) => !file.parent.startsWith(name)
      }
      sender() ! RemoveLibrarySuccess
  }

  def scanLibrary(library: Library): Source[LibraryFile, NotUsed] = {
    Directory.walk(library.path)
      .filter(path => path != library.path)
      .via(toLibraryFileFlow(library))
  }

  def toLibraryFileFlow(library: Library): Flow[Path, LibraryFile, NotUsed] = {
    def getParentPathRelativeToLibrary(path: Path) = {
      Paths.get(library.name).resolve(library.path.relativize(path)).getParent
    }
    Flow[Path]
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
  }

}
