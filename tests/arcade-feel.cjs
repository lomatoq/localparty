const assert=require('node:assert/strict'),{Arcade}=require('../games/arcade/simulation');
const game=mode=>{const g=new Arcade(mode,()=>.5);g.join('a','A');g.join('b','B');g.start();return g},step=(g,t)=>{for(let i=0;i<Math.ceil(t/.02);i++)g.tick(.02)};
const tap=game('taprace');tap.input('a',{action:'tap'});const impulse=tap.players[0].vx;step(tap,.1);const before=tap.players[0].vx;tap.input('a',{action:'tap'});assert(Math.abs(tap.players[0].vx-before-impulse)<1e-8);assert(!('fatigue' in tap.players[0]));
for(const mode of ['hungry','carryball']){const g=game(mode),p=g.players[0];g.food=[];g.input('a',{x:1});g.tick(.02);assert(p.vx>0&&p.vx<50);step(g,.3);const v=p.vx;g.input('a',{x:0});g.tick(.02);assert(p.vx>0&&p.vx<v);}
const snake=game('snakelines');snake.players[0].x=600;snake.players[0].y=360;snake.players[0].angle=Math.PI;snake.input('a',{x:0,y:-1});step(snake,.35);assert(Math.abs(snake.players[0].angle-Math.PI*1.5)<.1);
const flappy=game('flappy');flappy.input('a',{action:'tap'});assert.equal(flappy.players[0].vy,-360);step(flappy,.2);assert(flappy.players[0].vy>-360&&flappy.players[0].vy<0);step(flappy,.2);assert(flappy.players[0].vy>0);
const ball=game('carryball');Object.assign(ball.ball,{owner:null,x:600,y:350,vx:500,lock:1});ball.tick(.02);assert(ball.ball.vx>450&&ball.ball.vx<500);
console.log('PASS equal tap impulses; player acceleration/coast; screen-relative snake; flap impulse/gravity; ball momentum');
