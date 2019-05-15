package net.creasource.tmdb

import net.creasource.json.JsonSupport
import spray.json.RootJsonFormat

// https://developers.themoviedb.org/3/movies/get-movie-credits

case class MovieCredits(id: Option[Int], cast: List[Credits.Cast], crew: List[Credits.Crew])

object MovieCredits extends JsonSupport {

  implicit val format: RootJsonFormat[MovieCredits] = jsonFormat3(MovieCredits.apply)

}
