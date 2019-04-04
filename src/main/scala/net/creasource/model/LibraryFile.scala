package net.creasource.model

import java.nio.file.Path

import me.nimavat.shortid.ShortId
import net.creasource.model.VideoFormat.VideoFormat
import spray.json.DefaultJsonProtocol._
import spray.json._

case class Library(name: String, path: Path)

sealed trait LibraryFile
case class Folder(name: String, parent: Path) extends LibraryFile
case class Video(id: String, name: String, parent: Path, size: Long, format: VideoFormat) extends LibraryFile

object Video {
  def apply(name: String, parent: Path, size: Long, format: VideoFormat): Video =
    Video(ShortId.generate(), name, parent, size, format)
}

object Library {
  implicit val formatter: RootJsonWriter[Library] = {
    case Library(name, path) => JsObject(
      "type" -> "library".toJson,
      "name" -> name.toJson,
      "path" -> path.toString.toJson
    )
  }
}

object LibraryFile {
  implicit val formatter: RootJsonWriter[LibraryFile] = {
    case Folder(name, parent) => JsObject(
      "type" -> "folder".toJson,
      "parent" -> parent.toString.replaceAll("""\\""", "/").toJson,
      "name" -> name.toJson
    )
    case Video(id, name, parent, size, format) => JsObject(
      "type" -> "video".toJson,
      "id" -> id.toJson,
      "parent" -> parent.toString.replaceAll("""\\""", "/").toJson,
      "name" -> name.toJson,
      "size" -> size.toJson,
      "format" -> format.toString.toJson
    )
  }
}
