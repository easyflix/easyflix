package net.creasource.webflix

import java.nio.file.Path

import me.nimavat.shortid.ShortId
import net.creasource.json.JsonSupport
import spray.json._

sealed trait LibraryFile {
  val id: String
  val name: String
  val parent: Path
  val filePath: Path
}

object LibraryFile extends JsonSupport {

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
