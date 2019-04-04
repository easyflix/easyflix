package net.creasource.web

import java.nio.file.Paths

import akka.actor.{Actor, Props}
import net.creasource.model.Library

object LibraryActor {

  case object GetLibraries

  def props(): Props = Props(new LibraryActor)

}

class LibraryActor extends Actor {

  import LibraryActor._

  var libraries: Seq[Library] = Seq(Library("Vidéos", Paths.get("D:/Vidéos")))

  override def receive: Receive = {

    case GetLibraries => sender ! libraries

  }

}
