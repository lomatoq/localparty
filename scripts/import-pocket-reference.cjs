'use strict';

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { readDirectory, summarize } = require('./analyze-pocket-reference.cjs');

const ROOT = path.resolve(__dirname, '..');
const GENERATED = path.join(ROOT, 'games/arcade_deluxe/core/pocket-reference.generated.json');
const REFERENCE_DIR = path.join(ROOT, 'docs/gameplay-art/pocket-reference');

function slugify(name) {
  return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseAttributes(source) {
  return Object.fromEntries([...source.matchAll(/([A-Za-z][A-Za-z0-9_]*)="([^"]*)"/g)].map(match => {
    const value = match[2];
    if (/^(TRUE|FALSE)$/i.test(value)) return [match[1], /^TRUE$/i.test(value)];
    if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) return [match[1], Number(value)];
    return [match[1], value];
  }));
}

function parseEmitters(text) {
  const emitters = {};
  for (const match of text.matchAll(/<EMITTER\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/EMITTER>/gi)) {
    emitters[match[1]] = [...match[2].matchAll(/<NODE\s+([\s\S]*?)\/>/gi)]
      .map(node => parseAttributes(node[1]));
  }
  return emitters;
}

function familyFor(weapon) {
  const types = new Set(weapon.chain.map(item => item.type));
  const name = weapon.name.toLowerCase();
  const bulletFanout = block => {
    if (block.type !== 'TRIGGER') return 0;
    const commands = Array.isArray(block.values.COMMAND) ? block.values.COMMAND : [block.values.COMMAND];
    const commandTypes = Array.isArray(block.values.TYPE) ? block.values.TYPE : [block.values.TYPE];
    return commands.filter((_, index) => (commandTypes[index] || commandTypes[0]) === 'BULLET').length;
  };
  const rootFanout = bulletFanout(weapon.chain[0] || {});
  const nestedFanout = Math.max(0, ...weapon.chain.slice(1).map(bulletFanout));
  if (types.has('MAGICWALL') || types.has('DIRTBALL') || types.has('DIRTSLINGER')) return 'dirt';
  if (types.has('DIRTMOVER')) return 'drill';
  if (types.has('JUMPJETS')) return 'jump';
  if (types.has('CRUISER') || types.has('SUPERBALL')) return 'roller';
  if (types.has('LIGHTNING')) return 'lightning';
  if (types.has('ZAPPER')) return 'rail';
  if (types.has('FIRE') || types.has('FOG')) return /ice|snow|freeze|frost|nitrogen|avalanche/.test(name) ? 'freeze' : 'fire';
  if (rootFanout > 1) return 'spread';
  if (nestedFanout > 1) return 'cluster';
  const bullets = weapon.chain.filter(item => item.type === 'BULLET');
  if (bullets.some(item => item.values.HOMING_FLAG === true)) return 'seeker';
  if (bullets.some(item => Number(item.values.BOUNCE_COUNT) > 0)) return 'bounce';
  const explosions = weapon.chain.filter(item => item.type === 'EXPLOSION');
  const bulletCount = weapon.chain.filter(item => item.type === 'BULLET').length;
  if (bulletCount > 8) return 'cluster';
  if (explosions.length > 4) return 'chain';
  return 'shell';
}

function bitmapRaw(filename) {
  const input = fs.readFileSync(filename);
  const offset = input.readUInt32LE(10);
  const width = input.readInt32LE(18);
  const signedHeight = input.readInt32LE(22);
  const height = Math.abs(signedHeight);
  const bits = input.readUInt16LE(28);
  if (width <= 0 || height <= 0 || bits !== 24) throw new Error(`Unsupported BMP: ${filename}`);
  const stride = Math.ceil(width * 3 / 4) * 4;
  const output = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const sourceY = signedHeight > 0 ? height - 1 - y : y;
    for (let x = 0; x < width; x += 1) {
      const source = offset + sourceY * stride + x * 3;
      const target = (y * width + x) * 4;
      output[target] = input[source + 2];
      output[target + 1] = input[source + 1];
      output[target + 2] = input[source];
      output[target + 3] = 255;
    }
  }
  return { data: output, width, height };
}

async function referenceSheets(weapons, installRoot, fileIndex) {
  fs.mkdirSync(REFERENCE_DIR, { recursive: true });
  const cell = 128;
  const columns = 6;
  const perSheet = 36;
  const sheets = [];
  for (let start = 0; start < weapons.length; start += perSheet) {
    const items = weapons.slice(start, start + perSheet);
    const rows = Math.ceil(items.length / columns);
    const base = sharp({ create: { width: columns * cell, height: rows * cell, channels: 4, background: '#100d1f' } });
    const composites = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const iconKey = String(item.icon || '').replace(/\\/g, '/').toLowerCase();
      const icon = fileIndex.get(iconKey) || fileIndex.get(path.basename(iconKey));
      if (!icon) continue;
      const raw = bitmapRaw(path.join(installRoot, 'weapdata', icon));
      const png = await sharp(raw.data, { raw: { width: raw.width, height: raw.height, channels: 4 } })
        .resize(88, 88, { kernel: 'nearest' }).png().toBuffer();
      const x = index % columns * cell;
      const y = Math.floor(index / columns) * cell;
      composites.push({
        input: Buffer.from(`<svg width="${cell}" height="${cell}"><rect x="5" y="5" width="118" height="118" rx="18" fill="#1c1830" stroke="#65518d" stroke-width="2"/></svg>`),
        left: x, top: y,
      });
      composites.push({ input: png, left: x + 20, top: y + 20 });
    }
    const number = String(sheets.length + 1).padStart(2, '0');
    const filename = path.join(REFERENCE_DIR, `pocket-icons-reference-${number}.png`);
    await base.composite(composites).png().toFile(filename);
    sheets.push({ file: path.relative(ROOT, filename), start, count: items.length, names: items.map(item => item.name) });
  }
  fs.writeFileSync(path.join(REFERENCE_DIR, 'manifest.json'), `${JSON.stringify({ cell, columns, sheets }, null, 2)}\n`);
  return sheets;
}

