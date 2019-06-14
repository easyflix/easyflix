package net.easyflix

import cats.Applicative
import cats.effect._
import cats.implicits._
import net.easyflix.Main.Result.Final
import net.easyflix.app.{Application, ProdApplication}
import net.easyflix.exceptions.InvalidInputException
import net.easyflix.main.{ConsoleColors, ConsoleInterpreter, PureApp}

import scala.language.higherKinds

object Main extends PureApp[IO] {

  sealed trait Cmd
  object Cmd {
    case object Empty extends Cmd // No input
    case class Start(
        port: Option[Int],
        host: Option[String],
        tmdbApiKey: Option[String],
        authKey: Option[String],
        password: Option[String]) extends Cmd // Start command
    case object Exit extends Cmd // Exit command
    final case class Print(msg: String, color: String) extends Cmd // Print to out
    final case class PrintErr(msg: String) extends Cmd // Print to err
  }

  sealed trait Result
  object Result {
    final case class Parsed(cmd: Cmd) extends Result // A command was parsed
    final case object Final extends Result // Final command result, app will quit
    final case class Stopped(result: Either[Throwable, Started.Result]) extends Result // Application was stopped
  }

  final case class Model()

  def init(args: List[String]): (Model, Cmd) = {
    val intro: String =
      """
        |  ___   _   _____   _____ _    _____  __
        | | __| /_\ / __\ \ / / __| |  |_ _\ \/ /
        | | _| / _ \\__ \\ ' /| _|| |__ | | >  <
        | |___/_/ \_\___/ |_| |_| |____|___/_/\_\
        |
        | Type "start" to start the server
        | Type "exit" to exit
        | Type "--help" or "<command> --help" for additional help
        |
      """.stripMargin

    InputParser.parse(args.mkString(" ")) match {
      case Cmd.PrintErr(msg) => throw InvalidInputException(msg)
      case Cmd.Empty => (Model(), Cmd.Print(intro, ConsoleColors.GREEN))
      case command => (Model(), command)
    }
  }

  def quit(msg: Result): Boolean = msg == Result.Final

  override def update(model: Model, result: Result): (Model, Cmd) = result match {

    case Result.Parsed(cmd) => (model, cmd)

    case Result.Final => (model, Cmd.Empty)

    case Result.Stopped(Left(error)) => (model, Cmd.PrintErr(error.getMessage))

    case Result.Stopped(Right(Started.Result.Final)) => (model, Cmd.Exit)

    case Result.Stopped(Right(_)) => (model, Cmd.Empty)

  }

  def promptF[F[_]: Applicative](C: ConsoleInterpreter[F]): F[Result] =
    C.readLine("easyflix> ") map InputParser.parse map Result.Parsed

  def ioF(C: ConsoleInterpreter[IO])(model: Model, cmd: Cmd): IO[Result] =
    cmd match {
      case Cmd.Empty => promptF(C)
      case Cmd.Print(msg, color) => C.print(msg, color) *> promptF(C)
      case Cmd.PrintErr(msg) => C.printErr(msg) *> promptF(C)
      case Cmd.Start(port, host, tmdb, auth, pass) =>
        C.print("Starting application...", ConsoleColors.GREEN_BOLD) *> {
          val app = new ProdApplication(port, host, tmdb, auth, pass)
          val a = for {
            _ <- app.start
            r <- app.run(_ => Started.program(List.empty).build())
            _ <- app.stop
          } yield r
          a.runA(Application.Stopped).attempt.map(r => Result.Stopped(r.joinRight))
        }
      case Cmd.Exit => IO.pure(Final)
    }

  def io(model: Model, cmd: Cmd): IO[Result] =
    ioF(ConsoleInterpreter)(model, cmd)

  object InputParser {

    import com.monovore.decline.{Command, Opts}

    private val port =
      Opts.option[Int](
        long ="port",
        short = "p",
        metavar = "port",
        help = "The port to run on. Defaults to 8081.")
        .orNone

    private val host =
      Opts.option[String](
        long = "host",
        short = "h",
        metavar = "host",
        help = "The IP address or hostname to bind on. Defaults to 0.0.0.0 which binds on all IPs.")
        .orNone

    private val tmdbApiKey =
      Opts.option[String](
        long = "tmdbApiKey",
        short = "t",
        metavar = "your-api-key",
        help = "A valid TMDb API key.")
        .orNone

    private val authKey =
      Opts.option[String](
        long = "authKey",
        short = "a",
        metavar = "secret-key",
        help = "A hexadecimal key (preferably 128 bits) for authentication.")
        .orNone

    private val password =
      Opts.option[String](
        long = "password",
        short = "",
        metavar = "your-password",
        help = "The login password.")
        .orNone

    private val start =
      Opts.subcommand("start", help = "Starts the server."){
        (port, host, tmdbApiKey, authKey, password).mapN(Cmd.Start)
      }

    private val quit =
      Opts.subcommand("exit", help = "Exits the program.")(Opts(Cmd.Exit))

    private val app = Command(
      name = "",
      header = """Type "<command> --help" to display a specific command help message."""
    ) {
      start orElse quit
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
