const assert=require('node:assert/strict');
const {Poker,evaluate,compare}=require('../games/tabletop/poker');
const {Mines,Hockey}=require('../games/tabletop/arcade');
const {collect}=require('../games/tankarena/powerups');
const players=n=>Array.from({length:n},(_,i)=>({id:String(i),name:'Player '+i,connected:true,color:'#c4ff71'}));
assert.equal(evaluate([8,9,10,11,12,15,30])[0],8,'royal flush');
assert.equal(evaluate([12,0,1,2,3,20,31])[1],5,'ace-low straight');
assert(compare(evaluate([0,13,26,39,8,9,10]),evaluate([1,14,27,2,15,4,6]))>0,'quads beat full house');
for(let count=2;count<=8;count++){
 const g=new Poker(players(count));assert(!JSON.stringify(g.view(null)).includes('deck'));assert(g.view(null).players.every(p=>p.hole.every(c=>c===-1)));
 for(let i=0;i<1000&&g.phase==='playing';i++){
  if(g.stage==='showdown'){g.step(6.1);continue;}
  const p=g.players[g.turn];assert(p,'valid turn');assert(g.action(p.id,'call'));
  const chips=g.players.reduce((n,p)=>n+p.chips+(g.stage==='showdown'?0:p.total),0);assert.equal(chips,count*1000,'chip conservation');
 }
 assert.equal(g.phase,'results');assert.equal(g.hand,5);
}
const p=new Poker(players(3));const actor=p.players[p.turn];assert.equal(p.action(actor.id,'raise',NaN),false);assert.equal(p.action('unknown','fold'),false);
p.players.forEach((q,i)=>{q.total=[50,100,100][i];q.chips=[0,0,0][i];q.inHand=true;q.folded=false;});p.board=[0,2,4,6,8];p.players[0].hole=[10,12];p.players[1].hole=[13,26];p.players[2].hole=[14,27];p.showdown();assert.equal(p.players.reduce((s,q)=>s+q.chips,0),250,'side pots conserve chips');
for(let n=0;n<100;n++){const m=new Mines(players(8));assert(m.view().cells.every(c=>!('mine'in c)));assert(m.action('0','open',55));assert(!m.cells[55].mine);assert(m.neighbors(55).every(i=>!m.cells[i].mine));const score=m.players[0].score;assert(!m.action('1','open',55));assert.equal(m.players[0].score,score);assert.equal(m.cells.filter(c=>c.mine).length,16);assert(!m.action('0','open',-1));}
assert.throws(()=>new Hockey(players(3)),/equal teams/);
for(const count of [2,4,6,8]){const h=new Hockey(players(count));for(let i=0;i<10000;i++){if(i%20===0)h.players.forEach(p=>h.action(p.id,'move',{x:Math.random()*1000,y:Math.random()*600}));h.step(1/60);assert(Number.isFinite(h.puck.x)&&Number.isFinite(h.puck.y));h.players.forEach(p=>assert(p.x>=30&&p.x<=970&&p.y>=26&&p.y<=574));}assert.equal(h.phase,'results');assert(h.players.every(p=>p.score===h.goals[p.team]*100));}
const contact=new Hockey(players(2),()=>.25);contact.serveAt=0;contact.players[0].x=180;contact.players[0].y=300;contact.players[0].target={x:180,y:300};contact.puck={x:205,y:300,vx:-240,vy:0};contact.step(1/120);assert(Math.hypot(contact.puck.x-contact.players[0].x,contact.puck.y-contact.players[0].y)>=Hockey.MALLET_RADIUS+Hockey.PUCK_RADIUS-.001,'hockey sprites resolve edge-to-edge without overlap');
const tank={hp:80,shield:0,boost:0};collect(tank,{kind:'heal'});assert.equal(tank.hp,100);collect(tank,{kind:'shield'});assert.equal(tank.shield,5);collect(tank,{kind:'boost'});assert.equal(tank.boost,6);
console.log('PASS poker ranking, hidden cards, chip conservation, side pots, 2–8 players; safe mines; 2/4/6/8 hockey simulation; powerups');
