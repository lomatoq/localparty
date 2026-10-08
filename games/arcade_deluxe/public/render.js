import {drawExplosionWaves} from './explosion-waves.js';
import './geometry.js';
import './marble-layout.js';
const marbleGarden=new Image(),marbleMachines=new Image();marbleGarden.src='/assets/gameplay/refresh129/marble-garden.png';marbleMachines.src='/assets/gameplay/refresh129/marble-machinery.png';
function marblePart(c,index,x,y,size,angle=0){if(!marbleMachines.complete||!marbleMachines.naturalWidth)return false;const cell=marbleMachines.width/3;c.save();c.translate(x,y);c.rotate(angle);c.drawImage(marbleMachines,index*cell,0,cell,marbleMachines.height,-size/2,-size/2,size,size);c.restore();return true;}
const MarbleLayout=globalThis.MarbleLayout;
import {SiegeFX} from './siege-fx.js';
import {PocketProjectileArt} from './pocket-projectiles.js';
import {AirDefenseRenderer} from './air-defense-render.js';
import {PocketJuice} from './pocket-juice.js';
import {drawToyTank,shade} from './pocket-tank.js';
import {DEEP_SOIL} from './pocket-world.js';
import {pocketFrame,offscreenShots} from './pocket-camera.js';
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
 constructor(el){this.el=el;this.c=el.getContext('2d');this.s=null;this.previous=null;this.arrived=0;this.lastEvent=0;this.particles=[];this.texts=[];this.rings=[];this.beams=[];this.bursts=[];this.sprites=MARBLE_COLORS.map(sphere);this.audio=new AudioFX();this.cam={x:640,y:360,z:1};this.last=performance.now();this.reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;this.siegeFX=new SiegeFX(this.reduced);this.projectileArt=new PocketProjectileArt();this.airDefense=new AirDefenseRenderer(this.projectileArt,this.reduced);this.juice=new PocketJuice(this.reduced);this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);this.backgroundKey='';this.sizeDirty=true;this.resizeFrame=()=>{if(this.destroyed)return;this.sizeDirty=true;this.pausePaintFrames=0;if(!this.raf){if(this.s?.paused)this.last=performance.now();this.raf=requestAnimationFrame(this.frame);}};this.sizeObserver=new ResizeObserver(this.resizeFrame);this.sizeObserver.observe(el);addEventListener('resize',this.resizeFrame);this.pausePaintFrames=0;this.assetChanged=()=>{if(!this.destroyed)this.resizeFrame();};for(const image of [marbleGarden,marbleMachines])image.addEventListener('load',this.assetChanged);this.projectileArt.ready.then(()=>{this.projectileReady=true;this.assetChanged();});this.siegeFX.plasma.ready.then(this.assetChanged);this.fontsChanged=()=>this.resizeFrame();document.fonts?.addEventListener('loadingdone',this.fontsChanged);document.fonts?.ready.then(()=>{if(!this.destroyed)this.fontsChanged();});}
 setState(s){
  if(this.destroyed)return;
  const mapKey=v=>JSON.stringify([v.roundSerial,v.level,v.boards?.map(b=>b.level)]);
  if(!this.reduced&&s.mode==='marble_bloom'&&this.s&&mapKey(s)!==mapKey(this.s)&&this.el.width&&this.el.height){
   // Freeze only the outgoing rendered frame; never run two simulations or
   // retain entire old states. Rapid map changes replace this one snapshot.
   const snapshot=canvas(this.el.width,this.el.height);snapshot.getContext('2d').drawImage(this.el,0,0);
   this.mapTransition={snapshot,at:performance.now()};
  }
  if(s.mode==='pocket_siege'&&s.phase==='playing'&&s.stage==='aim'&&(this.s?.roundSerial!==s.roundSerial||this.s?.activeId!==s.activeId||this.s?.turn!==s.turn))this.shooterNotice={player:s.activeId,at:s.t};
  if(!this.raf){if(this.s?.paused)this.last=performance.now();this.raf=requestAnimationFrame(this.frame);}this.pausePaintFrames=0;
  this.previous=this.s;this.s=s;this.arrived=performance.now();if(this.roundSerial!==s.roundSerial){this.roundSerial=s.roundSerial;this.siegeFX.clear();this.airDefense.clear();this.juice.clear();this.lastEvent=0;this.particles=[];this.texts=[];this.rings=[];this.beams=[];this.bursts=[];this.vfx=[];this.cam={x:640,y:360,z:1};this.pathKey=null;this.terrainCanvas=null;this.terrainTransition=null;}for(const e of s.events||[]){if(e.id<=this.lastEvent)continue;this.lastEvent=e.id;this.effect(e);}if(this.previous?.terrainRevision!==s.terrainRevision){this.terrainTransition=null;this.terrainCanvas=null;if(s.mode==='pocket_siege'&&this.previous?.roundSerial===s.roundSerial)this.juice.terrainDelta(this.previous.terrain,s.terrain);}
 }
 transitionFrame(now){
  const transition=this.mapTransition;if(!transition)return;
  const t=clamp((now-transition.at)/850,0,1);
  if(t===1){this.mapTransition=null;return;}
  const c=this.c;c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1-t*t*(3-2*t);c.drawImage(transition.snapshot,0,0,this.el.width,this.el.height);c.restore();
 }
 // Pocket Siege TV beats (presentation only): a server-confirmed tank hit adds
 // decaying shake and, for heavy damage, a ~60 ms hit-stop; a new turn lights a
 // one-shot ring on the active tank. Never on reduced motion.
 siegeBeat(e){if(this.s?.mode!=='pocket_siege'||!this.previous)return;const now=performance.now();if(e.kind==='turn'){this.turnCue={player:e.player,at:now};return;}
  if(e.kind!=='hit'||this.reduced)return;const d=clamp((Number(e.damage)||10)/60,.1,1);this.trauma=Math.min(1,(this.trauma||0)+.2+.45*d);if(d>=.5)this.holdUntil=(this.last||now)+60;}
 siegeShake(dt){this.trauma=Math.max(0,(this.trauma||0)-dt*1.6);this.shakeClock=(this.shakeClock||0)+dt;const k=this.trauma*this.trauma,t=this.shakeClock;return k?{x:7*k*Math.sin(t*49),y:5*k*Math.sin(t*63+1.1)}:{x:0,y:0};}
 // Retro night sky: sparse, dim pixel stars above the hills. Their clock stops
 // while paused so a frozen frame stays pixel-identical. Dimmer than any
 // projectile so a shell in flight is never confused with a star.
 stars(c,now){if(!this.starField){let seed=97531;const r=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;this.starField=Array.from({length:90},()=>({x:r()*1280,y:r()*330,s:r()<.18?2:1,p:r()*6.28,v:.4+r()*1.2,a:.12+r()*.2}));}
  c.save();for(const q of this.starField){c.globalAlpha=this.reduced?q.a:q.a*(.65+.35*Math.sin(now/1000*q.v+q.p));c.fillStyle=q.s>1?'#d9cbff':'#b9a8e6';c.fillRect(Math.round(q.x),Math.round(q.y),q.s,q.s);}c.restore();}
 effect(e){this.siegeBeat(e);if(this.s?.mode==='pocket_siege'&&this.previous)this.juice.event(e,this.s,x=>sampleTerrain(this.s,x));if(this.s?.mode==='pocket_siege'&&this.airDefense.emit(e))return;if(this.s?.mode==='pocket_siege'&&this.siegeFX.emit(e)){this.audio.play(e.kind);return;}if(e.kind==='trace'){this.texts.push({x:e.x,y:e.y,value:Math.round(e.angle)+'° · '+e.distance,combo:0,color:e.color,life:2.2});}if(e.kind==='blast'){this.bursts.push({...e,life:.58,total:.58});if(this.bursts.length>70)this.bursts.shift();}const col=typeof e.color==='number'?MARBLE_COLORS[e.color]:e.color||'#e6edc9';if(['pop','blast','muzzle','split','bounce','dirt','warp'].includes(e.kind)){const n=e.kind==='blast'?25:e.kind==='pop'?12:5;for(let i=0;i<n;i++){const a=Math.random()*TAU,v=35+Math.random()*(e.kind==='blast'?220:90);this.particles.push({x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,color:col,life:.45+Math.random()*.4,total:.8,size:2+Math.random()*4});}if(this.s?.mode==='marble_bloom'&&(e.kind==='pop'||e.kind==='score'&&e.combo>1)){const n=e.kind==='pop'?5:8,spin=Math.random()*TAU,big=e.kind==='score';for(let i=0;i<(this.reduced?Math.min(3,n):n);i++){const a=spin+i*TAU/n,v=big?120:70;this.particles.push({petal:true,x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,a,spinRate:(Math.random()-.5)*3,color:big?MARBLE_COLORS[(i+(e.combo||0))%MARBLE_COLORS.length]:col,life:big?.95:.7,total:big?.95:.7,size:big?16:12});}}if(['blast','warp','pop'].includes(e.kind))this.rings.push({x:e.x,y:e.y,r:e.r||24,color:col,life:.6,total:.6});if(this.particles.length>420)this.particles.splice(0,this.particles.length-420);this.audio.play(e.kind);}
 if(e.kind==='score')this.texts.push({x:e.x,y:e.y,value:(e.value>0?'+':'')+e.value,combo:e.combo,color:col,life:1.35,total:1.35,vx:(Math.random()-.5)*18,vy:-82,gravity:92,pop:true});if(e.kind==='beam'){this.beams.push({...e,life:.42});if(this.beams.length>96)this.beams.shift();}if(this.texts.length>80)this.texts.shift();if(this.rings.length>100)this.rings.shift();}
 toWorld(clientX,clientY){const r=this.el.getBoundingClientRect();
  if(this.s?.mode==='marble_bloom'){
   const x=clientX-r.left,y=clientY-r.top;
   if(this.s.arenaMode==='versus'&&this.s.localPlayerId){const board=this.marbleBoards?.find(b=>b.id===this.s.localPlayerId);if(board)return MarbleLayout.inverse(board.view,x,y);}
   if(this.marbleViewport)return MarbleLayout.inverse(this.marbleViewport,x,y);
  }
  const scale=this.s?.mode==='pocket_siege'?r.width/1280:Math.min(r.width/1280,r.height/720);let x=(clientX-r.left-(r.width-1280*scale)/2)/scale,y=(clientY-r.top-(r.height-720*scale)/2)/scale;if(this.s?.mode==='pocket_siege'){x=(x-640)/this.cam.z+this.cam.x;y=(y-360)/this.cam.z+this.cam.y;}return {x,y};}
 background(s){const key=s.mode+'-'+(s.level||0)+'-'+(s.sky||'day')+'-'+(marbleGarden.complete&&marbleGarden.naturalWidth?'art':'loading');if(key===this.backgroundKey&&this.bg)return;this.backgroundKey=key;this.bg=s.mode==='marble_bloom'?canvas(1440,880):canvas();const c=this.bg.getContext('2d');
 if(s.mode==='marble_bloom'){
  c.fillStyle='#e7ddbd';c.fillRect(0,0,1440,880);
  if(marbleGarden.complete&&marbleGarden.naturalWidth){const k=Math.max(1440/marbleGarden.width,880/marbleGarden.height);c.drawImage(marbleGarden,(1440-marbleGarden.width*k)/2,(880-marbleGarden.height*k)/2,marbleGarden.width*k,marbleGarden.height*k);}
 }else{
  const g=c.createLinearGradient(0,0,0,720);g.addColorStop(0,'#000000');g.addColorStop(.40,'#000000');g.addColorStop(.45,'#030005');g.addColorStop(.60,'#210030');g.addColorStop(.80,'#4b006f');g.addColorStop(1,'#7900a8');c.fillStyle=g;c.fillRect(0,0,1280,720);
 }
 }
 drawPath(c,s){if(!this.pathCanvas||this.pathKey!==s.level){this.pathKey=s.level;const e=this.pathCanvas=canvas(1440,880),p=e.getContext('2d');p.translate(80,80);p.lineJoin=p.lineCap='round';const pts=s.path.map(p=>[p.x,p.y]);p.save();p.translate(0,6);line(p,pts,'#75603844',67);p.restore();line(p,pts,'#dbc896',64);line(p,pts,'#b89760',56);line(p,pts,'#8d743d',47);line(p,pts,'#927a4c',42);p.setLineDash([2,17]);line(p,pts,'#ead49a90',53);p.setLineDash([]);line(p,pts,'#6f593238',36);}c.drawImage(this.pathCanvas,-80,-80);const end=s.path.at(-1);c.save();c.shadowColor='#343b3066';c.shadowBlur=12;c.shadowOffsetY=4;if(!marblePart(c,2,end.x,end.y,90)){circle(c,end.x,end.y,24,'#183329');}c.restore();}

 drawMarbles(c,s,dt){this.drawPath(c,s);const alpha=clamp((performance.now()-this.arrived)/50,0,1),old=new Map((this.previous?.chain||[]).map(b=>[b.id,b]));
 let chain=s.chain;
 if(s.phase==='waiting'){chain=s.path.filter((_,i)=>i%6===0).slice(0,30).map((p,i)=>({...p,id:-i,color:Math.floor(i/2)%5}));}
 for(const b of chain){if(b.s< -25)continue;const prev=old.get(b.id),x=prev?lerp(prev.x,b.x,alpha):b.x,y=prev?lerp(prev.y,b.y,alpha):b.y;c.drawImage(this.sprites[b.color],x-25.1,y-24,50,50);if(b.power){circle(c,x,y,19);c.strokeStyle='#fff7bd';c.lineWidth=1.5;c.stroke();c.font='bold 12px HeyPalsText,sans-serif';c.textAlign='center';c.fillStyle='#fff7db';c.fillText({bomb:'✦',slow:'Ⅱ',reverse:'↶',focus:'+'}[b.power],x,y+4);}}
 if(s.coin?.alive){const q=s.coin,pulse=1+Math.sin(s.t*3)*.06;c.save();c.translate(q.x,q.y);c.scale(pulse,pulse);circle(c,0,0,16,'#b99250');circle(c,0,-1,12,'#e4c376');c.fillStyle='#7e682d';c.font='bold 16px HeyPalsText,serif';c.textAlign='center';c.fillText('✦',0,4);c.restore();}
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
  c.save();c.shadowColor='#343b304d';c.shadowBlur=10;c.shadowOffsetY=4;marblePart(c,0,o.x,o.y,r*3.2);c.restore();
  marblePart(c,1,o.x,o.y,r*2.9,a+Math.PI/2);
  c.save();c.translate(o.x,o.y);c.rotate(a);c.drawImage(this.sprites[p.ball??1],-13,-13,26,26);circle(c,-r*.95,r*.55,7,MARBLE_COLORS[p.nextBall??4]);c.strokeStyle=p.color;c.lineWidth=3;circle(c,0,0,r*1.4);c.stroke();c.restore();
 }
 for(const b of s.shots){line(c,[[b.x-b.vx*.033,b.y-b.vy*.033],[b.x,b.y]],MARBLE_COLORS[b.color]+'80',9);c.drawImage(this.sprites[b.color],b.x-18,b.y-18,36,36);}
 if(s.slowUntil>s.t||s.reverseUntil>s.t){c.fillStyle='#d4edab';c.font='600 13px HeyPalsText,sans-serif';c.textAlign='center';c.fillText(s.reverseUntil>s.t?'↶  ЗВАРОТНЫ РУХ':'Ⅱ  ЗАПАВОЛЕННЕ',640,650);}
 }
 terrain(s){
  if(this.terrainCanvas)return this.terrainCanvas;const depth=s.terrainBottom||680,e=this.terrainCanvas=canvas(1280,depth+170),c=e.getContext('2d');c.imageSmoothingEnabled=false;
  let cols=s.terrainColumns||s.terrain.slice(0,640).map(y=>[y,depth]);
  const alpha=s.paused?1:clamp((performance.now()-this.arrived)/50,0,1),old=this.previous?.terrainColumns;
  if(old&&alpha<1)cols=cols.map((col,i)=>col.map((v,j)=>{const prev=old[i];if(prev?.length!==col.length)return v;const start=j-j%2,a=col[start]-prev[start],b=col[start+1]-prev[start+1];return a>=0&&Math.abs(a-b)<.25?lerp(prev[j],v,alpha):v;}));
  const palette=['#049c05','#018701','#017501','#026902','#015b01','#014f00','#004400'],soil=s.mode==='pocket_siege'?this.juice.world.soilFill(c,s,cols,depth):null,deferred=[];
  // Painted soil: plain column mask, then the round's art composited once (a
  // per-column pattern fill re-rasterised the art and cost ~1 s in WebKit).
  if(soil)c.fillStyle='#000';
  const widths=[4,20,24,28,35,42,9999];
  for(let i=0;i<cols.length;i++){
   const surface=cols[i][0]??depth;let threshold=0,bands=[];for(let k=0;k<palette.length;k++){threshold+=widths[k];bands.push(threshold);}
   for(let j=0;j<cols[i].length;j+=2){const top=cols[i][j],bottom=cols[i][j+1],origin=s.terrainStrata?.[i]?.[j/2]??surface;let y=top;
    const material=s.terrainMaterials?.[i]?.[j/2];
    if(material&&soil){deferred.push([i,top,bottom,origin,material]);continue;}
    if(material){const gradient=c.createLinearGradient(0,origin,0,Math.max(origin+24,bottom));gradient.addColorStop(0,material[1]);gradient.addColorStop(1,material[0]);c.fillStyle=gradient;c.fillRect(i*2,Math.floor(top),2,Math.ceil(bottom)-Math.floor(top));continue;}
    if(soil){c.fillRect(i*2,Math.floor(top),2,Math.ceil(bottom)-Math.floor(top));continue;}
    while(y<bottom){const d=Math.max(0,y-origin),k=Math.min(palette.length-1,bands.findIndex(v=>d<v)===-1?palette.length-1:bands.findIndex(v=>d<v)),edge=k===palette.length-1?bottom:Math.min(bottom,origin+bands[k]),b=Math.max(y+.1,edge);c.fillStyle=palette[k];c.fillRect(i*2,Math.floor(y),2,Math.ceil(b)-Math.floor(y));y=b;}
   }
  }
  if(soil){c.globalCompositeOperation='source-in';c.drawImage(soil,0,0);c.globalCompositeOperation='source-over';for(const [i,top,bottom,origin,material] of deferred){const gradient=c.createLinearGradient(0,origin,0,Math.max(origin+24,bottom));gradient.addColorStop(0,material[1]);gradient.addColorStop(1,material[0]);c.fillStyle=gradient;c.fillRect(i*2,Math.floor(top),2,Math.ceil(bottom)-Math.floor(top));}}
  c.fillStyle=soil?DEEP_SOIL:'#004400';c.fillRect(0,depth,1280,170);
  // Faint fixed diagonal grain confined to existing ground; never screen noise.
  if(!this.soilPattern){const p=canvas(96,96),q=p.getContext('2d');let seed=12345;for(let y=0;y<96;y++)for(let x=0;x<96;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=(seed>>>28)-8;q.fillStyle=n>0?'rgba(255,255,255,.026)':'rgba(0,0,0,.04)';q.fillRect(x,y,1,1);}q.strokeStyle='rgba(0,0,0,.06)';q.lineWidth=1;for(let i=-96;i<192;i+=7){q.beginPath();q.moveTo(i,0);q.lineTo(i-96,96);q.stroke();}this.soilPattern=c.createPattern(p,'repeat');}
  c.globalCompositeOperation='source-atop';c.fillStyle=this.soilPattern;c.fillRect(0,0,1280,depth+170);c.globalCompositeOperation='source-over';
  // Grass rim, cut-edge light, slope shading, overhang occlusion and scorches.
  if(s.mode==='pocket_siege'){this.juice.bakeSurface(c,s,cols,depth);this.juice.world.dress(c,s,cols);this.bakedScorch=this.juice.scorchRevision;}return e;
 }
 tank(c,p,s,active){
  const tilt=p.surfaceAngle??surfaceAngle(s,p.x),pose=Geo.gunPose({...p,surfaceAngle:tilt}),fired=(s.events||[]).filter(e=>e.kind==='muzzle'&&e.player===p.id).at(-1),recoil=fired?Math.max(0,1-(s.t-fired.t)/.2)*3:0;
  // The turret occludes the barrel root and pivot, including during recoil.
  // World coordinates keep the gun attached correctly on sloping ground.
  const end={x:pose.muzzle.x-recoil*pose.dir.x,y:pose.muzzle.y-recoil*pose.dir.y};
  // Toy tank hero (pocket-tank.js): outlined team-colour hull, rolling wheels,
  // idle bob, knockback squash, hit flash, battle soot and the leader crown.
  const fx=this.juice.tankFx(p.id),crown=this.leaderId!=null&&this.leaderId===p.id,clock=this.juice.clock,bounce=this.reduced?0:Math.abs(Math.sin(clock*3.4))*3;
  if(active){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=this.reduced?.35:.28+.12*Math.sin(clock*3.4);c.fillStyle=p.color;c.beginPath();c.ellipse(p.x,p.y+8,32,6,p.surfaceAngle||0,0,TAU);c.fill();c.restore();}
  drawToyTank(c,{x:p.x,y:p.y,tilt,color:p.color,pivot:pose.pivot,end,dir:pose.dir,recoilKick:this.reduced?0:recoil/3,fx,wheel:p.x,crown,crownBob:this.reduced?0:Math.sin(clock*2.2)*1.2,battered:this.juice.battered(p.id)});
  if(active){const top=p.y-(crown?55:43)-bounce;c.save();c.lineJoin='round';c.beginPath();c.moveTo(p.x-7,top);c.lineTo(p.x+7,top);c.lineTo(p.x,top+8);c.closePath();c.lineWidth=3;c.strokeStyle='#140c22';c.stroke();c.fillStyle=p.color;c.fill();c.restore();}
  if(active&&this.turnCue?.player===p.id&&!this.reduced){const k=(performance.now()-this.turnCue.at)/650;if(k>=0&&k<1){const e=1-Math.pow(1-k,3);c.save();c.globalAlpha=(1-k)*.9;c.strokeStyle=p.color;c.lineWidth=3*(1-k)+1;c.beginPath();c.arc(p.x,p.y-6,16+30*e,0,TAU);c.stroke();c.restore();}}
  if(p.frozen||p.blockedThisTurn){c.strokeStyle='#beefff';c.lineWidth=2;c.strokeRect(p.x-24,p.y-26,48,36);}
  c.textAlign='center';c.font='500 14px KardiaFit,sans-serif';let label=p.name;const maxWidth=Math.min(200,1280/Math.max(2,this.s.players.filter(p=>p.participant).length)-24);while(label.length>1&&c.measureText(label).width>maxWidth)label=label.slice(0,-2)+'…';const half=c.measureText(label).width/2,labelX=clamp(p.x,half+8,1272-half);c.lineWidth=3;c.strokeStyle='#061106';c.strokeText(label,labelX,p.y+27);c.fillStyle=p.color;c.fillText(label,labelX,p.y+27);
 }
 drone(c,d,s,color){
  // Same rounded toy material and dark plum ink as the tanks. The solid craft
  // stays inside the existing compact collision silhouette (±17, -13..7).
  const ink='#150c22',clock=this.juice.clock,low=d.charge<.25;
  c.save();c.translate(d.x,d.y);c.rotate(d.bank||0);c.lineCap=c.lineJoin='round';
  // Joined outriggers and two clearly separated lifting rotors.
  for(const sign of [-1,1]){
   line(c,[[sign*4,-1],[sign*10,-6],[sign*10,-9]],ink,4.5);
   line(c,[[sign*4,-2],[sign*10,-7]],shade(color,-.25),2.3);
   rounded(c,sign*10-2.5,-11,5,4,1.8,ink);
   rounded(c,sign*10-1.5,-10.6,3,2.4,1,shade(color,.25));
   c.save();c.translate(sign*10,-11.2);
   c.fillStyle='#c8bbed35';c.beginPath();c.ellipse(0,0,6.1,1.5,0,0,TAU);c.fill();
   c.scale(1,.23);c.rotate(this.reduced?.35:clock*43*sign);
   rounded(c,-6,-1,12,2,1,'#e9e0ff');rounded(c,-1,-5,2,10,1,'#b5a7d7');c.restore();
   circle(c,sign*10,-11.2,1.1,ink);
  }
  // Landing skids sit behind the body, not detached below it.
  for(const sign of [-1,1]){line(c,[[sign*5,1],[sign*6,5],[sign*9,5]],ink,2.4);}
  const body=c.createLinearGradient(0,-7,0,4);body.addColorStop(0,shade(color,.55));body.addColorStop(.42,color);body.addColorStop(1,shade(color,-.48));
  c.beginPath();c.roundRect(-8,-7,16,11,5);c.fillStyle=body;c.fill();c.strokeStyle=ink;c.lineWidth=1.5;c.stroke();
  line(c,[[-4.5,-5.4],[3.5,-5.4]],'#ffffffa8',1.1);
  // Dark glass lens and a single team rim read at the live 30–50px size.
  rounded(c,-4,-2.5,8,4.5,2,ink);rounded(c,-2.8,-1.7,5.6,2.4,1.1,'#575070');
  circle(c,-.5,-.5,1.5,'#b9f4ed');circle(c,-1,-1,.55,'#fffaf1');
  // Payload latch joins the body; the low-charge lamp
  // is steady under reduced motion and freezes with the renderer while paused.
  rounded(c,-2,3,4,3,1.2,ink);
  const pulse=this.reduced?1:low?.65+.35*Math.sin(clock*8):1;
  c.globalAlpha=pulse;circle(c,5.5,-1,1,low?'#ff796b':'#ecffb3');c.restore();
 }

 drawTanks(c,s,dt){const bullets=s.projectiles||[];
 // Pocket Siege fills the width, so a host wider than 16:9 (the TV game frame
 // is 1920x888) crops the world top and bottom. Frame the shell and tanks in
 // the band that is actually on screen; at 16:9 this is exactly 0..720.
 const half=this.viewHalf||360;
 const framing=pocketFrame(s,half),ease=s.paused?0:this.reduced?1:1-Math.exp(-dt*5);this.cam.z=lerp(this.cam.z,framing.z,ease);this.cam.y=lerp(this.cam.y,framing.y,ease);
 this.cam.x=640;c.translate(640,360);c.scale(this.cam.z,this.cam.z);c.translate(-this.cam.x,-this.cam.y);
 if(s.fallingColumns||this.previous?.fallingColumns||(this.bakedScorch!==this.juice.scorchRevision&&!s.paused))this.terrainCanvas=null;const jdt=s.paused?0:dt;
 const terrainTexture=this.terrain(s),drawTerrain=(texture,alpha=1)=>{const terrainHeight=texture.height;c.save();c.globalAlpha=alpha;c.fillStyle=DEEP_SOIL;c.fillRect(-2400,terrainHeight-1,6080,1600);c.drawImage(texture,0,0,1,terrainHeight,-2400,0,2400,terrainHeight);c.drawImage(texture,1279,0,1,terrainHeight,1280,0,2400,terrainHeight);c.drawImage(texture,0,0);c.restore();};
 drawTerrain(terrainTexture);this.juice.world.drawEmbers(c,terrainTexture);this.juice.world.drawLife(c,x=>sampleTerrain(s,x),s.stage);
 let ps=s.players.filter(p=>p.participant&&Number.isFinite(p.x)&&Number.isFinite(p.y));if(!ps.length)ps=[{x:200,y:s.terrain[100]-9,color:'#c4ff38',name:'LIME',angle:42,surfaceAngle:surfaceAngle(s,200)},{x:1090,y:s.terrain[545]-9,color:'#ad8dff',name:'VIOLET',angle:137,surfaceAngle:surfaceAngle(s,1090)}];
 {let top=null,tie=false;for(const p of ps){if(!(p.score>0))continue;if(!top||p.score>top.score){top=p;tie=false;}else if(p.score===top.score)tie=true;}this.leaderId=top&&!tie&&ps.length>1?top.id:null;}
 this.tankPoses??=new Map();if(this.poseRound!==s.roundSerial){this.tankPoses.clear();this.poseRound=s.roundSerial;}
 for(const p of ps){let pose=this.tankPoses.get(p.id);if(!pose||Math.hypot(p.x-pose.x,p.y-pose.y)>100)pose={...p};const prevX=pose.x;const blend=s.paused||this.reduced?1:1-Math.exp(-dt*22);const aimBlend=s.paused||this.reduced?1:1-Math.exp(-dt*16);pose={...p,x:lerp(pose.x,p.x,blend),y:lerp(pose.y,p.y,blend),surfaceAngle:lerp(pose.surfaceAngle||0,p.surfaceAngle||0,blend),angle:Number.isFinite(pose.angle)&&Number.isFinite(p.angle)?lerp(pose.angle,p.angle,aimBlend):p.angle};this.tankPoses.set(p.id,pose);if(p.grounded!==false)this.juice.wheels(pose,prevX,jdt);this.tank(c,pose,s,p.id===s.activeId);}
 // Ground physically occludes buried chassis/barrels, but keep name labels
 // below the tracks readable. Do not redraw an opaque whole-screen overlay.
 const underground=ps.filter(p=>p.underground||p.buried);
 if(underground.length){c.save();c.beginPath();for(const p of underground)c.rect(p.x-54,p.y-54,108,68);c.clip();c.drawImage(terrainTexture,0,0);c.restore();}
 const active=ps.find(p=>p.id===s.activeId);if(active&&s.stage==='aim'){
  const w=this.weapons?.[active.weapon]||{},points=Geo.preview(active,w,s.wind),visible=[];
  for(const q of points){if(q.y>sampleTerrain(s,q.x)||q.x<0||q.x>1280)break;visible.push(q);}
  this.juice.drawAim(c,visible,active);
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
 this.airDefense.draw(c,s.interceptors,this.previous?.interceptors,shotBlend,s.paused?0:dt,!!s.paused);for(const b of s.interceptors||[])this.juice.trail({...b,id:'ad'+b.id},jdt,s.wind,{family:'seeker',color:'#b5e8ff'});
 if(s.drone){const previous=this.previous?.drone,d=s.drone,blend=s.paused?1:shotBlend,pose=previous?.owner===d.owner?{...d,x:lerp(previous.x,d.x,blend),y:lerp(previous.y,d.y,blend),bank:lerp(previous.bank||0,d.bank||0,blend)}:d;this.drone(c,pose,s,ps.find(p=>p.id===d.owner)?.color||'#c4ff38');}
 this.juice.drawPuffs(c,jdt);
 for(const shot of bullets){const prev=oldShots.get(shot.id),b=prev?{...shot,x:lerp(prev.x,shot.x,shotBlend),y:lerp(prev.y,shot.y,shotBlend)}:shot;const w=this.weapons?.[b.weapon],style=b.draw||w?.fx?.bullet||{},method=style.method||'BULLET_TRAIL',barrel=/barrel/i.test(b.sourceBullet||'')&&(b.sourceType==='CRUISER'||style.animated),bodiless=method==='BULLET_NONE'&&!barrel&&!style.animated,
  // A sprite-less BULLET_NONE node is only seen through its BULLET_EMITTER
  // trail (quad/cluster carriers, fire hose...). Skipping it hid the shot.
  emitter=bodiless?emitterColor(w,b.sourceBullet):null,color=emitter||w?.color||'#ffe6b0';if(bodiless&&!emitter)continue;if(!bodiless)this.juice.trail(b,jdt,s.wind,w,c);c.save();c.lineCap='round';const speed=Math.hypot(b.vx,b.vy)||1,trail=method==='BULLET_NONE'?(emitter?style.trailLength||11:0):method==='BULLET_PIXEL'?Math.min(5,style.trailLength??2):style.trailLength??11,len=clamp(Math.max(speed*.018,trail*2.25),2,80),ux=b.vx/speed,uy=b.vy/speed,segments=clamp(Math.ceil(trail/2),1,12),baseWidth=clamp((style.size||1)*1.35+(b.pellet?.5:1.2),1,7),dim=1-clamp(style.dim||0,0,100)/130;if(trail>0)for(let i=segments;i>0;i--){c.globalAlpha=(1-i/(segments+1))*.68*dim;line(c,[[b.x-ux*len*i/segments,b.y-uy*len*i/segments],[b.x-ux*len*(i-1)/segments,b.y-uy*len*(i-1)/segments]],color,baseWidth*(1-i/(segments+3)));}c.restore();if(this.projectileArt.draw(c,b,s.t)){}else if(barrel){c.save();c.translate(b.x,b.y);c.rotate(Math.sin(s.t*9)*.09);c.fillStyle='#a44d29';c.strokeStyle='#f3b475';c.lineWidth=1.5;c.fillRect(-7,-10,14,19);c.strokeRect(-7,-10,14,19);line(c,[[-7,-5],[7,-5]],'#573829',2);line(c,[[-7,4],[7,4]],'#573829',2);c.restore();}else if(b.pellet){circle(c,b.x,b.y,2.1,'#c6ecff');}else if(b.liquid){circle(c,b.x,b.y,3.2,'#ff812b');}else if(w?.family==='dirt'){poly(c,[[b.x-4,b.y+3],[b.x-2,b.y-4],[b.x+4,b.y-2],[b.x+3,b.y+4]],'#60a726');}else {c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));poly(c,[[6,0],[-3,-3],[-3,3]],color);c.restore();}circle(c,b.x,b.y,b.pellet?3:8,color+'28');}
 }
 drawEffects(c,dt){if(this.s?.mode==='pocket_siege'){const s=this.s;this.juice.drawParts(c,dt);this.siegeFX.draw(c,dt,s.t);drawExplosionWaves(c,s,this.weapons);this.juice.drawDebris(c,dt,x=>sampleTerrain(s,x));this.juice.drawCallouts(c,dt);}this.bursts=this.bursts.filter(b=>b.life>0);for(const b of this.bursts){b.life-=dt;const t=1-b.life/b.total,r=b.r*Math.sin(Math.min(1,t)*Math.PI);circle(c,b.x,b.y,Math.max(0,r),'#ff6317');circle(c,b.x,b.y,Math.max(0,r*.82),'#ffbe16');circle(c,b.x,b.y,Math.max(0,r*.55),'#fff7a3');}this.particles=this.particles.filter(p=>p.life>0);for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt;c.globalAlpha=clamp(p.life/.6,0,1);if(this.s?.mode==='pocket_siege'){c.fillStyle=p.color;c.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);}else if(p.petal){p.vy-=88*dt;p.vx*=Math.exp(-3.4*dt);p.vy*=Math.exp(-3.4*dt);p.a+=p.spinRate*dt;const k=1-p.life/p.total,grow=k<.25?.55+k/.25*.55:1.1-(k-.25)*.4;c.save();c.translate(p.x,p.y);c.rotate(p.a);c.scale(grow,grow);c.globalAlpha=clamp(p.life/.35,0,1)*.95;c.fillStyle=p.color;c.beginPath();c.ellipse(p.size*.55,0,p.size*.62,p.size*.3,0,0,TAU);c.fill();c.fillStyle='#ffffff66';c.beginPath();c.ellipse(p.size*.45,-p.size*.08,p.size*.32,p.size*.1,0,0,TAU);c.fill();c.restore();}else circle(c,p.x,p.y,p.size*clamp(p.life/.5,.25,1),p.color);}c.globalAlpha=1;this.rings=this.rings.filter(p=>p.life>0);for(const p of this.rings){p.life-=dt;const t=1-p.life/p.total;c.globalAlpha=(1-t)*.7;c.lineWidth=2+(1-t)*5;circle(c,p.x,p.y,p.r*(.2+t));c.strokeStyle=p.color;c.stroke();}c.globalAlpha=1;this.beams=this.beams.filter(b=>b.life>0);for(const b of this.beams){b.life-=dt;c.globalAlpha=Math.min(1,b.life*4);line(c,[[b.x,b.y],[b.x2,b.y2]],b.color,12);line(c,[[b.x,b.y],[b.x2,b.y2]],'#fff9df',3);}c.globalAlpha=1;
  this.texts=this.texts.filter(p=>p.life>0);for(const p of this.texts){p.life-=dt;if(p.pop){p.x+=(p.vx||0)*dt;p.y+=(p.vy||-70)*dt;p.vy=(p.vy||-70)+(p.gravity||90)*dt;}else p.y-=dt*22;const age=1-p.life/(p.total||1.2),scale=p.pop?clamp(.55+Math.sin(Math.min(1,age)*Math.PI)*.62,.55,1.12):1;c.globalAlpha=clamp(Math.min(age*8,p.life*2.8),0,1);c.font=`900 ${Math.round((p.combo>1?26:21)*scale)}px HeyPalsText,sans-serif`;c.textAlign='center';c.shadowColor=p.pop?p.color+'88':'#0008';c.shadowBlur=p.pop?10:5;c.lineWidth=4;c.strokeStyle='#08050bd0';c.strokeText(p.value,p.x,p.y);c.fillStyle=p.color;c.fillText(p.value,p.x,p.y);if(p.combo>1){c.font='800 10px HeyPalsText,sans-serif';c.fillText('COMBO ×'+p.combo,p.x,p.y+16);}}c.globalAlpha=1;c.shadowBlur=0;
 }
 // Screen-space feedback stays independent of projectile zoom. Use the actual
 // TV notch and lower crew dock as safe edges, including a scaled game iframe.
 pocketNoticeBounds(){
  const now=performance.now();if(this.noticeBounds&&now-this.noticeBoundsAt<250)return this.noticeBounds;
  const rect=this.el.getBoundingClientRect(),unit=1280/Math.max(1,rect.width),half=this.viewHalf||360;
  const bounds={left:68,right:1212,top:360-half+32,bottom:360+half-40};
  const dock=document.querySelector('.pocket-tv-dock:not(.hidden)');if(dock)bounds.bottom=Math.min(bounds.bottom,360-half+(dock.getBoundingClientRect().top-rect.top)*unit-30);
  try{if(window.parent!==window){const frame=window.frameElement,bar=window.parent.document.querySelector('.gamebar:not([hidden]) .tv-info-dock'),fr=frame?.getBoundingClientRect();if(bar&&fr&&fr.width){const scale=fr.width/window.innerWidth,physicalTop=fr.top+rect.top*scale;bounds.top=Math.max(bounds.top,360-half+(bar.getBoundingClientRect().bottom-physicalTop)/(rect.width*scale)*1280+30);}}}catch{}
  this.noticeBounds=bounds;this.noticeBoundsAt=now;return bounds;
 }
 drawPocketNotices(c,s){
  if(s.phase!=='playing'||s.stage==='loadout')return;
  const bounds=this.pocketNoticeBounds();this.flightCues=offscreenShots(s,this.cam,bounds);
  for(const q of this.flightCues){
   c.save();c.translate(q.x,q.y);c.fillStyle='#16243cef';c.strokeStyle=q.color;c.lineWidth=1;c.beginPath();c.roundRect(-56,-21,112,42,16);c.fill();c.globalAlpha=.65;c.stroke();c.globalAlpha=1;
   c.save();c.translate(-34,0);c.rotate(q.angle);line(c,[[-9,0],[6,0]],q.color,2);poly(c,[[10,0],[3,-5],[3,5]],q.color);c.restore();
   c.font='600 12px KardiaFit,sans-serif';c.fillStyle='#f4f3ff';c.textAlign='left';c.textBaseline='middle';c.fillText('IN FLIGHT',-15,1);c.restore();
  }
  const notice=this.shooterNotice,age=notice?s.t-notice.at:Infinity;
  if(s.stage!=='aim'||age<0||age>=1.8)return;
  const p=s.players.find(p=>p.id===notice.player);if(!p)return;
  c.save();c.globalAlpha=Math.min(1,age/.12,(1.8-age)/.25);c.textAlign='center';c.textBaseline='middle';c.font='700 26px KardiaFit,sans-serif';let name=p.name||'Player';while(name.length>1&&c.measureText(name).width>470)name=name.slice(0,-2)+'…';
  const width=Math.max(216,c.measureText(name).width+64),y=clamp(360,bounds.top+54,bounds.bottom-54),g=c.createLinearGradient(0,y-44,0,y+44);g.addColorStop(0,'#33405afa');g.addColorStop(1,'#141b30ed');c.shadowColor='#070c20aa';c.shadowBlur=20;c.shadowOffsetY=5;rounded(c,640-width/2,y-44,width,88,24,g);c.shadowBlur=0;c.shadowOffsetY=0;c.strokeStyle=p.color+'99';c.lineWidth=1;c.stroke();
  c.font='italic 900 14px KardiaFatRunner,sans-serif';c.fillStyle=p.color;c.fillText('TURN',640,y-18);c.font='700 26px KardiaFit,sans-serif';c.fillStyle='#fff';c.fillText(name,640,y+12);c.restore();
 }
 drawMarbleScene(c,s,dt,view,backdrop=true){c.save();c.translate(view.x,view.y);c.scale(view.scale,view.scale);if(backdrop)c.drawImage(this.bg,-80,-80);this.drawMarbles(c,s,dt);this.drawEffects(c,s.paused?0:dt);c.restore();}
 drawVersus(c,s,dt,width,height,uiScale=1){
  const views=MarbleLayout.boards(s.boards.length,width,height);this.vfx??=[];this.marbleBoards=[];
  s.boards.forEach((b,i)=>{const v=views[i],p=b.players[0];if(!v||!b.path)return;
   const rect={x:v.x+8,y:v.y+36,w:v.w-16,h:v.h-44},view=MarbleLayout.fit(b,rect);this.marbleBoards.push({id:p.id,frame:v,view:{...view,scale:view.scale*uiScale,x:view.x*uiScale,y:view.y*uiScale}});
   c.save();rounded(c,v.x,v.y,v.w,v.h,18,'#1d1928');c.strokeStyle=p.color;c.lineWidth=2;c.stroke();
   c.beginPath();c.roundRect(rect.x,rect.y,rect.w,rect.h,10);c.clip();
   const previous=this.previous;this.previous=previous?.boards?.[i]||null;
   let f=this.vfx[i];if(!f)f=this.vfx[i]={seen:0,particles:[],texts:[],rings:[],beams:[],bursts:[]};const old={};for(const k of ['particles','texts','rings','beams','bursts']){old[k]=this[k];this[k]=f[k];}for(const e of b.events||[])if(e.id>f.seen){f.seen=e.id;this.effect(e);}
   this.drawMarbleScene(c,b,dt,view);this.previous=previous;for(const k of Object.keys(old)){f[k]=this[k];this[k]=old[k];}
   if(b.phase==='results'){c.fillStyle='#182419aa';c.fillRect(rect.x,rect.y,rect.w,rect.h);c.fillStyle='#fff';c.font='italic 900 28px KardiaFatRunner,sans-serif';c.textAlign='center';c.fillText(b.result?.reason==='victory'?'CLEARED!':'OUT',rect.x+rect.w/2,rect.y+rect.h/2+10);}c.restore();
   // Name and points have different roles. Headers sit outside the clipped playfield.
   c.font='500 16px KardiaFit,sans-serif';c.fillStyle='#f5f1ff';c.textAlign='left';let name=p.name;const maxName=v.w-142;while(name.length>1&&c.measureText(name).width>maxName)name=name.slice(0,-2)+'…';c.fillText(name,v.x+14,v.y+24);
   c.textAlign='right';c.fillStyle='#cfff85';c.font='italic 900 20px KardiaFatRunner,sans-serif';c.fillText(Math.round(p.score).toLocaleString('en'),v.x+v.w-14,v.y+25);c.font='500 10px KardiaFit,sans-serif';c.fillStyle='#bbb0ce';c.fillText('POINTS',v.x+v.w-60,v.y+23);
   const incoming=s.attacks?.filter(a=>a.to===p.id).reduce((sum,a)=>sum+a.count,0)||0;if(incoming){c.fillStyle='#ffad9b';c.font='italic 900 16px KardiaFatRunner,sans-serif';c.textAlign='center';c.fillText('+'+incoming+' INCOMING',rect.x+rect.w/2,rect.y+rect.h-8);}
  });
 }
 // A paused snapshot is server-frozen. Finish interpolation, warm sprites and
 // outgoing/cue fades before parking only this presentation loop. Asset/font
 // completion, new snapshots and resize invalidate it; simulation/network and
 // controller input remain untouched. Authored waiting motion keeps running.
 pausedPresentationSettled(now){
  if(!this.s?.paused||this.pausePaintFrames<2||now-this.arrived<50||this.mapTransition)return false;
  if(!this.reduced&&this.turnCue&&now-this.turnCue.at<650)return false;
  // Versus snapshots pause the outer game, while legacy board-local effects
  // finish their authored fades. Keep that output live until it is stable.
  if(this.s.arenaMode==='versus'&&this.s.boards?.some((board,i)=>!board.paused&&['particles','texts','rings','beams','bursts'].some(key=>this.vfx?.[i]?.[key]?.length)))return false;
  if(this.s.mode==='pocket_siege'){
   if(!this.projectileReady||[...this.projectileArt.frames.values()].some(frame=>frame===null))return false;
   // These initial art decodes are privately owned by PocketJuice; keep their
   // fallback-to-art update live rather than freezing a loading placeholder.
   if(this.juice.parts.some(part=>part.img))return false;
  }
  return true;
 }
 // Cache the layout size, not the temporary transformed arrival/shake bounds.
 // Pointer mapping still reads the current visual rectangle in toWorld().
 frame(now){if(this.destroyed)return;if(this.holdUntil>now&&this.s?.mode==='pocket_siege'){this.raf=requestAnimationFrame(this.frame);return;}const dt=Math.min(.05,(now-this.last)/1000);this.last=now;const s=this.s;if(s){const dpr=Math.min(1.5,window.devicePixelRatio||1);if(this.sizeDirty||this.surfaceDpr!==dpr||!this.surfaceRect){this.surfaceRect={width:this.el.clientWidth,height:this.el.clientHeight};this.surfaceDpr=dpr;this.sizeDirty=false;}const rect=this.surfaceRect,width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);if(this.el.width!==width||this.el.height!==height){this.el.width=width;this.el.height=height;}const c=this.c;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,width,height);this.background(s);
   if(s.mode==='marble_bloom'){
    const uiScale=document.documentElement.classList.contains('party-host')?Math.max(1,rect.width/1280):1,w=rect.width/uiScale,h=rect.height/uiScale;c.scale(dpr*uiScale,dpr*uiScale);
    if(s.arenaMode==='versus')this.drawVersus(c,s,dt,w,h,uiScale);
    else {
     // The garden is the scene, not a card. Cover only the decorative backdrop;
     // chain circles and input mapping share one uniform authoritative-world fit.
     const cover=Math.max(w/this.bg.width,h/this.bg.height);c.drawImage(this.bg,(w-this.bg.width*cover)/2,(h-this.bg.height*cover)/2,this.bg.width*cover,this.bg.height*cover);
     const area={x:12,y:12,w:w-24,h:h-24},view=MarbleLayout.fit(s,area);this.marbleViewport={...view,scale:view.scale*uiScale,x:view.x*uiScale,y:view.y*uiScale};this.drawMarbleScene(c,s,dt,view,false);
    }
   }else {const scale=width/1280;this.viewHalf=Math.min(360,height/scale/2);c.translate((width-1280*scale)/2,(height-720*scale)/2);c.scale(scale,scale);c.save();c.beginPath();c.rect(0,0,1280,720);c.clip();c.drawImage(this.bg,0,0);const jdt=s.paused?0:dt;this.juice.step(jdt);this.starClock=(this.starClock||0)+(s.paused?0:dt*1000);if((s.sky||'classic')==='classic')this.juice.drawSky(c,this.cam,s.wind);const shake=this.siegeShake(jdt),kick=this.juice.camera(jdt);c.translate(shake.x+kick.x,shake.y+kick.y);if(kick.zoom!==1){c.translate(640,360);c.scale(kick.zoom,kick.zoom);c.translate(-640,-360);}if(kick.focus){c.translate(kick.focus.x,kick.focus.y);c.scale(kick.focus.z,kick.focus.z);c.translate(-kick.focus.x,-kick.focus.y);}c.save();this.drawTanks(c,s,dt);this.drawEffects(c,s.paused?0:dt);c.restore();this.drawPocketNotices(c,s);c.restore();}
  }this.transitionFrame(now);this.pausePaintFrames=s?.paused?this.pausePaintFrames+1:0;this.raf=s?.phase==='results'||this.pausedPresentationSettled(now)?0:requestAnimationFrame(this.frame);}
 destroy(){if(this.destroyed)return;this.destroyed=true;this.sizeObserver.disconnect();removeEventListener('resize',this.resizeFrame);document.fonts?.removeEventListener('loadingdone',this.fontsChanged);for(const image of [marbleGarden,marbleMachines])image.removeEventListener('load',this.assetChanged);cancelAnimationFrame(this.raf);this.raf=0;this.mapTransition=null;this.siegeFX.clear();this.airDefense.clear();this.juice.clear();this.s=this.previous=null;this.bg=this.pathCanvas=this.terrainCanvas=this.terrainTransition=null;this.sprites=[];this.particles=[];this.texts=[];this.rings=[];this.beams=[];this.bursts=[];this.vfx=[];this.audio.ctx?.close();}
}
