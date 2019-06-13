package net.easyflix.events

final case class MovieDeleted(id: Int) extends ApplicationBus.Event
