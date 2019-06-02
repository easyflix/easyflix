package net.creasource.webflix.routes

import akka.http.scaladsl.model.{HttpHeader, StatusCodes}
import akka.http.scaladsl.model.headers.{Cookie, RawHeader}
import akka.http.scaladsl.testkit._
import net.creasource.Application
import net.creasource.json.JsonSupport
import net.creasource.util.WithLibrary
import net.creasource.webflix.routes.AuthRoutes.LoginRequest
import org.scalatest.{Matchers, WordSpecLike}
import akka.http.scaladsl.server.Directives._

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

  "Auth routes" should {

    def securedContent = path("header") {
      AuthRoutes.authenticated(application) { username =>
        complete(s"User $username accessed secured content!")
      }
    }

    def cookieSecuredContent = path("cookie") {
      AuthRoutes.cookieAuthenticated(application) { username =>
        complete(s"User $username accessed secured content!")
      }
    }

    val route = AuthRoutes.routes(application) ~ securedContent ~ cookieSecuredContent

    "login admin user" in {
      Post("/auth/login", LoginRequest("admin", "admin")) ~> route ~> check {
        status shouldEqual StatusCodes.OK
        header("Access-Token") should matchPattern { case Some(_) => }
        header("Set-Cookie") should matchPattern {
          case Some(HttpHeader("set-cookie", token)) if token.startsWith("token=") =>
        }
        responseAs[String] shouldEqual "OK"
      }
    }

    "answer Unauthorized for bad credentials" in {
      Post("/auth/login", LoginRequest("admin", "pass")) ~> route ~> check {
        status shouldEqual StatusCodes.Unauthorized
        header("Access-Token") should matchPattern{ case None => }
      }
    }

    "allow access to secured content when a valid token is provided" in {
      val token = Post("/auth/login", LoginRequest("admin", "admin")) ~> route ~> check {
        header("Access-Token").get.value
      }

      Get("/header").withHeaders(RawHeader("Authorization", token)) ~> route ~> check {
        status shouldEqual StatusCodes.OK
        responseAs[String] shouldEqual s"User admin accessed secured content!"
      }
    }

    "forbid access to secured content when no valid token is provided" in {
      Get("/header").withHeaders(RawHeader("Authorization", "bad.token.test")) ~> route ~> check {
        status shouldEqual StatusCodes.Unauthorized
      }
    }

    "allow access to secured content when a valid cookie is provided" in {
      val cookie = Post("/auth/login", LoginRequest("admin", "admin")) ~> route ~> check {
        header("Set-Cookie").get.value()
      }

      Get("/cookie") ~> Cookie.parseFromValueString(cookie).toOption.get ~> route ~> check {
        status shouldEqual StatusCodes.OK
        responseAs[String] shouldEqual s"User admin accessed secured content!"
      }
    }

    "forbid access to secured content when no valid cookie is provided" in {
      Get("/cookie") ~> route ~> check {
        status shouldEqual StatusCodes.Unauthorized
      }
    }

  }

}
