'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),view=require('../games/arcade/controller-view'),{Arcade}=require('../games/arcade/simulation');
test('phone packets exclude world data and remain stable when only physics moves',t=>{
 const game=new Arcade('hungry');for(let i=0;i<16;i++)game.join('p'+i,'Player '+i);game.start();
 const full=game.view(),phone=view(full),before=JSON.stringify(phone);
 assert(!('food'in phone));assert(!('trail'in phone.players[0]));assert(!('vx'in phone.players[0]));
 full.players[0].x+=100;full.players[0].vx=99;full.time+=.01;full.timer-=.01;
 assert.equal(JSON.stringify(view(full)),before,'invisible physics does not trigger a phone broadcast');
 const {food,pipes,...rest}=full,previous={...rest,players:full.players.map(({trail,...p})=>p)};
 const bytes=Buffer.byteLength(before),original=Buffer.byteLength(JSON.stringify(previous));assert(bytes<original*.5);t.diagnostic(`16-player Hungry previous phone contract -> new phone contract: ${original} -> ${bytes} bytes (not a full-world comparison)`);
 full.players[0].score++;assert.notEqual(JSON.stringify(view(full)),before,'score updates are never suppressed');
});
