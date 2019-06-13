package net.easyflix.exceptions

final case class NotFoundException(message: String) extends RuntimeException(message)
