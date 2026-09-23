'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const dictionary=Object.assign({},require('../public/i18n-dictionary'),require('../public/i18n-shell'),require('../public/i18n-content'));
const win={PARTY_TRANSLATIONS:dictionary,addEventListener(){}},document={readyState:'loading',addEventListener(){}};
vm.runInNewContext(fs.readFileSync(require.resolve('../public/i18n.js'),'utf8'),{window:win,parent:win,document,localStorage:{getItem(){}},Map,Set,WeakMap});
test('all catalog native host settings and action labels have English coverage',()=>{
 const misses=[];for(const game of require('../lib/catalog')){
  const schema=require('../lib/host-controls').schema(game);
  for(const label of schema.settings.flatMap(field=>[field.label,...field.options.map(o=>o.label)]).concat(schema.actions.map(a=>a.label)))if(win.PartyI18n.t(label)==='Translation unavailable'||/[А-Яа-яЁё]/.test(win.PartyI18n.t(label)))misses.push({game:game.id,label});
 }
 assert.deepEqual(misses,[]);
});
test('bowling queued turn and crane settling messages translate without renaming players',()=>{
 win.PartyI18n.protectPlayers([{name:'Бот 1'}]);
 assert.equal(win.PartyI18n.t('Бросает Бот 1'),'Throwing: Бот 1');
 assert.equal(win.PartyI18n.t('Контакт · ждём устойчивости'),'Contact · waiting for the block to settle');
});
// Scan even error paths and hidden help: they were missed by ready-state screenshots.
for(const file of ['ios/LocalParty/ServerModel.swift','ios/LocalParty/LocalPartyApp.swift','public/native-shell/host.js'])test(file+' native status/error strings have English coverage',()=>{
 const source=fs.readFileSync(file,'utf8'),misses=[];
 for(const match of source.matchAll(/(?:"([^"\n]*)"|'([^'\n]*)'|`([^`\n]*)`)/g)){
  const value=match[1]||match[2]||match[3]||'';
  if(/[А-Яа-яЁё]/.test(value)&&(win.PartyI18n.t(value)==='Translation unavailable'||/[А-Яа-яЁё]/.test(win.PartyI18n.t(value))))misses.push(value);
 }
 assert.deepEqual(misses,[]);
});
