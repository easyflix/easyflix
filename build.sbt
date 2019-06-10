import Dependencies._

ThisBuild / scalaVersion     := "2.12.8"
ThisBuild / version          := "1.0.0"
ThisBuild / organization     := "net.easyflix"
ThisBuild / scalacOptions    := Seq("-unchecked", "-deprecation", "-feature")

lazy val root = (project in file("."))
  .settings(
    name := "easyflix",
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
    libraryDependencies += akkaHttpCors,
    libraryDependencies += catsEffect,
    libraryDependencies += decline,

    libraryDependencies += scalaTest % Test,
    libraryDependencies += akkaTestkit % Test,
    libraryDependencies += akkaStreamTestkit % Test,
    libraryDependencies += akkaHttpTestkit % Test,
    libraryDependencies += apacheFtpServer % Test,

    unmanagedResourceDirectories in Compile += baseDirectory.value / "config",
    unmanagedResourceDirectories in Compile += target.value / "front",

  ).enablePlugins(JavaAppPackaging)
