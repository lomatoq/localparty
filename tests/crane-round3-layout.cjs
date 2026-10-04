'use strict';
// Validate measurements from real browser play, not reconstructed DOM fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve('.localparty-build/design-round2/gameplay');
const read = folder => JSON.parse(fs.readFileSync(path.join(base, folder, 'report.json')));
const checks = [];
function verify(label, fn) { fn(); checks.push(label); }
for (const folder of ['crane-accepted4-720', 'crane-accepted4-1080', 'crane-accepted-max720', 'crane-accepted-max1080']) {
  const report = read(folder), game = report.games[0], tv = game.tv;
  verify(folder + ': equal outer panel bounds and bounded rows', () => {
    assert.deepEqual(report.errors, []); assert.deepEqual(report.changedFiles, []);
    const stage = tv.gameGeometry['.host-shell>.stage'], aside = tv.gameGeometry['.host-shell>aside'];
    assert(Math.abs(stage.y - aside.y) < 1); assert(Math.abs(stage.bottom - aside.bottom) < 1);
    assert(stage.bottom <= tv.height + 1); assert(aside.right <= tv.width + 1);
    for (const {card, rank, name, points} of tv.craneRows) {
      assert(rank.x >= card.x + 8); assert(points.right <= card.right - 8);
      assert(rank.right <= name.x); assert(name.right <= points.x);
      assert(parseFloat(name.font) >= 16); assert.match(name.fontFamily, /KardiaFit/);
      assert(parseFloat(points.font) >= 28); assert.match(points.fontFamily, /KardiaFatRunner/);
      assert(card.scrollWidth <= card.clientWidth + 1);
    }
    assert.equal(tv.craneRows.length, folder.includes('max') ? 16 : 4);
    if (game.tvRosterEnd) {
      const end = game.tvRosterEnd, last = end.craneRows.at(-1).card, list = end.gameGeometry['#players'];
      assert(last.y >= list.y); assert(last.bottom <= list.bottom + 1, 'last full row reachable by real scrolling');
    } else {
      const last = tv.craneRows.at(-1).card, list = tv.gameGeometry['#players'];
      assert(last.bottom <= list.bottom + 1, 'normal roster fits without clipping');
    }
  });
  for (const key of ['phone320', 'phone393']) verify(folder + ': ' + key + ' controls fit', () => {
    const p = game[key]; assert.deepEqual(p.offscreenControls, []);
    for (const c of p.controls.filter(c => ['left', 'right', 'drop'].includes(c.id))) {
      assert(c.w >= 44 && c.h >= 44); assert(c.bottom <= p.height); assert(c.x >= 0 && c.x + c.w <= p.width);
    }
  });
}
for (const folder of ['crane-accepted720', 'crane-accepted1080']) {
  const report = read(folder);
  verify(folder + ': eighteen actual landings, sustained wind and real edge miss', () => {
    assert.deepEqual(report.errors, []); assert.deepEqual(report.changedFiles, []);
    assert.equal(report.placements.length, 18); assert.equal(report.final.height, 18); assert.equal(report.final.lives, 2);
    assert(report.captures.some(c => c.name === 'edge-fall' && c.state.falling));
    const late = report.samples.filter(s => s.height === 0 && s.at >= 20000 && s.at <= 30000);
    assert(late.length > 20); assert(Math.max(...late.map(s => s.hookX)) - Math.min(...late.map(s => s.hookX)) > 40);
    const tower = report.samples.filter(s => s.height === 18);
    assert(tower.length > 40);
    assert(Math.max(...tower.map(s => s.blocks.at(-1).x)) - Math.min(...tower.map(s => s.blocks.at(-1).x)) > 50);
    for (const s of report.samples) {
      const p = s.presentation; if (!p) continue;
      assert(p.rigScreenTop >= p.safeTop - 1, 'rig stays below measured HUD');
      assert(Math.abs(p.rig.ropeLength - 150) < 1, 'interpolated visual cable stays joined to physical bridle');
      if (s.hookAttachmentX != null) assert(Math.abs(Math.hypot(s.hookAttachmentX - s.trolley, s.hookAttachmentY - (s.beamY + 12)) - 150) < .001);
    }
  });
  if (report.pause) verify(folder + ': pause freezes physics and reload preserves identity', () => {
    for (const key of ['hookX', 'hookY', 'hookAngle', 'trolley', 'turnId', 'deadline']) assert.equal(report.pause.before[key], report.pause.after[key]);
    assert.equal(report.reconnect.turnId, report.pause.before.turnId); assert.equal(report.reconnect.connected, true);
    assert(report.pause.before.players.some(p => p.id === report.reconnect.id));
  });
}
fs.writeFileSync(path.join(base, 'crane-layout-validation.json'), JSON.stringify({generatedAt:new Date().toISOString(), passed:checks.length, checks}, null, 2));
console.log('PASS ' + checks.length + ' real-capture Crane assertions');
