'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{decide}=require('../public/bot-policy');
const profile={id:'bot',name:'Bot'},me={...profile,x:600,y:360,alive:true,mass:20,team:0};
test('arena bots brake toward safety before chasing someone over the rim',()=>{
 const s={center:{x:600,y:360},game:{arenaRadius:292},players:[{...me,x:830,vx:100},{id:'other',x:870,y:360,alive:true}]};
 assert(decide('push',s,profile).axis.x<0);s.players[0]={...me};assert(decide('push',s,profile).axis.x>0);
});
test('bomb carrier chases; non-carrier evades; eliminated bots do not act',()=>{
 const s={center:{x:600,y:360},bomb:{holderId:'other',arenaRadius:300},players:[me,{id:'other',x:680,y:360,alive:true}]};
 assert(decide('bomb',s,profile).axis.x<0);s.bomb.holderId='bot';assert(decide('bomb',s,profile).axis.x>0);
 s.players[0]={...me,alive:false};assert.equal(decide('bomb',s,profile),null);
});
test('hungry seeks food, carryball runs toward the correct goal',()=>{
 assert(decide('hungry',{players:[me],food:[{x:700,y:360}]},profile).axis.x>0);
 const plan=decide('carryball',{players:[{...me,x:1100}],ball:{owner:'bot'}},profile);assert(plan.axis.x>0);assert(plan.pass);
});
test('flappy reacts to gap and falling velocity instead of a fixed click interval',()=>{
 assert.equal(decide('flappy',{players:[{...me,x:230,y:400,vy:100}],pipes:[{x:300,gap:300}]},profile).flap,true);
 assert.equal(decide('flappy',{players:[{...me,x:230,y:180,vy:-100}],pipes:[{x:300,gap:300}]},profile).flap,false);
});
test('western ignores fake signals and snake steers away from walls',()=>{
 for(const cueReal of [false,true])assert.equal(decide('western',{players:[me],western:{phase:'draw',cueReal}},profile).fire,cueReal);
 const axis=decide('snakelines',{players:[{...me,x:1150,angle:0,trail:[]}]},profile).axis;assert(axis.x<.1);
});
test('siege aims toward an opponent and marbles select a matching public color',()=>{
 const s={players:[{...me,x:200,team:0},{id:'other',x:900,y:360,team:1,alive:true}]};
 const shot=decide('pocket_siege',s,profile);assert.equal(shot.angle,45);assert(shot.power>=8&&shot.power<=100);
 const aim=decide('marble_bloom',{players:[{...me,ball:2}],chain:[{color:1,x:200,y:150},{color:2,x:400,y:250}]},profile);assert.deepEqual(aim.aim,{x:400,y:250});
});
