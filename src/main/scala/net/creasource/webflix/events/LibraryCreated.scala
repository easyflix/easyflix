package net.creasource.webflix.events

import net.creasource.webflix.Library

case class LibraryCreated(library: Library) extends ApplicationBus.Event
