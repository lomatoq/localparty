/* HeyPals tank FX (TV only). A presentation layer for the top-down tank
   games: muzzle flash + recoil on new server bullets, sparks and a damage
   flash on confirmed HP loss, a short hit-stop and an explosion with debris,
   smoke and a fading scorch mark on a confirmed kill, tread dust, ambient
   motes and a kill banner. It only reads authoritative snapshots and never
   feeds anything back. Every list is bounded; reduced motion drops shake,
   hit-stop and most particles. Kept identical in games/tanks and
   games/tankarena (each game serves its own public folder). */
(function(){
 'use strict';
 if(window.HeyPalsTankFX)return;
 const TAU=Math.PI*2,reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>a+Math.random()*(b-a);
 const easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);
 // Generated HeyPals FX sprites (public/assets/fx/atlas-fx-combat/*.webp). Each draw
 // falls back to the procedural shape until its image has decoded.
 const art={};
 for(const key of ['explosion-1','explosion-2','explosion-3','explosion-4','smoke-puff-a','smoke-puff-b','muzzle-flash-side','scorch-decal','shockwave-ring','dust-puff']){const img=new Image();img.decoding='async';img.onload=()=>{art[key]=img;};img.src='/assets/fx/atlas-fx-combat/'+key+'.webp';}
 const sprite=(c,key,x,y,size,rot=0)=>{const img=art[key];if(!img)return false;const k=size/Math.max(img.width,img.height);c.save();c.translate(x,y);if(rot)c.rotate(rot);c.drawImage(img,-img.width*k/2,-img.height*k/2,img.width*k,img.height*k);c.restore();return true;};
 // Soft puff sprites (one per tone) so smoke and dust read as vapour, not discs.
 const puffs=new Map();
 function puff(tone){let e=puffs.get(tone);if(e)return e;e=document.createElement('canvas');e.width=e.height=64;const c=e.getContext('2d'),g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,tone);g.addColorStop(.45,tone+'aa');g.addColorStop(1,tone+'00');c.fillStyle=g;c.fillRect(0,0,64,64);puffs.set(tone,e);return e;}
 function create({width=1280,height=720,bannerY=56,inset=28}={}){
  const tanks=new Map(),recoil=new Map(),flash=new Map(),dustAt=new Map();
  let bullets=new Set(),round=null,items=[],scorches=[],banners=[],motes=[],trauma=0,holdUntil=0,last=0,overLast=0,shotAt=new Map();
  for(let i=0;i<22;i++)motes.push({x:rand(inset,width-inset),y:rand(inset,height-inset),r:rand(.7,1.9),vx:rand(3,9),vy:rand(-5,-1.5),ph:rand(0,TAU)});
  const reduced=()=>reducedQuery.matches;
  const push=item=>{items.push(item);if(items.length>360)items.splice(0,items.length-360);};
  function reset(){tanks.clear();recoil.clear();flash.clear();dustAt.clear();shotAt.clear();bullets=new Set();items=[];scorches=[];banners=[];trauma=0;holdUntil=0;}
  function owner(b,list){
   if(b.owner!=null){const t=list.find(t=>t.id===b.owner||t.rawId===b.owner);if(t)return t;}
   let best=null,distance=90;for(const t of list){if(!t.alive)continue;const d=Math.hypot(t.x-b.x,t.y-b.y);if(d<distance){distance=d;best=t;}}return best;
  }
  function onShot(b,list,now){
   const speed=Math.hypot(b.vx||0,b.vy||0)||1,a=Math.atan2(b.vy||0,b.vx||0),t=owner(b,list);
   // Multi-pellet weapons fire several bullets in one tick: one flash each owner.
   const key=t?.id??b.id;if(now-(shotAt.get(key)||-1e9)<45)return;shotAt.set(key,now);if(shotAt.size>64)shotAt.delete(shotAt.keys().next().value);
   const r=t?.radius||20,x=t?t.x+Math.cos(a)*(r+12):b.x-(b.vx||0)/speed*8,y=t?t.y+Math.sin(a)*(r+12):b.y-(b.vy||0)/speed*8;
   // Rapid weapons get a small flash and no smoke so a held trigger never fogs the tank.
   const heavy=b.kind==='rocket'||b.kind==='sniper',rapid=b.kind==='rapid'||b.kind==='flame';
   if(b.kind!=='flame')push({k:'flash',x,y,a,life:rapid?.06:.085,total:rapid?.06:.085,size:heavy?1.5:rapid?.6:1,color:b.color||'#ffe2a0'});
   if(!reduced()&&!rapid)for(let i=0;i<(heavy?4:2);i++)push({k:'smoke',x:x+rand(-3,3),y:y+rand(-3,3),vx:Math.cos(a)*rand(14,34)+rand(-8,8),vy:Math.sin(a)*rand(14,34)+rand(-8,8),r:rand(4,7),grow:rand(14,22),life:rand(.35,.55),total:.55,tone:'#c9d3c4'});
   if(t&&b.kind!=='flame')recoil.set(t.id,{t:now,a,heavy:heavy&&!rapid,light:rapid});
  }
  function onHit(t,amount,now){
   const n=reduced()?3:clamp(Math.round(5+amount/6),6,12);
   for(let i=0;i<n;i++){const a=rand(0,TAU),v=rand(90,260);push({k:'spark',x:t.x+Math.cos(a)*t.radius*.6,y:t.y+Math.sin(a)*t.radius*.6,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.16,.3),total:.3,color:i%3?'#fff3c7':'#ffb454'});}
   flash.set(t.id,now);
   push({k:'number',x:t.x+rand(-6,6),y:t.y-t.radius-26,vy:-46,value:'-'+Math.round(amount),life:.8,total:.8,color:'#ffd3d9'});
   trauma=Math.min(1,trauma+clamp(amount/160,.06,.18));
  }
  function onDeath(t,now){
   const r=Math.max(16,t.radius||20),calm=reduced();
   if(!calm){holdUntil=now+70;trauma=Math.min(1,trauma+.55);}
   push({k:'ring',x:t.x,y:t.y,r:r*.6,to:r*4.4,life:.42,total:.42,color:'#fff1c2'});
   push({k:'fire',x:t.x,y:t.y,r:r*1.9,life:.46,total:.46});
   if(!calm){
    for(let i=0;i<10;i++){const a=rand(0,TAU),v=rand(70,230);push({k:'debris',x:t.x,y:t.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,rot:rand(0,TAU),spin:rand(-14,14),w:rand(4,9),h:rand(3,6),life:rand(.7,1.1),total:1.1,color:i%3?t.color:'#2a3138'});}
    for(let i=0;i<7;i++){const a=rand(0,TAU),v=rand(18,52);push({k:'smoke',x:t.x+Math.cos(a)*r*.5,y:t.y+Math.sin(a)*r*.5,vx:Math.cos(a)*v,vy:Math.sin(a)*v-8,r:rand(6,10),grow:rand(22,34),life:rand(.9,1.4),total:1.4,tone:i%2?'#3d434c':'#646b74',delay:rand(.04,.16)});}
    for(let i=0;i<10;i++){const a=rand(0,TAU),v=rand(120,320);push({k:'spark',x:t.x,y:t.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.25,.5),total:.5,color:i%2?'#ffd27a':'#fff7dc'});}
   }
   scorches.push({x:t.x,y:t.y,r:r*1.7,t:now,seed:Math.random()*1e4});if(scorches.length>18)scorches.shift();
  }
  function banner(killer,victim,now){
   banners.push({killer:killer.name||'',kc:killer.color||'#c8ff73',victim:victim.name||'',vc:victim.color||'#ff8a9a',t:now});
   if(banners.length>3)banners.shift();
  }
  function observe(snap,now=performance.now()){
   if(!snap)return;
   const list=snap.tanks||[];
   if(snap.round!==round){reset();round=snap.round;for(const t of list)tanks.set(t.id,{...t});bullets=new Set((snap.bullets||[]).map(b=>b.id));return;}
   const live=!!snap.playing,ids=new Set();
   for(const b of snap.bullets||[]){ids.add(b.id);if(live&&!bullets.has(b.id))onShot(b,list,now);}
   bullets=ids;
   const killers=[],victims=[];
   for(const t of list){const prev=tanks.get(t.id);
    if(prev&&live){
     if(prev.alive&&t.alive&&t.hp<prev.hp-.5)onHit(t,prev.hp-t.hp,now);
     if(prev.alive&&!t.alive){onDeath(prev,now);victims.push(t);}
     if((t.kills||0)>(prev.kills||0))killers.push(t);
     if(t.alive&&prev.alive&&!reduced()){const moved=Math.hypot(t.x-prev.x,t.y-prev.y);if(moved>1.2&&moved<60&&now-(dustAt.get(t.id)||0)>110){dustAt.set(t.id,now);const a=Math.atan2(t.y-prev.y,t.x-prev.x)+Math.PI,r=t.radius||20;for(const side of [-1,1])push({k:'dust',x:t.x+Math.cos(a)*r*.8-Math.sin(a)*side*r*.55,y:t.y+Math.sin(a)*r*.8+Math.cos(a)*side*r*.55,vx:Math.cos(a)*12,vy:Math.sin(a)*12,r:rand(3,5),grow:rand(10,16),life:.6,total:.6});}}
    }
    tanks.set(t.id,{...t});
   }
   for(const id of [...tanks.keys()])if(!list.some(t=>t.id===id))tanks.delete(id);
   // Pair the kill with the victim that fell in the same snapshot.
   victims.forEach((victim,i)=>{const killer=killers[i]||killers[0];if(killer&&killer.id!==victim.id)banner(killer,victim,now);});
  }
  function pose(id,now=performance.now()){
   let dx=0,dy=0,glow=0;const r=recoil.get(id);
   if(r){const k=1-(now-r.t)/(r.heavy?190:r.light?90:140);if(k>0){const d=(r.heavy?6:r.light?1.6:4)*k*k;dx=-Math.cos(r.a)*d;dy=-Math.sin(r.a)*d;}else recoil.delete(id);}
   const f=flash.get(id);if(f!=null){const k=1-(now-f)/170;if(k>0)glow=k;else flash.delete(id);}
   return {dx,dy,glow};
  }
  function shake(now=performance.now()){
   if(reduced()||trauma<=0)return {x:0,y:0};
   const s=trauma*trauma,t=now/1000;return {x:5*s*Math.sin(t*47),y:4*s*Math.sin(t*61+1.3)};
  }
  const holding=(now=performance.now())=>!reduced()&&now<holdUntil;
  function step(now){const dt=last?clamp((now-last)/1000,0,.05):0;last=now;trauma=Math.max(0,trauma-dt*1.7);return dt;}
  function drawUnder(c,now=performance.now()){
   const dt=step(now);
   // Ambient motes: very faint, slow drift, wrap inside the arena.
   c.save();c.globalCompositeOperation='screen';
   for(const m of motes){if(!reduced()){m.x+=m.vx*dt;m.y+=m.vy*dt;}if(m.x>width-inset)m.x=inset;if(m.y<inset)m.y=height-inset;c.globalAlpha=.1+.08*Math.sin(now/900+m.ph);c.fillStyle='#d9ffb0';c.beginPath();c.arc(m.x,m.y,m.r,0,TAU);c.fill();}
   c.restore();
   for(let i=scorches.length-1;i>=0;i--){const s=scorches[i],age=(now-s.t)/1000;if(age>7){scorches.splice(i,1);continue;}
    const a=clamp(Math.min(age*6,1)*(1-Math.max(0,age-4.5)/2.5),0,1);c.save();c.globalAlpha=a*.75;c.translate(s.x,s.y);
    if(sprite(c,'scorch-decal',0,0,s.r*2.3,s.seed)){}else{const g=c.createRadialGradient(0,0,0,0,0,s.r);g.addColorStop(0,'#05070acc');g.addColorStop(.55,'#0b0f1266');g.addColorStop(1,'#0b0f1200');c.fillStyle=g;c.beginPath();c.arc(0,0,s.r,0,TAU);c.fill();
    c.strokeStyle='#1b1712aa';c.lineWidth=1.4;c.beginPath();for(let k=0;k<7;k++){const ang=s.seed+k*0.9,len=s.r*(.5+((s.seed*(k+3))%1)*.5);c.moveTo(Math.cos(ang)*s.r*.25,Math.sin(ang)*s.r*.25);c.lineTo(Math.cos(ang+.12)*len,Math.sin(ang+.12)*len);}c.stroke();}
    if(age<1.6){c.globalAlpha=(1-age/1.6)*.55;c.globalCompositeOperation='lighter';const e=c.createRadialGradient(0,0,0,0,0,s.r*.5);e.addColorStop(0,'#ff8a3a');e.addColorStop(1,'#ff8a3a00');c.fillStyle=e;c.beginPath();c.arc(0,0,s.r*.5,0,TAU);c.fill();}
    c.restore();}
   for(const p of items)if(p.k==='dust')drawItem(c,p);
  }
  function drawItem(c,p){
   const age=1-p.life/p.total;
   if(p.k==='dust'){const r=p.r+p.grow*easeOut(age);c.save();c.globalAlpha=.16*(1-age);if(!sprite(c,'dust-puff',p.x,p.y,r*2.2))c.drawImage(puff('#c3cfa8'),p.x-r,p.y-r,r*2,r*2);c.restore();return;}
   if(p.k==='smoke'){if(p.delay>0)return;const r=p.r+p.grow*easeOut(age);c.save();c.globalAlpha=.5*Math.sin(Math.PI*Math.min(1,age*1.1+.08))*(1-age*.5);if(!sprite(c,(p.x+p.y)%2>1?'smoke-puff-a':'smoke-puff-b',p.x,p.y,r*2.1,p.r))c.drawImage(puff(p.tone),p.x-r,p.y-r,r*2,r*2);c.restore();return;}
   if(p.k==='flash'&&art['muzzle-flash-side']){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-age;c.translate(p.x,p.y);c.rotate(p.a);sprite(c,'muzzle-flash-side',16*p.size,0,40*p.size*(.75+.25*(1-age)));c.restore();return;}
   if(p.k==='flash'){c.save();c.translate(p.x,p.y);c.rotate(p.a);c.globalCompositeOperation='lighter';const k=1-age,s=p.size;c.globalAlpha=k;
    const g=c.createRadialGradient(0,0,0,0,0,22*s);g.addColorStop(0,'#fffbe6');g.addColorStop(.35,p.color);g.addColorStop(1,'#ff7a0000');c.fillStyle=g;c.beginPath();c.arc(0,0,22*s,0,TAU);c.fill();
    c.fillStyle='#fff6d0';c.beginPath();c.moveTo(-2,-5*s);c.lineTo(26*s*(.6+.4*k),0);c.lineTo(-2,5*s);c.closePath();c.fill();
    for(const side of [-1,1]){c.beginPath();c.moveTo(2,0);c.lineTo(12*s,side*11*s);c.lineTo(8*s,0);c.closePath();c.fill();}
    c.restore();return;}
   if(p.k==='spark'){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=1-age;c.strokeStyle=p.color;c.lineWidth=2;c.lineCap='round';c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*.035,p.y-p.vy*.035);c.stroke();c.restore();return;}
   if(p.k==='ring'&&art['shockwave-ring']){const r=p.r+(p.to-p.r)*easeOut(age);c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-age)*.9;sprite(c,'shockwave-ring',p.x,p.y,r*2.2);c.restore();return;}
   if(p.k==='ring'){c.save();c.globalAlpha=(1-age)*.85;c.strokeStyle=p.color;c.lineWidth=5*(1-age)+1;c.beginPath();c.arc(p.x,p.y,p.r+(p.to-p.r)*easeOut(age),0,TAU);c.stroke();c.restore();return;}
   if(p.k==='fire'&&art['explosion-2']){const k=Math.sin(Math.PI*Math.min(1,age*1.4+.15)),r=p.r*(.55+.6*easeOut(age)),stage=age<.18?'explosion-1':age<.45?'explosion-2':age<.75?'explosion-3':'explosion-4';c.save();c.globalAlpha=clamp(k*1.1,0,1);sprite(c,art[stage]?stage:'explosion-2',p.x,p.y,r*2.4,p.r*.37);c.restore();return;}
   if(p.k==='fire'){c.save();c.globalCompositeOperation='lighter';const k=Math.sin(Math.PI*Math.min(1,age*1.4+.15)),r=p.r*(.55+.6*easeOut(age));c.globalAlpha=k;
    const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,'#fffbe0');g.addColorStop(.3,'#ffd36b');g.addColorStop(.62,'#ff7a3a');g.addColorStop(1,'#ff3d6a00');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,r,0,TAU);c.fill();c.restore();return;}
   if(p.k==='debris'){c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.globalAlpha=clamp(p.life/.35,0,1);c.fillStyle=p.color;c.fillRect(-p.w/2,-p.h/2,p.w,p.h);c.fillStyle='#ffffff40';c.fillRect(-p.w/2,-p.h/2,p.w,1.2);c.restore();return;}
   if(p.k==='number'){c.save();const pop=age<.18?.8+age/.18*.35:1.15-Math.min(.15,(age-.18)*.6);c.globalAlpha=clamp(Math.min(age*10,(1-age)*3),0,1);c.translate(p.x,p.y);c.scale(pop,pop);c.font='italic 900 20px KardiaFatRunner, sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#14080ccc';c.strokeText(p.value,0,0);c.fillStyle=p.color;c.fillText(p.value,0,0);c.restore();}
  }
  function drawOver(c,now=performance.now()){
   const step=overLast?clamp((now-overLast)/1000,0,.05):0;overLast=now;
   for(let i=items.length-1;i>=0;i--){const p=items[i];if(p.delay>0){p.delay-=step;continue;}p.life-=step;if(p.life<=0){items.splice(i,1);continue;}
    if(p.vx!=null){p.x+=p.vx*step;p.y+=(p.vy||0)*step;const drag=p.k==='debris'?3.2:p.k==='spark'?4:1.6;p.vx*=Math.exp(-drag*step);if(p.vy!=null)p.vy*=Math.exp(-drag*step);}
    if(p.k==='debris')p.rot+=p.spin*step;}
   for(const p of items)if(p.k!=='dust')drawItem(c,p);
   drawBanners(c,now);
  }
  function crosshair(c,x,y,r,color){c.save();c.strokeStyle=color;c.lineWidth=2.2;c.beginPath();c.arc(x,y,r*.62,0,TAU);for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){c.moveTo(x+a*r*.3,y+b*r*.3);c.lineTo(x+a*r,y+b*r);}c.stroke();c.fillStyle=color;c.beginPath();c.arc(x,y,2,0,TAU);c.fill();c.restore();}
  function fit(c,text,max){let s=String(text);if(c.measureText(s).width<=max)return s;const letters=Array.from(s);while(letters.length&&c.measureText(letters.join('')+'…').width>max)letters.pop();return letters.join('')+'…';}
  function drawBanners(c,now){
   for(let i=banners.length-1;i>=0;i--)if(now-banners[i].t>2100)banners.splice(i,1);
   banners.forEach((b,i)=>{
    const age=(now-b.t)/1000,enter=easeOut(age/.22),exit=clamp((2.1-age)/.3,0,1),y=bannerY+(banners.length-1-i)*44+(reduced()?0:(1-enter)*-14);
    c.save();c.globalAlpha=Math.min(enter,exit);c.font='500 18px KardiaFit, system-ui, sans-serif';c.textBaseline='middle';
    const k=fit(c,b.killer,170),v=fit(c,b.victim,170),kw=c.measureText(k).width,vw=c.measureText(v).width,w=kw+vw+92,x=width/2-w/2;
    c.fillStyle='#151321e8';c.beginPath();c.roundRect(x,y-18,w,36,18);c.fill();c.strokeStyle=b.kc+'99';c.lineWidth=1.5;c.stroke();
    c.fillStyle=b.kc;c.beginPath();c.arc(x+18,y,5,0,TAU);c.fill();
    c.fillStyle='#f8f5ff';c.textAlign='left';c.fillText(k,x+30,y+1);
    crosshair(c,x+30+kw+20,y,11,'#ffb454');
    c.fillStyle='#c9c2d8';c.fillText(v,x+30+kw+40,y+1);
    c.strokeStyle='#ff7a8a';c.globalAlpha*=.8;c.lineWidth=1.6;c.beginPath();c.moveTo(x+30+kw+40,y+1);c.lineTo(x+30+kw+40+vw,y+1);c.stroke();
    c.restore();
   });
  }
  return Object.freeze({observe,pose,shake,holding,drawUnder,drawOver,reset,
   diagnostics:()=>({items:items.length,scorches:scorches.length,banners:banners.length,trauma:+trauma.toFixed(3)})});
 }
 window.HeyPalsTankFX=Object.freeze({create,revision:'tank-fx-20261002.1'});
})();
