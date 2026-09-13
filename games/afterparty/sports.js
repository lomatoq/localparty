'use strict';
const {clamp,bowlingCard,appendRoll,curlingScore}=require('./rules');
const {randomUUID}=require('node:crypto');
class Sports {
  constructor(mode,players,options={}) {
    this.mode=mode;this.players=players;this.time=0;this.phase='playing';this.result=null;
    this.epoch=randomUUID();this.turn=0;this.serial=0;this.state='aim';this.deadline=25;this.message='';this.stones=[];this.teamScore=[0,0];this.end=1;
    this.ends=3;this.frames=options.frames===10?10:5;this.order=players.map(p=>p.id);this.turnIndex=0;
    players.forEach((p,i)=>Object.assign(p,{team:i%2,score:0,rolls:[],sweeping:0,stamina:1,skipped:0,participant:true}));
    if(mode==='curling'){this.makeCurlOrder();this.message='Свайп вверх — бросок. Команда помогает щётками.';}
    this.beginTurn();
  }
  async init(){if(this.mode==='bowling'){this.R=require('@dimforge/rapier3d-compat');await this.R.init();this.rack();}return this;}
  get current(){return this.players.find(p=>p.id===this.order[this.turnIndex]);}
  makeCurlOrder(){const teams=[0,1].map(t=>this.players.filter(p=>p.team===t));const n=Math.max(4,...teams.map(t=>t.length));this.order=[];
    for(let i=0;i<n;i++)for(let t=0;t<2;t++)this.order.push(teams[t][(i+this.end-1)%teams[t].length].id);
    this.turnIndex=0;
  }
  beginTurn(){this.state='aim';this.turn++;this.turnId=this.epoch+':'+this.turn;this.deadline=this.time+25;this.still=0;this.offline=0;}
  rack(standing=null){
    const R=this.R;if(!R)return;this.world?.free();this.world=new R.World({x:0,y:-9.81,z:0});this.world.timestep=1/60;this.world.numSolverIterations=8;
    const box=(x,y,z,hx,hy,hz,friction)=>{const b=this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x,y,z));this.world.createCollider(R.ColliderDesc.cuboid(hx,hy,hz).setFriction(friction),b);};
    box(0,-.15,13,1.8,.15,14,.20);box(0,-.80,13,5,.15,16,.6);
    box(-2.35,.15,13,.12,.95,14,.3);box(2.35,.15,13,.12,.95,14,.3);box(0,.5,28,3,.8,.2,.6);
    this.pins=[];let id=0;
    for(let row=0;row<4;row++)for(let k=0;k<=row;k++,id++){
      if(standing&&!standing.includes(id))continue;
      const x=(k-row/2)*.54,z=22+row*.48;
      const body=this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(x,.51,z).setLinearDamping(.12).setAngularDamping(.15).setCcdEnabled(true));
      this.world.createCollider(R.ColliderDesc.capsule(.22,.145).setTranslation(0,-.15,0).setMass(1.1).setFriction(.38).setRestitution(.15),body);
      this.world.createCollider(R.ColliderDesc.capsule(.12,.065).setTranslation(0,.19,0).setMass(.15).setFriction(.3),body);
      this.world.createCollider(R.ColliderDesc.ball(.105).setTranslation(0,.39,0).setMass(.15),body);
      this.pins.push({id,body});
    }
    this.ball=null;this.spin=0;this.gutter=false;
  }
  input(p,type,d){
    if(this.phase!=='playing')return false;
    if(type==='sweep'&&this.mode==='curling'){
      if(this.state==='rolling'&&p.team===this.current.team){p.sweeping=d.held?this.time+.4:0;return true;}return false;
    }
    if(type!=='throw'||this.state!=='aim'||p!==this.current||d.turnId!==this.turnId)return false;
    const power=clamp(d.power,.1,1),angle=clamp(d.angle,-1,1),spin=clamp(d.spin,-1,1),offset=clamp(d.offset,-1,1);
    this.state='rolling';this.deadline=this.time+13;this.launchAt=this.time;
    if(this.mode==='curling'){
      const speed=4.4+power*4.5;
      this.stones.push({id:++this.serial,owner:p.id,team:p.team,x:offset*1.4,z:2,vx:angle*.62,vz:speed,spin,r:.32,out:false});
    }else{
      const R=this.R;
      this.ball=this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(offset*1.25,.235,2).setCcdEnabled(true).setLinearDamping(.035));
      this.world.createCollider(R.ColliderDesc.ball(.23).setMass(6).setFriction(.24).setRestitution(.25),this.ball);
      const v=7+power*7;this.ball.setLinvel({x:angle*1.05,y:0,z:v},true);this.ball.setAngvel({x:v/.23,y:spin*14,z:0},true);this.spin=spin;
    }
    return true;
  }
  update(dt){
    if(this.phase!=='playing')return;this.time+=dt;
    for(const p of this.players){p.stamina=clamp(p.stamina+(p.sweeping>this.time?-.35:.16)*dt,0,1);}
    if(this.state==='end'){if(this.time>=this.deadline){this.end++;this.stones=[];this.makeCurlOrder();this.beginTurn();}return;}
    if(this.state==='aim'){
      this.offline=this.current.connected===false?this.offline+dt:0;
      if(this.time>=this.deadline||this.offline>=8){this.current.skipped++;if(this.mode==='bowling')this.recordBowl(0);else this.nextCurl();}
      return;
    }
    if(this.mode==='curling'){
      this.ice(dt);const moving=this.stones.some(s=>!s.out&&Math.hypot(s.vx,s.vz)>.025);
      this.still=moving?0:this.still+dt;
      if(this.still>.6||this.time>=this.deadline){for(const s of this.stones){s.vx=s.vz=0;if(s.z<8)s.out=true;}this.nextCurl();}
    }else{
      const b=this.ball.translation();if(Math.abs(b.x)>1.79)this.gutter=true;
      if(!this.gutter&&b.z>12&&b.z<22){const v=this.ball.linvel();this.ball.setLinvel({x:v.x+this.spin*.36*dt,y:v.y,z:v.z},true);}
      this.world.step();
      const moving=this.pins.some(p=>{const v=p.body.linvel(),w=p.body.angvel();return Math.hypot(v.x,v.y,v.z)>.065||Math.hypot(w.x,w.y,w.z)>.13;});
      this.still=!moving&&(b.z>25||this.time-this.launchAt>7)?this.still+dt:0;
      if(this.still>.8||this.time>=this.deadline){
        const fallen=this.pins.filter(p=>{const q=p.body.rotation(),t=p.body.translation();return 1-2*(q.x*q.x+q.z*q.z)<.60||t.y<.23||Math.abs(t.x)>1.9||t.z>26;});
        this.standing=this.pins.filter(p=>!fallen.includes(p)).map(p=>p.id);this.recordBowl(fallen.length);
      }
    }
  }
  ice(dt){
    const active=this.stones.at(-1),sweep=this.players.some(p=>p.team===this.current.team&&p.sweeping>this.time&&p.stamina>.02);
    for(const s of this.stones){if(s.out)continue;const v=Math.hypot(s.vx,s.vz);if(v<.018){s.vx=s.vz=0;continue;}
      const friction=s===active&&sweep ? .78 : 1.12;
      const next=Math.max(0,v-friction*dt);s.vx*=next/v;s.vz*=next/v;
      s.vx+=s.spin*.022*next*dt*(sweep ? .5 : 1);s.spin*=Math.exp(-dt*.4);
      s.x+=s.vx*dt;s.z+=s.vz*dt;
      if(Math.abs(s.x)>3.28||s.z>29||s.z<0){s.out=true;s.vx=s.vz=0;}
    }
    for(let iter=0;iter<3;iter++)for(let i=0;i<this.stones.length;i++)for(let j=i+1;j<this.stones.length;j++){
      const a=this.stones[i],b=this.stones[j];if(a.out||b.out)continue;const dx=b.x-a.x,dz=b.z-a.z,dist=Math.hypot(dx,dz);if(dist>=.64)continue;
      const nx=dist>1e-6?dx/dist:1,nz=dist>1e-6?dz/dist:0,over=(.64-dist)/2;
      a.x-=nx*over;a.z-=nz*over;b.x+=nx*over;b.z+=nz*over;
      const rel=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;if(rel<0){const impulse=-rel*.96;a.vx-=impulse*nx;a.vz-=impulse*nz;b.vx+=impulse*nx;b.vz+=impulse*nz;}
    }
  }
  nextCurl(){
    if(++this.turnIndex<this.order.length){this.beginTurn();return;}
    const score=curlingScore(this.stones);score.forEach((v,i)=>this.teamScore[i]+=v);
    this.players.forEach(p=>p.score=this.teamScore[p.team]);
    this.message=`Энд ${this.end}: ${score[0]} : ${score[1]}`;
    if(this.end>=this.ends){const best=Math.max(...this.teamScore);this.finish(this.players.filter(p=>p.score===best).map(p=>p.id),'Камни решают всё');}
    else{this.state='end';this.deadline=this.time+4;}
  }
  recordBowl(pins){
    const p=this.current,before=bowlingCard(p.rolls,this.frames);const after=appendRoll(p.rolls,pins,this.frames);p.score=after.total;
    this.message=pins===10?'СТРАЙК!':(!after.fresh&&pins===0?'Мимо!':`${p.name}: +${pins}`);
    const frameDone=after.complete||after.frame>before.frame;
    if(this.players.every(p=>bowlingCard(p.rolls,this.frames).complete)){const best=Math.max(...this.players.map(p=>p.score));this.finish(this.players.filter(p=>p.score===best).map(p=>p.id),'Финальный счёт');return;}
    if(frameDone){do{this.turnIndex=(this.turnIndex+1)%this.order.length;}while(bowlingCard(this.current.rolls,this.frames).complete);this.rack();}
    else if(after.fresh)this.rack();
    else this.rack(this.standing||this.pins?.map(p=>p.id));
    this.standing=null;this.beginTurn();
  }
  finish(winners,title){this.phase='results';this.result={winners,title};this.deadline=0;}
  snapshot(full=true){
    const s={mode:this.mode,time:this.time,phase:this.phase,state:this.state,turnId:this.turnId,currentId:this.current?.id,deadline:this.deadline,message:this.message,end:this.end,ends:this.ends,frames:this.frames,teamScore:this.teamScore,result:this.result,
      players:this.players.map(p=>({id:p.id,name:p.name,color:p.color,team:p.team,connected:p.connected,score:p.score,stamina:p.stamina,sweeping:p.sweeping,card:this.mode==='bowling'?bowlingCard(p.rolls,this.frames).card:undefined}))};
    if(full){s.stones=this.stones.filter(s=>!s.out).map(s=>({...s}));if(this.world){const pose=b=>({p:b.translation(),q:b.rotation()});s.pins=this.pins.map(p=>({id:p.id,...pose(p.body)}));s.ball=this.ball?pose(this.ball):null;s.gutter=this.gutter;}}
    return s;
  }
  dispose(){this.world?.free();this.world=null;}
}
module.exports={Sports};
