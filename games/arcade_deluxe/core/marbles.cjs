'use strict';
const {BaseGame,clamp,finite,lerp,segmentDistance}=require('./common.cjs');
const Geo=require('../public/geometry.js');
const D=34,R=17;
const LEVELS=[
 {name:'Сад орбит',tone:0,points:[[-40,465],[105,455],[155,260],[275,166],[585,150],[965,159],[1110,242],[1120,452],[1012,567],[645,594],[310,565],[237,440],[295,325],[450,277],[858,281],[977,351],[948,455],[832,502]]},
 {name:'Серпантин',tone:1,points:[[-45,200],[200,184],[350,231],[426,495],[558,587],[913,579],[1107,490],[1098,283],[941,167],[632,157],[528,225],[556,297],[847,314],[952,408],[849,493],[690,482]]},
 {name:'Лунная петля',tone:2,points:[[132,-40],[138,220],[232,482],[432,587],[804,590],[1077,491],[1151,303],[1045,170],[762,137],[404,160],[303,270],[336,381],[435,440],[513,502],[897,506],[980,422],[920,346],[827,327]]},
 {name:'Янтарный путь',tone:3,points:[[-40,544],[216,545],[231,283],[357,169],[907,164],[1096,241],[1090,522],[906,593],[573,579],[377,469],[379,323],[520,277],[841,277],[934,355],[907,472],[809,509]]},
 {name:'Двойной изгиб',tone:4,points:[[-40,190],[187,163],[313,213],[304,492],[440,578],[863,580],[1120,492],[1120,292],[982,170],[673,146],[480,205],[427,295],[462,387],[534,493],[807,509],[973,422],[875,314],[783,316]]},
 {name:'Последняя орбита',tone:5,points:[[1144,-40],[1137,228],[1120,487],[950,593],[646,609],[314,565],[146,424],[199,236],[399,148],[833,143],[1021,226],[1010,402],[900,491],[578,515],[392,451],[363,336],[463,267],[836,280],[878,354]]}
];
function spline(points){const samples=[];let s=0,prev=null;for(let i=0;i<points.length-1;i++){const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];for(let k=0;k<28;k++){const t=k/28,t2=t*t,t3=t2*t;const xy=[0,1].map(a=>.5*((2*p1[a])+(-p0[a]+p2[a])*t+(2*p0[a]-5*p1[a]+4*p2[a]-p3[a])*t2+(-p0[a]+3*p1[a]-3*p2[a]+p3[a])*t3));if(prev)s+=Math.hypot(xy[0]-prev[0],xy[1]-prev[1]);samples.push({x:xy[0],y:xy[1],s});prev=xy;}}const last=points.at(-1);s+=Math.hypot(last[0]-prev[0],last[1]-prev[1]);samples.push({x:last[0],y:last[1],s});return samples;}
const PATHS=LEVELS.map(l=>spline(l.points));
function pointAt(path,s){if(s<=0){const a=path[0],b=path[1],d=b.s||1;return {x:a.x+(b.x-a.x)*s/d,y:a.y+(b.y-a.y)*s/d};}let lo=0,hi=path.length-1;if(s>=path[hi].s)return path[hi];while(hi-lo>1){const m=(lo+hi)>>1;if(path[m].s<s)lo=m;else hi=m;}const a=path[lo],b=path[hi],t=(s-a.s)/(b.s-a.s||1);return {x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)};}
class MarbleBoard extends BaseGame {
 constructor(seed=8){super(seed);this.mode='marble_bloom';this.level=0;this.path=PATHS[0];this.chain=[];this.queue=[];this.shots=[];this.combo=0;this.stage='waiting';this.slowUntil=0;this.reverseUntil=0;this.aimUntil=0;this.ballSerial=0;this.coin=null;}
 add(profile){return super.add(profile,3);}
 origin(p){const ps=this.players.filter(p=>p.participant),i=Math.max(0,ps.indexOf(p)),n=ps.length;return n<=1?{x:652,y:396}:{x:652+Math.cos(i*2*Math.PI/n)*100,y:396+Math.sin(i*2*Math.PI/n)*72};}
 color(){const colors=[...new Set(this.chain.map(b=>b.color))];return this.rng.pick(colors.length?colors:[0,1,2,3,4]);}
 start(settings={}){if(this.phase!=='waiting'||!this.players.some(p=>p.connected))return false;this.roundSerial++;this.t=0;this.result=null;this.events=[];this.phase='playing';this.stage='chain';this.level=clamp(Math.round(finite(settings.level,0)),0,5);this.startLevel=this.level;this.levelCount=clamp(Math.round(finite(settings.levels,3)),1,6-this.level);this.combo=0;for(const p of this.players){p.participant=p.connected;p.score=0;p.nextShot=0;p.aim={x:700,y:190};p.shotsFired=0;p.matches=0;p.bestCombo=0;p.nextSwap=0;p.botAt=0;}this.setupLevel();return true;}
 setupLevel(){
  this.path=PATHS[this.level];this.chain=[];this.queue=[];this.shots=[];this.stage='chain';this.slowUntil=this.reverseUntil=this.aimUntil=0;this.combo=0;this.lastMatch=-100;
  const total=58+this.level*8+this.players.filter(p=>p.participant).length*5;let color=this.rng.int(5);
  for(let i=0;i<total;i++){if(i%2===0)color=(color+1+this.rng.int(4))%5;const power=i>8&&i%13===0?['slow','reverse','bomb','focus'][Math.floor(i/13)%4]:null;this.queue.push({id:++this.ballSerial,color,power,s:0});}
  for(let i=0;i<25;i++){const b=this.queue.shift();b.s=i*D;this.chain.push(b);}
  for(const p of this.players.filter(p=>p.participant)){p.ball=this.color();p.nextBall=this.color();p.nextShot=0;}
  this.coin={x:620+this.rng.next()*180,y:220+this.rng.next()*25,alive:true};this.emit('level',{level:this.level,name:LEVELS[this.level].name});
 }
 input(id,type,d={}){
  const p=this.players.find(p=>p.id===id);if(this.phase!=='playing'||this.stage!=='chain'||!p?.participant)return false;
  if(type==='aim'){if(Number.isFinite(d.x)&&Number.isFinite(d.y))p.aim={x:clamp(d.x,0,1280),y:clamp(d.y,0,720)};return true;}
  if(type==='swap'&&this.t>=(p.nextSwap||0)){[p.ball,p.nextBall]=[p.nextBall,p.ball];p.nextSwap=this.t+.15;return true;}
  if(type==='fire'&&this.t>=p.nextShot){const o=this.origin(p),dx=p.aim.x-o.x,dy=p.aim.y-o.y,l=Math.hypot(dx,dy);if(l<.001)return false;p.nextShot=this.t+.24;p.shotsFired++;this.shots.push({id:++this.ballSerial,owner:p.id,color:p.ball,x:o.x+dx/l*30,y:o.y+dy/l*30,vx:dx/l*920,vy:dy/l*920,age:0});p.ball=this.chain.some(b=>b.color===p.nextBall)?p.nextBall:this.color();p.nextBall=this.color();this.emit('muzzle',{x:o.x,y:o.y,color:p.color,player:p.id});return true;}return false;
 }
 insert(index,shot,x,y){
  const b=this.chain[index],a=pointAt(this.path,b.s-3),c=pointAt(this.path,b.s+3),q=pointAt(this.path,b.s);const ahead=(x-q.x)*(c.x-a.x)+(y-q.y)*(c.y-a.y)>0;const at=index+(ahead?1:0);
  const ball={id:++this.ballSerial,s:b.s+(ahead?D:-D),color:shot.color,power:null,owner:shot.owner};if(at>0)ball.s=Math.max(ball.s,this.chain[at-1].s+D);this.chain.splice(at,0,ball);
  for(let i=at+1;i<this.chain.length;i++)this.chain[i].s=Math.max(this.chain[i].s,this.chain[i-1].s+D);
  this.emit('insert',{x:q.x,y:q.y,color:shot.color});this.matchAt(at,shot.owner,false);
 }
 matchAt(index,owner,cascade=false){
  const ball=this.chain[index];if(!ball)return false;let a=index,b=index;
  while(a>0&&this.chain[a-1].color===ball.color&&this.chain[a].s-this.chain[a-1].s<=D+1)a--;
  while(b<this.chain.length-1&&this.chain[b+1].color===ball.color&&this.chain[b+1].s-this.chain[b].s<=D+1)b++;
  if(b-a+1<3)return false;
  const removed=this.chain.splice(a,b-a+1);this.combo=cascade?this.combo+1:(this.t-this.lastMatch<2.3?this.combo+1:1);this.combo=clamp(this.combo,1,12);this.lastMatch=this.t;this.lastOwner=owner;
  const p=this.players.find(p=>p.id===owner),score=removed.length*100*this.combo;if(p){p.score+=score;p.matches++;p.bestCombo=Math.max(p.bestCombo||0,this.combo);}
  let bomb=null;for(const r of removed){const xy=pointAt(this.path,r.s);this.emit('pop',{...xy,color:r.color,combo:this.combo});if(r.power==='slow')this.slowUntil=this.t+5;if(r.power==='reverse')this.reverseUntil=this.t+2.6;if(r.power==='focus')this.aimUntil=this.t+7;if(r.power==='bomb')bomb=xy;if(r.power)this.emit('power',{...xy,power:r.power});}
  if(bomb){const extra=this.chain.filter(b=>{const q=pointAt(this.path,b.s);return Math.hypot(q.x-bomb.x,q.y-bomb.y)<105;});const ids=new Set(extra.map(b=>b.id));this.chain=this.chain.filter(b=>!ids.has(b.id));for(const b of extra)this.emit('pop',{...pointAt(this.path,b.s),color:b.color});if(p)p.score+=extra.length*100;this.emit('blast',{...bomb,r:105,color:'#ffe5a1'});}
  const xy=pointAt(this.path,removed[Math.floor(removed.length/2)].s);this.emit('score',{...xy,value:score,combo:this.combo,color:p?.color||'#ffffff'});return true;
 }
 step(dt){
  if(this.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,1/30);this.t+=dt;
  if(this.stage==='clear'){if(this.t>=this.clearAt){this.level++;this.setupLevel();}return;}
  const factor=this.t<this.slowUntil?.3:1,reverse=this.t<this.reverseUntil?-2.2:1,speed=(27+this.level*4)*(1+.12*(this.players.filter(p=>p.participant).length-1))*factor*reverse;
  for(const b of this.chain)b.s+=speed*dt;
  // At most one merge per fixed step. Leave a visual gap instead of instantly collapsing the chain.
  for(let i=1;i<this.chain.length;i++){
   const gap=this.chain[i].s-this.chain[i-1].s-D;
   if(gap>.05){const same=this.chain[i].color===this.chain[i-1].color,shift=Math.min(gap,dt*(same?200:65));for(let j=i;j<this.chain.length;j++)this.chain[j].s-=shift;
    if(same&&gap-shift<=.05)this.matchAt(i,this.lastOwner||this.players[0]?.id,true);break;
   }
  }
  // Keep a reversing tail outside the entrance, never compress balls onto the same point.
  if(this.queue.length&&(!this.chain.length||this.chain[0].s>=D)){const b=this.queue.shift();b.s=this.chain.length?this.chain[0].s-D:0;this.chain.unshift(b);}
  const shots=this.shots;this.shots=[];
  for(const shot of shots){shot.age+=dt;const nx=shot.x+shot.vx*dt,ny=shot.y+shot.vy*dt;
   const coinHit=this.coin?.alive?Geo.circleHit(shot.x,shot.y,nx,ny,this.coin.x,this.coin.y,25):null;
   let idx=-1,best=2;
   for(let i=0;i<this.chain.length;i++){const b=this.chain[i];if(b.s< -R)continue;const q=pointAt(this.path,b.s),hit=Geo.circleHit(shot.x,shot.y,nx,ny,q.x,q.y,R+12);if(hit!==null&&hit<best){idx=i;best=hit;}}
   if(coinHit!==null&&coinHit<best){this.coin.alive=false;const p=this.players.find(p=>p.id===shot.owner);if(p)p.score+=500;this.emit('score',{x:this.coin.x,y:this.coin.y,value:500,color:'#ffe38b'});}
   if(idx>=0)this.insert(idx,shot,lerp(shot.x,nx,best),lerp(shot.y,ny,best));else if(shot.age<2&&nx> -60&&nx<1340&&ny> -60&&ny<780){shot.x=nx;shot.y=ny;this.shots.push(shot);}
  }
  for(const p of this.players.filter(p=>p.participant&&p.bot)){if(this.t>=(p.botAt||0)&&this.chain.length){p.botAt=this.t+.38;const candidates=this.chain.filter(b=>b.color===p.ball&&b.s>50);const b=this.rng.pick(candidates.length?candidates:this.chain);const q=pointAt(this.path,b.s);this.input(p.id,'aim',q);this.input(p.id,'fire');}}
  if(this.chain.length&&this.chain.at(-1).s>=this.path.at(-1).s-5){this.finish('chain-reached-gate',true);this.stage='results';}
  else if(!this.chain.length&&!this.queue.length){if(this.level-this.startLevel+1>=this.levelCount){this.finish('victory',true);this.stage='results';}else {this.stage='clear';this.clearAt=this.t+2;this.emit('clear',{level:this.level});}}
 }
 snapshot(){return {mode:this.mode,phase:this.phase,stage:this.stage,t:this.t,roundSerial:this.roundSerial,players:this.players.map(p=>({...p,origin:this.origin(p)})),events:this.events.slice(-80),result:this.result,width:1280,height:720,level:this.level,levelName:LEVELS[this.level].name,levelCount:this.levelCount||3,path:this.path,chain:this.chain.map(b=>({...b,...pointAt(this.path,b.s)})),shots:this.shots.map(s=>({...s})),queue:this.queue.length,combo:this.combo,coin:this.coin,slowUntil:this.slowUntil,reverseUntil:this.reverseUntil,aimUntil:this.aimUntil,progress:this.chain.length?clamp(this.chain.at(-1).s/this.path.at(-1).s,0,1):0};}
}


