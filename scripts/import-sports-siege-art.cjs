const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
// Source PNG atlases live in the packaging-excluded gameplay/sources tree.
const sourceDir = path.join(root, 'public', 'assets', 'gameplay', 'sources', 'sports-siege');
const outputDir = path.join(root, 'public', 'assets', 'gameplay', 'sports-siege');
const spriteDir = path.join(outputDir, 'sprites');
const atlasDir = path.join(outputDir, 'atlases');

const sheets = [
  {
    id: 'swarm-enemies', source: 'swarm-enemies-source.png', columns: 4, rows: 2,
    names: ['swarm-termite', 'swarm-runner', 'swarm-tank', 'swarm-boss'],
    pivot: [0.5, 0.5]
  },
  {
    id: 'swarm-turret', source: 'swarm-turret-rig-source.png', columns: 4, rows: 2,
    names: ['turret-base', 'turret-head-short', 'turret-head-long', 'turret-pulse', 'turret-shell', 'turret-bolt', 'turret-missile', 'turret-selection'],
    pivot: [0.5, 0.5]
  },
  {
    id: 'swarm-pedestals', source: 'swarm-pedestals-source.png', columns: 2, rows: 2,
    names: ['turret-pedestal-stone', 'turret-pedestal-blue', 'turret-pedestal-wood', 'turret-pedestal-damaged'],
    pivot: [0.5, 0.92]
  },
  {
    id: 'swarm-wall', source: 'swarm-wall-source.png', columns: 4, rows: 2,
    names: ['wall-straight', 'gate-closed', 'gate-damaged', 'gate-open', 'wall-tower-left', 'wall-tower-right', 'wall-damage', 'wall-repair'],
    pivot: [0.5, 0.9],
    // The generated lower row sits close to the row boundary. Keep it out of the fixed wall cells.
    bottomInsetByCell: [28, 28, 28, 28, 0, 0, 0, 0]
  },
  {
    id: 'swarm-explosion', source: 'swarm-explosion-8f-source.png', columns: 4, rows: 2,
    names: Array.from({length: 8}, (_, index) => `swarm-explosion-${index}`),
    pivot: [0.5, 0.5], preserveCell: true
  },
  {
    id: 'gallery-targets', source: 'gallery-targets-source.png', columns: 4, rows: 2,
    names: ['target-chicken', 'target-bug', 'target-beetle', 'target-boss', 'target-friendly', 'target-bonus', null, null],
    pivot: [0.5, 0.5]
  },
  {
    id: 'gallery-covers', source: 'gallery-covers-source.png', columns: 4, rows: 2,
    names: ['cover-wood', 'cover-wood-cracked', 'cover-stone', 'cover-metal', 'cover-wood-break-a', 'cover-wood-break-b', 'cover-rounded', null],
    pivot: [0.5, 0.5]
  },
  {
    id: 'gallery-shot-fx', source: 'gallery-shot-fx-source.png', columns: 4, rows: 2,
    names: ['shot-gold', 'shot-violet', 'muzzle-a', 'muzzle-b', 'hit-a', 'hit-b', 'miss-a', 'miss-b'],
    pivot: [0.5, 0.5], preserveCell: true
  },
  {
    id: 'gallery-death', source: 'gallery-death-8f-source.png', columns: 4, rows: 2,
    names: Array.from({length: 8}, (_, index) => `gallery-death-${index}`),
    pivot: [0.5, 0.5], preserveCell: true
  }
];

const clamp = value => Math.max(0, Math.min(1, value));

async function keyedPixels(input) {
  const pipeline = typeof input === 'string' ? sharp(input) : input.clone();
  const {data, info} = await pipeline.ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const samples = [
    [1, 1], [info.width - 2, 1], [1, info.height - 2], [info.width - 2, info.height - 2],
    [Math.floor(info.width / 2), 1], [Math.floor(info.width / 2), info.height - 2]
  ].map(([x, y]) => {
    const offset = (y * info.width + x) * 4;
    return [data[offset], data[offset + 1], data[offset + 2]];
  });

  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset], green = data[offset + 1], blue = data[offset + 2];
    let distance = Infinity;
    for (const sample of samples) {
      const dr = red - sample[0], dg = green - sample[1], db = blue - sample[2];
      distance = Math.min(distance, Math.sqrt(dr * dr + dg * dg + db * db));
    }
    const coverage = clamp((distance - 14) / 58);
    data[offset + 3] = Math.round(data[offset + 3] * coverage);
  }
  return {data, info};
}

