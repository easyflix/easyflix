package net.creasource.web

import akka.http.scaladsl.model._
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
//import akka.http.scaladsl.settings.RoutingSettings
import net.creasource.core.Application

import scala.collection.immutable.Seq
import scala.concurrent.duration._

class APIRoutes(application: Application) {

  // implicit val routingSettings: RoutingSettings = RoutingSettings.apply(application.config)

  val askTimeout: akka.util.Timeout = 10.seconds

//  import application.system

  val routes: Route = {
    pathPrefix("api") {
      respondWithHeaders(RawHeader("Access-Control-Allow-Origin", "*")) {
        Route.seal(concat(
          options {
            val corsHeaders: Seq[HttpHeader] = Seq(
              RawHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS"),
              RawHeader("Access-Control-Allow-Headers", "Content-Type")
            )
            respondWithHeaders(corsHeaders) {
              complete(StatusCodes.OK, "")
            }
          },
          reject
        ))
      }
    }
  }

}
