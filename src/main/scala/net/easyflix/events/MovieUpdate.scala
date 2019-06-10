package net.easyflix.events

import net.easyflix.model.Movie

case class MovieUpdate(update: Movie.Details) extends ApplicationBus.Event
