package net.creasource.web

import akka.http.scaladsl.model._
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.server.{Directives, Route}
import akka.pattern.ask
import net.creasource.core.Application
import net.creasource.model.{Library, LibraryFile}
import net.creasource.web.LibraryActor.{GetLibraries, GetLibraryFiles}

import scala.collection.immutable.Seq
import scala.concurrent.duration._

object APIRoutes extends Directives with JsonSupport {

  implicit val askTimeout: akka.util.Timeout = 10.seconds

  def routes(application: Application): Route = {
    pathPrefix("api") {
      respondWithHeaders(RawHeader("Access-Control-Allow-Origin", "*")) {
        Route.seal(concat(
          options {
            val corsHeaders: Seq[HttpHeader] = Seq(
              RawHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS"),
              RawHeader("Access-Control-Allow-Headers", "Content-Type")
            )
            respondWithHeaders(corsHeaders) {
              complete(StatusCodes.OK)
            }
          },
          get {
            pathPrefix("videos") {
              pathEndOrSingleSlash {
                onSuccess((application.libraryActor ? GetLibraryFiles).mapTo[Seq[LibraryFile]])(complete(_))
              }
            } ~
            pathPrefix("libraries") {
              pathEndOrSingleSlash {
                onSuccess((application.libraryActor ? GetLibraries).mapTo[Seq[Library]])(complete(_))
              }
            }
          }
        ))
      }
    }
  }

}
