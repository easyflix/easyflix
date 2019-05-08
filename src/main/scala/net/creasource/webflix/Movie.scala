package net.creasource.webflix

import java.nio.file.Path

import net.creasource.json.JsonSupport
import spray.json.RootJsonFormat

case class Movie(title: String, poster: Option[String], backdrop: Option[String], overview: String, path: Path)

object Movie extends JsonSupport {

  implicit val format: RootJsonFormat[Movie] = jsonFormat5(Movie.apply)

}
