package net.easyflix.events

case class LibraryDeleted(name: String) extends ApplicationBus.Event
