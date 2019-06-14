package net.easyflix.exceptions

case class ConfigurationException(msg: String) extends RuntimeException(msg)
