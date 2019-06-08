package net.easyflix.app.events

import java.nio.file.Path

case class FileDeleted(path: Path) extends ApplicationBus.Event
