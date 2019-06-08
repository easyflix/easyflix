package net.easyflix.app.events

import net.easyflix.app.Movie

case class MovieAdded(movie: Movie) extends ApplicationBus.Event
