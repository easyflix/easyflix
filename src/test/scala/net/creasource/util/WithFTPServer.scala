package net.creasource.util

import java.io.File

import org.apache.ftpserver.{FtpServer, FtpServerFactory}
import org.apache.ftpserver.ftplet.UserManager
import org.apache.ftpserver.listener.ListenerFactory
import org.apache.ftpserver.ssl.SslConfigurationFactory
import org.apache.ftpserver.usermanager.{PropertiesUserManagerFactory, SaltedPasswordEncryptor}
import org.apache.ftpserver.usermanager.impl.BaseUser
import org.scalatest.{BeforeAndAfterAll, Suite}

import scala.util.Try

trait WithFTPServer extends BeforeAndAfterAll { self: Suite with WithLibrary =>

  var server: FtpServer = _

  val ftpPort = 2221
  val userName = "userName"
  val userPass = "userPass"

  private val userProps = new File("src/test/resources/ftp/users.properties")

  override def beforeAll(): Unit = {
    super.beforeAll()
    userProps.createNewFile()
    server = createServer()
    server.start()
  }
  
  override def afterAll(): Unit = {
    Try(server.stop())
    userProps.delete()
    super.afterAll()
  }

  def createServer(): FtpServer = {
    val factory = new ListenerFactory
    // set the port of the listener
    factory.setPort(ftpPort)
    // define SSL configuration (https://docs.oracle.com/cd/E19798-01/821-1841/gjrgy/)
    val ssl = new SslConfigurationFactory
    ssl.setKeystoreFile(new File("src/test/resources/ftp/keystore.jks"))
    ssl.setKeystorePassword("storepass")
    ssl.setKeyPassword("keypass")
    ssl.setKeyAlias("webflix")
    // set the SSL configuration for the listener
    factory.setSslConfiguration(ssl.createSslConfiguration)
    // factory.setImplicitSsl(true)

    val serverFactory = new FtpServerFactory
    serverFactory.addListener("default", factory.createListener)
    serverFactory.setUserManager(createUsers())
    // create the server
    serverFactory.createServer
  }

  def createUsers(): UserManager = {
    val userManagerFactory: PropertiesUserManagerFactory = new PropertiesUserManagerFactory()
    userManagerFactory.setFile(userProps)
    userManagerFactory.setPasswordEncryptor(new SaltedPasswordEncryptor())

    val user: BaseUser = new BaseUser()
    user.setName(userName)
    user.setPassword(userPass)
    user.setHomeDirectory(libraryPath.toString)

    val um: UserManager = userManagerFactory.createUserManager()
    um.save(user)
    um
  }

}
