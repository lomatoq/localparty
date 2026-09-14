'use strict';
const {clamp,pointCovered}=require('./rules');
// World-space aiming is authoritative. Phones cannot nominate a victim or a score.
class Arcade {
  constructor(mode,players,{random=Math.random}={}) {
    this.mode=mode;this.players=players;this.random=random;this.time=0;this.phase='playing';this.result=null;this.serial=0;
    this.entities=[];this.effects=[];this.events=[];this.eventSerial=0;this.wave=0;this.maxWaves=8;this.hp=240;this.maxHp=240;this.spawnTimer=0;this.breakUntil=2;
    this.deadline=mode==='pop_shots'?120:2;this.message=mode==='gate_siege'?'Защищайте ворота. Огонь можно удерживать!':'Пять точных попаданий — пулемёт. Жёлтых курьеров не трогать!';
    this.obstacles=mode==='pop_shots'?Array.from({length:15},(_,i)=>({id:i,x:-15+(i%5)*7.5,z:-9+Math.floor(i/5)*8,w:3.4,d:3.0,h:1.4+(i%3)*.3})):[];
    players.forEach((p,i)=>Object.assign(p,{score:0,hits:0,shots:0,streak:0,ready:false,boostUntil:0,heat:0,overheatUntil:0,repairUntil:0,aim:{x:0,z:mode==='gate_siege'?-18:0},fire:false,lastInput:-1,lastShot:-10,towerX:-17+34*(i+.5)/players.length,participant:true}));
  }
  input(p,type,d) {
    if(this.phase!=='playing'||!this.players.includes(p))return false;
    if(type==='input'){
      p.aim={x:clamp(d.x,-20,20),z:clamp(d.z,this.mode==='gate_siege'?-34:-14,this.mode==='gate_siege'?7:14)};
      p.fire=d.fire===true;p.lastInput=this.time;return true;
    }
    if(type==='ability'){
      if(this.mode==='pop_shots'&&p.ready&&p.boostUntil<=this.time){p.ready=false;p.boostUntil=this.time+5;this.event(`${p.name}: ПУЛЕМЁТ · 5 секунд`,p.id);return true;}
      if(this.mode==='gate_siege'&&p.repairUntil<=this.time&&this.hp<this.maxHp){this.hp=Math.min(this.maxHp,this.hp+8);p.repairUntil=this.time+12;this.event(`${p.name}: ремонт ворот +8`,p.id);return true;}
    }
    return false;
  }
  event(text,id){this.events.push({id:++this.eventSerial,text,playerId:id,until:this.time+3});if(this.events.length>8)this.events.shift();}
  update(dt){
    if(this.phase!=='playing')return;this.time+=dt;
    this.effects=this.effects.filter(e=>e.until>this.time);this.events=this.events.filter(e=>e.until>this.time);
    for(const p of this.players){
      p.heat=Math.max(0,p.heat-dt*.21);if(!p.connected||this.time-p.lastInput>.45)p.fire=false;
      const rate=this.mode==='gate_siege'?.105:(p.boostUntil>this.time?.08:.27);
      if(p.fire&&this.time-p.lastShot>=rate&&p.overheatUntil<=this.time)this.shoot(p);
    }
    if(this.mode==='gate_siege')this.siege(dt);else this.gallery(dt);
  }
  shoot(p){
    p.lastShot=this.time;p.shots++;if(this.mode==='gate_siege'){p.heat+=.065;if(p.heat>=1){p.overheatUntil=this.time+2;p.heat=1;}}
    let target=null,dist=Infinity;
    const covered=pointCovered(p.aim.x,p.aim.z,this.obstacles);
    for(const e of this.entities){if(e.dead||!e.visible||covered)continue;const d=Math.hypot(e.x-p.aim.x,e.z-p.aim.z);if(d<e.r+.26&&d<dist){dist=d;target=e;}}
    this.effects.push({id:++this.serial,owner:p.id,x:p.aim.x,z:p.aim.z,fromX:p.towerX,hit:!!target,until:this.time+.15});
    if(this.effects.length>90)this.effects.shift();
    if(!target){p.streak=0;return;}
    if(target.friendly){p.score=Math.max(0,p.score-3);p.streak=0;target.dead=true;this.event(`${p.name}: это курьер! −3`,p.id);return;}
    p.hits++;target.hp--;target.flash=this.time+.13;
    if(target.hp<=0){target.dead=true;p.score+=target.elite?3:1;}
    if(this.mode==='pop_shots'){
      p.streak++;
      if(p.streak>=5&&!p.ready&&p.boostUntil<=this.time){p.ready=true;p.streak=0;this.event(`${p.name} заработал пулемёт!`,p.id);}
    }
  }
  siege(dt){
    if(this.breakUntil){if(this.time<this.breakUntil)return;this.breakUntil=0;this.deadline=0;this.wave++;
      const live=Math.max(1,this.players.filter(p=>p.connected).length);
      this.remaining=Math.floor((22+10*live)*(1+.18*(this.wave-1)));this.spawnEvery=Math.max(.025,.18/(.7+live*.25));
      this.event(`ВОЛНА ${this.wave} / ${this.maxWaves}`);this.message='Не подпускайте термитов к воротам!';
    }
    this.spawnTimer-=dt;
    while(this.spawnTimer<=0&&this.remaining>0&&this.entities.length<300){
      this.spawnTimer+=this.spawnEvery;this.remaining--;
      const elite=this.wave>=3&&this.random()<.12;
      this.entities.push({id:++this.serial,x:(this.random()-.5)*37,z:-32-this.random()*5,r:elite?.78:.5,hp:elite?5:2,elite,speed:(elite?1.1:1.65)+this.wave*.13,visible:true,dead:false,seed:this.random()*6.28});
    }
    let damage=0;
    for(const e of this.entities){if(e.dead)continue;
      const tx=Math.sin(e.seed)*2.15,tz=-1.9,dx=tx-e.x,dz=tz-e.z,len=Math.hypot(dx,dz);
      if(len>.35){e.x+=dx/len*e.speed*dt;e.z+=dz/len*e.speed*dt;}
      else damage+=(e.elite?4.5:2.1)*dt;
    }
    this.hp=Math.max(0,this.hp-damage);this.entities=this.entities.filter(e=>!e.dead);
    if(this.hp<=0){this.finish(false,'Ворота прорваны!');return;}
    if(!this.remaining&&!this.entities.length){
      if(this.wave>=this.maxWaves){this.finish(true,'Док спасён. Команда — огонь!');return;}
      this.hp=Math.min(this.maxHp,this.hp+12);this.breakUntil=this.time+5;this.deadline=this.breakUntil;this.message='Передышка: +12 к воротам. Следующая волна через 5 секунд.';
    }
  }
  gallery(dt){
    this.spawnTimer-=dt;
    const live=Math.max(1,this.players.filter(p=>p.connected).length),maxTargets=Math.min(30,5+live*2);
    if(this.spawnTimer<=0&&this.entities.length<maxTargets){
      this.spawnTimer=.65/Math.sqrt(live);const cover=this.obstacles[Math.floor(this.random()*this.obstacles.length)];
      this.entities.push({id:++this.serial,anchor:cover.id,x:cover.x,z:cover.z,r:.74,hp:1,age:0,life:2.8+this.random()*2.5,side:this.random()<.5?-1:1,travel:3+this.random()*1.1,visible:false,dead:false,friendly:this.random()<.12,kind:Math.floor(this.random()*4),seed:this.random()*6.28});
    }
    for(const e of this.entities){
      e.age+=dt;const cover=this.obstacles[e.anchor],v=Math.max(0,Math.sin(Math.PI*e.age/e.life));
      e.x=cover.x+e.side*v*e.travel;e.z=cover.z+Math.sin(e.age*2+e.seed)*.45;
      e.visible=v>.1&&!pointCovered(e.x,e.z,this.obstacles);if(e.age>=e.life)e.dead=true;
    }
    this.entities=this.entities.filter(e=>!e.dead);
    if(this.time>=this.deadline)this.finish(true,'Тир закрывается. Считаем попадания!');
  }
  finish(won,title){this.phase='results';const best=Math.max(...this.players.map(p=>p.score));this.result={title,winners:this.players.filter(p=>this.mode==='gate_siege'?won:p.score===best).map(p=>p.id)};this.players.forEach(p=>p.fire=false);}
  snapshot(full=true){
    const round=n=>Math.round(n*1000)/1000;
    const s={mode:this.mode,time:this.time,phase:this.phase,deadline:this.mode==='gate_siege'?this.breakUntil:this.deadline,wave:this.wave,maxWaves:this.maxWaves,hp:round(this.hp),maxHp:this.maxHp,remaining:(this.remaining||0)+this.entities.length,message:this.message,events:this.events,result:this.result,
      players:this.players.map(p=>({id:p.id,name:p.name,color:p.color,connected:p.connected,score:p.score,hits:p.hits,shots:p.shots,streak:p.streak,ready:p.ready,boostUntil:p.boostUntil,heat:round(p.heat),overheatUntil:p.overheatUntil,repairUntil:p.repairUntil,aim:{x:round(p.aim.x),z:round(p.aim.z)},towerX:p.towerX}))};
    if(full){s.entities=this.entities.map(e=>({...e,x:round(e.x),z:round(e.z)}));s.obstacles=this.obstacles;s.effects=this.effects;}
    return s;
  }
  dispose(){}
}
module.exports={Arcade:require("./feel").enhanceArcade(Arcade)};
