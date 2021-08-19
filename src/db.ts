import { database } from "firebase-admin"
import { on } from "process"
import { Connection } from "typeorm"
import { SpotifySong } from "./entity/SpotifySong"
import { Session, Sessions } from "./session"
import { getRandomNumber } from "./util"

type Playlist = {
  dateCreated: string
  name: string
  songs: SpotifySong[]
  user: string
  users: Users
}

type Users = Map<string, string>

type Weights = Map<string, Weight>

type Weight = number

export const BASE_WEIGHT = 10
export const MAX_PLAYS = 3

export const createSessionInDB = (code: string, uid: string, playlistId: string, started: Date) => {
  const object = {
    uid,
    playlistId,
    started: started.getTime()
  }
  database()
    .ref('/sessions/' + code)
    .set(object)

  // set the base weight for events
  database()
    .ref(`/sessions/${code}/weights/event`)
    .set(1)
    .then(() => {
      // then watch other users
      watchUsersAndInitialze(code ,playlistId)
    })

}

// Function that watches the users list of a playlist and initializes the user in the session
const watchUsersAndInitialze = (code: string, playlistId: string) => {
  const db = database()
  db
    .ref(`/playlists/${playlistId}/users`)
    // Every time a user is added, run this function
    .on('child_added', (snap) => {
      db
      .ref(`/sessions/${code}/weights/${snap.val()}`)
      .set(BASE_WEIGHT)
    })
}

export const removeSessionFromDB = (code: string) => {
  database()
    .ref('/sessions/' + code)
    .remove()
}

export const getAllSessionsFromDB = async (): Promise<Sessions> => {
  return get('/sessions')
}

export const getSession = (code: string): Promise<Session> => {
  return get('/sessions/' + code)
}

export const getPlaylist = async (db: Connection, playlistId: string): Promise<Playlist> => {
  const list: Playlist = await get('/playlists/' + playlistId)
  const songs: SpotifySong[] = await db.manager.find(SpotifySong, { where: { playlistId }})
  list.songs = songs

  return list
}

export const getWeights = (code: string) => {

  return get(`/sessions/${code}/weights`)
    .then(w => {
      console.log(w)
      const weights: Weights = new Map<string, Weight>()

      for (const [uid, weight] of Object.entries(w)) {
        // @ts-expect-error
        weights.set(uid, weight)
      }

      return weights
    })
}

export const watchCurrentlyPlaying = (db: Connection, code: string) => {
  database()
    .ref('/currently-playing/' + code)
    .on('value', snap => {
      const song = snap.val()

      if (!song) return

      console.log('Currently playing: ', song)

      if (song.spotifyId && song.playlistId) {
        updateSpotifyPlays(db, song.spotifyId, song.playlistId)
      }
    })
}

export const removeCurrentlyPlaying = (code: string) => {
  const ref = database().ref('/currently-playing/' + code)
  ref.remove()
  ref.off()
  
}

const updateSpotifyPlays = (db: Connection, spotifyId: string, playlistId: string) => {
  db.createQueryBuilder()
    .update(SpotifySong)
    .set({ plays: () => "plays + 1" })
    .where({ playlistId, spotifyId })
    .execute()
}

/**
 * Java style function naming lol.
 * anyway it returns an object mapping the uid to the songs that have not been played more than
 * const MAX_PLAYED
 */
export const getAllSongsPerUserNotPlayedEnough = async (db: Connection, playlistId: string): Promise<Map<string, SpotifySong[]>> => {
  return await getPlaylist(db, playlistId)
    .then(list => {
      const songs = new Map<string, SpotifySong[]>()

      list.songs.forEach(song => {
        if (song.plays === undefined || song.plays < MAX_PLAYS) {
          const uid = song.uid

          if (songs.has(uid)) {
            songs.get(uid).push(song)
          } else {
            songs.set(uid, [song])
          }
        }
      })

      return songs
    })
}

export const resetAllSongs = async (db: Connection, playlistId: string) => {
  return await db.createQueryBuilder()
    .update(SpotifySong)
    .set({ plays: 0 })
    .where({ playlistId })
    .execute()

}

export const initializeUser = (uid: string, session: string) => {
  database()
    .ref(`/sessions/${session}/weights/${uid}`)
    .set(BASE_WEIGHT)
}

const get = (query: string): Promise<any> => {
  return database().ref(query).get().then(snap => snap.val())
}