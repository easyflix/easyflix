package net.easyflix.model

import java.net.InetAddress
import java.nio.file.{Path, Paths}

import akka.NotUsed
import akka.http.scaladsl.model.headers.ByteRange
import akka.stream.IOResult
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.alpakka.file.scaladsl.{Directory, DirectoryChangesSource}
import akka.stream.alpakka.ftp.scaladsl.{Ftp, Ftps}
import akka.stream.alpakka.ftp.{FtpCredentials, FtpSettings, FtpsSettings}
import akka.stream.alpakka.s3.scaladsl.{S3 => AS3}
import akka.stream.alpakka.s3.{ObjectMetadata, S3Attributes, S3Ext}
import akka.stream.scaladsl.Source
import akka.util.ByteString
import com.amazonaws.auth.{AWSStaticCredentialsProvider, BasicAWSCredentials}
import com.amazonaws.regions.{AwsRegionProvider, Regions}
import me.nimavat.shortid.ShortId
import net.easyflix.app.Application
import net.easyflix.exceptions.ValidationException
import net.easyflix.json.JsonSupport
import net.easyflix.model.Library.FTP.Types
import spray.json._

import scala.concurrent.Future
import scala.concurrent.duration.{FiniteDuration, _}
import scala.util.{Failure, Success, Try}

import net.easyflix.util.VideoResolver.isVideo

sealed trait Library {
  val name: String
  val path: Path

  def scan()(implicit app: Application): Source[LibraryFile, NotUsed] = scan(path)
  def scan(path: Path)(implicit app: Application): Source[LibraryFile, NotUsed]

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
  def validate(): Try[Library] = {
    Try(Paths.get(name)).map(_ => this).recover{ case _: Exception => throw ValidationException("name", "pattern") }
  }
}

object Library extends JsonSupport {

  trait Watchable { self: Library =>
    val pollInterval: FiniteDuration
    def watch()(implicit app: Application): Source[LibraryFileChange, NotUsed] = watch(path)
    def watch(path: Path)(implicit app: Application): Source[LibraryFileChange, NotUsed]
  }

  case class Local(
      name: String,
      path: Path,
      totalSpace: Long = 1,
      freeSpace: Long = 1,
      pollInterval: FiniteDuration = 1.second
  ) extends Library with Library.Watchable {

    override def scan(path: Path)(implicit app: Application): Source[LibraryFile, NotUsed] = {
      if (path.isAbsolute & path != this.path)
        throw new IllegalArgumentException("Path must be the library path or a sub-folder relative path")
      Directory.walk(resolvePath(path)).map(p => {
        val file = p.toFile
        Option(file.isDirectory || isVideo(file.getName)).collect{
          case true => LibraryFile(
            ShortId.generate(),
            file.getName,
            relativizePath(p),
            file.isDirectory,
            file.length(),
            file.lastModified(),
            name
          )
        }
      }).collect{ case option if option.isDefined => option.get }
    }

    override def watch(path: Path)(implicit app: Application): Source[LibraryFileChange, NotUsed] = {
      if (path.isAbsolute & path != this.path)
        throw new IllegalArgumentException("Path must be the library path or a sub-folder relative path")
      DirectoryChangesSource(resolvePath(path), pollInterval, maxBufferSize = 1000).collect {
        case (p, DirectoryChange.Creation) if p.toFile.isDirectory || isVideo(p.getFileName.toString) =>
          val file = p.toFile
          LibraryFileChange.Creation(LibraryFile(
            ShortId.generate(),
            file.getName,
            relativizePath(p),
            file.isDirectory,
            file.length(),
            file.lastModified(),
            name
          ))
        case (p, DirectoryChange.Deletion) if p.toFile.isDirectory || isVideo(p.getFileName.toString) =>
          LibraryFileChange.Deletion(relativizePath(p))
      }
    }

    override def validate(): Try[Library] = {
      for {
        _ <- super.validate()
        _ <- if (name != "")              Success(()) else Failure(ValidationException("name", "required"))
        _ <- if (path.toString != "")     Success(()) else Failure(ValidationException("path", "required"))
        _ <- if (path.isAbsolute)         Success(()) else Failure(ValidationException("path", "notAbsolute"))
        _ <- if (path.toFile.exists)      Success(()) else Failure(ValidationException("path", "doesNotExist"))
        _ <- if (path.toFile.isDirectory) Success(()) else Failure(ValidationException("path", "notDirectory"))
        _ <- if (path.toFile.canRead)     Success(()) else Failure(ValidationException("path", "notReadable"))
      } yield this.copy(totalSpace = path.toFile.getTotalSpace, freeSpace = path.toFile.getFreeSpace)
    }
  }

