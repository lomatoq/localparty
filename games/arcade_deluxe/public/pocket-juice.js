// Pocket Siege feel layer (TV renderer only).
// Reads authoritative events/snapshots and never feeds anything back into the
// simulation. Everything is clocked by the renderer's dt, which is 0 while the
// match is paused, and randomness is seeded from event ids, so a paused frame
// stays pixel-identical. All pools are bounded; reduced motion removes camera
// kick, hull squash and scale pops and thins particles.
import {PocketWorld,SOIL_CHIPS} from './pocket-world.js';
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
const idPhase=id=>{let h=7;for(const ch of String(id??''))h=(h*31+ch.charCodeAt(0))%997;return h/997*TAU;};
function mixHex(a,b,t){const p=h=>{const m=/^#([0-9a-f]{6})$/i.exec(h||'');return m?[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)):null;},x=p(a),y=p(b);if(!x||!y)return t<.5?a:b;return 'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')+')';}
// Weapon-family personalities: exhaust smoke, spark colour, blast light tint.
const FAMILY={shell:{smoke:'#a49bb8',spark:'#ffc46a'},seeker:{smoke:'#d6e2ff',spark:'#7fe0ff'},cluster:{smoke:'#b39cc9',spark:null},spread:{smoke:'#b39cc9',spark:null},chain:{smoke:'#a49bb8',spark:null},fire:{smoke:'#6e5660',spark:'#ff8a2a',light:'#ff6a1a'},dirt:{smoke:'#a0825e',spark:null,light:'#c9a46a'},drill:{smoke:'#9a8a78',spark:'#ffd9a0'},roller:{smoke:'#a89a7a',spark:null},bounce:{smoke:'#c0b8d8',spark:'#b8ffd0'},jump:{smoke:'#c0b8d8',spark:'#ffe9a0'},rail:{smoke:null,spark:'#9ff3ff',light:'#7fe0ff'},lightning:{smoke:null,spark:'#d4f8ff',light:'#8fe8ff'}};
const ART=['explosion-1','explosion-2','explosion-3','smoke-puff-a','smoke-puff-b','shockwave-ring','scorch-decal','muzzle-flash-side','dust-puff'];
const MAX_FLUTTER=70,MAX_PARTS=260,MAX_PUFFS=240,MAX_SCORCH=24,MAX_DEBRIS=160,MAX_CALLOUTS=6;
const SOIL=SOIL_CHIPS;
const art={};let requested=false;
function loadArt(){
 if(requested||typeof Image==='undefined')return;requested=true;
 for(const key of ART){const img=new Image();img.src=new URL('assets/fx/'+key+'.webp',import.meta.url).href;
  // Register fully decoded art copied into a canvas: WebKit can draw an
  // HTMLImageElement's first scaled use one LSB differently, and paused frames
  // must be pixel-identical.
  img.decode().then(()=>{const el=document.createElement('canvas');el.width=img.naturalWidth;el.height=img.naturalHeight;el.getContext('2d').drawImage(img,0,0);art[key]=el;},()=>{});}
}
function seeded(id){let seed=(((id||1)*2654435761)^0x5bd1e995)>>>0;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

export class PocketJuice {
 constructor(reduced=false){this.reduced=reduced;this.soft=new Map();this.world=new PocketWorld(reduced);this.wind=0;this.cam=null;this.clear();loadArt();}
 clear(){this.parts=[];this.debris=[];this.flutter=[];this.puffs=[];this.scorches=[];this.callouts=[];this.trails=new Map();this.flashes=new Map();this.recent=[];this.clock=0;this.trauma=0;this.punch=0;this.frameStamp=0;this.dustTravel=new Map();this.scorchRevision=(this.scorchRevision||0)+1;this.damage=new Map();this.knock=new Map();this.smokeTimer=new Map();this.banner=null;this.flashScreen=null;this.lastNuke=null;this.nearMiss=[];this.cheer=new Map();this.dizzy=new Map();this.focus=null;this.lastBlast=null;this.world.clear();}
 // Soft round sprite per tint; cheaper than shadowBlur or per-particle gradients.
 sprite(color){
  let el=this.soft.get(color);if(el)return el;el=this.makeSoft(color);if(this.soft.size>=24)this.soft.delete(this.soft.keys().next().value);this.soft.set(color,el);return el;
 }
 // WebKit can raster a canvas's first use as an image source one LSB apart
 // from later uses; warm each new soft sprite once so paused frames match.
 makeSoft(color){
  let el;
  el=document.createElement('canvas');el.width=el.height=64;const c=el.getContext('2d'),g=c.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,color);g.addColorStop(.45,color+'aa');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(0,0,64,64);
  this.warm??=document.createElement('canvas');this.warm.width=this.warm.height=8;const w=this.warm.getContext('2d');w.drawImage(el,0,0,8,8);w.globalCompositeOperation='lighter';w.drawImage(el,0,0,8,8);return el;
 }
 part(p){if(this.reduced){if(p.ring)return;if(p.grow)p={...p,grow:p.grow*.3};}if(this.parts.length>=MAX_PARTS)this.parts.shift();this.parts.push({age:0,delay:0,vx:0,vy:0,rot:0,vr:0,alpha:1,...p});if(p.kind==='light')this.sprite(p.color);}
 // Confetti and leaves have their own small pool so a nuke's debris never evicts them.
 chunk(p){const list=p.confetti?this.flutter:this.debris,max=p.confetti?MAX_FLUTTER:MAX_DEBRIS;if(list.length>=max)list.shift();list.push({age:0,delay:0,...p});}
 puff(p){if(this.puffs.length>=MAX_PUFFS)this.puffs.shift();this.puffs.push({age:0,delay:0,vx:0,vy:0,alpha:.4,color:'#9c90b0',...p});this.sprite(this.puffs.at(-1).color);}
 kick(amount,punch=0){if(this.reduced)return;this.trauma=Math.min(1,this.trauma+amount);this.punch=Math.min(.05,this.punch+punch);}
 // Returns the world offset/zoom for this frame. dt=0 (paused) freezes it.
 camera(dt){
  this.trauma=Math.max(0,this.trauma-dt*1.9);this.punch*=Math.exp(-dt*11);if(this.punch<.0005)this.punch=0;
  const k=this.trauma*this.trauma,t=this.clock;
  return {x:9*k*Math.sin(t*47),y:7*k*Math.sin(t*61+1.3),zoom:1+this.punch,focus:this.focusFrame()};
 }
 // Turn choreography: a short push-in on the active tank (released early if it
 // fires), returned as a screen-space zoom about the tank.
 focusFrame(){
  const f=this.focus;if(!f||this.reduced||!this.cam)return null;const t=this.clock-f.at,UP=.4,HOLD=.6,DOWN=.75;
  if(t>=UP+HOLD+DOWN){this.focus=null;return null;}const k=t<UP?smooth(t/UP):t<UP+HOLD?1:1-smooth((t-UP-HOLD)/DOWN);if(k<=0)return null;
  const cam=this.cam;return {x:640+(f.x-cam.x)*cam.z,y:360+(f.y-cam.y)*cam.z,z:1+.065*k};
 }
 releaseFocus(){const f=this.focus;if(!f)return;const t=this.clock-f.at,UP=.4,HOLD=.6,DOWN=.75;if(t<UP+HOLD){const k=t<UP?smooth(t/UP):1;f.at=this.clock-(UP+HOLD)-DOWN*(1-k)*.5;}}
 event(e,s,ground){
  if(e.kind==='turn'){
   const p=s?.players?.find(q=>q.id===e.player),n=(s?.players||[]).filter(q=>q.participant).length,total=(Number(s?.rounds)||0)*n;
   if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&!this.reduced)this.focus={at:this.clock,x:p.x,y:p.y-12};
   if(n>1&&total&&Number.isFinite(s.turn)){const text=s.turn===total-1?'LAST SHOT!':Math.floor(s.turn/n)+1===s.rounds&&s.turn%n===0?'FINAL ROUND':'';if(text)this.banner={text,at:this.clock,color:p?.color||'#ffe083'};}
   return;
  }
  if(!Number.isFinite(e.x)||!Number.isFinite(e.y))return;
  const rand=seeded(e.id),wind=Number(s?.wind)||0;
  if(e.kind==='blast'){
   const r=clamp(Number(e.r)||20,6,150),floor=ground(e.x),grounded=e.y>floor-r-8;
   this.recent=this.recent.filter(t=>this.clock-t<.3);this.recent.push(this.clock);
   const crowd=this.recent.length>3,scale=clamp(r/40,.35,2.6),fam=FAMILY[e.family]||FAMILY.shell,hex=/^#[0-9a-f]{6}$/i.test(e.color||'')?e.color:null;
   const dirt=e.family==='dirt',nuke=!dirt&&(r>=90||/nuke/i.test(String(e.weapon||''))),tint=fam.light||(['cluster','spread','chain'].includes(e.family)&&hex)||'#ff9a3c';
   this.lastBlast={x:e.x,y:e.y,r,at:this.clock};
   if(dirt){
    // Dirt weapons build ground: an earthy splash, no fireball or scorch.
    this.part({kind:'light',x:e.x,y:e.y,life:.25,size:r*2.6,color:tint,add:true,alpha:.25});
    for(let i=0;i<(crowd?1:this.reduced?2:4);i++)this.part({kind:'img',img:'dust-puff',x:e.x+(rand()-.5)*r,y:e.y-rand()*r*.4,life:.9+rand()*.5,delay:rand()*.08,size:r*(.9+rand()*.6),grow:.7,vy:-10-rand()*14,vx:wind*.8+(rand()-.5)*14,rot:rand()*TAU,alpha:.6,fadeIn:.05,smoke:true});
    const count=this.reduced?3:crowd?3:clamp(Math.round(r*.35),5,16);
    for(let i=0;i<count;i++){const a=-Math.PI/2+(rand()-.5)*2.6,v=(80+rand()*160)*Math.sqrt(scale);this.chunk({x:e.x+(rand()-.5)*r*.6,y:e.y-2,vx:Math.cos(a)*v+wind,vy:Math.sin(a)*v,g:640,life:1.1+rand()*.7,size:1.1+rand()*1.7,delay:.02,rot:rand()*TAU,vr:(rand()-.5)*12,color:SOIL[1+i%(SOIL.length-1)],shade:rand()});}
    this.kick(crowd?.03:.08,.004);return;
   }
   this.part({kind:'light',x:e.x,y:e.y,life:.32,size:r*4.2,color:tint,add:true,alpha:.55});
   rand();this.part({kind:'img',img:'explosion-1',x:e.x,y:e.y,life:.17,size:r*2.3,grow:.25,add:true});
   // One nuke moment per salvo: multi-stage nukes emit several large blasts.
   if(nuke&&!crowd&&!(this.clock-(this.lastNuke??-9)<3)){this.lastNuke=this.clock;this.nuke(e,r,floor,rand,wind);}
   if(fam.spark||hex){const n=this.reduced?2:crowd?2:clamp(Math.round(r/7),4,10),col=fam.spark||hex;for(let i=0;i<n;i++){const a=rand()*TAU,v=(90+rand()*200)*Math.sqrt(scale);this.puff({x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(e.family==='fire'?60:0),life:.35+rand()*.35,size:1.6+rand()*1.4,grow:.4,alpha:.95,color:col,add:true});}}
   if(e.family==='fire'&&!this.reduced)for(let i=0;i<(crowd?2:7);i++)this.puff({x:e.x+(rand()-.5)*r,y:e.y-rand()*r*.5,vx:wind*1.5+(rand()-.5)*30,vy:-50-rand()*70,life:.9+rand()*.6,size:1.8,grow:.3,alpha:.9,color:'#ffab40',add:true});
   if(grounded&&r>=10)this.world.addEmber(e.x,e.y,r);
   // Near misses: tanks just outside the blast flinch unless a hit lands on them.
   if(!crowd)for(const p of s?.players||[]){if(!p.participant||!Number.isFinite(p.x))continue;const d=Math.hypot(p.x-e.x,p.y-8-e.y);if(d<r+46&&d>r*.55){this.nearMiss.push({id:p.id,at:this.clock,dir:Math.sign(p.x-e.x)||1,x:p.x,y:p.y,color:p.color});if(this.nearMiss.length>8)this.nearMiss.shift();}}
   // Grass and leaf bits ride the wind after a ground blast.
   if(grounded&&!crowd&&!this.reduced)for(let i=0;i<4;i++){const a=-Math.PI/2+(rand()-.5)*1.6,v=120+rand()*140;this.chunk({x:e.x+(rand()-.5)*r*.6,y:Math.min(e.y,floor)-3,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:260,life:2.4+rand(),size:1.6+rand(),rot:rand()*TAU,vr:(rand()-.5)*10,color:['#62c449','#8fdf5e','#3f9e3a','#b6f27c'][i],shade:rand(),confetti:true});}
   if(!crowd||rand()<.35){
    this.part({kind:'img',img:'explosion-2',x:e.x,y:e.y-r*.1,life:.38,delay:.03,size:r*1.9,grow:.3,rot:(rand()-.5)*.6,fadeIn:.04});
    this.part({kind:'img',img:'explosion-3',x:e.x,y:e.y-r*.15,life:.75,delay:.14,size:r*2.1,grow:.35,vy:-14*scale,vx:wind*.8,rot:(rand()-.5)*.6,alpha:.85,fadeIn:.08});
    if(r>=12)this.part({kind:'img',img:'shockwave-ring',x:e.x,y:e.y,life:.34,size:r*.7,grow:3.4,add:true,alpha:.8,ring:true});
    const smoke=this.reduced?1:clamp(Math.round(r/18),1,4);
    for(let i=0;i<smoke;i++)this.part({kind:'img',img:i%2?'smoke-puff-b':'smoke-puff-a',x:e.x+(rand()-.5)*r*.8,y:e.y-r*.3,life:1.5+rand()*.7,delay:.28+rand()*.18,size:r*(.9+rand()*.5),grow:.9,vy:-(16+rand()*16)*Math.sqrt(scale),vx:wind*1.6+(rand()-.5)*10,rot:rand()*TAU,vr:(rand()-.5)*.5,alpha:.42,fadeIn:.2,smoke:true});
   }
   if(grounded){
    const colors=Array.isArray(e.terrainMaterial)&&e.terrainMaterial.length?e.terrainMaterial:SOIL,count=this.reduced?3:crowd?4:clamp(Math.round(r*.45),6,22);
    for(let i=0;i<count;i++){const a=-Math.PI/2+(rand()-.5)*2.3,v=(110+rand()*230)*Math.sqrt(scale);this.chunk({x:e.x+(rand()-.5)*r*.5,y:Math.min(e.y,floor)-2,vx:Math.cos(a)*v+wind,vy:Math.sin(a)*v,g:640,life:1.3+rand()*.9,size:1.1+rand()*1.9*Math.min(1.5,scale),delay:.03,rot:rand()*TAU,vr:(rand()-.5)*14,color:colors[i%colors.length],shade:rand()});}
    if(!this.reduced)for(let i=0;i<(crowd?1:3);i++)this.puff({x:e.x+(rand()-.5)*r*1.2,y:floor-3,vx:(rand()-.5)*40+wind,vy:-8-rand()*10,life:1.1+rand()*.6,size:r*.5+8,grow:1.6,alpha:.32,color:'#a89a7a'});
    if(r>=9){this.scorches.push({x:e.x,y:Math.max(e.y,floor-r*.4),r:r*1.15,a:rand()*TAU});if(this.scorches.length>MAX_SCORCH)this.scorches.shift();this.scorchRevision++;}
   }
   const tier=r<16?.12:r<32?.24:r<64?.38:.55;this.kick(crowd?tier*.35:tier,crowd?.004:clamp(r/2200,.006,.03));
  }else if(e.kind==='muzzle'){
   this.releaseFocus();
   const p=s?.players?.find(q=>q.id===e.player),a=(Number(p?.angle)||45)*Math.PI/180,dx=Math.cos(a),dy=-Math.sin(a);
   this.part({kind:'img',img:'muzzle-flash-side',x:e.x+dx*9,y:e.y+dy*9,life:.11,size:30,grow:.4,add:true,rot:Math.atan2(dy,dx),aspect:.6});
   this.part({kind:'light',x:e.x,y:e.y,life:.16,size:70,color:'#ffc06a',add:true,alpha:.5});
   for(let i=0;i<(this.reduced?1:3);i++)this.puff({x:e.x+dx*(4+i*5),y:e.y+dy*(4+i*5),vx:dx*(30+i*14)+wind,vy:dy*(30+i*14)-10,life:.7+rand()*.4,size:5+i*2,grow:2.2,alpha:.36});
   if(p&&Number.isFinite(p.x)&&!this.reduced)for(const side of [-1,1])this.puff({x:p.x+side*17,y:p.y+5,vx:side*(22+rand()*18)-dx*20,vy:-6-rand()*6,life:.6,size:6,grow:1.8,alpha:.28,color:'#a89a7a'});
   this.kick(.07);
  }else if(e.kind==='hit'){
   const damage=Number(e.damage)||0;this.flashes.set(e.target,this.clock);this.nearMiss=this.nearMiss.filter(q=>q.id!==e.target);
   // Knockback squash away from the latest blast; battle wear accumulates per round.
   const from=this.lastBlast&&this.clock-this.lastBlast.at<1.5?this.lastBlast.x:e.x;this.knock.set(e.target,{at:this.clock,dir:Math.sign(e.x-from)||(rand()<.5?-1:1)});this.damage.set(e.target,(this.damage.get(e.target)||0)+Math.abs(damage));if(Math.abs(damage)>=35){this.dizzy.set(e.target,this.clock);if(this.dizzy.size>16)this.dizzy.delete(this.dizzy.keys().next().value);}if(this.damage.size>16)this.damage.delete(this.damage.keys().next().value);
   // Multi-stage weapons hit the same tank several times: grow one callout.
   const same=this.callouts.find(q=>q.target===e.target&&q.age<q.life*.8),total=(same?.damage||0)+damage;
   if(e.self||total>=25){
    const text=e.self?'SELF HIT':total>=80?'DEVASTATING!':total>=50?'MASSIVE HIT!':'DIRECT HIT!',color=s?.players?.find(q=>q.id===e.player)?.color||'#ffe083';
    if(!e.self&&total>=50&&!same?.big)this.celebrate(s?.players?.find(q=>q.id===e.player),e.id);
    if(same)Object.assign(same,{text,damage:total,big:total>=50,age:Math.min(same.age,.05)});
    else{this.callouts.push({text,color,target:e.target,damage:total,x:e.x,y:e.y-104,age:0,life:1.35,big:total>=50});if(this.callouts.length>MAX_CALLOUTS)this.callouts.shift();}
   }else if(!same)this.callouts.push({text:'',target:e.target,damage:total,x:e.x,y:e.y-104,age:0,life:1.35,big:false});
  }else if(e.kind==='land'){
   for(let i=0;i<(this.reduced?2:6);i++)this.puff({x:e.x+(rand()-.5)*30,y:e.y+4,vx:(i%2?1:-1)*(30+rand()*40),vy:-10-rand()*10,life:.8+rand()*.4,size:7,grow:1.8,alpha:.32,color:'#a89a7a'});
   this.kick(.1);
  }else if(e.kind==='split'){
   // Cluster carrier splitting: a crisp pop in the weapon colour.
   const col=/^#[0-9a-f]{6}$/i.test(e.color||'')?e.color:'#ffe08a';this.part({kind:'light',x:e.x,y:e.y,life:.22,size:58,color:col,add:true,alpha:.7});
   for(let i=0;i<(this.reduced?2:6);i++){const a=i/6*TAU+rand()*.5,v=70+rand()*90;this.puff({x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.3+rand()*.2,size:1.8,grow:.3,alpha:.95,color:col,add:true});}
  }else if(e.kind==='intercept'){
   // Air defense struck a shell: a real aerial explosion, then hot fragments
   // that fall, smoke and bounce on the terrain.
   const col=/^#[0-9a-f]{6}$/i.test(e.color||'')?e.color:'#c8ff73',defender=s?.players?.find(q=>q.id===e.player);
   this.part({kind:'light',x:e.x,y:e.y,life:.4,size:240,color:'#ffcf7a',add:true,alpha:.65});this.part({kind:'light',x:e.x,y:e.y,life:.55,size:130,color:col,add:true,alpha:.5});
   this.part({kind:'img',img:'explosion-1',x:e.x,y:e.y,life:.18,size:96,grow:.3,add:true});
   this.part({kind:'img',img:'explosion-2',x:e.x,y:e.y,life:.4,delay:.02,size:80,grow:.35,rot:rand()*TAU,fadeIn:.03});
   this.part({kind:'img',img:'explosion-3',x:e.x,y:e.y-6,life:.85,delay:.1,size:88,grow:.4,vy:-16,vx:wind*.8,rot:rand()*TAU,alpha:.85,fadeIn:.06});
   this.part({kind:'img',img:'shockwave-ring',x:e.x,y:e.y,life:.36,size:22,grow:3.6,add:true,alpha:.85,ring:true});
   // The shell's own payload cooks off a beat later, just beside the first burst.
   const ox=(rand()-.5)*26,oy=(rand()-.5)*18;this.part({kind:'img',img:'explosion-1',x:e.x+ox,y:e.y+oy,life:.14,delay:.13,size:54,grow:.3,add:true});this.part({kind:'img',img:'explosion-2',x:e.x+ox,y:e.y+oy,life:.32,delay:.15,size:46,grow:.3,rot:rand()*TAU,fadeIn:.03});
   for(let i=0;i<(this.reduced?1:3);i++)this.part({kind:'img',img:i%2?'smoke-puff-b':'smoke-puff-a',x:e.x+(rand()-.5)*18,y:e.y,life:1.9,delay:.25,size:58,grow:.9,vy:-10,vx:wind*1.4,rot:rand()*TAU,alpha:.42,fadeIn:.2,smoke:true});
   for(let i=0;i<(this.reduced?4:18);i++){const a=rand()*TAU,v=130+rand()*260;this.puff({x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.3+rand()*.35,size:1.5+rand(),grow:.3,alpha:.95,color:i%3?'#fff1b8':col,add:true});}
   this.fragments(e.x,e.y,this.reduced?4:12,rand,wind,true);
   this.kick(.14,.006);
   this.callouts.push({text:'INTERCEPTED!',color:defender?.color||col,target:null,damage:0,x:e.x,y:e.y-46,age:0,life:1.25,big:false});if(this.callouts.length>MAX_CALLOUTS)this.callouts.shift();
  }else if(e.kind==='air-defense-expire'){
   // The interceptor ends without a hit: it never just vanishes.
   if(e.x<2||e.x>1278||e.y< -560)return;const floor=ground(e.x),onGround=e.y>=floor-7;
   this.part({kind:'light',x:e.x,y:e.y,life:.26,size:90,color:'#ffb35c',add:true,alpha:.55});
   this.part({kind:'img',img:'explosion-1',x:e.x,y:e.y,life:.14,size:34,grow:.3,add:true});
   this.part({kind:'img',img:'explosion-2',x:e.x,y:e.y-2,life:.3,delay:.02,size:28,grow:.3,rot:rand()*TAU});
   this.part({kind:'img',img:'smoke-puff-a',x:e.x,y:e.y-4,life:1.2,delay:.15,size:26,grow:.9,vy:-12,vx:wind*1.4,rot:rand()*TAU,alpha:.38,fadeIn:.15,smoke:true});
   for(let i=0;i<(this.reduced?2:7);i++){const a=rand()*TAU,v=80+rand()*150;this.puff({x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(onGround?60:0),life:.3+rand()*.3,size:1.5,grow:.3,alpha:.95,color:'#ffe2a0',add:true});}
   if(onGround){for(let i=0;i<(this.reduced?2:6);i++){const a=-Math.PI/2+(rand()-.5)*2,v=90+rand()*120;this.chunk({x:e.x,y:floor-2,vx:Math.cos(a)*v+wind,vy:Math.sin(a)*v,g:640,life:1.2+rand()*.6,size:1.1+rand()*1.3,rot:rand()*TAU,vr:(rand()-.5)*12,color:SOIL[1+i%(SOIL.length-1)],shade:rand()});}if(!this.reduced)this.puff({x:e.x,y:floor-3,vx:wind,vy:-8,life:1,size:12,grow:1.5,alpha:.3,color:'#a89a7a'});}
   else this.fragments(e.x,e.y,this.reduced?2:5,rand,wind,false);
   this.kick(.05);
  }else if(e.kind==='bounce'){
   // Ricochet: a spark spray and a dust kick.
   this.part({kind:'light',x:e.x,y:e.y,life:.14,size:40,color:'#ffd27a',add:true,alpha:.55});
   for(let i=0;i<(this.reduced?2:7);i++){const a=-Math.PI/2+(rand()-.5)*2.4,v=90+rand()*140;this.puff({x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.22+rand()*.2,size:1.3,grow:.2,alpha:1,color:i%2?'#fff1b8':'#ffb347',add:true});}
   for(let i=0;i<(this.reduced?1:2);i++)this.puff({x:e.x+(rand()-.5)*14,y:e.y,vx:(rand()-.5)*50+wind,vy:-12-rand()*14,life:.8,size:6,grow:1.6,alpha:.26,color:'#a89a7a'});
  }else if(e.kind==='dirt'){
   for(let i=0;i<(this.reduced?1:3);i++)this.puff({x:e.x+(rand()-.5)*14,y:e.y,vx:(rand()-.5)*50+wind,vy:-12-rand()*14,life:.8,size:6,grow:1.6,alpha:.26,color:'#a89a7a'});
  }
 }
 // Falling hot metal fragments (air-defense hits); some trail smoke.
 fragments(x,y,n,rand,wind,hot){for(let i=0;i<n;i++){const a=rand()*TAU,v=70+rand()*190;this.chunk({x,y,vx:Math.cos(a)*v+wind*.5,vy:Math.sin(a)*v-90,g:480,life:3.4+rand()*.8,size:2+rand()*1.6,rot:rand()*TAU,vr:(rand()-.5)*16,color:hot&&i%2===0?'#ffb347':['#4a4358','#6b6380','#2e2838'][i%3],hot:hot&&i%2===0,smoke:i%3!==2,shade:rand()});}}
 // A big hit: the shooter's tank cheers and a confetti fountain pops out.
 celebrate(p,seed){
  if(!p||!Number.isFinite(p.x))return;this.cheer.set(p.id,this.clock);if(this.reduced)return;const rand=seeded((seed||7)*31+5),cols=[p.color,'#ffe083','#ff7ab8','#7fe0ff','#ffffff'];
  for(let i=0;i<22;i++){const a=-Math.PI/2+(rand()-.5)*1.3,v=180+rand()*170;this.chunk({x:p.x,y:p.y-24,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:300,life:2.4+rand()*.8,size:3+rand()*1.6,rot:rand()*TAU,vr:(rand()-.5)*14,color:cols[i%cols.length],shade:rand(),confetti:true,delay:i*.012});}
  this.part({kind:'light',x:p.x,y:p.y-20,life:.4,size:90,color:p.color||'#ffe083',add:true,alpha:.45});
 }
 // Nuke moment: a white screen flash, a ground shock ring and a mushroom cloud
 // (rising stem, rolling cap with a fire glow underneath).
 nuke(e,r,floor,rand,wind){
  this.flashScreen={at:this.clock,k:clamp(r/135,.55,1)};const gy=Math.min(e.y,floor);
  this.part({kind:'img',img:'shockwave-ring',x:e.x,y:gy-2,life:.7,size:r*.7,grow:4.2,add:true,alpha:.9,ring:true,aspect:.26});
  // Narrow stem rising into a wide, flattened cap well above it.
  for(let i=0;i<6;i++)this.part({kind:'img',img:i%2?'smoke-puff-b':'smoke-puff-a',x:e.x+(rand()-.5)*r*.06,y:gy-r*.15-i*r*.24,life:3,delay:.2+i*.05,size:r*(.3+i*.025),grow:.35,vy:-30-i*3,vx:wind*.3,rot:rand()*TAU,alpha:.66,fadeIn:.15,smoke:true});
  for(let i=0;i<7;i++){const k=i-3;this.part({kind:'img',img:i%2?'smoke-puff-a':'smoke-puff-b',x:e.x+k*r*.27,y:gy-r*1.75+Math.abs(k)*r*.12,life:3.6,delay:.3+Math.abs(k)*.05,size:r*(.9-Math.abs(k)*.1),grow:.9,vy:-24,vx:k*9+wind*.6,rot:rand()*TAU,vr:(rand()-.5)*.3,alpha:.74,fadeIn:.18,smoke:true});}
  this.part({kind:'light',x:e.x,y:gy-r*1.55,life:2,delay:.25,size:r*2.6,color:'#ff7a2a',add:true,alpha:.55,vy:-24});
  this.part({kind:'light',x:e.x,y:gy-r*.4,life:1.2,delay:.15,size:r*2,color:'#ffcf6a',add:true,alpha:.45,vy:-26});
 }
 // Ground that collapsed or grew since the previous snapshot sheds a few crumbs.
 terrainDelta(before,after){
  if(!Array.isArray(before)||!Array.isArray(after)||before.length!==after.length||this.reduced)return;
  let spawned=0;const start=(this.frameStamp*7)%5;
  for(let i=start;i<after.length&&spawned<8;i+=5){const d=after[i]-before[i];if(Math.abs(d)<2.5)continue;spawned++;const rand=seeded(i+this.frameStamp*977);
   if(d>0)this.chunk({x:i*2+(rand()-.5)*4,y:before[i]+1,vx:(rand()-.5)*30,vy:-20-rand()*30,g:520,life:.9+rand()*.5,size:1.2+rand()*1.6,rot:rand()*TAU,vr:(rand()-.5)*10,color:SOIL[(i>>1)%SOIL.length],shade:rand()});
   else this.puff({x:i*2,y:after[i],vx:(rand()-.5)*14,vy:-6,life:.7,size:5,grow:1.5,alpha:.22,color:'#a89a7a'});
  }
 }
 // Shell exhaust: soft puffs dropped along the travelled path, blown by wind.
 trail(b,dt,wind,w,c){
  if(!Number.isFinite(b.x)||!Number.isFinite(b.y)||b.pellet||b.liquid)return;
  const fam=FAMILY[w?.family]||FAMILY.shell,hex=/^#[0-9a-f]{6}$/i.test(w?.color||'')?w.color:'#ffd17d',spark=fam.spark||hex;
  // Hot head glow in the weapon's colour, under the shell sprite.
  if(c){const g=fam.light||spark;c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.55;const sz=w?.family==='rail'||w?.family==='lightning'?34:24;c.drawImage(this.sprite(g),b.x-sz/2,b.y-sz/2,sz,sz);c.restore();}
  let last=this.trails.get(b.id);if(!last){this.trails.set(b.id,{x:b.x,y:b.y,stamp:this.frameStamp,carry:0,n:0});return;}
  last.stamp=this.frameStamp;if(!dt)return;
  const dx=b.x-last.x,dy=b.y-last.y,dist=Math.hypot(dx,dy),spacing=this.reduced?10:this.trails.size>10?16:7;
  if(dist>220){last.x=b.x;last.y=b.y;return;}
  let travelled=last.carry+dist,n=0;
  while(travelled>=spacing&&n<6){travelled-=spacing;n++;last.n=(last.n||0)+1;const k=1-travelled/Math.max(dist,.001),x=last.x+dx*k,y=last.y+dy*k;if(fam.smoke)this.puff({x,y,vx:(Number(wind)||0)*1.4,vy:-9,life:.75+(n%3)*.12,size:3.2,grow:2.6,alpha:.3,color:fam.smoke});if(last.n%2===0||!fam.smoke)this.puff({x:x+(last.n%3-1)*1.5,y:y+(last.n%5-2),vx:-dx*2+(last.n%3-1)*12,vy:-dy*2+(last.n%4-1.5)*10,life:.32+(last.n%3)*.06,size:1.5,grow:.3,alpha:.9,color:spark,add:true});}
  last.carry=travelled;last.x=b.x;last.y=b.y;
 }
 // Wheel dust while a tank actually drives (authoritative x changes).
 wheels(p,previousX,dt){
  // Battered tanks (heavy damage taken this round) smoke from the hull.
  const worn=this.damage.get(p.id)||0;
  if(dt&&worn>=40&&Number.isFinite(p.x)){let t=(this.smokeTimer.get(p.id)||0)+dt;const every=worn>=90?.12:.22,k=this.frameStamp;while(t>every){t-=every;this.puff({x:p.x-5+(k*7)%9-4,y:p.y-15,vx:this.wind*1.2+((k%5)-2)*3,vy:-24-(k%4)*4,life:1.7,size:5.5,grow:3,alpha:this.reduced?.24:.44,color:'#7a7086'});if(worn>=90&&k%3===0)this.puff({x:p.x-4,y:p.y-14,vx:0,vy:-30,life:.4,size:1.6,grow:.2,alpha:.9,color:'#ff9a3c',add:true});}this.smokeTimer.set(p.id,t);}
  if(!dt||this.reduced||!Number.isFinite(previousX))return;const dx=p.x-previousX;if(Math.abs(dx)<.05)return;
  let travel=(this.dustTravel.get(p.id)||0)+Math.abs(dx);
  while(travel>5){travel-=5;const back=dx>0?-1:1;this.puff({x:p.x+back*16,y:p.y+6,vx:back*(16+(this.frameStamp%5)*4),vy:-10-(this.frameStamp%3)*3,life:.55,size:4,grow:2,alpha:.26,color:'#a89a7a'});}
  this.dustTravel.set(p.id,travel);
 }
 battered(id){return clamp(((this.damage.get(id)||0)-30)/90,0,1);}
 // Per-tank presentation: idle bob, knockback squash/shove and hit flash.
 tankFx(id){
  const flash=this.hitFlash(id),k=this.knock.get(id);let sx=1,sy=1,dx=0;
  if(k&&!this.reduced){const t=this.clock-k.at;if(t>1.2)this.knock.delete(id);else if(t>=0){const amp=k.amp||1,sp=Math.exp(-t*7)*Math.cos(t*26)*amp;sy=1-.14*sp;sx=1+.1*sp;dx=k.dir*4.5*amp*(t<.05?t/.05:Math.exp(-(t-.05)*6));}}
  let hop=0;const ch=this.cheer.get(id);if(ch!=null&&!this.reduced){const t=this.clock-ch;if(t>1.3)this.cheer.delete(id);else if(t>=0)hop=-6*Math.abs(Math.sin(t*9))*Math.exp(-t*2.4);}
  let dizzy=0;const dz=this.dizzy.get(id);if(dz!=null){const t=this.clock-dz;if(t>1.6)this.dizzy.delete(id);else if(t>=.15)dizzy=t;}
  return {flash,sx,sy,dx,dizzy,spin:this.reduced?0:dizzy*5.5,bob:(this.reduced?0:.6*Math.sin(this.clock*2.3+idPhase(id)))+hop};
 }
 // Aim preview: the existing short arc, now sized dots shading from the team
 // colour to a power-hot tip, with a marching highlight.
 drawAim(c,pts,p){
  if(pts.length<2)return;const power=clamp((Number(p.power)||65)/100,0,1),hot=mixHex('#ffe27a','#ff4f3a',power),team=/^#[0-9a-f]{6}$/i.test(p.color||'')?p.color:'#c4ff38',n=pts.length,march=this.reduced?-1:(this.clock*1.4)%1;
  c.save();
  for(let i=0;i<n;i++){const q=pts[i],t=i/Math.max(1,n-1),r=3.4-1.9*t+power*.8*(1-t),near=march<0?0:Math.max(0,1-Math.abs(t-march)*7);
   c.globalAlpha=.9*(1-t*.5);c.fillStyle='rgba(18,8,28,.75)';c.beginPath();c.arc(q.x,q.y,r+1.5,0,TAU);c.fill();
   c.fillStyle=mixHex(team,hot,t);c.beginPath();c.arc(q.x,q.y,r*(1+near*.35),0,TAU);c.fill();
   if(near>.05){c.globalAlpha=near*.6;c.fillStyle='#fffbe8';c.beginPath();c.arc(q.x,q.y,r*.55,0,TAU);c.fill();}}
  c.restore();
 }
 hitFlash(id){const at=this.flashes.get(id);if(at==null)return 0;const k=1-(this.clock-at)/.22;if(k<=0){this.flashes.delete(id);return 0;}return k;}
 step(dt){
  this.clock+=dt;this.frameStamp+=dt?1:0;this.world.step(dt,this.wind);
  for(const [id,t] of this.trails)if(this.frameStamp-t.stamp>30)this.trails.delete(id);
  if(this.nearMiss.length&&dt){const due=this.nearMiss.filter(q=>this.clock-q.at>.3);if(due.length){this.nearMiss=this.nearMiss.filter(q=>this.clock-q.at<=.3);const seen=new Set();for(const q of due){if(seen.has(q.id))continue;seen.add(q.id);this.knock.set(q.id,{at:this.clock,dir:q.dir,amp:.55});if(!this.callouts.some(c=>c.text==='CLOSE CALL!'&&c.age<.6)){this.callouts.push({text:'CLOSE CALL!',color:q.color||'#ffe083',target:null,damage:0,x:q.x,y:q.y-64,age:0,life:1.1,big:false});if(this.callouts.length>MAX_CALLOUTS)this.callouts.shift();}}}}
 }
 drawPuffs(c,dt){
  if(!this.puffs.length)return;c.save();let w=0;
  for(const p of this.puffs){p.age+=dt;const age=p.age-p.delay;if(age>=p.life)continue;this.puffs[w++]=p;if(age<0)continue;
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-1.6*dt);p.vy*=Math.exp(-.8*dt);
   const t=age/p.life,size=p.size*(1+(p.grow||1)*Math.sqrt(t));c.globalCompositeOperation=p.add?'lighter':'source-over';c.globalAlpha=p.alpha*Math.min(1,age/.06)*(1-t)*(1-t*.4);c.drawImage(this.sprite(p.color),p.x-size,p.y-size,size*2,size*2);}
  this.puffs.length=w;c.restore();
 }
 drawDebris(c,dt,ground){this.drawChunks(c,dt,ground,this.debris);this.drawChunks(c,dt,ground,this.flutter);}
 drawChunks(c,dt,ground,list){
  if(!list.length)return;c.save();let w=0;
  for(const p of list){p.age+=dt;const age=p.age-p.delay;if(age>=p.life)continue;list[w++]=p;if(age<0)continue;const t=age/p.life;
   if(!p.rest){
    if(p.confetti){p.vy+=p.g*dt;p.vy*=Math.exp(-2.4*dt);p.vx+=(this.wind*.9-p.vx)*Math.min(1,dt*1.4);p.x+=(p.vx+Math.sin(age*7+p.shade*6)*24)*dt;p.y+=Math.min(p.vy,70)*dt;}
    else{p.vy+=p.g*dt;p.vx+=this.wind*.45*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
    p.rot+=p.vr*dt;const floor=ground(p.x);if(p.vy>0&&p.y>=floor-1){p.y=floor-1;if(p.vy>90&&!p.confetti){p.vy*=-.32;p.vx*=.55;p.vr*=.5;}else{p.rest=true;p.vx=p.vy=0;}}
    if(p.smoke&&dt){p.acc=(p.acc||0)+dt;if(p.acc>.04){p.acc=0;this.puff({x:p.x,y:p.y,vx:this.wind*.6,vy:-8,life:1.1,size:2.8,grow:2.4,alpha:.38,color:'#6a6072'});}}
   }
   if(p.hot&&age<2.2){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-age/2.2)*.9;c.drawImage(this.sprite('#ff9a3c'),p.x-8,p.y-8,16,16);c.restore();}
   if(p.confetti){c.globalAlpha=Math.min(1,(1-t)*3);c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.scale(1,Math.cos(age*9+p.shade*5));c.fillStyle=p.color;c.fillRect(-p.size*.9,-p.size*.45,p.size*1.8,p.size*.9);c.restore();continue;}
   c.globalAlpha=Math.min(1,(1-t)*3);c.save();c.translate(p.x,p.y);c.rotate(p.rot);const cw=p.size,ch=p.size*.75;c.fillStyle='#150a1499';c.beginPath();c.roundRect(-cw-.7,-ch-.7,cw*2+1.4,ch*2+1.4,ch*.8);c.fill();c.fillStyle=p.color;c.beginPath();c.roundRect(-cw,-ch,cw*2,ch*2,ch*.7);c.fill();c.fillStyle=p.shade>.5?'#ffffff40':'#ffffff22';c.beginPath();c.roundRect(-cw*.7,-ch*.85,cw*1.2,ch*.7,ch*.35);c.fill();c.restore();
  }
  list.length=w;c.restore();
 }
 drawParts(c,dt){
  c.save();let w=0;
  for(const p of this.parts){p.age+=dt;const age=p.age-p.delay;if(age>=p.life)continue;this.parts[w++]=p;if(age<0)continue;const t=age/p.life;
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;p.vx*=Math.exp(-.9*dt);p.vy*=Math.exp(-.7*dt);
   c.globalCompositeOperation=p.add?'lighter':'source-over';
   const fadeIn=p.fadeIn?Math.min(1,age/p.fadeIn):1,fade=p.ring?(1-t)*(1-t):p.smoke?Math.sin(Math.PI*Math.min(1,t*1.15))*(1-t*.3):1-t*t;
   const size=p.size*(1+(p.grow||0)*(p.ring?1-(1-t)**3:Math.sqrt(t)));c.globalAlpha=clamp(p.alpha*fadeIn*fade,0,1);
   if(p.kind==='light'){c.drawImage(this.sprite(p.color),p.x-size/2,p.y-size/2,size,size);continue;}
   const img=art[p.img];
   if(img){const h=size*(p.aspect||img.height/img.width);c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.drawImage(img,-size/2,-h/2,size,h);c.restore();}
   else c.drawImage(this.sprite(p.smoke?'#8e829b':p.add?'#ffd27a':'#ff8a3a'),p.x-size/2,p.y-size/2,size,size);
  }
  this.parts.length=w;c.restore();
 }
 drawCallouts(c,dt){
  this.drawMoments(c,dt);
  if(!this.callouts.length)return;c.save();c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
  this.callouts=this.callouts.filter(q=>{q.age+=dt;if(q.age>=q.life)return false;if(!q.text)return true;const t=q.age/q.life,pop=this.reduced?1:q.age<.14?1.45-.55*(q.age/.14):1+.05*Math.exp(-(q.age-.14)*9)*Math.cos((q.age-.14)*30);
   const y=Math.max(70,q.y-t*16),x=clamp(q.x,150,1130);c.globalAlpha=Math.min(1,q.age/.05)*(t>.75?(1-t)/.25:1);c.save();c.translate(x,y);c.rotate(-.05);c.scale(pop,pop);
   c.font=`italic 900 ${q.big?34:28}px KardiaFatRunner, PartyRubik, sans-serif`;c.lineWidth=7;c.strokeStyle='#14081ee6';c.strokeText(q.text,0,3);c.fillStyle=q.color;c.fillText(q.text,0,3);c.lineWidth=5;c.strokeText(q.text,0,0);c.fillStyle='#fff6dc';c.fillText(q.text,0,0);c.restore();return true;});
  c.restore();
 }
 // Screen moments drawn in world space around the camera: the nuke flash and
 // the FINAL ROUND / LAST SHOT banner. Clocked by dt, so paused frames hold.
 drawMoments(c,dt){
  // The flash is a moment, not a state: a paused frame (dt=0) shows no veil.
  const f=this.flashScreen;if(f&&dt){const t=(this.clock-f.at)/.3;if(t>=1)this.flashScreen=null;else if(t>=0){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(this.reduced?.18:.45)*f.k*(1-t)*(1-t);c.fillStyle='#fff1d6';c.fillRect(-4000,-4000,9280,8720);c.restore();}}
  const b=this.banner;if(!b)return;const age=this.clock-b.at,LIFE=2;if(age>=LIFE){this.banner=null;return;}if(age<0)return;
  const cam=this.cam||{x:640,y:360,z:1},z=cam.z||1,x=cam.x,y=cam.y+(250-360)/z,pop=this.reduced?1:age<.18?1.5-.5*smooth(age/.18):1,out=age>LIFE-.35?(LIFE-age)/.35:1,slide=this.reduced?0:(1-smooth(Math.min(1,age/.22)))*-60;
  c.save();c.translate(x+slide/z,y-(1-out)*14/z);c.scale(pop/z,pop/z);c.globalAlpha=Math.min(1,age/.06)*out;
  const g=c.createLinearGradient(-330,0,330,0);g.addColorStop(0,'#14081e00');g.addColorStop(.2,'#14081ee0');g.addColorStop(.8,'#14081ee0');g.addColorStop(1,'#14081e00');c.fillStyle=g;c.beginPath();c.moveTo(-330,-30);c.lineTo(338,-36);c.lineTo(330,30);c.lineTo(-338,36);c.closePath();c.fill();
  c.fillStyle=b.color;c.fillRect(-250,-38,500,3);c.fillRect(-250,35,500,3);
  c.rotate(-.03);c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.font='italic 900 54px KardiaFatRunner, PartyRubik, sans-serif';
  c.lineWidth=9;c.strokeStyle='#14081e';c.strokeText(b.text,0,4);c.fillStyle=b.color;c.fillText(b.text,0,4);c.lineWidth=6;c.strokeText(b.text,0,0);c.fillStyle='#fff6dc';c.fillText(b.text,0,0);
  c.restore();
 }
 // Baked into the cached terrain texture (so buried-tank occlusion still uses
 // one texture): grass rim on original ground, a pale cut edge on crater walls,
 // light from the upper left on slopes, occlusion in caves and blast scorches.
 bakeSurface(c,s,cols,depth){
  if(!this.strips){const strip=(color,up=false)=>{const el=document.createElement('canvas');el.width=1;el.height=32;const q=el.getContext('2d'),g=q.createLinearGradient(0,up?32:0,0,up?0:32);g.addColorStop(0,color);g.addColorStop(1,color+'00');q.fillStyle=g;q.fillRect(0,0,1,32);return el;};this.strips={light:strip('#ffffff'),dark:strip('#000000')};}
  c.save();
  for(let i=0;i<cols.length;i++){const col=cols[i];
   for(let j=0;j<col.length;j+=2){const top=col[j],bottom=col[j+1];if(!(bottom-top>=1)||!Number.isFinite(top))continue;
    const x=i*2,y=Math.floor(top),thick=bottom-top,origin=s.terrainStrata?.[i]?.[j/2]??col[0],material=s.terrainMaterials?.[i]?.[j/2];
    if(j===0){const left=cols[i-2]?.[0]??top,right=cols[i+2]?.[0]??top,light=clamp((left-right)*.05,-.32,.32);if(Math.abs(light)>.02){c.globalAlpha=Math.abs(light);c.drawImage(light>0?this.strips.light:this.strips.dark,x,y,2,Math.min(26,thick));}}
    else{c.globalAlpha=.42;c.drawImage(this.strips.dark,x,y,2,Math.min(12,thick));c.globalAlpha=.5;c.fillStyle='#000';c.fillRect(x,Math.floor(col[j-1])-3,2,3);}
    if(material){c.globalAlpha=.3;c.fillStyle='#ffffff';c.fillRect(x,y,2,1);}
    else if(top-origin<=3&&j===0){}
    else{c.globalAlpha=.2;c.fillStyle='#ffffff';c.fillRect(x,y,2,1);}
   }
  }
  c.globalAlpha=1;c.globalCompositeOperation='source-atop';
  for(const q of this.scorches){const g=c.createRadialGradient(q.x,q.y,0,q.x,q.y,q.r);g.addColorStop(0,'rgba(28,12,4,.7)');g.addColorStop(.55,'rgba(30,16,6,.38)');g.addColorStop(1,'rgba(26,14,6,0)');c.fillStyle=g;c.fillRect(q.x-q.r,q.y-q.r,q.r*2,q.r*2);}
  c.restore();
 }
 // Painterly sky (pocket-world.js); remembers the camera for screen moments.
 drawSky(c,cam,wind){this.cam=cam;if(Number.isFinite(wind))this.wind=wind;this.world.drawSky(c,cam);}
}
