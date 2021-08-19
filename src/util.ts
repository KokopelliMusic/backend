import { Sessions } from "./session"

/**
 * Generate a random number between lower (inclusive) and upper (inclusive)
 */
export const getRandomNumber = (lower: number, upper: number) => {
  return Math.floor(Math.random() * (upper - lower + 1) + lower)
}

export const generateCode = (sessions: string[]): string => {
  // const POSSIBLE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F',]
  const POSSIBLE_LETTERS = 'ABCDEFGHIJKMNOPQRSTUVWXYZ'
  const len = POSSIBLE_LETTERS.length
  let code = ''

  for (let i = 0; i < 4; i++) {
    code += POSSIBLE_LETTERS[getRandomNumber(0, len - 1)]
  }

  // if this code is already in use, then try again
  if (sessions.includes(code)) {
    return generateCode(sessions)
  }

  return code
}

export const getAllSessionIDs = (sessions: Sessions): string[] => {
  const res = []
  for (const x of Object.keys(sessions)) {
    res.push(x)
  }
  return res
}