  case class FTP(
      name: String,
      path: Path,
      hostname: String,
      port: Int,
      username: String,
      password: String,
      passive: Boolean,
      conType: FTP.Types.Value
  ) extends Library {

    private lazy val ftpSettings = FtpSettings
      .create(InetAddress.getByName(hostname))
      .withPort(port)
      .withBinary(true)
      .withCredentials(FtpCredentials.create(username, password))
      .withPassiveMode(passive)

    private lazy val ftpsSettings = FtpsSettings
      .create(InetAddress.getByName(hostname))
      .withPort(port)
      .withBinary(true)
      .withCredentials(FtpCredentials.create(username, password))
      .withPassiveMode(passive)

    override def scan()(implicit app: Application): Source[LibraryFile, NotUsed] =
      Source.single(LibraryFile(
        ShortId.generate(),
        name,
        relativizePath(path),
        isDirectory = true,
        0L,
        0L,
        name
      )).concat(scan(path))

    override def scan(path: Path)(implicit app: Application): Source[LibraryFile, NotUsed] = {
      val source = conType match {
        case Types.FTP => Ftp.ls(path.toString, ftpSettings, _ => true, emitTraversedDirectories = true)
        case Types.FTPS => Ftps.ls(path.toString, ftpsSettings, _ => true, emitTraversedDirectories = true)
      }
      source.map(file => {
        val filePath = Paths.get(file.path.replaceFirst("^/", ""))
        Option(file.isDirectory || isVideo(file.name)).collect{
          case true => LibraryFile(
            ShortId.generate(),
            file.name,
            relativizePath(filePath),
            file.isDirectory,
            file.size,
            file.lastModified,
            name
          )
        }
      }).collect{ case option if option.isDefined => option.get }
    }

    def fromPath(path: Path, offset: Long = 0L): Source[ByteString, Future[IOResult]] = conType match {
      case Types.FTP => Ftp.fromPath(path.toString.replaceAll("""\\""", "/"), ftpSettings, 8192, offset)
      case Types.FTPS => Ftps.fromPath(path.toString.replaceAll("""\\""", "/"), ftpsSettings, 8192, offset)
    }

    override def validate(): Try[Library] =
      for {
        _ <- super.validate()
        _ <- Try(InetAddress.getByName(hostname)).map(_ => ())
            .recover{ case _: Exception => throw ValidationException("hostname", "invalid") }
        _ <- if (name != "")          Success(()) else Failure(ValidationException("name", "required"))
        _ <- if (hostname != "")      Success(()) else Failure(ValidationException("hostname", "required"))
        _ <- if (username != "")      Success(()) else Failure(ValidationException("username", "required"))
        _ <- if (password != "")      Success(()) else Failure(ValidationException("password", "required"))
      } yield this
  }

  case class S3(
      name: String,
      path: Path, // The path prefix
      bucket: String,
      accessId: String,
      accessSecret: String,
      region: Regions
  ) extends Library {

    private def settings()(implicit app: Application) = S3Ext(app.system).settings
      .withCredentialsProvider(new AWSStaticCredentialsProvider(
        new BasicAWSCredentials(accessId, accessSecret)
      ))
      .withS3RegionProvider(new AwsRegionProvider {
        override def getRegion: String = region.getName
      })

    def download(
        path: Path,
        range: Option[ByteRange]
    )(implicit app: Application): Source[Option[(Source[ByteString, NotUsed], ObjectMetadata)], NotUsed] = {
      AS3.download(bucket, path.toString.replaceAll("""\\""", "/"), range)
          .withAttributes(S3Attributes.settings(settings))
    }

    override def scan()(implicit app: Application): Source[LibraryFile, NotUsed] =
      Source.single(LibraryFile(
        ShortId.generate(),
        name,
        relativizePath(path),
        isDirectory = true,
        0L,
        0L,
        name
      )).concat(scan(path))

    override def scan(path: Path)(implicit app: Application): Source[LibraryFile, NotUsed] = {
      AS3.listBucket(bucket, Some(path.toString)).withAttributes(S3Attributes.settings(settings)).map { content =>
        val isDirectory = content.key.endsWith("/")
        val fileName = Paths.get(content.key).getFileName.toString
        val path = Paths.get(content.key)
        Option(isDirectory || isVideo(fileName)).collect{
          case true => LibraryFile(
            ShortId.generate(),
            fileName,
            relativizePath(path),
            isDirectory,
            content.size,
            content.lastModified.toEpochMilli,
            name
          )
        }
      }.collect {case opt if opt.isDefined => opt.get }
    }
  }

