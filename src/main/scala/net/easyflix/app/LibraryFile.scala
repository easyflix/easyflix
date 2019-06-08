package net.easyflix.app

import java.nio.file.Path

import net.easyflix.json.JsonSupport
import spray.json._

case class LibraryFile(
    id: String,
    name: String,
    path: Path,
    isDirectory: Boolean,
    size: Long,
    lastModified: Long,
    libraryName: String,
    tags: Option[List[String]] = None,
    seasonNumber: Option[Int] = None,
    episodeNumber: Option[Int] = None
) {

  def withTags(tags: List[String]): LibraryFile = copy(tags = Some(tags))

  def withSeasonNumber(number: Int): LibraryFile = copy(seasonNumber = Some(number))

  def withEpisodeNumber(number: Int): LibraryFile = copy(episodeNumber = Some(number))

}

object LibraryFile extends JsonSupport {

  implicit val format: RootJsonFormat[LibraryFile] = jsonFormat10(LibraryFile.apply)

}
