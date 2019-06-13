package net.easyflix.events

import net.easyflix.model.Show

final case class ShowAdded(show: Show) extends ApplicationBus.Event
