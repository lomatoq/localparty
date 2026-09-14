'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const library = require('../lib/prototype-library.cjs');

const root = path.join(__dirname, '..');

test('prototype library paths and manifest members are valid', () => {
  const result = spawnSync(process.execPath, ['scripts/check-prototype-library.cjs'], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Prototype library OK/);
});

test('generated inventory covers every current game and public asset file', () => {
  const result = spawnSync(process.execPath, ['scripts/build-prototype-library-inventory.cjs', '--check'], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /inventory is current/i);
});

test('prototype search respects projection and category', () => {
  const results = library.findAssets({ category: 'effects', projection: '2d-top-down' });
  assert.deepEqual(results.map(item => item.id), ['sports-siege-swarm-explosion']);
});

test('top-down turret collection explicitly rejects side views', () => {
  const catalog = library.loadCatalog();
  const turrets = catalog.collections.find(item => item.id === 'sports-siege-topdown-turrets');
  assert.ok(turrets);
  assert.equal(turrets.projection, '2d-top-down');
  assert.match(turrets.camera, /strict top-down/i);
  assert.ok(turrets.avoidFor.some(rule => /side-view|three-quarter/i.test(rule)));
});

test('mobile policy keeps heavyweight scene art host-only', () => {
  const catalog = library.loadCatalog();
  const heavy = catalog.collections.filter(item => /host-only/.test(item.mobileBundle));
  assert.ok(heavy.length >= 5);
  assert.ok(heavy.every(item => !/controller allowed/i.test(item.mobileBundle)));
});
