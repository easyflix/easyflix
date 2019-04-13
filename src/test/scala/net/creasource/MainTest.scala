package net.creasource

import java.io.File
import java.net.{URI, URL, URLEncoder}
import java.nio.file.{FileSystems, Path, Paths}

import akka.actor.{ActorRef, ActorSystem}
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{HttpMethods, HttpProtocols, HttpRequest, HttpResponse, StatusCodes, Uri}
import akka.{Done, NotUsed}
import akka.stream.{ActorMaterializer, KillSwitch, KillSwitches, OverflowStrategy, QueueOfferResult}
import akka.stream.alpakka.file.DirectoryChange
import akka.stream.alpakka.file.scaladsl.DirectoryChangesSource
import akka.stream.scaladsl.{Flow, Keep, RunnableGraph, Sink, Source, SourceQueueWithComplete}
import me.nimavat.shortid.ShortId
import net.creasource.model.VideoFormat

import scala.concurrent.{Await, ExecutionContextExecutor, Future, Promise}
import scala.concurrent.duration._
import spray.json._
import spray.json.DefaultJsonProtocol._
import akka.pattern.ask
import akka.util.ByteString

import scala.util.{Failure, Success, Try}
//import net.creasource.web.LibraryActor.{GetLibraryFiles, ScanLibrary}

class MainTest extends SimpleTest {

  var application: Application = _

  lazy implicit val materializer: ActorMaterializer = application.materializer

  override def beforeAll() {
    application = new Application()
  }

  override def afterAll() {
    application.shutdown()
  }

  "Webflix" should {

    "a" in {

      implicit val system: ActorSystem = application.system
      implicit val context: ExecutionContextExecutor = system.dispatcher

      val poolClientFlow: Flow[(HttpRequest, Int), (Try[HttpResponse], Int), Http.HostConnectionPool] =
        Http().cachedHostConnectionPoolHttps[Int]("akka.io")

//      val source: Source[Int, NotUsed] = Source(Range(1, 10))

      val source2: Source[Int, ActorRef] = Source.actorRef(1000, OverflowStrategy.dropHead)
//      val source3: Source[Int, SourceQueueWithComplete[Int]] = Source.queue(1000, OverflowStrategy.dropHead)

      def createRequest(i: Int): (HttpRequest, Int) = {
        val req = HttpRequest(HttpMethods.GET, uri = "/" + i)
        println(req)
        (req, i)
      }

      val f: Source[(Try[HttpResponse], Int), (ActorRef, Http.HostConnectionPool)] =
        source2
          .map(createRequest)
          .viaMat(poolClientFlow)(Keep.both)

      val ((actorRef: ActorRef, host: Http.HostConnectionPool), future: Future[Done]) =
        f.toMat(Sink.foreach {
          case (Success(response), i) =>
            println(response.status === StatusCodes.NotFound)
            /*response.entity.dataBytes.runFold(ByteString(""))(_ ++ _).foreach { body =>
              println("Got response, body: " + body.utf8String)
            }*/
            response.discardEntityBytes()
          case (Failure(ex), i) =>
            println(ex)
        })(Keep.both).run()

      // https://doc.akka.io/docs/akka-http/current/client-side/host-level.html
/*      def queueRequest(request: HttpRequest): Future[HttpResponse] = {
        val responsePromise = Promise[HttpResponse]()
        s.offer(request -> responsePromise).flatMap {
          case QueueOfferResult.Enqueued    => responsePromise.future
          case QueueOfferResult.Dropped     => Future.failed(new RuntimeException("Queue overflowed. Try again later."))
          case QueueOfferResult.Failure(ex) => Future.failed(ex)
          case QueueOfferResult.QueueClosed => Future.failed(new RuntimeException("Queue was closed (pool shut down) while running the request. Try again later."))
        }
      }*/

/*      s.offer(1)
      s.complete()*/

      actorRef ! 1
      actorRef ! akka.actor.Status.Success

      Await.result(future, 1.minute)

      Await.result(host.shutdown(), 1.minute)

/*      val videos = Library(name = "Vidéos", path = Paths.get("D:\\Vidéos\\Avatar - The Legend of Korra"))

      val f = (application.libraryActor ? ScanLibrary(videos))(10.seconds)

      Await.result(f, 10.seconds)

      val f1 = (application.libraryActor ? GetLibraryFiles)(10.seconds).mapTo[Seq[LibraryFile]]

      val r = Await.result(f1, 10.seconds)

      r.foreach(println)*/
      /*      import akka.stream.alpakka.file.scaladsl.Directory

            val videos = Library(name = "Vidéos", path = Paths.get("D:\\Vidéos\\Avatar - The Legend of Korra"))

            val source: Source[Path, NotUsed] = Directory.walk(videos.path)

            def getParentPathRelativeToLibrary(path: Path) = {
              Paths.get(videos.name).resolve(videos.path.relativize(path)).getParent
            }

            val f = source
                .filter(path => path !== videos.path)
                .map(path => {
                  val file = path.toFile
                  if (file.isFile) {
                    VideoFormat.getFormat(file) match {
                      case Some(format) => Some(Video(
                        parent = getParentPathRelativeToLibrary(path),
                        name = file.getName,
                        size = file.length,
                        format = format,
                        filePath = path
                      ))
                      case _ => None
                    }
                  } else {
                    Some(Folder(
                      id = ShortId.generate(),
                      parent = getParentPathRelativeToLibrary(path),
                      name = file.getName,
                    ))
                  }
                })
                .collect[LibraryFile] { case Some(libraryFile) => libraryFile }
                .map(_.toJson)
                .runWith(Sink.seq)

            val r = Await.result(f, 20.seconds)

            println(r.length)
            println(r.mkString("[\n", ",\n", "\n]"))*/

/*      val changes: Source[(Path, DirectoryChange), NotUsed] =
        DirectoryChangesSource(Paths.get("D:/Vidéos"), pollInterval = 1.second, maxBufferSize = 1000)

      val (killSwitch, seq: Future[Seq[(Path, DirectoryChange)]]) =
        changes
          .viaMat(KillSwitches.single)(Keep.right)
          .toMat(Sink.seq)(Keep.both)
          .run()

      Thread.sleep(30000)

      killSwitch.shutdown()

      val r2 = Await.result(seq, 1.seconds)

      println(r2.toString())*/

    }

  }

}
