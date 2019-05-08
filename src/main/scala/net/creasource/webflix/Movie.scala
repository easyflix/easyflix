package net.creasource.webflix

import net.creasource.json.JsonSupport
import spray.json.RootJsonFormat

case class Movie(title: String, poster: Option[String], backdrop: Option[String], overview: String)

object Movie extends JsonSupport {

  implicit val format: RootJsonFormat[Movie] = jsonFormat4(Movie.apply)

}
