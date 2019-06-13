package net.easyflix.tmdb.common

import net.easyflix.json.JsonSupport
import spray.json.RootJsonFormat

final case class Crew(
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
