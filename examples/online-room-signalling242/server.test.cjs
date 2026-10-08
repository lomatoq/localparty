'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { WebSocket } = require('ws');
const { createSignallingServer } = require('./server.cjs');

const wait = (ws, predicate) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => { done(); reject(Error('Message timed out')); }, 1500);
  function done() { clearTimeout(timer); ws.off('message', receive); }
  function receive(raw) { const message = JSON.parse(String(raw)); if (predicate(message)) { done(); resolve(message); } }
  ws.on('message', receive);
});
const post = async (url, path, payload = {}, headers = {}) => {
  const res = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(payload) });
  return { status: res.status, ...(await res.json()) };
};
async function connect(url, token) {
  const ws = new WebSocket(url.replace('http:', 'ws:') + '/signal');
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  const ready = wait(ws, message => message.type === 'ready');
  ws.send(JSON.stringify({ type: 'auth', token }));
  return { ws, ready: await ready };
}

test('room allocation, role authorization and targeted host/guest signalling', async t => {
  const app = createSignallingServer({ maxGuests: 2 });
  t.after(() => app.close());
  const url = await app.listen();
  const first = await post(url, '/rooms');
  const other = await post(url, '/rooms');
  assert.equal(first.status, 201);
  assert.match(first.code, /^\d{6}$/);
  assert.notEqual(first.code, other.code);
  assert.equal((await post(url, '/rooms/' + first.code + '/join')).error, 'HOST_NOT_READY');
  assert.equal((await post(url, '/rooms/abc/join')).status, 404);
  assert.equal((await post(url, '/rooms', {}, { Origin: 'https://other.example' })).status, 403);
  const host = await connect(url, first.hostToken);
  const otherHost = await connect(url, other.hostToken);
  const guest = await post(url, '/rooms/' + first.code + '/join');
  const guest2 = await post(url, '/rooms/' + first.code + '/join');
  assert.equal((await post(url, '/rooms/' + first.code + '/join')).error, 'ROOM_FULL');
  const peer = await connect(url, guest.guestToken);
  assert.equal(peer.ready.role, 'guest');
  assert.equal(peer.ready.epoch, first.epoch);
  const peer2 = await connect(url, guest2.guestToken);
  const signal = wait(host.ws, message => message.type === 'signal');
  const data = { description: { type: 'offer', sdp: 'example-only-SDP' } };
  peer.ws.send(JSON.stringify({ type: 'signal', to: 'host', from: 'forged-host', data }));
  const forwarded = await signal;
  assert.equal(forwarded.from, guest.peerId);
  assert.deepEqual(forwarded.data, data);
  const answer = wait(peer.ws, message => message.type === 'signal');
  host.ws.send(JSON.stringify({ type: 'signal', to: guest.peerId, data: { candidate: { candidate: 'example-only-ICE' } } }));
  assert.equal((await answer).from, 'host');
  const denied = wait(peer.ws, message => message.type === 'error');
  peer.ws.send(JSON.stringify({ type: 'signal', to: guest2.peerId, data }));
  assert.equal((await denied).error, 'HOST_ONLY');
  const crossRoom = wait(otherHost.ws, message => message.type === 'error');
  otherHost.ws.send(JSON.stringify({ type: 'signal', to: guest.peerId, data }));
  assert.equal((await crossRoom).error, 'PEER_NOT_READY');
  const notGame = wait(host.ws, message => message.type === 'error');
  host.ws.send(JSON.stringify({ type: 'game-input', to: guest.peerId, data }));
  assert.equal((await notGame).error, 'SIGNAL_REQUIRED');
  assert.equal((await post(url, '/rooms/' + first.code + '/close', {}, { Authorization: 'Bearer ' + guest.guestToken })).status, 403);
  const closed = wait(peer2.ws, message => message.type === 'room-closed');
  assert.equal((await post(url, '/rooms/' + first.code + '/close', {}, { Authorization: 'Bearer ' + first.hostToken })).status, 200);
  assert.equal((await closed).reason, 'HOST_CLOSED');
  assert.equal((await post(url, '/rooms/' + first.code + '/join')).error, 'ROOM_NOT_FOUND');
});

test('host replacement preserves the room; host disappearance and TTL invalidate it', async t => {
  let clock = 1000;
  const app = createSignallingServer({ now: () => clock, ttlMs: 5000 });
  t.after(() => app.close());
  const url = await app.listen();
  const room = await post(url, '/rooms');
  const firstHost = await connect(url, room.hostToken);
  const replacement = await connect(url, room.hostToken);
  assert.equal(replacement.ready.role, 'host');
  const guest = await post(url, '/rooms/' + room.code + '/join');
  const peer = await connect(url, guest.guestToken);
  const closed = wait(peer.ws, message => message.type === 'room-closed');
  replacement.ws.close();
  assert.equal((await closed).reason, 'HOST_LEFT');
  assert.equal((await post(url, '/rooms/' + room.code + '/join')).error, 'ROOM_NOT_FOUND');
  const expires = await post(url, '/rooms');
  const host = await connect(url, expires.hostToken);
  const expired = wait(host.ws, message => message.type === 'room-closed');
  clock += 5001;
  app.expire();
  assert.equal((await expired).reason, 'ROOM_EXPIRED');
  assert.equal((await post(url, '/rooms/' + expires.code + '/join')).error, 'ROOM_NOT_FOUND');
  firstHost.ws.terminate();
});

test('invalid signalling credentials are rejected and creation is bounded', async t => {
  const app = createSignallingServer();
  t.after(() => app.close());
  const url = await app.listen();
  const ws = new WebSocket(url.replace('http:', 'ws:') + '/signal');
  const close = new Promise(resolve => ws.once('close', (code, reason) => resolve({ code, reason: String(reason) })));
  await new Promise(resolve => ws.once('open', resolve));
  ws.send(JSON.stringify({ type: 'auth', token: 'a'.repeat(43) }));
  assert.deepEqual(await close, { code: 1008, reason: 'AUTH_DENIED' });
  assert.equal((await post(url, '/rooms', null)).status, 400);
  const room = await post(url, '/rooms');
  const host = await connect(url, room.hostToken);
  const invalidMessage = new Promise(resolve => host.ws.once('close', (code, reason) => resolve({ code, reason: String(reason) })));
  host.ws.send('null');
  assert.deepEqual(await invalidMessage, { code: 1008, reason: 'INVALID_MESSAGE' });
  for (let i = 0; i < 4; i++) assert.equal((await post(url, '/rooms')).status, 201);
  assert.equal((await post(url, '/rooms')).status, 429);
});
