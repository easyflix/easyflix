package net.creasource.webflix.routes

import akka.http.scaladsl.model.headers.{HttpCookie, RawHeader}
import akka.http.scaladsl.model.{DateTime, StatusCodes}
import akka.http.scaladsl.server.{Directive1, Directives, Route}
import ch.megard.akka.http.cors.scaladsl.CorsDirectives.{cors, corsRejectionHandler}
import net.creasource.Application
import net.creasource.json.JsonSupport
import net.creasource.webflix.User
import pdi.jwt.{JwtAlgorithm, JwtClaim, JwtSprayJson}
import spray.json._

import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}

object AuthRoutes extends Directives with JsonSupport {

  final case class LoginRequest(username: String, password: String)
  implicit val loginRequestFormat: RootJsonFormat[LoginRequest] = jsonFormat2(LoginRequest.apply)

  final case class Claim(username: String)
  implicit val claimFormat: RootJsonFormat[Claim] = jsonFormat1(Claim.apply)

  private val algo = JwtAlgorithm.HS256

  def routes(app: Application): Route = pathPrefix("auth")(Route.seal(
    handleRejections(corsRejectionHandler) {
      cors() {
        path("login")(login(app)) ~ path("logout")(logout)
      }
    }
  ))

  private def login(app: Application) = {
    val key = app.config.getString("auth.key")
    val tokenExpiration = app.config.getInt("auth.tokenExpirationInDays")
    val adminUsername = app.config.getString("auth.adminUsername")
    val adminPassword = app.config.getString("auth.adminPassword")
    post {
      entity(as[LoginRequest]) {
        case LoginRequest(`adminUsername`, `adminPassword`) =>
          val claim = JwtClaim(
            content = Claim("admin").toJson.compactPrint
          ).expiresIn(tokenExpiration.days.toSeconds)
          val token = JwtSprayJson.encode(claim, key, algo)
          val cookie = HttpCookie(
            name = "token",
            value = token,
            path = Some("/videos"),
            expires = Some(DateTime.now + tokenExpiration.days.toMillis)
          )
          setCookie(cookie) {
            respondWithHeaders(RawHeader("Access-Token", token)) {
              complete(StatusCodes.OK, User(adminUsername, adminPassword).toJson)
            }
          }
        case LoginRequest(_, _) => complete(StatusCodes.Unauthorized -> "Username or password is incorrect")
      }
    }
  }

  private def logout =
    post {
      deleteCookie("token", path = "/videos") {
        complete(StatusCodes.OK)
      }
    }

  def authenticated(app: Application): Directive1[String] = {
    val key = app.config.getString("auth.key")
    optionalHeaderValueByName("Authorization").flatMap {
      case Some(authorization) =>
        JwtSprayJson.decodeJson(authorization, key, Seq(algo)).flatMap(obj => Try(obj.convertTo[Claim])) match {
          case Success(Claim(username)) =>
            provide(username)
          case Failure(exception) =>
            complete(StatusCodes.Unauthorized -> exception.getMessage)
        }
      case _ => complete(StatusCodes.Unauthorized)
    }
  }

  def cookieAuthenticated(app: Application): Directive1[String] = {
    val key = app.config.getString("auth.key")
    optionalCookie("token").flatMap {
      case Some(cookie) =>
        val authorization = cookie.value
        JwtSprayJson.decodeJson(authorization, key, Seq(algo)).flatMap(obj => Try(obj.convertTo[Claim])) match {
          case Success(Claim(username)) =>
            provide(username)
          case Failure(exception) =>
            complete(StatusCodes.Unauthorized -> exception.getMessage)
        }
      case None => complete(StatusCodes.Unauthorized)
    }
  }

}
