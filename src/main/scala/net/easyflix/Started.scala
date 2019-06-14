package net.easyflix

import cats.Applicative
import cats.effect.IO
import cats.implicits._
import net.easyflix.main.{ConsoleColors, ConsoleInterpreter, PureProgram}

import scala.language.higherKinds

object Started extends PureProgram[IO] {

  final case class Model()

  sealed trait Cmd
  object Cmd {
    case object Empty extends Cmd // No input
    case object Stop extends Cmd // Stop command
    case object Exit extends Cmd // Exit command
    final case class Print(msg: String, color: String = "") extends Cmd // Print to out
    final case class PrintErr(msg: String) extends Cmd // Print to err
  }

  sealed trait Result
  object Result {
    final case object Final extends Result
    final case object Stopped extends Result
    final case class Parsed(cmd: Cmd) extends Result // A command was parsed
  }

  def promptF[F[_]: Applicative](C: ConsoleInterpreter[F]): F[Result] =
    C.readLine("started> ") map InputParser.parse map Result.Parsed

  override def init(args: List[String]): (Model, Cmd) =
    (Model(), Cmd.Print("Application started. Type \"--help\" to see available commands.", ConsoleColors.GREEN_BOLD))

  override def update(model: Model, result: Result): (Model, Cmd) = result match {
    case Result.Final => (model, Cmd.Empty)
    case Result.Stopped => (model, Cmd.Empty)
    case Result.Parsed(cmd) => (model, cmd)
  }

  private val C = ConsoleInterpreter

  override def io(model: Model, cmd: Cmd): IO[Result] = cmd match {
    case Cmd.Empty => promptF(C)
    case Cmd.Print(msg, color) => C.print(msg, color) *> promptF(C)
    case Cmd.PrintErr(msg) => C.printErr(msg) *> promptF(C)
    case Cmd.Exit => IO.pure(Result.Final)
    case Cmd.Stop => IO.pure(Result.Stopped)
  }

  override def quit(result: Result): Boolean = result == Result.Final || result == Result.Stopped

  object InputParser {

    import com.monovore.decline.{Command, Opts}

    private val stop =
      Opts.subcommand("stop", help = "Stops the server.")(Opts(Cmd.Stop))

    private val quit =
      Opts.subcommand("exit", help = "Stops the server and exits the program.")(Opts(Cmd.Exit))

    private val app = Command(
      name = "",
      header = """Type "<command> --help" to display a specific command help message."""
    ) {
      stop orElse quit
    }

    def parse(input: String): Cmd = {
      if (input == null || input.trim == "") Cmd.Empty
      else parse(input.trim.split(" ").toSeq)
    }

    def parse(args: Seq[String]): Cmd = {
      app.parse(args) match {
        case Right(msg) => msg
        case Left(msg) if msg.errors.nonEmpty => Cmd.PrintErr(msg.toString())
        case Left(msg) => Cmd.Print(msg.toString(), ConsoleColors.CYAN)
      }
    }
  }
}
