'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const catalog=require('../lib/catalog'),{registry,normalize}=require('../public/tv-information');
test('all 36 released games have explicit family and safe runtime metadata adapter',()=>{
 assert.equal(catalog.length,36);assert.deepEqual(Object.keys(registry).sort(),catalog.map(g=>g.id).sort());
 for(const game of catalog){const input={game,ui:{phase:'playing',label:'На ход',currentPlayer:'A',progress:'2 / 3',endsAt:5000},now:2000};const before=JSON.stringify(input),out=normalize(input);assert.equal(out.title,game.title);assert(['live','turn','prompt','mission'].includes(out.family));assert.equal(out.timer.remainingSeconds,3);assert.equal(out.actor,'A');assert.equal(out.progress,'2 / 3');assert.equal(out.coverage,'runtime-ui');assert.equal(out.objective?.kind,'static');assert.deepEqual(out.metrics,[]);assert.equal(JSON.stringify(input),before);}
});
test('all36 concise objectives have explicit English copy, not live-state claims',()=>{
 const {objectives}=require('../public/tv-information');for(const game of catalog){const pair=objectives[game.id];assert(pair,game.id);assert(pair[1].length<=40,game.id);assert(!/[А-Яа-яЁё]/.test(pair[1]),game.id);assert.equal(normalize({game}).objective.kind,'static');}
 const dictionary=require('../public/i18n-shell');for(const label of ['Прицеливание','Выбор арсенала','Дрон в полёте','Выстрел / осыпание','Арсенал готов','Прочность ворот'])assert(dictionary[label],label);
});
test('Pocket public phases, clock domains and unknown fields remain honest',()=>{
 const game=catalog.find(g=>g.id==='pocket_siege');
 for(const[stage,label,remaining]of[['aim','Прицеливание',10],['loadout','Выбор арсенала',20],['drone','Дрон в полёте',5],['flight','Выстрел / осыпание',null]]){
  const snapshot={phase:'playing',stage,t:30,deadline:40,loadoutDeadline:50,drone:{deadline:35},activeId:'a',players:[{id:'a',name:'A'}]};const r=normalize({game,snapshot});assert.equal(r.phaseLabel,label);assert.equal(r.actor,'A');assert.equal(r.timer?.remainingSeconds??null,remaining);assert.equal(r.timer?.clock??null,remaining===null?null:'simulation-seconds');assert(!r.metrics.some(m=>m.key==='wind'));
 }
});
test('secret-bearing fields are never serialized, even if accidentally present in host input',()=>{
 for(const game of catalog){const input={game,ui:{phase:'playing'},snapshot:{phase:'playing',secret:'SECRET_SENTINEL',question:{answer:'SECRET_SENTINEL'},me:{secret:'SECRET_SENTINEL'},players:[{id:'a',name:'A',hole:['SECRET_SENTINEL'],role:'SECRET_SENTINEL'}],cells:[{mine:'SECRET_SENTINEL'}]}};const before=JSON.stringify(input);assert(!JSON.stringify(normalize(input)).includes('SECRET_SENTINEL'),game.id);assert.equal(JSON.stringify(input),before);}
});
test('pause has priority, no invented timer or metric and no fabricated live objective',()=>{
 const game=catalog[0],out=normalize({game,ui:{phase:'paused',endsAt:5000},now:9999});assert.equal(out.phaseLabel,'Пауза');assert.equal(out.timer,null);assert.equal(out.objective.kind,'static');assert.deepEqual(out.metrics,[]);
 const unknown=normalize({game:{id:'unknown',title:'Unknown'}});assert.equal(unknown.family,null);assert.equal(unknown.phaseLabel,null);assert.equal(unknown.coverage,'unsupported');assert.equal(unknown.objective,null);
});
test('browser and Node APIs match; mode-specific useful metrics need actual public data',()=>{
 const context={};vm.runInNewContext(fs.readFileSync('public/tv-information.js','utf8'),context);assert(context.LocalPartyTVInformation.normalize);
 const game={id:'swarm_gate',title:'Gate'};const r=normalize({game,snapshot:{phase:'playing',t:3,deadline:8,wave:2,waveCount:6,gate:70,waveLeft:4}});assert.equal(r.progress,'Волна 2 / 6');assert.equal(r.timer.remainingSeconds,5);assert.equal(r.metrics.find(m=>m.key==='gate').value,70);
 const poker=normalize({game:{id:'poker'},snapshot:{phase:'playing',remaining:12,pot:300,hand:2,turn:'a',players:[{id:'a',name:'A'}]}});assert.equal(poker.actor,'A');assert.equal(poker.timer.clock,'remaining-seconds');assert.equal(poker.metrics.find(m=>m.key==='pot').value,300);
});
test('publisher is host-only, caps traffic at 4Hz and never forwards raw secret fields',()=>{
 const {createPublisher}=require('../public/tv-information');let now=0,packets=[];const options={game:{id:'poker',title:'Poker'},instance:'match-1',send:p=>packets.push(p),now:()=>now};
 const off=createPublisher({...options,enabled:false});assert.equal(off({phase:'playing'}),false);
 const send=createPublisher(options),s={phase:'playing',secret:'HIDDEN',players:[{id:'a',name:'A',score:0,hole:['HIDDEN']}],pot:0};
 assert(send(s));for(let i=1;i<250;i++){now=i;send({...s,pot:i});}assert.equal(packets.length,1);now=250;assert(send({...s,pot:1}));assert.equal(packets.length,2);assert(!JSON.stringify(packets).includes('HIDDEN'));assert.equal(packets[0].instance,'match-1');assert.equal(packets[0].info.metrics.find(m=>m.key==='score').value,0);
 now=1250;assert(send({...s,pot:1}),'unchanged live state has a1s heartbeat');assert.equal(packets.length,3);
});
test('zero-based questions/drawing turns and inactive sports clocks are not mislabeled',()=>{
 for(const id of ['warsaw','drawguess']){const r=normalize({game:{id},snapshot:{phase:'playing',round:0,turn:0,total:5}});assert.match(r.progress,/1 \/ 5/);}
 const r=normalize({game:{id:'swarm_gate'},snapshot:{phase:'playing',stage:'wave',t:10,deadline:0}});assert.equal(r.timer,null);
 const mines=normalize({game:{id:'mines'},snapshot:{phase:'playing',remaining:180}});assert.equal(mines.timer.remainingSeconds,180,'engine remaining is180-t seconds, not cells');
});
test('hidden Western signal and ended matches never expose countdowns',()=>{
 for(const phase of ['waitingSignal','draw'])assert.equal(normalize({game:{id:'western_duel'},snapshot:{phase,endsAt:12345},now:10000}).timer,null);
 for(const id of ['bow_club','poker','mines','airhockey','marble_bloom','swarm_gate'])for(const phase of ['waiting','results'])assert.equal(normalize({game:{id},snapshot:{phase,remaining:90,deadline:200,t:100,duration:500,arenaMode:'versus'}}).timer,null,id);
 assert.equal(normalize({game:{id:'western_duel'},snapshot:{phase:'countdown',endsAt:13000},now:10000}).timer.remainingSeconds,3);
 assert.equal(normalize({game:{id:'crane'},snapshot:{phase:'playing',turns:0,maxTurns:12}}).progress,'Ход 1 / 12');
});
