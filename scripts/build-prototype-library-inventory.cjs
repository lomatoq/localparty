'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const outputPath = path.join(root, 'docs', 'prototype-library', 'inventory.json');
const ignoredNames = new Set(['node_modules', '.git', 'dist', 'test-results']);
const artExtensions = new Set(['.png', '.webp', '.jpg', '.jpeg', '.svg', '.ico', '.glb', '.gltf', '.mp3', '.wav', '.ogg', '.ttf', '.woff', '.woff2']);
const sourceExtensions = new Set(['.js', '.cjs', '.mjs', '.css', '.html', '.json', '.md']);

const sceneModes = {
  arcade: ['2d-front', '2d-top-down'], chaos: ['2d-front'], crane: ['2d-front'], crocodile: ['ui'],
  drawguess: ['ui'], jenga: ['3d'], kart: ['pseudo-3d'], millionaire: ['ui'], monster: ['2d-front'],
  naval: ['2d-top-down'], party: ['2d-top-down', '2d-front', 'pseudo-3d'], quiz: ['ui'],
  sports_siege: ['2d-top-down', '2d-front', '3d'], spy: ['ui'], tankarena: ['2d-top-down'],
  tanks: ['2d-top-down'], western_duel: ['2d-front']
};

function normalize(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function walk(directory) {
  const out = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (ignoredNames.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...walk(target));
    else if (entry.isFile()) out.push(normalize(target));
  }
  return out;
}

function assetCategory(file) {
  const ext = path.extname(file).toLowerCase();
  const name = path.basename(file).toLowerCase();
  if (['.ttf', '.woff', '.woff2'].includes(ext)) return 'font';
  if (['.mp3', '.wav', '.ogg'].includes(ext)) return 'audio';
  if (['.glb', '.gltf'].includes(ext)) return 'model-3d';
  if (/manifest|frames|provenance|sources|report/.test(name)) return 'metadata';
  if (/atlas/.test(name)) return 'atlas';
  if (/mask/.test(file)) return 'tint-or-cutout-mask';
  if (/icon|favicon|logo/.test(name)) return 'brand-or-icon';
  if (/background|backdrop|ground|world|city|town|panorama/.test(name)) return 'background-or-tile';
  if (artExtensions.has(ext)) return 'raster-or-vector-art';
  if (sourceExtensions.has(ext)) return 'support-file';
  return 'other';
}

function codeRole(file) {
  const ext = path.extname(file).toLowerCase();
  const name = path.basename(file).toLowerCase();
  if (/test/.test(name)) return 'test';
  if (name.startsWith('readme') || ext === '.md' || ext === '.txt') return 'documentation';
  if (artExtensions.has(ext)) return 'asset';
  if (ext === '.css') return 'ui-style';
  if (ext === '.html') return 'entry-or-template';
  if (name === 'server.js') return 'server';
  if (/engine|physics|simulation|rules|match/.test(name)) return 'game-system';
  if (/controller|player|joystick|touch|controls/.test(name)) return 'controller-system';
  if (/host|screen|renderer|broadcast|app/.test(name)) return 'host-renderer-or-client';
  if (ext === '.js' || ext === '.cjs' || ext === '.mjs') return 'module';
  if (ext === '.json') return 'data-or-manifest';
  return 'support-file';
}

function buildInventory() {
  const publicAssetFiles = walk(path.join(root, 'public', 'assets')).map(file => ({ file, category: assetCategory(file) }));
  const gamesRoot = path.join(root, 'games');
  const games = fs.readdirSync(gamesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !ignoredNames.has(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .map(entry => {
      const files = walk(path.join(gamesRoot, entry.name)).map(file => ({ file, role: codeRole(file) }));
      const roles = [...new Set(files.map(item => item.role))].sort();
      return {
        id: entry.name,
        root: `games/${entry.name}`,
        sceneModes: sceneModes[entry.name] || ['unknown'],
        reusableRoles: roles,
        files
      };
    });
  return {
    version: 1,
    scope: ["public/assets/**", "games/*/**"],
    note: "Deterministic generated index. Regenerate after adding or removing project assets or game files.",
    totals: {
      publicAssetFiles: publicAssetFiles.length,
      games: games.length,
      gameFiles: games.reduce((sum, game) => sum + game.files.length, 0)
    },
    publicAssets: publicAssetFiles,
    games
  };
}

const rendered = `${JSON.stringify(buildInventory(), null, 2)}\n`;
if (process.argv.includes('--check')) {
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (current !== rendered) {
    console.error('Prototype inventory is stale. Run: node scripts/build-prototype-library-inventory.cjs');
    process.exitCode = 1;
  } else {
    console.log('Prototype inventory is current.');
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, rendered);
  const data = JSON.parse(rendered);
  console.log(`Indexed ${data.totals.publicAssetFiles} public assets and ${data.totals.gameFiles} files across ${data.totals.games} games.`);
}

module.exports = { buildInventory };
