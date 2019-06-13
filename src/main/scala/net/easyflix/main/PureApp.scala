package net.easyflix.main

import cats.effect.{Effect, IO}

import scala.language.higherKinds

abstract class PureApp[F[_]: Effect] extends PureProgram[F] {

  def run(args: List[String]): F[Result] =
    program(args).build()

  final def main(args: Array[String]): Unit =
    Effect[F]
      .runAsync(run(args.toList)) {
        case Left(err) => throw err // TODO IO print ?
        case Right(_) => IO.unit // { Console.println(result) }
      }
      .unsafeRunSync()

}
