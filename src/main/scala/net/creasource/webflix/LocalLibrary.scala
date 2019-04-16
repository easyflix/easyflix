package net.creasource.webflix

import java.nio.file.Path

import akka.NotUsed
import akka.http.scaladsl.server.directives.ContentTypeResolver
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.alpakka.file.scaladsl.{Directory, DirectoryChangesSource}
import akka.stream.scaladsl.Source

import scala.concurrent.duration._

case class LocalLibrary(id: String, name: String, path: Path, pollInterval: FiniteDuration = 1.second) extends Library with Library.Watchable {

  require(path.isAbsolute, "Path must be absolute")

  override def scan(path: Path)(implicit contentTypeResolver: ContentTypeResolver): Source[LibraryFile, NotUsed] = {
    if (path.isAbsolute & !path.startsWith(this.path)) throw new IllegalArgumentException("")
    Directory.walk(this.path.resolve(path)).map(path => {
      val file = path.toFile
      Option(file.isDirectory || file.isFile & contentTypeResolver(file.getName).mediaType.isVideo).collect{
        case true => LibraryFile(file.getName, path, file.isDirectory, file.length(), file.lastModified())
      }
    }).collect{ case option if option.isDefined => option.get }
  }

  override def watch(path: Path): Source[(LibraryFile, DirectoryChange), NotUsed] = {
    if (path.isAbsolute & !path.startsWith(this.path)) throw new IllegalArgumentException("")
    DirectoryChangesSource(this.path.resolve(path), pollInterval, maxBufferSize = 1000).map {
      case (p, directoryChange) =>
        val file = p.toFile
        (LibraryFile(file.getName, p, file.isDirectory, file.length(), file.lastModified()), directoryChange)
    }
  }

}
