package net.easyflix.events

import net.easyflix.model.Library

final case class LibraryCreated(library: Library) extends ApplicationBus.Event
