package net.creasource.webflix

import java.io.File

import akka.http.scaladsl.model.headers.{ByteRange, RangeUnits, `Accept-Ranges`, `Content-Range`}
import akka.http.scaladsl.model.{ContentRange, HttpEntity, HttpResponse, StatusCodes}
import akka.http.scaladsl.server.Directives.get
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.server.directives.ContentTypeResolver
import akka.http.scaladsl.server.directives.RouteDirectives.{complete, reject}
import akka.stream.scaladsl.FileIO

package object routes {

  private class IndexRange(val start: Long, val end: Long) {
    def length: Long = end - start
    def contentRange(entityLength: Long): ContentRange.Default = ContentRange(start, end - 1, entityLength)
  }

  private def indexRange(entityLength: Long, range: ByteRange): IndexRange =
    range match {
      case ByteRange.Slice(start, end)    ⇒ new IndexRange(start, math.min(end + 1, entityLength))
      case ByteRange.FromOffset(first)    ⇒ new IndexRange(first, entityLength)
      case ByteRange.Suffix(suffixLength) ⇒ new IndexRange(math.max(0, entityLength - suffixLength), entityLength)
    }

  def getFromFileWithRange(file: File, range: ByteRange)(implicit contentTypeResolver: ContentTypeResolver): Route = {
    get {
      if (file.isFile && file.canRead) {
        val idxRange = indexRange(file.length, range)
        val response = HttpResponse(
          status = StatusCodes.PartialContent,
          entity = HttpEntity.Default(
            contentType = contentTypeResolver(file.getName),
            contentLength = idxRange.length,
            data = FileIO.fromPath(file.toPath, 8192, idxRange.start).take(idxRange.length / 8192 + 1) // FIXME data length might be bigger thant contentLength
          )
        ).withHeaders(
          `Content-Range`(idxRange.contentRange(file.length)),
          `Accept-Ranges`(RangeUnits.Bytes)
        )
        complete(response)
      } else reject
    }
  }

}
