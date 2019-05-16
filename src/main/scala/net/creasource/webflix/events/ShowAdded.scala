package net.creasource.webflix.events

import net.creasource.webflix.Show

case class ShowAdded(show: Show) extends ApplicationBus.Event
