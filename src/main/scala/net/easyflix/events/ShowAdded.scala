package net.easyflix.events

import net.easyflix.model.Show

case class ShowAdded(show: Show) extends ApplicationBus.Event
