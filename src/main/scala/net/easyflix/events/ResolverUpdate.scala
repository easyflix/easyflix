package net.easyflix.events

import akka.http.scaladsl.server.directives.ContentTypeResolver

case class ResolverUpdate(ctr: ContentTypeResolver) extends ApplicationBus.Event
