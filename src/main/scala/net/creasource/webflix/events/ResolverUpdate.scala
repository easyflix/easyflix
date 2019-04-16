package net.creasource.webflix.events

import akka.http.scaladsl.server.directives.ContentTypeResolver

case class ResolverUpdate(ctr: ContentTypeResolver) extends ApplicationBus.Event
