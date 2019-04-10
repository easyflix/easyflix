package net.creasource.web

import akka.Done
import akka.actor.{Actor, Props}
import akka.http.scaladsl.model.MediaType
import akka.http.scaladsl.model.MediaType.NotCompressible
import net.creasource.core.Application

object MediaTypesActor {

  private val `video/x-mastroka`: MediaType.Binary = MediaType.video("x-mastroka", NotCompressible, "mkv")

  case object GetMediaTypes
  case class AddMediaType(mediaType: MediaType.Binary)
  case class RemoveMediaType(contentType: String)

  def props()(implicit application: Application): Props = Props(new MediaTypesActor)

}

class MediaTypesActor()(implicit val application: Application) extends Actor {

  import MediaTypesActor._

  var mediaTypes: Map[String, MediaType.Binary] = Map(`video/x-mastroka`.subType -> `video/x-mastroka`)

  override def receive: Receive = {

    case GetMediaTypes => sender() ! mediaTypes.values.toSeq

    case AddMediaType(mediaType) =>
      mediaTypes += (mediaType.subType -> mediaType)
      sender() ! Done

    case RemoveMediaType(contentType) =>
      mediaTypes -= contentType
      sender() ! Done

  }

}
