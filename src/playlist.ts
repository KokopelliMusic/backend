import { FastifyReply, FastifyRequest } from "fastify";
import { Connection } from "typeorm";
import { Song, SongType } from "./entity/Song";
import { SimpleSpotifySong } from "./entity/SpotifySong";

export const addYoutubeSongSchema = {
  schema: {
    body: {
      type: 'object',
      required: [ 'playlistId', 'uid', 'addedBy', 'title', 'platformId'],
      properties: {
        'playlistId': { type: 'string' },
        'addedBy': { type: 'string' },
        'title': { type: 'string' },
        'platformId': { type: 'string' },
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

export const addYoutubeSong = async (req: FastifyRequest, reply: FastifyReply) => {
  // @ts-expect-error
  const db: Connection = req.db
  // @ts-expect-error
  const { playlistId, uid, addedBy, title, platformId } = req.body

  const s = new Song()
  s.platformId = platformId
  s.playlistId = playlistId
  s.addedBy = addedBy
  s.title = title
  s.uid = uid
  s.plays = 0
  s.songType = SongType.YouTube

  const unique = await checkIfSongIsUnique(db, playlistId, platformId)


  if (!unique) {
    return {
      success: false
    }
  }

  const success = await db.manager.save(s).then(suc => true).catch(err => {
    console.log(err)
    return false
  })

  console.log(success)

  return {
    success
  }
}

export const addSpotifySongSchema = {
  schema: {
    body: {
      type: 'object',
      required: [ 'playlistId', 'uid', 'addedBy', 'artist', 'title', 'cover', 'length', 'platformId'],
      properties: {
        'playlistId': { type: 'string' },
        'addedBy': { type: 'string' },
        'artist': { type: 'string' },
        'title': { type: 'string' },
        'cover': { type: 'string' },
        'length': { type: 'number' },
        'platformId': { type: 'string' },
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
  const { playlistId, uid, addedBy, artist, title, cover, length, platformId } = req.body

  const spotifySong: SimpleSpotifySong = {
    artist,
    cover,
    length,
  }

  const s = new Song()
  s.platformId = platformId
  s.playlistId = playlistId
  s.addedBy = addedBy
  s.title = title
  s.uid = uid
  s.plays = 0
  s.songType = SongType.Spotify
  s.song = spotifySong

  const unique = await checkIfSongIsUnique(db, playlistId, platformId)


  if (!unique) {
    return {
      success: false
    }
  }

  const success = await db.manager.save(s).then(suc => true).catch(err => false)

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

  const [, count] = await db.manager.findAndCount(Song, { where: { playlistId }})

  return { songs: count }
}

const checkIfSongIsUnique = async (db: Connection, playlistId: string, platformId: string) => {
  const [, count] = await db.manager.findAndCount(Song, { where: { playlistId, platformId }})

  return count === 0
}

// const checkIfSpotifySongIsUnique = async (db: Connection, playlistId: string, spotifyId: string) => {
//   const [, count] = await db.manager.findAndCount(SpotifySong, { where: { playlistId, spotifyId }})

//   return count === 0
// }

// const checkIfYoutubeSongIsUnique = async (db: Connection, playlistId: string, youtubeId: string) => {
//   const [, count] = await db.manager.findAndCount(YoutubeSong, { where: { playlistId, youtubeId }})

//   return count === 0
// }