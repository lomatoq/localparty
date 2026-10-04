'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function runtime(storage=new Map(),parentLocale,translations){
 const window={PARTY_TRANSLATIONS:translations||{'Пауза':'Pause','Язык':'Language','Твой ход':'Your turn','Игроки':'Players'},addEventListener(){},dispatchEvent(){}};
 const document={documentElement:{},readyState:'loading',addEventListener(){},querySelectorAll(){return[];},createTreeWalker(){return{nextNode(){return null;}};}};
 const context={window,document,parent:parentLocale?{PartyI18n:{language:parentLocale}}:window,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},CustomEvent:class{},Map,Set,WeakMap};
 vm.runInNewContext(fs.readFileSync(require.resolve('../public/i18n.js'),'utf8'),context);return window.PartyI18n;
}
test('English is the default and explicit Russian preference survives reload and frames',()=>{
 const storage=new Map(),api=runtime(storage);
 assert.equal(api.language,'en');assert.equal(api.t('Пауза'),'Pause');
 assert.equal(api.setLanguage('ru'),true);assert.equal(api.t('Пауза'),'Пауза');
 assert.equal(runtime(storage).language,'ru');assert.equal(runtime(new Map(),'ru').language,'ru');
 assert.equal(api.setLanguage('en'),true);assert.equal(runtime(storage).language,'en');
 assert.equal(api.setLanguage('unsupported'),false);assert.equal(api.language,'en');
});
test('a room language revision applies once without overriding a later personal choice',()=>{
 const storage=new Map(),api=runtime(storage);
 assert.equal(api.acceptRoomLanguage({language:'ru',revision:'room-one'}),true);assert.equal(api.language,'ru');
 api.setLanguage('en');
 assert.equal(api.acceptRoomLanguage({language:'ru',revision:'room-one'}),false);assert.equal(api.language,'en');
 assert.equal(runtime(storage).language,'en');
 assert.equal(api.acceptRoomLanguage({language:'ru',revision:'room-two'}),true);assert.equal(api.language,'ru');
});
test('Russian reverses exact semantic English labels without translating private text or player names',()=>{
 const api=runtime(new Map(),undefined,{'Настройки':'Settings','ТВОЙ ХОД':'YOUR TURN','Краткие правила':'Quick rules'});
 api.protectPlayers([{name:'Settings'}]);api.setLanguage('ru');
 assert.equal(api.t('Settings'),'Settings');assert.equal(api.t('Settings',{ui:true}),'Настройки');
 assert.equal(api.t('YOUR TURN',{ui:true}),'ТВОЙ ХОД');
 assert.equal(api.t('QUICK RULES',{ui:true}),'КРАТКИЕ ПРАВИЛА');
 assert.equal(api.t('Read Quick rules to solve this story',{ui:true}),'Read Quick rules to solve this story');
 assert.equal(api.t('Quick rules'),'Quick rules');
 const label={nodeType:3,nodeValue:'Settings',parentElement:{closest:q=>q==='script,style,textarea,input,[contenteditable], [data-no-translate], [translate="no"], .player-name, .playerName, .hp-player-name, #myName, #headerName'?null:q.includes('button')?{}:null}};
 api.apply(label);assert.equal(label.nodeValue,'Настройки');
 api.setLanguage('en');api.apply(label);assert.equal(label.nodeValue,'Settings');
 api.setLanguage('ru');api.apply(label);assert.equal(label.nodeValue,'Настройки');
 const player={nodeType:3,nodeValue:'Settings',parentElement:{closest:q=>q.includes('.hp-player-name')?{}:null}};
 api.apply(player);assert.equal(player.nodeValue,'Settings');
});
test('player names remain literal including Cyrillic names matching UI vocabulary',()=>{
 const api=runtime();api.protectPlayers([{name:'Пауза'},{name:'Игроки'}]);
 assert.equal(api.t('Пауза'),'Пауза');assert.equal(api.t('Твой ход: Пауза'),'Your turn: Пауза');assert.equal(api.t('Игроки'),'Игроки');
});
test('phrase replacement respects Cyrillic word boundaries',()=>{const api=runtime();assert.equal(api.t('Пауза · 10'),'Pause · 10');assert.equal(api.t('СуперПауза'),'СуперПауза');assert.deepEqual(Array.from(api.missing),['СуперПауза']);});
test('Local Tanks capture-the-flag readout translates while keeping the live score',()=>{const api=runtime(new Map(),undefined,require('../public/i18n-dictionary.js'));assert.equal(api.t('ФЛАГ · 0:0'),'FLAG · 0:0');assert.equal(api.t('ФЛАГ · 2:1'),'FLAG · 2:1');assert.equal(api.t('Флаги 0 : 0'),'Flags 0 : 0');assert.equal(api.t('Флаги 2 : 1'),'Flags 2 : 1');api.setLanguage('ru');assert.equal(api.t('Флаги 2 : 1'),'Флаги 2 : 1');});
test('Spy turn labels translate without rewriting the addressed player',()=>{const api=runtime(new Map(),undefined,require('../public/i18n-dictionary.js'));api.protectPlayers([{name:'Анна'}]);assert.equal(api.t('Спроси Анна'),'Ask Анна');assert.equal(api.t('Отвечай Анна'),'Answer Анна');});
test('Spy questioning mini secret translates its role prefix',()=>{const api=runtime(new Map(),undefined,require('../public/i18n-dictionary.js'));assert.equal(api.t('Роль: Worker'),'Role: Worker');});
test('semantic UI controls translate even when a player has the same name',()=>{
 const api=runtime();api.protectPlayers([{name:'Пауза'}]);
 assert.equal(api.t('Пауза',{ui:true}),'Pause');assert.equal(api.t('Пауза'),'Пауза');
 for(const selector of ['#pauseButton','#pauseTitle','#hudValue']){
  const node={nodeType:3,nodeValue:'Пауза',parentElement:{closest:q=>q.includes(selector)?{}:null}};
  api.apply(node);assert.equal(node.nodeValue,'Pause',selector);
 }
 const name={nodeType:3,nodeValue:'Пауза',parentElement:{closest:q=>q.includes('[data-no-translate]')?{}:null}};
 api.apply(name);assert.equal(name.nodeValue,'Пауза');
});
