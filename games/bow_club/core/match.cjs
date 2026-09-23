'use strict';
const crypto=require('node:crypto');
const TARGETS=Object.freeze([{id:0,u:.27,v:.53,r:74},{id:1,u:.50,v:.42,r:96},{id:2,u:.73,v:.53,r:74}]);
class BowMatch {
 constructor(){this.aspect=16/9;this.players=[];this.phase='waiting';this.revision=1;this.serial=0;this.hit=null;this.hitHistory=[];this.result=null;}
 add(profile){let p=this.players.find(p=>p.id===profile.id);if(p){p.connected=true;return p;}if(this.phase==='waiting')this.players=this.players.filter(p=>p.connected);if(this.players.length>=6||this.phase!=='waiting')return null;p={id:profile.id,name:String(profile.name||'Лучник').replace(/[<>\x00-\x1f]/g,'').slice(0,24),color:['#7ed268','#b08beb','#ef916a','#62d3e1','#eac44f','#e881a1'][this.players.length],score:0,shots:0,connected:true,drawAt:null,lastSeq:0,lastShot:-Infinity};this.players.push(p);return p;}
 disconnect(id){const p=this.players.find(p=>p.id===id);if(p){p.connected=false;p.drawAt=null;}}
 start(settings={},now=0){const ps=this.players.filter(p=>p.connected);if(this.phase!=='waiting'||!ps.length)return false;this.serial++;this.revision++;this.phase='playing';this.mode=['coop','teams'].includes(settings.mode)?settings.mode:'versus';this.arrows=[5,10,15].includes(Number(settings.arrows))?Number(settings.arrows):10;this.motionAt=now;this.motionPhase=0;this.motionDifficulty=0;this.startedAt=now;this.deadline=now+180000;this.hit=null;this.hitHistory=[];this.result=null;for(let i=0;i<this.players.length;i++)Object.assign(this.players[i],{participant:this.players[i].connected,team:i%2,score:0,shots:0,drawAt:null,lastShot:-Infinity});return true;}
 reset(){if(this.phase!=='results')return false;this.phase='waiting';this.result=null;this.hit=null;this.hitHistory=[];this.revision++;return true;}
 targetsAt(now){
  const dt=Math.max(0,Math.min(.25,(now-(this.motionAt??now))/1000));this.motionAt=now;
  const participants=this.players.filter(p=>p.participant),turn=participants.length?Math.min(...participants.map(p=>p.shots)):0;
  const target=this.phase==='playing'?Math.min(1,turn/8):0;
  this.motionDifficulty=(this.motionDifficulty||0)+(target-(this.motionDifficulty||0))*(1-Math.exp(-dt*1.4));
  this.motionPhase=(this.motionPhase||0)+dt*(.22+this.motionDifficulty*.6);
  return TARGETS.map((t,i)=>({...t,u:t.u+Math.sin(this.motionPhase+i*1.8)*.065*this.motionDifficulty,v:t.v+Math.sin(this.motionPhase*.7+i*2.1)*.035*this.motionDifficulty}));
 }
 validTracking(d){return d&&Number.isFinite(d.quality)&&d.quality>=.6&&d.quality<=1&&Number.isFinite(d.ageMs)&&d.ageMs>=0&&d.ageMs<=320&&d.revision===this.revision;}
 draw(id,d,now){const p=this.players.find(p=>p.id===id);if(this.phase!=='playing'||!p?.participant||!p.connected||p.shots>=this.arrows||!this.validTracking(d)||now-p.lastShot<350)return false;p.drawAt=now;return true;}
 cancel(id){const p=this.players.find(p=>p.id===id);if(p)p.drawAt=null;}
 shoot(id,d,now){
  const p=this.players.find(p=>p.id===id);if(!p||this.phase!=='playing'||!p.participant||!p.connected)return {ok:false,reason:'waiting'};
  if(!Number.isSafeInteger(d.seq)||d.seq<=p.lastSeq)return {ok:false,reason:'replay'};p.lastSeq=d.seq;
  const drawAt=p.drawAt;p.drawAt=null;
  if(p.shots>=this.arrows)return {ok:false,reason:'no-arrows'};
  if(drawAt===null||now-drawAt<165||now-drawAt>5000)return {ok:false,reason:'draw-too-short'};
  if(!this.validTracking(d))return {ok:false,reason:'tracking-lost'};
  if(!Number.isFinite(d.u)||!Number.isFinite(d.v)||d.u<0||d.u>1||d.v<0||d.v>1)return {ok:false,reason:'outside-screen'};
  if(now-p.lastShot<350)return {ok:false,reason:'cooldown'};
  let points=0,target=null;for(const t of this.targetsAt(now)){const distance=Math.hypot((d.u-t.u)*720*this.aspect,(d.v-t.v)*720);if(distance<t.r){const score=distance<t.r*.18?100:distance<t.r*.54?60:25;if(score>points){points=score;target=t.id;}}}
  p.lastShot=now;p.shots++;p.score+=points;const result={ok:true,points,target,u:d.u,v:d.v,pull:Math.min(1,(now-drawAt)/1100),id:crypto.randomUUID(),player:id,name:p.name,at:now};this.hit=result;this.hitHistory.push(result);if(this.hitHistory.length>90)this.hitHistory.shift();this.step(now);return result;
 }
 step(now){if(this.phase!=='playing')return;const ps=this.players.filter(p=>p.participant);if(now<this.deadline&&!ps.every(p=>p.shots>=this.arrows))return;this.phase='results';const total=ps.reduce((n,p)=>n+p.score,0),teams=[0,0];for(const p of ps)teams[p.team]+=p.score;const best=Math.max(...ps.map(p=>p.score));this.result={eventId:'bow-club-'+this.serial+'-'+this.revision,cooperative:this.mode==='coop',reason:now>=this.deadline?'time-limit':'arrows-complete',total,teamScores:teams,players:ps.map(p=>({id:p.id,name:p.name,score:p.score,won:this.mode==='coop'?total>=ps.length*this.arrows*50:this.mode==='teams'?teams[p.team]===Math.max(...teams):p.score===best,metrics:{arrows:p.shots,points:p.score}}))};}
 snapshot(now){return {aspect:this.aspect,phase:this.phase,revision:this.revision,serial:this.serial,mode:this.mode||'versus',arrows:this.arrows||10,remaining:Math.max(0,Math.ceil((this.deadline-now)/1000))||0,targets:this.targetsAt(now),players:this.players.map(({drawAt,lastSeq,lastShot,...p})=>p),hit:this.hit,hits:this.hitHistory.map(x=>({...x})),result:this.result};}
}
module.exports={BowMatch,TARGETS};
