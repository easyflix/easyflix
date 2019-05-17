package net.creasource.tmdb.common

import net.creasource.json.JsonSupport
import spray.json.RootJsonFormat

case class Credits(cast: List[Cast], crew: List[Crew])

object Credits extends JsonSupport {

  implicit val format: RootJsonFormat[Credits] = jsonFormat2(Credits.apply)

}
