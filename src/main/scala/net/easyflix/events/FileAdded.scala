package net.easyflix.events

import net.easyflix.model.LibraryFile

// TODO Rename to FileScanned
case class FileAdded(file: LibraryFile) extends ApplicationBus.Event
