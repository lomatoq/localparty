const fs = require('fs');
const path = require('path');
let sharp;
try { sharp = require('sharp'); } catch { sharp = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')); }

async function main() {
  const base = 'public/assets/games/premium-v2';
  const out = `${base}/atlases`;
  const ids = JSON.parse(fs.readFileSync('docs/gameplay-art/premium-menu-v2.json')).items.map(x => x[0]);
  if (ids.length !== 20) throw new Error('Expected exactly 20 catalog icons');
  const size = 1254, padding = 32, extent = size * 2 + padding * 3;
  const missing = ids.filter(id => !fs.existsSync(`${base}/${id}.webp`));
  if (missing.length) throw new Error(`Missing icons: ${missing.join(', ')}`);
  fs.mkdirSync(out, { recursive: true });
  const manifest = { version: 1, format: 'lossless-webp', padding, tileSize: size, atlases: [], frames: {} };
  const checks = [];
  for (const id of ids) {
    const { data, info } = await sharp(`${base}/${id}.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.width !== size || info.height !== size) throw new Error(`${id}: expected native ${size} square`);
    let borderPixels = 0, mattePixels = 0, opaque = 0, partial = 0;
    let left = size, top = size, right = -1, bottom = -1;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4, a = data[i + 3];
      if (!a) continue;
      if (a === 255) opaque++; else partial++;
      if (a > 16) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
      if (!x || !y || x === size - 1 || y === size - 1) borderPixels++;
      if (a > 200 && data[i] > 245 && data[i + 1] < 10 && data[i + 2] > 245) mattePixels++;
    }
    checks.push({ id, width: size, height: size, alphaBounds: { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }, borderPixels, mattePixels, opaque, partial });
    if (borderPixels || mattePixels || !opaque) throw new Error(`${id}: alpha QA failed ${JSON.stringify(checks.at(-1))}`);
  }
  for (let batch = 0; batch < 5; batch++) {
    const file = `menu-${batch + 1}.webp`, pixels = Buffer.alloc(extent * extent * 4);
    for (let slot = 0; slot < 4; slot++) {
      const id = ids[batch * 4 + slot];
      const x = padding + slot % 2 * (size + padding), y = padding + Math.floor(slot / 2) * (size + padding);
      const icon = await sharp(`${base}/${id}.webp`).ensureAlpha().raw().toBuffer();
      for (let row = 0; row < size; row++) icon.copy(pixels, ((y + row) * extent + x) * 4, row * size * 4, (row + 1) * size * 4);
      manifest.frames[id] = { atlas: file, frame: { x, y, w: size, h: size }, rotated: false, trimmed: false, sourceSize: { w: size, h: size } };
    }
    await sharp(pixels, { raw: { width: extent, height: extent, channels: 4 } }).webp({ lossless: true }).toFile(`${out}/${file}`);
    manifest.atlases.push({ file, width: extent, height: extent });
  }
  fs.writeFileSync(`${out}/frames.json`, JSON.stringify(manifest, null, 2));
  for (const id of ids) {
    const entry = manifest.frames[id], f = entry.frame;
    const original = await sharp(`${base}/${id}.webp`).ensureAlpha().raw().toBuffer();
    const packed = await sharp(`${out}/${entry.atlas}`).extract({ left: f.x, top: f.y, width: f.w, height: f.h }).ensureAlpha().raw().toBuffer();
    for (let i = 0; i < original.length; i += 4) {
      if (original[i + 3] !== packed[i + 3] || (original[i + 3] && (original[i] !== packed[i] || original[i + 1] !== packed[i + 1] || original[i + 2] !== packed[i + 2]))) throw new Error(`${id}: atlas roundtrip changed visible pixels`);
    }
    checks.find(x => x.id === id).atlasRoundtrip = 'exact-visible-rgba';
  }
  fs.writeFileSync(`${out}/alpha-qa.json`, JSON.stringify(checks, null, 2));
  for (let page = 0; page < 2; page++) {
    const composite = [];
    for (let slot = 0; slot < 10; slot++) {
      const id = ids[page * 10 + slot], x = slot % 2 * 640, y = Math.floor(slot / 2) * 345;
      for (const [index, color] of ['#101921', '#f5f1e8'].entries()) composite.push({ input: await sharp(`${base}/${id}.webp`).resize(320, 320).flatten({ background: color }).png().toBuffer(), left: x + index * 320, top: y });
      composite.push({ input: Buffer.from(`<svg width="640" height="25"><rect width="640" height="25" fill="white"/><text x="10" y="18" font-size="17">${id}: dark / light</text></svg>`), left: x, top: y + 320 });
    }
    await sharp({ create: { width: 1280, height: 1725, channels: 3, background: '#fff' } }).composite(composite).png().toFile(`tests/premium-all-contact-${page + 1}.png`);
  }
  console.log(JSON.stringify({ atlases: manifest.atlases, checked: checks.length, contact: ['tests/premium-all-contact-1.png', 'tests/premium-all-contact-2.png'] }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
