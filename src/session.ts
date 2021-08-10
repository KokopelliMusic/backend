import { FastifyReply, FastifyRequest } from "fastify"
import { ServerResponse } from "http"
import { generateCode } from "./util"

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
  const { sessions } = req
  const code = generateCode(sessions)


  
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
          alreadyClaimed: { type: 'boolean' },
          success: { type: 'boolean' }
        }
      }
    }
  }
}

export const claimSession = async (req: FastifyRequest, res: FastifyReply) => {
  // @ts-expect-error
  const { sessions, query: { code } } = req
  const exists = sessions.has(code)

  if (!exists) {
    return { exists: false }
  }

  const claimed = sessions.get(code).claimed

  if (claimed) {
    return { exists: true, alreadyClaimed: true }
  }
  
  sessions.set(code, { claimed: true })
    
  return { exists, alreadyClaimed: false, success: true }
}