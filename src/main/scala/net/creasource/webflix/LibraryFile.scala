package net.creasource.webflix

import java.nio.file.Path

import net.creasource.json.JsonSupport
import spray.json._

case class LibraryFile(
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

  def withId(id: String): LibraryFile with LibraryFile.Id = {
    val identifier = id
    new LibraryFile(name, path, isDirectory, size, lastModified, libraryName) with LibraryFile.Id {
      val id: String = identifier
    }
  }

  def withTags(tags: List[String]): LibraryFile = copy(tags = Some(tags))

  def withSeasonNumber(number: Int): LibraryFile = copy(seasonNumber = Some(number))

  def withEpisodeNumber(number: Int): LibraryFile = copy(episodeNumber = Some(number))

/*  def withTags(tags: List[String]): LibraryFile with LibraryFile.Tags = {
    val t = tags
    new LibraryFile(name, path, isDirectory, size, lastModified, libraryName) with LibraryFile.Tags {
      val tags: List[String] = t
    }
  }*/

}

object LibraryFile extends JsonSupport {

  implicit val format: RootJsonFormat[LibraryFile] = jsonFormat9(LibraryFile.apply)

  trait Id { self: LibraryFile =>
    val id: String
  }

/*  trait Tags { self: LibraryFile =>
    val tags: List[String]
  }*/

  object Id {
    implicit val writer: RootJsonWriter[LibraryFile with Id] = file => {
      val obj = LibraryFile.format.write(file).asJsObject
      obj.copy(obj.fields + ("id" -> file.id.toJson))
    }
    implicit val format: RootJsonFormat[LibraryFile with Id] = lift(writer)
  }

/*  object Tags {
    implicit val writer: RootJsonWriter[LibraryFile with Tags] = file => {
      val obj = LibraryFile.format.write(file).asJsObject
      obj.copy(obj.fields + ("tags" -> file.tags.toJson))
    }
    implicit val format: RootJsonFormat[LibraryFile with Tags] = lift(writer)
  }*/

}
