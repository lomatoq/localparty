'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { cleanBorderComponents } = require('./pocket-icon-cleanup.cjs');

const ROOT = path.resolve(__dirname, '..');
const REFERENCE = require(path.join(ROOT, 'games/arcade_deluxe/core/pocket-reference.generated.json'));
const PUBLIC_DIR = path.join(ROOT, 'games/arcade_deluxe/public/assets/weapons');
const ART_DIR = path.join(ROOT, 'docs/gameplay-art/pocket-generated-v1');
const CELL = 128;
const COLUMNS = 6;
const PER_SHEET = 36;
const ICON_BOX = 88;

function alphaBounds(data, width, height) {
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= 8) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return right < left ? null : { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function packSheet(source, sheetIndex, count) {
  const image = sharp(source).ensureAlpha();
  const metadata = await image.metadata();
  assert.equal(metadata.width, metadata.height, `${source} must be square`);
  assert.equal(metadata.width % COLUMNS, 0, `${source} must divide into six columns`);
  const sourceCell = metadata.width / COLUMNS;
  const composites = [];
  const hashes = [];
  const cleanup = [];

  for (let cell = 0; cell < count; cell += 1) {
    const column = cell % COLUMNS;
    const row = Math.floor(cell / COLUMNS);
    const extracted = await sharp(source)
      .ensureAlpha()
      .extract({ left: column * sourceCell, top: row * sourceCell, width: sourceCell, height: sourceCell })
      .raw()
      .toBuffer({ resolveWithObject: true });
    cleanup.push({ id: REFERENCE.weapons[sheetIndex * PER_SHEET + cell].id,
      ...cleanBorderComponents(extracted.data, extracted.info.width, extracted.info.height) });
    const bounds = alphaBounds(extracted.data, extracted.info.width, extracted.info.height);
    assert(bounds, `Empty generated icon at sheet ${sheetIndex + 1}, cell ${cell + 1}`);
    const sprite = await sharp(extracted.data, { raw: extracted.info })
      .extract(bounds)
      .resize(ICON_BOX, ICON_BOX, { fit: 'contain', withoutEnlargement: false, background: '#00000000' })
      .png()
      .toBuffer();
    hashes.push(crypto.createHash('sha256').update(sprite).digest('hex'));
    composites.push({
      input: sprite,
      left: column * CELL + (CELL - ICON_BOX) / 2,
      top: row * CELL + (CELL - ICON_BOX) / 2,
    });
  }

  const atlas = sharp({
    create: { width: COLUMNS * CELL, height: COLUMNS * CELL, channels: 4, background: '#00000000' },
  }).composite(composites);
  const number = String(sheetIndex + 1).padStart(2, '0');
  const publicFile = path.join(PUBLIC_DIR, `pocket-atlas-v1-${number}.webp`);
  const artFile = path.join(ART_DIR, `pocket-atlas-v1-${number}.png`);
  await atlas.clone().webp({ quality: 90, alphaQuality: 100, smartSubsample: true }).toFile(publicFile);
  await atlas.clone().png({ compressionLevel: 9 }).toFile(artFile);
  return { publicFile, artFile, hashes, cleanup };
}

async function main() {
  const sources = process.argv.slice(2).map(file => path.resolve(file));
  assert.equal(sources.length, 9, 'Pass exactly nine generated 6x6 atlas PNG files');
  assert.equal(REFERENCE.weapons.length, 321, 'Expected the complete 321-weapon reference');
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(ART_DIR, { recursive: true });

  const manifest = [];
  const hashes = [];
  const cleanup = [];
  for (let sheet = 0; sheet < sources.length; sheet += 1) {
    const count = Math.min(PER_SHEET, REFERENCE.weapons.length - sheet * PER_SHEET);
    const result = await packSheet(sources[sheet], sheet, count);
    hashes.push(...result.hashes);
    cleanup.push(...result.cleanup);
    for (let cell = 0; cell < count; cell += 1) {
      const weapon = REFERENCE.weapons[sheet * PER_SHEET + cell];
      manifest.push({
        index: weapon.index,
        id: weapon.id,
        name: weapon.name,
        sourceIcon: String(weapon.icon || '').replaceAll('\\', '/'),
        atlas: `pocket-atlas-v1-${String(sheet + 1).padStart(2, '0')}.webp`,
        sheet: sheet + 1,
        cell: cell + 1,
        column: cell % COLUMNS,
        row: Math.floor(cell / COLUMNS),
        grid: `${COLUMNS}x${COLUMNS}`,
        cellPixels: CELL,
        transparentPaddingPixels: (CELL - ICON_BOX) / 2,
      });
    }
  }

  assert.equal(manifest.length, 321);
  assert.equal(new Set(manifest.map(item => item.index)).size, 321, 'Duplicate weapon indices');
  assert.equal(new Set(manifest.map(item => item.id)).size, 321, 'Duplicate weapon ids');
  const exactDuplicates = hashes
    .map((hash, index) => ({ hash, index: index + 1 }))
    .filter((item, index, list) => list.findIndex(candidate => candidate.hash === item.hash) !== index);
  assert.equal(exactDuplicates.length, 0, `Generated atlas contains exact duplicate sprites: ${JSON.stringify(exactDuplicates)}`);

  const payload = {
    version: 1,
    count: manifest.length,
    sheets: 9,
    columns: COLUMNS,
    rows: COLUMNS,
    cellPixels: CELL,
    iconBoxPixels: ICON_BOX,
    weapons: manifest,
  };
  const publicManifest = path.join(PUBLIC_DIR, 'pocket-atlas-v1.json');
  const artManifest = path.join(ART_DIR, 'manifest.json');
  fs.writeFileSync(publicManifest, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(artManifest, `${JSON.stringify({ ...payload, generatedSources: sources }, null, 2)}\n`);
  fs.writeFileSync(path.join(ART_DIR, 'border-cleanup-report.json'), `${JSON.stringify({
    weapons: cleanup.length,
    changedIcons: cleanup.filter(c => c.removedPixels > 0).length,
    removedPixels: cleanup.reduce((sum, c) => sum + c.removedPixels, 0),
    protectedEdgeComponents: cleanup.reduce((sum, c) => sum + c.protectedEdgeComponents, 0),
    thresholds: { alpha: 8, edgeFraction: .012, maxTileArea: .045, maxMainComponentArea: .18 },
    icons: cleanup,
  }, null, 2)}\n`);
  console.log(JSON.stringify({ weapons: manifest.length, sheets: 9, exactDuplicates: 0, publicManifest, artManifest }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
