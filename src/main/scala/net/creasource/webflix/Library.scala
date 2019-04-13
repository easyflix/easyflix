package net.creasource.webflix

import java.nio.file.{Path, Paths}

import net.creasource.json.JsonSupport
import spray.json._

import scala.util.{Failure, Success, Try}

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
        case _ => throw DeserializationException("Invalid or missing type attribute", fieldNames = List("type"))
      }
      val name = obj.fields.get("name") match {
        case Some(JsString(n)) => n
        case _ => throw DeserializationException("Invalid or missing name attribute", fieldNames = List("name"))
      }
      val path = obj.fields.get("path") match {
        case Some(JsString(p)) =>
          Try(Paths.get(p)) match {
            case Success(value) => value
            case Failure(e) => throw DeserializationException("Invalid path (" + e.getMessage + ")", fieldNames = List("path"))
          }
        case _ => throw DeserializationException("Invalid or missing path attribute", fieldNames = List("path"))
      }
      Library(name, path)
    case _ => throw DeserializationException("Invalid Library format")
  }

  implicit val format: RootJsonFormat[Library] = rootJsonFormat(reader, writer)

}
