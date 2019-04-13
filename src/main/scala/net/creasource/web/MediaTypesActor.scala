package net.creasource.web

import akka.Done
import akka.actor.{Actor, Props}
import akka.http.scaladsl.model.{ContentType, MediaType}
import akka.http.scaladsl.model.MediaType.NotCompressible
import akka.http.scaladsl.server.directives.ContentTypeResolver
import net.creasource.core.Application
import spray.json.RootJsonFormat

object MediaTypesActor extends JsonSupport {

  private val `video/x-mastroka`: MediaType.Binary = MediaType.video("x-mastroka", NotCompressible, "mkv")

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

  case class RemoveMediaType(contentType: String)

  def props()(implicit application: Application): Props = Props(new MediaTypesActor)

}

class MediaTypesActor()(implicit val application: Application) extends Actor {

  import MediaTypesActor._

  var mediaTypes: Map[String, MediaType.Binary] = Map(`video/x-mastroka`.subType -> `video/x-mastroka`)

  var contentTypeResolver: ContentTypeResolver = getContentTypeResolver(mediaTypes.values.toSeq)

  override def receive: Receive = {

    case GetMediaTypes => sender() ! mediaTypes.values.toSeq

    case AddMediaType(mediaType) =>
      if (mediaTypes.keys.toSeq.contains(mediaType.subType)) {
        sender() ! AddMediaTypeError("contentType", "alreadyExists")
      } else if (mediaTypes.values.toSeq.flatMap(_.fileExtensions).intersect(mediaType.fileExtensions).nonEmpty) {
        sender() ! AddMediaTypeError("extensions", "alreadyExists")
      } else {
        mediaTypes += (mediaType.subType -> mediaType)
        contentTypeResolver = getContentTypeResolver(mediaTypes.values.toSeq)
        application.libraryActor ! contentTypeResolver
        sender() ! AddMediaTypeSuccess(mediaType)
      }

    case RemoveMediaType(contentType) =>
      mediaTypes -= contentType
      contentTypeResolver = getContentTypeResolver(mediaTypes.values.toSeq)
      application.libraryActor ! contentTypeResolver
      sender() ! Done

    case GetContentTypeResolver => sender() ! contentTypeResolver

  }

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

}
