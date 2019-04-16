package net.creasource.webflix

import java.nio.file.Path

import net.creasource.json.JsonSupport
import spray.json._

case class LibraryFile(name: String, path: Path, isDirectory: Boolean, size: Long, lastModified: Long)

object LibraryFile extends JsonSupport {
  implicit val format: RootJsonFormat[LibraryFile] = jsonFormat5(LibraryFile.apply)
}
