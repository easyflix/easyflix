package net.easyflix.app.events

import net.easyflix.app.Library

case class LibraryCreated(library: Library) extends ApplicationBus.Event
