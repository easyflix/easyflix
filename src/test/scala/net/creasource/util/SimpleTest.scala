package net.creasource.util

import akka.stream.ActorMaterializer
import net.creasource.Application
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.{BeforeAndAfterAll, Matchers, WordSpecLike}

abstract class SimpleTest
  extends WordSpecLike
    with Matchers
    with BeforeAndAfterAll
    with ScalaFutures {

  implicit val application: Application = Application()
  implicit val materializer: ActorMaterializer = application.materializer

  override def beforeAll(): Unit = super.beforeAll()

  override def afterAll() {
    application.shutdown()
    super.afterAll()
  }

}
