'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {TVDirector}=require('../lib/tv-director'),catalog=require('../lib/catalog');
const store={data:{players:[{id:'a',name:'Player'}],events:[]},save(){},leaderboard(){return[{id:'a',name:'Player',points:12,wins:1}];}};
test('all current games expose their own podium wordmark identity and have an original asset',()=>{
 const director=new TVDirector({catalog,store});
 for(const game of catalog){
  director.capture({eventId:game.id,players:[{id:'a',name:'Player',score:12,rank:1,won:true}]},'run-'+game.id,game);
  director.command({type:'tv-overlay',mode:'podium',boardKind:'match'});
  assert.equal(director.view().board.game,game.id,game.id+' cannot inherit another game logo');
  const file=path.join(__dirname,'../public/assets/game-logos-v1/logos',game.id+'.png');
  assert.ok(fs.statSync(file).size>10000,game.id+' original must exist, not a thumbnail');
 }
 director.command({type:'tv-overlay',mode:'podium',boardKind:'company'});
 assert.equal(director.view().board.game,null,'company rankings must not inherit the previous match logo');
});
