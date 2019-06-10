package net.easyflix.events

import net.easyflix.model.Library

case class LibraryUpdate(library: Library) extends ApplicationBus.Event
