package net.creasource

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import akka.http.scaladsl.model.MediaType.NotCompressible
import akka.http.scaladsl.model._
import akka.util.ByteString
import spray.json._

import scala.collection.immutable.Seq
import scala.util.Try

package object web {

  case class JsonMessage(method: String, id: Int, entity: JsValue)

  object JsonMessage extends JsonSupport {
    def unapply(arg: JsValue): Option[(String, Int, JsValue)] = {
      Try(arg.convertTo[JsonMessage]).toOption.map(m => (m.method, m.id, m.entity))
    }
  }

  trait JsonSupport extends SprayJsonSupport with DefaultJsonProtocol {
    implicit val jsonMessageFormat: RootJsonFormat[JsonMessage] = jsonFormat3(JsonMessage.apply)
    implicit val httpHeaderWriter: RootJsonWriter[HttpHeader] = (obj: HttpHeader) => {
      JsObject(
        "name" -> JsString(obj.name()),
        "value" -> JsString(obj.value())
      )
    }
    implicit val httpResponseFormat: RootJsonWriter[HttpResponse] = (obj: HttpResponse) => JsObject(
      "status" -> JsNumber(obj.status.intValue),
      "statusText" -> JsString(obj.status.reason),
      "entity" -> (obj.entity match {
        case HttpEntity.Strict(ct@ContentTypes.`application/json`, body) => JsonParser(body.decodeString(ct.charset.value))
        case HttpEntity.Strict(ct@ContentTypes.`text/plain(UTF-8)`, body) => JsString(body.decodeString(ct.charset.value))
        case _ => throw new UnsupportedOperationException("Only strict application/json and text/plain endpoints are supported.")
      })
      //"headers" -> JsArray(obj.headers.map(_.toJson).toVector)
    )
    implicit val httpRequestFormat: RootJsonReader[HttpRequest] = (json: JsValue) => {
      val (method, uri, headers, entity) = json match {
        case js: JsObject =>
          val method = js.fields.get("method") match {
            case Some(JsString("GET")) => HttpMethods.GET
            case Some(JsString("POST")) => HttpMethods.POST
            case Some(JsString("PUT")) => HttpMethods.PUT
            case Some(JsString("DELETE")) => HttpMethods.DELETE
            case Some(JsString("OPTIONS")) => HttpMethods.OPTIONS
            case Some(JsString("HEAD")) => HttpMethods.HEAD
            case Some(m) => throw new UnsupportedOperationException(s"Method $m is not supported.")
            case _ => throw new UnsupportedOperationException(s"No Method header found.")
          }
          val uri = js.fields.get("url") match {
            case Some(JsString(url)) => Uri(url)
            case _ => throw new UnsupportedOperationException(s"No string url parameter found.")
          }
          val entity = js.fields.get("entity") match {
            case None => HttpEntity.Empty
            case Some(value: JsValue) => HttpEntity.Strict(ContentTypes.`application/json`, ByteString(value.compactPrint))
          }
          (method, uri, Nil, entity)
        case _ => throw new UnsupportedOperationException("The body of an HttpRequest message must be a JsObject.")
      }
      HttpRequest(method = method, uri = uri, headers = headers, entity = entity)
    }
    implicit def immSeqWriter[T: JsonWriter]: RootJsonWriter[Seq[T]] = (obj: Seq[T]) => JsArray(obj.map(_.toJson).toVector)
    val mediaFormat: RootJsonFormat[MediaType.Binary] = new RootJsonFormat[MediaType.Binary] {
      override def read(json: JsValue): MediaType.Binary = json match {
        case obj: JsObject =>
          val subType = obj.fields.get("subType") match {
            case Some(JsString(s)) => s
            case _ => throw new UnsupportedOperationException("No valid subType field found")
          }
          val extensions = obj.fields.get("extensions") match {
            case Some(JsArray(es)) => es.map {
              case JsString(e) => e
              case _ => throw new UnsupportedOperationException("The extensions field must be an array of strings")
            }
            case _ => throw new UnsupportedOperationException("No valid extensions field found")
          }
          MediaType.video(subType, NotCompressible, extensions: _*)
        case _ => throw new UnsupportedOperationException("MediaType must be an object")
      }
      override def write(obj: MediaType.Binary): JsValue = JsObject(
        "subType" -> obj.subType.toJson,
        "extensions" -> obj.fileExtensions.toJson
      )
    }
    implicit val mediaWriter: RootJsonWriter[MediaType.Binary] = mediaFormat.write
    implicit val mediaReader: RootJsonReader[MediaType.Binary] = mediaFormat.read
  }

  object JsonSupport extends JsonSupport

}
