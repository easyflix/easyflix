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

  case class ConfigError(msg: String)
  object ConfigError extends Show[ConfigError] {
    override def show(t: ConfigError): String = t.msg
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

  def validateConf(
      conf: Config,
      port: Option[Int] = None,
      host: Option[String] = None,
      tmdbApiKey: Option[String] = None,
      authKey: Option[String] = None,
      authTokenExpiration: Option[Duration] = None,
      password: Option[String] = None): ValidationResult[ProdConfiguration] = {
    (port.map(_.validNec).getOrElse(validatePort(conf)),
      host.map(_.validNec).getOrElse(validateHost(conf)),
      tmdbApiKey.map(_.validNec).getOrElse(validateTMDbApiKey(conf)),
      authKey.map(_.validNec).getOrElse(validateAuthKey(conf)),
      authTokenExpiration.map(_.validNec).getOrElse(validateAuthTokenExpiration(conf)),
      password.map(_.validNec).getOrElse(validateAuthPassword(conf))).mapN(ProdConfiguration.apply)
  }

}
