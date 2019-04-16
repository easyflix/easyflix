package net.creasource.webflix

import java.nio.file.Path

import akka.NotUsed
import akka.http.scaladsl.server.directives.ContentTypeResolver
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.alpakka.file.scaladsl.{Directory, DirectoryChangesSource}
import akka.stream.scaladsl.Source
import net.creasource.json.JsonSupport
import spray.json._
import scala.concurrent.duration._

import scala.concurrent.duration.FiniteDuration

sealed trait Library {
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

  case class Local(name: String, path: Path, pollInterval: FiniteDuration = 1.second) extends Library with Library.Watchable {

    // require(path.isAbsolute, "Path must be absolute")

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

  case class FTP(name: String, path: Path) extends Library {
    override def scan(path: Path)(implicit contentTypeResolver: ContentTypeResolver): Source[LibraryFile, NotUsed] = ???
  }

  case class S3(name: String, path: Path) extends Library {
    override def scan(path: Path)(implicit contentTypeResolver: ContentTypeResolver): Source[LibraryFile, NotUsed] = ???
  }

  object Local {
    implicit val reader: RootJsonReader[Local] = js => {
      val obj = js.asJsObject
      val name = obj.fields("name").convertTo[String]
      val path = obj.fields("path").convertTo[Path]
      Local(name, path) // TODO must ensure that path is absolute
    }
    implicit val writer: RootJsonWriter[Local] = local => JsObject(
      "type" -> "local".toJson,
      "name" -> local.name.toJson,
      "path" -> local.path.toJson
    )
    implicit val format: RootJsonFormat[Local] = rootJsonFormat(reader, writer)
  }

  object FTP {
    implicit val reader: RootJsonReader[FTP] = ???
    implicit val writer: RootJsonWriter[FTP] = ???
    implicit val format: RootJsonFormat[FTP] = rootJsonFormat(reader, writer)
  }

  object S3 {
    implicit val reader: RootJsonReader[S3] = ???
    implicit val writer: RootJsonWriter[S3] = ???
    implicit val format: RootJsonFormat[S3] = rootJsonFormat(reader, writer)
  }

  implicit val writer: RootJsonWriter[Library] = {
    case library: Local => library.toJson
    case library: FTP => library.toJson
    case library: S3 => library.toJson
  }

  implicit val reader: RootJsonReader[Library] = js =>
    js.asJsObject.fields("type").convertTo[String] match {
      case "local" => js.convertTo[Local]
      case "ftp" => js.convertTo[FTP]
      case "s3" => js.convertTo[S3]
      case _ => throw DeserializationException("Only local, ftp and s3 library types are supported", fieldNames = List("type"))
    }

  implicit val format: RootJsonFormat[Library] = rootJsonFormat(reader, writer)

}
