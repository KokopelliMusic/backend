import { FastifyReply, FastifyRequest } from "fastify";
import { Connection } from "typeorm";
import { SpotifySong } from "./entity/SpotifySong";

export const addSpotifySongSchema = {
  schema: {
    body: {
      type: 'object',
      required: [ 'playlistId', 'uid', 'addedBy', 'artist', 'title', 'cover', 'length', 'spotifyId'],
      properties: {
        'playlistId': { type: 'string' },
        'addedBy': { type: 'string' },
        'artist': { type: 'string' },
        'title': { type: 'string' },
        'cover': { type: 'string' },
        'length': { type: 'number' },
        'spotifyId': { type: 'string' },
        'uid': { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' }
        }
      }
    }
  }
}


export const addSpotifySong = async (req: FastifyRequest, reply: FastifyReply) => {
  // @ts-expect-error
  const db: Connection = req.db
  // @ts-expect-error
  const { playlistId, uid, addedBy, artist, title, cover, length, spotifyId } = req.body

  let s = new SpotifySong()
  s.artist = artist
  s.spotifyId = spotifyId
  s.playlistId = playlistId
  s.addedBy = addedBy
  s.title = title
  s.cover = cover
  s.length = length
  s.uid = uid
  s.plays = 0

  const unique = await checkIfSongIsUnique(db, playlistId, spotifyId)
  

  if (!unique) {
    return {
      success: false
    }
  }

  const success = await db.manager.save(s).then(s => true).catch(err => false)

  console.log(success)

  return {
    success
  }
}

export const getNumberOfSongsSchema = {
  schema: {
    querystring: {
      type: 'object',
      required: ['playlistId'],
      properties: {
        'playlistId': { type: 'string' },
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          songs: { type: 'number' }
        }
      }
    }
  }
}


export const getNumberOfSongs = async (req: FastifyRequest, reply: FastifyReply) => {
  // @ts-expect-error
  const db: Connection = req.db
  // @ts-expect-error
  const { playlistId } = req.query

  const [, count] = await db.manager.findAndCount(SpotifySong, { where: { playlistId }})

  return { songs: count }
}

const checkIfSongIsUnique = async (db: Connection, playlistId: string, spotifyId: string) => {
  const [, count] = await db.manager.findAndCount(SpotifySong, { where: { playlistId, spotifyId }})
  
  return count === 0
}