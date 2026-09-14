'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const catalogPath = path.join(root, 'docs', 'prototype-library', 'catalog.json');

function loadCatalog() {
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
}

function listEntries(catalog = loadCatalog()) {
  return [
    ...catalog.collections.map(entry => ({ ...entry, kind: 'collection' })),
    ...catalog.systems.map(entry => ({ ...entry, kind: 'system' }))
  ];
}

function matches(value, expected) {
  if (expected == null) return true;
  const choices = Array.isArray(expected) ? expected : [expected];
  return choices.includes(value);
}

function findAssets(query = {}, catalog = loadCatalog()) {
  const terms = String(query.text || '').toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return listEntries(catalog).filter(entry => {
    if (!matches(entry.kind, query.kind)) return false;
    if (!matches(entry.category, query.category)) return false;
    if (!matches(entry.projection, query.projection)) return false;
    if (!matches(entry.status, query.status)) return false;
    if (!matches(entry.mobileBundle, query.mobileBundle)) return false;
    if (!terms.length) return true;
    const haystack = JSON.stringify(entry).toLocaleLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}

function resolveProjectPath(relativePath) {
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`Path escapes project root: ${relativePath}`);
  }
  return resolved;
}

module.exports = { catalogPath, loadCatalog, listEntries, findAssets, resolveProjectPath };