/** Independent boards for competitive play; shared board for cooperative play.
 * No client owns simulation. Identical starting random state in versus.
 */
class Marbles extends MarbleBoard {
 constructor(seed=8){super(seed);this.matchSeed=seed;this.arenaMode='coop';this.boards=[];this.attackPending=[];}
 reset(){super.reset();this.boards=[];this.attackPending=[];this.arenaMode='coop';}
 start(settings={}){
  if(settings.mode!=='versus'){this.arenaMode='coop';return super.start(settings);}
  if(this.phase!=='waiting'||this.players.filter(p=>p.connected).length<2)return false;
  this.arenaMode='versus';this.phase='playing';this.stage='chain';this.t=0;this.events=[];this.result=null;this.roundSerial++;this.attackPending=[];this.duration=clamp(finite(settings.seconds,180),60,300);
  const ps=this.players.filter(p=>p.connected);
  this.boards=ps.map((profile,i)=>{const b=new MarbleBoard(this.matchSeed+this.roundSerial*773);b.add(profile);b.start({...settings,levels:1});b.players[0].color=profile.color;b.players[0].lane=i;b.players[0].attackAt=-100;b.players[0].lostAt=0;b.sentEvent=0;return b;});
  this.players=this.boards.flatMap(b=>b.players);return true;
 }
 input(id,type,d={}){if(this.arenaMode!=='versus')return super.input(id,type,d);if(this.phase!=='playing')return false;const b=this.boards.find(b=>b.players[0].id===id);return b?b.input(id,type,d):false;}
 disconnect(id){super.disconnect(id);if(this.arenaMode==='versus'){const b=this.boards.find(b=>b.players[0].id===id);if(b)b.disconnect(id);}}
 add(profile){if(this.arenaMode==='versus'&&this.phase!=='waiting'){const p=this.players.find(p=>p.id===profile.id);if(p){p.connected=true;p.lostAt=0;return p;}return null;}return super.add(profile);}
 versusFinish(winners,reason){
  if(this.phase==='results')return;this.phase='results';this.stage='results';
  this.result={eventId:`marble-versus-${this.roundSerial}-${this.matchSeed}`,reason,cooperative:false,players:this.players.map(p=>({id:p.id,name:p.name,score:p.score,won:winners.includes(p.id),metrics:{matches:p.matches||0,bestStreak:p.bestCombo||0}}))};this.emit('finish',{reason});
 }
 step(dt){
  if(this.arenaMode!=='versus')return super.step(dt);if(this.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,1/30);this.t+=dt;
  for(const b of this.boards){
   b.step(dt);const p=b.players[0];if(!p.connected&&this.t-(p.lostAt||0)>12&&b.phase==='playing'){b.finish('disconnected',true);b.stage='results';}
   for(const e of b.events){if(e.id<=b.sentEvent)continue;b.sentEvent=e.id;
    if(e.kind==='score'&&e.combo>=2&&this.t-p.attackAt>1.6){const i=this.boards.indexOf(b),opponents=this.boards.filter((q,j)=>q!==b&&q.phase==='playing').sort((a,z)=>((this.boards.indexOf(a)-i+3)%3)-((this.boards.indexOf(z)-i+3)%3));const target=opponents[0];if(target&&this.attackPending.filter(a=>a.to===target.players[0].id).length<3){p.attackAt=this.t;this.attackPending.push({at:this.t+1.2,to:target.players[0].id,count:Math.min(6,2+e.combo),from:p.id});this.emit('attack',{player:p.id,to:target.players[0].id,count:Math.min(6,2+e.combo)});}}
   }
  }
  const due=this.attackPending.filter(a=>a.at<=this.t);this.attackPending=this.attackPending.filter(a=>a.at>this.t);
  for(const a of due){const b=this.boards.find(b=>b.players[0].id===a.to);if(!b||b.phase!=='playing')continue;const color=b.color();for(let n=0;n<a.count;n++)b.queue.push({id:++b.ballSerial,color:n<2?color:(color+1)%5,power:null,s:0,attack:true});}
  const cleared=this.boards.filter(b=>b.result?.reason==='victory');if(cleared.length)return this.versusFinish(cleared.map(b=>b.players[0].id),'race-complete');
  const living=this.boards.filter(b=>b.phase==='playing');if(living.length<=1){const candidates=living.length?living:this.boards,best=Math.max(...candidates.map(b=>b.players[0].score));return this.versusFinish(candidates.filter(b=>b.players[0].score===best).map(b=>b.players[0].id),'last-board');}
  if(this.t>=this.duration){const best=Math.max(...living.map(b=>b.players[0].score));this.versusFinish(living.filter(b=>b.players[0].score===best).map(b=>b.players[0].id),'time-limit');}
 }
 snapshot(){
  if(this.arenaMode!=='versus')return {...super.snapshot(),arenaMode:'coop'};
  const ss=this.boards.map(b=>b.snapshot()),first=ss[0];return {...first,arenaMode:'versus',roundSerial:this.roundSerial,phase:this.phase,stage:this.stage,t:this.t,duration:this.duration,players:ss.flatMap(b=>b.players),boards:ss,events:this.events.slice(-30),result:this.result,attacks:this.attackPending.map(a=>({...a}))};
 }
}
module.exports={Marbles,MarbleBoard,LEVELS,PATHS,pointAt,D,R};
