package net.easyflix.events

import net.easyflix.model.Library

case class LibraryCreated(library: Library) extends ApplicationBus.Event