  object Local {
    implicit val reader: RootJsonReader[Local] = js => {
      val obj = js.asJsObject
      val name = obj.fields("name").convertTo[String]
      val path = obj.fields("path").convertTo[Path]
      Local(name, path)
    }
    implicit val writer: RootJsonWriter[Local] = local => JsObject(
      "type" -> "local".toJson,
      "name" -> local.name.toJson,
      "path" -> local.path.toJson,
      "totalSpace" -> local.totalSpace.toJson,
      "freeSpace" -> local.freeSpace.toJson
    )
    implicit val format: RootJsonFormat[Local] = rootJsonFormat(reader, writer)
  }

  object FTP {
    implicit val reader: RootJsonReader[FTP] = js => {
      val obj = js.asJsObject
      val name = obj.fields("name").convertTo[String]
      val path = obj.fields("path").convertTo[Path]
      val hostname = obj.fields("hostname").convertTo[String]
      val port = obj.fields("port").convertTo[Int]
      val username = obj.fields("username").convertTo[String]
      val password = obj.fields("password").convertTo[String]
      val passive = obj.fields("passive").convertTo[Boolean]
      val conType = obj.fields("conType").convertTo[Types.Value]
      FTP(name, path, hostname, port, username, password, passive, conType)
    }
    implicit val writer: RootJsonWriter[FTP] = ftp => JsObject(
      "type" -> "ftp".toJson,
      "name" -> ftp.name.toJson,
      "path" -> ftp.path.toJson,
      "hostname" -> ftp.hostname.toJson,
      "port" -> ftp.port.toJson,
      "username" -> ftp.username.toJson,
      "passive" -> ftp.passive.toJson,
      "conType" -> ftp.conType.toJson,
    )
    implicit val format: RootJsonFormat[FTP] = rootJsonFormat(reader, writer)

    object Types extends Enumeration {
      val FTP: Types.Value = Value("ftp")
      val FTPS: Types.Value = Value("ftps")

      implicit val reader: RootJsonReader[Types.Value] = js => Types.withName(js.convertTo[String])
      implicit val writer: RootJsonWriter[Types.Value] = value => value.toString.toJson
      implicit val format: RootJsonFormat[Types.Value] = rootJsonFormat(reader, writer)
    }
  }

  object S3 {
    implicit val reader: RootJsonReader[S3] = js => {
      val obj = js.asJsObject
      val name = obj.fields("name").convertTo[String]
      val path = obj.fields("path").convertTo[Path]
      val bucket = obj.fields("bucket").convertTo[String]
      val accessId = obj.fields("accessId").convertTo[String]
      val accessSecret = obj.fields("accessSecret").convertTo[String]
      val region = obj.fields("region").convertTo[Regions]
      S3(name, path, bucket, accessId, accessSecret, region)
    }
    implicit val writer: RootJsonWriter[S3] = s3 => JsObject(
      "type" -> "s3".toJson,
      "name" -> s3.name.toJson,
      "path" -> s3.path.toJson,
      "bucket" -> s3.bucket.toJson,
      "accessId" -> s3.accessId.toJson,
      "region" -> s3.region.getName.toJson
    )
    implicit val format: RootJsonFormat[S3] = rootJsonFormat(reader, writer)
    implicit val regionsReader: RootJsonReader[Regions] = js => Regions.fromName(js.convertTo[String])
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
