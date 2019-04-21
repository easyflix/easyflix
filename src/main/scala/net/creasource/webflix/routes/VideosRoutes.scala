package net.creasource.webflix.routes

import akka.http.scaladsl.model.headers.{Range, RangeUnits}
import akka.http.scaladsl.model.{HttpEntity, HttpResponse, StatusCodes}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.server.directives.RouteDirectives.complete
import akka.http.scaladsl.server.directives.{ContentTypeResolver, FileAndResourceDirectives, RangeDirectives}
import akka.pattern.ask
import akka.stream.alpakka.ftp.scaladsl.Ftps
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
          val path = library.resolvePath(file.path)
          library match {
            case _: Library.Local =>
              optionalHeaderValueByType[Range](()) {
                case Some(Range(RangeUnits.Bytes, Seq(range))) => getFromFileWithRange(path.toFile, range)(ctr)
                case _ => getFromFile(path.toFile)(ctr)
              }
            case lib: Library.FTP =>
              val entity =
                if (file.size > 0)
                  HttpEntity.Default(ctr(path.getFileName.toString), file.size, lib.fromPath(path))
                else
                  HttpEntity.empty(ctr(path.getFileName.toString))
              RangeDirectives.withRangeSupport {
                complete(HttpResponse(StatusCodes.OK, entity = entity))
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
