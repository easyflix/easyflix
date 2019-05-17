package net.creasource.webflix

import net.creasource.json.JsonSupport
import net.creasource.tmdb.TVDetails.{Creator, Network, Season}
import net.creasource.tmdb.common.{Credits, Genre}
import spray.json.RootJsonFormat

case class Show(
    id: Int,
    name: String,
    original_name: String,
    original_language: String,
    origin_country: List[String],
    first_air_date: String,
    poster: Option[String],
    backdrop: Option[String],
    overview: String,
    vote_average: Float,
    files: Seq[LibraryFile with LibraryFile.Tags],
    details: Option[Show.Details]) {

  def withDetails(details: Show.Details): Show = copy(details = Some(details))

}

object Show extends JsonSupport {

  implicit val format: RootJsonFormat[Show] = jsonFormat12(Show.apply)

  case class Details(
      id: Int,
      created_by: List[Creator],
      genres: List[Genre],
      networks: List[Network],
      number_of_episodes: Int,
      number_of_seasons: Int,
      seasons: List[Season],
      credits: Credits)

  object Details {

    implicit val format: RootJsonFormat[Details] = jsonFormat8(Details.apply)

  }

}
