import Fastify, { FastifyInstance } from 'fastify'
import { claimSession, claimSessionSchema, newSession, newSessionSchema, Session, Sessions } from './session'
import * as admin from 'firebase-admin'
import { FIREBASE_CONFIG } from './config.json'
import { getAllSessionsFromDB, removeSessionFromDB } from './db'

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

const sessions: Sessions = new Map<string, Session>()

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

  getAllSessionsFromDB()
    .then(sessions => {
      for (const [code, session] of Object.entries(sessions)) {
        // @ts-expect-error
        if (new Date().getTime() + 48 >= session.started) {
          removeSessionFromDB(code)
        }
      }
    })
// run it every 12 hours
}, 12 * 60 * 60 * 1000)

const start = async () => {
  try {
    await server.listen(8080)

    admin.initializeApp({
      credential: admin.credential.cert(require('./firebase.json')),
      databaseURL: FIREBASE_CONFIG.databaseURL
    })

    const address = server.server.address()
    const port = typeof address === 'string' ? address : address?.port

  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}
start()