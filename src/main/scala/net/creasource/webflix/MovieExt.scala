package net.creasource.webflix

import net.creasource.json.JsonSupport
import net.creasource.tmdb.{MovieCredits, MovieDetails}
import spray.json.RootJsonFormat

case class MovieExt(
    id: Int,
    title: String,
    budget: Int,
    genres: List[MovieDetails.Genre],
    revenue: Int,
    runtime: Option[Int],
    tagline: Option[String],
    credits: MovieCredits)

object MovieExt extends JsonSupport {

  implicit val format: RootJsonFormat[MovieExt] = jsonFormat8(MovieExt.apply)

}
