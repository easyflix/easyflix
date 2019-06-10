package net.easyflix.events

case class MovieDeleted(id: Int) extends ApplicationBus.Event
