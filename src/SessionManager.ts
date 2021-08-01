import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { Socket, Server } from 'socket.io'
import { generateCode, getAllSessionIDs, getRandomNumber } from './util'


export type Session = {
    webclient?: Socket
    code: string
    spotify?: string
    playlist?: string
}

export default class SessionManager {

  // Router handling all routes
  public router = Router()
    
  // Keep track of all sessions
  public sessions: Map<string, Session>

  // SocketIO server
  private io: Server

  constructor(io: Server, sessions: Map<string, Session>) {
    this.io = io
    this.sessions = sessions
    this.setupRoutes()
  }

  private setupRoutes() {
    this.router.get('/new', (req, res) => {
      const code = generateCode(getAllSessionIDs(this.sessions))
      res.status(200).send({ code })

      this.sessions.set(code, { code })
    })
  }

}