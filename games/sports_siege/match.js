'use strict';
const crypto=require('node:crypto');
const {clamp,finite,COLORS,shotInput,scoreBowling,frameComplete,freshRack,curlingScore,targetAt,hitTarget,rayCircle}=require('./rules');
const {Ice}=require('./curling');
const TITLES={curling:'Лёд и нервы',bowling:'Pocket Strike',swarm_gate:'Не грызи ворота!',peek_shoot:'Кто тут вылез?'};
const MODES=Object.keys(TITLES);
const COVERS=[];
for(let row=0;row<3;row++)for(let col=0;col<5;col++)COVERS.push({id:row*5+col,x:.025+col*.195+(row%2)*.012,y:.27+row*.225,w:.155,h:.10,depth:row+1,kind:(row+col)%4});
class Match {
  constructor(mode,{bowlingFactory,seed=71337}={}) {
    if(!MODES.includes(mode))throw Error('Unknown game');
    this.mode=mode;this.bowlingFactory=bowlingFactory;this.players=new Map();this.phase='waiting';this.stage='waiting';
    this.t=0;this.started=0;this.events=[];this.eventSerial=0;this.serial=0;this.seed=seed>>>0;this.result=null;
    this.world=null;this.enemies=[];this.targets=[];this.covers=COVERS;this.deadline=0;this.order=[];this.cursor=-1;this.currentId=null;
  }
  random(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296;}
  add(profile){
    let p=this.players.get(profile.id);
    if(!p){
      if(this.players.size>=16)return null;
      p={id:profile.id,name:String(profile.name||'Игрок').replace(/[<>\u0000-\u001f]/g,'').slice(0,24),hand:profile.hand==='left'?'left':'right',avatar:profile.avatar||null,
        color:COLORS[this.players.size],number:this.players.size+1,team:this.players.size%2,connected:true,participant:false,
        score:0,kills:0,hits:0,shots:0,streak:0,charge:false,gunUntil:0,heat:0,lockedUntil:0,energy:1,abilityAt:0,
        aim:{x:.5,y:.5},fire:false,sweep:false,inputAt:-10,nextShot:0,offlineAt:0,frames:[],missed:0};
      this.players.set(p.id,p);
      if(this.phase==='playing'&&this.mode==='swarm_gate')p.participant=true;
    }
    p.connected=true;p.offlineAt=0;p.fire=false;p.sweep=false;return p;
  }
  disconnect(id){const p=this.players.get(id);if(p){p.connected=false;p.offlineAt=this.t;p.fire=false;p.sweep=false;}}
  release(){for(const p of this.players.values()){p.fire=false;p.sweep=false;p.inputAt=-10;}}
  event(kind,text,extra={}){this.events.push({id:++this.eventSerial,at:this.t,kind,text,...extra});this.events=this.events.filter(e=>this.t-e.at<(e.kind==='shot'?.3:5));const shots=this.events.filter(e=>e.kind==='shot').slice(-80),notes=this.events.filter(e=>e.kind!=='shot').slice(-20);this.events=[...notes,...shots].sort((a,b)=>a.id-b.id);}
  playing(){return [...this.players.values()].filter(p=>p.participant);}
  online(){return this.playing().filter(p=>p.connected);}
  start(options={}){
    if(this.phase==='playing')return false;
    const ps=[...this.players.values()].filter(p=>p.connected);if(!ps.length || (this.mode==='curling'&&ps.length<2))return false;
    this.world?.free();this.world=null;this.phase='playing';this.stage='aim';this.result=null;this.events=[];this.id=crypto.randomUUID();this.started=this.t;
    this.order=ps.map(p=>p.id);this.cursor=-1;this.currentId=null;this.noneSince=null;
    for(const p of this.players.values())Object.assign(p,{participant:p.connected,score:0,kills:0,hits:0,shots:0,streak:0,charge:false,gunUntil:0,
      heat:0,lockedUntil:0,energy:1,abilityAt:0,fire:false,sweep:false,inputAt:-10,nextShot:0,frames:[],missed:0});
    if(this.mode==='bowling'){
      this.frameCount=[3,5,10].includes(options.frames)?options.frames:5;
      this.world=this.bowlingFactory();this.nextBowler();
    }else if(this.mode==='curling'){
      ps.forEach((p,i)=>p.team=i%2);this.endCount=[1,3,5].includes(options.ends)?options.ends:3;
      this.stonesPerTeam=Math.max(4,Math.ceil(ps.length/2));this.endIndex=0;this.teams=[0,0];this.endScores=[];this.firstTeam=0;this.world=new Ice();this.newEnd();
    }else if(this.mode==='swarm_gate'){
      this.stage='break';this.wave=0;this.waveCount=[4,6,8].includes(options.waves)?options.waves:6;
      this.gate=1000;this.maxGate=1000;this.enemies=[];this.waveLeft=0;this.deadline=this.t+4;
      this.event('wave','На башни! Рой приближается.');
    }else{
      this.stage='shooting';this.deadline=this.t+([60,90,120].includes(options.seconds)?options.seconds:90);this.targets=[];this.spawnAt=this.t;
      this.event('start','6 попаданий подряд — пулемёт. Мирных с белым флажком не трогать!');
    }
    return true;
  }
  finish(reason,winners){
    if(this.phase!=='playing')return;
    this.phase='results';this.stage='results';this.release();this.deadline=0;
    const ps=this.playing();
    this.result={eventId:this.id,gameId:this.mode,reason,duration:this.t-this.started,
      winners:winners||[],players:ps.map(p=>({id:p.id,name:p.name,score:p.score,won:!!winners?.includes(p.id),
        metrics:{hits:p.hits,shots:p.shots,accuracy:p.shots?Math.round(p.hits/p.shots*100):0,kills:p.kills,missedTurns:p.missed,
          ...(this.mode==='bowling'?{frames:p.frames.length}:{}),...(this.mode==='swarm_gate'?{waves:this.wave,gate:Math.round(this.gate)}:{})}}))};
    this.event('finish',reason);
  }
  token(){this.turnToken=this.id+':'+(++this.serial);this.deadline=this.t+25;this.stage='aim';this.release();}
  nextBowler(){
    let found=null;
    for(let i=0;i<this.order.length;i++){
      this.cursor=(this.cursor+1)%this.order.length;const p=this.players.get(this.order[this.cursor]);
      if(p.frames.length<this.frameCount || !frameComplete(p.frames.at(-1).rolls,p.frames.length===this.frameCount)){found=p;break;}
    }
    if(!found){const best=Math.max(...this.playing().map(p=>p.score));this.finish('Все фреймы сыграны',this.playing().filter(p=>p.score===best).map(p=>p.id));return;}
    this.currentId=found.id;
    if(!found.frames.length || frameComplete(found.frames.at(-1).rolls,found.frames.length===this.frameCount))found.frames.push({rolls:[]});
    this.rack=Array(10).fill(true);this.world.reset(this.rack);this.token();
  }
  recordRoll(pins){
    const p=this.players.get(this.currentId),f=p.frames.at(-1),last=p.frames.length===this.frameCount;
    f.rolls.push(pins);p.score=scoreBowling(p.frames,this.frameCount).provisional;
    const word=pins===10?'СТРАЙК!':f.rolls.length>=2&&f.rolls[0]+f.rolls[1]===10?'СПЭР!':pins===0?'Мимо кеглей':`${pins} кегл${pins===1?'я':pins<5?'и':'ей'}`;
    this.event('roll',`${p.name}: ${word}`,{player:p.id,pins});
    this.frameDone=frameComplete(f.rolls,last);this.resetRack=freshRack(f.rolls,last);this.stage='reveal';this.deadline=this.t+1.6;
  }
  newEnd(){
    this.world.reset();this.endIndex++;this.queue=[];
    const teams=[0,1].map(team=>this.playing().filter(p=>p.team===team));
    for(let i=0;i<this.stonesPerTeam;i++)for(let k=0;k<2;k++){const team=(this.firstTeam+k)%2;this.queue.push(teams[team][i%teams[team].length].id);}
    this.throwIndex=0;this.currentId=this.queue[0];this.token();this.event('end',`Энд ${this.endIndex} из ${this.endCount}`);
  }
  nextStone(){
    this.throwIndex++;
    if(this.throwIndex>=this.queue.length){
      const result=curlingScore(this.world.stones);if(result.team!==null){this.teams[result.team]+=result.points;this.firstTeam=result.team;}
      this.endScores.push(result);for(const p of this.playing())p.score=this.teams[p.team];
      this.stage='end';this.deadline=this.t+3.5;this.event('score',result.team===null?'Пустой энд':`${result.team===0?'Коралловые':'Бирюзовые'}: +${result.points}`,result);return;
    }
    this.currentId=this.queue[this.throwIndex];this.token();
  }
  input(id,type,d={}){
    const p=this.players.get(id);if(!p?.connected||!p.participant||this.phase!=='playing')return false;
    if(type==='input'){
      if(d.x!==undefined && (typeof d.x!=='number'||!Number.isFinite(d.x)))return false;
      if(d.y!==undefined && (typeof d.y!=='number'||!Number.isFinite(d.y)))return false;
      p.aim={x:clamp(finite(d.x,p.aim.x),0,1),y:clamp(finite(d.y,p.aim.y),0,1)};
      p.fire=d.fire===true;p.sweep=d.sweep===true;p.inputAt=this.t;return true;
    }
    if(type==='throw'&&['curling','bowling'].includes(this.mode)){
      const input=shotInput(d);if(!input||this.currentId!==id||this.stage!=='aim'||d.turnToken!==this.turnToken)return false;
      this.stage='rolling';this.rollingAt=this.t;this.restSince=null;this.deadline=this.t+(this.mode==='curling'?17:10);
      this.release();this.world.throw(input,p);this.event('throw',`${p.name} бросает`,{player:id,input});return true;
    }
    if(type==='ability'&&this.mode==='peek_shoot'&&p.charge&&p.gunUntil<=this.t){
      p.charge=false;p.gunUntil=this.t+8;p.streak=0;this.event('machinegun',`${p.name} получает пулемёт на 8 секунд!`,{player:id,until:p.gunUntil});return true;
    }
    if(type==='ability'&&this.mode==='swarm_gate'&&this.t>=p.abilityAt){
      p.abilityAt=this.t+12;const x=(p.aim.x-.5)*36,z=-27+p.aim.y*26;
      for(const b of this.enemies)if(Math.hypot(b.x-x,b.z-z)<4.5){b.hp-=85;b.slowUntil=this.t+3;if(b.hp<=0){p.kills++;p.score+=10;}}
      this.enemies=this.enemies.filter(b=>b.hp>0);this.event('pulse',`${p.name}: импульс!`,{player:id,x,z});return true;
    }
    return false;
  }
  step(dt){
    dt=clamp(finite(dt),0,.1);this.t+=dt;this.events=this.events.filter(e=>this.t-e.at<5);
    if(this.phase!=='playing')return;
    for(const p of this.players.values()){
      if(this.t-p.inputAt>.45){p.fire=false;p.sweep=false;}
      p.energy=clamp(p.energy+(p.sweep?-.18:.12)*dt,0,1);
    }
    if(!this.online().length){
      if(this.noneSince===null)this.noneSince=this.t;
      if(this.t-this.noneSince>20)this.finish('Все игроки отключились',[]);
      return;
    }
    this.noneSince=null;
    if(this.mode==='bowling')this.bowlingStep(dt);
    else if(this.mode==='curling')this.curlingStep(dt);
    else if(this.mode==='swarm_gate')this.siegeStep(dt);
    else this.galleryStep(dt);
  }
  bowlingStep(dt){
    const p=this.players.get(this.currentId);
    if(this.stage==='rolling'){
      this.world.step(dt);if(this.world.resting){if(this.restSince===null)this.restSince=this.t;}else this.restSince=null;
      if(this.t>=this.deadline || (this.t-this.rollingAt>1.3&&this.restSince!==null&&this.t-this.restSince>.6)){
        const next=this.world.standing();const pins=this.rack.filter(Boolean).length-next.filter(Boolean).length;
        this.rack=next;this.recordRoll(clamp(pins,0,10));
      }
    }else if(this.stage==='aim'&&(this.t>=this.deadline || !p.connected&&this.t-p.offlineAt>8)){
      p.missed++;this.recordRoll(0);
    }else if(this.stage==='reveal'&&this.t>=this.deadline){
      if(this.frameDone)this.nextBowler();else{
        if(this.resetRack)this.rack=Array(10).fill(true);this.world.reset(this.rack);this.token();
      }
    }
  }
  curlingStep(dt){
    const p=this.players.get(this.currentId);
    if(this.stage==='rolling'){
      const team=this.world.active?.team;
      const sweeping=this.online().filter(x=>x.team===team&&x.sweep&&x.energy>.03).length;
      this.sweepAmount=Math.min(1,sweeping*.65);this.world.step(dt,this.sweepAmount);
      if(this.world.resting&&this.t-this.rollingAt>.3 || this.t>=this.deadline){
        this.world.settle();this.stage='reveal';this.deadline=this.t+1.1;
        this.event('stone',this.world.active?.valid?'Камень остановился':'Камень не прошёл линию или ушёл за борт');
      }
    }else if(this.stage==='aim'&&(this.t>=this.deadline||!p.connected&&this.t-p.offlineAt>8)){
      p.missed++;this.event('skip',`${p.name}: пропуск броска`);this.nextStone();
    }else if(this.stage==='reveal'&&this.t>=this.deadline)this.nextStone();
    else if(this.stage==='end'&&this.t>=this.deadline){
      if(this.endIndex>=this.endCount){const best=Math.max(...this.teams);this.finish(this.teams[0]===this.teams[1]?'Ничья на льду!':'Матч на льду закончен',this.playing().filter(x=>this.teams[x.team]===best).map(x=>x.id));}
      else this.newEnd();
    }
  }
  spawnBug(){
    const kind=this.wave%3===0&&this.waveLeft===1?'boss':this.random()<.18?'tank':this.random()<.32?'runner':'termite';
    const hp={termite:55,runner:30,tank:160,boss:520}[kind],r={termite:.38,runner:.29,tank:.62,boss:1.1}[kind];
    this.enemies.push({id:++this.serial,kind,x:(this.random()-.5)*33,z:-26-this.random()*3,targetX:(this.random()-.5)*4,
      hp,maxHp:hp,r,speed:{termite:1.65,runner:3.1,tank:1.05,boss:.9}[kind]*(1+this.wave*.045),seed:this.random()*6.28,slowUntil:0});
    this.waveLeft--;
  }
  turretX(p){const participants=this.playing(),ids=(participants.length?participants:[...this.players.values()]).map(p=>p.id),i=Math.max(0,ids.indexOf(p.id));return ids.length<=1?0:-16+32*i/(ids.length-1);}
  siegeFire(p){
    p.shots++;p.heat+=.085;p.nextShot=this.t+.125;
    if(p.heat>=1){p.lockedUntil=this.t+1.5;p.heat=1;}
    const ox=this.turretX(p),oz=.5,x=(p.aim.x-.5)*36,z=-27+p.aim.y*26,dist=Math.hypot(x-ox,z-oz)||1;
    const dx=(x-ox)/dist,dz=(z-oz)/dist;
    let target=null,nearest=80;
    for(const b of this.enemies){if(b.hp<=0)continue;const d=rayCircle(ox,oz,dx,dz,b.x,b.z,b.r+.12,60);if(d!==null&&d<nearest){nearest=d;target=b;}}
    if(target){target.hp-=24;p.hits++;if(target.hp<=0){p.kills++;p.score+=target.kind==='boss'?100:target.kind==='tank'?25:10;}}
    this.event('shot','',{player:p.id,ox,oz,x:target?ox+dx*nearest:x,z:target?oz+dz*nearest:z,hit:!!target,dead:!!target&&target.hp<=0,targetKind:target?.kind});
  }
  siegeStep(dt){
    if(this.stage==='break'&&this.t>=this.deadline){
      this.wave++;const n=Math.max(1,this.online().length);this.waveLeft=14+this.wave*9+n*8;
      this.spawnAt=this.t;this.stage='wave';this.deadline=0;this.event('wave',`ВОЛНА ${this.wave} / ${this.waveCount}`);
    }
    if(this.stage==='wave'&&this.waveLeft>0&&this.t>=this.spawnAt&&this.enemies.length<280){
      this.spawnBug();this.spawnAt=this.t+Math.max(.07,.27/Math.sqrt(Math.max(1,this.online().length)));
    }
    for(const p of this.online()){
      p.heat=Math.max(0,p.heat-dt*(p.fire?.16:.34));
      if(p.fire&&this.t>=p.nextShot&&this.t>=p.lockedUntil&&this.stage==='wave')this.siegeFire(p);
    }
    this.enemies=this.enemies.filter(b=>b.hp>0);
    for(const b of this.enemies){
      const speed=b.speed*(b.slowUntil>this.t?.35:1);
      if(b.z< -1){const dx=b.targetX-b.x,dz=-.85-b.z,n=Math.hypot(dx,dz)||1;b.x+=dx/n*speed*dt;b.z+=dz/n*speed*dt;}
      else this.gate-=dt*(b.kind==='boss'?35:b.kind==='tank'?9:4.5);
    }
    if(this.gate<=0){this.gate=0;this.finish('Ворота прогрызены. Рой прорвался!',[]);return;}
    if(this.stage==='wave'&&this.waveLeft===0&&this.enemies.length===0){
      if(this.wave>=this.waveCount){this.finish('Док защищён. Вся команда победила!',this.playing().map(p=>p.id));return;}
      this.gate=Math.min(this.maxGate,this.gate+120);this.stage='break';this.deadline=this.t+6;this.event('repair','Перерыв: ремонт ворот +120');
    }
    if(this.t-this.started>600)this.finish('Рой не отступил за 10 минут',[]);
  }
  spawnTarget(){
    const occupied=new Set(this.targets.filter(t=>t.hp>0).map(t=>t.cover));
    const free=this.covers.filter(c=>!occupied.has(c.id));if(!free.length)return;
    const c=free[Math.floor(this.random()*free.length)],roll=this.random(),kind=roll<.14?'friendly':roll>.91?'gold':'goof';
    this.targets.push({id:++this.serial,cover:c.id,baseX:c.x+c.w*.5,coverY:c.y,depth:c.depth-.1,
      born:this.t,life:1.7+this.random()*1.5,r:.041,seed:this.random()*6.28,speed:1.3+this.random()*2,kind,style:Math.floor(this.random()*5),hp:1});
  }
  galleryFire(p){
    const mg=p.gunUntil>this.t;p.nextShot=this.t+(mg?1/12:.28);p.shots++;
    const spread=mg?.008:0,x=clamp(p.aim.x+(this.random()-.5)*spread,0,1),y=clamp(p.aim.y+(this.random()-.5)*spread,0,1);
    const t=hitTarget(this.targets,this.covers,x,y,this.t);
    if(t){
      this.targets.find(x=>x.id===t.id).hp=0;
      if(t.kind==='friendly'){p.score=Math.max(0,p.score-15);p.streak=0;this.event('friendly',`${p.name}: это был мирный!`,{player:p.id});}
      else{
        p.hits++;p.score+=t.kind==='gold'?30:10;
        if(!mg&&!p.charge){p.streak++;if(p.streak>=6){p.charge=true;p.streak=0;this.event('charged',`${p.name}: пулемёт готов!`,{player:p.id});}}
      }
    }else p.streak=0;
    this.event('shot','',{player:p.id,x,y,hit:!!t,dead:!!t,good:!!t&&t.kind!=='friendly',targetKind:t?.kind});
  }
  galleryStep(){
    if(this.t>=this.deadline){const best=Math.max(...this.playing().map(p=>p.score));this.finish('Время! Считаем попадания',this.playing().filter(p=>p.score===best).map(p=>p.id));return;}
    this.targets=this.targets.filter(t=>t.hp>0&&this.t<t.born+t.life);
    if(this.t>=this.spawnAt){this.spawnTarget();this.spawnAt=this.t+Math.max(.08,.47/Math.sqrt(Math.max(1,this.online().length)));
      if(this.online().length>5)this.spawnTarget();}
    for(const p of this.online())if(p.fire&&this.t>=p.nextShot)this.galleryFire(p);
  }
  snapshot(){
    const ps=[...this.players.values()].map(({inputAt,nextShot,offlineAt,fire,sweep,...p})=>({...p,
      fire:fire&&this.t-inputAt<.45,sweeping:sweep&&p.energy>.03,
      ...(this.mode==='bowling'?{bowling:scoreBowling(p.frames,this.frameCount)}:{}),
      ...(this.mode==='swarm_gate'?{turretX:this.turretX(p)}:{})}));
    return {mode:this.mode,title:TITLES[this.mode],phase:this.phase,stage:this.stage,t:this.t,deadline:this.deadline,
      currentId:this.currentId,turnToken:this.turnToken,players:ps,events:this.events,result:this.result,
      frameCount:this.frameCount,endIndex:this.endIndex,endCount:this.endCount,throwIndex:this.throwIndex,throwCount:this.queue?.length,
      teams:this.teams,endScores:this.endScores,sweepAmount:this.sweepAmount||0,
      ...(this.mode==='bowling'?{physics:this.world?.snapshot()||{pins:[],ball:null}}:{}),
      ...(this.mode==='curling'?{stones:this.world?.snapshot()||[],house:{x:0,z:-9,r:2.6}}:{}),
      ...(this.mode==='swarm_gate'?{gate:this.gate,maxGate:this.maxGate,wave:this.wave,waveCount:this.waveCount,waveLeft:this.waveLeft,enemies:this.enemies}:{}),
      ...(this.mode==='peek_shoot'?{covers:this.covers,targets:this.targets.map(t=>targetAt(t,this.t))}:{})};
  }
}
module.exports={Match,MODES,TITLES,COVERS};
