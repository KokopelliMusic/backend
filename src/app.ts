import Fastify, { FastifyInstance } from 'fastify'
import { claimSession, claimSessionSchema, newSession, newSessionSchema, Session, Sessions } from './session'
import * as admin from 'firebase-admin'
import { FIREBASE_CONFIG, path } from './config.json'
import { getAllSessionsFromDB, removeCurrentlyPlaying, removeSessionFromDB } from './db'
import { selectNextEvent, selectNextEventSchema } from './events'
import 'reflect-metadata'
import { Connection, createConnection } from 'typeorm'
import { addSpotifySong, addSpotifySongSchema, getNumberOfSongs, getNumberOfSongsSchema } from './playlist'

const server: FastifyInstance = Fastify({
  logger: {
    prettyPrint: true,
    level: 'info'
  }
})

let db: Connection

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
  // @ts-expect-error
  req.db = db
})

server.get(path + '/session/new', newSessionSchema, newSession)
server.get(path + '/session/claim', claimSessionSchema, claimSession)
server.get(path + '/event/next', selectNextEventSchema, selectNextEvent)
server.post(path + '/playlist/add/spotify', addSpotifySongSchema, addSpotifySong)
server.get(path + '/playlist/number-of-songs', getNumberOfSongsSchema, getNumberOfSongs)

setInterval(() => {
  sessions.forEach((session, key) => {
    // if the session was created more than 2 days ago, delete it
    if (new Date().getTime() + 48 * 60 * 60 * 1000 >= new Date(session.started).getTime()) {
      sessions.delete(key)
    }
  })

  getAllSessionsFromDB()
    .then(ss => {
      for (const [code, session] of Object.entries(ss)) {
        if (new Date().getTime() + 48 >= session.started) {
          removeSessionFromDB(code)
          removeCurrentlyPlaying(code)
        }
      }
    })
// run it every 12 hours
}, 12 * 60 * 60 * 1000)

const start = async () => {
  try {
    await server.listen(8080, '0.0.0.0')
    db = await createConnection(require('./ormconfig.json'))

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