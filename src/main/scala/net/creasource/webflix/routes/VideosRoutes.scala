package net.creasource.webflix.routes

import akka.http.scaladsl.model._
import akka.http.scaladsl.model.headers.{ByteRange, Range, RangeUnits, `Accept-Ranges`, `Content-Range`}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.server.directives.RouteDirectives.complete
import akka.http.scaladsl.server.directives.{FileAndResourceDirectives, RangeDirectives}
import akka.pattern.ask
import akka.stream.scaladsl.Sink
import net.creasource.Application
import net.creasource.exceptions.NotFoundException
import net.creasource.webflix.actors.LibrarySupervisor.{GetFileById, GetLibrary}
import net.creasource.webflix.{Library, LibraryFile}

import scala.collection.immutable.Seq
import scala.concurrent.Future
import scala.concurrent.duration._

object VideosRoutes extends FileAndResourceDirectives {

  implicit val askTimeout: akka.util.Timeout = 2.seconds

  def routes(app: Application): Route = pathPrefix("videos") { Route.seal(subs(app)) }

  private def subs(app: Application): Route =
    path(Segment) { id =>
      extractExecutionContext { implicit executor =>
        val f1: Future[Route] = for {
          file <- (app.libraries ? GetFileById(id)).mapTo[LibraryFile]
          if !file.isDirectory
          library <- (app.libraries ? GetLibrary(file.libraryName)).mapTo[Library]
        } yield {
          val ctr = app.contentTypeResolver
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
            case lib: Library.S3 =>
              optionalHeaderValueByType[Range](()) { rangeHeader =>
                val rangeOpt: Option[ByteRange] = rangeHeader match {
                  case Some(Range(RangeUnits.Bytes, Seq(range))) => Some(range)
                  case _ => None
                }
                onSuccess(lib.download(path, rangeOpt)(app).runWith(Sink.head)(app.materializer)) {
                  case Some((source, metadata)) =>
                    val contentRangeHeader: Seq[HttpHeader] = rangeOpt match {
                      case Some(ByteRange.FromOffset(offset)) =>
                        Seq(`Content-Range`(RangeUnits.Bytes, ContentRange(offset, file.size - 1, file.size)))
                      case _ => Nil
                    }
                    complete(HttpResponse(
                      status = rangeOpt.map(_ => StatusCodes.PartialContent).getOrElse(StatusCodes.OK),
                      headers = Seq(`Accept-Ranges`(RangeUnits.Bytes)) ++ contentRangeHeader,
                      entity = HttpEntity.Default(ctr(path.getFileName.toString), metadata.contentLength, source)
                    ))
                  case None => complete(StatusCodes.NotFound)
                }
              }

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
