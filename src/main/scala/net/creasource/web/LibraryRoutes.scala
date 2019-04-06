package net.creasource.web

import akka.http.scaladsl.model.MediaType.NotCompressible
import akka.http.scaladsl.model._
import akka.http.scaladsl.model.headers.{Range, RangeUnits}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.server.directives.RouteDirectives.complete
import akka.http.scaladsl.server.directives.{ContentTypeResolver, FileAndResourceDirectives}
import akka.pattern.ask
import net.creasource.core.Application
import net.creasource.model.{Folder, LibraryFile, Video}
import net.creasource.web.LibraryActor.GetLibraryFile

import scala.concurrent.duration._

object LibraryRoutes extends FileAndResourceDirectives {

  implicit val askTimeout: akka.util.Timeout = 2.seconds

  val `video/x-mastroka`: MediaType.Binary = MediaType.video("x-mastroka", NotCompressible, "mkv")

  implicit val contentTypeResolver: ContentTypeResolver = (fileName: String) => {
    val lastDotIx = fileName.lastIndexOf('.')
    if (lastDotIx >= 0) {
      fileName.substring(lastDotIx + 1) match {
        case "mkv" => ContentType(`video/x-mastroka`)
        case _ => ContentTypeResolver.Default(fileName)
      }
    } else ContentTypeResolver.Default(fileName)
  }

  def routes(application: Application): Route =
    Route.seal(pathPrefix("videos") {
      path(Segment) { id =>
        onSuccess((application.libraryActor ? GetLibraryFile(id)).mapTo[Option[LibraryFile]]) {
          case Some(Video(_, _, _, _, _, path)) =>
            val file = path.toFile
            optionalHeaderValueByType[Range](()) {
              case Some(Range(RangeUnits.Bytes, Seq(range))) => Routes.getFromFileWithRange(file, range)
              case _ => getFromFile(file)
            }
          case Some (Folder(_, _, _)) =>
            // getFromBrowseableDirectory()
            complete(StatusCodes.NotAcceptable, "Requested id does not match any video file")
          case _ =>
            complete(StatusCodes.NotFound, "The requested resource could not be found")
        }
      }
    })

}
