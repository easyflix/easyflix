package net.creasource.webflix

import java.nio.file.Path

case class LibraryFile(name: String, path: Path, isDirectory: Boolean, size: Long, lastModified: Long)
