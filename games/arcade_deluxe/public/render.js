import {drawExplosionWaves} from './explosion-waves.js';
import './geometry.js';
import {SiegeFX} from './siege-fx.js';
import {PocketProjectileArt} from './pocket-projectiles.js';
import {AirDefenseRenderer} from './air-defense-render.js';
const Geo=globalThis.ArcadeGeometry;
// fx.et (emitter trails) is {colour:'NodeA NodeB'}; cache a per-weapon name->colour lookup.
const trailMaps=new WeakMap();
function emitterColor(w,name){const t=w?.fx?.et;if(!t||!name)return null;let map=trailMaps.get(t);if(!map){map=new Map();for(const [color,names] of Object.entries(t))for(const n of names.split(' '))map.set(n,color);trailMaps.set(t,map);}return map.get(name)||map.get(name.replace(/\d+$/,'')+'#')||null;}
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
import {MARBLE_COLORS} from './palette.js';
export {MARBLE_COLORS};
const circle=(c,x,y,r,fill)=>{c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}};
function rounded(c,x,y,w,h,r,fill){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();}
function poly(c,ps,fill){c.beginPath();for(let i=0;i<ps.length;i++)c[i?'lineTo':'moveTo'](...ps[i]);c.closePath();c.fillStyle=fill;c.fill();}
function line(c,ps,color,width=1){c.beginPath();ps.forEach((p,i)=>c[i?'lineTo':'moveTo'](...p));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function canvas(w=1280,h=720){const e=document.createElement('canvas');e.width=w;e.height=h;return e;}
const sampleTerrain=(s,x)=>{const arr=s?.terrain;if(!arr?.length)return 680;const q=clamp(x/2,0,arr.length-1),i=Math.floor(q),t=q-i;return lerp(arr[i],arr[Math.min(i+1,arr.length-1)],t);};
const surfaceAngle=(s,x,span=18)=>Math.atan2(sampleTerrain(s,x+span)-sampleTerrain(s,x-span),span*2);
function sphere(color,index){const e=canvas(68,68),c=e.getContext('2d');c.shadowColor='#000a';c.shadowBlur=7;c.shadowOffsetY=5;circle(c,34,32,23,'#172b24');c.shadowBlur=0;c.shadowOffsetY=0;const g=c.createRadialGradient(26,23,1,35,37,29);g.addColorStop(0,'#fff5');g.addColorStop(.27,color);g.addColorStop(1,'#20382f');circle(c,34,31,22,color);circle(c,34,31,22,g);c.lineWidth=1.2;c.strokeStyle='#ffffff27';c.beginPath();c.arc(34,31,19,.15,3.5);c.stroke();c.save();c.translate(34,31);c.strokeStyle='#182a3050';c.fillStyle='#182a3050';c.lineWidth=2.3;
 if(index===0)poly(c,[[0,-8],[7,5],[-7,5]],'#60372555');else if(index===1){c.rotate(Math.PI/4);c.strokeRect(-5,-5,10,10);}else if(index===2){c.beginPath();c.arc(0,0,6,0,TAU);c.stroke();}else if(index===3){line(c,[[-6,0],[6,0]],'#704a2a66',2.8);line(c,[[0,-6],[0,6]],'#704a2a66',2.8);}else {for(let i=0;i<3;i++)circle(c,(i-1)*5,0,1.7,'#38215166');}c.restore();c.save();c.translate(26,21);c.rotate(-.6);c.fillStyle='#ffffff55';c.beginPath();c.ellipse(0,0,6,2.5,0,0,TAU);c.fill();c.restore();return e;}
class AudioFX {
 constructor(){this.enabled=false;}
 toggle(){this.enabled=!this.enabled;if(this.enabled){this.ctx??=new(window.AudioContext||window.webkitAudioContext)();this.ctx.resume();}return this.enabled;}
 play(kind){if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;const c=this.ctx,t=c.currentTime,g=c.createGain();g.connect(c.destination);const o=c.createOscillator();o.connect(g);const pop=kind==='pop',blast=kind==='blast';o.type=blast?'triangle':pop?'sine':'triangle';o.frequency.setValueAtTime(blast?85:pop?650+Math.random()*200:280,t);o.frequency.exponentialRampToValueAtTime(blast?28:pop?1100:120,t+.13);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(blast?.12:.035,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+(blast?.36:.14));o.start(t);o.stop(t+.4);}
}
export class Renderer {
 constructor(el){this.el=el;this.c=el.getContext('2d',{alpha:false});this.s=null;this.previous=null;this.arrived=0;this.lastEvent=0;this.particles=[];this.texts=[];this.rings=[];this.beams=[];this.bursts=[];this.sprites=MARBLE_COLORS.map(sphere);this.audio=new AudioFX();this.cam={x:640,y:360,z:1};this.last=performance.now();this.reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;this.siegeFX=new SiegeFX(this.reduced);this.projectileArt=new PocketProjectileArt();this.airDefense=new AirDefenseRenderer(this.projectileArt,this.reduced);this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);this.backgroundKey='';}
 setState(s){
  const mapKey=v=>JSON.stringify([v.roundSerial,v.level,v.boards?.map(b=>b.level)]);
  if(!this.reduced&&s.mode==='marble_bloom'&&this.s&&mapKey(s)!==mapKey(this.s)&&this.el.width&&this.el.height){
   // Freeze only the outgoing rendered frame; never run two simulations or
   // retain entire old states. Rapid map changes replace this one snapshot.
   const snapshot=canvas(this.el.width,this.el.height);snapshot.getContext('2d').drawImage(this.el,0,0);
   this.mapTransition={snapshot,at:performance.now()};
  }
  this.previous=this.s;this.s=s;this.arrived=performance.now();if(this.roundSerial!==s.roundSerial){this.roundSerial=s.roundSerial;this.siegeFX.clear();this.airDefense.clear();this.lastEvent=0;this.particles=[];this.texts=[];this.rings=[];this.beams=[];this.bursts=[];this.vfx=[];this.cam={x:640,y:360,z:1};this.pathKey=null;this.terrainCanvas=null;this.terrainTransition=null;}for(const e of s.events||[]){if(e.id<=this.lastEvent)continue;this.lastEvent=e.id;this.effect(e);}if(this.previous?.terrainRevision!==s.terrainRevision){this.terrainTransition=null;this.terrainCanvas=null;}
 }
 transitionFrame(now){
  const transition=this.mapTransition;if(!transition)return;
  const t=clamp((now-transition.at)/850,0,1);
  if(t===1){this.mapTransition=null;return;}
  const c=this.c;c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1-t*t*(3-2*t);c.drawImage(transition.snapshot,0,0,this.el.width,this.el.height);c.restore();
 }
 effect(e){if(this.s?.mode==='pocket_siege'&&this.airDefense.emit(e))return;if(this.s?.mode==='pocket_siege'&&this.siegeFX.emit(e)){this.audio.play(e.kind);return;}if(e.kind==='trace'){this.texts.push({x:e.x,y:e.y,value:Math.round(e.angle)+'° · '+e.distance,combo:0,color:e.color,life:2.2});}if(e.kind==='blast'){this.bursts.push({...e,life:.58,total:.58});if(this.bursts.length>70)this.bursts.shift();}const col=typeof e.color==='number'?MARBLE_COLORS[e.color]:e.color||'#e6edc9';if(['pop','blast','muzzle','split','bounce','dirt','warp'].includes(e.kind)){const n=e.kind==='blast'?25:e.kind==='pop'?12:5;for(let i=0;i<n;i++){const a=Math.random()*TAU,v=35+Math.random()*(e.kind==='blast'?220:90);this.particles.push({x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,color:col,life:.45+Math.random()*.4,total:.8,size:2+Math.random()*4});}if(['blast','warp','pop'].includes(e.kind))this.rings.push({x:e.x,y:e.y,r:e.r||24,color:col,life:.6,total:.6});if(this.particles.length>420)this.particles.splice(0,this.particles.length-420);this.audio.play(e.kind);}
 if(e.kind==='score')this.texts.push({x:e.x,y:e.y,value:(e.value>0?'+':'')+e.value,combo:e.combo,color:col,life:1.35,total:1.35,vx:(Math.random()-.5)*18,vy:-82,gravity:92,pop:true});if(e.kind==='beam'){this.beams.push({...e,life:.42});if(this.beams.length>96)this.beams.shift();}if(this.texts.length>80)this.texts.shift();if(this.rings.length>100)this.rings.shift();}
 toWorld(clientX,clientY){const r=this.el.getBoundingClientRect(),scale=this.s?.mode==='pocket_siege'?r.width/1280:Math.min(r.width/1280,r.height/720);let x=(clientX-r.left-(r.width-1280*scale)/2)/scale,y=(clientY-r.top-(r.height-720*scale)/2)/scale;if(this.s?.mode==='pocket_siege'){x=(x-640)/this.cam.z+this.cam.x;y=(y-360)/this.cam.z+this.cam.y;}if(this.s?.arenaMode==='versus'&&this.s.localPlayerId){const i=this.s.boards.findIndex(b=>b.players[0].id===this.s.localPlayerId),v=this.s.boards.length===2?[{x:20,y:184,w:610,h:343},{x:650,y:184,w:610,h:343}][i]:[{x:36,y:63,w:568,h:320},{x:676,y:63,w:568,h:320},{x:356,y:391,w:568,h:320}][i];if(v){x=(x-v.x)/v.w*1280;y=(y-v.y)/v.h*720;}}return {x,y};}
 background(s){const key=s.mode+'-'+(s.level||0)+'-'+(s.sky||'day');if(key===this.backgroundKey&&this.bg)return;this.backgroundKey=key;this.bg=canvas();const c=this.bg.getContext('2d');
 if(s.mode==='marble_bloom'){
  const g=c.createLinearGradient(0,0,0,720);g.addColorStop(0,'#efd9a4');g.addColorStop(1,'#bccd96');c.fillStyle=g;c.fillRect(0,0,1280,720);
  c.strokeStyle='#9aa86e22';c.lineWidth=1;for(let y=0;y<720;y+=64)for(let x=0;x<1280;x+=64)c.strokeRect(x+(y%128?32:0),y,64,64);
  for(let i=0;i<45;i++){const x=(i*167)%1340-30,y=(i*271)%820-50;if(x>70&&x<1200&&y>100&&y<630)continue;c.save();c.translate(x,y);c.rotate(i*1.2);for(let k=0;k<6;k++){c.rotate(1);c.beginPath();c.ellipse(29,0,40,11,0,0,TAU);c.fillStyle=k%2?'#50873d':'#80a44c';c.fill();}c.restore();}
  c.strokeStyle='#aeb77760';for(let r=80;r<210;r+=25){circle(c,652,396,r);c.stroke();}
 }else{
  const g=c.createLinearGradient(0,0,0,720);g.addColorStop(0,'#000000');g.addColorStop(.40,'#000000');g.addColorStop(.45,'#030005');g.addColorStop(.60,'#210030');g.addColorStop(.80,'#4b006f');g.addColorStop(1,'#7900a8');c.fillStyle=g;c.fillRect(0,0,1280,720);
 }
 }
 drawPath(c,s){if(!this.pathCanvas||this.pathKey!==s.level){this.pathKey=s.level;const e=this.pathCanvas=canvas(),p=e.getContext('2d');p.lineJoin=p.lineCap='round';const pts=s.path.map(p=>[p.x,p.y]);p.save();p.translate(0,6);line(p,pts,'#75603844',67);p.restore();line(p,pts,'#dbc896',64);line(p,pts,'#b89760',56);line(p,pts,'#8d743d',47);line(p,pts,'#927a4c',42);p.setLineDash([2,17]);line(p,pts,'#ead49a90',53);p.setLineDash([]);line(p,pts,'#6f593238',36);}c.drawImage(this.pathCanvas,0,0);const end=s.path.at(-1);c.save();c.translate(end.x,end.y);c.rotate(s.t*.17);for(let i=0;i<8;i++){c.rotate(TAU/8);poly(c,[[22,-8],[38,-7],[32,11],[21,8]],'#819475');}c.restore();circle(c,end.x,end.y,24,'#071f19');const g=c.createRadialGradient(end.x,end.y,0,end.x,end.y,25);g.addColorStop(0,s.progress>.8?'#ff795e':'#b4d298');g.addColorStop(.25,'#203c2b');g.addColorStop(1,'#071b17');circle(c,end.x,end.y,22,g);c.strokeStyle='#b9c79b66';c.lineWidth=2;circle(c,end.x,end.y,24);c.stroke();}
 drawMarbles(c,s,dt){this.drawPath(c,s);const alpha=clamp((performance.now()-this.arrived)/50,0,1),old=new Map((this.previous?.chain||[]).map(b=>[b.id,b]));
 let chain=s.chain;
 if(s.phase==='waiting'){chain=s.path.filter((_,i)=>i%6===0).slice(0,30).map((p,i)=>({...p,id:-i,color:Math.floor(i/2)%5}));}
 for(const b of chain){if(b.s< -25)continue;const prev=old.get(b.id),x=prev?lerp(prev.x,b.x,alpha):b.x,y=prev?lerp(prev.y,b.y,alpha):b.y;c.drawImage(this.sprites[b.color],x-25.1,y-24,50,50);if(b.power){circle(c,x,y,19);c.strokeStyle='#fff7bd';c.lineWidth=1.5;c.stroke();c.font='bold 12px sans-serif';c.textAlign='center';c.fillStyle='#fff7db';c.fillText({bomb:'✦',slow:'Ⅱ',reverse:'↶',focus:'+'}[b.power],x,y+4);}}
 if(s.coin?.alive){const q=s.coin,pulse=1+Math.sin(s.t*3)*.06;c.save();c.translate(q.x,q.y);c.scale(pulse,pulse);circle(c,0,0,16,'#b99250');circle(c,0,-1,12,'#e4c376');c.fillStyle='#7e682d';c.font='bold 16px serif';c.textAlign='center';c.fillText('✦',0,4);c.restore();}
 const ps=s.players.filter(p=>p.participant);if(!ps.length)ps.push({id:'preview',origin:{x:652,y:396},aim:{x:720,y:200},color:'#c4ff38',ball:1,nextBall:4});
 for(const p of ps){const o=p.origin||{x:652,y:396},a=Math.atan2((p.aim?.y??100)-o.y,(p.aim?.x??640)-o.x),r=ps.length===1?36:25;
  if(p.aim&&s.phase==='playing'){
   const reach=Math.min(Math.hypot(p.aim.x-o.x,p.aim.y-o.y),s.aimUntil>s.t?550:220),dx=Math.cos(a),dy=Math.sin(a);
   c.save();c.lineCap='round';
   for(let distance=44;distance<reach;distance+=16){const fade=1-(distance-44)/Math.max(1,reach-44);circle(c,o.x+dx*distance,o.y+dy*distance,3.4,'#12281de0');circle(c,o.x+dx*distance,o.y+dy*distance,2.2,p.color);c.globalAlpha=.4+.6*fade;}
   c.globalAlpha=1;line(c,[[o.x+dx*32,o.y+dy*32],[o.x+dx*53,o.y+dy*53]],p.color,4);
   const tx=p.aim.x,ty=p.aim.y;c.lineWidth=5;c.strokeStyle='#10251cbb';circle(c,tx,ty,13);c.stroke();c.lineWidth=2.2;c.strokeStyle=p.color;circle(c,tx,ty,13);c.stroke();circle(c,tx,ty,2.8,p.color);
   for(const [x,y] of [[1,0],[-1,0],[0,1],[0,-1]])line(c,[[tx+x*17,ty+y*17],[tx+x*23,ty+y*23]],p.color,2.5);
   c.restore();
  }
  c.save();c.translate(o.x,o.y);circle(c,0,5,r+12,'#0a171b90');c.rotate(a);for(let i=0;i<6;i++){c.save();c.rotate(i*TAU/6);c.beginPath();c.ellipse(-r*.52,0,r*.57,r*.23,0,0,TAU);c.fillStyle=i%2?'#89a77e':'#678b76';c.fill();c.restore();}circle(c,0,0,r*.76,'#b9b487');circle(c,0,0,r*.59,'#203d34');rounded(c,5,-10,r+4,20,7,'#647e63');rounded(c,8,-8,r+1,6,3,'#b4c192');c.drawImage(this.sprites[p.ball??1],-20,-20,40,40);circle(c,-r*.65,0,6,MARBLE_COLORS[p.nextBall??4]);c.restore();
 }
 for(const b of s.shots){line(c,[[b.x-b.vx*.033,b.y-b.vy*.033],[b.x,b.y]],MARBLE_COLORS[b.color]+'80',9);c.drawImage(this.sprites[b.color],b.x-18,b.y-18,36,36);}
 if(s.slowUntil>s.t||s.reverseUntil>s.t){c.fillStyle='#d4edab';c.font='600 13px sans-serif';c.textAlign='center';c.fillText(s.reverseUntil>s.t?'↶  ЗВАРОТНЫ РУХ':'Ⅱ  ЗАПАВОЛЕННЕ',640,650);}
 }
 terrain(s){
  if(this.terrainCanvas)return this.terrainCanvas;const depth=s.terrainBottom||680,e=this.terrainCanvas=canvas(1280,depth+170),c=e.getContext('2d');c.imageSmoothingEnabled=false;
  let cols=s.terrainColumns||s.terrain.slice(0,640).map(y=>[y,depth]);
  const alpha=s.paused?1:clamp((performance.now()-this.arrived)/50,0,1),old=this.previous?.terrainColumns;
  if(old&&alpha<1)cols=cols.map((col,i)=>col.map((v,j)=>{const prev=old[i];if(prev?.length!==col.length)return v;const start=j-j%2,a=col[start]-prev[start],b=col[start+1]-prev[start+1];return a>=0&&Math.abs(a-b)<.25?lerp(prev[j],v,alpha):v;}));
  const palette=['#049c05','#018701','#017501','#026902','#015b01','#014f00','#004400'];
  const widths=[4,20,24,28,35,42,9999];
  for(let i=0;i<cols.length;i++){
   const surface=cols[i][0]??depth;let threshold=0,bands=[];for(let k=0;k<palette.length;k++){threshold+=widths[k];bands.push(threshold);}
   for(let j=0;j<cols[i].length;j+=2){const top=cols[i][j],bottom=cols[i][j+1],origin=s.terrainStrata?.[i]?.[j/2]??surface;let y=top;
    const material=s.terrainMaterials?.[i]?.[j/2];
    if(material){const gradient=c.createLinearGradient(0,origin,0,Math.max(origin+24,bottom));gradient.addColorStop(0,material[1]);gradient.addColorStop(1,material[0]);c.fillStyle=gradient;c.fillRect(i*2,Math.floor(top),2,Math.ceil(bottom)-Math.floor(top));continue;}
    while(y<bottom){const d=Math.max(0,y-origin),k=Math.min(palette.length-1,bands.findIndex(v=>d<v)===-1?palette.length-1:bands.findIndex(v=>d<v)),edge=k===palette.length-1?bottom:Math.min(bottom,origin+bands[k]),b=Math.max(y+.1,edge);c.fillStyle=palette[k];c.fillRect(i*2,Math.floor(y),2,Math.ceil(b)-Math.floor(y));y=b;}
   }
  }
  c.fillStyle='#004400';c.fillRect(0,depth,1280,170);
  // Faint fixed diagonal grain confined to existing ground; never screen noise.
  if(!this.soilPattern){const p=canvas(96,96),q=p.getContext('2d');let seed=12345;for(let y=0;y<96;y++)for(let x=0;x<96;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=(seed>>>28)-8;q.fillStyle=n>0?'rgba(255,255,255,.026)':'rgba(0,0,0,.04)';q.fillRect(x,y,1,1);}q.strokeStyle='rgba(0,0,0,.06)';q.lineWidth=1;for(let i=-96;i<192;i+=7){q.beginPath();q.moveTo(i,0);q.lineTo(i-96,96);q.stroke();}this.soilPattern=c.createPattern(p,'repeat');}
  c.globalCompositeOperation='source-atop';c.fillStyle=this.soilPattern;c.fillRect(0,0,1280,depth+170);c.globalCompositeOperation='source-over';return e;
 }
 tank(c,p,s,active){
  const tilt=p.surfaceAngle??surfaceAngle(s,p.x),pose=Geo.gunPose({...p,surfaceAngle:tilt}),fired=(s.events||[]).filter(e=>e.kind==='muzzle'&&e.player===p.id).at(-1),recoil=fired?Math.max(0,1-(s.t-fired.t)/.2)*3:0;
  // The turret occludes the barrel root and pivot, including during recoil.
  // World coordinates keep the gun attached correctly on sloping ground.
  const end={x:pose.muzzle.x-recoil*pose.dir.x,y:pose.muzzle.y-recoil*pose.dir.y};
  line(c,[[pose.pivot.x,pose.pivot.y],[end.x,end.y]],'#d9d9d9',4);
  line(c,[[pose.pivot.x,pose.pivot.y-1],[end.x,end.y-1]],'#ffffff',1);
  circle(c,pose.pivot.x,pose.pivot.y,3,p.color);
  c.save();c.translate(p.x,p.y);c.rotate(tilt);
  rounded(c,-21,-4,42,12,6,'#353535');rounded(c,-18,-2,36,8,4,'#747474');
  for(let i=0;i<6;i++){circle(c,-14+i*5.6,2,2.4,'#101010');circle(c,-14+i*5.6,1,1.15,'#d9d9d9');}
  // Track links advance with travelled distance, never on an idle timer.
  const tread=((p.x%6)+6)%6;
  for(let x=-18+tread;x<18;x+=6){line(c,[[x,-3],[x+2,-1]],'#bbb',1);line(c,[[x,6],[x-2,8]],'#777',1);}
  const g=c.createLinearGradient(0,-22,0,0);g.addColorStop(0,'#eee');g.addColorStop(.25,p.color);g.addColorStop(1,'#151515');
  poly(c,[[-20,-5],[-13,-13],[12,-13],[20,-5],[14,-2],[-16,-2]],g);circle(c,0,-13,8.6,g);c.restore();
  if(active)poly(c,[[p.x-4,p.y-42],[p.x+4,p.y-42],[p.x,p.y-35]],p.color);
  if(p.frozen||p.blockedThisTurn){c.strokeStyle='#beefff';c.lineWidth=2;c.strokeRect(p.x-24,p.y-26,48,36);}
  c.textAlign='center';c.font='bold 12px monospace';c.lineWidth=3;c.strokeStyle='#061106';c.strokeText(p.name,p.x,p.y+25);c.fillStyle=p.color;c.fillText(p.name,p.x,p.y+25);
 }
 drone(c,d,s,color){
  c.save();c.translate(d.x,d.y);
  // A short diffuse lamp, not a trajectory or a ground-target marker.
  const glow=c.createLinearGradient(0,5,0,28);glow.addColorStop(0,'#ff55551c');glow.addColorStop(1,'#ff555500');
  poly(c,[[-2,5],[2,5],[7,28],[-7,28]],glow);
  c.rotate(d.bank||0);c.lineCap='round';c.lineJoin='round';
  for(const sign of [-1,1]){
   line(c,[[sign*4,-2],[sign*11,-9]],'#353535',3);
   line(c,[[sign*4,-3],[sign*11,-10]],'#b6b6b6',1);
   rounded(c,sign*11-2,-12,4,4,1,'#747474');
   c.save();c.translate(sign*11,-12);c.scale(1,.24);c.rotate(s.t*75*sign);
   rounded(c,-6,-1,12,2,1,'#d9d9d9');rounded(c,-1,-4,2,8,1,'#aaa');c.restore();
   circle(c,sign*11,-12,1.2,'#101010');
  }
  const metal=c.createLinearGradient(0,-7,0,6);metal.addColorStop(0,'#eee');metal.addColorStop(.27,color);metal.addColorStop(1,'#151515');
  poly(c,[[-6,-4],[-4,-7],[4,-7],[6,-4],[6,3],[3,5],[-3,5],[-6,3]],metal);
  line(c,[[-4,-5],[4,-5]],'#ffffff90',.7);
  rounded(c,-3,1,6,3,1,'#353535');
  const low=d.charge<.25,pulse=low?.55+Math.sin(s.t*14)*.4:1;
  circle(c,0,2,3.1,`rgba(255,58,58,${.12*pulse})`);circle(c,0,2,1.2,low&&pulse<.5?'#8f2424':'#ff5d50');
  circle(c,-.3,1.6,.4,'#fff2cc');c.restore();
 }
 drawTanks(c,s,dt){const bullets=s.projectiles||[],target=bullets.length?bullets[0]:null;
 // Pocket Siege fills the width, so a host wider than 16:9 (the TV game frame
 // is 1920x888) crops the world top and bottom. Frame the shell and tanks in
 // the band that is actually on screen; at 16:9 this is exactly 0..720.
 const half=this.viewHalf||360,top=360-half,bottom=360+half;
 const minY=target?Math.min(top,target.y-50):top;const maxY=Math.max(bottom,...s.players.filter(p=>p.participant).map(p=>p.y+90),target?target.y+80:bottom),z=clamp((half*2-20)/(maxY-20-minY),.3,1),y=(minY+maxY)/2;const ease=1-Math.exp(-dt*5);this.cam.z=lerp(this.cam.z,z,this.reduced?1:ease);this.cam.y=lerp(this.cam.y,y,this.reduced?1:ease);
 // The eased camera lags a fast climb; never let it drop the shell off the top.
 if(target&&Number.isFinite(target.y)){const limit=top+50;if(360+this.cam.z*(target.y-this.cam.y)<limit)this.cam.y=target.y-(limit-360)/this.cam.z;}
 this.cam.x=640;c.translate(640,360);c.scale(this.cam.z,this.cam.z);c.translate(-this.cam.x,-this.cam.y);
 if(s.fallingColumns||this.previous?.fallingColumns)this.terrainCanvas=null;
 const terrainTexture=this.terrain(s),drawTerrain=(texture,alpha=1)=>{const terrainHeight=texture.height;c.save();c.globalAlpha=alpha;c.fillStyle='#004400';c.fillRect(-2400,terrainHeight-1,6080,1600);c.drawImage(texture,0,0,1,terrainHeight,-2400,0,2400,terrainHeight);c.drawImage(texture,1279,0,1,terrainHeight,1280,0,2400,terrainHeight);c.drawImage(texture,0,0);c.restore();};
 drawTerrain(terrainTexture);
 let ps=s.players.filter(p=>p.participant&&Number.isFinite(p.x)&&Number.isFinite(p.y));if(!ps.length)ps=[{x:200,y:s.terrain[100]-9,color:'#c4ff38',name:'LIME',angle:42,surfaceAngle:surfaceAngle(s,200)},{x:1090,y:s.terrain[545]-9,color:'#ad8dff',name:'VIOLET',angle:137,surfaceAngle:surfaceAngle(s,1090)}];
 this.tankPoses??=new Map();if(this.poseRound!==s.roundSerial){this.tankPoses.clear();this.poseRound=s.roundSerial;}
 for(const p of ps){let pose=this.tankPoses.get(p.id);if(!pose||Math.hypot(p.x-pose.x,p.y-pose.y)>100)pose={...p};const blend=s.paused||this.reduced?1:1-Math.exp(-dt*22);pose={...p,x:lerp(pose.x,p.x,blend),y:lerp(pose.y,p.y,blend),surfaceAngle:lerp(pose.surfaceAngle||0,p.surfaceAngle||0,blend)};this.tankPoses.set(p.id,pose);this.tank(c,pose,s,p.id===s.activeId);}
 // Ground physically occludes buried chassis/barrels, but keep name labels
 // below the tracks readable. Do not redraw an opaque whole-screen overlay.
 const underground=ps.filter(p=>p.underground||p.buried);
 if(underground.length){c.save();c.beginPath();for(const p of underground)c.rect(p.x-54,p.y-54,108,68);c.clip();c.drawImage(terrainTexture,0,0);c.restore();}
 const active=ps.find(p=>p.id===s.activeId);if(active&&s.stage==='aim'){
  const w=this.weapons?.[active.weapon]||{},points=Geo.preview(active,w,s.wind),visible=[];
  for(const q of points){if(q.y>sampleTerrain(s,q.x)||q.x<0||q.x>1280)break;visible.push(q);}
  c.save();c.globalAlpha=.7;
  for(let i=0;i<visible.length;i++){const q=visible[i],t=i/Math.max(1,visible.length-1);circle(c,q.x,q.y,lerp(1.7,.45,t),active.color);}
  c.restore();
 }
 for(const coat of s.coatings||[]){if(coat.expires<s.turn)continue;
  c.save();c.lineJoin=c.lineCap='round';const left=Math.max(0,coat.x-coat.r),right=Math.min(1280,coat.x+coat.r),rubber=coat.kind==='rubber';
  for(const [width,color,offset] of [[9,rubber?'#7b326c':'#796129',1],[5,rubber?'#f685d9':'#e8c25f',-1],[1.5,rubber?'#ffd3f3':'#fff1bd',-3]]){
   c.strokeStyle=color;c.lineWidth=width;c.beginPath();for(let x=left;x<=right;x+=2)c[x===left?'moveTo':'lineTo'](x,sampleTerrain(s,x)+offset);c.stroke();
  }
  for(let x=left+6;x<right;x+=13){const y=sampleTerrain(s,x),r=1.5+(Math.sin(x*1.7)+1);circle(c,x,y+3,r,rubber?'#f685d9':'#e8c25f');}c.restore();
 }
 this.siegeFX.plasma.draw(c,s.paused?0:dt,x=>sampleTerrain(s,x),s.zones);
 for(const z of (s.zones||[]).filter(z=>z.kind==='vortex')){c.save();c.strokeStyle='#bf9aff';for(let i=0;i<3;i++){c.globalAlpha=.3;c.lineWidth=2;c.beginPath();c.ellipse(z.x,z.y-8-i*6,z.r*(.4+i*.2),8+i*3,s.t*2+i,0,TAU);c.stroke();}c.restore();}
 const oldShots=new Map((this.previous?.projectiles||[]).map(b=>[b.id,b])),shotBlend=s.paused?1:clamp((performance.now()-this.arrived)/50,0,1);
 this.airDefense.draw(c,s.interceptors,this.previous?.interceptors,shotBlend,s.paused?0:dt,!!s.paused);
 if(s.drone){const previous=this.previous?.drone,d=s.drone,blend=s.paused?1:shotBlend,pose=previous?.owner===d.owner?{...d,x:lerp(previous.x,d.x,blend),y:lerp(previous.y,d.y,blend),bank:lerp(previous.bank||0,d.bank||0,blend)}:d;this.drone(c,pose,s,ps.find(p=>p.id===d.owner)?.color||'#c4ff38');}
 for(const shot of bullets){const prev=oldShots.get(shot.id),b=prev?{...shot,x:lerp(prev.x,shot.x,shotBlend),y:lerp(prev.y,shot.y,shotBlend)}:shot;const w=this.weapons?.[b.weapon],style=b.draw||w?.fx?.bullet||{},method=style.method||'BULLET_TRAIL',barrel=/barrel/i.test(b.sourceBullet||'')&&(b.sourceType==='CRUISER'||style.animated),bodiless=method==='BULLET_NONE'&&!barrel&&!style.animated,
  // A sprite-less BULLET_NONE node is only seen through its BULLET_EMITTER
  // trail (quad/cluster carriers, fire hose...). Skipping it hid the shot.
  emitter=bodiless?emitterColor(w,b.sourceBullet):null,color=emitter||w?.color||'#ffe6b0';if(bodiless&&!emitter)continue;c.save();c.lineCap='round';const speed=Math.hypot(b.vx,b.vy)||1,trail=method==='BULLET_NONE'?(emitter?style.trailLength||11:0):method==='BULLET_PIXEL'?Math.min(5,style.trailLength??2):style.trailLength??11,len=clamp(Math.max(speed*.018,trail*2.25),2,80),ux=b.vx/speed,uy=b.vy/speed,segments=clamp(Math.ceil(trail/2),1,12),baseWidth=clamp((style.size||1)*1.35+(b.pellet?.5:1.2),1,7),dim=1-clamp(style.dim||0,0,100)/130;if(trail>0)for(let i=segments;i>0;i--){c.globalAlpha=(1-i/(segments+1))*.68*dim;line(c,[[b.x-ux*len*i/segments,b.y-uy*len*i/segments],[b.x-ux*len*(i-1)/segments,b.y-uy*len*(i-1)/segments]],color,baseWidth*(1-i/(segments+3)));}c.restore();if(this.projectileArt.draw(c,b,s.t)){}else if(barrel){c.save();c.translate(b.x,b.y);c.rotate(Math.sin(s.t*9)*.09);c.fillStyle='#a44d29';c.strokeStyle='#f3b475';c.lineWidth=1.5;c.fillRect(-7,-10,14,19);c.strokeRect(-7,-10,14,19);line(c,[[-7,-5],[7,-5]],'#573829',2);line(c,[[-7,4],[7,4]],'#573829',2);c.restore();}else if(b.pellet){circle(c,b.x,b.y,2.1,'#c6ecff');}else if(b.liquid){circle(c,b.x,b.y,3.2,'#ff812b');}else if(w?.family==='dirt'){poly(c,[[b.x-4,b.y+3],[b.x-2,b.y-4],[b.x+4,b.y-2],[b.x+3,b.y+4]],'#60a726');}else {c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));poly(c,[[6,0],[-3,-3],[-3,3]],color);c.restore();}circle(c,b.x,b.y,b.pellet?3:8,color+'28');}
 }
 drawEffects(c,dt){if(this.s?.mode==='pocket_siege'){this.siegeFX.draw(c,dt,this.s.t);drawExplosionWaves(c,this.s,this.weapons);}this.bursts=this.bursts.filter(b=>b.life>0);for(const b of this.bursts){b.life-=dt;const t=1-b.life/b.total,r=b.r*Math.sin(Math.min(1,t)*Math.PI);circle(c,b.x,b.y,Math.max(0,r),'#ff6317');circle(c,b.x,b.y,Math.max(0,r*.82),'#ffbe16');circle(c,b.x,b.y,Math.max(0,r*.55),'#fff7a3');}this.particles=this.particles.filter(p=>p.life>0);for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt;c.globalAlpha=clamp(p.life/.6,0,1);if(this.s?.mode==='pocket_siege'){c.fillStyle=p.color;c.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);}else circle(c,p.x,p.y,p.size*clamp(p.life/.5,.25,1),p.color);}c.globalAlpha=1;this.rings=this.rings.filter(p=>p.life>0);for(const p of this.rings){p.life-=dt;const t=1-p.life/p.total;c.globalAlpha=(1-t)*.7;c.lineWidth=2+(1-t)*5;circle(c,p.x,p.y,p.r*(.2+t));c.strokeStyle=p.color;c.stroke();}c.globalAlpha=1;this.beams=this.beams.filter(b=>b.life>0);for(const b of this.beams){b.life-=dt;c.globalAlpha=Math.min(1,b.life*4);line(c,[[b.x,b.y],[b.x2,b.y2]],b.color,12);line(c,[[b.x,b.y],[b.x2,b.y2]],'#fff9df',3);}c.globalAlpha=1;
  this.texts=this.texts.filter(p=>p.life>0);for(const p of this.texts){p.life-=dt;if(p.pop){p.x+=(p.vx||0)*dt;p.y+=(p.vy||-70)*dt;p.vy=(p.vy||-70)+(p.gravity||90)*dt;}else p.y-=dt*22;const age=1-p.life/(p.total||1.2),scale=p.pop?clamp(.55+Math.sin(Math.min(1,age)*Math.PI)*.62,.55,1.12):1;c.globalAlpha=clamp(Math.min(age*8,p.life*2.8),0,1);c.font=`900 ${Math.round((p.combo>1?26:21)*scale)}px sans-serif`;c.textAlign='center';c.shadowColor=p.pop?p.color+'88':'#0008';c.shadowBlur=p.pop?10:5;c.lineWidth=4;c.strokeStyle='#08050bd0';c.strokeText(p.value,p.x,p.y);c.fillStyle=p.color;c.fillText(p.value,p.x,p.y);if(p.combo>1){c.font='800 10px sans-serif';c.fillText('COMBO ×'+p.combo,p.x,p.y+16);}}c.globalAlpha=1;c.shadowBlur=0;
 }
 drawVersus(c,s,dt){
  const n=s.boards.length,views=n===2?[{x:20,y:184,w:610,h:343},{x:650,y:184,w:610,h:343}]:[{x:36,y:63,w:568,h:320},{x:676,y:63,w:568,h:320},{x:356,y:391,w:568,h:320}];
  this.vfx??=[];
  s.boards.forEach((b,i)=>{const v=views[i],p=b.players[0];if(!v||!b.path)return;c.save();rounded(c,v.x-5,v.y-5,v.w+10,v.h+10,12,p.color);c.beginPath();c.rect(v.x,v.y,v.w,v.h);c.clip();c.translate(v.x,v.y);c.scale(v.w/1280,v.h/720);c.drawImage(this.bg,0,0);
   const previous=this.previous;this.previous=previous?.boards?.[i]||null;this.drawMarbles(c,b,dt);this.previous=previous;
   let f=this.vfx[i];if(!f)f=this.vfx[i]={seen:0,particles:[],texts:[],rings:[],beams:[],bursts:[]};const old={};for(const k of ['particles','texts','rings','beams','bursts']){old[k]=this[k];this[k]=f[k];}for(const e of b.events||[])if(e.id>f.seen){f.seen=e.id;this.effect(e);}this.drawEffects(c,s.paused?0:dt);for(const k of Object.keys(old)){f[k]=this[k];this[k]=old[k];}
   if(b.phase==='results'){c.fillStyle='#182419aa';c.fillRect(0,0,1280,720);c.fillStyle='#fff';c.font='bold 64px sans-serif';c.textAlign='center';c.fillText(b.result?.reason==='victory'?'ГОТОВО!':'ВЫБЫЛ',640,390);}c.restore();
   c.font='bold 16px sans-serif';c.fillStyle='#1c3322';c.textAlign='left';c.fillText(p.name+'  ·  '+p.score,v.x+14,v.y+26);const incoming=s.attacks?.filter(a=>a.to===p.id).reduce((sum,a)=>sum+a.count,0)||0;if(incoming){c.fillStyle='#b82428';c.textAlign='right';c.fillText('+'+incoming+' шаров →',v.x+v.w-14,v.y+26);}
  });
 }
 frame(now){const dt=Math.min(.05,(now-this.last)/1000);this.last=now;const s=this.s;if(s){const rect=this.el.getBoundingClientRect(),dpr=Math.min(1.5,window.devicePixelRatio||1),width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);if(this.el.width!==width||this.el.height!==height){this.el.width=width;this.el.height=height;}const c=this.c,scale=s.mode==='pocket_siege'?width/1280:Math.min(width/1280,height/720);this.viewHalf=Math.min(360,height/scale/2);c.setTransform(1,0,0,1,0,0);c.fillStyle=s.mode==='marble_bloom'?'#b7c58a':'#000000';c.fillRect(0,0,width,height);c.translate((width-1280*scale)/2,(height-720*scale)/2);c.scale(scale,scale);this.background(s);c.save();c.beginPath();c.rect(0,0,1280,720);c.clip();c.drawImage(this.bg,0,0);c.save();if(s.mode==='marble_bloom'){if(s.arenaMode==='versus')this.drawVersus(c,s,dt);else this.drawMarbles(c,s,dt);}else this.drawTanks(c,s,dt);this.drawEffects(c,s.paused?0:dt);c.restore();c.restore();}this.transitionFrame(now);this.raf=requestAnimationFrame(this.frame);}
 destroy(){cancelAnimationFrame(this.raf);this.mapTransition=null;this.siegeFX.clear();this.airDefense.clear();this.audio.ctx?.close();}
}
