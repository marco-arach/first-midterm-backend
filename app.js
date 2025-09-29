const express = require('express');
const cors = require('cors');
const http = require("http");
const { Server } = require("socket.io");
require('dotenv').config();

const apiRouter = require('./routes/api');
const { initializeSockets } = require('./services/socketService');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.use('/api/v1', apiRouter);

app.get('/', (req, res) => {
  res.send('Hola mundo');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

initializeSockets(io);

server.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
