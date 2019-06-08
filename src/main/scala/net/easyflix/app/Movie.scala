package net.easyflix.app

import net.easyflix.json.JsonSupport
import net.easyflix.tmdb.common.{Credits, Genre}
import spray.json.RootJsonFormat

case class Movie(
    id: Int,
    title: String,
    original_title: String,
    original_language: String,
    release_date: String,
    poster: Option[String],
    backdrop: Option[String],
    overview: String,
    vote_average: Float,
    files: Set[LibraryFile],
    details: Option[Movie.Details]) {

  def withDetails(details: Movie.Details): Movie = copy(details = Some(details))

  def withFiles(files: Set[LibraryFile]): Movie =
    copy(files = this.files ++ files.filter(f => !this.files.map(_.path).contains(f.path)))

}

object Movie extends JsonSupport {

  implicit val format: RootJsonFormat[Movie] = jsonFormat11(Movie.apply)

  case class Details(
      id: Int,
      budget: Int,
      genres: List[Genre],
      revenue: Int,
      runtime: Option[Int],
      tagline: Option[String],
      credits: Credits)

  object Details {

    implicit val format: RootJsonFormat[Details] = jsonFormat7(Details.apply)

  }

}
