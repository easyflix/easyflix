package net.creasource.webflix

import net.creasource.json.JsonSupport
import net.creasource.tmdb
import spray.json.RootJsonFormat

case class Configuration(images: Option[tmdb.Configuration.Images], languages: Option[tmdb.Configuration.Languages])

object Configuration extends JsonSupport {

  implicit val format: RootJsonFormat[Configuration] = jsonFormat2(Configuration.apply)

}
