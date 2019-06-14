package net.easyflix.main

import cats.effect.IO

import scala.language.higherKinds

trait ConsoleInterpreter[F[_]] {
  def print(str: String, color: String = ""): F[Unit]
  def printErr(str: String): F[Unit]
  def readLine(prompt: String, color: String = ""): F[String]
}

object ConsoleInterpreter extends ConsoleInterpreter[IO] {
  def print(str: String, color: String = ""): IO[Unit] =
    IO(Console.println(color + str + ConsoleColors.RESET))
  def printErr(str: String): IO[Unit] =
    IO(Console.err.println(ConsoleColors.RED + str + ConsoleColors.RESET))
  def readLine(prompt: String, color: String = ""): IO[String] =
    IO(scala.io.StdIn.readLine(color + prompt + ConsoleColors.RESET))
}
