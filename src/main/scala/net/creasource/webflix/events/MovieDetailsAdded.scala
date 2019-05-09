package net.creasource.webflix.events

import net.creasource.tmdb.MovieDetails

case class MovieDetailsAdded(movieDetails: MovieDetails) extends ApplicationBus.Event
