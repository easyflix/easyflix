package net.creasource.exceptions

case class ValidationErrorException(control: String, code: String, value: Option[String]) extends RuntimeException(s"Control $control is invalid: $code")

object ValidationErrorException {
  def apply(control: String, code: String): ValidationErrorException = apply(control, code, None)
}