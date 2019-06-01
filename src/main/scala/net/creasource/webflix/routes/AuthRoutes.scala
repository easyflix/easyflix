package net.creasource.webflix.routes

import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.server.{Directive1, Directives, Route}
import net.creasource.json.JsonSupport
import pdi.jwt.{JwtAlgorithm, JwtClaim, JwtSprayJson}
import spray.json._

import scala.concurrent.duration._
import scala.util.{Failure, Success, Try}

object AuthRoutes extends Directives with JsonSupport {

  final case class LoginRequest(username: String, password: String)
  implicit val loginRequestFormat: RootJsonFormat[LoginRequest] = jsonFormat2(LoginRequest.apply)

  final case class Claim(username: String)
  implicit val claimFormat: RootJsonFormat[Claim] = jsonFormat1(Claim.apply)

  private val tokenExpiryPeriodInDays = 1
  private val key = "super_secret_key"
  private val algo = JwtAlgorithm.HS256

  def routes: Route = pathPrefix("auth")(Route.seal(
    path("login")(login)
  ))

  private def login =
    post {
      entity(as[LoginRequest]) {
        case LoginRequest("admin", "admin") =>
          val claim = JwtClaim(
            content = Claim("admin").toJson.compactPrint
          ).expiresIn(tokenExpiryPeriodInDays.day.toSeconds)
          respondWithHeader(RawHeader("Access-Token", JwtSprayJson.encode(claim, key, algo))) {
            complete(StatusCodes.OK)
          }
        case LoginRequest(_, _) => complete(StatusCodes.Unauthorized)
      }
    }

  def authenticated: Directive1[String] =
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
