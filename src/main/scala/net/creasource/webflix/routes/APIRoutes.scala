package net.creasource.webflix.routes

import akka.Done
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.model.{HttpHeader, StatusCodes}
import akka.http.scaladsl.server.{Directives, Route}
import akka.pattern.ask
import net.creasource.Application
import net.creasource.json.JsonSupport
import net.creasource.webflix.actors.LibrarySupervisor._
import net.creasource.exceptions.NotFoundException
import net.creasource.webflix.{Library, LibraryFile}
import spray.json._

import scala.collection.immutable.Seq
import scala.concurrent.duration._

object APIRoutes extends Directives with JsonSupport {

  implicit val askTimeout: akka.util.Timeout = 10.seconds

  val optionRoute: Route =
    options {
      val corsHeaders: Seq[HttpHeader] = Seq(
        RawHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS"),
        RawHeader("Access-Control-Allow-Headers", "Content-Type")
      )
      respondWithHeaders(corsHeaders) {
        complete(StatusCodes.OK)
      }
    }

  def routes(app: Application): Route =
    respondWithHeaders(RawHeader("Access-Control-Allow-Origin", "*")) {
      concat(
        pathPrefix("libraries") {
          pathEndOrSingleSlash {
            optionRoute ~
            get {
              onSuccess((app.libraries ? GetLibraries).mapTo[Seq[Library]])(r => complete(r))
            } ~
            post {
              entity(as[Library]) { library =>
                onSuccess((app.libraries ? AddLibrary(library))(2.minute).mapTo[AddLibraryResult]){
                  case AddLibrarySuccess => complete(StatusCodes.OK, library)
                  case AddLibraryFailure => complete(StatusCodes.BadRequest, "") // TODO body
                }
              }
            }
          } ~
          path(Segment) { name =>
            optionRoute ~
            get {
              extractExecutionContext { implicit executor =>
                completeOrRecoverWith {
                  for {
                    library <- (app.libraries ? GetLibrary(name)).map {
                      case Some(library: Library) => library
                      case None => throw NotFoundException("No library with that name")
                    }
                    files <- (app.libraries ? GetLibraryFiles(library.name)).mapTo[Seq[LibraryFile]]
                  } yield {
                    StatusCodes.OK -> JsObject(
                      "library" -> library.toJson,
                      "files" -> files.toJson
                    )
                  }
                } {
                  case NotFoundException(message) => complete(StatusCodes.NotFound -> message.toJson)
                  case cause => complete(StatusCodes.InternalServerError -> cause.getMessage.toJson)
                }
              }
            } ~
            delete {
              onSuccess((app.libraries ? RemoveLibrary(name)).mapTo[Done])(_ => complete(StatusCodes.Accepted, ""))
            }
          }
        },
        /*pathPrefix("media-types") {
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
        }*/
      )
    }

}
