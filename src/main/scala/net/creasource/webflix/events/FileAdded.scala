package net.creasource.webflix.events

import net.creasource.webflix.LibraryFile

case class FileAdded(file: LibraryFile) extends ApplicationBus.Event
