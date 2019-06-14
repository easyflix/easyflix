package net.easyflix.app

import java.time.Duration
import java.time.temporal.ChronoUnit

import cats.data.Chain
import cats.data.Validated.{Invalid, Valid}
import com.typesafe.config.ConfigFactory
import net.easyflix.app.ProdConfiguration.ConfigError
import org.scalatest.{Matchers, WordSpecLike}

class ProdConfigurationTest extends WordSpecLike with Matchers {

  "A ProdConfiguration" should {

    "validate a valid config file" in {

      val conf = ConfigFactory.parseString(
        """
          |  tmdbApiKey: "apiKey"
          |  http {
          |    host: "0.0.0.0"
          |    port: 8081
          |  }
          |  auth {
          |    key: "someKey"
          |    tokenExpiration: 1 day
          |    password: "password"
          |  }
        """.stripMargin)

      ProdConfiguration.validateConf(conf) shouldBe Valid(
        ProdConfiguration(
          8081,
          "0.0.0.0",
          "apiKey",
          "someKey",
          Duration.of(1, ChronoUnit.DAYS),
          "password")
      )

    }

    "reject an invalid config file" in {

      val conf = ConfigFactory.parseString(
        """
          |  http {
          |    host: "0.0.0.0"
          |    port: "something else"
          |  }
          |  auth {
          |    tokenExpiration: 1 day
          |    password: "password"
          |  }
        """.stripMargin)

      ProdConfiguration.validateConf(conf) shouldBe Invalid(Chain(
        ConfigError("String: 4: http.port has type STRING rather than NUMBER"),
        ConfigError("No configuration setting found for key 'tmdbApiKey'"),
        ConfigError("No configuration setting found for key 'auth.key'")
      ))

    }

  }

}
