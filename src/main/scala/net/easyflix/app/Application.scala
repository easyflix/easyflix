package net.easyflix.app

import akka.actor.{ActorRef, ActorSystem}
import akka.stream.ActorMaterializer
import com.typesafe.config.{Config, ConfigFactory}
import net.easyflix.actors.{LibrarySupervisor, TMDBActor}
import net.easyflix.events.ApplicationBus

import scala.concurrent.Await

object Application {

  def apply() = new Application

  case class Config(
      port: Int,
      host: String,
      tmdbApiKey: String,
      authKey: String,
      authTokenExpiration: String,
      authPassword: String)

}

class Application {

  val config: Config = ConfigFactory.load().getConfig("easyflix")

  implicit val system: ActorSystem = ActorSystem("Easyflix", config)
  implicit val materializer: ActorMaterializer = ActorMaterializer()

  val bus: ApplicationBus = new ApplicationBus
  val libraries: ActorRef = system.actorOf(LibrarySupervisor.props()(this), "libraries")
  val tmdb: ActorRef = system.actorOf(TMDBActor.props()(this), "tmdb")

  def shutdown() {
    system.log.info("Shutting down.")
    import scala.concurrent.duration._
    materializer.shutdown()
    Await.result(system.terminate(), 30.seconds)
  }

}
