package net.creasource.json

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import akka.http.scaladsl.model.MediaType.NotCompressible
import akka.http.scaladsl.model._
import akka.util.ByteString
import spray.json._

trait JsonSupport extends SprayJsonSupport with DefaultJsonProtocol {

  implicit val httpHeaderWriter: RootJsonWriter[HttpHeader] = (obj: HttpHeader) => {
    JsObject(
      "name" -> JsString(obj.name()),
      "value" -> JsString(obj.value())
    )
  }

  implicit val httpResponseWriter: RootJsonWriter[HttpResponse] = (obj: HttpResponse) => JsObject(
    "status" -> JsNumber(obj.status.intValue),
    "statusText" -> JsString(obj.status.reason),
    "entity" -> (obj.entity match {
      case HttpEntity.Strict(ct@ContentTypes.`application/json`, body) => JsonParser(body.decodeString(ct.charset.value))
      case HttpEntity.Strict(ct@ContentTypes.`text/plain(UTF-8)`, body) => JsString(body.decodeString(ct.charset.value))
      case _ => throw new UnsupportedOperationException("Only strict application/json and text/plain endpoints are supported.")
    })
    //"headers" -> JsArray(obj.headers.map(_.toJson).toVector)
  )

  implicit val httpRequestReader: RootJsonReader[HttpRequest] = (json: JsValue) => {
    val (method, uri, headers, entity) = json match {
      case js: JsObject =>
        val method = js.fields.get("method") match {
          case Some(JsString("GET")) => HttpMethods.GET
          case Some(JsString("POST")) => HttpMethods.POST
          case Some(JsString("PUT")) => HttpMethods.PUT
          case Some(JsString("DELETE")) => HttpMethods.DELETE
          case Some(JsString("OPTIONS")) => HttpMethods.OPTIONS
          case Some(JsString("HEAD")) => HttpMethods.HEAD
          case Some(m) => throw DeserializationException(msg = s"Method $m is not supported.", fieldNames = List("method"))
          case _ => throw DeserializationException(s"No Method header found.", fieldNames = List("method"))
        }
        val uri = js.fields.get("url") match {
          case Some(JsString(url)) => Uri(url)
          case _ => throw DeserializationException(s"No string url parameter found.", fieldNames = List("url"))
        }
        val entity = js.fields.get("entity") match {
          case None => HttpEntity.Empty
          case Some(value: JsValue) => HttpEntity.Strict(ContentTypes.`application/json`, ByteString(value.compactPrint))
        }
        (method, uri, Nil, entity)
      case _ => throw DeserializationException("The body of an HttpRequest message must be a JsObject.")
    }
    HttpRequest(method = method, uri = uri, headers = headers, entity = entity)
  }

  //implicit def immSeqWriter[T: JsonWriter]: RootJsonWriter[Seq[T]] = (obj: Seq[T]) => JsArray(obj.map(_.toJson).toVector)

  implicit val mediaTypeWriter: RootJsonWriter[MediaType.Binary] = (obj: MediaType.Binary) => JsObject(
    "subType" -> obj.subType.toJson,
    "extensions" -> obj.fileExtensions.toJson
  )

  implicit val mediaTypeReader: RootJsonReader[MediaType.Binary] = {
    case obj: JsObject =>
      val subType = obj.fields.get("subType") match {
        case Some(JsString(s)) => s
        case _ => throw DeserializationException("No valid subType field found", fieldNames = List("subType"))
      }
      val extensions = obj.fields.get("extensions") match {
        case Some(JsArray(es)) => es.map {
          case JsString(e) => e
          case _ => throw DeserializationException("The extensions field must be an array of strings", fieldNames = List("extensions"))
        }
        case _ => throw DeserializationException("No valid extensions field found", fieldNames = List("extensions"))
      }
      MediaType.video(subType, NotCompressible, extensions: _*)
    case _ => throw DeserializationException("MediaType must be an object")
  }

  implicit val mediaTypeFormat: RootJsonFormat[MediaType.Binary] = rootJsonFormat(mediaTypeReader, mediaTypeWriter)
}

object JsonSupport extends JsonSupport
