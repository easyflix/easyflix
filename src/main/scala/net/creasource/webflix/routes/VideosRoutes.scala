package net.creasource.webflix.routes

import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.model.headers.{Range, RangeUnits}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.server.directives.{ContentTypeResolver, FileAndResourceDirectives}
import akka.http.scaladsl.server.directives.RouteDirectives.complete
import akka.pattern.ask
import net.creasource.Application
import net.creasource.exceptions.NotFoundException
import net.creasource.webflix.actors.LibrarySupervisor.{GetFileById, GetLibrary}
import net.creasource.webflix.actors.MediaTypesActor.GetContentTypeResolver
import net.creasource.webflix.{Library, LibraryFile}

import scala.concurrent.Future
import scala.concurrent.duration._

object VideosRoutes extends FileAndResourceDirectives {

  implicit val askTimeout: akka.util.Timeout = 2.seconds

  def routes(app: Application): Route =
    path(Segment) { id =>
      extractExecutionContext { implicit executor =>
        val f1: Future[Route] = for {
          file <- (app.libraries ? GetFileById(id)).mapTo[LibraryFile]
          if !file.isDirectory
          library <- (app.libraries ? GetLibrary(file.libraryName)).mapTo[Library]
          ctr <- (app.mediaTypesActor ? GetContentTypeResolver).mapTo[ContentTypeResolver]
        } yield {
          library match {
            case lib: Library.Local =>
              val path = lib.resolvePath(file.path)
              optionalHeaderValueByType[Range](()) {
                case Some(Range(RangeUnits.Bytes, Seq(range))) => getFromFileWithRange(path.toFile, range)(ctr)
                case _ => getFromFile(path.toFile)(ctr)
              }
            case _ => ???
          }
        }
        val f2 = f1.recover {
          case NotFoundException(message) => complete(StatusCodes.NotFound -> message)
          case _: java.util.NoSuchElementException => complete(StatusCodes.BadRequest, "Requested id does not match any video file")
        }
        onSuccess(f2)(r => r)
      }
    }


}
