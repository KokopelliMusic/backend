import { FastifyReply, FastifyRequest } from "fastify"
import { getAllSongsPerUserNotPlayedEnough, getCurrentlyPlaying, getPlaylist, getSession, getWeights, MAX_PLAYS, resetAllSongs } from "./db"
import { Song } from "./entity/Song"
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
        code: { type: 'string' },
        firstTime: { type: 'boolean' }
      }
    }
  }
}

export const selectNextEvent = async (req: FastifyRequest, reply: FastifyReply) => {
  // @ts-expect-error
  const code = req.query.code.toUpperCase()
  // @ts-expect-error
  const firstTime = req.query.firstTime
  // @ts-expect-error
  const db: Connection = req.db

  const session     = await getSession(code)
  let weightsFromDb = await getWeights(code)
  const playlist    = await getPlaylist(db, session.playlistId)
  let songs         = await getAllSongsPerUserNotPlayedEnough(db, session.playlistId)
  const lastPlayed  = await getCurrentlyPlaying(code)
  let event         = false

  console.log('lastPlayed', lastPlayed)

  // First song cannot be an event
  if (firstTime || lastPlayed.songType === 'event') weightsFromDb.delete('event')

  console.log('SongsNotPlayedEnough', songs)

  let selectedSongs: Song[] = []

  // If the playlist has only one song then everything breaks :(
  if (playlist.songs.length === 0 || playlist.songs.length === 1) {
    return {
      type: 'nosongs',
      data: {}
    }
  }

  if (songs.size === 0) {
    // If there are no songs left to play, reset the playlist
    await resetAllSongs(db, session.playlistId)
    songs = await getAllSongsPerUserNotPlayedEnough(db, session.playlistId)
    weightsFromDb = await getWeights(code)

    // TODO lol
    weightsFromDb.delete('event')
  }


  while (!selectedSongs || selectedSongs.length === 0) {


    // only 'event' is left
    if (weightsFromDb.size === 1) {
      await resetAllSongs(db, session.playlistId)
      songs = await getAllSongsPerUserNotPlayedEnough(db, session.playlistId)
      weightsFromDb = await getWeights(code)
    
      if (firstTime || lastPlayed.songType === 'event') weightsFromDb.delete('event')
    }

    // Get all weights
    const weights = []

    // https://www.rubyguides.com/2016/05/weighted-random-numbers/
    for (const [uid, weight] of weightsFromDb.entries()) {
      for (let i = 0; i < weight; i++) {
        weights.push(uid)
      }
    }

    // Select a random user
    const selectedUid = weights[getRandomNumber(0, weights.length - 1)]

    console.log('selectedUid', selectedUid)

    if (selectedUid === 'event') {
      event = true
      break
    }

    selectedSongs = songs.get(selectedUid)

    if (!selectedSongs || selectedSongs.length === 0) {
      // this user has no songs left
      weightsFromDb.delete(selectedUid)
      continue
    }

    // filter out the song that was played before this
    if (lastPlayed) {
      
      console.log('selectedSongs', selectedSongs)
      selectedSongs = selectedSongs.filter(f => f.id !== lastPlayed.id)
    }

  }

  // Return that an event should be done
  if (event) {
    return {
      type: 'event',
      data: {
        type: 'event'
      }
    }
  }

  let song

  // const song = selectedSongs[getRandomNumber(0, selectedSongs.length - 1)]
  for (let i = 0; i < MAX_PLAYS; i++) {
    const _songs = selectedSongs.filter(f => f.plays === i)

    if (_songs.length === 0) {
      continue
    } else {
      song = _songs[getRandomNumber(0, _songs.length - 1)]
      break
    }
  }

  console.log('Selected song: ', song)

  return {
    type: song.songType,
    data: song
  }

}

export default Event