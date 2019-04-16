package net.creasource.webflix.actors

import akka.Done
import akka.http.scaladsl.model.MediaType
import akka.http.scaladsl.model.MediaType.NotCompressible
import net.creasource.util.SimpleActorTest
import net.creasource.webflix.actors.MediaTypesActor._
import net.creasource.webflix.events.ResolverUpdate


class MediaTypesActorTest extends SimpleActorTest {

  "A MediaTypesActor" should {

    val mediaTypesActor = application.mediaTypesActor

    "retrieve default custom media types on GetMediaTypes" in {
      mediaTypesActor ! MediaTypesActor.GetMediaTypes
      expectMsg(Seq(`video/x-mastroka`))
    }

    "add a custom media type on AddMediaType" in {
      val custom = MediaType.video("x-custom", NotCompressible, "custom")
      mediaTypesActor ! MediaTypesActor.AddMediaType(custom)
      expectMsg(AddMediaTypeSuccess(custom))

      mediaTypesActor ! MediaTypesActor.GetMediaTypes
      expectMsg(Seq(`video/x-mastroka`, custom))
    }

    "fail to add a custom media type if subtype is already defined" in {
      val custom = MediaType.video("x-custom", NotCompressible, "custom")
      mediaTypesActor ! MediaTypesActor.AddMediaType(custom)
      expectMsg(AddMediaTypeError("contentType", "alreadyExists"))
    }

    "fail to add a custom media type if file extensions intersect with another" in {
      val custom2 = MediaType.video("x-custom2", NotCompressible, "custom")
      mediaTypesActor ! MediaTypesActor.AddMediaType(custom2)
      expectMsg(AddMediaTypeError("extensions", "alreadyExists"))
    }

    "remove a custom mediaType on RemoveMediaType" in {
      mediaTypesActor ! MediaTypesActor.RemoveMediaType("x-custom")
      expectMsg(Done)
    }

    "publish a ContentResolverUpdate on main bus when adding a mediaType" in {
      application.bus.subscribe(testActor, classOf[ResolverUpdate])
      val custom = MediaType.video("x-custom", NotCompressible, "custom")
      mediaTypesActor ! MediaTypesActor.AddMediaType(custom)
      expectMsgPF() {
        case ResolverUpdate(ctr) => ctr("test.custom").mediaType should be (custom)
      }
      expectMsg(AddMediaTypeSuccess(custom))
    }

  }

}
