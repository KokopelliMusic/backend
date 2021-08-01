import { Router } from 'express'

const homeRouter = Router()

homeRouter.get('/', (req, res) => res.send('Backend'))

export default homeRouter