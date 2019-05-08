package net.creasource.webflix.events

import net.creasource.webflix.Movie

case class MovieAdded(movie: Movie) extends ApplicationBus.Event
