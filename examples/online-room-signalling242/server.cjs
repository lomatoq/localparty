'use strict';
// Isolated, loopback-only signalling example. It does not expose the game server.
const http = require('node:http');
const crypto = require('node:crypto');
const { WebSocket, WebSocketServer } = require('ws');

function createSignallingServer({ now = Date.now, ttlMs = 60 * 60 * 1000, maxGuests = 16 } = {}) {
  const rooms = new Map();
  const credentials = new Map();
  const requests = new Map();
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
  const randomToken = () => crypto.randomBytes(32).toString('base64url');
  const digest = token => crypto.createHash('sha256').update(token).digest('hex');
  const json = (res, status, value) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(value));
  };
  const send = (socket, value) => {
    if (socket?.readyState === WebSocket.OPEN && socket.bufferedAmount < 128 * 1024) socket.send(JSON.stringify(value));
  };
  function retire(room, reason) {
    if (rooms.get(room.code) !== room) return;
    rooms.delete(room.code);
    for (const peer of room.peers.values()) {
      credentials.delete(peer.credentialHash);
      send(peer.socket, { type: 'room-closed', reason });
      peer.socket?.close(4000, reason);
    }
  }
  function expire() {
    for (const room of rooms.values()) if (room.expiresAt <= now()) retire(room, 'ROOM_EXPIRED');
    for (const [key, window] of requests) if (window.until <= now()) requests.delete(key);
  }
  const sameOrigin = req => !req.headers.origin || req.headers.origin === 'http://' + req.headers.host;
  function throttle(req, operation, limit) {
    const key = req.socket.remoteAddress + ':' + operation;
    let window = requests.get(key);
    if (!window || window.until <= now()) {
      window = { count: 0, until: now() + 60000 };
      requests.set(key, window);
    }
    return ++window.count <= limit;
  }
  async function body(req) {
    let text = '';
    for await (const chunk of req) {
      text += chunk;
      if (Buffer.byteLength(text) > 4096) throw Error('BODY_TOO_LARGE');
    }
    return JSON.parse(text || '{}');
  }
  function addPeer(room, role) {
    const token = randomToken();
    const peer = { id: role === 'host' ? 'host' : crypto.randomUUID(), role, room, credentialHash: digest(token), socket: null };
    room.peers.set(peer.id, peer);
    credentials.set(peer.credentialHash, peer);
    return { peer, token };
  }
  const server = http.createServer(async (req, res) => {
    expire();
    if (!sameOrigin(req)) return json(res, 403, { error: 'ORIGIN_DENIED' });
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, scope: 'signalling-only' });
    if (req.method !== 'POST') return json(res, 405, { error: 'POST_REQUIRED' });
    try {
      const payload = await body(req);
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return json(res, 400, { error: 'INVALID_REQUEST' });
      if (url.pathname === '/rooms') {
        if (!throttle(req, 'create', 5)) return json(res, 429, { error: 'RATE_LIMITED' });
        if (rooms.size >= 128) return json(res, 503, { error: 'ROOM_LIMIT' });
        let code;
        for (let attempt = 0; attempt < 32; attempt++) {
          code = String(crypto.randomInt(1000000)).padStart(6, '0');
          if (!rooms.has(code)) break;
          code = null;
        }
        if (!code) return json(res, 503, { error: 'ROOM_LIMIT' });
        const room = { code, epoch: crypto.randomUUID(), expiresAt: now() + ttlMs, peers: new Map() };
        rooms.set(code, room);
        const { token } = addPeer(room, 'host');
        return json(res, 201, { code, epoch: room.epoch, hostToken: token, expiresAt: room.expiresAt });
      }
      const match = /^\/rooms\/(\d{6})\/(join|close)$/.exec(url.pathname);
      if (!match) return json(res, 404, { error: 'NOT_FOUND' });
      const room = rooms.get(match[1]);
      if (match[2] === 'join') {
        if (!throttle(req, 'join', 20)) return json(res, 429, { error: 'RATE_LIMITED' });
        if (!room) return json(res, 404, { error: 'ROOM_NOT_FOUND' });
        if (room.peers.get('host')?.socket?.readyState !== WebSocket.OPEN) return json(res, 409, { error: 'HOST_NOT_READY' });
        // Tokens reserve a place; production admission needs a host acceptance step.
        if (room.peers.size - 1 >= maxGuests) return json(res, 409, { error: 'ROOM_FULL' });
        const { peer, token } = addPeer(room, 'guest');
        return json(res, 200, { code: room.code, epoch: room.epoch, peerId: peer.id, guestToken: token, expiresAt: room.expiresAt });
      }
      const token = /^Bearer ([-_A-Za-z0-9]{43})$/.exec(req.headers.authorization || '')?.[1];
      const owner = token && credentials.get(digest(token));
      if (!room || owner?.room !== room || owner.role !== 'host') return json(res, 403, { error: 'HOST_AUTH_REQUIRED' });
      retire(room, 'HOST_CLOSED');
      return json(res, 200, { ok: true });
    } catch (error) {
      return json(res, 400, { error: error.message === 'BODY_TOO_LARGE' ? 'BODY_TOO_LARGE' : 'INVALID_REQUEST' });
    }
  });
  server.on('upgrade', (req, socket, head) => {
    if (!sameOrigin(req) || req.url !== '/signal') return socket.destroy();
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
  });
  wss.on('connection', ws => {
    const timeout = setTimeout(() => ws.close(1008, 'AUTH_REQUIRED'), 5000);
    timeout.unref();
    let peer = null, count = 0, windowUntil = now() + 60000;
    ws.on('error', () => {});
    ws.on('message', (raw, binary) => {
      expire();
      if (binary) return ws.close(1008, 'JSON_REQUIRED');
      if (now() >= windowUntil) { count = 0; windowUntil = now() + 60000; }
      if (++count > 2400) return ws.close(1008, 'RATE_LIMITED');
      let message;
      try { message = JSON.parse(String(raw)); } catch { return ws.close(1008, 'INVALID_JSON'); }
      if (!message || typeof message !== 'object' || Array.isArray(message)) return ws.close(1008, 'INVALID_MESSAGE');
      if (!peer) {
        const token = message?.type === 'auth' && typeof message.token === 'string' && /^[-_A-Za-z0-9]{43}$/.test(message.token) ? message.token : null;
        peer = token && credentials.get(digest(token));
        if (!peer || rooms.get(peer.room.code) !== peer.room) { peer = null; return ws.close(1008, 'AUTH_DENIED'); }
        clearTimeout(timeout);
        const previous = peer.socket;
        peer.socket = ws;
        previous?.close(4001, 'REPLACED');
        send(ws, { type: 'ready', code: peer.room.code, epoch: peer.room.epoch, peerId: peer.id, role: peer.role });
        if (peer.role === 'guest') send(peer.room.peers.get('host').socket, { type: 'peer-joined', peerId: peer.id });
        return;
      }
      if (peer.socket !== ws || rooms.get(peer.room.code) !== peer.room) return ws.close(1008, 'SESSION_EXPIRED');
      if (message.type === 'ping') return send(ws, { type: 'pong' });
      const data = message?.data;
      const description = data?.description;
      const candidate = data?.candidate;
      const validDescription = description && ['offer', 'answer'].includes(description.type) && typeof description.sdp === 'string' && description.sdp.length <= 60 * 1024;
      const validCandidate = candidate && typeof candidate.candidate === 'string' && candidate.candidate.length <= 8192;
      if (message.type !== 'signal' || typeof message.to !== 'string' || (!validDescription && !validCandidate)) return send(ws, { type: 'error', error: 'SIGNAL_REQUIRED' });
      // Star topology: guests can signal only the host, never another guest.
      if (peer.role === 'guest' && message.to !== 'host') return send(ws, { type: 'error', error: 'HOST_ONLY' });
      const target = peer.room.peers.get(message.to);
      if (!target || target === peer || target.socket?.readyState !== WebSocket.OPEN) return send(ws, { type: 'error', error: 'PEER_NOT_READY' });
      send(target.socket, { type: 'signal', from: peer.id, epoch: peer.room.epoch, data });
    });
    ws.on('close', () => {
      clearTimeout(timeout);
      if (!peer || peer.socket !== ws) return;
      peer.socket = null;
      if (peer.role === 'host') retire(peer.room, 'HOST_LEFT');
      else send(peer.room.peers.get('host')?.socket, { type: 'peer-left', peerId: peer.id });
    });
  });
  const cleanup = setInterval(expire, 1000);
  cleanup.unref();
  return {
    server,
    async listen(port = 0) {
      await new Promise((resolve, reject) => {
        const failed = error => reject(error);
        server.once('error', failed);
        server.listen(port, '127.0.0.1', () => { server.off('error', failed); resolve(); });
      });
      return 'http://127.0.0.1:' + server.address().port;
    },
    expire,
    async close() {
      clearInterval(cleanup);
      for (const room of rooms.values()) retire(room, 'SERVER_CLOSED');
      for (const ws of wss.clients) ws.terminate();
      await new Promise(resolve => wss.close(resolve));
      await new Promise(resolve => server.close(resolve));
    }
  };
}

module.exports = { createSignallingServer };
if (require.main === module) {
  const app = createSignallingServer();
  app.listen(Number(process.env.HEYPALS_SIGNAL_PORT || 8791)).then(url => console.log('Signalling-only example: ' + url));
  const finish = () => app.close().then(() => process.exit(0));
  process.once('SIGINT', finish);
  process.once('SIGTERM', finish);
}
