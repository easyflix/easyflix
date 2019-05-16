package net.creasource.webflix.events

import net.creasource.webflix.Movie

case class MovieUpdate(update: Movie.Details) extends ApplicationBus.Event
