'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function runtime(storage=new Map(),parentLocale){
 const window={PARTY_TRANSLATIONS:{'Пауза':'Pause','Язык':'Language','Твой ход':'Your turn','Игроки':'Players'},addEventListener(){},dispatchEvent(){}};
 const document={documentElement:{},readyState:'loading',addEventListener(){},querySelectorAll(){return[];},createTreeWalker(){return{nextNode(){return null;}};}};
 const context={window,document,parent:parentLocale?{PartyI18n:{language:parentLocale}}:window,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},CustomEvent:class{},Map,Set,WeakMap};
 vm.runInNewContext(fs.readFileSync(require.resolve('../public/i18n.js'),'utf8'),context);return window.PartyI18n;
}
test('production English ignores legacy Russian storage, parent and room overrides',()=>{
 const storage=new Map([['local-party-language','ru']]),api=runtime(storage,'ru');
 assert.equal(api.language,'en');assert.equal(api.t('Пауза'),'Pause');
 assert.equal(api.setLanguage('ru'),false);assert.equal(api.acceptRoomLanguage({language:'ru',revision:'old-room'}),false);
 assert.equal(api.setLanguage('en'),true);assert.equal(runtime(storage).language,'en');
});
test('player names remain literal including Cyrillic names matching UI vocabulary',()=>{
 const api=runtime();api.protectPlayers([{name:'Пауза'},{name:'Игроки'}]);
 assert.equal(api.t('Пауза'),'Пауза');assert.equal(api.t('Твой ход: Пауза'),'Your turn: Пауза');assert.equal(api.t('Игроки'),'Игроки');
});
test('phrase replacement respects Cyrillic word boundaries',()=>{const api=runtime();assert.equal(api.t('Пауза · 10'),'Pause · 10');assert.equal(api.t('СуперПауза'),'Translation unavailable');assert.deepEqual(Array.from(api.missing),['СуперПауза']);});
