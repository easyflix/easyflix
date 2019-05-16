package net.creasource.tmdb

import net.creasource.tmdb.TVDetails.{Creator, Network, Season}
import net.creasource.tmdb.common.Genre

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
    last_air_date: String,
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

object TVDetails {

  def get(
      tv_id: Int,
      api_key: String,
      language: Option[String] = Some("en-US"),
      append_to_response: Option[String] = None): String = {

    s"/3/tv/$tv_id?api_key=$api_key" +
      language.toParam("language") +
      append_to_response.toParam("append_to_response")
  }

  case class Creator(
      id: Int,
      credit_id: String,
      name: String,
      gender: Int,
      profile_path: String)

  case class Network(
      name: String,
      id: Int,
      logo_path: String,
      origin_country: String)

  case class Season(
      air_date: String,
      episode_count: Int,
      id: Int,
      name: String,
      overview: String,
      poster_path: String,
      season_number: Int)

}
