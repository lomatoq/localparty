'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const reference = require('../games/arcade_deluxe/core/pocket-reference.generated.json');
const materials = require('../games/arcade_deluxe/public/assets/pocket-materials.json');
test('every authored FIRE, FOG and SUPERBALL has its named renderer profile and original masks', () => {
  let checked = 0;
  for (const weapon of reference.weapons) for (const node of weapon.chain) {
    if (!['FIRE','FOG','SUPERBALL'].includes(node.type)) continue;
    const profile = materials.weapons[weapon.id]?.find(p => p.name.toLowerCase() === node.name.toLowerCase());
    assert(profile, `${weapon.id}: missing ${node.type} ${node.name}`);
    assert(profile.frames.length > 0, `${weapon.id}/${node.name}: empty animation`);
    assert(profile.life > 0 && Number.isFinite(profile.life), `${weapon.id}/${node.name}: invalid lifetime`);
    for (const name of profile.frames) {
      const frame = materials.frames[name]; assert(frame, `missing mask ${name}`);
      assert.equal(frame.pixels.length, frame.w * frame.h);
      // Some original utility masks (e.g. bouncytunnel.bmp) are deliberately
      // transparent. Preserve them instead of inventing visible artwork.
      assert(frame.pixels.every(p => Number.isInteger(p) && p >= 0 && p <= 255));
    }
    checked++;
  }
  assert(checked >= 67);
});
