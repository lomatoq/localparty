const assert=require('node:assert/strict');
const {VisualClock,angleDelta}=require('../games/party/public/visual-clock.js');
function snap(t,a,x=0,status='playing'){return {visualTime:t,game:{mode:'knives',round:1,status,arenaRadius:292},drum:{angle:a},players:[{id:'a',x,y:30}],flying:[]};}
const clock=new VisualClock(50);
clock.push(snap(1000,6.27,0),10);clock.push(snap(1033,.02,33),43);clock.push(snap(1066,.053,66),76);
const mid=clock.sample(76);assert(Math.abs(mid.players[0].x-16)<.001);assert(Math.abs(angleDelta(6.27,mid.drum.angle))<.03,'wrap follows shortest arc');
const xs=[];for(let now=76;now<125;now+=4)xs.push(clock.sample(now).players[0].x);assert(xs.every((x,i)=>!i||x>xs[i-1]),'between network ticks movement is continuous');
assert.equal(clock.sample(10000).players[0].x,66,'paused or disconnected snapshots must never drift');
clock.push(snap(1100,2,800,'countdown'),110);assert.equal(clock.sample(110).players[0].x,800,'phase changes snap without crossing arenas');
for(let i=0;i<100;i++)clock.push(snap(1200+i*33,i*.01),120+i*33);assert.equal(clock.frames.length,8,'bounded buffer');
console.log('PASS timestamp interpolation, wrap, subframe motion, pause, phase reset, bounded memory');
