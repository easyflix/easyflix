package net.easyflix.events

import net.easyflix.model.Show

final case class ShowUpdate(details: Show.Details) extends ApplicationBus.Event
