package net.creasource.web

import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.pattern.ask
import net.creasource.core.Application
import net.creasource.model.Library
import net.creasource.web.LibraryActor.GetLibraries

import scala.concurrent.duration._

object LibraryRoutes {

  implicit val askTimeout: akka.util.Timeout = 2.seconds

  def routes(application: Application): Route =
    Route.seal(pathPrefix("videos") {
      onSuccess((application.libraryActor ? GetLibraries).mapTo[Seq[Library]]) { libraries =>
        libraries.map(lib => {
          pathPrefix(lib.name) {
            getFromBrowseableDirectory(lib.path.toString)
          }
        }).reduce(_ ~ _)
      }
    })

}
