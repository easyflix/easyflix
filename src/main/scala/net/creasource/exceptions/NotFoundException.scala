package net.creasource.exceptions

case class NotFoundException(message: String) extends RuntimeException(message)
