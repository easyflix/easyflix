package net.creasource.webflix.events

import net.creasource.webflix.LibraryFile

// TODO Rename to FileScanned
case class FileAdded(file: LibraryFile) extends ApplicationBus.Event
