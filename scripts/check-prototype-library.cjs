'use strict';

const fs = require('node:fs');
const path = require('node:path');
const library = require('../lib/prototype-library.cjs');

const catalog = library.loadCatalog();
const errors = [];
const ids = new Set();
const allowedModes = new Set(catalog.defaultPolicy.sceneModes);
const requiredCollectionFields = ['id', 'title', 'category', 'status', 'projection', 'camera', 'pivot', 'tint', 'animation', 'license', 'mobileBundle'];
const manifests = new Map();

const inventoryPath = exists(catalog.fullInventory, 'fullInventory');
let inventory = null;
if (fs.existsSync(inventoryPath)) {
  try {
    inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  } catch (error) {
    errors.push(`fullInventory: ${error.message}`);
  }
}

function expect(condition, message) {
  if (!condition) errors.push(message);
}

function exists(relativePath, context) {
  const target = library.resolveProjectPath(relativePath);
  expect(fs.existsSync(target), `${context}: missing ${relativePath}`);
  return target;
}

for (const [name, relativePath] of Object.entries(catalog.manifests)) {
  const target = exists(relativePath, `manifest ${name}`);
  if (!fs.existsSync(target)) continue;
  try {
    manifests.set(name, JSON.parse(fs.readFileSync(target, 'utf8')));
  } catch (error) {
    errors.push(`manifest ${name}: ${error.message}`);
  }
}

for (const [license, metadata] of Object.entries(catalog.licenses)) {
  if (metadata.notice) exists(metadata.notice, `license ${license}`);
}

for (const entry of library.listEntries(catalog)) {
  expect(!ids.has(entry.id), `duplicate id: ${entry.id}`);
  ids.add(entry.id);
  expect(catalog.licenses[entry.license], `${entry.id}: unknown license ${entry.license}`);
  if (entry.kind === 'collection') {
    for (const field of requiredCollectionFields) expect(entry[field] != null && entry[field] !== '', `${entry.id}: missing ${field}`);
    expect(entry.projection === 'ui' || allowedModes.has(entry.projection), `${entry.id}: unsupported projection ${entry.projection}`);
  }
  for (const relativePath of entry.files || []) exists(relativePath, entry.id);
  if (entry.manifest) {
    const manifest = manifests.get(entry.manifest);
    expect(manifest, `${entry.id}: unknown manifest ${entry.manifest}`);
    const frames = manifest?.frames || manifest?.sprites || {};
    for (const member of entry.members || []) {
      const metadata = Array.isArray(frames) ? frames.includes(member) : frames[member];
      expect(metadata, `${entry.id}: manifest has no member ${member}`);
      if (!metadata || Array.isArray(frames)) continue;
      const base = path.dirname(catalog.manifests[entry.manifest]);
      const fileCandidates = [metadata.sprite, metadata.file, metadata.tintMask];
      if (entry.manifest === 'shared2d') fileCandidates.push(metadata.atlas);
      for (const candidate of fileCandidates) {
        if (candidate) exists(path.posix.join(base.replaceAll('\\', '/'), candidate), `${entry.id}/${member}`);
      }
      if (entry.manifest === 'shared2d') {
        expect(metadata.pivot && Number.isFinite(metadata.pivot.x) && Number.isFinite(metadata.pivot.y), `${entry.id}/${member}: missing numeric pivot`);
      } else {
        expect(Array.isArray(metadata.pivot) && metadata.pivot.length === 2, `${entry.id}/${member}: missing numeric pivot`);
        expect(typeof metadata.view === 'string', `${entry.id}/${member}: missing camera view`);
        const atlas = manifest.atlases?.[metadata.atlas];
        expect(atlas, `${entry.id}/${member}: unknown atlas ${metadata.atlas}`);
        if (atlas?.file) exists(path.posix.join(base.replaceAll('\\', '/'), atlas.file), `${entry.id}/${member}`);
      }
    }
  }
}

for (const relativePath of catalog.generationSpecs) exists(relativePath, 'generationSpecs');

if (inventory) {
  expect(Array.isArray(inventory.publicAssets), 'fullInventory: publicAssets must be an array');
  expect(Array.isArray(inventory.games), 'fullInventory: games must be an array');
  for (const asset of inventory.publicAssets || []) exists(asset.file, 'fullInventory/publicAssets');
  for (const game of inventory.games || []) {
    exists(game.root, `fullInventory/game ${game.id}`);
    expect(Array.isArray(game.sceneModes) && game.sceneModes.length > 0, `fullInventory/game ${game.id}: missing sceneModes`);
    for (const item of game.files || []) exists(item.file, `fullInventory/game ${game.id}`);
  }
  const expectedAssets = inventory.publicAssets.length;
  const expectedGameFiles = inventory.games.reduce((sum, game) => sum + game.files.length, 0);
  expect(inventory.totals.publicAssetFiles === expectedAssets, 'fullInventory: public asset total mismatch');
  expect(inventory.totals.gameFiles === expectedGameFiles, 'fullInventory: game file total mismatch');
  expect(inventory.totals.games === inventory.games.length, 'fullInventory: game total mismatch');
}

const findIndex = process.argv.indexOf('--find');
if (findIndex >= 0) {
  const text = process.argv.slice(findIndex + 1).join(' ');
  for (const entry of library.findAssets({ text }, catalog)) {
    console.log(`${entry.id}\t${entry.status}\t${entry.projection || '-'}\t${entry.title}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else if (findIndex < 0) {
  console.log(`Prototype library OK: ${catalog.collections.length} collections, ${catalog.systems.length} systems, ${ids.size} unique entries.`);
}