async function completePackageIconSheets(iconPaths, installRoot, weapons) {
  const outputDirectory = path.join(REFERENCE_DIR, 'all-package-icons');
  fs.mkdirSync(outputDirectory, { recursive: true });
  const normalize = value => String(value || '').replace(/\\/g, '/').toLowerCase();
  const referenced = new Set(weapons.map(weapon => normalize(weapon.icon)));
  const cell = 128;
  const columns = 6;
  const perSheet = 36;
  const sheets = [];
  const icons = [];
  for (let start = 0; start < iconPaths.length; start += perSheet) {
    const items = iconPaths.slice(start, start + perSheet);
    const base = sharp({ create: { width: columns * cell, height: columns * cell, channels: 4, background: '#100d1f' } });
    const composites = [];
    for (let index = 0; index < items.length; index += 1) {
      const relative = items[index];
      const source = path.join(installRoot, 'weapdata', relative);
      const raw = bitmapRaw(source);
      const png = await sharp(raw.data, { raw: { width: raw.width, height: raw.height, channels: 4 } })
        .resize(88, 88, { kernel: 'nearest', fit: 'contain', background: '#00000000' })
        .png()
        .toBuffer();
      const column = index % columns;
      const row = Math.floor(index / columns);
      composites.push({ input: png, left: column * cell + 20, top: row * cell + 20 });
      icons.push({
        index: start + index + 1,
        source: relative,
        package: relative.includes('/') ? relative.split('/')[0] : 'base',
        referencedByWeapon: referenced.has(normalize(relative)),
        sheet: sheets.length + 1,
        cell: index + 1,
        column,
        row,
        sha256: require('node:crypto').createHash('sha256').update(fs.readFileSync(source)).digest('hex'),
      });
    }
    const number = String(sheets.length + 1).padStart(2, '0');
    const filename = path.join(outputDirectory, `pocket-package-icons-${number}.png`);
    await base.composite(composites).png({ compressionLevel: 9 }).toFile(filename);
    sheets.push({ file: path.relative(ROOT, filename), start: start + 1, count: items.length });
  }
  const manifest = {
    count: icons.length,
    referencedByWeapons: icons.filter(icon => icon.referencedByWeapon).length,
    unreferenced: icons.filter(icon => !icon.referencedByWeapon).map(icon => icon.source),
    columns,
    rows: columns,
    cell,
    sheets,
    icons,
  };
  fs.writeFileSync(path.join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

async function main() {
  const [decodedDirectory, installRoot] = process.argv.slice(2).map(value => value && path.resolve(value));
  if (!decodedDirectory || !installRoot) {
    console.error('Usage: node scripts/import-pocket-reference.cjs <decoded-directory> <Pocket Tanks Deluxe directory>');
    process.exitCode = 1;
    return;
  }
  const files = fs.readdirSync(path.join(installRoot, 'weapdata'), { recursive: true, withFileTypes: true });
  const fileIndex = new Map();
  const allIconPaths = [];
  for (const entry of files) {
    if (!entry.isFile() || !/^ico_.*\.bmp$/i.test(entry.name)) continue;
    const parent = path.relative(path.join(installRoot, 'weapdata'), entry.parentPath || entry.path);
    const relative = path.join(parent, entry.name).replace(/\\/g, '/');
    allIconPaths.push(relative);
    fileIndex.set(relative.toLowerCase(), relative);
    if (!fileIndex.has(entry.name.toLowerCase())) fileIndex.set(entry.name.toLowerCase(), relative);
  }
  const usedIds = new Map();
  const weapons = summarize(readDirectory(decodedDirectory)).map((weapon, index) => {
    const baseId = weapon.name === 'Single Shot' ? 'pebble' : slugify(weapon.name);
    const occurrence = (usedIds.get(baseId) || 0) + 1;
    usedIds.set(baseId, occurrence);
    return {
      id: occurrence === 1 ? baseId : `${baseId}_${occurrence}`,
      index: index + 1,
      family: familyFor(weapon),
      ...weapon,
    };
  });
  const emitters = {};
  for (const file of fs.readdirSync(decodedDirectory).filter(file => /^emitter.*\.decoded$/i.test(file)).sort()) {
    Object.assign(emitters, parseEmitters(fs.readFileSync(path.join(decodedDirectory, file), 'utf8')));
  }
  fs.writeFileSync(GENERATED, `${JSON.stringify({ version: 1, weapons, emitters }, null, 2)}\n`);
  const sheets = await referenceSheets(weapons, installRoot, fileIndex);
  const packageIcons = await completePackageIconSheets(
    allIconPaths.sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })),
    installRoot,
    weapons,
  );
  console.log(JSON.stringify({ weapons: weapons.length, emitters: Object.keys(emitters).length, sheets: sheets.length, packageIcons: packageIcons.count, generated: path.relative(ROOT, GENERATED) }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
