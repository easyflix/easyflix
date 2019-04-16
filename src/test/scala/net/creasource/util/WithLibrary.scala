package net.creasource.util

import java.nio.file.{Path, Paths}

import org.scalatest.{BeforeAndAfterAll, Suite}

trait WithLibrary extends BeforeAndAfterAll { self: Suite =>

  val libraryPath: Path = Paths.get("src/test/resources/library").toAbsolutePath

  val libraryFiles: Seq[(Path, Boolean)] = Seq(
    (libraryPath.resolve("folder1"), true),
    (libraryPath.resolve("folder1/movie.1.1.avi"), false),
    (libraryPath.resolve("folder2"), true),
    (libraryPath.resolve("folder2/movie.2.1.avi"), false),
    (libraryPath.resolve("movie.0.1.avi"), false),
  )

  val uncreatedFiles: Seq[Path] = Seq(
    libraryPath.resolve("movie.0.2.avi"),
    libraryPath.resolve("folder1/movie.1.2.avi"),
    libraryPath.resolve("folder2/movie.2.2.avi"),
  )

  val uncreatedSubFolders: Seq[Path] = Seq(
    libraryPath.resolve("folder3"),
  )

  val uncreatedSubFiles: Seq[Path] = Seq(
    libraryPath.resolve("folder3/movie.avi"),
  )

  override def beforeAll(): Unit = {
    libraryPath.toFile.mkdirs()
    libraryFiles.foreach{case (path, isDirectory) =>
      if (isDirectory) path.toFile.mkdir()
      else path.toFile.createNewFile()
    }
    super.beforeAll()
  }

  override def afterAll(): Unit = {
    // Delete files
    libraryFiles.filter(!_._2).foreach(_._1.toFile.delete())
    uncreatedFiles.foreach(_.toFile.delete())
    uncreatedSubFiles.foreach(_.toFile.delete())
    // Delete folders
    libraryFiles.filter(_._2).foreach(_._1.toFile.delete())
    uncreatedSubFolders.foreach(_.toFile.delete())
    libraryPath.toFile.delete()
    super.beforeAll()
  }

}
