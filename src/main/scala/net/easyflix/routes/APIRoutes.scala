package net.easyflix.routes

import akka.Done
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.server.{Directives, Route}
import akka.pattern.ask
import net.easyflix.actors.LibrarySupervisor._
import net.easyflix.actors.TMDBActor
import net.easyflix.app.Application
import net.easyflix.exceptions.{NotFoundException, ValidationException}
import net.easyflix.json.JsonSupport
import net.easyflix.model._
import spray.json._

import scala.collection.immutable.Seq
import scala.concurrent.duration._

class APIRoutes(val app: Application) extends Directives with JsonSupport {

  implicit val askTimeout: akka.util.Timeout = 10.seconds

  def routes: Route =
    concat(
      pathPrefix("videos")(videos),
      pathPrefix("libraries")(libraries),
      pathPrefix("movies")(movies),
      pathPrefix("shows")(shows),
      pathPrefix("config")(config)
    )

  def videos: Route =
    pathPrefix(Segment) { libraryName =>
      path(Segment) { id =>
        completeOrRecoverWith((app.libraries ? GetFileById(libraryName, id)).mapTo[LibraryFile]) {
          case NotFoundException(_) => complete(StatusCodes.NotFound)
        }
      }
    }

  def libraries: Route =
    pathEndOrSingleSlash {
      get {
        onSuccess((app.libraries ? GetLibraries).mapTo[Seq[Library]])(r => complete(r))
      } ~
        post {
          entity(as[Library]) { library =>
            extractExecutionContext { implicit executor =>
              completeOrRecoverWith((app.libraries ? AddLibrary(library)).mapTo[Library]) {
                case ValidationException(control, code, value) => complete(StatusCodes.BadRequest, JsObject(
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
                withoutRequestTimeout {
                  completeOrRecoverWith {
                    for {
                      library <- (app.libraries ? GetLibrary(name)).mapTo[Library]
                      files <- (app.libraries ? ScanLibrary(library.name)) (10.minutes).mapTo[Seq[LibraryFile]]
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
      }

  def movies: Route =
    path(Segment) { id =>
      extractExecutionContext { implicit executor =>
        completeOrRecoverWith {
          (app.tmdb ? TMDBActor.GetMovie(id.toInt)) (30.seconds).mapTo[Movie].map(StatusCodes.OK -> _)
        } {
          case NotFoundException(message) => complete(StatusCodes.NotFound, message.toJson)
          case exception: Exception => complete(StatusCodes.InternalServerError, exception.getMessage.toJson)
        }
      }
    } ~
      get {
        onSuccess((app.tmdb ? TMDBActor.GetMovies).mapTo[Seq[Movie]])(complete(_))
      }

  def shows: Route =
    path(Segment) { id =>
      extractExecutionContext { implicit executor =>
        completeOrRecoverWith {
          (app.tmdb ? TMDBActor.GetShow(id.toInt)) (30.seconds).mapTo[Show].map(StatusCodes.OK -> _)
        } {
          case NotFoundException(message) => complete(StatusCodes.NotFound, message.toJson)
          case exception: Exception => complete(StatusCodes.InternalServerError, exception.getMessage.toJson)
        }
      }
    } ~
      get {
        onSuccess((app.tmdb ? TMDBActor.GetShows).mapTo[Seq[Show]])(complete(_))
      }

  def config: Route =
    get {
      onSuccess((app.tmdb ? TMDBActor.GetConfig).mapTo[Configuration])(complete(_))
    }

}
