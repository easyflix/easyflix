package net.easyflix.events

import akka.actor.ActorRef
import akka.event.{EventBus, LookupClassification}

class ApplicationBus extends EventBus with LookupClassification {
  type Event = ApplicationBus.Event
  type Classifier = Class[_]
  type Subscriber = ActorRef

  override protected def classify(event: Event): Classifier = event.getClass
  override protected def publish(event: Event, subscriber: Subscriber): Unit = subscriber ! event
  override protected def compareSubscribers(a: Subscriber, b: Subscriber): Int = a.compareTo(b)
  override protected def mapSize: Int = 128
}

object ApplicationBus {
  trait Event
}
