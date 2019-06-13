package net.easyflix.model

import java.nio.file.Path

sealed trait LibraryFileChange

object LibraryFileChange {

  final case class Creation(file: LibraryFile) extends LibraryFileChange
  final case class Deletion(path: Path) extends LibraryFileChange
  final case class Modification(file: LibraryFile) extends LibraryFileChange

}
