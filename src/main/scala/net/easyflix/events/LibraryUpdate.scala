package net.easyflix.events

import net.easyflix.model.Library

final case class LibraryUpdate(library: Library) extends ApplicationBus.Event
