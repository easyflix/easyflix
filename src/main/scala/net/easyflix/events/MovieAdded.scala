package net.easyflix.events

import net.easyflix.model.Movie

final case class MovieAdded(movie: Movie) extends ApplicationBus.Event
