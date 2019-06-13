package net.easyflix.events

import akka.http.scaladsl.server.directives.ContentTypeResolver

final case class ResolverUpdate(ctr: ContentTypeResolver) extends ApplicationBus.Event
