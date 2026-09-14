const assert=require('node:assert/strict');const {Arcade,MODES}=require('../games/arcade/simulation');
for(const mode of Object.keys(MODES)){const g=new Arcade(mode,()=>.5);for(let i=0;i<16;i++)g.join('p'+i,'Игрок '+i);assert.equal(g.join('overflow','Extra'),null);assert(g.start());assert.equal(g.players.length,16);g.input('p0',{x:1,y:.5,action:mode==='punchmeter'?'punch':'tap',power:.9});g.tick(.033);if(mode==='taprace')assert(g.players[0].progress>0);if(mode==='punchmeter')assert.equal(g.players[0].hits.length,1);if(mode==='flappy')assert(g.players[0].vy<0);if(mode==='hungry'||mode==='carryball')assert(g.players[0].x>100);if(mode==='snakelines')assert.equal(g.players[0].trail.length,1);g.timer=.01;g.tick(.02);assert.equal(g.phase,'finished');assert(g.start());assert.equal(g.phase,'playing');assert(g.players.every(p=>p.score===0&&p.hits.length===0));JSON.stringify(g.view());console.log('PASS',mode,'16 players/input/finish/replay');}
const p=new Arcade('punchmeter');p.join('a','A');p.join('b','B');p.start();for(let i=0;i<3;i++){p.input('a',{action:'punch',power:1});p.input('b',{action:'punch',power:.5});for(let j=0;j<50;j++)p.tick(.04);}assert.equal(p.phase,'finished');assert.equal(p.players[0].score,3000);assert.equal(p.players[1].score,1650);
const h=new Arcade('hungry');h.join('a','A');h.join('b','B');h.start();Object.assign(h.players[0],{mass:100,x:500,y:500});Object.assign(h.players[1],{mass:20,x:500,y:500,shield:0});h.tick(.03);assert(h.players[1].dead>0);for(let i=0;i<60;i++)h.tick(.03);assert.equal(h.players[1].dead,0);
const c=new Arcade('carryball');c.join('a','A');c.join('b','B');c.start();Object.assign(c.ball,{x:1170,y:360,lock:0});c.tick(.03);assert.equal(c.teams[0],1);console.log('PASS punch totals, hungry absorption/respawn, carry goal');

function carryGame(){const game=new Arcade('carryball');game.join('a','A');game.join('rival','Rival');game.join('mate','Mate');game.start();game.ball.owner='a';game.ball.lock=0;return game;}
for(const [label,input,expected] of [
 ['right',{x:1,y:0,action:'pass'},[600,0]],
 ['left',{x:-1,y:0,action:'pass'},[-600,0]],
 ['up',{x:0,y:-1,action:'pass'},[0,-600]],
 ['down',{x:0,y:1,action:'pass'},[0,600]]
]){const game=carryGame();Object.assign(game.players[2],{x:game.players[0].x-100,y:game.players[0].y});game.input('a',input);assert.equal(Math.round(game.ball.vx),expected[0],label+' pass x');assert.equal(Math.round(game.ball.vy),expected[1],label+' pass y');}
const moving=carryGame();Object.assign(moving.players[0],{input:{x:0,y:0},vx:-120,vy:40});moving.input('a',{action:'pass'});assert(moving.ball.vx<0&&moving.ball.vy>0,'neutral input follows current movement');
const facing=carryGame();facing.input('a',{x:0,y:-1});Object.assign(facing.players[0],{vx:0,vy:0});facing.ball.owner='a';facing.input('a',{action:'pass'});assert(Math.abs(facing.ball.vx)<1&&facing.ball.vy<0,'stopped player keeps last facing');
const fallback=carryGame();Object.assign(fallback.players[0],{input:{x:0,y:0},facing:{x:0,y:0},vx:0,vy:0});fallback.input('a',{action:'pass'});assert(fallback.ball.vx>0&&Math.abs(fallback.ball.vy)<1,'stationary team zero falls back toward attack');
const teamOne=carryGame();teamOne.ball.owner='rival';Object.assign(teamOne.players[1],{input:{x:0,y:0},facing:{x:0,y:0},vx:0,vy:0});teamOne.input('rival',{action:'pass'});assert(teamOne.ball.vx<0&&Math.abs(teamOne.ball.vy)<1,'stationary team one falls back toward attack');
console.log('PASS carryball directional pass input/movement/facing/fallback');
