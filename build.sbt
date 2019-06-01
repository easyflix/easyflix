import Dependencies._

ThisBuild / scalaVersion     := "2.12.8"
ThisBuild / version          := "0.1.0-SNAPSHOT"
ThisBuild / organization     := "net.creasource"
ThisBuild / organizationName := "creasource"
ThisBuild / scalacOptions    := Seq("-unchecked", "-deprecation", "-feature")

lazy val root = (project in file("."))
  .settings(
    name := "webflix",
    resolvers += Resolver.bintrayRepo("snimavat", "maven"),

    libraryDependencies += akkaHttp,
    libraryDependencies += akkaHttpSprayJson,
    libraryDependencies += akkaStream,
    libraryDependencies += akkaActor,
    libraryDependencies += akkaSlf4j,
    libraryDependencies += logback,
    libraryDependencies += shortId,
    libraryDependencies += alpakkaFile,
    libraryDependencies += alpakkaFtp,
    libraryDependencies += alpakkaS3,
    libraryDependencies += JwtSprayJson,

    libraryDependencies += scalaTest % Test,
    libraryDependencies += akkaTestkit % Test,
    libraryDependencies += akkaStreamTestkit % Test,
    libraryDependencies += akkaHttpTestkit % Test,
    libraryDependencies += apacheFtpServer % Test,

    unmanagedResourceDirectories in Compile += baseDirectory.value / "config",
    unmanagedResourceDirectories in Compile += target.value / "front",
  ).enablePlugins(JavaAppPackaging)

// See https://www.scala-sbt.org/1.x/docs/Using-Sonatype.html for instructions on how to publish to Sonatype.
