package net.easyflix.events

import net.easyflix.model.LibraryFile

// TODO Rename to FileScanned
final case class FileAdded(file: LibraryFile) extends ApplicationBus.Event
