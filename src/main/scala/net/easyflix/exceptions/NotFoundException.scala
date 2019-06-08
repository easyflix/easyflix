package net.easyflix.exceptions

case class NotFoundException(message: String) extends RuntimeException(message)
