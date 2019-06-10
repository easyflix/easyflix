package net.easyflix.events

import java.nio.file.Path

case class FileDeleted(path: Path) extends ApplicationBus.Event
