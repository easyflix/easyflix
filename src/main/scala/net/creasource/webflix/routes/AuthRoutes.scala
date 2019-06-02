package net.creasource.webflix.routes

import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.server.{Directive1, Directives, Route}
import net.creasource.Application
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

  private val algo = JwtAlgorithm.HS256

  def routes(app: Application): Route = pathPrefix("auth")(Route.seal(
    path("login")(login(app))
  ))

  private def login(app: Application) = {
    val key = app.config.getString("auth.key")
    val tokenExpiration = app.config.getInt("auth.tokenExpirationInDays")
    post {
      entity(as[LoginRequest]) {
        case LoginRequest("admin", "admin") =>
          val claim = JwtClaim(
            content = Claim("admin").toJson.compactPrint
          ).expiresIn(tokenExpiration.days.toSeconds)
          respondWithHeader(RawHeader("Access-Token", JwtSprayJson.encode(claim, key, algo))) {
            complete(StatusCodes.OK)
          }
        case LoginRequest(_, _) => complete(StatusCodes.Unauthorized)
      }
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
}
