'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {once} = require('node:events');
const {WebSocket} = require('ws');

async function freePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function client(url, headers) {
  const socket = new WebSocket(url, {headers});
  const messages = [], pending = new Set();
  socket.on('message', raw => {
    const message = JSON.parse(raw);
    for (const waiter of pending) {
      if (waiter.matches(message)) {
        pending.delete(waiter); clearTimeout(waiter.timer); waiter.resolve(message); return;
      }
    }
    messages.push(message);
  });
  await once(socket, 'open');
  return {
    socket,
    send: message => socket.send(JSON.stringify(message)),
    clear: () => { messages.length = 0; },
    wait(matches) {
      const index = messages.findIndex(matches);
      if (index >= 0) return Promise.resolve(messages.splice(index, 1)[0]);
      return new Promise((resolve, reject) => {
        const waiter = {matches, resolve};
        waiter.timer = setTimeout(() => {pending.delete(waiter); reject(new Error('Timed out waiting for lobby message'));}, 4000);
        pending.add(waiter);
      });
    },
    async close() {
      if (socket.readyState === WebSocket.CLOSED) return;
      const closed = once(socket, 'close'); socket.close(); await closed;
    }
  };
}

test('LAN gateway identity, presence, and host authorization', {timeout: 30000}, async t => {
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {...process.env, PARTY_EPHEMERAL: '1', PARTY_PORT: String(port), PARTY_NO_BROWSER: '1'},
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '', spawnError;
  child.stdout.on('data', data => output += data);
  child.stderr.on('data', data => output += data);
  child.on('error', error => {spawnError = error;});
  const clients = [];
  t.after(async () => {
    await Promise.all(clients.map(c => c.close()));
    if (child.exitCode === null && !spawnError) {
      const exited = once(child, 'exit'); child.kill(); await exited;
    }
  });
  let healthy = false;
  for (let i = 0; i < 100; i++) {
    if (spawnError || child.exitCode !== null) throw new Error(`Launcher failed: ${spawnError || output}`);
    try { const response = await fetch(`${origin}/api/health`); healthy = response.ok; } catch {}
    if (healthy) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.ok(healthy, `Launcher did not become healthy: ${output}`);
  const open = async () => {const c = await client(`ws://127.0.0.1:${port}/lobby`); clients.push(c); return c;};
  const host = await open();
  const hostPage = await (await fetch(`${origin}/host`)).text();
  const key = JSON.parse(hostPage.match(/window\.PARTY_HOST_KEY=("[^"]+")/)[1]);

  await t.test('host key is withheld from player page and wrong keys are rejected', async () => {
    const page = await (await fetch(`${origin}/`)).text();
    assert.match(page, /window\.PARTY_HOST_KEY=null/);
    assert.ok(!page.includes(key));
    host.send({type: 'host', key: 'wrong'});
    assert.match((await host.wait(m => m.type === 'error')).message, /Нет доступа/);
    host.send({type: 'host', key});
    assert.equal((await host.wait(m => m.type === 'host-ok')).type, 'host-ok');
  });

  await t.test('host cannot launch an empty game', async () => {
    host.send({type: 'launch', id: 'tanks'});
    assert.match((await host.wait(m => m.type === 'error')).message, /2.*16/);
  });

  const alice = await open();
  const avatar = 'data:image/jpeg;base64,/9j/2Q==';
  alice.send({type: 'join', name: 'Алиса', hand: 'left', avatar});
  const identity = await alice.wait(m => m.type === 'joined');
  await t.test('joined player is visible with chosen name and hand', async () => {
    const state = await host.wait(m => m.type === 'state' && m.players.some(p => p.id === identity.id));
    assert.equal(identity.avatar, avatar);
    assert.deepEqual(state.players, [{id: identity.id, name: 'Алиса', hand: 'left', avatar, gameReady: false, testBot: false}]);
  });

  await t.test('case-insensitive duplicate name is rejected', async () => {
    const duplicate = await open();
    duplicate.send({type: 'join', name: 'АЛИСА'});
    assert.match((await duplicate.wait(m => m.type === 'error')).message, /имя уже занято/);
    await duplicate.close();
  });

  await t.test('player cannot launch and host cannot launch below game minimum', async () => {
    alice.send({type: 'launch', id: 'tanks'});
    assert.match((await alice.wait(m => m.type === 'error')).message, /выбирает ведущий/);
    host.send({type: 'launch', id: 'tanks'});
    assert.match((await host.wait(m => m.type === 'error')).message, /2.*16/);
  });

  await t.test('reconnect replaces live socket without duplicating identity', async () => {
    const replacement = await open();
    host.clear();
    replacement.send({type: 'join', token: identity.token, name: 'Алиса', hand: 'left'});
    const resumed = await replacement.wait(m => m.type === 'joined');
    assert.equal(resumed.id, identity.id);
    assert.equal(resumed.token, identity.token);
    await alice.wait(m => m.type === 'replaced');
    const state = await host.wait(m => m.type === 'state' && m.players.some(p => p.id === identity.id));
    assert.equal(state.players.length, 1);
    host.clear();
    await replacement.close();
    await host.wait(m => m.type === 'state' && m.players.length === 0);
  });

  await t.test('disconnected player disappears and can reclaim identity', async () => {
    const returning = await open();
    host.clear();
    returning.send({type: 'join', token: identity.token, name: 'Алиса', hand: 'left'});
    assert.equal((await returning.wait(m => m.type === 'joined')).id, identity.id);
    await host.wait(m => m.type === 'state' && m.players.length === 1);
    host.clear();
    await returning.close();
    await host.wait(m => m.type === 'state' && m.players.length === 0);
  });
  await t.test('device cookie restores identity and explicit fresh join does not replace it', async () => {
    const cookie=`local_party_device=${identity.token}`;
    const profile=await(await fetch(origin+'/api/profile',{headers:{Cookie:cookie}})).json();assert.equal(profile.profile.id,identity.id);assert.equal(profile.profile.avatar,avatar);
    const restored=await client(`ws://127.0.0.1:${port}/lobby`,{Cookie:cookie});clients.push(restored);restored.send({type:'join'});assert.equal((await restored.wait(m=>m.type==='joined')).id,identity.id);
    const fresh=await client(`ws://127.0.0.1:${port}/lobby`,{Cookie:cookie});clients.push(fresh);fresh.send({type:'join',freshIdentity:true,name:'Борис'});assert.notEqual((await fresh.wait(m=>m.type==='joined')).id,identity.id);
    restored.send({type:'ping'});await restored.wait(m=>m.type==='pong');
  });
});
