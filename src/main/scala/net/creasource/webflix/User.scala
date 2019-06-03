package net.creasource.webflix

import net.creasource.json.JsonSupport
import spray.json._

case class User(username: String, password: String)

object User extends JsonSupport {

  implicit val writer: RootJsonWriter[User] = user => JsObject(
    "username" -> user.username.toJson
  )

}
