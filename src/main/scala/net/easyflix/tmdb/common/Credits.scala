package net.easyflix.tmdb.common

import net.easyflix.json.JsonSupport
import spray.json.RootJsonFormat

final case class Credits(cast: List[Cast], crew: List[Crew])

object Credits extends JsonSupport {

  implicit val format: RootJsonFormat[Credits] = jsonFormat2(Credits.apply)

}
