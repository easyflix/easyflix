package net.creasource.web

import java.nio.file.{Path, Paths}

import akka.NotUsed
import akka.actor.{Actor, Props}
import akka.stream.alpakka.file.scaladsl.Directory
import akka.stream.scaladsl.Source
import me.nimavat.shortid.ShortId
import net.creasource.core.Application
import net.creasource.model._

object LibraryActor {

  case object GetLibraries

  case class GetLibraryFile(id: String)
  case object GetLibraryFiles

  case class ScanLibrary(library: Library)

  def props()(implicit application: Application): Props = Props(new LibraryActor)

}

class LibraryActor()(implicit val application: Application) extends Actor {

  import LibraryActor._
  import application.materializer
  import context.dispatcher

  var libraries: Seq[Library] = Seq(Library("Vidéos", Paths.get("D:/Vidéos")))

  var libraryFiles: Map[String, LibraryFile] = Map.empty

  case class AddLibraryFile(file: LibraryFile)

  override def receive: Receive = {

    case AddLibraryFile(file) => libraryFiles += (file.id -> file)

    case GetLibraries => sender ! libraries

    case GetLibraryFiles => sender ! libraryFiles.values.toSeq

    case GetLibraryFile(id) => sender ! libraryFiles.get(id)

    case ScanLibrary(library) =>
      def getParentPathRelativeToLibrary(path: Path) = {
        Paths.get(library.name).resolve(library.path.relativize(path)).getParent
      }
      val source: Source[Path, NotUsed] = Directory.walk(library.path)
      val f = source
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
        .runForeach(file => {
          println(file)
          self ! AddLibraryFile(file)
        })
      val s = sender()
      f foreach (s ! _)
  }

}
