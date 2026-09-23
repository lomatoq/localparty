'use strict';
// Dry-run by default. --apply regenerates atlases from their immutable original
// generated sources, so reruns never compound WebP loss or remove more artwork.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const sharp = require('sharp');
const { cleanBorderComponents } = require('./pocket-icon-cleanup.cjs');
const root = path.resolve(__dirname, '..');
const art = path.join(root, 'docs/gameplay-art/pocket-generated-v1');
async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(art, 'manifest.json'), 'utf8'));
  const report = [], comparisons = [];
  for (let sheet = 0; sheet < manifest.generatedSources.length; sheet++) {
    const file = manifest.generatedSources[sheet];
    const meta = await sharp(file).metadata();
    if (meta.width !== meta.height || meta.width % 6) throw new Error(`Invalid source atlas: ${file}`);
    const cell = meta.width / 6;
    for (const weapon of manifest.weapons.filter(w => w.sheet === sheet + 1)) {
      const { data, info } = await sharp(file).ensureAlpha().extract({ left: weapon.column * cell, top: weapon.row * cell, width: cell, height: cell }).raw().toBuffer({ resolveWithObject: true });
      const before = Buffer.from(data);
      const result = cleanBorderComponents(data, cell, cell);
      report.push({ id: weapon.id, ...result });
      if (result.removedPixels > 0) {
        comparisons.push({ name: weapon.name, before: await sharp(before, { raw: info }).resize(128,128).png().toBuffer(), after: await sharp(data, { raw: info }).resize(128,128).png().toBuffer() });
      }
    }
  }
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'dry-run', weapons: report.length, changedIcons: report.filter(r => r.removedPixels).length, removedPixels: report.reduce((s,r)=>s+r.removedPixels,0), protectedEdgeComponents: report.reduce((s,r)=>s+r.protectedEdgeComponents,0), icons: report.filter(r => r.removedPixels) }, null, 2));
  if (!process.argv.includes('--apply')) return;
  execFileSync(process.execPath, [path.join(__dirname, 'finalize-pocket-icon-atlases.cjs'), ...manifest.generatedSources], { stdio: 'inherit' });
  if (comparisons.length) {
    const composites = [];
    for (let i = 0; i < comparisons.length; i++) {
      const x = i % 4 * 256, y = Math.floor(i / 4) * 152;
      const label = comparisons[i].name.replace(/[&<>]/g, '');
      composites.push({ input: comparisons[i].before, left: x, top: y + 24 }, { input: comparisons[i].after, left: x + 128, top: y + 24 },
        { input: Buffer.from(`<svg width="256" height="24"><text x="4" y="16" fill="white" font-size="12">${label}: before / after</text></svg>`), left: x, top: y });
    }
    await sharp({ create: { width: 1024, height: Math.ceil(comparisons.length / 4) * 152, channels: 4, background: '#30343b' } }).composite(composites).png().toFile(path.join(art, 'border-cleanup-contact-sheet.png'));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
