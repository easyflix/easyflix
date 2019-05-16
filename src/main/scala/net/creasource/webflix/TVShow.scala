package net.creasource.webflix

case class TVShow(
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
    files: Seq[LibraryFile with LibraryFile.Tags])
