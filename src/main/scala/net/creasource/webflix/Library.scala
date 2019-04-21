package net.creasource.webflix

import java.net.InetAddress
import java.nio.file.{Path, Paths}

import akka.NotUsed
import akka.http.scaladsl.server.directives.ContentTypeResolver
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.alpakka.file.scaladsl.{Directory, DirectoryChangesSource}
import akka.stream.alpakka.ftp.scaladsl.Ftps
import akka.stream.alpakka.ftp.{FtpCredentials, FtpsSettings}
import akka.stream.scaladsl.Source
import net.creasource.exceptions.ValidationException
import net.creasource.json.JsonSupport
import spray.json._

import scala.concurrent.duration.{FiniteDuration, _}
import scala.util.{Failure, Success, Try}

sealed trait Library {
  val name: String
  val path: Path

  def scan()(implicit contentTypeResolver: ContentTypeResolver): Source[LibraryFile, NotUsed] = scan(path)
  def scan(path: Path)(implicit contentTypeResolver: ContentTypeResolver): Source[LibraryFile, NotUsed]

  def relativizePath(path: Path): Path = {
    val relativePath = this.path.relativize(path)
    Paths.get(name).resolve(relativePath).normalize()
  }
  def resolvePath(relativePath: Path): Path = {
    if (relativePath.isAbsolute) {
      relativePath
    } else {
      this.path.resolve(Paths.get(name).relativize(relativePath))
    }
  }
  def validate(): Try[Unit] = {
    Try(Paths.get(name)).map(_ => ()).recover{ case _: Exception => throw ValidationException("name", "pattern") }
  }
}

object Library extends JsonSupport {

  trait Watchable { self: Library =>
    val pollInterval: FiniteDuration
    def watch()(implicit contentTypeResolver: ContentTypeResolver): Source[(LibraryFile, DirectoryChange), NotUsed] = watch(path)
    def watch(path: Path)(implicit contentTypeResolver: ContentTypeResolver): Source[(LibraryFile, DirectoryChange), NotUsed]
  }

  case class Local(name: String, path: Path, pollInterval: FiniteDuration = 1.second) extends Library with Library.Watchable {

    override def scan(path: Path)(implicit contentTypeResolver: ContentTypeResolver): Source[LibraryFile, NotUsed] = {
      if (path.isAbsolute & path != this.path) throw new IllegalArgumentException("Path must be the library path or a sub-folder relative path")
      Directory.walk(resolvePath(path)).map(p => {
        val file = p.toFile
        Option(file.isDirectory || file.isFile & contentTypeResolver(file.getName).mediaType.isVideo).collect{
          case true => LibraryFile(file.getName, relativizePath(p), file.isDirectory, file.length(), file.lastModified(), name)
        }
      }).collect{ case option if option.isDefined => option.get }
    }

    override def watch(path: Path)(implicit contentTypeResolver: ContentTypeResolver): Source[(LibraryFile, DirectoryChange), NotUsed] = {
      if (path.isAbsolute & path != this.path) throw new IllegalArgumentException("Path must be the library path or a sub-folder relative path")
      DirectoryChangesSource(resolvePath(path), pollInterval, maxBufferSize = 1000).map {
        case (p, directoryChange) =>
          val file = p.toFile
          (LibraryFile(file.getName, relativizePath(p), file.isDirectory, file.length(), file.lastModified(), name), directoryChange)
      }
    }

    override def validate(): Try[Unit] = {
      for {
        _ <- super.validate()
        _ <- if (name != "")              Success(()) else Failure(ValidationException("name", "required"))
        _ <- if (path.toString != "")     Success(()) else Failure(ValidationException("path", "required"))
        _ <- if (path.isAbsolute)         Success(()) else Failure(ValidationException("path", "notAbsolute"))
        _ <- if (path.toFile.exists)      Success(()) else Failure(ValidationException("path", "doesNotExist"))
        _ <- if (path.toFile.isDirectory) Success(()) else Failure(ValidationException("path", "notDirectory"))
        _ <- if (path.toFile.canRead)     Success(()) else Failure(ValidationException("path", "notReadable"))
      } yield ()
    }
  }

