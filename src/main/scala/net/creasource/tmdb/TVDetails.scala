package net.creasource.tmdb

import net.creasource.json.JsonSupport
import net.creasource.tmdb.TVDetails.{Creator, Network, Season}
import net.creasource.tmdb.common.Genre
import spray.json.RootJsonFormat

// https://developers.themoviedb.org/3/tv/get-tv-details

// Dropped homepage, last_episode_to_air, next_episode_to_air, type, popularity
case class TVDetails(
    backdrop_path: Option[String],
    created_by: List[Creator],
    episode_run_time: List[Int],
    first_air_date: String,
    genres: List[Genre],
    id: Int,
    in_production: Boolean,
    languages: List[String],
    last_air_date: Option[String],
    name: String,
    networks: List[Network],
    number_of_episodes: Int,
    number_of_seasons: Int,
    origin_country: List[String],
    original_language: String,
    original_name: String,
    overview: String,
    poster_path: Option[String],
    seasons: List[Season],
    status: String,
    vote_average: Float,
    vote_count: Int)

object TVDetails extends JsonSupport {

  def get(
      api_key: String,
      tv_id: Int,
      language: Option[String] = Some("en-US"),
      append_to_response: Option[String] = None): String = {

    s"/3/tv/$tv_id?api_key=$api_key" +
      language.toParam("language") +
      append_to_response.toParam("append_to_response")
  }

  implicit val format: RootJsonFormat[TVDetails] = jsonFormat22(TVDetails.apply)

  case class Creator(
      id: Int,
      credit_id: String,
      name: String,
      gender: Option[Int],
      profile_path: Option[String])

  object Creator {
    implicit val format: RootJsonFormat[Creator] = jsonFormat5(Creator.apply)
  }

  case class Network(
      name: String,
      id: Int,
      logo_path: Option[String],
      origin_country: String)

  object Network {
    implicit val format: RootJsonFormat[Network] = jsonFormat4(Network.apply)
  }

  case class Season(
      air_date: Option[String],
      episode_count: Int,
      id: Int,
      name: String,
      overview: Option[String],
      poster_path: Option[String],
      season_number: Int)

  object Season {
    implicit val format: RootJsonFormat[Season] = jsonFormat7(Season.apply)
  }

}
