'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const catalog=require('../lib/catalog'),{registry,normalize}=require('../public/tv-information');
test('approved game logo resolver covers actual catalog assets and rejects unknown paths',()=>{
 const {logoFor}=require('../public/tv-information');
 for(const game of catalog){
  const url=logoFor(game.id);assert.equal(url,'/assets/game-logos-v1/logos/'+game.id+'.png?v=1');
  const png=fs.readFileSync('public'+url.split('?')[0]);assert.equal(png.subarray(1,4).toString(),'PNG');
  assert(png.readUInt32BE(16)>0&&png.readUInt32BE(20)>0,game.id+' has original bitmap dimensions');
 }
 for(const id of ['missing','../naval','toString','__proto__','naval?other'])assert.equal(logoFor(id),null);
 const context={};vm.runInNewContext(fs.readFileSync('public/tv-information.js','utf8'),context);
 assert.equal(context.LocalPartyTVInformation.logoFor('naval'),logoFor('naval'));
});
test('all 32 released games have explicit family and safe runtime metadata adapter',()=>{
 assert.equal(catalog.length,32);assert.deepEqual(Object.keys(registry).sort(),catalog.map(g=>g.id).sort());
 for(const game of catalog){const input={game,ui:{phase:'playing',label:'На ход',currentPlayer:'A',progress:'2 / 3',endsAt:5000},now:2000};const before=JSON.stringify(input),out=normalize(input);assert.equal(out.title,game.title);assert(['live','turn','prompt','mission'].includes(out.family));assert.equal(out.timer.remainingSeconds,3);assert.equal(out.actor,'A');assert.equal(out.progress,'2 / 3');assert.equal(out.coverage,'runtime-ui');assert.equal(out.objective?.kind,'static');assert.deepEqual(out.metrics,[]);assert.equal(JSON.stringify(input),before);}
});
test('all 32 concise objectives have explicit English copy, not live-state claims',()=>{
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
 for(const id of ['warsaw','crocodile']){const r=normalize({game:{id},snapshot:{phase:'playing',round:0,turn:0,total:5,settings:{turns:5}}});assert.match(r.progress,/1 \/ 5/);}
 const r=normalize({game:{id:'swarm_gate'},snapshot:{phase:'playing',stage:'wave',t:10,deadline:0}});assert.equal(r.timer,null);
 const mines=normalize({game:{id:'mines'},snapshot:{phase:'playing',remaining:180}});assert.equal(mines.timer.remainingSeconds,180,'engine remaining is180-t seconds, not cells');
});
test('hidden Western signal and ended matches never expose countdowns',()=>{
 for(const phase of ['waitingSignal','draw'])assert.equal(normalize({game:{id:'western_duel'},snapshot:{phase,endsAt:12345},now:10000}).timer,null);
 for(const id of ['bow_club','poker','mines','airhockey','marble_bloom','swarm_gate'])for(const phase of ['waiting','results'])assert.equal(normalize({game:{id},snapshot:{phase,remaining:90,deadline:200,t:100,duration:500,arenaMode:'versus'}}).timer,null,id);
 assert.equal(normalize({game:{id:'western_duel'},snapshot:{phase:'countdown',endsAt:13000},now:10000}).timer.remainingSeconds,3);
});
test('team hockey HUD reports goals without inventing an individual leader',()=>{
 const info=normalize({game:{id:'airhockey'},snapshot:{phase:'playing',remaining:48,goals:[2,3],players:[{id:'a',name:'A',score:99},{id:'b',name:'B',score:0}]}});
 assert.deepEqual(info.metrics.map(m=>m.key),['goals']);assert.equal(info.metrics[0].value,'2 : 3');assert.equal(info.timer.remainingSeconds,48);
});
test('Local Tanks flag and coop modes discard stale round counters, survival preserves rounds',()=>{
 const input={game:{id:'tanks'},ui:{progress:'Раунд 0 / 10'},snapshot:{game:{mode:'ctf',status:'playing',round:0,maxRounds:10,timer:75,redScore:2,blueScore:1},players:[]}};
 const flags=normalize(input);assert.equal(flags.progress,null);assert.equal(flags.sources.progress,null);assert.equal(flags.metrics.find(m=>m.key==='teams').value,'2 : 1');assert.equal(flags.timer.remainingSeconds,75);
 const coop=normalize({...input,snapshot:{game:{...input.snapshot.game,mode:'coop'}}});assert.equal(coop.progress,null);assert(!coop.metrics.some(m=>m.key==='teams'));
 const survival=normalize({...input,snapshot:{game:{...input.snapshot.game,mode:'survival',round:3}}});assert.equal(survival.progress,'Раунд 3 / 10');
});
test('Local Tanks hides an explicitly untimed active survival clock but keeps timed modes',()=>{
 const input={game:{id:'tanks'},ui:{phase:'playing',endsAt:50000},now:10000,snapshot:{game:{mode:'survival',status:'playing',round:1,maxRounds:10,timer:0},players:[]}};
 const untimed=normalize(input);assert.equal(untimed.timer,null);assert.equal(untimed.progress,'Раунд 1 / 10');
 for(const mode of ['ctf','coop']){
  const timed=normalize({...input,snapshot:{game:{...input.snapshot.game,mode,timer:75}}});assert.equal(timed.timer.remainingSeconds,75);assert.equal(timed.timer.clock,'remaining-seconds');
  const expired=normalize({...input,snapshot:{game:{...input.snapshot.game,mode,timer:0}}});assert.equal(expired.timer.remainingSeconds,0);
 }
 const timedSurvival=normalize({...input,snapshot:{game:{...input.snapshot.game,timer:30}}});assert.equal(timedSurvival.timer.remainingSeconds,30);
 const other=normalize({...input,game:{id:'push'},snapshot:{game:{status:'playing',timer:0}}});assert.equal(other.timer.remainingSeconds,0);
});
test('Spy public role assignment and play instructions override stale parent UI',()=>{
 const game={id:'spy'},ui={phase:'playing',progress:'Посмотрите роль на телефоне',endsAt:13000};
 const reveal=normalize({game,ui,snapshot:{phase:'reveal'},now:10000});
 assert.equal(reveal.phaseLabel,'Раздача ролей');assert.equal(reveal.timer,null);
 for(const duel of [false,true]){
  const active=normalize({game,ui,snapshot:{phase:'playing',duel,timerEndsAt:15000},now:10000});
  assert.equal(active.progress,duel?'Мини-режим: вопрос и догадка':'Найдите шпиона');
  assert.equal(active.sources.progress,'public-snapshot');assert.equal(active.timer.remainingSeconds,5);
 }
 const vote=normalize({game,ui:{...ui,currentPlayer:'Stale actor'},snapshot:{phase:'voting',currentTurn:{asker:'a',answerer:'b'},voteCount:1,players:[{id:'a',name:'A'},{id:'b',name:'B'},{id:'s',name:'Spectator',spectator:true}]},now:10000});
 assert.equal(vote.progress,'Голосование');assert.equal(vote.timer,null);
 assert.equal(vote.actor,null);assert.equal(vote.metrics.find(m=>m.key==='votes').value,'1 / 2');
 assert.equal(normalize({game,ui,snapshot:{phase:'reveal'},paused:true}).phaseLabel,'Пауза');
});
test('TV publisher retains the last quiet-game state inside its4Hz throttle',()=>{
 const {createPublisher}=require('../public/tv-information');let at=0,callback=null,delay=null;const packets=[];
 const publish=createPublisher({game:{id:'spy'},instance:'spy-1',now:()=>at,send:p=>packets.push(p),schedule:(fn,ms)=>{callback=fn;delay=ms;return 1;},cancel:()=>{callback=null;}});
 assert(publish({phase:'reveal'}));at=60;assert.equal(publish({phase:'playing',duel:false,timerEndsAt:480000}),false);
 at=180;assert.equal(publish({phase:'playing',duel:true,timerEndsAt:480000}),false);
 assert.equal(packets.length,1);assert.equal(delay,190);at=250;callback();
 assert.equal(packets.length,2);assert.equal(packets[1].info.phase,'playing');assert.equal(packets[1].info.progress,'Мини-режим: вопрос и догадка');
 at=300;publish({phase:'voting'});assert(callback);at=550;publish({phase:'result'});assert.equal(callback,null);assert.equal(packets.at(-1).info.phase,'result');
});
