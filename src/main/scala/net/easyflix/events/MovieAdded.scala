package net.easyflix.events

import net.easyflix.model.Movie

case class MovieAdded(movie: Movie) extends ApplicationBus.Event
