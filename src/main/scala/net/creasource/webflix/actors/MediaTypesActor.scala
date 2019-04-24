package net.creasource.webflix.actors

import akka.Done
import akka.actor.{Actor, Props}
import akka.http.scaladsl.model.MediaType.NotCompressible
import akka.http.scaladsl.model.{ContentType, MediaType}
import akka.http.scaladsl.server.directives.ContentTypeResolver
import net.creasource.Application
import net.creasource.json.JsonSupport
import net.creasource.webflix.events.ResolverUpdate
import spray.json.RootJsonFormat

object MediaTypesActor extends JsonSupport {

  val `video/x-mastroka`: MediaType.Binary = MediaType.video("x-mastroka", NotCompressible, "mkv")

  case object GetMediaTypes
  case object GetContentTypeResolver

  case class AddMediaType(mediaType: MediaType.Binary)

  sealed trait AddMediaTypeResult
  case class AddMediaTypeSuccess(mediaType: MediaType.Binary) extends AddMediaTypeResult
  case class AddMediaTypeError(control: String, code: String, value: Option[String]) extends AddMediaTypeResult
  object AddMediaTypeError {
    def apply(control: String, code: String): AddMediaTypeError = apply(control, code, None)
    implicit val format: RootJsonFormat[AddMediaTypeError] = jsonFormat3(AddMediaTypeError.apply)
  }

  case class RemoveMediaType(subType: String)

  def props()(implicit app: Application): Props = Props(new MediaTypesActor)

  def getContentTypeResolver(customMediaTypes: Seq[MediaType.Binary]): ContentTypeResolver = (fileName: String) =>  {
    val lastDotIx = fileName.lastIndexOf('.')
    if (lastDotIx >= 0) {
      val extension = fileName.substring(lastDotIx + 1)
      customMediaTypes.find(mediaType => mediaType.fileExtensions.contains(extension)) match {
        case Some(mediaType) => ContentType(mediaType)
        case None => ContentTypeResolver.Default(fileName)
      }
    } else ContentTypeResolver.Default(fileName)
  }

  val defaultContentTypeResolver: ContentTypeResolver = getContentTypeResolver(Seq(`video/x-mastroka`))

}

class MediaTypesActor()(implicit val app: Application) extends Actor {

  import MediaTypesActor._

  var mediaTypes: Map[String, MediaType.Binary] = Map(`video/x-mastroka`.subType -> `video/x-mastroka`)

  var contentTypeResolver: ContentTypeResolver = getContentTypeResolver(mediaTypes.values.toSeq)

  override def receive: Receive = {

    case GetMediaTypes => sender() ! mediaTypes.values.toSeq

    case AddMediaType(mediaType) =>
      if (!mediaType.isVideo) {
        sender() ! AddMediaTypeError("other", "notAVideoMediaType")
      } else if (mediaTypes.keys.toSeq.contains(mediaType.subType)) {
        sender() ! AddMediaTypeError("contentType", "alreadyExists")
      } else if (mediaTypes.values.toSeq.flatMap(_.fileExtensions).intersect(mediaType.fileExtensions).nonEmpty) {
        sender() ! AddMediaTypeError("extensions", "alreadyExists")
      } else {
        mediaTypes += (mediaType.subType -> mediaType)
        contentTypeResolver = getContentTypeResolver(mediaTypes.values.toSeq)
        app.bus.publish(ResolverUpdate(contentTypeResolver))
        sender() ! AddMediaTypeSuccess(mediaType)
      }

    case RemoveMediaType(subType) =>
      if (mediaTypes.isDefinedAt(subType)) {
        mediaTypes -= subType
        contentTypeResolver = getContentTypeResolver(mediaTypes.values.toSeq)
        app.bus.publish(ResolverUpdate(contentTypeResolver))
      }
      sender() ! Done

    case GetContentTypeResolver => sender() ! contentTypeResolver

  }

}
