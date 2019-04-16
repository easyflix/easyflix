package net.creasource.webflix

import java.nio.file.Path

import akka.NotUsed
import akka.http.scaladsl.server.directives.ContentTypeResolver
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.scaladsl.Source
import net.creasource.json.JsonSupport

import scala.concurrent.duration.FiniteDuration

trait Library {
  val id: String
  val name: String
  val path: Path
  def scan()(implicit contentTypeResolver: ContentTypeResolver): Source[LibraryFile, NotUsed] = scan(path)
  def scan(path: Path)(implicit contentTypeResolver: ContentTypeResolver): Source[LibraryFile, NotUsed]
}

object Library extends JsonSupport {

  trait Watchable { self: Library =>
    val pollInterval: FiniteDuration
    def watch(): Source[(LibraryFile, DirectoryChange), NotUsed] = watch(path)
    def watch(path: Path): Source[(LibraryFile, DirectoryChange), NotUsed]
  }

}
