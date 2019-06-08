package net.easyflix.app.events

import net.easyflix.app.LibraryFile

// TODO Rename to FileScanned
case class FileAdded(file: LibraryFile) extends ApplicationBus.Event
