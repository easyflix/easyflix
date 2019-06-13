package net.easyflix.events

import java.nio.file.Path

final case class FileDeleted(path: Path) extends ApplicationBus.Event
