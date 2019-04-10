package net.creasource.core

import akka.actor.{ActorRef, ActorSystem}
import akka.stream.ActorMaterializer
import com.typesafe.config.{Config, ConfigFactory}
import net.creasource.web.{LibraryActor, MediaTypesActor}

import scala.concurrent.Await

object Application {

  def apply() = new Application

}

/**
  * Represents an application. This is where you'll instantiate your top actors, connect to a database, etc...
  */
class Application {

  val config: Config = ConfigFactory.load()

  implicit val system: ActorSystem = ActorSystem("MySystem", config)
  implicit val materializer: ActorMaterializer = ActorMaterializer()

  system.log.info("Application starting.")

  val libraryActor: ActorRef = system.actorOf(LibraryActor.props()(this), "libraries")
  val mediaTypesActor: ActorRef = system.actorOf(MediaTypesActor.props()(this), "media-types")

  def shutdown() {
    system.log.info("Shutting down Akka materializer and system.")
    import scala.concurrent.duration._
    materializer.shutdown()
    Await.result(system.terminate(), 30.seconds)
  }

}
