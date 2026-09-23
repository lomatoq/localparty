'use strict';
// End-to-end bridge: real server shots -> captured events -> WebKit renderers.
// Never manufactures an impact or substitutes a generic blast for a weapon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const express = require('express');
const { webkit } = require(process.env.PARTY_PLAYWRIGHT || 'playwright');
const { Tanks } = require('../games/arcade_deluxe/core/tanks.cjs');
const { WEAPONS, BY_ID } = require('../games/arcade_deluxe/core/weapons.cjs');
const KEY = new Set(['burn_barrel', 'mud_pie', 'magic_forest']);
function simulate(weapon) {
  const g = new Tanks(7), events = [], frames = [];
  g.add({ id: 'a', name: 'A', connected: true }); g.add({ id: 'b', name: 'B', connected: true });
  g.start({ sandbox: true }); g.effectAudit = [];
  const emit = g.emit.bind(g);
  g.emit = (kind, data) => { emit(kind, data); events.push({ ...g.events[g.events.length - 1] }); };
  const p = g.active(); p.weapon = weapon.id; p.angle = 55; p.power = 38;
  const initialTerrain = g.terrain.slice();
  assert(g.fire(), `${weapon.id}: shot rejected`);
  for (let step = 0; step < 46 * 60 && g.stage === 'flight'; step++) {
    g.step(1 / 60);
    if (KEY.has(weapon.id) && step % 2 === 0) frames.push({ t: g.t, terrain: g.terrain.slice() });
  }
  for (const e of events) if ('x' in e || 'y' in e) assert(Number.isFinite(e.x) && Number.isFinite(e.y), `${weapon.id}: non-finite event ${e.kind}`);
  return { weapon: weapon.id, name: weapon.name, events, frames, initialTerrain, finalTerrain: g.terrain.slice(),
    commandTypes: [...new Set(g.effectAudit.filter(e => e.type === 'command').map(e => e.commandType))],
    limits: g.effectAudit.filter(e => e.type === 'limit'), settled: g.stage !== 'flight', time: g.t };
}
async function main() {
  const shots = WEAPONS.map(simulate);
  const server = express().use(express.static('games/arcade_deluxe/public')).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  let browser;
  try {
    browser = await webkit.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/geometry.js`);
    await page.evaluate(async weapons => {
      const { SiegeFX } = await import('/siege-fx.js');
      window.fx = new SiegeFX(); fx.setWeapons(weapons);
      if (!await fx.plasma.ready) throw Error('Original material masks failed to load');
      document.body.innerHTML = '<style>body{margin:0;background:#111821;color:white;font:16px system-ui}h2{margin:10px}canvas{display:block;width:100%;}</style>';
    }, BY_ID);
    const results = [];
    for (const shot of shots) {
      results.push(await page.evaluate(shot => {
        fx.clear();
        const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720;
        const c = canvas.getContext('2d'), visible = new Set(['score','blast','muzzle','split','bounce','dirt','warp','spark','land','beam','coat','stuck','jump']);
        let accepted = 0, materials = 0, peakSources = 0, effectPixels = 0, cursor = 0, last = 0, best = null, bestTerrain = shot.finalTerrain;
        const missingMaterials = new Set();
        const terrainAt = (terrain, x) => terrain[Math.max(0, Math.min(terrain.length - 1, Math.round(x / 2)))];
        const accept = event => {
          if (!visible.has(event.kind)) return;
          if (!fx.emit(event)) throw Error(`${shot.weapon}: renderer rejected ${event.kind}`);
          accepted++;
          if (event.materialName) {
            const source = fx.plasma.sources[fx.plasma.sources.length - 1];
            if (!source || source.profile.name.toLowerCase() !== event.materialName.toLowerCase()) missingMaterials.add(event.materialName);
            materials++;
          }
          peakSources = Math.max(peakSources, fx.plasma.sources.length);
          if (fx.items.length > 360 || fx.plasma.sources.length > 320) throw Error(`${shot.weapon}: exceeded render budget`);
          if (fx.items.some(p => !Number.isFinite(p.x + p.y + p.vx + p.vy)) || fx.plasma.sources.some(p => !Number.isFinite(p.x + p.y + p.vx + p.vy))) throw Error(`${shot.weapon}: non-finite particle`);
        };
        const draw = (terrain, dt, capture) => {
          c.clearRect(0, 0, 1280, 720); fx.draw(c, dt); fx.plasma.draw(c, dt, x => terrainAt(terrain, x));
          if (fx.items.some(p => !Number.isFinite(p.x + p.y + p.vx + p.vy)) || fx.plasma.sources.some(p => !Number.isFinite(p.x + p.y + p.vx + p.vy))) throw Error(`${shot.weapon}: non-finite particle after visual integration`);
          if (capture) {
            const pixels = c.getImageData(0,0,1280,720).data; let count = 0;
            for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 8) count++;
            if (count > effectPixels) { effectPixels = count; best = c.getImageData(0,0,1280,720); bestTerrain = terrain; }
          }
        };
        if (shot.frames.length) {
          for (const frame of shot.frames) {
            while (cursor < shot.events.length && shot.events[cursor].t <= frame.t + 1e-8) accept(shot.events[cursor++]);
            draw(frame.terrain, Math.min(.05, frame.t - last), materials > 0 || shot.commandTypes.includes('DIRTBALL') || shot.commandTypes.includes('MAGICWALL')); last = frame.t;
          }
        } else {
          // All events are accepted chronologically. Short visual stepping is
          // deliberate for the 318 non-focus cases; focus cases use real 30Hz.
          for (const event of shot.events) { accept(event); if (event.t - last >= .25) { draw(shot.finalTerrain, 1/30, false); last = event.t; } }
          cursor = shot.events.length;
        }
        while (cursor < shot.events.length) accept(shot.events[cursor++]);
        for (let i = 0; i < 3; i++) draw(shot.finalTerrain, 1/30, false);
        if (shot.frames.length) {
          c.fillStyle = '#111821'; c.fillRect(0,0,1280,720); c.beginPath(); c.moveTo(0,720);
          bestTerrain.forEach((y,i) => c.lineTo(i*2,y)); c.lineTo(1280,720); c.closePath(); c.fillStyle='#55793c'; c.fill();
          if (best) { const layer=document.createElement('canvas');layer.width=1280;layer.height=720;layer.getContext('2d').putImageData(best,0,0);c.drawImage(layer,0,0); }
          const title = document.createElement('h2');title.textContent=`${shot.name}: real simulation (${materials} authored materials)`;
          document.body.append(title,canvas);
        }
        return { weapon: shot.weapon, accepted, materialEvents: materials, peakSources, effectPixels, events: shot.events.length, commandTypes: shot.commandTypes, limits: shot.limits, settled: shot.settled, missingMaterials: [...missingMaterials], time: shot.time };
      }, shot));
      if (results.length % 50 === 0) console.log(`Replayed ${results.length}/${shots.length} real weapon shots`);
    }
    assert.equal(results.length, 321); assert(results.every(r => r.accepted > 0)); assert.deepEqual(errors, []);
    const burn = results.find(r => r.weapon === 'burn_barrel');
    assert(burn.materialEvents > 0 && burn.commandTypes.includes('FIRE') && burn.effectPixels > 0, 'Burn Barrel must execute and visibly render authored fire');
    for (const id of ['mud_pie','magic_forest']) {
      const shot=shots.find(s=>s.weapon===id), result=results.find(r=>r.weapon===id);
      assert(shot.finalTerrain.some((y,i)=>y<shot.initialTerrain[i]-1), `${id}: terrain did not grow`);
      assert(result.effectPixels>0, `${id}: no visible rendered effect`);
    }
    await page.screenshot({ path: '/private/tmp/pocket-runtime-effects.png', fullPage: true });
    fs.writeFileSync('/private/tmp/pocket-runtime-browser-report.json', JSON.stringify(results,null,2));
    console.log(JSON.stringify({ weapons: results.length, events: results.reduce((n,r)=>n+r.events,0), authoredMaterials: results.reduce((n,r)=>n+r.materialEvents,0), focused: results.filter(r=>KEY.has(r.weapon)), screenshot:'/private/tmp/pocket-runtime-effects.png', report:'/private/tmp/pocket-runtime-browser-report.json' },null,2));
    assert.deepEqual(results.filter(r=>r.missingMaterials.length).map(r=>({weapon:r.weapon, names:r.missingMaterials})), [], 'all emitted materials must resolve to actual rendered profiles');
    assert.deepEqual(results.filter(r=>!r.settled).map(r=>r.weapon), [], 'all real shots must finish');
  } finally { await browser?.close(); server.close(); }
}
main().catch(error => { console.error(error); process.exitCode=1; });
