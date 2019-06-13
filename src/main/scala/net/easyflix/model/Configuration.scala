package net.easyflix.model

import net.easyflix.json.JsonSupport
import net.easyflix.tmdb
import spray.json.RootJsonFormat

final case class Configuration(images: Option[tmdb.Configuration.Images], languages: Option[tmdb.Configuration.Languages])

object Configuration extends JsonSupport {

  implicit val format: RootJsonFormat[Configuration] = jsonFormat2(Configuration.apply)

}
