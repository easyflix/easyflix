package net.creasource.webflix.routes

import akka.http.scaladsl.model.headers.{CacheDirectives, HttpCookie, RawHeader, `Cache-Control`}
import akka.http.scaladsl.model.{DateTime, StatusCodes}
import akka.http.scaladsl.server.{Directive0, Directives, Route}
import net.creasource.Application
import net.creasource.json.JsonSupport
import net.creasource.webflix.routes.AuthRoutes.LoginRequest
import pdi.jwt.{JwtAlgorithm, JwtClaim, JwtSprayJson}
import spray.json._

import scala.concurrent.duration._
import scala.util.{Failure, Success}

object AuthRoutes extends JsonSupport {
  case class LoginRequest(password: String)
  implicit val loginRequestFormat: RootJsonFormat[LoginRequest] = jsonFormat1(LoginRequest.apply)
  /*final case class Claim(username: String)
  implicit val claimFormat: RootJsonFormat[Claim] = jsonFormat1(Claim.apply)*/
}

class AuthRoutes(val app: Application) extends Directives with JsonSupport {

  private val key = app.config.getString("auth.key")
  private val tokenExpiration = app.config.getDuration("auth.tokenExpiration")
  private val password = app.config.getString("auth.password")

  private val algo = JwtAlgorithm.HS256

  def routes: Route = concat(
    path("login")(login),
    path("logout")(logout)
  )

  def login: Route =
    post {
      entity(as[LoginRequest]) {
        case LoginRequest(`password`) =>
          val claim = JwtClaim().expiresIn(tokenExpiration.getSeconds)
          val token = JwtSprayJson.encode(claim, key, algo)
          val cookie = HttpCookie(
            name = "token",
            value = token,
            path = Some("/videos"),
            expires = Some(DateTime.now + tokenExpiration.getSeconds.seconds.toMillis),
            httpOnly = true
          )
          setCookie(cookie) {
            respondWithHeaders(RawHeader("Access-Token", token)) {
              complete(StatusCodes.OK, "")
            }
          }
        case LoginRequest(_) => complete(StatusCodes.Unauthorized -> "Password is incorrect")
      }
    }

  def logout: Route =
    post {
      deleteCookie("token", path = "/videos") {
        complete(StatusCodes.OK, "")
      }
    }

  def authenticated: Directive0 = {
    optionalHeaderValueByName("Authorization").flatMap {
      case Some(token) =>
        JwtSprayJson.decodeJson(token, key, Seq(algo))/*.flatMap(obj => Try(obj.convertTo[Claim]))*/ match {
          case Success(_) =>
            pass
          case Failure(exception) =>
            complete(StatusCodes.Unauthorized -> exception.getMessage)
        }
      case _ => complete(StatusCodes.Unauthorized)
    }
  }

  def cookieAuthenticated: Directive0 = {
    optionalCookie("token").flatMap {
      case Some(cookie) =>
        val token = cookie.value
        JwtSprayJson.decodeJson(token, key, Seq(algo))/*.flatMap(obj => Try(obj.convertTo[Claim]))*/ match {
          case Success(_) =>
            pass
          case Failure(exception) =>
            complete(StatusCodes.Unauthorized -> exception.getMessage)
        }
      case None => complete(StatusCodes.Unauthorized)
    }
  }

  /*def parameterAuthenticated: Directive0 = {
      parameter("access_token".?).flatMap {
        case Some(token) =>
          JwtSprayJson.decodeJson(token, key, Seq(algo)) /*.flatMap(obj => Try(obj.convertTo[Claim]))*/ match {
            case Success(_) =>
              respondWithHeader(`Cache-Control`(CacheDirectives.`private`())) & pass
            case Failure(exception) =>
              complete(StatusCodes.Unauthorized -> exception.getMessage)
          }
        case _ => complete(StatusCodes.Unauthorized)
      }
  }*/

}
