package net.creasource.exceptions

case class ValidationException(control: String, code: String, value: Option[String]) extends RuntimeException(s"Control $control is invalid: $code")

object ValidationException {
  def apply(control: String, code: String): ValidationException = apply(control, code, None)
}
