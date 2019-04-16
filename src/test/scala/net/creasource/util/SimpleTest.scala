package net.creasource.util

import akka.stream.ActorMaterializer
import net.creasource.Application
import org.scalatest.{BeforeAndAfterAll, Matchers, WordSpecLike}

abstract class SimpleTest
  extends WordSpecLike
    with Matchers
    with BeforeAndAfterAll {

  implicit val application: Application = Application()
  implicit val materializer: ActorMaterializer = application.materializer

  override def afterAll() {
    application.shutdown()
    super.afterAll()
  }

}
