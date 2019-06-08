package net.easyflix.tmdb.common

import net.easyflix.json.JsonSupport
import spray.json.RootJsonFormat

case class Cast(
    cast_id: Option[Int],
    character: String,
    credit_id: String,
    gender: Option[Int],
    id: Int,
    name: String,
    order: Int,
    profile_path: Option[String])

object Cast extends JsonSupport {
  implicit val format: RootJsonFormat[Cast] = jsonFormat8(Cast.apply)
}
