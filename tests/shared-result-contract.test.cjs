'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {TVDirector}=require('../lib/tv-director');
const game={id:'game',title:'Игра'};
function setup(options){return new TVDirector({catalog:[game],store:{data:{players:[{id:'a',name:'Аляксандра Ўладзіміраўна'},{id:'b',name:'Пётр'}],tvOptions:options},leaderboard:()=>[],save(){}}});}
const active=(phase='results',instance='one')=>({game,instance,ui:{phase}});
const result={eventId:'final',players:[{id:'a',score:5,rank:1,won:true},{id:'b',score:50,rank:2,won:false}]};
test('fresh room celebrates automatically; explicit opt out persists',()=>{
 const d=setup();d.capture(result,'one',game);assert.equal(d.view({active:active()}).mode,'podium');
 const quiet=setup({autoPodium:false});quiet.capture(result,'one',game);assert.equal(quiet.view({active:active()}).mode,'none');assert.ok(quiet.resultFor(active()));
});
test('shared phone results never leak a previous game or a live result',()=>{
 const d=setup();d.capture(result,'one',game);
 assert.equal(d.resultFor(active('playing')),null);assert.equal(d.resultFor(active('results','two')),null);
 assert.equal(d.resultFor({...active(),game:{id:'other'}}),null);assert.equal(d.resultFor(null),null);
 assert.deepEqual(d.resultFor(active()).rows.map(r=>[r.id,r.rank,r.score]),[['a',1,5],['b',2,50]]);
});
test('collective victory does not give different personal scores the same place',()=>{
 const d=setup();d.capture({eventId:1,players:result.players.map(p=>({...p,rank:1,won:true}))},'one',game);
 assert.deepEqual(d.resultFor(active()).rows.map(r=>[r.id,r.rank,r.won]),[['b',1,true],['a',2,true]]);
});
test('equal personal scores keep a genuine shared place',()=>{
 const d=setup();d.capture({eventId:2,players:result.players.map(p=>({...p,score:50,rank:1,won:true}))},'one',game);
 assert.deepEqual(d.resultFor(active()).rows.map(r=>[r.rank,r.won]),[[1,true],[1,true]]);
});
