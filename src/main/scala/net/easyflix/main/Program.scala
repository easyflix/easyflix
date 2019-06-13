package net.easyflix.main

import cats.data.{IndexedStateT, StateT}
import cats.effect.Effect
import cats.implicits._

import scala.language.higherKinds

/**
  * Adapted from (MIT License):
  * https://github.com/battermann/pureapp/blob/master/src/main/scala/com/github/battermann/pureapp/PureApp.scala
  * cf: https://blog.leifbattermann.de/2018/04/29/interactive-command-line-applications-in-scala-well-structured-and-purely-functional/
  */
object Program {

  def build[F[_]: Effect, Model, Cmd, Result](
      init: (Model, Cmd),
      update: (Model, Result) => (Model, Cmd),
      io: (Model, Cmd) => F[Result],
      quit: Result => Boolean): Program[F, Model, Cmd, Result, Result] =
    Program(init, update, io, quit, identity)

}

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
