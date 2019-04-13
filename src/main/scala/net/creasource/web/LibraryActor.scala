package net.creasource.web

import java.nio.file.{Path, Paths}

import akka.actor.{Actor, Props}
import akka.event.Logging
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.alpakka.file.scaladsl.{Directory, DirectoryChangesSource}
import akka.stream.scaladsl.{Flow, Keep, Sink, Source}
import akka.stream.{KillSwitches, SharedKillSwitch, UniqueKillSwitch}
import akka.{Done, NotUsed}
import me.nimavat.shortid.ShortId
import net.creasource.core.Application
import net.creasource.model.{LibraryFile, _}
import spray.json._

import scala.collection.immutable.Seq
import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}

object LibraryActor extends JsonSupport {

  case object GetLibraries

  case class GetLibraryFile(id: String)
  case object GetLibraryFiles

  case class AddLibrary(library: Library)

  sealed trait AddLibraryResult
  case class AddLibrarySuccess(library: Library, files: Seq[LibraryFile]) extends AddLibraryResult
  case class AddLibraryError(control: String, code: String, value: Option[String]) extends AddLibraryResult
  object AddLibrarySuccess extends JsonSupport {
    implicit val writer: RootJsonWriter[AddLibrarySuccess] = (success: AddLibrarySuccess) =>
      JsObject("library" -> success.library.toJson, "files" -> success.files.toJson)
  }
  object AddLibraryError {
    def apply(control: String, code: String): AddLibraryError = apply(control, code, None)
    implicit val format: RootJsonFormat[AddLibraryError] = jsonFormat3(AddLibraryError.apply)
  }

  case class RemoveLibrary(name: String)
  sealed trait RemoveLibraryResult
  case object RemoveLibrarySuccess extends RemoveLibraryResult
  case class RemoveLibraryError(error: String) extends RemoveLibraryResult

  def props()(implicit application: Application): Props = Props(new LibraryActor)

}

class LibraryActor()(implicit val application: Application) extends Actor {

  import LibraryActor._
  import application.materializer
  import context.dispatcher

  private val logger = Logging(context.system, this)

  var libraries: Map[String, Library] = Map.empty

  var libraryFiles: Map[String, LibraryFile] = Map.empty

  var librariesKillSwitches: Map[String, SharedKillSwitch] = Map.empty

  var folderKillSwitches: Map[Path, UniqueKillSwitch] = Map.empty

  override def postStop(): Unit = {
    librariesKillSwitches.values.toSeq.foreach(_.shutdown())
  }

