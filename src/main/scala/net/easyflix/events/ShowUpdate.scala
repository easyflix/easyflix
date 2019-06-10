package net.easyflix.events

import net.easyflix.model.Show

case class ShowUpdate(details: Show.Details) extends ApplicationBus.Event
