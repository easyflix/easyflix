package net.creasource.webflix

import java.nio.file.Path

import net.creasource.json.JsonSupport
import spray.json._

case class LibraryFile(name: String, path: Path, isDirectory: Boolean, size: Long, lastModified: Long, libraryName: String) {

  def withId(id: String): LibraryFile with LibraryFile.Id = {
    val identifier = id
    new LibraryFile(name, path, isDirectory, size, lastModified, libraryName) with LibraryFile.Id {
      val id: String = identifier
    }
  }

}

object LibraryFile extends JsonSupport {

  implicit val format: RootJsonFormat[LibraryFile] = jsonFormat6(LibraryFile.apply)

  trait Id { self: LibraryFile =>
    val id: String
  }

  object Id {
    implicit val writer: RootJsonWriter[LibraryFile with Id] = file => {
      val obj = LibraryFile.format.write(file).asJsObject
      obj.copy(obj.fields + ("id" -> file.id.toJson))
    }
    implicit val format: RootJsonFormat[LibraryFile with Id] = lift(writer)
  }

}
