package net.creasource

package object tmdb {

  implicit class PimpedOption[T](option: Option[T]) {
    def toParam(name: String): String = option.map(o => s"&$name=$o").getOrElse("")
  }

  implicit class PimpedBoolean(bool: Boolean) {
    def toParam(name: String): String = s"&$name=$bool"
  }

}
