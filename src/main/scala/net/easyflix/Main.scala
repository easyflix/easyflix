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
    case object Start extends Cmd // Start command
    // case object Stop extends Cmd // Stop command
    case object Exit extends Cmd // Exit command
    final case class Print(msg: String, color: String) extends Cmd // Print to out
    final case class PrintErr(msg: String) extends Cmd // Print to err
  }

  sealed trait Result
  object Result {
    final case class Parsed(cmd: Cmd) extends Result // A command was parsed
    case object Final extends Result // Final command result, app will quit
    case object Stopped extends Result // Application was stopped
    // case class Started(cancel: CancelToken[IO]) extends Result // Application was started
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
        | Type "--help" for additional help
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

    // case Started(cancel) => (model.copy(cancel = Some(cancel)), Cmd.Empty)

    case Result.Stopped => (model, Cmd.Empty)

  }

  def promptF[F[_]: Applicative](C: ConsoleInterpreter[F]): F[Result] =
    C.readLine("easyflix> ") map InputParser.parse map Result.Parsed

  def ioF(C: ConsoleInterpreter[IO])(model: Model, cmd: Cmd): IO[Result] =
    cmd match {
      case Cmd.Empty => promptF(C)
      case Cmd.Print(msg, color) => C.print(msg, color) *> promptF(C)
      case Cmd.PrintErr(msg) => C.printErr(msg) *> promptF(C)
      case Cmd.Start => C.print("Starting application") *> {
        // model.cancel.map(c => C.print("Application already started.") *> IO.pure(Started(c)))
        // .getOrElse {
        val app = ProdApplication
        val a = for {
          _ <- app.start
          _ <- app.run(_ => C.readLine("started> ").map(_ => ()))
          _ <- app.stop
        } yield Result.Stopped
        a.runA(Application.Stopped) // TODO attempt
      }
            /*E.start.map(Started)*/
          // }
/*      case Cmd.Stop =>
        C.print(model.cancel.map(_ => "Stopping application").getOrElse("Not started!")) *>
          model.cancel.map(_.map(_ => Stopped)).getOrElse(IO.pure(Stopped))*/
      case Cmd.Exit => IO.pure(Final)
/*        model.cancel.map(C.print("Stopping application") *> _.map(_ => Final))
          .getOrElse(IO.pure(Final))*/
    }

  def io(model: Model, cmd: Cmd): IO[Result] =
    ioF(ConsoleInterpreter)(model, cmd)

}

object InputParser {

  import Main._
  import com.monovore.decline.{Command, Opts}

  private val port =
    Opts.option[Int]("port", short = "p", metavar = "port", help = "The port to run on.").withDefault(8081)

  private val start =
    Opts.subcommand("start", help = "Starts the server.")(port.map(_ => Cmd.Start))

  /*private val stop =
    Opts.subcommand("stop", help = "Stops the server.")(Opts(Cmd.Stop))*/

  private val quit =
    Opts.subcommand("exit", help = "Stops the server and exits.")(Opts(Cmd.Exit))

  private val app = Command(
    name = "",
    header = """Type "<command> --help" to display a specific command help message."""
  ) {
    start /*orElse stop*/ orElse quit
  }

  def parse(input: String): Cmd = {
    if (input == null || input.trim == "") Cmd.Empty
    else parse(input.trim.split(" ").toSeq)
  }

  def parse(args: Seq[String]): Cmd = {
    if (args.isEmpty) {
      Cmd.Empty
    } else {
      app.parse(args) match {
        case Right(msg) => msg
        case Left(msg) if msg.errors.nonEmpty => Cmd.PrintErr(msg.toString())
        case Left(msg) => Cmd.Print(msg.toString(), ConsoleColors.GREEN)
      }
    }
  }

}


