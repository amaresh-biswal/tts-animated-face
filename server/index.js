const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const googleTTS = require('google-tts-api');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('speak', async (text) => {
    try {
      const url = googleTTS.getAudioUrl(text, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
      });
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
      });

      const filePath = path.join(__dirname, 'temp_audio.mp3');
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      writer.on('finish', () => {
        socket.emit('audio', `http://localhost:5000/audio`);
        setTimeout(() => {
          socket.emit('done');
        }, text.length * 100); // Simulate speaking time
      });
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get('/audio', (req, res) => {
  const filePath = path.join(__dirname, 'temp_audio.mp3');
  res.sendFile(filePath);
});

server.listen(5000, () => {
  console.log('Server is running on port 5000');
});
