import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { randomUUID } from 'crypto';
import { WebSocketServer } from 'ws';
import { MAX_MESSAGE_BYTES, PROTOCOL_VERSION, parseClientMessage } from '../src/net/protocol';
import { Peer, ROOM_IDLE_TTL_MS, Room, makeRoomCode, send } from './rooms';
import { TokenBucket } from './rateLimit';

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';
const MAX_ROOMS = 500;
const HEARTBEAT_MS = 15000;

const rooms = new Map<string, Room>();

function leaveRoom(peer: Peer) {
  peer.room?.remove(peer);
}

function handleMessage(peer: Peer, raw: string) {
  const msg = parseClientMessage(raw);
  if (!msg) {
    send(peer.ws, { t: 'error', message: 'Geçersiz mesaj' });
    return;
  }
  const room = peer.room;
  room?.touch();

  switch (msg.t) {
    case 'hello':
      if (msg.v !== PROTOCOL_VERSION) {
        send(peer.ws, { t: 'error', message: 'Oyun sürümü güncel değil, sayfayı yenile.' });
        return;
      }
      peer.profile = msg.profile;
      send(peer.ws, { t: 'welcome', peerId: peer.id, v: PROTOCOL_VERSION });
      return;
    case 'ping':
      send(peer.ws, { t: 'pong', ts: msg.ts, serverTime: Date.now() });
      return;
    case 'input':
      if (!room?.match || msg.seq <= peer.inputSeq) return;
      peer.inputSeq = msg.seq;
      peer.inputBits = msg.bits;
      if (msg.bits & (1 << 3)) peer.latchedJump = true;
      if (msg.bits & (1 << 5)) peer.latchedAbility = true;
      return;
  }

  if (!peer.profile) {
    send(peer.ws, { t: 'error', message: 'Önce profil gönderilmeli' });
    return;
  }

  switch (msg.t) {
    case 'create': {
      if (rooms.size >= MAX_ROOMS) {
        send(peer.ws, { t: 'error', message: 'Sunucu dolu, biraz sonra tekrar dene.' });
        return;
      }
      leaveRoom(peer);
      const code = makeRoomCode((c) => rooms.has(c));
      const newRoom = new Room(code, peer, msg.settings);
      newRoom.onDispose = (r) => rooms.delete(r.code);
      rooms.set(code, newRoom);
      return;
    }
    case 'join': {
      const target = rooms.get(msg.code);
      if (!target) return send(peer.ws, { t: 'error', message: 'Oda bulunamadı' });
      if (target === room) return;
      if (target.match) return send(peer.ws, { t: 'error', message: 'Bu odada maç sürüyor' });
      if (target.full) return send(peer.ws, { t: 'error', message: 'Oda dolu' });
      leaveRoom(peer);
      target.add(peer);
      return;
    }
    case 'leave':
      leaveRoom(peer);
      send(peer.ws, { t: 'room', room: null });
      return;
    case 'profile':
      peer.profile = msg.profile;
      if (room && !room.match) room.broadcastState();
      return;
    case 'settings':
      if (!room || room.hostPeerId !== peer.id || room.match) return;
      room.settings = msg.settings;
      room.broadcastState();
      return;
    case 'start': {
      if (!room || room.hostPeerId !== peer.id) return;
      const err = room.start();
      if (err) send(peer.ws, { t: 'error', message: err });
      return;
    }
    case 'return_lobby':
      if (room) send(peer.ws, { t: 'room', room: room.toState() });
      return;
  }
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  const server = http.createServer(app);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size, protocol: PROTOCOL_VERSION });
  });

  app.get('/api/rooms/:code', (req, res) => {
    const room = rooms.get(String(req.params.code).toUpperCase());
    if (!room) return res.status(404).json({ exists: false });
    res.json({ exists: true, players: room.peers.size, inGame: !!room.match, full: room.full });
  });

  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_MESSAGE_BYTES });
  wss.on('connection', (ws) => {
    const peer: Peer = {
      id: randomUUID(),
      ws,
      profile: null,
      room: null,
      slotIndex: 0,
      inputBits: 0,
      inputSeq: 0,
      latchedJump: false,
      latchedAbility: false,
    };
    const bucket = new TokenBucket(150, 100);
    let alive = true;
    ws.on('pong', () => (alive = true));
    const heartbeat = setInterval(() => {
      if (!alive) return ws.terminate();
      alive = false;
      ws.ping();
    }, HEARTBEAT_MS);

    ws.on('message', (data, isBinary) => {
      if (isBinary) return;
      if (!bucket.take()) {
        if (bucket.violations > 300) ws.close(1008, 'rate limit');
        return;
      }
      handleMessage(peer, data.toString());
    });
    ws.on('close', () => {
      clearInterval(heartbeat);
      leaveRoom(peer);
    });
    ws.on('error', () => ws.terminate());
  });

  setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      if (now - room.lastActivity > ROOM_IDLE_TTL_MS) {
        for (const p of [...room.peers.values()]) {
          send(p.ws, { t: 'error', message: 'Oda uzun süre boş kaldığı için kapatıldı' });
          room.remove(p);
        }
        room.dispose();
      }
    }
  }, 60000).unref();

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true, hmr: { server } }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(import.meta.dirname, '..', 'dist');
    app.use(express.static(distDir, { maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Kale Kapmaca sunucusu http://0.0.0.0:${PORT} adresinde hazır`);
  });
}

startServer().catch((err) => {
  console.error('Sunucu başlatılamadı:', err);
  process.exit(1);
});
