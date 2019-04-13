package net.creasource.web

import java.nio.file.{Path, Paths}

import akka.NotUsed
import akka.actor.{Actor, Props}
import akka.event.Logging
import akka.http.scaladsl.server.directives.ContentTypeResolver
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.alpakka.file.scaladsl.{Directory, DirectoryChangesSource}
import akka.stream.scaladsl.{Flow, Keep, Sink, Source}
import akka.stream.{KillSwitches, SharedKillSwitch, UniqueKillSwitch}
import net.creasource.core.Application
import net.creasource.model.{LibraryFile, _}
import net.creasource.web.MediaTypesActor.GetContentTypeResolver
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

  var contentTypeResolver: ContentTypeResolver = _

  case class ScanComplete(folder: Path)
  case class WatchComplete(folder: Path)

  override def preStart(): Unit = {
    application.mediaTypesActor ! GetContentTypeResolver
  }

  override def postStop(): Unit = {
    librariesKillSwitches.values.toSeq.foreach(_.shutdown())
  }

  override def receive: Receive = {

    case resolver: ContentTypeResolver =>
      if (contentTypeResolver == null) {
        contentTypeResolver = resolver
      } else {
        logger.info("Content resolver update")
        contentTypeResolver = resolver
        // Rescan libraries
        libraries.values.toSeq.foreach(library =>
          scanFolder(library.path, library, librariesKillSwitches(library.name), resolver).runWith(Sink.ignore) // TODO submit to event stream
        )
        // Delete files that don't resolve to a video content-type anymore
        libraryFiles.values.toSeq.foreach {
          case Video(id, name, _, _, _) if !resolver(name).mediaType.isVideo => libraryFiles -= id // TODO submit to event stream
          case _ =>
        }
      }

    case file: LibraryFile =>
      if (libraryFiles.values.toSeq.exists(_.filePath == file.filePath)) {
        logger.info(s"Ignoring file already known: ${file.filePath}")
      } else {
        logger.info(s"New library file: ${file.filePath}")
        libraryFiles += (file.id -> file)
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
        scanFolder(library.path, library, killSwitch, contentTypeResolver)
          .runWith(Sink.seq)
          .onComplete {
            case Success(files) => client ! AddLibrarySuccess(library, files)
            case Failure(exception) => client ! AddLibraryError("other", "failure", Some(exception.getMessage))
          }
      }

    case ScanComplete(folder) => logger.info(s"Scan complete: $folder")

    case WatchComplete(folder) => logger.info(s"Stopped watching: $folder")

    case akka.actor.Status.Failure(cause) => logger.error("An error occurred!", cause)

    case RemoveLibrary(libraryName) =>
      if (libraries.get(libraryName).isDefined) {
        logger.info(s"Removing library: $libraryName")
        librariesKillSwitches.get(libraryName).foreach(_.shutdown())
        librariesKillSwitches -= libraryName
        libraryFiles.foreach {
          case (_, Folder(_, _, _, folderPath)) if folderPath.startsWith(libraries(libraryName).path) =>
            folderKillSwitches.get(folderPath).foreach(_.shutdown())
            folderKillSwitches -= folderPath
          case _ =>
        }
        folderKillSwitches.get(libraries(libraryName).path).foreach(_.shutdown())
        libraryFiles = libraryFiles.filter {
          case (_, file) => !file.filePath.startsWith(libraries(libraryName).path)
        }
        libraries -= libraryName
        logger.info(s"libraryKillSwitches (${librariesKillSwitches.size}), folderKillSwitches (${folderKillSwitches.size})")
      }
      sender() ! RemoveLibrarySuccess

    case (path: Path, library: Library, DirectoryChange.Creation) =>
      for {
        library <- libraries.get(library.name) // Check that the library exists
        killSwitch <- librariesKillSwitches.get(library.name) // Check that the killSwitch exists
        _ <- Option(path.toFile.exists()).collect{ case true => () } // Check that the created file still exists
      } yield {
        libraryFiles.values.toSeq.find(_.filePath == path) match {
          case None =>
            for {
              file <- pathToLibraryFile(path, library, contentTypeResolver)
            } yield {
              self ! file
              file match {
                case Folder(_, _, _, filePath) => scanFolder(filePath, library, killSwitch, contentTypeResolver).runWith(Sink.ignore) // TODO submit to event bus
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
  }

  def scanFolder(folder: Path, library: Library, killSwitch: SharedKillSwitch, contentTypeResolver: ContentTypeResolver): Source[LibraryFile, NotUsed] = {
    watchFolder(folder, library, killSwitch)
    logger.info(s"Scanning folder: $folder")
    Directory.walk(folder)
      .filter(path => path != folder)
      .via(toLibraryFileFlow(library, contentTypeResolver))
      .alsoTo(Sink.actorRef(self, ScanComplete(folder)))
      .alsoTo(Sink.foreach {
        case Folder(_, _, _, folderPath) => watchFolder(folderPath, library, killSwitch)
        case _ =>
      })
  }

  def watchFolder(folder: Path, library: Library, killSwitch: SharedKillSwitch): Try[Unit] = {
    if (folderKillSwitches.get(folder).isEmpty) {
      logger.info(s"Watching folder $folder")
      Try {
        val folderKillSwitch = DirectoryChangesSource(folder, pollInterval = 2.seconds, maxBufferSize = 1000)
          .via(killSwitch.flow)
          .viaMat(KillSwitches.single)(Keep.right)
          .map { case (path, directoryChange) => (path, library, directoryChange) }
          .toMat(Sink.actorRef(self, WatchComplete(folder)))(Keep.left)
          .run()
        folderKillSwitches += (folder -> folderKillSwitch)
      }
    } else {
      logger.info(s"Already Watching folder $folder")
      Try(())
    }
  }

  def toLibraryFileFlow(library: Library, contentTypeResolver: ContentTypeResolver): Flow[Path, LibraryFile, NotUsed] = {
    Flow[Path]
      .map(path => pathToLibraryFile(path, library, contentTypeResolver))
      .collect { case Some(libraryFile) => libraryFile }
  }

  def pathToLibraryFile(path: Path, library: Library, contentTypeResolver: ContentTypeResolver): Option[LibraryFile] = {
    def getParentPathRelativeToLibrary(path: Path) = {
      Paths.get(library.name).resolve(library.path.relativize(path)).getParent
    }
    val file = path.toFile
    if (file.isFile) {
      if (contentTypeResolver(file.getName).mediaType.isVideo) {
        Some(Video(
          parent = getParentPathRelativeToLibrary(path),
          name = file.getName,
          size = file.length,
          filePath = path
        ))
      } else {
        None
      }
    } else {
      Some(Folder(
        parent = getParentPathRelativeToLibrary(path),
        name = file.getName,
        filePath = path
      ))
    }
  }

}
