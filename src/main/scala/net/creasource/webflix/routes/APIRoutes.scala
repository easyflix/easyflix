package net.creasource.webflix.routes

import akka.Done
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.model.{HttpHeader, MediaType, StatusCodes}
import akka.http.scaladsl.server.{Directives, Route}
import akka.pattern.ask
import net.creasource.Application
import net.creasource.json.JsonSupport
import net.creasource.webflix.actors.LibraryActor.{AddLibrary, AddLibraryError, AddLibraryResult, AddLibrarySuccess, GetLibraries, GetLibraryFiles, RemoveLibrary, RemoveLibraryError, RemoveLibraryResult, RemoveLibrarySuccess}
import net.creasource.webflix.actors.MediaTypesActor.{AddMediaType, AddMediaTypeError, AddMediaTypeResult, AddMediaTypeSuccess, GetMediaTypes, RemoveMediaType}
import net.creasource.webflix.{Library, LibraryFile}
import spray.json._

import scala.collection.immutable.Seq
import scala.concurrent.duration._

object APIRoutes extends Directives with JsonSupport {

  implicit val askTimeout: akka.util.Timeout = 10.seconds

  def routes(application: Application): Route =
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
                onSuccess((application.libraryActor ? GetLibraryFiles).mapTo[Seq[LibraryFile]])(r => complete(r))
              }
            }
          },
          pathPrefix("libraries") {
            pathEndOrSingleSlash {
              get {
                onSuccess((application.libraryActor ? GetLibraries).mapTo[Seq[Library]])(r => complete(r))
              } ~
              post {
                entity(as[Library]) { library =>
                  onSuccess((application.libraryActor ? AddLibrary(library))(2.minute).mapTo[AddLibraryResult]){
                    case success: AddLibrarySuccess => complete(success)
                    case error: AddLibraryError => complete(StatusCodes.BadRequest, error)
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
                onSuccess((application.mediaTypesActor ? GetMediaTypes).mapTo[Seq[MediaType.Binary]])(r => complete(r))
              } ~
              post {
                entity(as[MediaType.Binary]) { mediaType =>
                  onSuccess((application.mediaTypesActor ? AddMediaType(mediaType)).mapTo[AddMediaTypeResult]){
                    case AddMediaTypeSuccess(mt) => complete(mt)
                    case error: AddMediaTypeError => complete(StatusCodes.BadRequest, error.toJson)
                  }
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
