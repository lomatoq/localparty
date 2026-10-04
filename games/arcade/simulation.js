'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const {overlaps,recover}=require('../../lib/tv-playfield-bounds');
const CARRY_ACTOR_ENVELOPE=44; // Complete 64-unit runner rig, gait and soft foot shadow.
const CARRY_BALL_ENVELOPE=13; // Half the authored26-unit ball sprite; existing outer-wall bounds stay unchanged.
const CARRY_HUD_BOUNCE=.65;
const MODES={taprace:{title:'Tap Race',seconds:45},punchmeter:{title:'Punch Meter',seconds:75},flappy:{title:'Multiplayer Flappy',seconds:30},hungry:{title:'Hungry Arena',seconds:120},snakelines:{title:'Snake Lines',seconds:90},carryball:{title:'Carry Ball',seconds:120}};
class Arcade {
 setVisibleHudLayout(layout){if(this.mode!=='carryball')return;this.visibleHudLayout=layout;for(const p of this.players)this.keepCarryActorVisible(p);this.keepCarryBallVisible();}
 keepCarryActorVisible(p){
  const layout=this.visibleHudLayout;if(this.mode!=='carryball'||!layout?.exclusions.some(rect=>overlaps(p.x,p.y,CARRY_ACTOR_ENVELOPE,rect)))return;
  const point=recover(p,CARRY_ACTOR_ENVELOPE,layout);if(!point)return;
  if(point.x!==p.x)p.vx=0;if(point.y!==p.y)p.vy=0;p.x=point.x;p.y=point.y;
 }
 keepCarryBallVisible(){
  const layout=this.visibleHudLayout,b=this.ball;if(!layout?.exclusions.some(rect=>overlaps(b.x,b.y,CARRY_BALL_ENVELOPE,rect)))return;
  const point=recover(b,CARRY_BALL_ENVELOPE,layout);if(!point)return;
  const dx=point.x-b.x,dy=point.y-b.y,length=Math.hypot(dx,dy),nx=dx/length,ny=dy/length,approach=b.vx*nx+b.vy*ny;
  b.x=point.x;b.y=point.y;
  if(approach<0){b.vx-=(1+CARRY_HUD_BOUNCE)*approach*nx;b.vy-=(1+CARRY_HUD_BOUNCE)*approach*ny;}
 }
 moveCarryBall(dt){
  const b=this.ball,rects=this.visibleHudLayout?.exclusions||[];this.keepCarryBallVisible();
  let remaining=dt;
  // Sweep the whole ball envelope so a fast pass cannot tunnel through a cap.
  for(let bounce=0;bounce<8&&remaining>0;bounce++){
   const dx=b.vx*remaining,dy=b.vy*remaining;let first=null;
   const consider=(time,nx,ny)=>{if(time<0||time>1||dx*nx+dy*ny>=0||first&&time>=first.time)return;first={time,nx,ny};};
   for(const rect of rects){
    const right=rect.x+rect.w,bottom=rect.y+rect.h;
    if(dx)for(const[x,nx]of[[rect.x-CARRY_BALL_ENVELOPE,-1],[right+CARRY_BALL_ENVELOPE,1]]){const time=(x-b.x)/dx,y=b.y+dy*time;if(y>=rect.y&&y<=bottom)consider(time,nx,0);}
    if(dy)for(const[y,ny]of[[rect.y-CARRY_BALL_ENVELOPE,-1],[bottom+CARRY_BALL_ENVELOPE,1]]){const time=(y-b.y)/dy,x=b.x+dx*time;if(x>=rect.x&&x<=right)consider(time,0,ny);}
    // Rounded corners use the same circle-vs-rectangle envelope as overlaps().
    const a=dx*dx+dy*dy;if(!a)continue;
    for(const x of[rect.x,right])for(const y of[rect.y,bottom]){
     const ox=b.x-x,oy=b.y-y,v=2*(ox*dx+oy*dy),c=ox*ox+oy*oy-CARRY_BALL_ENVELOPE**2,discriminant=v*v-4*a*c;if(discriminant<0)continue;
     const time=(-v-Math.sqrt(discriminant))/(2*a),nx=(ox+dx*time)/CARRY_BALL_ENVELOPE,ny=(oy+dy*time)/CARRY_BALL_ENVELOPE;consider(time,nx,ny);
    }
   }
   if(!first){b.x+=dx;b.y+=dy;return;}
   b.x+=dx*first.time+first.nx*1e-7;b.y+=dy*first.time+first.ny*1e-7;
   const approach=b.vx*first.nx+b.vy*first.ny;
   b.vx-=(1+CARRY_HUD_BOUNCE)*approach*first.nx;b.vy-=(1+CARRY_HUD_BOUNCE)*approach*first.ny;
   remaining*=1-first.time;
  }
 }
 constructor(mode,random=Math.random){if(!MODES[mode])throw Error('Unknown mode');this.mode=mode;this.random=random;this.players=[];this.phase='lobby';this.time=0;this.timer=0;this.round=0;this.trailGrid=new Map();this.food=[];this.foodSequence=0;this.pipes=[];this.ball={x:600,y:360,vx:0,vy:0,owner:null,lock:0};this.teams=[0,0];this.bag={angle:0,velocity:0,tilt:0,tiltVelocity:0};}
 join(id,name){let p=this.players.find(p=>p.id===id);if(p){p.connected=true;p.input={x:0,y:0};p.inputAt=this.time;return p;}if(this.players.length>=16)return null;const team=this.players.length%2;p={id,name,connected:true,color:['#b9ff4d','#58dafa','#ff6b96','#c295ff','#ffc45c','#53ebac','#ff9060','#a1bcff'][this.players.length%8],score:0,team,input:{x:0,y:0},inputAt:0,facing:{x:team?-1:1,y:0},lastTap:-1,lastPunch:-5,hits:[],trail:[],alive:true};this.players.push(p);this.spawn(p,this.players.length-1);return p;}
 spawn(p,i){p.input={x:0,y:0};p.inputAt=this.time;p.x=100+(i%4)*300;p.y=100+Math.floor(i/4)*160;p.vx=p.vy=0;p.mass=20;p.dead=0;p.shield=2;p.angle=i*Math.PI/8;p.progress=0;p.alive=true;p.trail=[];if(this.mode==='flappy'){p.x=230;p.y=340;}if(this.mode==='carryball'){p.x=p.team?920:280;p.y=120+(Math.floor(i/2)%8)*65;p.facing={x:p.team?-1:1,y:0};this.keepCarryActorVisible(p);}}
 start(){if(this.players.filter(p=>p.connected).length<2)return false;this.phase='playing';this.countdown=this.mode==='flappy'?3:0;this.time=0;this.timer=MODES[this.mode].seconds;this.round=1;this.roundWait=0;this.trailGrid.clear();this.teams=[0,0];this.pipes=[];this.food=[];this.bag={angle:0,velocity:0,tilt:0,tiltVelocity:0};this.players.forEach((p,i)=>{p.score=0;p.hits=[];p.lastTap=-1;p.lastPunch=-5;this.spawn(p,i);});this.resetBall();for(let i=0;i<70;i++)this.addFood();return true;}
 punchPlayer(){return this.players.filter(p=>p.connected&&p.hits.length<3).sort((a,b)=>a.hits.length-b.hits.length)[0];}
 resetBall(){Object.assign(this.ball,{x:600,y:360,vx:0,vy:0,owner:null,lock:1});if(this.mode==='carryball')this.keepCarryBallVisible();}
 addFood(){this.food.push({id:++this.foodSequence,x:30+this.random()*1140,y:30+this.random()*660,kind:Math.floor(this.random()*4)});}
 input(id,d){const p=this.players.find(p=>p.id===id);if(!p||!p.connected||this.phase!=='playing'||this.countdown>0)return;p.input={x:clamp(Number(d.x)||0,-1,1),y:clamp(Number(d.y)||0,-1,1)};p.inputAt=this.time;const inputLength=Math.hypot(p.input.x,p.input.y);if(this.mode==='carryball'&&inputLength>.12)p.facing={x:p.input.x/inputLength,y:p.input.y/inputLength};if(d.action==='tap'&&this.time-p.lastTap>=.065){p.lastTap=this.time;if(this.mode==='taprace'){p.vx+=28;}if(this.mode==='flappy'&&p.alive)p.vy=-360;}
 if(d.action==='punch'&&this.mode==='punchmeter'&&this.punchPlayer()?.id===id&&p.hits.length<3&&this.time-p.lastPunch>1.5){p.lastPunch=this.time;const power=clamp(Number(d.power)||0,0,1),score=Math.round(100+900*power);p.hits.push(score);p.score=p.hits.reduce((a,b)=>a+b,0);this.bag.velocity+=.35+power*power*6.5;const side=clamp(Number(d.side)||0,-1,1);this.bag.tiltVelocity+=side*(.5+power*1.4);this.bag.last={id:p.id,power,score,time:this.time};}
 if(d.action==='pass'&&this.mode==='carryball'&&this.ball.owner===id){const movementLength=Math.hypot(p.vx,p.vy),facingLength=Math.hypot(p.facing?.x||0,p.facing?.y||0);let dx,dy;if(inputLength>.12){dx=p.input.x/inputLength;dy=p.input.y/inputLength;}else if(movementLength>8){dx=p.vx/movementLength;dy=p.vy/movementLength;}else if(facingLength>.12){dx=p.facing.x/facingLength;dy=p.facing.y/facingLength;}else{dx=p.team?-1:1;dy=0;}Object.assign(this.ball,{owner:null,vx:dx*600,vy:dy*600,lock:.35});}}
 finish(){this.phase='finished';if(this.mode==='carryball')this.players.forEach(p=>p.score=this.teams[p.team]);if(this.mode==='hungry')this.players.forEach(p=>p.score=Math.round(p.mass));}
 tick(dt){dt=Math.min(.05,dt);if(this.mode==='punchmeter'){this.bag.velocity+=(-8*Math.sin(this.bag.angle)-this.bag.velocity*.7)*dt;this.bag.angle+=this.bag.velocity*dt;this.bag.tiltVelocity=(this.bag.tiltVelocity||0)+(-10*Math.sin(this.bag.tilt||0)-(this.bag.tiltVelocity||0)*1.3)*dt;this.bag.tilt=(this.bag.tilt||0)+this.bag.tiltVelocity*dt;}if(this.phase!=='playing')return;if(this.countdown>0){this.countdown=Math.max(0,this.countdown-dt);return;}this.time+=dt;this.timer=Math.max(0,this.timer-dt);const ps=this.players.filter(p=>p.connected);for(const p of ps)if((p.input.x||p.input.y)&&this.time-(p.inputAt||0)>.5)p.input={x:0,y:0};
 if(this.mode==='taprace'){for(const p of ps){p.vx*=Math.exp(-dt*1.5);p.progress+=p.vx*dt;p.score=Math.round(p.progress);if(p.progress>=2000){p.score=2000;this.finish();}}}
 if(this.mode==='punchmeter'){if(ps.every(p=>p.hits.length===3))this.finish();}
 if(this.mode==='flappy'){if(!this.pipes.length||this.pipes.at(-1).x<960)this.pipes.push({x:1240,gap:180+this.random()*360});for(const pipe of this.pipes)pipe.x-=190*dt;this.pipes=this.pipes.filter(p=>p.x>-100);for(const p of ps){if(!p.alive)continue;p.vy=Math.min(620,p.vy+1250*dt);p.y+=p.vy*dt;p.score=Math.round(this.time*10);if(this.time<1){p.y=clamp(p.y,20,700);if(p.y===700)p.vy=0;}else if(p.y<15||p.y>705||this.pipes.some(t=>Math.abs(t.x-p.x)<48&&(p.y<t.gap-105||p.y>t.gap+105)))p.alive=false;}if(ps.every(p=>!p.alive))this.finish();}
 if(this.mode==='hungry'||this.mode==='carryball'){for(const p of ps){p.shield=Math.max(0,p.shield-dt);if(p.dead>0){p.dead-=dt;if(p.dead<=0)this.spawn(p,this.players.indexOf(p));continue;}const n=Math.max(1,Math.hypot(p.input.x,p.input.y)),speed=this.mode==='hungry'?240/Math.pow(p.mass/20,.22):(this.ball.owner===p.id?185:245);const response=this.mode==='hungry'?5.5:9,blend=1-Math.exp(-response*dt);p.vx+=(p.input.x/n*speed-p.vx)*blend;p.vy+=(p.input.y/n*speed-p.vy)*blend;p.x=clamp(p.x+p.vx*dt,20,1180);p.y=clamp(p.y+p.vy*dt,20,700);if(p.x===20||p.x===1180)p.vx=0;if(p.y===20||p.y===700)p.vy=0;this.keepCarryActorVisible(p);
 if(this.mode==='hungry'){for(let i=this.food.length-1;i>=0;i--)if(dist(p,this.food[i])<12+Math.sqrt(p.mass)*3){p.mass+=3;this.food.splice(i,1);this.addFood();}p.score=Math.round(p.mass);}}
 // A visible size advantage plus overlapping silhouettes is enough; no hold timer.
 // Spawn protection and the return delay prevent repeatedly farming the same blob.
 if(this.mode==='hungry'){for(const p of ps)for(const q of ps)if(p!==q&&!p.dead&&!q.dead&&q.shield<=0&&p.mass>q.mass*1.05&&dist(p,q)<=.9*3.6*(Math.sqrt(p.mass)+Math.sqrt(q.mass))){p.mass+=q.mass*.7;p.score=Math.round(p.mass);q.dead=1.5;q.mass=20;q.score=20;}}
 else {const b=this.ball;b.lock=Math.max(0,b.lock-dt);const owner=ps.find(p=>p.id===b.owner);if(owner){b.x=owner.x;b.y=owner.y;this.keepCarryBallVisible();for(const q of ps)if(q.team!==owner.team&&dist(q,owner)<39&&b.lock===0){b.owner=null;b.vx=(q.vx-owner.vx)*.8;b.vy=(q.vy-owner.vy)*.8;b.lock=.6;break;}}else{this.moveCarryBall(dt);b.x=clamp(b.x,10,1190);b.y=clamp(b.y,10,710);if((b.x===10&&b.vx<0)||(b.x===1190&&b.vx>0))b.vx*=-.65;if((b.y===10&&b.vy<0)||(b.y===710&&b.vy>0))b.vy*=-.65;b.vx*=Math.exp(-dt*1.15);b.vy*=Math.exp(-dt*1.15);if(b.lock===0){const pick=ps.find(p=>dist(p,b)<32);if(pick){b.owner=pick.id;b.lock=.5;}}}if(b.y>240&&b.y<480&&(b.x<45||b.x>1155)){this.teams[b.x>1155?0:1]++;this.resetBall();}}
 }
 if(this.mode==='snakelines'){if(this.roundWait>0){this.roundWait-=dt;if(this.roundWait<=0){this.round++;this.trailGrid.clear();ps.forEach((p,i)=>this.spawn(p,i));}}else{for(const p of ps){if(!p.alive)continue;if(Math.hypot(p.input.x,p.input.y)>.15){const desired=Math.atan2(p.input.y,p.input.x),delta=Math.atan2(Math.sin(desired-p.angle),Math.cos(desired-p.angle));p.angle+=clamp(delta,-6*dt,6*dt);}p.x+=Math.cos(p.angle)*115*dt;p.y+=Math.sin(p.angle)*115*dt;if(p.x<10||p.x>1190||p.y<10||p.y>710)p.alive=false;const cx=Math.floor(p.x/16),cy=Math.floor(p.y/16);collision:for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const t of this.trailGrid.get((cx+dx)+','+(cy+dy))||[]){if(t.id===p.id&&t.index>p.trail.length-6)continue;if(dist(t,p)<8){p.alive=false;break collision;}}const last=p.trail.at(-1);if(!last||dist(last,p)>=7){const t={x:Math.round(p.x),y:Math.round(p.y)},key=cx+','+cy;if(!this.trailGrid.has(key))this.trailGrid.set(key,[]);this.trailGrid.get(key).push({...t,id:p.id,index:p.trail.length});p.trail.push(t);}}const alive=ps.filter(p=>p.alive);if(alive.length<=1){if(alive[0])alive[0].score++;this.roundWait=2;if(this.round>=5)this.finish();}}}
 if(this.timer<=0)this.finish();}
 view(){return {punchTurn:this.mode==='punchmeter'?this.punchPlayer()?.id:null,mode:this.mode,title:MODES[this.mode].title,phase:this.phase,countdown:this.countdown||0,timer:this.timer,time:this.time,round:this.round,roundWait:this.roundWait,players:this.players.map(({input,ws,...p})=>p),food:this.mode==='hungry'?this.food:[],pipes:this.pipes,bag:this.bag,ball:this.ball,teams:this.teams,...(this.mode==='carryball'?{visibleHudLayout:this.visibleHudLayout||null,actorEnvelope:CARRY_ACTOR_ENVELOPE}:{}),W:1200,H:720};}
}
module.exports={Arcade,MODES};
