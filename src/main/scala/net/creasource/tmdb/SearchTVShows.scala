package net.creasource.tmdb

import net.creasource.json.JsonSupport
import spray.json.RootJsonFormat

// https://developers.themoviedb.org/3/search/search-tv-shows

case class SearchTVShows(page: Int, results: List[SearchTVShows.TVListResult], total_results: Int, total_pages: Int)

object SearchTVShows extends JsonSupport {

  implicit val format: RootJsonFormat[SearchTVShows] = jsonFormat4(SearchTVShows.apply)

  case class TVListResult(
      poster_path: Option[String],
      popularity: Float,
      id: Int,
      backdrop_path: Option[String],
      vote_average: Float,
      overview: String,
      first_air_date: String,
      origin_country: List[String],
      genre_ids: List[Int],
      original_language: String,
      vote_count: Int,
      name: String,
      original_name: String)

  object TVListResult {
    implicit val format: RootJsonFormat[TVListResult] = jsonFormat13(TVListResult.apply)
  }

}