  override def receive: Receive = {

    case file: LibraryFile =>
      logger.info(s"New library file: ${file.filePath}")
      libraryFiles += (file.id -> file)

    case (path: Path, library: Library, DirectoryChange.Creation) =>
      for {
        library <- libraries.get(library.name) // Check that the library exists
        killSwitch <- librariesKillSwitches.get(library.name) // Check that the killSwitch exists
        _ <- Option(path.toFile.exists()).collect{ case true => () } // Check that the created file still exists
      } yield {
        libraryFiles.values.toSeq.find(_.filePath == path) match {
          case None =>
            for {
              file <- pathToLibraryFile(path, library)
            } yield {
              self ! file
              file match {
                case Folder(_, _, _, filePath) =>
                  scanFolder(filePath, library, killSwitch).runWith(Sink.ignore) // TODO submit to event bus
                case _ =>
              }
              // TODO submit to event bus
            }
          case _ => logger.warning("Got a creation message for a file already in library")
        }
      }

    case (path: Path, _: Library, DirectoryChange.Deletion) =>
      for {
        deletedFile <- libraryFiles.values.toSeq.find(_.filePath == path)
      } yield {
        libraryFiles -= deletedFile.id
        deletedFile match {
          case Folder(_, _, _, filePath) =>
            val childrenIds = libraryFiles.values.toSeq.filter(_.filePath.startsWith(filePath)).map(_.id)
            libraryFiles --= childrenIds
            logger.info(s"Folder and ${childrenIds.length} children deleted: $filePath")
            folderKillSwitches.get(filePath).foreach(_.shutdown())
            folderKillSwitches -= filePath
          case _ => logger.info(s"File deleted: ${deletedFile.filePath}")
        }
      }

    case GetLibraries => sender ! libraries.values.toSeq

    case GetLibraryFiles => sender ! libraryFiles.values.toSeq

    case GetLibraryFile(id) => sender ! libraryFiles.get(id)

    case AddLibrary(library) =>
      if (library.name == "") {
        sender() ! AddLibraryError("name", "required")
      } else if (library.name.contains(":")) {
        sender() ! AddLibraryError("name", "pattern")
      } else if (libraries.keys.toSeq.contains(library.name)) {
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
      }  else if (libraries.values.toSeq.map(_.path).contains(library.path)) {
        sender() ! AddLibraryError("path", "alreadyExists")
      } else if (libraries.values.toSeq.map(_.path).exists(path => path.startsWith(library.path) || library.path.startsWith(path))) {
        sender() ! AddLibraryError("path", "noChildren")
      } else {
        libraries += (library.name -> library)

        val killSwitch = KillSwitches.shared(library.name)
        librariesKillSwitches += (library.name -> killSwitch)

        val client = sender()
        scanFolder(library.path, library, killSwitch)
          .runWith(Sink.seq)
          .onComplete {
            case Success(files) => client ! AddLibrarySuccess(library, files)
            case Failure(exception) => client ! AddLibraryError("other", "failure", Some(exception.getMessage))
          }
      }

    case Done => logger.info("Scan complete")

    case akka.actor.Status.Failure(cause) => logger.error("Scan failed!", cause)

    case RemoveLibrary(libraryName) =>
      logger.info(s"Removing library: $libraryName")
      libraries -= libraryName
      librariesKillSwitches.get(libraryName).foreach(_.shutdown())
      librariesKillSwitches -= libraryName
      libraryFiles.foreach {
        case (_, Folder(_, _, parent, folderPath)) if parent.startsWith(libraryName) =>
          folderKillSwitches.get(folderPath).foreach(_.shutdown())
          folderKillSwitches -= folderPath
        case _ =>
      }
      libraryFiles = libraryFiles.filter {
        case (_, file) => !file.parent.startsWith(libraryName)
      }
      logger.info(s"libraryKillSwitches (${librariesKillSwitches.size}), folderKillSwitches (${folderKillSwitches.size})")
      sender() ! RemoveLibrarySuccess
  }

  def scanFolder(folder: Path, library: Library, killSwitch: SharedKillSwitch): Source[LibraryFile, NotUsed] = {
    watchFolder(folder, library, killSwitch)
    logger.info(s"Scanning folder: $folder")
    Directory.walk(folder)
      .filter(path => path != folder)
      .via(toLibraryFileFlow(library))
      .alsoTo(Sink.actorRef(self, Done))
      .alsoTo(Sink.foreach {
        case Folder(_, _, _, folderPath) => watchFolder(folderPath, library, killSwitch)
        case _ =>
      })
  }

  def watchFolder(folder: Path, library: Library, killSwitch: SharedKillSwitch): Try[Unit] = {
    logger.info(s"Watching folder $folder")
    Try {
      val (folderKillSwitch, future) = DirectoryChangesSource(folder, pollInterval = 2.seconds, maxBufferSize = 1000)
        .via(killSwitch.flow)
        .viaMat(KillSwitches.single)(Keep.right)
        .toMat(Sink.foreach {
          case (path, DirectoryChange.Creation) => self ! (path, library, DirectoryChange.Creation)
          case (path, DirectoryChange.Deletion) => self ! (path, library, DirectoryChange.Deletion)
          case _ =>
        })(Keep.both).run()
      if (folder != library.path) { // Prevent memory leak. In that case the shared killSwitch is enough.
        folderKillSwitches += (folder -> folderKillSwitch)
      }
      future.onComplete {
        case Success(Done) => logger.info(s"Stopped watching: $folder")
        case Failure(exception) => logger.warning(s"Error while watching folder $folder", exception)
      }
    }
  }

  def toLibraryFileFlow(library: Library): Flow[Path, LibraryFile, NotUsed] = {
    Flow[Path]
      .map(path => pathToLibraryFile(path, library))
      .collect { case Some(libraryFile) => libraryFile }
  }

  def pathToLibraryFile(path: Path, library: Library): Option[LibraryFile] = {
    def getParentPathRelativeToLibrary(path: Path) = {
      Paths.get(library.name).resolve(library.path.relativize(path)).getParent
    }
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
        filePath = path
      ))
    }
  }

}
