package net.easyflix.app.events

import net.easyflix.app.Movie

case class MovieUpdate(update: Movie.Details) extends ApplicationBus.Event
