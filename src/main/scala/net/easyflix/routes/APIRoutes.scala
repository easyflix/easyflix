package net.easyflix.routes

import akka.Done
import akka.actor.ActorRef
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.server.{Directives, Route}
import akka.pattern.ask
import net.easyflix.actors.LibrarySupervisor._
import net.easyflix.actors.TMDBActor
import net.easyflix.exceptions.{NotFoundException, ValidationException}
import net.easyflix.json.JsonSupport
import net.easyflix.model._
import spray.json._

import scala.collection.immutable.Seq
import scala.concurrent.duration._

class APIRoutes(librariesActor: ActorRef, tmdbActor: ActorRef) extends Directives with JsonSupport {

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
        completeOrRecoverWith((librariesActor ? GetFileById(libraryName, id)).mapTo[LibraryFile]) {
          case NotFoundException(_) => complete(StatusCodes.NotFound)
        }
      }
    }

  def libraries: Route =
    pathEndOrSingleSlash {
      get {
        onSuccess((librariesActor ? GetLibraries).mapTo[Seq[Library]])(r => complete(r))
      } ~
        post {
          entity(as[Library]) { library =>
            extractExecutionContext { implicit executor =>
              completeOrRecoverWith((librariesActor ? AddLibrary(library)).mapTo[Library]) {
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
                  library <- (librariesActor ? GetLibrary(name)).mapTo[Library]
                  files <- (librariesActor ? GetLibraryFiles(library.name)).mapTo[Seq[LibraryFile]]
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
              onSuccess((librariesActor ? RemoveLibrary(name)).mapTo[Done])(_ => complete(StatusCodes.Accepted, ""))
            }
        } ~
          path("scan") {
            post {
              extractExecutionContext { implicit executor =>
                withoutRequestTimeout {
                  completeOrRecoverWith {
                    for {
                      library <- (librariesActor ? GetLibrary(name)).mapTo[Library]
                      files <- (librariesActor ? ScanLibrary(library.name)) (10.minutes).mapTo[Seq[LibraryFile]]
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
          (tmdbActor ? TMDBActor.GetMovie(id.toInt)) (30.seconds).mapTo[Movie].map(StatusCodes.OK -> _)
        } {
          case NotFoundException(message) => complete(StatusCodes.NotFound, message.toJson)
          case exception: Exception => complete(StatusCodes.InternalServerError, exception.getMessage.toJson)
        }
      }
    } ~
      get {
        onSuccess((tmdbActor ? TMDBActor.GetMovies).mapTo[Seq[Movie]])(complete(_))
      }

  def shows: Route =
    path(Segment) { id =>
      extractExecutionContext { implicit executor =>
        completeOrRecoverWith {
          (tmdbActor ? TMDBActor.GetShow(id.toInt)) (30.seconds).mapTo[Show].map(StatusCodes.OK -> _)
        } {
          case NotFoundException(message) => complete(StatusCodes.NotFound, message.toJson)
          case exception: Exception => complete(StatusCodes.InternalServerError, exception.getMessage.toJson)
        }
      }
    } ~
      get {
        onSuccess((tmdbActor ? TMDBActor.GetShows).mapTo[Seq[Show]])(complete(_))
      }

  def config: Route =
    get {
      onSuccess((tmdbActor ? TMDBActor.GetConfig).mapTo[Configuration])(complete(_))
    }

}
