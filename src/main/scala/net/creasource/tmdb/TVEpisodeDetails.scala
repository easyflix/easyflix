package net.creasource.tmdb

case class TVEpisodeDetails(
    air_date: String,
    crew: List[Credits.Crew],
    episode_number: Int,
    guest_stars: List[Credits.Cast],
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