  case class FTP(name: String, path: Path, hostname: String, port: Int, username: String, password: String, passive: Boolean) extends Library {

    lazy val ftpSettings: FtpsSettings = FtpsSettings
      .create(InetAddress.getByName(hostname))
      .withPort(port)
      .withBinary(true)
      .withCredentials(FtpCredentials.create(username, password))
      .withPassiveMode(true)
      // Debugging
      /*.withConfigureConnection((ftpClient: FTPSClient) => {
        ftpClient.addProtocolCommandListener(new PrintCommandListener(new PrintWriter(System.out), true))
      })*/

    override def scan()(implicit contentTypeResolver: ContentTypeResolver): Source[LibraryFile, NotUsed] =
      Source.single(LibraryFile(name, relativizePath(path), isDirectory = true, 0L, 0L, name)).concat(scan(path))

    override def scan(path: Path)(implicit contentTypeResolver: ContentTypeResolver): Source[LibraryFile, NotUsed] =
      Ftps.ls(path.toString, ftpSettings).map(file => { // TODO list folders (https://github.com/akka/alpakka/issues/1657)
        val filePath = Paths.get(file.path.replaceFirst("^/", ""))
        Option(file.isDirectory || !file.isDirectory & contentTypeResolver(file.name).mediaType.isVideo).collect{
          case true => LibraryFile(file.name, relativizePath(filePath), file.isDirectory, file.size, file.lastModified, name)
        }
      }).collect{ case option if option.isDefined => option.get }

    override def validate(): Try[Unit] =
      for {
        _ <- super.validate()
        _ <- Try(InetAddress.getByName(hostname)).map(_ => ()).recover{ case _: Exception => throw ValidationException("hostname", "invalid") }
        _ <- if (name != "")          Success(()) else Failure(ValidationException("name", "required"))
        _ <- if (hostname != "")      Success(()) else Failure(ValidationException("hostname", "required"))
//        _ <- if (path.toString != "") Success(()) else Failure(ValidationException("path", "required"))
        _ <- if (username != "")      Success(()) else Failure(ValidationException("username", "required"))
        _ <- if (password != "")      Success(()) else Failure(ValidationException("password", "required"))
      } yield ()
  }

  case class S3(name: String, path: Path) extends Library {
    override def scan(path: Path)(implicit contentTypeResolver: ContentTypeResolver): Source[LibraryFile, NotUsed] = ???
  }

  object Local {
    implicit val reader: RootJsonReader[Local] = js => {
      val obj = js.asJsObject
      val name = obj.fields("name").convertTo[String]
      val path = obj.fields("path").convertTo[Path]
      Local(name, path) // TODO must ensure that path is absolute
    }
    implicit val writer: RootJsonWriter[Local] = local => JsObject(
      "type" -> "local".toJson,
      "name" -> local.name.toJson,
      "path" -> local.path.toJson
    )
    implicit val format: RootJsonFormat[Local] = rootJsonFormat(reader, writer)
  }

  object FTP {
    implicit val format: RootJsonFormat[FTP] = jsonFormat(FTP.apply, "name", "path", "hostname", "port", "username", "password", "passive")
  }

  object S3 {
    implicit val reader: RootJsonReader[S3] = ???
    implicit val writer: RootJsonWriter[S3] = ???
    implicit val format: RootJsonFormat[S3] = rootJsonFormat(reader, writer)
  }

  implicit val writer: RootJsonWriter[Library] = {
    case library: Local => library.toJson
    case library: FTP => library.toJson
    case library: S3 => library.toJson
  }

  implicit val reader: RootJsonReader[Library] = js =>
    js.asJsObject.fields("type").convertTo[String] match {
      case "local" => js.convertTo[Local]
      case "ftp" => js.convertTo[FTP]
      case "s3" => js.convertTo[S3]
      case _ => throw DeserializationException("Only local, ftp and s3 library types are supported", fieldNames = List("type"))
    }

  implicit val format: RootJsonFormat[Library] = rootJsonFormat(reader, writer)

}
