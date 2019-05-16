package net.creasource.tmdb

import net.creasource.json.JsonSupport
import net.creasource.tmdb.common.{Cast, Crew}
import spray.json.RootJsonFormat

// https://developers.themoviedb.org/3/movies/get-movie-credits

case class MovieCredits(id: Option[Int], cast: List[Cast], crew: List[Crew])

object MovieCredits extends JsonSupport {

  implicit val format: RootJsonFormat[MovieCredits] = jsonFormat3(MovieCredits.apply)

}
