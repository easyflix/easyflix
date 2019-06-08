package net.easyflix.exceptions

case class ValidationException(control: String, code: String, value: Option[String] = None) extends RuntimeException(s"Control $control is invalid: $code")
