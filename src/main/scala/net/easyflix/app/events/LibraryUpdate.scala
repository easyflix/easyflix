package net.easyflix.app.events

import net.easyflix.app.Library

case class LibraryUpdate(library: Library) extends ApplicationBus.Event
