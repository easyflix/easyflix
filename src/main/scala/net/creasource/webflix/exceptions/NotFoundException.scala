package net.creasource.webflix.exceptions

case class NotFoundException(message: String) extends RuntimeException(message)
