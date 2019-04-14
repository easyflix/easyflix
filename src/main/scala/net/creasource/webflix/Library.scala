package net.creasource.webflix

import java.nio.file.Path

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

  implicit val reader: RootJsonReader[Library] = { js: JsValue =>
      val obj = js.asJsObject
      obj.fields.get("type") match {
        case Some(JsString("library")) =>
        case _ => throw DeserializationException("Invalid or missing type attribute", fieldNames = List("type"))
      }
      val name = obj.fields("name").convertTo[String]
      val path = obj.fields("path").convertTo[Path]
      Library(name, path)
  }

  implicit val format: RootJsonFormat[Library] = rootJsonFormat(reader, writer)

}
