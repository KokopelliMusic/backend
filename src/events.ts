import { FastifyReply, FastifyRequest } from "fastify"
import { getAllSongsPerUserNotPlayedEnough, getCurrentlyPlaying, getPlaylist, getSession, getWeights, MAX_PLAYS, resetAllSongs } from "./db"
import { SpotifySong } from "./entity/SpotifySong"
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

  const session     = await getSession(code)
  let weightsFromDb = await getWeights(code)
  const playlist    = await getPlaylist(db, session.playlistId)
  let songs         = await getAllSongsPerUserNotPlayedEnough(db, session.playlistId)
  const lastPlayed  = await getCurrentlyPlaying(code)
  let event         = false

  // TODO events toevoegen
  weightsFromDb.delete('event')

  let selectedSongs: SpotifySong[] = []

  if (playlist.songs.length === 0) {
    return {
      type: 'nosongs',
      data: {}
    }
  }

  while (!selectedSongs || selectedSongs.length === 0) {

    if (weightsFromDb.size === 0) {
      await resetAllSongs(db, session.playlistId)
      songs = await getAllSongsPerUserNotPlayedEnough(db, session.playlistId)
      weightsFromDb = await getWeights(code)
      // TODO lol
      weightsFromDb.delete('event')
    }

    // Get all weights
    const weights = []

    // https://www.rubyguides.com/2016/05/weighted-random-numbers/
    for (const [uid, weight] of weightsFromDb.entries()) {
      for (let i = 0; i < weight; i++) {
        weights.push(uid)
      }
    }

    const selectedUid = weights[getRandomNumber(0, weights.length - 1)]

    if (selectedUid === 'event') {
      event = true
      break
    }

    selectedSongs = songs.get(selectedUid)

    // filter out the song that was played before this
    if (lastPlayed) {
      selectedSongs = selectedSongs.filter(song => song.id !== lastPlayed.id)
      console.log(selectedSongs)
    }

    if (!selectedSongs || selectedSongs.length === 0) {
      // this user has no songs left
      weightsFromDb.delete(selectedUid)
    }

    if (weightsFromDb.size === 0) {
      return {
        type: 'nosongs',
        data: {}
      }
    }

  }

  if (event) {
    return {
      type: 'event',
      data: {}
    }
  }

  let song
  
  // const song = selectedSongs[getRandomNumber(0, selectedSongs.length - 1)]
  for (let i = 0; i < MAX_PLAYS; i++) {
    let songs = selectedSongs.filter(song => song.plays === i)

    if (songs.length === 0) {
      continue
    } else {
      song = songs[getRandomNumber(0, songs.length - 1)]
      break
    }
  }


  return {
    type: 'spotify',
    data: song
  }

}

export default Event