package net.creasource.webflix

import java.nio.file.Path

import net.creasource.json.JsonSupport
import spray.json.RootJsonFormat

case class Movie(
    id: Int,
    title: String,
    original_title: String,
    original_language: String,
    release_date: String,
    poster: Option[String],
    backdrop: Option[String],
    overview: String,
    vote_average: Float,
    path: Path)

object Movie extends JsonSupport {

  implicit val format: RootJsonFormat[Movie] = jsonFormat10(Movie.apply)

}
