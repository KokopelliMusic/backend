import { json } from 'body-parser'
import express from 'express'
import SocketIO, { Socket } from 'socket.io'
import homeRouter from './home'
import SessionManager, { Session } from './SessionManager'
import cors from 'cors'
import { generateCode, getAllSessionIDs } from './util'
import Events from './Events'

// Create server
const app = express()

// Setup express
const port = 8080
app.set('port', process.env.PORT || port)
app.use(cors())
app.use(json())

// Start the server
const server = app.listen(port, () => console.log(`Listening on http://localhost:${port}`))

// Setup SocketIO and the SessionManager
const io = SocketIO.listen(server, {})

const sessions = new Map<string, Session>()
const sessionManager = new SessionManager(io, sessions)

// Generate a session id for every client
// io.engine.generateId = (): string => {
  // return generateCode(getAllSessionIDs(sessions))
// }

// io.on('connection', (socket: Socket) => {
//   console.log(`user ${socket.id} connected`)

//   // dit doen met namespaces zodat meerdere apparaten op 1 sessie kunnen luisteren
//   sessions.set(socket.id, { webclient: socket, code: socket.id })
  
//   socket.emit(Events.SESSION_ID, socket.id)
//   setInterval(() => socket.emit('test,', 1), 10)
// })

// Setup routes
app.use('/', homeRouter)
app.use('/session', sessionManager.router)