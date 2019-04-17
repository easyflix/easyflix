package net.creasource.webflix.routes

import akka.Done
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.model.{HttpHeader, MediaType, StatusCodes}
import akka.http.scaladsl.server.{Directives, Route}
import akka.pattern.ask
import net.creasource.Application
import net.creasource.exceptions.{NotFoundException, ValidationErrorException}
import net.creasource.json.JsonSupport
import net.creasource.webflix.actors.LibrarySupervisor._
import net.creasource.webflix.actors.MediaTypesActor._
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
          optionRoute ~
          pathEndOrSingleSlash {
            get {
              onSuccess((app.libraries ? GetLibraries).mapTo[Seq[Library]])(r => complete(r))
            } ~
            post {
              entity(as[Library]) { library =>
                extractExecutionContext { implicit executor =>
                  completeOrRecoverWith((app.libraries ? AddLibrary(library)).mapTo[Library]) {
                    case ValidationErrorException(control, code, value) => complete(StatusCodes.BadRequest, JsObject(
                      "control" -> control.toJson,
                      "code" -> code.toJson,
                      "value" -> value.toJson
                    ))
                    case e: Exception => complete(StatusCodes.InternalServerError, e.getMessage.toJson)
                  }
                }
              }
            }
          } ~
          pathPrefix(Segment) { name =>
            pathEndOrSingleSlash {
              get {
                extractExecutionContext { implicit executor =>
                  completeOrRecoverWith {
                    for {
                      library <- (app.libraries ? GetLibrary(name)).mapTo[Library]
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
            } ~
            path("scan") {
              post {
                extractExecutionContext { implicit executor =>
                  completeOrRecoverWith {
                    for {
                      library <- (app.libraries ? GetLibrary(name)).mapTo[Library]
                      files <- (app.libraries ? ScanLibrary(library.name))(10.minutes).mapTo[Seq[LibraryFile]]
                    } yield {
                      StatusCodes.OK -> files
                    }
                  } {
                    case NotFoundException(message) => complete(StatusCodes.NotFound, message.toJson)
                    case exception: Exception => complete(StatusCodes.InternalServerError, exception.getMessage.toJson)
                  }
                }
              }
            }
          }
        },
        pathPrefix("media-types") {
          pathEndOrSingleSlash {
            get {
              onSuccess((app.mediaTypesActor ? GetMediaTypes).mapTo[Seq[MediaType.Binary]])(r => complete(r))
            } ~
            post {
              entity(as[MediaType.Binary]) { mediaType =>
                onSuccess((app.mediaTypesActor ? AddMediaType(mediaType)).mapTo[AddMediaTypeResult]){
                  case AddMediaTypeSuccess(mt) => complete(mt)
                  case error: AddMediaTypeError => complete(StatusCodes.BadRequest, error.toJson)
                }
              }
            }
          } ~
          path(Segment) { subType =>
            delete {
              onSuccess((app.mediaTypesActor ? RemoveMediaType(subType)).mapTo[Done]){
                _ => complete(StatusCodes.OK, "")
              }
            }
          }
        }
      )
    }

}
