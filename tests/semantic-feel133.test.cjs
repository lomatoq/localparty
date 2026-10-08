'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createTracker,ids}=require('../public/game-feel-state');
test('public token-driven handoff follows owner and never replays a reconnect',()=>{
 for(const game of ['jenga','bowling','curling']){
  const t=createTracker(game),state=(token,owner)=>({phase:'playing',turnId:game==='jenga'?token:undefined,turnToken:game!=='jenga'?token:undefined,currentId:owner,players:[{id:'a'},{id:'b'}]});
  assert.equal(t.observe(state('1','b'),{selfId:'a'}).events.length,0);
  const e=t.observe(state('2','a'),{selfId:'a'}).events.find(e=>e.type==='turn-ready');assert(e);assert.equal(e.id,`${game}:turn:2:a`);assert(e.hudOnly);
  assert.equal(t.observe(state('2','a'),{selfId:'a'}).events.length,0);
  assert(t.observe(state('3','a'),{selfId:'a'}).events.some(e=>e.type==='turn-ready'),'second own throw is a new token');
  t.reset();assert.equal(t.observe(state('3','a'),{selfId:'a'}).events.length,0);
  assert.equal(createTracker(game).observe(state('3','a')).events.length,0);
 }
});
test('no token means no guessed turn, suspended players never get a ready beat',()=>{
 const t=createTracker('jenga'),s={phase:'playing',currentId:'b',players:[{id:'a'}]};t.observe(s,{selfId:'a'});assert.equal(t.observe({...s,currentId:'a'},{selfId:'a'}).events.length,0);
 t.reset();t.observe({...s,turnId:1},{selfId:'a'});assert.equal(t.observe({...s,turnId:2,currentId:'a',players:[{id:'a',active:false}]},{selfId:'a'}).events.length,0);
});
test('respawn is a real dead-to-alive edge, not a timer tick or reconnect',()=>{
 const t=createTracker('hungry'),s=dead=>({phase:'playing',players:[{id:'a',dead,alive:true}]});t.observe(s(2),{selfId:'a'});assert.equal(t.observe(s(1),{selfId:'a'}).events.length,0);assert.equal(t.observe(s(0),{selfId:'a'}).events[0].type,'recovery');assert.equal(t.observe(s(0),{selfId:'a'}).events.length,0);
});
test('all36 traces are read-only and duplicate snapshots are silent',()=>{
 for(const game of ids){const t=createTracker(game),s={phase:'playing',players:[{id:'a',score:10,hp:100,alive:true,dead:0}],turnId:1};const before=JSON.stringify(s);t.observe(s,{selfId:'a'});assert.equal(t.observe(s,{selfId:'a'}).events.length,0);assert.equal(JSON.stringify(s),before);}
});
