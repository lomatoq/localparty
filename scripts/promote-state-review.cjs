'use strict';
// Publish verified captures without losing the images on which earlier feedback was based.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const source = path.resolve(process.argv[2] || '');
assert(process.argv[2], 'Pass the completed capture directory');
const report = JSON.parse(fs.readFileSync(path.join(source, 'states-report.json'), 'utf8'));
assert.equal(report.errors.length, 0, 'Resolve browser errors before publishing');
assert(report.games.length && report.games.every(game => !game.error), 'Resolve failed games before publishing');
if (report.assetsAtStart) assert(report.assetsStable === true || report.assetsReconciled === true, 'A captured UI revision must be stable or explicitly reconciled before publishing');
for (const file of ['states-missing.json', 'states-residual.json']) {
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(source, file), 'utf8')), [], file);
}
const target = path.resolve('.localparty-build/screen-review/captures');
assert.notEqual(source, target, 'Capture into a separate directory before publishing');
const revision = new Date().toISOString().replace(/[:.]/g, '-');
const history = path.resolve('.localparty-build/screen-review/history', revision);
fs.mkdirSync(target, {recursive:true});
fs.mkdirSync(history, {recursive:true});
const published = [];
const copy = (from, to) => {
  fs.copyFileSync(from, to);
  const stat = fs.statSync(from);
  fs.utimesSync(to, stat.atime, stat.mtime);
};
const names = ['shell-join.png', 'shell-lobby.png', 'shell-tv-lobby.png'];
for (const game of report.games) {
  for (const suffix of ['', '-tv', '-waiting', '-tv-waiting', '-paused', '-tv-paused', '-reconnected', '-results', '-tv-results']) names.push(game.id + suffix + '.png');
}
names.push('states-report.json', 'states-missing.json', 'states-residual.json');
for (const name of names) {
  const from = path.join(source, name), to = path.join(target, name);
  if (!fs.existsSync(from)) continue;
  if (fs.existsSync(to)) copy(to, path.join(history, name));
  copy(from, to);
  published.push(name);
}
fs.writeFileSync(path.join(history, 'promotion.json'), JSON.stringify({source, revision, published}, null, 2));
console.log(JSON.stringify({published:published.length, history}));
