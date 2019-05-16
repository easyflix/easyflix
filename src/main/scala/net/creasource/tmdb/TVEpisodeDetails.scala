package net.creasource.tmdb

import net.creasource.tmdb.common.{Cast, Crew}

case class TVEpisodeDetails(
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

object TVEpisodeDetails {


}
