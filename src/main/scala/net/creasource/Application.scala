package net.creasource

import akka.actor.{ActorRef, ActorSystem}
import akka.http.scaladsl.server.directives.ContentTypeResolver
import akka.stream.ActorMaterializer
import com.typesafe.config.{Config, ConfigFactory}
import net.creasource.webflix.actors.{LibrarySupervisor, MediaTypesActor}
import net.creasource.webflix.events.ApplicationBus

import scala.concurrent.Await

object Application {

  def apply() = new Application

}

/**
  * Represents an application. This is where you'll instantiate your top actors, connect to a database, etc...
  */
class Application {

  val config: Config = ConfigFactory.load().getConfig("webflix")

  implicit val system: ActorSystem = ActorSystem("MySystem", config)
  implicit val materializer: ActorMaterializer = ActorMaterializer()

  system.log.info("Application starting.")

  val bus: ApplicationBus = new ApplicationBus
  val libraries: ActorRef = system.actorOf(LibrarySupervisor.props()(this), "libraries")
  val mediaTypesActor: ActorRef = system.actorOf(MediaTypesActor.props()(this), "media-types")

  implicit val contentTypeResolver: ContentTypeResolver = MediaTypesActor.defaultContentTypeResolver

  def shutdown() {
    system.log.info("Shutting down Akka materializer and system.")
    import scala.concurrent.duration._
    materializer.shutdown()
    Await.result(system.terminate(), 30.seconds)
  }

}
