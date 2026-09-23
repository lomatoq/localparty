import {PocketPlasma} from './pocket-plasma.js';
// Client-only, bounded VFX. Cached soft sprites avoid per-particle blur filters.
const TAU=Math.PI*2, MAX_ITEMS=360, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Glows, rings and sparks are drawn additively ('lighter'): a near-black
// authored emitter colour (smoke/transparent nodes) adds nothing and left
// whole explosion stages invisible. Only readable colours are cycled.
const readable=c=>/^#[0-9a-f]{6}$/i.test(c||'')&&Math.max(parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16))>=0x60;
export class SiegeFX {
 constructor(reduced=false){this.reduced=reduced;this.items=[];this.labels=[];this.pool=[];this.sprites=new Map();this.weapons={};this.plasma=new PocketPlasma();}
 setWeapons(weapons){this.weapons=weapons||{};}
 clear(){this.pool.push(...this.items);this.items.length=0;this.labels.length=0;this.plasma.clear();}
 acquire(values){const item=this.pool.pop()||{};for(const key of Object.keys(item))delete item[key];Object.assign(item,values);this.items.push(item);return item;}
 sprite(color,smoke=false){
  const key=color+smoke;if(this.sprites.has(key))return this.sprites.get(key);
  const el=document.createElement('canvas');el.width=el.height=128;const c=el.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,smoke?'#8e829bc0':'#fffbe8');g.addColorStop(.18,smoke?'#766b86a0':color);g.addColorStop(.52,smoke?'#51475970':color+'88');g.addColorStop(1,smoke?'#302b3900':color+'00');c.fillStyle=g;c.fillRect(0,0,128,128);
  if(this.sprites.size>=32)this.sprites.delete(this.sprites.keys().next().value);this.sprites.set(key,el);return el;
 }
 emit(e){
  if(e.explosionWaveId!=null)return true; // rendered from the persistent snapshot, not a short-lived particle
  if(!Number.isFinite(e.x)||!Number.isFinite(e.y))return false;
  if(e.effectType==='TRACER'&&e.label!=null&&String(e.label)!==''){
   this.labels.push({x:e.x,y:e.y,text:String(e.label).slice(0,80),color:/^#[0-9a-f]{6}$/i.test(e.color||'')?e.color:'#e6edc9',started:Number.isFinite(e.t)?e.t:null,age:0,duration:clamp(Number(e.displayTime)||3,.05,60)});
   if(this.labels.length>96)this.labels.splice(0,this.labels.length-96);
  }
  if(e.kind==='score'){
   this.acquire({kind:'damage',x:e.x,y:e.y,originX:e.x,originY:e.y,age:0,life:2.6,vx:0,vy:0,phase:(e.id||0)*2.39996,value:(e.value>0?'+':'')+e.value,color:e.color||'#ffe083'});
   if(this.items.length>MAX_ITEMS)this.pool.push(...this.items.splice(0,this.items.length-MAX_ITEMS));return true;
  }
  if(!['blast','muzzle','split','bounce','dirt','warp','spark','land','beam','coat','stuck','jump'].includes(e.kind))return false;
  const authoredMaterial=['blast','dirt','split','coat'].includes(e.kind)&&this.plasma.emit(e);
  if(e.kind==='blast'&&Array.isArray(e.fxStages)&&!e.fxStages.length&&!authoredMaterial)return true;
  let seed=((e.id||1)*2654435761)>>>0;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const profile=this.weapons?.[e.weapon]?.fx||{},types=new Set(profile.commandTypes||[]),family=e.family||'shell',profileColors=(profile.colors||[]).filter(readable),color=/^#[0-9a-f]{6}$/i.test(e.color||'')?e.color:profileColors[0]||'#ffb65b',r=clamp(e.r||20,8,150),blast=e.kind==='blast',earth=['dirt','land'].includes(e.kind)||['dirt','drill','quake','burrow'].includes(family)||types.has('DIRTMOVER')||types.has('MAGICWALL')||types.has('DIRTBALL'),energy=e.kind==='warp'||['pulse','laser','lightning','rail','freeze','pull','push','vortex'].includes(family)||types.has('LIGHTNING')||types.has('ZAPPER'),liquid=['fire','acid'].includes(family)||types.has('FIRE')||types.has('FOG');
  const speedMin=clamp(profile.speedMin||35,4,600),speedMax=Math.max(speedMin,clamp(profile.speedMax||180,8,700)),effectDuration=clamp(profile.duration||.7,.15,3.5),authoredAlpha=clamp(profile.alpha??1,.15,1),spray=(profile.sprayAngle??270)*Math.PI/180,spread=clamp(profile.spraySpread??360,1,360)*Math.PI/180;
  const angle=()=>spread>=TAU-.01?rand()*TAU:spray+(rand()-.5)*spread;
  const terrainColors=Array.isArray(e.terrainMaterial)&&e.terrainMaterial.length===2&&e.terrainMaterial.every(c=>/^#[0-9a-f]{6}$/i.test(c))?e.terrainMaterial:null;
  const pickColor=i=>terrainColors?terrainColors[i%terrainColors.length]:profileColors.length?profileColors[i%profileColors.length]:color;
  const add=p=>this.acquire({x:e.x,y:e.y,age:0,vx:0,vy:0,color,...p});
  if(e.kind==='coat'||e.kind==='stuck'){
   for(let i=0;i<(this.reduced?5:16);i++)add({kind:'drop',life:.55+rand()*.4,vx:(rand()-.5)*r*3,vy:-30-rand()*75,gravity:210,size:2+rand()*3,color:e.coating==='rubber'?'#fd68da':'#e8c25f'});
  }else if(e.kind==='beam'){if(Number.isFinite(e.x2)&&Number.isFinite(e.y2))add({kind:'beam',x2:e.x2,y2:e.y2,life:.38});}
  else {
   if(!earth&&!authoredMaterial)add({kind:'glow',life:blast?.38:.18,size:blast?r*1.7:20});
   if((blast||e.kind==='warp')&&!authoredMaterial)add({kind:'ring',life:.48,size:r*(energy?1.5:1.15)});
   if(blast&&(e.fxStages??profile.timeline)?.length){
    const stages=(e.fxStages??profile.timeline).slice(0,64);
    for(let i=0;i<stages.length;i++){
     const [type,delay,xMin,xMax,yMin,yMax,stageRadius,stageDuration]=stages[i],stageColor=pickColor(i),stageEarth=['W','D','M','T'].includes(type),stageLiquid=['F','G'].includes(type),stageExplosion=type==='E',sx=e.x+xMin+(xMax-xMin)*rand(),sy=e.y+yMin+(yMax-yMin)*rand(),stageSize=clamp(stageRadius||r*(.28+Math.min(i,5)*.09),4,r*1.8),stageLife=clamp(stageDuration||(stageLiquid?.8:.32+rand()*.18),.16,2.2);
     if(authoredMaterial&&['Q','I','A','V','U','F','G','B'].includes(type))continue;
     const fluid=['Q','I','A','V','U'].includes(type),fluidColor={Q:'#74cfff',I:'#bbecff',A:'#b5e975',V:'#ff782f',U:'#d1b05f'}[type];
     add({kind:stageEarth?'chunk':fluid?'drop':type==='F'?'flame':type==='G'?'smoke':['L','Z'].includes(type)?'spark':stageExplosion?'glow':'ring',x:sx,y:sy,delay,life:stageLife,size:stageEarth?clamp(stageSize*.08,1.5,5):fluid?clamp(stageSize,1.5,4):stageSize,vx:(rand()-.5)*(fluid?160:45),vy:fluid?-40-rand()*100:stageEarth?-40-rand()*55:-15,gravity:fluid?260:stageEarth?190:0,alpha:authoredAlpha,color:fluidColor||stageColor,fluid});
     if(stageExplosion)add({kind:'ring',x:sx,y:sy,delay,life:Math.min(.55,stageLife),size:stageSize,inward:stages[i][8]??profile.inward,alpha:authoredAlpha,color:stageColor});
    }
   }
   if(blast&&!energy&&!liquid&&!authoredMaterial)for(let i=0;i<(this.reduced?2:6);i++){
    const a=rand()*TAU,d=r*(.15+rand()*.25);
    add({kind:'glow',x:e.x+Math.cos(a)*d,y:e.y+Math.sin(a)*d,life:.3+rand()*.22,size:r*(.5+rand()*.25),vx:Math.cos(a)*30,vy:Math.sin(a)*30-25,color:i%2?'#ff772f':'#ffc65a'});
   }
   const requested=profile.particleBudget||0,count=this.reduced?Math.min(6,requested||4):blast?clamp(requested||22,12,72):earth?clamp(Math.ceil((requested||28)*.55),10,34):clamp(Math.ceil((requested||16)*.42),6,24);
   for(let i=0;i<(authoredMaterial?0:count);i++){
    const a=angle(),speed=speedMin+(speedMax-speedMin)*rand(),life=effectDuration*(.55+rand()*.7);
    add({kind:liquid?'drop':family==='freeze'?'shard':earth?'chunk':'spark',life,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-(earth?50:15),gravity:liquid||earth?220:110,size:1+rand()*2.4,alpha:authoredAlpha,color:terrainColors?pickColor(i):family==='acid'?'#c9ff6f':family==='fire'?'#ff7b32':earth?'#a9b76b':i%4===0?'#fff2ce':pickColor(i)});
   }
   if(blast&&!energy&&!authoredMaterial&&!this.reduced&&(profile.smoke??true))for(let i=0;i<clamp(Math.ceil(count*.24),3,12);i++){
    const a=rand()*TAU,d=rand()*r*.32;
    add({kind:'smoke',x:e.x+Math.cos(a)*d,y:e.y+Math.sin(a)*d,life:.85+rand()*.65,delay:.09+rand()*.1,size:r*(.35+rand()*.35),vx:(rand()-.5)*35,vy:-20-rand()*35,rotation:rand()*TAU});
   }
  }
  // TV/WebKit must never pay an unbounded cost when a chain weapon fans out.
  // Preserve the newest authored stages and recycle the rest.
  if(this.items.length>MAX_ITEMS){const removed=this.items.splice(0,this.items.length-MAX_ITEMS);this.pool.push(...removed);}return true;
 }
 draw(c,dt,simulationTime=null){
  dt=clamp(dt,0,.05);c.save();c.lineCap='round';
  for(const p of this.items){
   p.age+=dt;const age=p.age-(p.delay||0);if(age<0||age>=p.life)continue;const t=age/p.life,fade=(1-t)**2;
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.gravity||0)*dt;const authored=p.alpha??1;
   c.globalCompositeOperation=['smoke','drop'].includes(p.kind)?'source-over':'lighter';
   if(p.kind==='damage'){
    const radius=this.reduced?0:18*Math.sin(Math.PI*t),angle=p.phase+t*TAU*1.65;
    const x=p.originX+Math.sin(angle)*radius,y=p.originY-75*t+Math.cos(angle)*radius*.45;
    c.globalCompositeOperation='source-over';c.globalAlpha=Math.min(1,age/.08)*Math.pow(1-t,1.25);c.font='italic 900 23px PartyRubik, sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineWidth=3;c.strokeStyle='#161021b0';c.strokeText(p.value,x,y);c.fillStyle=p.color;c.fillText(p.value,x,y);
   }else if(p.kind==='flame'){
    const size=Math.min(p.size,32)*(1-t*.65);c.globalCompositeOperation='lighter';c.globalAlpha=Math.sin(Math.PI*t)*.55*authored;c.drawImage(this.sprite('#ff8b32'),p.x-size*.5,p.y-size*1.5,size,size*1.8);
   }else if(p.kind==='glow'||p.kind==='smoke'){
    const smoke=p.kind==='smoke',size=p.size*(smoke?.5+t*.9:.3+Math.sqrt(t)*.7);
    c.globalAlpha=(smoke?Math.sin(Math.PI*t)*.5:fade)*authored;c.drawImage(this.sprite(p.color,smoke),p.x-size,p.y-size,size*2,size*2);
   }else if(p.kind==='ring'){
    const progress=p.inward?(1-t)**2:1-(1-t)**3;c.globalAlpha=fade*.45*authored;c.strokeStyle=p.color;c.lineWidth=1.5+(1-t)*2;c.beginPath();c.arc(p.x,p.y,p.size*progress,0,TAU);c.stroke();
   }else if(p.kind==='beam'){
    c.globalAlpha=fade;for(const [width,alpha,color] of [[16,.10,p.color],[7,.35,p.color],[2,.9,'#fff6e1']]){c.globalAlpha=fade*alpha;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x2,p.y2);c.stroke();}
   }else if(p.kind==='drop'){
    c.globalAlpha=(1-t)*authored;c.fillStyle=p.color;c.beginPath();c.ellipse(p.x,p.y,p.size*(1+t),p.size,0,0,TAU);c.fill();
   }else if(p.kind==='chunk'){
    c.globalAlpha=fade*authored;c.fillStyle=p.color;c.save();c.translate(p.x,p.y);c.rotate(p.age*7+p.vx);c.fillRect(-p.size,-p.size*.65,p.size*2,p.size*1.3);c.restore();
   }else if(p.kind==='shard'){
    c.globalAlpha=fade*authored;c.strokeStyle=p.color;c.lineWidth=Math.max(1,p.size*.6);c.beginPath();c.moveTo(p.x-p.vx*.035,p.y-p.vy*.035);c.lineTo(p.x,p.y);c.stroke();
   }else{
    c.globalAlpha=fade*authored;c.strokeStyle=p.color;c.lineWidth=p.size*(1-t*.65);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*.025,p.y-p.vy*.025);c.stroke();
   }
  }
  c.restore();let write=0;for(const p of this.items){if(p.age<p.life+(p.delay||0))this.items[write++]=p;else this.pool.push(p);}this.items.length=write;
  c.save();c.globalCompositeOperation='source-over';c.font='900 22px PartyRubik, sans-serif';c.textAlign='center';c.textBaseline='bottom';c.lineWidth=3;c.strokeStyle='#10101bdd';
  this.labels=this.labels.filter(label=>{label.age=Number.isFinite(simulationTime)&&label.started!==null?Math.max(0,simulationTime-label.started):label.age+dt;if(label.age>=label.duration)return false;c.globalAlpha=Math.min(1,(label.duration-label.age)/.2);c.fillStyle=label.color;c.strokeText(label.text,label.x,label.y-12);c.fillText(label.text,label.x,label.y-12);return true;});c.restore();
 }
}
