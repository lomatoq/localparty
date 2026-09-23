'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanBorderComponents } = require('../scripts/pocket-icon-cleanup.cjs');
function fixture() {
  const data = Buffer.alloc(100 * 100 * 4);
  const rect = (x, y, w, h) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) data[(yy * 100 + xx) * 4 + 3] = 255; };
  return { data, rect, alpha: (x, y) => data[(y * 100 + x) * 4 + 3] };
}
test('removes small border fragments without removing detached interior artwork', () => {
  const f = fixture(); f.rect(20, 20, 60, 60); f.rect(0, 0, 5, 3); f.rect(95, 97, 5, 3); f.rect(5, 40, 4, 4);
  const result = cleanBorderComponents(f.data, 100, 100);
  assert.equal(result.removedPixels, 30); assert.equal(f.alpha(0, 0), 0); assert.equal(f.alpha(5, 40), 255); assert.equal(f.alpha(40, 40), 255);
});
test('preserves large boundary-clipped art and connected thin appendages', () => {
  const f = fixture(); f.rect(0, 10, 50, 80); f.rect(75, 0, 25, 35); f.rect(50, 40, 50, 1);
  const result = cleanBorderComponents(f.data, 100, 100);
  assert.equal(result.removedPixels, 0); assert.equal(result.protectedEdgeComponents, 2); assert.equal(f.alpha(99, 40), 255);
});
test('cleanup is idempotent and handles empty tiles', () => {
  const f = fixture(); assert.equal(cleanBorderComponents(f.data, 100, 100).removedPixels, 0);
  f.rect(20, 20, 60, 60); f.rect(0, 0, 4, 4); cleanBorderComponents(f.data, 100, 100);
  const prior = Buffer.from(f.data); assert.equal(cleanBorderComponents(f.data, 100, 100).removedPixels, 0); assert.deepEqual(prior, f.data);
});
test('all 321 packed weapon icons are nonempty and stay inside their padded cells', async () => {
  const sharp = require('sharp'), path = require('node:path');
  const directory = path.resolve(__dirname, '../games/arcade_deluxe/public/assets/weapons');
  const manifest = require(path.join(directory, 'pocket-atlas-v1.json'));
  assert.equal(manifest.weapons.length, 321);
  for (const file of new Set(manifest.weapons.map(w => w.atlas))) {
    const { data, info } = await sharp(path.join(directory, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const weapon of manifest.weapons.filter(w => w.atlas === file)) {
      let visible = 0;
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        if (data[((weapon.row * 128 + y) * info.width + weapon.column * 128 + x) * 4 + 3] <= 8) continue;
        visible++;
        assert(x >= 20 && x < 108 && y >= 20 && y < 108, `${weapon.id}: visible pixel outside padding`);
      }
      assert(visible > 0, `${weapon.id}: empty icon`);
    }
  }
});
