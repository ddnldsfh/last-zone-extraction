import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'colyseus';
import { GameRoom } from './rooms/GameRoom.js';

const app = express();
app.use(cors());
app.use(express.json());

const port = Number(process.env.PORT || 2567);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'last-zone-server' });
});

const httpServer = createServer(app);
const gameServer = new Server({
  server: httpServer,
  pingInterval: 2000,
  pingMaxRetries: 3
});

gameServer.define('game', GameRoom);

httpServer.listen(port, () => {
  console.log(`LAST ZONE server listening on ws://localhost:${port}`);
});
