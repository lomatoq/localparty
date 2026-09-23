'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { WEAPONS, BY_ID } = require('../games/arcade_deluxe/core/weapons.cjs');
const { Tanks } = require('../games/arcade_deluxe/core/tanks.cjs');

const ROOT = path.resolve(__dirname, '..');
const modern = require('../games/arcade_deluxe/public/assets/weapons/pocket-atlas-v1.json');
const source = require('../docs/gameplay-art/pocket-reference/all-package-icons/manifest.json');

function game() {
  const instance = new Tanks();
  instance.add({ id: 'a', name: 'A', connected: true });
  instance.add({ id: 'b', name: 'B', connected: true });
  instance.start({ sandbox: true });
  return instance;
}

test('all package icons and all playable weapon icons are indexed', async () => {
  assert.equal(source.count, 322);
  assert.equal(source.referencedByWeapons, 320);
  assert.deepEqual(source.unreferenced.sort(), ['cy/ico_sinkhole.bmp', 'fl/ico_pedestal.bmp']);
  assert.equal(new Set(source.icons.map(icon => icon.source.toLowerCase())).size, 322);
  assert.equal(source.sheets.length, 9);
  assert.equal(modern.count, 321);
  assert.equal(modern.weapons.length, 321);
  assert.equal(new Set(modern.weapons.map(weapon => weapon.id)).size, 321);
  assert.equal(new Set(modern.weapons.map(weapon => weapon.index)).size, 321);
  for (let sheet = 1; sheet <= 9; sheet += 1) {
    const file = path.join(ROOT, 'games/arcade_deluxe/public/assets/weapons', `pocket-atlas-v1-${String(sheet).padStart(2, '0')}.webp`);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.width, 768);
    assert.equal(metadata.height, 768);
  }
});

test('complete authored effect graph stays compact and finite', () => {
  assert.equal(WEAPONS.length, 321);
  assert(Buffer.byteLength(JSON.stringify(WEAPONS)) < 400_000, 'controller/shared-screen weapon payload stays bounded');
  let stages = 0;
  for (const weapon of WEAPONS) {
    assert(weapon.fx.timeline.length <= 64, weapon.id);
    stages += weapon.fx.timeline.length;
    for (const stage of weapon.fx.timeline) {
      assert.equal(stage.length, 8, weapon.id);
      assert(stage.slice(1).every(Number.isFinite), weapon.id);
    }
    assert(Number.isFinite(weapon.fx.speedMin));
    assert(Number.isFinite(weapon.fx.speedMax));
    assert(weapon.fx.bullet?.method);
  }
  assert(stages > 3_500, 'decoded multi-stage effects were retained');
  assert(BY_ID.firecracker.fx.timeline.length > 30);
  assert(BY_ID.glue_gun.fx.timeline.length === 64);
});

test('surface craters do not collapse while underground cavities release thin layers', () => {
  const surface = game();
  surface.stage = 'flight';
  surface.flightStarted = surface.t;
  const surfaceY = surface.ground(640);
  const surfaceRevision = surface.soil.revision;
  surface.explode(640, surfaceY, BY_ID.pebble, 'a');
  assert(!surface.pending.some(event => event.kind === 'terrain-collapse'));
  const surfaceCuts = surface.pending.filter(event => event.kind === 'reference-terrain');
  assert.equal(surfaceCuts.length, 1);
  assert.equal(surfaceCuts[0].r, 22, 'use this explosion radius, not the aggregated weapon radius');
  assert.equal(surface.soil.revision, surfaceRevision, 'ERASE_DELAY expires before the terrain mask is applied');
  for (let index = 0; index < 8 && surface.soil.revision === surfaceRevision; index += 1) surface.step(1 / 240);
  assert(surface.soil.revision > surfaceRevision);
  const initialCutVolume=surface.soil.volume();
  for(let index=0;index<30;index++)surface.step(1/60);
  assert(surface.soil.volume()<initialCutVolume,'destruction progresses instead of applying the full crater immediately');
  assert.equal(surface.soil.active.size, 0, 'surface terrain never enters dirt-fall physics');

  const underground = game();
  underground.stage = 'flight';
  underground.flightStarted = underground.t;
  const undergroundY = underground.ground(640) + 100;
  underground.explode(640, undergroundY, BY_ID.pebble, 'a');
  assert(underground.pending.some(event => event.kind === 'reference-terrain'&&event.collapse));
  for (let index = 0; index < 80 && !underground.soil.active.size; index += 1) underground.step(1 / 60);
  const layers = underground.soil.columns[underground.soil.index(640)].filter(span => span.layered);
  assert(layers.length > 1);
  assert(layers.every(span => span.bottom - span.top <= 3.01));
});

test('damage events carry target-specific proportional haptic duration', () => {
  const instance = game();
  const target = instance.players.find(player => player.id === 'b');
  instance.award('a', target, 8);
  instance.award('a', target, 72);
  const hits = instance.events.filter(event => event.kind === 'hit');
  assert.equal(hits.length, 2);
  assert(hits.every(event => event.target === 'b' && event.damage > 0));
  assert(hits[1].durationMs > hits[0].durationMs);
  assert(hits[0].durationMs >= 12 && hits[1].durationMs <= 170);
});

test('walls are queued as progressive slices instead of appearing in one frame', () => {
  const instance = game();
  instance.stage = 'flight';
  instance.flightStarted = instance.t;
  const before = instance.soil.volume();
  const ground = instance.ground(610);
  instance.animateRect(600, ground - 200, 620, ground, true, 12);
  assert.equal(instance.soil.volume(), before);
  assert(instance.pending.filter(event => event.kind === 'terrain-rect').length > 10);
  instance.step(1 / 60);
  assert(instance.soil.volume() > before);
  assert(instance.pending.some(event => event.kind === 'terrain-rect'));
});
