package net.creasource.webflix.actors

import java.nio.file.Path

import akka.actor.{Actor, Props}
import akka.event.Logging
import akka.http.scaladsl.server.directives.ContentTypeResolver
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.scaladsl.{Keep, Sink}
import akka.stream.{KillSwitches, SharedKillSwitch, UniqueKillSwitch}
import net.creasource.Application
import net.creasource.webflix.{Library, LibraryFile}

import scala.util.{Failure, Success}

object LibraryActor2 {

  case object GetFiles
  case class GetFile(path: Path)

  case object Scan
  sealed trait ScanResult
  case class ScanSuccess(files: Seq[LibraryFile]) extends ScanResult
  case class ScanFailure(cause: Throwable) extends ScanResult

  def props(library: Library)(implicit app: Application): Props = Props(new LibraryActor2(library))

}

class LibraryActor2(library: Library)(implicit app: Application) extends Actor {

  import LibraryActor2._
  import app.materializer
  import context.dispatcher

  val logger = Logging(context.system, this)

  var files: Map[Path, LibraryFile] = Map.empty

  val killSwitch: SharedKillSwitch = KillSwitches.shared(library.name)

  var foldersKillSwitches: Map[Path, UniqueKillSwitch] = Map.empty

  implicit val contentTypeResolver: ContentTypeResolver = ContentTypeResolver.Default

  case class ScanComplete(path: Path)

  case class WatchComplete(path: Path)

  def common: Receive = {

    case GetFiles => sender() ! files.values.toSeq

    case GetFile(path) => sender() ! files.get(path)

    case file: LibraryFile => files += (file.path -> file)

    case (file: LibraryFile, DirectoryChange.Creation) =>
      logger.info(s"File created: ${file.path}")
      files += (file.path -> file)
      if (file.isDirectory) {
        // Watch it
        library match {
          case lib: Library.Watchable =>
            val ks = lib
              .watch(file.path)
              .via(killSwitch.flow)
              .viaMat(KillSwitches.single)(Keep.right)
              .to(Sink.actorRef(self, WatchComplete(file.path)))
              .run()
            foldersKillSwitches += (file.path -> ks)
          case _ =>
        }
        // Scan it
        library
          .scan(file.path)
          .via(killSwitch.flow)
          .to(Sink.actorRef(self, ScanComplete(file.path)))
          .run()
      }

    case (file: LibraryFile, DirectoryChange.Deletion) =>
      files -= file.path
      if (file.isDirectory) {
        // Stop watching it
        foldersKillSwitches.get(file.path).foreach(_.shutdown())
        foldersKillSwitches -= file.path
        // Delete children
        val children = files.values.filter(_.path.startsWith(file.path)).map(_.path)
        files --= children
        logger.info(s"Folder and ${children.toSeq.length} children deleted: ${file.path}")
      } else {
        logger.info(s"File deleted: ${file.path}")
      }

    case (file: LibraryFile, DirectoryChange.Modification) => files += (file.path -> file)

    case WatchComplete(folder) => logger.info(s"Stopped watching: $folder")

  }

  def ready: Receive = common orElse {

    case Scan =>
      val client = sender()
      library.scan()
        .via(killSwitch.flow)
        .alsoTo(Sink.actorRef(self, ScanComplete(library.path)))
        .alsoTo(Sink.foreach {
          case file if file.isDirectory & library.isInstanceOf[Library.Watchable] & foldersKillSwitches.get(file.path).isEmpty =>
            logger.info(s"Watching: ${file.path}")
            val ks = library.asInstanceOf[Library.Watchable]
              .watch(file.path)
              .via(killSwitch.flow)
              .viaMat(KillSwitches.single)(Keep.right)
              .to(Sink.actorRef(self, WatchComplete(file.path)))
              .run()
            foldersKillSwitches += (file.path -> ks)
          case _ =>
        })
        .runWith(Sink.seq)
        .onComplete {
          case Success(scannedFiles) => client ! ScanSuccess(scannedFiles)
          case Failure(exception) => client ! ScanFailure(exception)
        }
      context become scanning

    case ScanComplete(folder) => logger.info(s"Scan complete: $folder")

  }

  def scanning: Receive = common orElse {

    case Scan => sender() ! ScanFailure(new Exception())

    case ScanComplete(path) if path == library.path =>
      logger.info(s"Library scan complete: $path")
      context become ready

    case ScanComplete(folder) => logger.info(s"Scan complete: $folder")

  }

  override def receive: Receive = ready

  override def postStop(): Unit = {
    killSwitch.shutdown()
    foldersKillSwitches.values.foreach(_.shutdown())
  }

}
