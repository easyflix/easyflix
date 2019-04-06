package net.creasource.core

import java.nio.file.Paths

import akka.actor.{ActorRef, ActorSystem}
import akka.stream.ActorMaterializer
import com.typesafe.config.{Config, ConfigFactory}
import net.creasource.model.Library
import net.creasource.web.LibraryActor
import net.creasource.web.LibraryActor.ScanLibrary

import scala.concurrent.Await

import akka.pattern.ask
import scala.concurrent.duration._

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

  val libraryActor: ActorRef = system.actorOf(LibraryActor.props()(this), "library")

  val videos = Library(name = "Vidéos", path = Paths.get("D:\\Vidéos"))
  (libraryActor ? ScanLibrary(videos))(10.seconds)


  //  val settingsActor: ActorRef = system.actorOf(SettingsActor.props()(this), "settings")
//  val lyricsActor: ActorRef = system.actorOf(LyricsActor.props()(this), "lyrics")

  def shutdown() {
    system.log.info("Shutting down Akka materializer and system.")
    import scala.concurrent.duration._
    materializer.shutdown()
    Await.result(system.terminate(), 30.seconds)
  }

}
