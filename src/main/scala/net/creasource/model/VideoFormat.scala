package net.creasource.model

import java.io.File
import java.nio.file.Path

object VideoFormat extends Enumeration {
  type VideoFormat = Value

  val MKV: Value = Value("mkv")
  val MP4: Value = Value("mp4")
  val AVI: Value = Value("avi")
  val WEBM: Value = Value("webm")

  def getFormat(path: Path): Option[VideoFormat] = {
    val extension: String =
      path.getFileName.toString.split("""\.""").last.toLowerCase
    VideoFormat.values.toSeq.find(format => format.toString == extension)
  }

  def getFormat(file: File): Option[VideoFormat] = {
    getFormat(file.toPath)
  }
}
