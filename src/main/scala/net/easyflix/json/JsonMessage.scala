package net.easyflix.json

import spray.json.{JsValue, RootJsonFormat}

import scala.util.Try

final case class JsonMessage(method: String, id: Int, entity: JsValue)

object JsonMessage extends JsonSupport {

  implicit val jsonMessageFormat: RootJsonFormat[JsonMessage] = jsonFormat3(JsonMessage.apply)

  def unapply(arg: JsValue): Option[(String, Int, JsValue)] = {
    Try(arg.convertTo[JsonMessage]).toOption.map(m => (m.method, m.id, m.entity))
  }

}
