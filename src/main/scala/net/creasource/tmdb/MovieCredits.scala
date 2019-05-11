package net.creasource.tmdb

import net.creasource.json.JsonSupport
import net.creasource.tmdb.MovieCredits.{Cast, Crew}
import spray.json.RootJsonFormat

// https://developers.themoviedb.org/3/movies/get-movie-credits

case class MovieCredits(id: Option[Int], cast: List[Cast], crew: List[Crew])

object MovieCredits extends JsonSupport {

  implicit val format: RootJsonFormat[MovieCredits] = jsonFormat3(MovieCredits.apply)

  case class Cast(
      cast_id: Int,
      character: String,
      credit_id: String,
      gender: Option[Int],
      id: Int,
      name: String,
      order: Int,
      profile_path: Option[String])

  object Cast {
    implicit val format: RootJsonFormat[Cast] = jsonFormat8(Cast.apply)
  }

  case class Crew(
      credit_id: String,
      department: String,
      gender: Option[Int],
      id: Int,
      job: String,
      name: String,
      profile_path: Option[String])

  object Crew {
    implicit val format: RootJsonFormat[Crew] = jsonFormat7(Crew.apply)
  }

}
