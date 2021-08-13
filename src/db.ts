import { database } from "firebase-admin"

export const createSessionInDB = (code: string, uid: string, playlistId: string, started: Date) => {
  const object = {
    uid,
    playlistId,
    started: started.getTime()
  }
  database()
    .ref('/sessions/' + code)
    .set(object)
}

export const removeSessionFromDB = (code: string) => {
  database()
    .ref('/sessions/' + code)
    .remove()
}

export const getAllSessionsFromDB = async () => {
  return await database()
    .ref('/sessions')
    .get()
    .then(snap => snap.val())
}