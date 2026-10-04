'use strict';
const assert=require('node:assert/strict'),{setup}=require('./punch-motion-fixture.cjs'),{Arcade}=require('../games/arcade/simulation');
async function impulse(peak,sense='soft'){
 const t=setup({sense});await t.nodes.motion.onclick();t.arm();assert.equal(t.context.punchArmed,true);
 t.listeners.devicemotion(t.event(peak));t.listeners.devicemotion(t.event(0));
 if(!t.sent.length)return null;
 assert.equal(t.sent.length,1);assert.equal(t.sent[0].data.action,'punch');assert.equal(t.sent[0].data.side,1);
 const game=new Arcade('punchmeter');game.join('p1','Human');game.join('p2','Other');assert(game.start());game.input('p1',t.sent[0].data);
 return{peak,sense,power:t.sent[0].data.power,score:game.players[0].hits[0]};
}
(async()=>{
 // Expected scores are fixed independent samples, exercising the actual event listener AND server input.
 assert.equal(await impulse(10),null,'noise stays below the existing trigger');
 const samples=[[17,137],[30,190],[52,280],[80,395],[118,550],[228,1000],[400,1000]],trace=[];
 for(const[peak,score]of samples){const actual=await impulse(peak);assert.equal(actual.score,score,`soft peak${peak}`);trace.push(actual);}
 assert.equal(trace[2].power,.2,'previous saturation52m/s² now yields one fifth power');
 assert.equal(trace[5].power,1,'gain reduction must not cap normalized power at.2');
 assert(trace.every((r,i)=>!i||r.score>=trace[i-1].score),'strength remains monotonic');
 for(const[sense,formerFull,newFull]of[['soft',52,228],['normal',40,176],['sharp',32,142]]){
  assert.equal((await impulse(formerFull,sense)).power,.2,`${sense} full-calibration gain is5x softer`);
  assert.equal((await impulse(newFull,sense)).score,1000,`${sense} cap stays reachable`);
 }
 const malformed=await impulse(Infinity);assert.equal(malformed,null,'nonfinite sensor values cannot create a punch');
 // Existing normalized touch/bot inputs retain score conversion, attempts, turn order and completion.
 const game=new Arcade('punchmeter');game.join('a','Touch');game.join('b','Bot');game.start();
 for(let i=0;i<3;i++){game.input('a',{action:'punch',power:1});game.input('b',{action:'punch',power:.5});for(let j=0;j<50;j++)game.tick(.04);}
 assert.equal(game.phase,'finished');assert.equal(game.players[0].score,3000);assert.equal(game.players[1].score,1650);
 console.log(JSON.stringify({status:'passed',gainReduction:5,trace,touchAndBotTotals:game.players.map(p=>p.score),scope:'Actual production motion listener with deterministic platform events and authoritative Arcade input; physical-device feel not verified.'},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
