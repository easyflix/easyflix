package net.creasource.webflix.routes

import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.model.headers.{Range, RangeUnits}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.server.directives.RouteDirectives.complete
import akka.http.scaladsl.server.directives.{ContentTypeResolver, FileAndResourceDirectives}
import akka.pattern.ask
import net.creasource.Application
import net.creasource.webflix.LibraryFile
/*import net.creasource.webflix.LibraryFile.{Folder, Video}
import net.creasource.webflix.actors.LibraryActor.GetLibraryFile
import net.creasource.webflix.actors.MediaTypesActor.GetContentTypeResolver*/

import scala.concurrent.duration._

object VideosRoutes extends FileAndResourceDirectives {

  implicit val askTimeout: akka.util.Timeout = 2.seconds

  def routes(application: Application): Route =
    complete(StatusCodes.OK)
        /*path(Segment) { id =>
          onSuccess((application.libraryActor ? GetLibraryFile(id)).mapTo[Option[LibraryFile]]) {
            case Some(Video(_, _, _, _, path)) =>
              onSuccess((application.mediaTypesActor ? GetContentTypeResolver).mapTo[ContentTypeResolver]) { implicit contentTypeResolver =>
                // https://bugzilla.mozilla.org/show_bug.cgi?id=1422891
                optionalHeaderValueByType[Range](()) {
                  case Some(Range(RangeUnits.Bytes, Seq(range))) => getFromFileWithRange(path.toFile, range)
                  case _ => getFromFile(path.toFile)
                }
              }
            case Some (Folder(_, _, _, _)) =>
              // getFromBrowseableDirectory()
              complete(StatusCodes.NotAcceptable, "Requested id does not match any video file")
            case _ =>
              complete(StatusCodes.NotFound, "The requested resource could not be found")
          }
        }*/


}
