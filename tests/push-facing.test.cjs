'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const src=fs.readFileSync('games/party/public/host.js','utf8');
const draw=src.slice(src.indexOf('function drawPush('),src.indexOf('\n',src.indexOf('function drawPush(')));
for(const count of [2,4,8,16])test(`Push Pit ${count} starters face inward and reset each round`,()=>{
 const sandbox={window:{},pushSumoFacing:new Map(),pushSumoRound:'',drawPlayerDisc(){}};
 for(const name of ['drawShrinkForecast','drawArena','drawArenaLife','drawRimDanger','drawDiscImpacts','drawWinnerBeat','drawDiscNames','drawVisualEvents'])sandbox[name]=()=>{};
 vm.createContext(sandbox);vm.runInContext(draw,sandbox);
 const s={center:{x:530,y:355},game:{mode:'push',round:1,arenaRadius:260},players:Array.from({length:count},(_,i)=>({id:String(i),active:true,alive:true,x:530+180*Math.cos(i*2*Math.PI/count),y:355+180*Math.sin(i*2*Math.PI/count)}))};
 const check=()=>{for(const p of s.players){const angle=sandbox.pushSumoFacing.get(p.id),dx=s.center.x-p.x,dy=s.center.y-p.y;assert.ok((Math.sin(angle)*dx-Math.cos(angle)*dy)/Math.hypot(dx,dy)>.999999);}};
 sandbox.drawPush(s);check();sandbox.pushSumoFacing.set('0',.3);sandbox.drawPush(s);assert.equal(sandbox.pushSumoFacing.get('0'),.3,'idle frames preserve last movement direction');s.game.round++;sandbox.drawPush(s);check();
});
