package net.creasource.webflix

import java.nio.file.{Path, Paths}

import net.creasource.json.JsonSupport
import spray.json._

case class Library(name: String, path: Path)

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
