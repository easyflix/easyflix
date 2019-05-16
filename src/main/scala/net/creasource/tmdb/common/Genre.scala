package net.creasource.tmdb.common

import net.creasource.json.JsonSupport
import spray.json._

case class Genre(id: Int, name: String)

object Genre extends JsonSupport {
  implicit val format: RootJsonFormat[Genre] = jsonFormat2(Genre.apply)
}
