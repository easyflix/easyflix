package net.easyflix.main

import cats.effect._

import scala.language.higherKinds

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
