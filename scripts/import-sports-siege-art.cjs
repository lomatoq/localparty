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

function colorDistance(a, b) {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function isChromaCandidate(red, green, blue) {
  return red > 150 && blue > 70 && red > green * 1.35 && blue > green * 1.08;
}

function median(values) {
  if (!values.length) return 0;
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}

function rowMattes(data, width, height) {
  const rows = [];
  for (let y = 0; y < height; y++) {
    const candidates = [];
    const edge = Math.min(18, Math.max(3, Math.floor(width * .045)));
    for (let x = 0; x < width; x++) {
      if (x >= edge && x < width - edge && x % Math.max(1, Math.floor(width / 24)) !== 0) continue;
      const offset = (y * width + x) * 4, color = [data[offset], data[offset + 1], data[offset + 2]];
      if (isChromaCandidate(...color)) candidates.push(color);
    }
    if (candidates.length) rows.push([
      median(candidates.map(color => color[0])),
      median(candidates.map(color => color[1])),
      median(candidates.map(color => color[2]))
    ]);
    else rows.push(rows.at(-1) || [255, 0, 168]);
  }
  for (let y = height - 2; y >= 0; y--) if (!rows[y]) rows[y] = rows[y + 1];
  return rows;
}

async function keyedPixels(input) {
  const pipeline = typeof input === 'string' ? sharp(input) : input.clone();
  const {data, info} = await pipeline.ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const width = info.width, height = info.height, pixels = width * height;
  const edgeColors = [];
  const collect = (x, y) => {
    const offset = (y * width + x) * 4;
    const color = [data[offset], data[offset + 1], data[offset + 2]];
    if (isChromaCandidate(...color)) edgeColors.push(color);
  };
  for (let x = 0; x < width; x++) { collect(x, 0); collect(x, height - 1); }
  for (let y = 1; y < height - 1; y++) { collect(0, y); collect(width - 1, y); }
  const matte = edgeColors.length ? [
    median(edgeColors.map(color => color[0])),
    median(edgeColors.map(color => color[1])),
    median(edgeColors.map(color => color[2]))
  ] : [255, 0, 168];
  const background = new Uint8Array(pixels);
  const queue = new Int32Array(pixels);
  let head = 0, tail = 0;
  const enqueue = pixel => {
    if (background[pixel]) return;
    const offset = pixel * 4;
    const color = [data[offset], data[offset + 1], data[offset + 2]];
    if (!isChromaCandidate(...color) || colorDistance(color, matte) > 72) return;
    background[pixel] = 1;
    queue[tail++] = pixel;
  };
  for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y++) { enqueue(y * width); enqueue(y * width + width - 1); }
  while (head < tail) {
    const pixel = queue[head++], x = pixel % width, y = Math.floor(pixel / width);
    if (x) enqueue(pixel - 1);
    if (x + 1 < width) enqueue(pixel + 1);
    if (y) enqueue(pixel - width);
    if (y + 1 < height) enqueue(pixel + width);
  }
  for (let pixel = 0; pixel < pixels; pixel++) {
    const offset = pixel * 4;
    const red = data[offset], green = data[offset + 1], blue = data[offset + 2];
    // The source contract reserves this saturated magenta family exclusively for
    // the key. Clear isolated compression/noise islands as well as the flood-filled
    // exterior so no rectangular matte fragments survive inside a cropped cell.
    if (background[pixel] || isChromaCandidate(red, green, blue)) {
      data[offset] = data[offset + 1] = data[offset + 2] = data[offset + 3] = 0;
      continue;
    }
    const x = pixel % width, y = Math.floor(pixel / width);
    const touchesBackground = (x && background[pixel - 1]) || (x + 1 < width && background[pixel + 1]) ||
      (y && background[pixel - width]) || (y + 1 < height && background[pixel + width]);
    if (!touchesBackground) continue;
    const distance = colorDistance([data[offset], data[offset + 1], data[offset + 2]], matte);
    if (distance < 90) data[offset + 3] = Math.round(data[offset + 3] * clamp((distance - 34) / 56));
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
  const atlasCells = [];

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
    const transparentPadding = sheet.preserveCell ? 24 : 18;
    let sprite = sharp(cell.data, {raw: cell.info}).extract(bounds);
    if (transparentPadding) sprite = sprite.extend({
      top: transparentPadding, right: transparentPadding, bottom: transparentPadding, left: transparentPadding,
      background: {r: 0, g: 0, b: 0, alpha: 0}
    });
    await sprite.webp({lossless: true, effort: 5}).toFile(destination);
    const packedCell = await sharp(cell.data, {raw: cell.info}).png().toBuffer();
    atlasCells.push({input: packedCell, left, top});
    manifest.sprites[name] = {
      file: `sprites/${name}.webp`, atlas: sheet.id, cell: index, pivot: sheet.pivot,
      width: bounds.width + transparentPadding * 2, height: bounds.height + transparentPadding * 2,
      safeBounds: [transparentPadding, transparentPadding, bounds.width, bounds.height],
      view: sheet.view || (sheet.id.startsWith('swarm-') ? 'top-down' : 'front')
    };
  }
  await sharp({create:{width:metadata.width,height:metadata.height,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite(atlasCells).webp({lossless:true,effort:5}).toFile(path.join(atlasDir, `${sheet.id}.webp`));
}

async function buildSwarmDeaths(manifest) {
  const kinds=['termite','runner','tank','boss'];
  for(const [kindIndex,kind] of kinds.entries()){
    const id=`swarm-death-${kind}`,frames=[],cellSize=256;
    for(let frame=0;frame<8;frame++){
      const progress=frame/7,enemySize=Math.round(188*(1-progress*.34));
      const enemy=await sharp(path.join(spriteDir,`swarm-${kind}.webp`))
        .resize(enemySize,enemySize,{fit:'inside'})
        .rotate((kindIndex%2?1:-1)*progress*18,{background:{r:0,g:0,b:0,alpha:0}})
        .modulate({brightness:1-progress*.22,saturation:1-progress*.36})
        .png().toBuffer();
      const burstSize=Math.round(66+progress*150),burst=await sharp(path.join(spriteDir,`swarm-explosion-${frame}.webp`))
        .resize(burstSize,burstSize,{fit:'inside'}).png().toBuffer();
      const frameBuffer=await sharp({create:{width:cellSize,height:cellSize,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
        .composite([{input:enemy,gravity:'centre',opacity:Math.max(.08,1-progress*.88)},{input:burst,gravity:'centre',opacity:.78+progress*.22}])
        .webp({lossless:true,effort:4}).toBuffer();
      const name=`${id}-${frame}`;await fs.writeFile(path.join(spriteDir,`${name}.webp`),frameBuffer);frames.push({input:frameBuffer,left:(frame%4)*cellSize,top:Math.floor(frame/4)*cellSize});
      manifest.sprites[name]={file:`sprites/${name}.webp`,atlas:id,cell:frame,pivot:[.5,.5],width:cellSize,height:cellSize,safeBounds:[16,16,224,224],view:'top-down'};
    }
    await sharp({create:{width:cellSize*4,height:cellSize*2,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames).webp({lossless:true,effort:4}).toFile(path.join(atlasDir,`${id}.webp`));
    manifest.atlases[id]={file:`atlases/${id}.webp`,columns:4,rows:2,width:cellSize*4,height:cellSize*2,animation:{frames:8,fps:18,loop:false}};
  }
}

async function main() {
  await fs.mkdir(spriteDir, {recursive: true});
  await fs.mkdir(atlasDir, {recursive: true});
  const manifest = {
    version: 2,
    cameraContract: {
      swarmUnits: 'strict top-down sprites, billboarded and rotated in screen plane',
      swarmWall: 'fixed host-camera front/south face with top cap',
      gallery: 'strict frontal screen-plane sprites'
    },
    atlases: {}, sprites: {}
  };
  for (const sheet of sheets) await importSheet(sheet, manifest);
  await buildSwarmDeaths(manifest);

  await sharp(path.join(sourceDir, 'swarm-ground-tile.png'))
    .resize(1024, 1024, {fit: 'cover'})
    .webp({quality: 88, effort: 5})
    .toFile(path.join(outputDir, 'swarm-ground-tile.webp'));
  manifest.ground = {file: 'swarm-ground-tile.webp', wrap: 'mirrored-repeat'};
  await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Imported ${Object.keys(manifest.sprites).length} sprites from ${Object.keys(manifest.atlases).length} atlases.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
