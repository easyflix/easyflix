package net.easyflix.model

import net.easyflix.json.JsonSupport
import net.easyflix.tmdb.common.Crew
import spray.json.RootJsonFormat

final case class Episode(
    air_date: String,
    crew: List[Crew],
    episode_number: Int,
    name: String,
    overview: String,
    season_number: Int,
    still_path: Option[String],
    vote_average: Float,
    vote_count: Int)

object Episode extends JsonSupport {

  implicit val format: RootJsonFormat[Episode] = jsonFormat9(Episode.apply)

}
