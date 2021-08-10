import Fastify, { FastifyInstance } from 'fastify'
import { claimSession, claimSessionSchema, newSession, newSessionSchema, Session, Sessions } from './session'

const server: FastifyInstance = Fastify({ 
  logger: true
})

server.register(require('fastify-swagger'), {
  exposeRoute: true,
  routePrefix: '/documentation',
  info: {
    title: 'Kokopelli-Docs',
    version: '3.0.0'
  }
})

server.register(require('fastify-cors'))

const sessions: Sessions = new Map<String, Session>()

server.addHook('preHandler', async (req, reply) => {
  // @ts-expect-error
  req.sessions = sessions
})

server.get('/session/new', newSessionSchema, newSession)
server.get('/session/claim', claimSessionSchema, claimSession)

setInterval(() => {
  sessions.forEach((session, key) => {
    // if the session was created more than 2 days ago, delete it
    if (new Date().getTime() + 48 * 60 * 60 * 1000 >= session.started.getTime()) {
      sessions.delete(key)
    }
  })
}, 24 * 60 * 60 * 1000)

const start = async () => {
  try {
    await server.listen(3000)

    const address = server.server.address()
    const port = typeof address === 'string' ? address : address?.port

  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}
start()