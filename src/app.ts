import express from 'express'
import { Socket } from 'socket.io'

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const port = 8080
app.set('port', process.env.PORT || port)

app.get('/', (req, res) => res.send('Backend'))

io.on('connection', (socket: Socket) => {
  console.log('user connected')
})

app.listen(port, () => console.log(`Listening on localhost:${port}`))