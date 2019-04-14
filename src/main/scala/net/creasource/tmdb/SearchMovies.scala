package net.creasource.tmdb

import java.net.{URI, URLEncoder}

import net.creasource.json.JsonSupport
import spray.json.RootJsonFormat

// https://developers.themoviedb.org/3/search/search-movies

case class SearchMovies(page: Int, results: List[SearchMovies.MovieListResult], total_results: Int, total_pages: Int)

object SearchMovies extends JsonSupport {

  def get(
      api_key: String,
      query: String,
      language: Option[String] = Some("en-US"),
      page: Option[Int] = Some(1),
      include_adults: Boolean = false,
      region: Option[String] = None,
      year: Option[Int] = None,
      primary_release_year: Option[Int] = None): String = {

    s"/3/search/movie?api_key=$api_key&query=${URLEncoder.encode(query, "UTF-8")}" +
      language.toParam("language") +
      page.toParam("page") +
      include_adults.toParam("include_adults") +
      region.toParam("region") +
      year.toParam("year") +
      primary_release_year.toParam("primary_release_year")
  }

  implicit val format: RootJsonFormat[SearchMovies] = jsonFormat4(SearchMovies.apply)

  case class MovieListResult(
      poster_path: Option[String],
      adult: Boolean,
      overview: String,
      release_date: String,
      genre_ids: List[Int],
      id: Int,
      original_title: String,
      original_language: String,
      title: String,
      backdrop_path: Option[String],
      popularity: Float,
      vote_count: Int,
      video: Boolean, // Keep it ?
      vote_average: Float)

  object MovieListResult {
    implicit val format: RootJsonFormat[MovieListResult] = jsonFormat14(MovieListResult.apply)
  }

}
