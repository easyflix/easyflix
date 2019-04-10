package net.creasource.web

import akka.Done
import akka.http.scaladsl.model._
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.server.{Directives, Route}
import akka.pattern.ask
import net.creasource.core.Application
import net.creasource.model.{Library, LibraryFile}
import net.creasource.web.LibraryActor._
import net.creasource.web.MediaTypesActor.{AddMediaType, GetMediaTypes, RemoveMediaType}
import spray.json._

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
          pathPrefix("files") {
            pathEndOrSingleSlash {
              get {
                onSuccess((application.libraryActor ? GetLibraryFiles).mapTo[Seq[LibraryFile]])(complete(_))
              }
            }
          },
          pathPrefix("libraries") {
            pathEndOrSingleSlash {
              get {
                onSuccess((application.libraryActor ? GetLibraries).mapTo[Seq[Library]])(complete(_))
              } ~
              post {
                entity(as[Library]) { library =>
                  onSuccess((application.libraryActor ? AddLibrary(library))(2.minute).mapTo[AddLibraryResult]){
                    case AddLibrarySuccess(lib) => complete(lib)
                    case AddLibraryError(error) => complete(StatusCodes.BadRequest, error.toJson)
                  }
                }
              }
            } ~
            path(Segment) { name =>
              delete {
                onSuccess((application.libraryActor ? RemoveLibrary(name)).mapTo[RemoveLibraryResult]){
                  case RemoveLibrarySuccess => complete(StatusCodes.OK, name.toJson)
                  case RemoveLibraryError(error) => complete(StatusCodes.BadRequest, error.toJson)
                }
              }
            }
          },
          pathPrefix("media-types") {
            pathEndOrSingleSlash {
              get {
                onSuccess((application.mediaTypesActor ? GetMediaTypes).mapTo[Seq[MediaType.Binary]])(complete(_))
              } ~
              post {
                entity(as[MediaType.Binary]) { mediaType =>
                  onSuccess((application.mediaTypesActor ? AddMediaType(mediaType)).mapTo[Done])(_ => complete(mediaType))
                }
              }
            } ~
            path(Segment) { subType =>
              delete {
                onSuccess((application.mediaTypesActor ? RemoveMediaType(subType)).mapTo[Done]){
                  _ => complete(StatusCodes.OK, subType.toJson)
                }
              }
            }
          }
        ))
      }
    }
  }

}
