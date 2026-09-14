'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
test('fractional deadline noise is deduplicated, but real deadline and phase changes arrive immediately',()=>{
 const sent=[];let now=10000;const clock={offset:0,paused:false,realNow:()=>now,now:()=>now};
 const context={module:{exports:{}},require:name=>name==='./game-clock'?clock:require(name),process:{env:{},connected:true,send:m=>sent.push(m),on(){}},Date:{now:()=>now},Buffer};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../lib/party-runtime.js'),'utf8'),context);
 const ui=context.module.exports.ui;
 for(let i=0;i<60;i++){ui({phase:'playing',endsAt:20000+(i%2?1:-1)*.00001});now+=10;}
 assert.equal(sent.length,1);assert.equal(sent[0].ui.endsAt,20000);
 ui({phase:'playing',endsAt:21000});assert.equal(sent.length,2);
 ui({phase:'results',endsAt:null});assert.equal(sent.length,3);
 now+=1001;ui({phase:'results',endsAt:null});assert.equal(sent.length,4,'Retain periodic clock synchronization');
});
