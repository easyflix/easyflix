package net.easyflix.app

import java.time.Duration

import cats.Show
import cats.data.ValidatedNec
import cats.implicits._
import com.typesafe.config.Config

import scala.util.Try

case class ProdConfiguration(
      port: Int,
      host: String,
      tmdbApiKey: String,
      authKey: String,
      authTokenExpiration: Duration,
      authPassword: String)

object ProdConfiguration {

  case class ConfigError(msg: String) extends Show[ConfigError] {
    override def show(t: ConfigError): String = msg
  }

  type ValidationResult[A] = ValidatedNec[ConfigError, A]

  private def parse[T](t: => T): ValidationResult[T] =
    Try(t).toEither.left.map(t => ConfigError(t.getMessage)).toValidatedNec

  private def validatePort(conf: Config): ValidationResult[Int] =
    parse(conf.getInt("http.port"))

  private def validateHost(conf: Config): ValidationResult[String] =
    parse(conf.getString("http.host"))

  private def validateTMDbApiKey(conf: Config): ValidationResult[String] =
    parse(conf.getString("tmdbApiKey"))

  private def validateAuthKey(conf: Config): ValidationResult[String] =
    parse(conf.getString("auth.key"))

  private def validateAuthTokenExpiration(conf: Config): ValidationResult[Duration] =
    parse(conf.getDuration("auth.tokenExpiration"))

  private def validateAuthPassword(conf: Config): ValidationResult[String] =
    parse(conf.getString("auth.password"))

  def validateConf(conf: Config): ValidationResult[ProdConfiguration] = {
    (validatePort(conf),
      validateHost(conf),
      validateTMDbApiKey(conf),
      validateAuthKey(conf),
      validateAuthTokenExpiration(conf),
      validateAuthPassword(conf)).mapN(ProdConfiguration.apply)
  }

}
