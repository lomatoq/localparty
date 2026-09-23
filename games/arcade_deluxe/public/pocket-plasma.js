// Indexed-mask feedback renderer. Source animations are imported without changing
// their frame order, playback rate, gravity, bounce or authored lifetime.
const W=320,H=256,S=4,MAX_SOURCES=320;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class PocketPlasma {
 constructor(){
  this.sources=[];this.origin=0;this.accumulator=0;this.time=0;this.seenZones=new Set();this.sprites=new Map();this.pending=[];
  this.fields=['FIRE','GAS','FOG'].map(mode=>{const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;return{mode,canvas,ctx:canvas.getContext('2d'),a:new Float32Array(W*H),b:new Float32Array(W*H),pixels:new ImageData(W,H)};});
  this.ready=fetch(new URL('./assets/pocket-materials.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Material masks unavailable');return r.json();}).then(data=>{this.data=data;for(const e of this.pending)this.emit(e);this.pending=[];return true;}).catch(()=>false);
 }
 clear(){this.sources.length=0;this.pending=[];this.active=false;this.seenZones.clear();this.accumulator=0;for(const f of this.fields){f.a.fill(0);f.b.fill(0);f.bounds=null;f.ctx.clearRect(0,0,W,H);}}
 emit(e){
  if(!this.data){if(this.pending.length<32)this.pending.push(e);return false;}
  const profiles=this.data.weapons[e.weapon];if(!profiles?.length)return false;
  if(e.materialName){
   const p=profiles.find(p=>p.name.toLowerCase()===e.materialName.toLowerCase());if(!p)return false;
   if(e.materialId&&this.seenZones.has(e.materialId))return true;
   if(e.materialId)this.seenZones.add(e.materialId);
   const angle=(e.materialAngle??270)*Math.PI/180,speed=(e.materialPower??0)*7;
   this.sources.push({profile:p,weapon:e.weapon,materialId:e.materialId,x:e.x,y:e.y-2,vx:e.vx??Math.cos(angle)*speed,vy:e.vy??Math.sin(angle)*speed,age:e.age||0,life:p.life,phase:0,grounded:false});
   if(this.sources.length>MAX_SOURCES)this.sources.splice(0,this.sources.length-MAX_SOURCES);return true;
  }
  let seed=((e.id||1)*2654435761)>>>0;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const authored=this.data.emissions[e.weapon];let commands=authored?.length?authored:profiles.map((_,index)=>({index,delay:0,x:[0,0],y:[0,0],angle:[190,160],power:[5,10]}));
  if(e.materialTriggers)commands=commands.filter(command=>e.materialTriggers.includes(command.trigger));
  if(!commands.length)return false;
  const sample=range=>range[0]+rand()*range[1];
  for(const command of commands){
   const p=profiles[command.index],angle=sample(command.angle)*Math.PI/180,speed=sample(command.power)*8;
   this.sources.push({profile:p,weapon:e.weapon,x:e.x+sample(command.x),y:e.y+sample(command.y)-2,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:-command.delay,life:p.life,phase:0,grounded:false});
  }
  if(this.sources.length>MAX_SOURCES)this.sources.splice(0,this.sources.length-MAX_SOURCES);
  return true;
 }
 draw(c,dt,surface,zones=[]){
  if(!this.data)return;
  for(const z of zones){if(this.seenZones.has(z.id))continue;if(z.kind==='authored-material')this.emit(z);else{this.seenZones.add(z.id);if(!this.sources.some(p=>p.weapon===z.weapon))this.emit({...z,kind:'material'});}}
  if(this.seenZones.size>256){
   const live=new Set([...zones.map(z=>z.id),...this.sources.map(p=>p.materialId)]);
   // Prune only previously accepted IDs. Replacing this set with every live
   // zone would mark an unrenderable/missing profile as successfully emitted.
   this.seenZones=new Set([...this.seenZones].filter(id=>live.has(id)));
  }
  if(!this.sources.length&&!this.active)return;
  const target=this.sources.length?Math.max(0,Math.floor((Math.max(...this.sources.map(p=>p.y))-700)/S)*S):this.origin;
  if(Math.abs(target-this.origin)>128){this.origin=target;for(const f of this.fields){f.a.fill(0);f.b.fill(0);f.bounds=null;f.ctx.clearRect(0,0,W,H);}}
  this.accumulator+=clamp(dt,0,.05);
  while(this.accumulator>=1/30){this.accumulator-=1/30;this.step(surface);}
  c.save();c.imageSmoothingEnabled=true;
  for(const f of this.fields){c.globalCompositeOperation=f.mode==='FIRE'?'lighter':'source-over';c.drawImage(f.canvas,0,this.origin,W*S,H*S);}
  c.globalCompositeOperation='source-over';
  for(const p of this.sources){if(p.age<0||p.profile.mode!=='SCREEN')continue;const name=p.profile.frames[(Math.floor(p.age*p.profile.fps)+p.phase)%p.profile.frames.length];let sprite=this.sprites.get(name);if(!sprite){const m=this.data.frames[name];sprite=document.createElement('canvas');sprite.width=m.w;sprite.height=m.h;const ctx=sprite.getContext('2d'),data=ctx.createImageData(m.w,m.h);m.pixels.forEach((v,i)=>{const rgb=m.colors[v]||[255,255,255];data.data.set([...rgb,v?255:0],i*4);});ctx.putImageData(data,0,0);this.sprites.set(name,sprite);}c.globalAlpha=clamp((p.life-p.age)/.25,0,1);c.drawImage(sprite,p.x-sprite.width,p.y-sprite.height,sprite.width*2,sprite.height*2);}
  c.restore();
 }
 step(surface){
  const dt=1/30;this.time+=dt;this.active=false;
  // Heat rises, vapour drifts, water leaves a denser descending wake. A fixed
  // simulation cadence makes persistence independent of display refresh rate.
  for(const f of this.fields){
   const {a,b}=f;const rise=f.mode==='GAS'?-1:1,decay=f.mode==='FOG'?.96:f.mode==='GAS'?.91:.94;
   b.fill(0);
   const box=f.bounds,next=[W,H,0,0];
   if(box)for(let y=Math.max(1,box[1]-1);y<=Math.min(H-2,box[3]+1);y++)for(let x=Math.max(1,box[0]-1);x<=Math.min(W-2,box[2]+1);x++){
    const i=y*W+x,j=i+rise*W;
    b[i]=Math.max(0,(a[j]*2+a[j-1]+a[j+1]+a[i])*.2*decay-.055);
    if(b[i]>.02){next[0]=Math.min(next[0],x);next[1]=Math.min(next[1],y);next[2]=Math.max(next[2],x);next[3]=Math.max(next[3],y);}
   }
   f.a=b;f.b=a;f.bounds=next[0]<=next[2]?next:null;
  }
  let count=0;
  for(const p of this.sources){
   p.age+=dt;if(p.age>=p.life)continue;this.sources[count++]=p;if(p.age<0)continue;
   const cfg=p.profile;if(cfg.gravity)p.vy+=220*dt;else{p.vy*=.94;p.vy-=dt*5;p.vx*=.97;}
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   const floor=surface(p.x)-1;
   if(cfg.gravity&&p.y>=floor){p.y=floor;const slope=(surface(p.x+4)-surface(p.x-4))/8;
    if(!p.grounded&&Math.abs(p.vy)>25&&cfg.bounce){p.vy=-Math.abs(p.vy)*clamp(cfg.bounce*.18,.05,.5);p.vx*=.72;}else{p.grounded=true;p.vy=0;p.vx=(p.vx+slope*90*dt)*.87;}
   }
   if(cfg.mode==='SCREEN')continue;
   const name=cfg.frames[(Math.floor(p.age*cfg.fps)+p.phase)%cfg.frames.length],mask=this.data.frames[name];if(!mask)continue;
   const mode=cfg.mode==='FIRE'?'FIRE':cfg.mode==='GAS'?'GAS':cfg.mode==='FOG'?'FOG':/acid|glue|rubber/i.test(cfg.name)?'GAS':'FOG';
   const f=this.fields.find(v=>v.mode===mode),scale=cfg.type==='FOG'?Math.max(1,cfg.size/Math.max(mask.w,mask.h)):1;
   const energy=clamp((p.life-p.age)/.3,0,1),cx=(p.x/S)|0,cy=((p.y-this.origin)/S)|0;
   const radius=Math.max(0,Math.ceil(Math.max(mask.w,mask.h)*scale/S)-1);
   for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){
    const x=cx+ox,y=cy+oy;if(x<=0||x>=W-1||y<=0||y>=H-1)continue;
    const mx=clamp(Math.floor((ox/(radius||1)+1)*.5*mask.w),0,mask.w-1),my=clamp(Math.floor((oy/(radius||1)+1)*.5*mask.h),0,mask.h-1);
    const edge=cfg.type==='FOG'?Math.max(0,1-(ox*ox+oy*oy)/((radius+1)**2)):1;
    const value=mask.pixels[my*mask.w+mx]*edge;f.a[y*W+x]=Math.min(31,Math.max(f.a[y*W+x],value*energy));
    if(value){const b=f.bounds||(f.bounds=[x,y,x,y]);b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);}
   }
  }
  this.sources.length=count;
  for(const f of this.fields){const out=f.pixels.data,box=f.bounds;f.ctx.clearRect(0,0,W,H);if(!box)continue;
   for(let y=box[1];y<=box[3];y++)for(let x=box[0];x<=box[2];x++){const i=y*W+x;
    const v=clamp(f.a[i]/31,0,1),j=i*4;if(v>.015)this.active=true;
    if(f.mode==='FIRE'){out[j]=Math.min(255,v*900);out[j+1]=Math.max(0,(v-.18)*430);out[j+2]=Math.max(0,(v-.6)*620);out[j+3]=Math.min(255,v*550);}
    else if(f.mode==='GAS'){out[j]=100+v*130;out[j+1]=175+v*75;out[j+2]=255;out[j+3]=Math.min(220,v*320);}
    else{out[j]=170+v*45;out[j+1]=163+v*50;out[j+2]=187+v*45;out[j+3]=Math.min(180,v*220);}
   }f.ctx.putImageData(f.pixels,0,0,box[0],box[1],box[2]-box[0]+1,box[3]-box[1]+1);
  }
 }
}
