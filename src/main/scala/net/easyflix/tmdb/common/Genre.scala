package net.easyflix.tmdb.common

import net.easyflix.json.JsonSupport
import spray.json._

final case class Genre(id: Int, name: String)

object Genre extends JsonSupport {
  implicit val format: RootJsonFormat[Genre] = jsonFormat2(Genre.apply)
}
