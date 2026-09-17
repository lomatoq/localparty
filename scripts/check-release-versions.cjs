#!/usr/bin/env node
'use strict';
// Read-only audit. Never changes the lockfile, downloads executables, or upgrades native ABI.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const sources = {
  xcode: 'https://developer.apple.com/xcode/system-requirements',
  node: 'https://nodejs.org/dist/index.json',
  nodeMobile: 'https://api.github.com/repos/nodejs-mobile/nodejs-mobile/releases/latest',
  wabt: 'https://api.github.com/repos/WebAssembly/wabt/releases/latest'
};
function parts(v) {const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(v || ''); return m ? m.slice(1).map(Number) : null;}
function compare(a, b) {const x = parts(a), y = parts(b); if (!x || !y) return null; for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1; return 0;}
function classify(current, latest, name = '') {
  const c = compare(current, latest);
  if (c === null) return 'manual-review';
  if (c > 0) return 'ahead-of-registry-do-not-downgrade';
  if (c === 0) return 'current';
  if (/rapier|nodejs-mobile|wabt/.test(name)) return 'native-regeneration-required';
  const a = parts(current), b = parts(latest);
  return a[0] !== b[0] || (a[0] === 0 && a[1] !== b[1]) ? 'breaking-upgrade-review' : 'update-candidate-test-first';
}
async function read(url, json = true) {
  const response = await fetch(url, {headers: {'User-Agent': 'LocalParty-version-audit', 'Accept': json ? 'application/json' : 'text/html'}, signal: AbortSignal.timeout(15000)});
  if (!response.ok) throw Error(`HTTP ${response.status}: ${url}`);
  return json ? response.json() : response.text();
}
async function audit(root = ROOT) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const lockPath = path.join(root, 'package-lock.json');
  const lock = fs.existsSync(lockPath) ? JSON.parse(fs.readFileSync(lockPath, 'utf8')) : {packages: {}};
  const result = {checkedAt: new Date().toISOString(), policy: 'Latest stable candidates; no beta, force-upgrade, downgrade, or untested native ABI changes.', localNode: process.version, sources, packages: [], toolchains: {}, errors: []};
  const names = Object.keys({...pkg.dependencies, ...pkg.devDependencies, ...pkg.overrides}).sort();
  const queue = [...names];
  async function worker() {
    while (queue.length) {
      const name = queue.shift();
      const declared = pkg.dependencies?.[name] || pkg.devDependencies?.[name] || pkg.overrides?.[name];
      const current = lock.packages?.[`node_modules/${name}`]?.version || declared;
      const source = 'https://registry.npmjs.org/' + encodeURIComponent(name) + '/latest';
      try {
        const item = await read(source);
        if (!parts(item.version)) throw Error('latest is not a stable SemVer');
        result.packages.push({name, declared, current, latest: item.version, engines: item.engines || {}, source, status: classify(current, item.version, name)});
      } catch (e) { result.errors.push({source, error: e.message}); result.packages.push({name, current, status: 'unverified'}); }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  await Promise.all(Object.entries(sources).map(async ([name, source]) => {
    try {
      if (name === 'node') {
        const today = new Date().toISOString().slice(0, 10);
        const releases = (await read(source)).filter(x => x.date <= today && parts(x.version)).sort((a,b) => compare(b.version,a.version));
        result.toolchains.node = {latestStable: releases[0]?.version, latestLTS: releases.find(x => x.lts)?.version, source};
      } else if (name === 'xcode') {
        const text = (await read(source, false)).replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
        const versions = [...text.matchAll(/Xcode\s+(\d+(?:\.\d+){0,2})(?:\s+(beta|RC|Release Candidate))?/gi)].filter(m => !m[2]).map(m => m[1]);
        versions.sort((a,b) => compare(b.split('.').concat(['0','0']).slice(0,3).join('.'), a.split('.').concat(['0','0']).slice(0,3).join('.')));
        if (!versions.length) throw Error('Apple page format changed; verify latest stable Xcode manually');
        result.toolchains.xcode = {latestStable: versions[0], source, note: 'Check macOS support and connected iPhone OS before selecting Xcode. SDK target need not raise the deployment target.'};
      } else {
        const release = await read(source);
        if (release.prerelease || release.draft || Date.parse(release.published_at) > Date.now()) throw Error('Not a currently published stable release');
        result.toolchains[name] = {latestStable: release.tag_name, publishedAt: release.published_at, source, assets: release.assets.map(a => ({name:a.name,digest:a.digest,url:a.browser_download_url})), note:'Comparison only; keep reproducible native pins until regenerated and tested.'};
      }
    } catch (e) { result.errors.push({source, error: e.message}); }
  }));
  result.packages.sort((a,b) => a.name.localeCompare(b.name));
  return result;
}
if (require.main === module) {
  audit().then(result => {
    const dir = path.join(ROOT, '.localparty-build'); fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(path.join(dir,'.gitignore'), '*\n');
    fs.writeFileSync(path.join(dir,'versions.json'), JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
    if (result.errors.length && process.argv.includes('--strict')) process.exitCode = 1;
  }).catch(e => {console.error(e.message);process.exitCode=1;});
}
module.exports = {parts, compare, classify, audit};
