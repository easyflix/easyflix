package net.creasource.model

import java.net.URL
import java.nio.file.Path

import net.creasource.model.VideoFormat.VideoFormat
import spray.json._
import spray.json.DefaultJsonProtocol._

sealed trait LibraryFile

case class Library(path: Path, name: String, numberOfVideos: Short) extends LibraryFile

case class Folder(path: Path, name: String, parent: Path, numberOfVideos: Short) extends LibraryFile

case class Video(path: Path, name: String, parent: Path, size: Long, url: URL, format: VideoFormat) extends LibraryFile

object LibraryFile {
  implicit val formatter: RootJsonWriter[LibraryFile] = {
    case Library(path, name, numberOfVideos) => JsObject(
      "type" -> "library".toJson,
      "path" -> path.toString.toJson,
      "name" -> name.toString.toJson,
      "numberOfVideos" -> numberOfVideos.toJson
    )
    case Folder(path, name, parent, numberOfVideos) => JsObject(
      "type" -> "folder".toJson,
      "path" -> path.toString.toJson,
      "name" -> name.toString.toJson,
      "parent" -> parent.toString.toJson,
      "numberOfVideos" -> numberOfVideos.toJson
    )
    case Video(path, name, parent, size, url, format) => JsObject(
      "type" -> "file".toJson,
      "path" -> JsString(path.toString),
      "name" -> name.toJson,
      "parent" -> parent.toString.toJson,
      "size" -> size.toJson,
      "url" -> url.toString.toJson,
      "format" -> format.toString.toJson
    )
  }
}
