package net.creasource.webflix

import java.nio.file.Path

sealed trait LibraryFileChange

object LibraryFileChange {

  case class Creation(file: LibraryFile) extends LibraryFileChange
  case class Deletion(path: Path) extends LibraryFileChange
  case class Modification(file: LibraryFile) extends LibraryFileChange

}
