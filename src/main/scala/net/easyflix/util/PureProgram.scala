package net.easyflix.util

import cats.data._
import cats.effect._
import cats.implicits._

import scala.language.higherKinds

/**
  * Adapted from (MIT License):
  * https://github.com/battermann/pureapp/blob/master/src/main/scala/com/github/battermann/pureapp/PureApp.scala
  * cf: https://blog.leifbattermann.de/2018/04/29/interactive-command-line-applications-in-scala-well-structured-and-purely-functional/
  */
final case class Program[F[_]: Effect, Model, Cmd, Result, A](
    init: (Model, Cmd),
    update: (Model, Result) => (Model, Cmd),
    io: (Model, Cmd) => F[Result],
    quit: Result => Boolean,
    mkResult: Result => A // TODO: keep ?
) {

  def build(): F[A] = {
    val app: StateT[F, (Model, Cmd), Result] = StateT[F, (Model, Cmd), Result] {
      case (model, cmd) =>
        io(model, cmd).map { result =>
          val (updatedModel, newCmd) = update(model, result)
          ((updatedModel, newCmd), result)
        }
    }

    val stateMonad = IndexedStateT.catsDataMonadForIndexedStateT[F, (Model, Cmd)]
    import stateMonad._

    val finalResult: F[Result] = for {
      a <- iterateUntil[Result](app)(quit).run(init)
      (_, result) = a
    } yield result

    finalResult.map(mkResult)
  }

}

object Program {

  def build[F[_]: Effect, Model, Cmd, Result](
      init: (Model, Cmd),
      update: (Model, Result) => (Model, Cmd),
      io: (Model, Cmd) => F[Result],
      quit: Result => Boolean): Program[F, Model, Cmd, Result, Result] =
    Program(init, update, io, quit, identity)

}

abstract class PureProgram[F[_]: Effect] {

  type Model

  type Cmd

  type Result

  def init(args: List[String]): (Model, Cmd)

  def update(model: Model, result: Result): (Model, Cmd)

  def io(model: Model, cmd: Cmd): F[Result]

  def quit(result: Result): Boolean

  def program(args: List[String]): Program[F, Model, Cmd, Result, Result] =
    Program(init(args), update, io, quit, identity)
}

abstract class PureApp[F[_]: Effect] extends PureProgram[F] {

  def run(args: List[String]): F[Result] =
    program(args).build()

  final def main(args: Array[String]): Unit =
    Effect[F]
      .runAsync(run(args.toList)) {
        case Left(err) => throw err
        case Right(_) => IO.unit // { Console.println(result) }
      }
      .unsafeRunSync()
}
