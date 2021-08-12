import { FastifyReply, FastifyRequest } from "fastify"
import { generateCode, getAllSessionIDs } from "./util"

export interface Session {
  claimed: boolean
  started: Date
}

export type Sessions = Map<String, Session>

export const newSessionSchema = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          code: { type: 'string' }
        }
      }
    }
  }
}

export const newSession = async (req: FastifyRequest, res: FastifyReply) => {
  // @ts-expect-error
  const sessions: Sessions = req.sessions
  const code = generateCode(getAllSessionIDs(sessions))

  sessions.set(code, {
    claimed: false,
    started: new Date()
  })

  return {
    code
  }
  
}

export const claimSessionSchema = {
  schema: {
    querystring: {
      type: 'object',
      required: [ 'code' ],
      properties: {
        code: { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          exists:  { type: 'boolean' },
          success: { type: 'boolean' }
        }
      }
    }
  }
}

export const claimSession = async (req: FastifyRequest, res: FastifyReply) => {
  // @ts-expect-error
  const { sessions } = req
  // @ts-expect-error
  let code = req.query.code.toUpperCase()
  const exists = sessions.has(code)

  if (!exists) {
    return { exists: false, success: false }
  }

  const claimed = sessions.get(code).claimed

  if (claimed) {
    return { exists: true, success: false }
  }
  
  sessions.set(code, { claimed: true })
    
  return { exists, success: true }
}