package net.creasource.model

import java.nio.file.{Path, Paths}

import me.nimavat.shortid.ShortId
import net.creasource.web.JsonSupport
import spray.json._

case class Library(name: String, path: Path)

sealed trait LibraryFile {
  val id: String
  val name: String
  val parent: Path
  val filePath: Path
}
case class Folder(id: String, name: String, parent: Path, filePath: Path) extends LibraryFile
case class Video(id: String, name: String, parent: Path, size: Long, filePath: Path) extends LibraryFile

object Video {
  def apply(name: String, parent: Path, size: Long, filePath: Path): Video =
    Video(ShortId.generate(), name, parent, size, filePath)
}

object Folder {
  def apply(name: String, parent: Path, filePath: Path): Folder =
    Folder(ShortId.generate(), name, parent, filePath)
}

object Library extends JsonSupport {
  implicit val writer: RootJsonWriter[Library] = {
    case Library(name, path) => JsObject(
      "type" -> "library".toJson,
      "name" -> name.toJson,
      "path" -> path.toString.toJson
    )
  }
  implicit val reader: RootJsonReader[Library] = {
    case obj: JsObject =>
      obj.fields.get("type") match {
        case Some(JsString("library")) =>
        case _ => throw new UnsupportedOperationException("Invalid or missing type attribute")
      }
      val name = obj.fields.get("name") match {
        case Some(JsString(n)) => n
        case _ => throw new UnsupportedOperationException("Invalid or missing name attribute")
      }
      val path = obj.fields.get("path") match {
        case Some(JsString(p)) =>
          try {
            Paths.get(p)
          } catch {
            case e: Exception => throw new UnsupportedOperationException("Invalid path (" + e.getMessage + ")")
          }
        case _ => throw new UnsupportedOperationException("Invalid or missing path attribute")
      }
      Library(name, path)
    case _ => throw new UnsupportedOperationException("Invalid Library format")
  }
  implicit val format: RootJsonFormat[Library] = rootJsonFormat(reader, writer)
}

object LibraryFile extends JsonSupport {
  implicit val writer: RootJsonWriter[LibraryFile] = {
    case Folder(id, name, parent, _) => JsObject(
      "type" -> "folder".toJson,
      "id" -> id.toJson,
      "parent" -> (parent.toString.replaceAll("""\\""", "/") + "/").toJson,
      "name" -> name.toJson
    )
    case Video(id, name, parent, size, _) => JsObject(
      "type" -> "video".toJson,
      "id" -> id.toJson,
      "parent" -> (parent.toString.replaceAll("""\\""", "/") + "/").toJson,
      "name" -> name.toJson,
      "size" -> size.toJson
    )
  }
  implicit val format: RootJsonFormat[LibraryFile] = lift(writer)
}
