package net.easyflix.util

import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import akka.testkit.{ImplicitSender, TestKit}
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.{BeforeAndAfterAll, Matchers, WordSpecLike}

class SimpleActorTest()
  extends TestKit(ActorSystem("TestSystem"))
    with ImplicitSender
    with WordSpecLike
    with Matchers
    with BeforeAndAfterAll
    with ScalaFutures {

  implicit val materializer: ActorMaterializer = ActorMaterializer()

}
