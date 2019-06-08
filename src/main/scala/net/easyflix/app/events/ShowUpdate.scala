package net.easyflix.app.events

import net.easyflix.app.Show

case class ShowUpdate(details: Show.Details) extends ApplicationBus.Event
