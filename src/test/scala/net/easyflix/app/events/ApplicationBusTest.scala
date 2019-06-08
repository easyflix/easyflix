package net.easyflix.app.events

import akka.http.scaladsl.server.directives.ContentTypeResolver
import net.easyflix.util.SimpleActorTest

class ApplicationBusTest extends SimpleActorTest {

  "A MainBus" should {

    val bus = new ApplicationBus

    "publish Event messages to subscribers" in {
      bus.subscribe(testActor, classOf[ResolverUpdate])
      bus.publish(ResolverUpdate(ContentTypeResolver.Default))
      expectMsg(ResolverUpdate(ContentTypeResolver.Default))
    }

  }

}
