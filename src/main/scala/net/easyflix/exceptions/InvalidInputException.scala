package net.easyflix.exceptions

final case class InvalidInputException(msg: String) extends Throwable(msg)
