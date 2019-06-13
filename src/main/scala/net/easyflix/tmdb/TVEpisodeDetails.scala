package net.easyflix.tmdb

import net.easyflix.json.JsonSupport
import net.easyflix.tmdb.common.{Cast, Crew}
import spray.json.RootJsonFormat

// https://developers.themoviedb.org/3/tv-episodes/get-tv-episode-details

final case class TVEpisodeDetails(
    air_date: String,
    crew: List[Crew],
    episode_number: Int,
    guest_stars: List[Cast],
    name: String,
    overview: String,
    id: Int,
    production_code: Option[String],
    season_number: Int,
    still_path: Option[String],
    vote_average: Float,
    vote_count: Int)

object TVEpisodeDetails extends JsonSupport {

  def get(
       api_key: String,
       tv_id: Int,
       season_number: Int,
       episode_number: Int,
       language: Option[String] = Some("en-US"),
       append_to_response: Option[String] = None): String = {

    s"/3/tv/$tv_id/season/$season_number/episode/$episode_number?api_key=$api_key" +
      language.toParam("language") +
      append_to_response.toParam("append_to_response")

  }

  implicit val format: RootJsonFormat[TVEpisodeDetails] = jsonFormat12(TVEpisodeDetails.apply)

}
