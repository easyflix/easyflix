package net.creasource.webflix.events

import net.creasource.webflix.Library

case class LibraryUpdate(library: Library) extends ApplicationBus.Event