function alphaBounds(data, width, height, padding = 5) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] < 10) continue;
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  if (right < left || bottom < top) return null;
  left = Math.max(0, left - padding); top = Math.max(0, top - padding);
  right = Math.min(width - 1, right + padding); bottom = Math.min(height - 1, bottom + padding);
  return {left, top, width: right - left + 1, height: bottom - top + 1};
}

async function writeRawWebp(data, info, destination) {
  await sharp(data, {raw: info}).webp({lossless: true, effort: 5}).toFile(destination);
}

async function importSheet(sheet, manifest) {
  const source = path.join(sourceDir, sheet.source);
  const metadata = await sharp(source).metadata();
  const full = await keyedPixels(source);
  await writeRawWebp(full.data, full.info, path.join(atlasDir, `${sheet.id}.webp`));

  manifest.atlases[sheet.id] = {
    file: `atlases/${sheet.id}.webp`, columns: sheet.columns, rows: sheet.rows,
    width: metadata.width, height: metadata.height
  };

  for (let index = 0; index < sheet.names.length; index++) {
    const name = sheet.names[index];
    if (!name) continue;
    const column = index % sheet.columns, row = Math.floor(index / sheet.columns);
    const left = Math.round(column * metadata.width / sheet.columns);
    const right = Math.round((column + 1) * metadata.width / sheet.columns);
    const top = Math.round(row * metadata.height / sheet.rows);
    const bottom = Math.round((row + 1) * metadata.height / sheet.rows);
    const bottomInset = sheet.bottomInsetByCell?.[index] || 0;
    const cell = await keyedPixels(sharp(source).extract({left, top, width: right - left, height: bottom - top - bottomInset}));
    const bounds = sheet.preserveCell?{left:0,top:0,width:cell.info.width,height:cell.info.height}:alphaBounds(cell.data, cell.info.width, cell.info.height);
    if (!bounds) throw new Error(`${sheet.id} cell ${index} (${name}) is empty`);
    const destination = path.join(spriteDir, `${name}.webp`);
    const transparentPadding = sheet.preserveCell ? 0 : 18;
    let sprite = sharp(cell.data, {raw: cell.info}).extract(bounds);
    if (transparentPadding) sprite = sprite.extend({
      top: transparentPadding, right: transparentPadding, bottom: transparentPadding, left: transparentPadding,
      background: {r: 0, g: 0, b: 0, alpha: 0}
    });
    await sprite.webp({lossless: true, effort: 5}).toFile(destination);
    manifest.sprites[name] = {
      file: `sprites/${name}.webp`, atlas: sheet.id, cell: index, pivot: sheet.pivot,
      width: bounds.width + transparentPadding * 2, height: bounds.height + transparentPadding * 2
    };
  }
}

async function main() {
  await fs.mkdir(spriteDir, {recursive: true});
  await fs.mkdir(atlasDir, {recursive: true});
  const manifest = {
    version: 1,
    cameraContract: {
      swarmUnits: 'strict top-down sprites, billboarded and rotated in screen plane',
      swarmWall: 'fixed host-camera front/south face with top cap',
      gallery: 'strict frontal screen-plane sprites'
    },
    atlases: {}, sprites: {}
  };
  for (const sheet of sheets) await importSheet(sheet, manifest);

  await sharp(path.join(sourceDir, 'swarm-ground-tile.png'))
    .resize(1024, 1024, {fit: 'cover'})
    .webp({quality: 88, effort: 5})
    .toFile(path.join(outputDir, 'swarm-ground-tile.webp'));
  manifest.ground = {file: 'swarm-ground-tile.webp', wrap: 'mirrored-repeat'};
  await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Imported ${Object.keys(manifest.sprites).length} sprites from ${sheets.length} atlases.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
