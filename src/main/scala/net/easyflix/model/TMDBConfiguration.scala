package net.easyflix.model

import net.easyflix.json.JsonSupport
import net.easyflix.tmdb
import spray.json.RootJsonFormat

final case class TMDBConfiguration(images: tmdb.Configuration.Images, languages: tmdb.Configuration.Languages)

object TMDBConfiguration extends JsonSupport {

  implicit val format: RootJsonFormat[TMDBConfiguration] = jsonFormat2(TMDBConfiguration.apply)

}
