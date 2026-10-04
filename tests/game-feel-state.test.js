'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {ids,createTracker}=require('../public/game-feel-state');
const catalog=require('../lib/catalog');
const clock=n=>({timer:{remainingSeconds:n},paused:false});
test('feedback covers the released catalog exactly without guessed game IDs',()=>assert.deepEqual([...ids].sort(),catalog.map(g=>g.id).sort()));
test('Air Hockey goal is one event, targeted team pattern, no replay on reconnect',()=>{
 const t=createTracker('airhockey'),s={phase:'playing',goals:[0,0],players:[{id:'a',team:0},{id:'b',team:1}]};
 assert.equal(t.observe(s,{selfId:'a'}).events.length,0);
 const goal={...s,goals:[1,0]};let r=t.observe(goal,{selfId:'a'});assert.equal(r.events.length,1);assert.equal(r.events[0].type,'goal');assert.equal(r.events[0].conceded,false);
 assert.equal(t.observe(goal,{selfId:'a'}).events.length,0);t.reset();assert.equal(t.observe(goal,{selfId:'a'}).events.length,0);
 const lose=createTracker('airhockey');lose.observe(s,{selfId:'b'});assert.equal(lose.observe(goal,{selfId:'b'}).events[0].conceded,true);
});
test('the winning goal is felt even when the same authoritative snapshot ends the match',()=>{
 const t=createTracker('airhockey');t.observe({phase:'playing',goals:[6,0]});
 assert.equal(t.observe({phase:'results',goals:[7,0]}).events[0].type,'goal');
});
test('Tanks damage and critical HP only concern the local player; heal clears urgency',()=>{
 const t=createTracker('tanks'),s=hp=>({id:'a',status:'playing',hp,maxHp:100,alive:true,round:1});
 t.observe(s(100),{selfId:'a'});let r=t.observe(s(24),{selfId:'a'});assert.equal(r.critical,true);assert.deepEqual(r.events.map(e=>e.semantic),['damage','critical-health']);
 assert.equal(r.events[0].haptic,false);assert.equal(r.events[1].haptic,true,'critical warning wins over the same-packet hit');
 assert.equal(t.observe(s(24),{selfId:'a'}).events.length,0);assert.equal(t.observe(s(65),{selfId:'a'}).critical,false);
});
test('TV red health edge belongs to the last remaining fighter, not an arbitrary damaged opponent',()=>{
 const t=createTracker('tanks'),s=secondAlive=>({game:{status:'playing',round:1},players:[{id:'a',hp:20,maxHp:100,alive:true,connected:true},{id:'b',hp:100,maxHp:100,alive:secondAlive,connected:true}]});
 assert.equal(t.observe(s(true)).critical,false);assert.equal(t.observe(s(false)).critical,true);
});
test('public last-five threshold fires once, never while paused or from a missing clock',()=>{
 const t=createTracker('spy'),s={phase:'playing',players:[{id:'a'}]};t.observe(s,{info:clock(6),selfId:'a'});
 assert.deepEqual(t.observe(s,{info:clock(5),selfId:'a'}).events.map(e=>e.semantic),['last-five']);
 assert.equal(t.observe(s,{info:clock(4),selfId:'a'}).events.length,0);
 assert.equal(t.observe({...s,paused:true},{info:clock(3)}).urgent,false);
 assert.equal(createTracker('western_duel').observe({phase:'waitingSignal'}).urgent,false);
});
test('new turn/round and first midway join establish a baseline instead of fabricated gains',()=>{
 const t=createTracker('knives'),s=round=>({id:'a',status:'playing',round,roundScore:5});t.observe(s(1),{selfId:'a'});
 assert.equal(t.observe({...s(2),roundScore:8},{selfId:'a'}).events.length,0);
});
test('food and tap progress do not create an effect or vibration every server tick',()=>{
 for(const game of ['hungry','taprace','flappy']){const t=createTracker(game);t.observe({phase:'playing',players:[{id:'a',score:1,alive:true}]},{selfId:'a'});assert.equal(t.observe({phase:'playing',players:[{id:'a',score:100,alive:true}]},{selfId:'a'}).events.length,0);}
});
test('Kart impact sequence is deduplicated and soft contacts are ignored',()=>{
 const t=createTracker('kart'),s=impact=>({status:'racing',players:[{id:'a',lap:0,impact}]});t.observe(s(null),{selfId:'a'});
 assert.equal(t.observe(s({seq:1,strength:20}),{selfId:'a'}).events.length,0);
 assert.equal(t.observe(s({seq:2,strength:90}),{selfId:'a'}).events[0].semantic,'wall-hit');assert.equal(t.observe(s({seq:2,strength:90}),{selfId:'a'}).events.length,0);
});
test('Carry Ball controller retains only the score/team data needed by personal goal feedback',()=>{
 const view=require('../games/arcade/controller-view'),s={mode:'carryball',phase:'playing',teams:[1,0],players:[{id:'a',team:0,score:0,alive:true,input:{},trail:['large'],x:80}]};const v=view(s);assert.deepEqual(v.teams,[1,0]);assert.equal(v.players[0].team,0);assert.equal(v.players[0].trail,undefined);assert.equal(v.players[0].x,undefined);
 s.mode='taprace';assert.equal(view(s).teams,undefined);assert.equal(view(s).players[0].team,undefined);
});
test('quiz reward at reveal uses awarded score, not secret answers',()=>{
 const t=createTracker('sinyakquiz');t.observe({phase:'question',round:1,me:{id:'a',score:0},question:{answers:['private']}},{selfId:'a'});
 assert.equal(t.observe({phase:'reveal',round:1,me:{id:'a',score:100}},{selfId:'a'}).events[0].semantic,'score');
});
test('the last Crane life is critical and Hungry loss follows respawn state',()=>{
 const crane=createTracker('crane');assert.equal(crane.observe({phase:'playing',lives:1}).critical,true);
 const hungry=createTracker('hungry');hungry.observe({phase:'playing',players:[{id:'a',alive:true,dead:0}]},{selfId:'a'});
 assert.equal(hungry.observe({phase:'playing',players:[{id:'a',alive:true,dead:2}]},{selfId:'a'}).events[0].semantic,'elimination');
});
test('interleaved public packets cannot flicker private critical health or known last-five state',()=>{
 const t=createTracker('tanks');let r=t.observe({id:'a',status:'playing',round:1,hp:20,maxHp:100,alive:true},{channel:'selfState',selfId:'a',info:clock(4)});assert(r.critical);assert(r.urgent);
 r=t.observe({game:{status:'playing',round:1},players:[]},{channel:'state',selfId:'a'});assert(r.critical);assert(r.urgent);
 r=t.observe({id:'a',status:'playing',round:1,hp:90,maxHp:100,alive:true},{channel:'selfState',selfId:'a',info:clock(30)});assert(!r.critical);assert(!r.urgent);
 r=t.observe({game:{status:'paused',round:1}},{channel:'state',selfId:'a'});assert(!r.critical);assert(!r.urgent);
 t.reset();assert.equal(t.observe({id:'a',status:'playing',hp:20,maxHp:100,alive:true},{channel:'selfState',selfId:'a'}).events.length,0);
});
test('one goal delivered on public and private channels yields one semantic event',()=>{
 const t=createTracker('airhockey'),s={phase:'playing',goals:[0,0],players:[{id:'a',team:0}]};for(const channel of ['state','selfState'])t.observe(s,{channel,selfId:'a'});
 const goal={...s,goals:[1,0]};assert.equal(t.observe(goal,{channel:'state',selfId:'a'}).events.length,1);assert.equal(t.observe(goal,{channel:'selfState',selfId:'a'}).events.length,0);
});
test('CTF team points announce a flag capture, not a soccer goal',()=>{
 const t=createTracker('tanks');t.observe({game:{status:'playing',mode:'ctf',round:1,redScore:0,blueScore:0}});
 const event=t.observe({game:{status:'playing',mode:'ctf',round:1,redScore:1,blueScore:0}}).events[0];assert.equal(event.semantic,'flag-capture');assert.equal(event.announcement,'flag');assert.equal(event.color,'#ff9aab');
});
test('Millionaire reward follows public money field; turn deadline never buzzes spectators',()=>{
 const t=createTracker('millionaire'),s={phase:'question',gameNumber:1,activePlayerId:'b',players:[{id:'a',money:0},{id:'b',money:0}]};t.observe(s,{selfId:'a',info:clock(6)});
 assert.equal(t.observe(s,{selfId:'a',info:clock(5)}).events[0].haptic,false);
 const reward=t.observe({...s,phase:'reveal',players:[{id:'a',money:100},{id:'b',money:0}]},{selfId:'a'}).events[0];assert.equal(reward.semantic,'score');
});
test('a sunk Naval spectator does not receive the next public deadline haptic',()=>{
 const t=createTracker('naval'),s={phase:'battle',players:[{id:'a',health:0},{id:'b',health:5}]};
 t.observe(s,{selfId:'a',info:clock(6)});assert.equal(t.observe(s,{selfId:'a',info:clock(5)}).events[0].haptic,false);
});
test('Tank Arsenal awards pulse the real numeric score once on phone and TV',()=>{
 const s=score=>({phase:'playing',players:[{id:'a',name:'100',score,hp:100,dead:0},{id:'b',score:0,hp:100,dead:0}]});
 for(const selfId of ['a',null]){
  const t=createTracker('tankarena');t.observe(s(0),{selfId});
  const events=t.observe(s(100),{selfId}).events;
  assert.equal(events.length,1);assert.equal(events[0].semantic,'score');
  assert.equal(events[0].impactSelector,'#combatScore,.arsenal-score');
  assert.equal(events[0].impactPlayer,'a');assert.equal(events[0].haptic,!!selfId);assert.equal(t.observe(s(100),{selfId}).events.length,0);
  t.reset();assert.equal(t.observe(s(100),{selfId}).events.length,0);
 }
});

test('Mines safe opens emphasize the awarded player only, without field particles',()=>{const t=createTracker('mines'),s=score=>({phase:'playing',players:[{id:'a',score:0},{id:'b',score}]});t.observe(s(0));const e=t.observe(s(1)).events[0];assert.equal(e.impactPlayer,'b');assert.equal(e.visual,false);assert.equal(e.haptic,false);assert.equal(e.impactSelector,'#myMineScore,#players .tabletop-score');});
