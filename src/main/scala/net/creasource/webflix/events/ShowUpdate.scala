package net.creasource.webflix.events

import net.creasource.webflix.Show

case class ShowUpdate(details: Show.Details) extends ApplicationBus.Event
