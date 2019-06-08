package net.easyflix.tmdb

import net.easyflix.json.JsonSupport
import spray.json.RootJsonFormat

case class Configuration(images: Configuration.Images, change_keys: List[String])

// https://developers.themoviedb.org/3/configuration/get-api-configuration

object Configuration extends JsonSupport {

  def get(api_key: String) = s"/3/configuration?api_key=$api_key"

  implicit val format: RootJsonFormat[Configuration] = jsonFormat2(Configuration.apply)

  case class Images(
      base_url: String,
      secure_base_url: String,
      backdrop_sizes: List[String],
      logo_sizes: List[String],
      poster_sizes: List[String],
      profile_sizes: List[String],
      still_sizes: List[String])

  object Images {
    implicit val format: RootJsonFormat[Images] = jsonFormat7(Images.apply)
  }

  type Countries = List[Country]

  case class Country(iso_3166_1: String, english_name: String)

  object Country {
    implicit val format: RootJsonFormat[Country] = jsonFormat2(Country.apply)
  }

  type Languages = List[Language]

  case class Language(iso_639_1: String, english_name: String, name: String)

  object Language {
    def get(api_key: String) = s"/3/configuration/languages?api_key=$api_key"

    implicit val format: RootJsonFormat[Language] = jsonFormat3(Language.apply)
  }
}
