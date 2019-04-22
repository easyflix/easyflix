package net.creasource.util

import akka.stream.ActorMaterializer
import akka.testkit.{ImplicitSender, TestKit}
import net.creasource.Application
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.{BeforeAndAfterAll, Matchers, WordSpecLike}

class SimpleActorTest()(implicit val application: Application = Application())
  extends TestKit(application.system)
    with ImplicitSender
    with WordSpecLike
    with Matchers
    with BeforeAndAfterAll
    with ScalaFutures {

  implicit val materializer: ActorMaterializer = application.materializer

  override def afterAll(): Unit = {
    application.shutdown()
  }

}

object SimpleActorTest {

  trait WithLibrary { self: SimpleActorTest =>

  }

}
