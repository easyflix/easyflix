package net.easyflix.model

import net.easyflix.json.JsonSupport
import net.easyflix.tmdb.TVDetails.{Creator, Network, Season}
import net.easyflix.tmdb.common.{Credits, Genre}
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
    files: Set[LibraryFile],
    details: Option[Show.Details],
    episodes: List[Episode]) {

  def withDetails(details: Show.Details): Show = copy(details = Some(details))

  def withEpisode(episode: Episode): Show = copy(episodes = episodes :+ episode)

  def withFiles(files: Set[LibraryFile]): Show =
    copy(files = this.files ++ files.filter(f => !this.files.map(_.path).contains(f.path)))

}

object Show extends JsonSupport {

  implicit val format: RootJsonFormat[Show] = jsonFormat13(Show.apply)

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
