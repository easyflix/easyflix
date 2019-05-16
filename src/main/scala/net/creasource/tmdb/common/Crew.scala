package net.creasource.tmdb.common

import net.creasource.json.JsonSupport
import spray.json.RootJsonFormat

case class Crew(
    credit_id: String,
    department: String,
    gender: Option[Int],
    id: Int,
    job: String,
    name: String,
    profile_path: Option[String])

object Crew extends JsonSupport {
  implicit val format: RootJsonFormat[Crew] = jsonFormat7(Crew.apply)
}
