'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),handling=require('../games/kart/static/handling');
const car=(overrides={})=>({x:0,y:0,angle:0,speed:300,vx:300,vy:0,steer:0,turn:0,throttle:1,distance:0,...overrides});
const run=(p,seconds,dt=1/60)=>{for(let t=0;t<seconds-1e-8;t+=dt)handling.advance(p,Math.min(dt,seconds-t));return p};
test('an 80ms correction is less than half the old instant full-lock turn',()=>{for(const direction of [-1,1]){const p=run(car({steer:direction}),.08),oldAngle=2.65*.08;assert(Math.abs(p.angle)<oldAngle*.5);assert(p.angle*direction>0);assert(Math.abs(p.turn)<.5);}});
test('held steering reaches a tight corner with less speed and stable traction',()=>{const p=run(car({speed:430,vx:430,steer:1}),2);assert.equal(p.turn,1);assert(p.speed<=221&&p.speed>=215);const slip=Math.abs(Math.atan2(Math.sin(Math.atan2(p.vy,p.vx)-p.angle),Math.cos(Math.atan2(p.vy,p.vx)-p.angle)));assert(slip<.16,'velocity follows heading instead of sliding across the narrow road');});
test('release centres immediately and reversing does not retain the old direction',()=>{const p=run(car({steer:1}),.3);p.steer=0;run(p,.08);assert.equal(p.turn,0);p.steer=1;run(p,.2);p.steer=-1;run(p,.12);assert(p.turn<0);});
test('steering while stationary cannot rotate or displace a kart',()=>{const p=run(car({speed:0,vx:0,throttle:0,steer:1}),1);assert.equal(p.angle,0);assert.equal(p.x,0);assert.equal(p.y,0);});
test('full gas still reaches the existing straight speed limit',()=>{const p=run(car({speed:0,vx:0}),8);assert.equal(p.speed,430);assert.equal(p.angle,0);});
test('steering response and traction agree at 60 and 120Hz',()=>{const a=run(car({steer:.7}),2,1/60),b=run(car({steer:.7}),2,1/120);assert(Math.abs(a.angle-b.angle)<.025);assert(Math.hypot(a.x-b.x,a.y-b.y)<7);assert(Math.abs(a.speed-b.speed)<1);});
test('left and right driving are symmetric',()=>{const a=run(car({steer:1}),1),b=run(car({steer:-1}),1);assert(Math.abs(a.x-b.x)<1e-8);assert(Math.abs(a.y+b.y)<1e-8);assert.equal(a.angle,-b.angle);});

test('held gas can turn out of a stalled barrier instead of remaining pinned',()=>{const p=run(car({speed:0,vx:0,steer:1}),.3);assert(p.angle>.08);assert(p.x>0);});

const fs=require('node:fs'),vm=require('node:vm');
const hostSource=fs.readFileSync(require.resolve('../games/kart/static/host.js'),'utf8');
function feedback(){const code=hostSource.slice(hostSource.indexOf('const kartBeat='),hostSource.indexOf('function drawBoostPads'));const sandbox={performance:{now:()=>1000},window:{}};vm.createContext(sandbox);vm.runInContext(code,sandbox);return {observe:(before,after)=>sandbox.observeKartBeats(before,after),pops:()=>vm.runInContext('kartPops',sandbox)};}
const racer=(overrides={})=>({id:'driver',in_race:true,lap:0,position:3,speed:0,x:0,y:0,...overrides});
test('opening-grid rankings do not show false overtake notices',()=>{const f=feedback();f.observe({status:'racing',players:[racer()]},{status:'racing',race_time:1,players:[racer({position:1})]});assert.equal(f.pops().length,0);});
test('real lap/finish feedback remains and repeated place gains coalesce',()=>{const f=feedback();const before={status:'racing',players:[racer()]};f.observe(before,{status:'racing',race_time:3,laps:5,players:[racer({position:2})]});f.observe({status:'racing',players:[racer({position:2})]},{status:'racing',race_time:3.2,laps:5,players:[racer({position:1})]});assert.equal(f.pops().length,1);assert.equal(f.pops()[0].text,'P1');f.observe(before,{status:'racing',race_time:30,laps:5,players:[racer({lap:1})]});assert(f.pops().some(p=>p.text==='LAP 2/5'));f.observe(before,{status:'results',race_time:130,laps:5,players:[racer({finish_order:1,finish_time:130})]});assert(f.pops().some(p=>p.text==='WINNER!'));});
