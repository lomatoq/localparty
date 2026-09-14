'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'public', 'game-feel.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'public', 'game-feel.css'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

test('game-feel exposes the documented bounded event contract', () => {
  for (const type of ['hit', 'shot', 'collision', 'explosion', 'elimination', 'out-of-bounds', 'danger', 'score', 'round-result']) assert.match(js, new RegExp(`['"]${type}['"]`));
  assert.match(js, /Math\.round\(clamp\(4 \+ intensity \* 7, 4, 11\)\)/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(css, /pointer-events:none/);
});

test('game-feel is injected separately from motion and has reduced-motion CSS', () => {
  assert.match(server, /<script src="\/game-feel\.js"><\/script>/);
  assert.match(server, /<link rel="stylesheet" href="\/game-feel\.css">/);
  assert.match(css, /position:fixed;inset:0/);
  assert.match(css, /contain:strict/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(js, /motion\.js|#qrDock/);
});
