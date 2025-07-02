import express from 'express';
import http from 'http';
import axios from 'axios';
import WebSocket from 'ws';
import cors from 'cors';
import morgan from 'morgan';
import { Server } from 'socket.io';

const BINANCE_WS = 'wss://stream.binance.com:9443/ws/btcusdt@trade';

const app = express();
app.use(cors());
app.use(morgan('dev'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

let ws;
let currentIntervalVolume = 0;
let previousIntervalVolume = 0;
let intervalStart = Date.now();

function resetInterval() {
  previousIntervalVolume = currentIntervalVolume;
  currentIntervalVolume = 0;
  intervalStart = Date.now();
}

function connectWs() {
  ws = new WebSocket(BINANCE_WS);
  ws.on('open', () => console.log('Connected to Binance WS'));
  ws.on('message', data => {
    try {
      const json = JSON.parse(data);
      const volume = parseFloat(json.q);
      const price = parseFloat(json.p);
      const time = json.T;

      currentIntervalVolume += volume;
      io.emit('trade', { price, volume, time });

      if (Date.now() - intervalStart >= 5 * 60 * 1000) {
        const diff = previousIntervalVolume > 0 ? ((currentIntervalVolume - previousIntervalVolume) / previousIntervalVolume) * 100 : 0;
        io.emit('volumeInterval', {
          volume: currentIntervalVolume,
          diff
        });
        if (diff >= 5) {
          io.emit('alert', { message: `Volume increased ${diff.toFixed(2)}%` });
        }
        resetInterval();
      }
    } catch (e) {
      console.error('WS parse error', e);
    }
  });
  ws.on('close', () => {
    console.error('WS closed. Reconnecting...');
    setTimeout(connectWs, 1000);
  });
  ws.on('error', err => {
    console.error('WS error', err);
    ws.close();
  });
}
connectWs();

app.get('/api/historical', async (req, res) => {
  try {
    const end = Date.now();
    const start = end - 24 * 60 * 60 * 1000;
    const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&startTime=${start}&endTime=${end}`;
    const response = await axios.get(url);
    const data = response.data.map(k => ({
      time: k[0],
      price: parseFloat(k[4]),
      volume: parseFloat(k[7])
    }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
