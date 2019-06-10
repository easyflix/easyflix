package net.easyflix.routes

import akka.http.scaladsl.model.headers.{Cookie, RawHeader}
import akka.http.scaladsl.model.{HttpHeader, StatusCodes}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.testkit._
import net.easyflix.Application
import net.easyflix.json.JsonSupport
import net.easyflix.util.WithLibrary
import net.easyflix.routes.AuthRoutes.LoginRequest
import org.scalatest.{Matchers, WordSpecLike}

class AuthRoutesTest
  extends WordSpecLike
    with Matchers
    with WithLibrary
    with ScalatestRouteTest
    with JsonSupport {

  val application = Application()

  override def afterAll(): Unit = {
    application.shutdown()
    super.afterAll()
  }

  val auth = new AuthRoutes(application)

  "Auth routes" should {

    def securedContent = path("header") {
      auth.authenticated {
        complete(s"User accessed secured content!")
      }
    }

    def cookieSecuredContent = path("cookie") {
      auth.cookieAuthenticated {
        complete(s"User accessed secured content!")
      }
    }

    val route = auth.routes ~ securedContent ~ cookieSecuredContent

    "login admin user" in {
      Post("/login", LoginRequest("password")) ~> route ~> check {
        status shouldEqual StatusCodes.OK
        header("Access-Token") should matchPattern { case Some(_) => }
        header("Set-Cookie") should matchPattern {
          case Some(HttpHeader("set-cookie", token)) if token.startsWith("token=") =>
        }
        responseAs[String] shouldEqual ""
      }
    }

    "answer Unauthorized for bad credentials" in {
      Post("/login", LoginRequest("wrong_password")) ~> route ~> check {
        status shouldEqual StatusCodes.Unauthorized
        header("Access-Token") should matchPattern{ case None => }
      }
    }

    "allow access to secured content when a valid token is provided" in {
      val token = Post("/login", LoginRequest("password")) ~> route ~> check {
        header("Access-Token").get.value
      }

      Get("/header").withHeaders(RawHeader("Authorization", token)) ~> route ~> check {
        status shouldEqual StatusCodes.OK
        responseAs[String] shouldEqual s"User accessed secured content!"
      }
    }

    "forbid access to secured content when no token is provided" in {
      Get("/header") ~> route ~> check {
        status shouldEqual StatusCodes.Unauthorized
      }
    }

    "forbid access to secured content when an invalid token is provided" in {
      Get("/header").withHeaders(RawHeader("Authorization", "bad.token.test")) ~> route ~> check {
        status shouldEqual StatusCodes.Unauthorized
      }
    }

    "allow access to secured content when a valid cookie is provided" in {
      val cookie = Post("/login", LoginRequest("password")) ~> route ~> check {
        header("Set-Cookie").get.value()
      }

      Get("/cookie") ~> Cookie.parseFromValueString(cookie).toOption.get ~> route ~> check {
        status shouldEqual StatusCodes.OK
        responseAs[String] shouldEqual s"User accessed secured content!"
      }
    }

    "forbid access to secured content when no valid cookie is provided" in {
      Get("/cookie") ~> Route.seal(route) ~> check {
        status shouldEqual StatusCodes.Unauthorized
      }
    }

    "logout a user" in {
      Post("/logout") ~> route ~> check {
        status shouldEqual StatusCodes.OK
        header("Set-Cookie") should matchPattern {
          case Some(HttpHeader("set-cookie", token)) if token.startsWith("token=deleted;") =>
        }
        responseAs[String] shouldEqual ""
      }
    }

  }

}
