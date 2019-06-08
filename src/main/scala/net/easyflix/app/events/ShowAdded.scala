package net.easyflix.app.events

import net.easyflix.app.Show

case class ShowAdded(show: Show) extends ApplicationBus.Event
