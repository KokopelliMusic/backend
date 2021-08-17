import { FastifyReply, FastifyRequest } from "fastify"
import { getAllSongsPerUserNotPlayedEnough, getPlaylist, getSession, getWeights, resetAllSongs } from "./db"
import { getRandomNumber } from "./util"

type Event = 'loading'
           | 'spotify'
           | 'mp3'
           | 'youtube'
           | 'nosongs'
           | 'game'

export const selectNextEventSchema = {
  schema: {
    querystring: {
      type: 'object',
      required: [ 'code' ],
      properties: {
        code: { type: 'string' }
      }
    }
  }
}

export const selectNextEvent = async (req: FastifyRequest, reply: FastifyReply) => {
  // @ts-expect-error
  const code = req.query.code.toUpperCase()
  // @ts-expect-error
  const db: Connection = req.db


  const session = await getSession(code)
  const weightsFromDb = await getWeights(code)
  const playlist = await getPlaylist(db, session.playlistId)
  const songs = await getAllSongsPerUserNotPlayedEnough(db, session.playlistId)

  // TODO events toevoegen
  weightsFromDb.delete('event')

  let selectedSongs: any[] = []

  if (playlist.songs.length === 0) {
    return {
      type: 'nosongs',
      data: {}
    }
  }

  while (!selectedSongs || selectedSongs.length === 0) {

    if (weightsFromDb.size === 0) {
      // TODO test dit
      await resetAllSongs(db, session.playlistId)
    }

    // Get all weights
    const weights = []

    // https://www.rubyguides.com/2016/05/weighted-random-numbers/
    for (const [uid, weight] of weightsFromDb.entries()) {
      for (let i = 0; i < weight; i++) {
        weights.push(uid)
      }
    }

    const uid = weights[getRandomNumber(0, weights.length - 1)]

    if (uid === 'event') {
      selectedSongs = ['event']
      break
    }

    selectedSongs = songs.get(uid)

    if (!selectedSongs || selectedSongs.length === 0) {
      // this user has no songs left
      weightsFromDb.delete(uid)
    }
  }
  
  if (selectedSongs.length === 1 && selectedSongs[0] === 'event') {
    return {
      type: 'event',
      data: {}
    }
  }

  const song = selectedSongs[getRandomNumber(0, selectedSongs.length - 1)]

  console.log(song)

  return {
    type: 'spotify',
    data: song
  }

}

export default Event