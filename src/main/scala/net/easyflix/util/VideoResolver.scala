package net.easyflix.util

import akka.http.scaladsl.model.{ContentType, MediaType}
import akka.http.scaladsl.model.MediaType.NotCompressible
import akka.http.scaladsl.server.directives.ContentTypeResolver

object VideoResolver {

  private val `video/x-mastroka`: MediaType.Binary = MediaType.video("x-mastroka", NotCompressible, "mkv")

  private def getContentTypeResolver(customMediaTypes: Seq[MediaType.Binary]): ContentTypeResolver = (fileName: String) =>  {
    val lastDotIx = fileName.lastIndexOf('.')
    if (lastDotIx >= 0) {
      val extension = fileName.substring(lastDotIx + 1)
      customMediaTypes.find(mediaType => mediaType.fileExtensions.contains(extension)) match {
        case Some(mediaType) => ContentType(mediaType)
        case None => ContentTypeResolver.Default(fileName)
      }
    } else ContentTypeResolver.Default(fileName)
  }

  implicit val contentTypeResolver: ContentTypeResolver = getContentTypeResolver(Seq(`video/x-mastroka`))

  def isVideo(fileName: String): Boolean =
    contentTypeResolver(fileName).mediaType.isVideo

}
