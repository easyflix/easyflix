package net.easyflix.events

final case class LibraryDeleted(name: String) extends ApplicationBus.Event
