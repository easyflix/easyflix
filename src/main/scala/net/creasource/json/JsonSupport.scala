package net.creasource.json

import java.nio.file.{Path, Paths}

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import akka.http.scaladsl.model.MediaType.NotCompressible
import akka.http.scaladsl.model._
import akka.util.ByteString
import spray.json._

trait JsonSupport extends SprayJsonSupport with DefaultJsonProtocol {

  implicit val httpHeaderWriter: RootJsonWriter[HttpHeader] = header => {
    JsObject(
      "name" -> JsString(header.name()),
      "value" -> JsString(header.value())
    )
  }

  implicit val httpResponseWriter: RootJsonWriter[HttpResponse] = response => JsObject(
    "status" -> JsNumber(response.status.intValue),
    "statusText" -> JsString(response.status.reason),
    "entity" -> (response.entity match {
      case HttpEntity.Strict(ct@ContentTypes.`application/json`, body) => JsonParser(body.decodeString(ct.charset.value))
      case HttpEntity.Strict(ct@ContentTypes.`text/plain(UTF-8)`, body) => JsString(body.decodeString(ct.charset.value))
      case _ => throw new UnsupportedOperationException("Only strict application/json and text/plain endpoints are supported.")
    })
    //"headers" -> JsArray(obj.headers.map(_.toJson).toVector)
  )

  implicit val httpRequestReader: RootJsonReader[HttpRequest] = json => {
    val js = json.asJsObject
    val method = js.fields("method").convertTo[String] match {
      case "GET" => HttpMethods.GET
      case "POST" => HttpMethods.POST
      case "PUT" => HttpMethods.PUT
      case "DELETE" => HttpMethods.DELETE
      case "OPTIONS" => HttpMethods.OPTIONS
      case "HEAD" => HttpMethods.HEAD
      case m => throw DeserializationException(msg = s"Method $m is not supported.", fieldNames = List("method"))
    }
    val uri = Uri(js.fields("url").convertTo[String])
    val entity = js.fields.get("entity") match {
      case None => HttpEntity.Empty
      case Some(value: JsValue) => HttpEntity.Strict(ContentTypes.`application/json`, ByteString(value.compactPrint))
    }
    HttpRequest(method = method, uri = uri, entity = entity)
  }

  //implicit def immSeqWriter[T: JsonWriter]: RootJsonWriter[Seq[T]] = (obj: Seq[T]) => JsArray(obj.map(_.toJson).toVector)

  implicit val mediaTypeWriter: RootJsonWriter[MediaType.Binary] = mediaType => JsObject(
    "subType" -> mediaType.subType.toJson,
    "extensions" -> mediaType.fileExtensions.toJson
  )

  implicit val mediaTypeReader: RootJsonReader[MediaType.Binary] = { js: JsValue =>
    val obj = js.asJsObject
    val subType = obj.fields("subType").convertTo[String]
    val extensions = obj.fields("extensions").convertTo[List[String]]
    MediaType.video(subType, NotCompressible, extensions: _*)
  }

  implicit val mediaTypeFormat: RootJsonFormat[MediaType.Binary] = rootJsonFormat(mediaTypeReader, mediaTypeWriter)

  implicit val pathReader: RootJsonReader[Path] = {
    case JsString(path) => Paths.get(path)
    case _ => throw DeserializationException("Path must be a string")
  }

  implicit val pathWriter: RootJsonWriter[Path] = path => path.toString.toJson

  implicit val pathFormat: RootJsonFormat[Path] = rootJsonFormat(pathReader, pathWriter)

}

object JsonSupport extends JsonSupport
