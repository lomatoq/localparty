'use strict';
// Validate captured receiver geometry, including the physical build102 regression.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve('.localparty-build/design-round3/party-round-arena-tv');
const inputs = process.argv.slice(2);
const beforePath = inputs.shift() || path.join(base, 'native4k-before-2/report.json');
const afterPaths = inputs.length ? inputs : [
  'native4k-after-2', 'native4k-after-16', 'native4k-shrink-2', 'native4k-knives-ack-2',
].map(dir => path.join(base, dir, 'report.json'));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const captures = report => report.games.flatMap(game => game.captures.map(capture => ({ ...capture, game: game.id })));
function measured(capture) {
  const { geometry: g, outer: o } = capture;
  const p = g.projection;
  const scale = o.frame.height / g.frame.height;
  const expectedInset = Math.max(0, (o.notch.bottom - o.frame.top) / scale);
  const center = p.centerScreen.y * scale + o.frame.top;
  const targetCenter = (o.notch.bottom + o.height) / 2;
  const diameter = (p.circleScreen.bottom - p.circleScreen.top) * scale;
  return { scale, expectedInset, actualInset: parseFloat(g.inset), center, targetCenter,
    insetError: parseFloat(g.inset) - expectedInset, centerError: center - targetCenter,
    diameter, fraction: diameter / (o.height - o.notch.bottom) };
}
const before = read(beforePath);
const rejected = captures(before).find(c => c.outer.width === 3840);
assert(rejected, 'Build102 diagnostic must include its actual 3840px receiver viewport');
const old = measured(rejected);
assert.equal(old.scale, 2);
assert.equal(old.actualInset, 120);
assert.equal(old.expectedInset, 60);
assert.equal(old.insetError, 60);
assert.equal(old.centerError, 60);
assert(old.fraction < .90, 'Build102 must fail the intended 92–93% receiver height');
let checked = 0, fresh4K;
const bridgeHashes = new Set();
for (const file of afterPaths) {
  const report = read(file);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.sourceChanged, []);
  assert.deepEqual(report.sharedChanged, []);
  bridgeHashes.add(report.sharedStart['public/bridge.js']);
  for (const game of report.games) assert(!game.failure, `${file}: ${game.id}: ${game.failure}`);
  for (const capture of captures(report)) {
    const { geometry: g, outer: o } = capture, p = g.projection, m = measured(capture);
    assert(Math.abs(m.insetError) <= 1, `${capture.file}: receiver pixels leaked into iframe inset`);
    assert(Math.abs(m.centerError) <= 1, `${capture.file}: actual notch/TV midpoint differs`);
    assert(p.circleScreen.top * m.scale + o.frame.top >= o.notch.bottom - 1);
    assert(p.circleScreen.bottom * m.scale + o.frame.top <= o.height + 1);
    for (const box of [...p.playerBounds, ...p.nameBounds]) {
      assert(box.left >= 0 && box.right * m.scale <= o.width + 1, `${capture.file}: horizontal clipping`);
      assert(box.top * m.scale + o.frame.top >= o.notch.bottom - 1, `${capture.file}: top clipping`);
      assert(box.bottom * m.scale + o.frame.top <= o.height + 1, `${capture.file}: bottom clipping`);
    }
    if (['push', 'bomb'].includes(capture.game) && capture.file.endsWith('-playing.png')) {
      assert(Math.abs(m.fraction - .925) < 1e-6, `${capture.file}: ordinary rim is not 92.5%`);
    }
    if (capture.game === 'bomb' && o.width === 3840 && capture.file.endsWith('-playing.png')) fresh4K = m;
    checked++;
  }
}
assert.equal(bridgeHashes.size, 1, 'AFTER proofs must share one frozen bridge revision');
assert(!bridgeHashes.has(before.sharedStart['public/bridge.js']), 'AFTER must use the corrected source');
assert(fresh4K);
assert(fresh4K.diameter - old.diameter > 110, 'The raw receiver geometry must materially grow');
console.log(JSON.stringify({ result: 'PASS', checkedCaptures: checked, rejectedBuild102: old, corrected4K: fresh4K }, null, 2));
