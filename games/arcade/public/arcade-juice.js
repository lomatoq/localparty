/* Arcade presentation layer (TV field life + phone press feel).
   Reads authoritative snapshots only: never changes input, scores or rules.
   Field units are the 1200x720 world used by app.js. */
(()=>{'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const en=()=>(window.PartyI18n?.language||document.documentElement.lang||'en')!=='ru';
const L=(ru,eng)=>en()?eng:ru;
const clock=()=>(window.PARTY_GAME_CLOCK?.now?.()??performance.now())/1000;
const DISPLAY='italic 900 {s}px KardiaFatRunner,HeyPalsDisplay,system-ui';
const font=s=>DISPLAY.replace('{s}',Math.round(s));
const TEAM=['#c6ff79','#b398ff'];
const scenery={};for(const [key,file]of Object.entries({sky:'flappy-sky.png',hills:'flappy-hills-far.seamless.png'})){const img=new Image();img.src='assets/'+file;scenery[key]=img;}
const rand=(a,b)=>a+Math.random()*(b-a);
// Seeded noise keeps cached textures identical across rebuilds.
const seeded=seed=>()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};

/* ---------- TV ---------- */
let canvas=null,tapLayout=null,prev=null,trauma=0,traumaAt=0,lastSim={time:-1,at:0};
const pops=[],confetti=[],puffs=[],banners=[],flashes=[],squashes=new Map(),ballTrail=[],dustAt=new Map();
function init(o){canvas=o.canvas;tapLayout=o.tapLayout||null;}
function stretch(){return canvas&&document.documentElement.matches('html.party-host[data-party-game=taprace]')?Math.max(.1,(canvas.clientWidth/canvas.clientHeight)/(1200/720)):1;}
// Smooth simulation time between 30 Hz snapshots, frozen by the shared game clock.
function simTime(s){const now=clock();if(s.time!==lastSim.time){lastSim={time:s.time,at:now};}return s.time+(s.phase==='playing'&&!(s.countdown>0)?Math.min(.05,now-lastSim.at):0);}
function addTrauma(v){if(reduced)return;trauma=Math.min(1,trauma+v);}
function shake(){if(window.PARTY_GAME_CLOCK?.paused)return {x:0,y:0};const now=clock(),dt=Math.min(.1,Math.max(0,now-traumaAt));traumaAt=now;trauma=Math.max(0,trauma-dt*1.6);if(!trauma)return {x:0,y:0};const k=trauma*trauma*9;return {x:k*Math.sin(now*47),y:k*.7*Math.sin(now*61+1)};}
function pop(x,y,text,color,size=46,life=.95){x=Math.max(170,Math.min(1030,x));y=y<90?y+150:Math.min(650,y);pops.push({x,y,text,color,size,life,at:clock()});if(pops.length>10)pops.shift();}
function burst(x,y,colors,count=26,power=1){if(reduced)return;for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),v=rand(160,420)*power;confetti.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rand(120,260)*power,spin:rand(-9,9),rot:rand(0,6),size:rand(5,10),shape:i%3,color:colors[i%colors.length],at:clock(),life:rand(.9,1.5)});}
 if(confetti.length>160)confetti.splice(0,confetti.length-160);}
function puff(x,y,color,n=4,spread=1,vx=-60){if(reduced)return;for(let i=0;i<n;i++)puffs.push({x:x+rand(-4,4),y:y+rand(-3,3),vx:vx*rand(.6,1.3)+rand(-20,20)*spread,vy:rand(-40,-10)*spread,r:rand(3,7),color,at:clock(),life:rand(.35,.6)});if(puffs.length>120)puffs.splice(0,puffs.length-120);}
function banner(title,sub,color,life=1.9){banners.length=0;banners.push({title,sub,color,at:clock(),life});}
function squash(id){const q=squashes.get(id);if(!q||reduced)return {x:1,y:1};const t=(clock()-q.at)/.32;if(t>=1){squashes.delete(id);return {x:1,y:1};}const k=Math.sin(t*Math.PI*2.2)*Math.exp(-t*3.2)*q.amount;return {x:1+k,y:1-k};}

function observe(s){
 if(!s||s===prev)return;const p0=prev;prev=s;
 if(!p0||p0.mode!==s.mode||s.phase!=='playing'||p0.phase!=='playing'){if(s.phase!=='playing'){confetti.length=0;puffs.length=0;banners.length=0;pops.length=0;}return;}
 const old=new Map(p0.players.map(p=>[p.id,p]));
 if(s.mode==='snakelines'){
  if(s.roundWait>0&&!(p0.roundWait>0)){const w=s.players.find(p=>p.score>(old.get(p.id)?.score??p.score));
   if(w){banner(L('РАУНД ','ROUND ')+s.round,L(w.name+' побеждает',w.name+' wins'),w.color);burst(w.x,w.y,[w.color,'#ffd36b','#fff6dc'],34,1.1);addTrauma(.35);}
   else banner(L('РАУНД ','ROUND ')+s.round,L('Ничья','Draw'),'#c6b1ff');}
  for(const p of s.players){const o=old.get(p.id);if(o?.alive&&!p.alive){addTrauma(.28);burst(p.x,p.y,[p.color,'#ffffff'],12,.55);}}
 }
 if(s.mode==='flappy'){for(const p of s.players){const o=old.get(p.id);if(!o)continue;
  if(o.alive&&!p.alive){addTrauma(.3);for(let i=0;i<12;i++)confetti.push({x:p.x,y:p.y,vx:rand(-180,180),vy:rand(-260,-40),spin:rand(-6,6),rot:rand(0,6),size:rand(6,10),shape:3,color:i%3?p.color:'#fff6e8',at:clock(),life:rand(.9,1.4),drag:1});}
  if(p.alive&&(p.vy||0)<(o.vy||0)-250)puff(p.x-14,p.y+6,'#ffffff',3,.6,-110);}}
 if(s.mode==='hungry'){for(const p of s.players){const o=old.get(p.id);if(!o)continue;const gain=p.mass-o.mass;
  if(gain>0)squashes.set(p.id,{at:clock(),amount:gain>8?.22:.09});
  if(gain>8){pop(p.x,p.y-Math.sqrt(p.mass)*3.6-26,L('ХРУМ!','CHOMP!'),p.color,58);burst(p.x,p.y,[p.color,'#ffd36b','#fff'],22,.8);}}}
 if(s.mode==='carryball'){for(let team=0;team<2;team++)if(s.teams[team]>p0.teams[team]){
   const scorer=s.players.find(p=>p.id===p0.ball?.owner&&p.team===team),x=team===0?1150:50;
   banner(s.teams[0]+' : '+s.teams[1],scorer?L(scorer.name+' забивает',scorer.name+' scores'):L('Гол команды','Team goal'),TEAM[team],1.7);
   burst(x,360,[TEAM[team],'#ffd36b','#ffffff'],40,1.15);addTrauma(.55);}}
 if(s.mode==='punchmeter'){const hit=s.bag?.last;if(hit&&hit.time!==p0.bag?.last?.time){const pose=window.punchBagPose?.(s.bag)||{x:600,y:70,scale:1},power=hit.power||0,tier=hit.score>=750?2:hit.score>=420?1:0;
  addTrauma([.22,.48,.85][tier]);if(tier===2&&!reduced)flashes.push({at:clock(),life:.16,color:'#fff4d6'});
  for(let i=0;i<=tier;i++)pops.push({ring:true,x:pose.x,y:pose.y+200*pose.scale,color:i?'#ffd36b':'#ffffff',at:clock()+i*.06,life:.5,size:60+power*120});
  puff(600-60,592,'#c9d6e4',4+tier*3,1.4,-90);puff(660,592,'#c9d6e4',4+tier*3,1.4,90);}}
}

// Cached arena material layered over the base environment (built once per size).
function environment(q,s){
 const r=seeded(7),matrix=q.getTransform(),extraX=matrix.e/matrix.a,extraY=matrix.f/matrix.d;
 if(s.mode==='flappy'){
  const sky=q.createLinearGradient(0,0,0,720);sky.addColorStop(0,'#17142e');sky.addColorStop(.42,'#2c2357');sky.addColorStop(.74,'#5a3a78');sky.addColorStop(1,'#9a5a86');q.fillStyle=sky;q.fillRect(-extraX,-extraY,1200+extraX*2,720+extraY*2);
  const sun=q.createRadialGradient(880,560,10,880,560,420);sun.addColorStop(0,'#ffd36b88');sun.addColorStop(.25,'#ff8fd033');sun.addColorStop(1,'#ff8fd000');q.fillStyle=sun;q.fillRect(-extraX,-extraY,1200+extraX*2,720+extraY*2);
  q.fillStyle='#ffe6b0';q.globalAlpha=.55;q.beginPath();q.arc(880,560,46,0,Math.PI*2);q.fill();q.globalAlpha=1;
  for(let i=0;i<70;i++){q.fillStyle=`rgba(236,228,255,${(.15+r()*.45).toFixed(2)})`;const x=r()*1200,y=r()*330,z=r()<.12?1.8:1;q.fillRect(x,y,z,z);}
 }
 if(s.mode==='hungry'){
  for(let y=24+Math.floor(-extraY/64)*64;y<720+extraY;y+=64)for(let x=24+((y/64)%2)*32+Math.floor(-extraX/64)*64;x<1200+extraX;x+=64){q.fillStyle=`rgba(200,255,220,${(.012+r()*.03).toFixed(3)})`;q.beginPath();q.roundRect(x-26,y-26,52,52,14);q.fill();}
  const spot=q.createRadialGradient(600,330,60,600,360,760);spot.addColorStop(0,'#d8ffe414');spot.addColorStop(.6,'#00000000');spot.addColorStop(1,'#06101a88');q.fillStyle=spot;q.fillRect(-extraX,-extraY,1200+extraX*2,720+extraY*2);
  
 }
 if(s.mode==='carryball'){
  for(let x=20,i=0;x<1180;x+=116,i++){const lane=q.createLinearGradient(x,0,x+116,0);lane.addColorStop(0,i%2?'#0000000f':'#ffffff0a');lane.addColorStop(.5,i%2?'#00000018':'#ffffff12');lane.addColorStop(1,i%2?'#0000000f':'#ffffff0a');q.fillStyle=lane;q.fillRect(x,20,116,680);}
  const centre=q.createRadialGradient(600,360,20,600,360,420);centre.addColorStop(0,'#e9ffd81a');centre.addColorStop(1,'#e9ffd800');q.fillStyle=centre;q.fillRect(-extraX,-extraY,1200+extraX*2,720+extraY*2);
  for(let i=0;i<5200;i++){const x=20+r()*1160,y=20+r()*680;q.strokeStyle=r()<.5?'#d9ffd00c':'#04140d14';q.lineWidth=1;q.beginPath();q.moveTo(x,y);q.lineTo(x+r()*2-1,y-2-r()*3);q.stroke();}
  for(const [x,y] of [[0,0],[1200,0],[0,720],[1200,720]]){const l=q.createRadialGradient(x,y,0,x,y,520);l.addColorStop(0,'#fff6d81a');l.addColorStop(1,'#fff6d800');q.fillStyle=l;q.fillRect(-extraX,-extraY,1200+extraX*2,720+extraY*2);}
  const v=q.createRadialGradient(600,360,300,600,360,760);v.addColorStop(0,'#00000000');v.addColorStop(1,'#020c0870');q.fillStyle=v;q.fillRect(-extraX,-extraY,1200+extraX*2,720+extraY*2);
 }
 if(s.mode==='punchmeter'){
  const cone=q.createLinearGradient(0,40,0,620);cone.addColorStop(0,'#fff3d022');cone.addColorStop(1,'#fff3d006');q.fillStyle=cone;q.beginPath();q.moveTo(560,40);q.lineTo(640,40);q.lineTo(860,610);q.lineTo(340,610);q.closePath();q.fill();
  const pool=q.createRadialGradient(600,596,10,600,596,300);pool.addColorStop(0,'#fff0c62a');pool.addColorStop(1,'#fff0c600');q.fillStyle=pool;q.save();q.translate(600,596);q.scale(1,.18);q.translate(-600,-596);q.fillRect(300,300,600,600);q.restore();
 }
}

function ambient(g,s){
 const t=clock(),st=simTime(s);
 if(s.mode==='flappy'){
  if(!reduced)for(let i=0;i<8;i++){const x=(i*157+40)%1200,y=(i*71+30)%300,a=.25+.25*Math.sin(t*1.7+i*2.1);g.fillStyle=`rgba(255,246,220,${a.toFixed(3)})`;g.beginPath();g.arc(x,y,1.6,0,Math.PI*2);g.fill();}
  const scroll=reduced?0:st;
  const skyArt=scenery.sky;if(skyArt.complete&&skyArt.naturalWidth){g.save();g.setTransform(1,0,0,1,0,0);const ratio=Math.max(canvas.width/skyArt.naturalWidth,canvas.height/skyArt.naturalHeight),w=skyArt.naturalWidth*ratio,h=skyArt.naturalHeight*ratio;g.drawImage(skyArt,(canvas.width-w)/2,(canvas.height-h)/2,w,h);g.fillStyle='#17142e3d';g.fillRect(0,0,canvas.width,canvas.height);g.restore();}
  const hills=(speed,base,amp,w,color)=>{g.fillStyle=color;g.beginPath();g.moveTo(0,720);const off=((scroll*speed)%w+w)%w;for(let x=-off-w;x<1200+w;x+=w){g.quadraticCurveTo(x+w*.5,base-amp,x+w,base);}g.lineTo(1200,720);g.closePath();g.fill();};
  const hillsArt=scenery.hills;if(hillsArt.complete&&hillsArt.naturalWidth){const transform=g.getTransform(),extra=Math.max(0,transform.e/transform.a),h=260,w=h*hillsArt.naturalWidth/hillsArt.naturalHeight,off=((scroll*32)%w+w)%w;for(let x=-off-w;x<1200+extra;x+=w)g.drawImage(hillsArt,x,720-h,w,h);}else{hills(14,600,90,300,'#3f2e6a');hills(42,650,70,210,'#2b2150');}
  g.fillStyle='#1b163633';g.fillRect(0,710,1200,10);
  
  for(const p of s.players)if(p.alive){g.fillStyle='#0a061833';g.beginPath();g.ellipse(p.x,698,10+Math.max(0,(p.y-200)/40),3,0,0,Math.PI*2);g.fill();}
 }
 if(s.mode==='hungry'){
  if(!reduced){g.fillStyle='#d8fff0';for(let i=0;i<22;i++){const y=720-((t*(8+i%5*3)+i*97)%760),x=(i*211+Math.sin(t*.6+i)*18)%1200;g.globalAlpha=.06+.05*Math.sin(t+i);g.beginPath();g.arc(x,y,2+i%3,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
  for(const p of s.players){if(p.dead>0)continue;const r=Math.sqrt(p.mass)*3.6;g.fillStyle='#03101a40';g.beginPath();g.ellipse(p.x+r*.18,p.y+r*.78,r*.95,r*.32,0,0,Math.PI*2);g.fill();}
 }
 if(s.mode==='snakelines'&&!reduced){const x=((t*90)%1500)-150,sweep=g.createLinearGradient(x-120,0,x+120,0);sweep.addColorStop(0,'#7ee7ff00');sweep.addColorStop(.5,'#7ee7ff0d');sweep.addColorStop(1,'#7ee7ff00');g.fillStyle=sweep;g.fillRect(10,10,1180,700);}
 if(s.mode==='taprace'&&tapLayout){
  const lead=[...s.players].sort((a,b)=>(b.progress||0)-(a.progress||0))[0];
  s.players.forEach((p,i)=>{const l=tapLayout(p,i,s.players.length),grad=g.createLinearGradient(160,0,l.x,0);grad.addColorStop(0,p.color+'00');grad.addColorStop(1,p.color+(p===lead?'40':'26'));g.fillStyle=grad;g.fillRect(160,l.laneTop+3,Math.max(0,l.x-160),l.h-6);});
  const k=Math.min(1,(lead?.progress||0)/2000);if(k>.7){const l0=tapLayout(lead,0,s.players.length),pulse=reduced?.5:.5+.5*Math.sin(t*8);g.save();g.globalAlpha=(k-.7)/.3*(.35+.4*pulse);g.shadowColor='#c8ff73';g.shadowBlur=26;g.fillStyle='#c8ff73';g.fillRect(1116,l0.top,4,s.players.length*l0.h);g.restore();}
  if(!reduced)s.players.forEach((p,i)=>{const fast=Math.max(0,Math.min(1,((p.vx||0)-60)/140));if(fast<=0)return;const l=tapLayout(p,i,s.players.length),last=dustAt.get(p.id)||0;if(t-last>.09-fast*.05){dustAt.set(p.id,t);puff(l.x-l.size*.12,l.y+l.size*.42,p.color,1+Math.round(fast*2),.5,-80-fast*120);}});
 }
 if(s.mode==='punchmeter'&&!reduced){g.fillStyle='#fff3d0';for(let i=0;i<18;i++){const k=(t*.05+i*.137)%1,y=60+k*540,spread=40+k*220,x=600+Math.sin(i*12.9+t*.4)*spread;g.globalAlpha=.08+.1*Math.sin(t*1.3+i);g.beginPath();g.arc(x,y,1.4+i%3*.6,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
 if(s.mode==='carryball'){
  for(const p of s.players){g.strokeStyle=TEAM[p.team]||'#fff';g.globalAlpha=.55;g.lineWidth=3;g.beginPath();g.ellipse(p.x,p.y+26,17,6,0,0,Math.PI*2);g.stroke();}g.globalAlpha=1;
  const b=s.ball;if(b){const owner=s.players.find(p=>p.id===b.owner);
   if(owner&&!reduced){const pulse=.5+.5*Math.sin(t*6);g.strokeStyle=TEAM[owner.team];g.globalAlpha=.35+.35*pulse;g.lineWidth=2;g.beginPath();g.ellipse(owner.x,owner.y+26,24+pulse*4,9+pulse*1.5,0,0,Math.PI*2);g.stroke();g.globalAlpha=1;}
   const speed=Math.hypot(b.vx||0,b.vy||0);if(!owner&&speed>160&&!reduced){ballTrail.push({x:b.x,y:b.y,at:t});}
   while(ballTrail.length&&(t-ballTrail[0].at>.28||ballTrail.length>18))ballTrail.shift();
   for(const q of ballTrail){const k=1-(t-q.at)/.28;g.fillStyle='#fff6d8';g.globalAlpha=k*.28;g.beginPath();g.arc(q.x,q.y,10*k,0,Math.PI*2);g.fill();}g.globalAlpha=1;}
 }
}

function drawStar(g,size,points=5){g.beginPath();for(let i=0;i<points*2;i++){const a=i*Math.PI/points-Math.PI/2,r=i%2?size*.45:size;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r);}g.closePath();g.fill();}
function front(g,s){
 const t=clock(),sx=stretch();
 if(s.mode==='snakelines'&&s.phase==='playing'&&!reduced)for(const p of s.players){if(!p.alive)continue;const halo=g.createRadialGradient(p.x,p.y,0,p.x,p.y,26);halo.addColorStop(0,p.color+'66');halo.addColorStop(1,p.color+'00');g.fillStyle=halo;g.globalAlpha=.7+.3*Math.sin(t*9+p.x*.01);g.beginPath();g.arc(p.x,p.y,26,0,Math.PI*2);g.fill();g.globalAlpha=1;}
 if(s.mode==='taprace'&&tapLayout&&s.phase==='playing'){const lead=[...s.players].sort((a,b)=>(b.progress||0)-(a.progress||0))[0];if(lead&&(lead.progress||0)>40){const l=tapLayout(lead,s.players.indexOf(lead),s.players.length),bob=reduced?0:Math.sin(t*5)*2;g.save();g.translate(l.x,l.y-l.size*.66+bob);g.scale(1.7/sx,1.7);
  g.fillStyle='#ffd36b';g.shadowColor='#ffd36b';g.shadowBlur=12;g.beginPath();g.moveTo(-13,6);g.lineTo(-15,-8);g.lineTo(-6,-1);g.lineTo(0,-12);g.lineTo(6,-1);g.lineTo(15,-8);g.lineTo(13,6);g.closePath();g.fill();g.shadowBlur=0;g.fillStyle='#fff3c4';g.fillRect(-12,4,24,3);g.restore();}}
 // particles
 for(let i=puffs.length-1;i>=0;i--){const p=puffs[i],k=(t-p.at)/p.life;if(k>=1||k<0){if(k>=1)puffs.splice(i,1);continue;}const dt=t-p.at;g.fillStyle=p.color;g.globalAlpha=(1-k)*.3;g.beginPath();g.arc(p.x+p.vx*dt,p.y+p.vy*dt,p.r*(.7+k*1.2),0,Math.PI*2);g.fill();}
 g.globalAlpha=1;
 for(let i=confetti.length-1;i>=0;i--){const c=confetti[i],dt=t-c.at,k=dt/c.life;if(k>=1){confetti.splice(i,1);continue;}if(dt<0)continue;
  const drag=c.drag?2.4:1.1,f=(1-Math.exp(-drag*dt))/drag,x=c.x+c.vx*f,y=c.y+c.vy*f+(c.drag?160:420)*dt*dt;
  g.save();g.translate(x,y);g.rotate(c.rot+c.spin*dt);g.globalAlpha=Math.min(1,(1-k)*1.6);g.fillStyle=c.color;
  if(c.shape===0)drawStar(g,c.size);else if(c.shape===1){g.rotate(Math.PI/4);g.fillRect(-c.size*.5,-c.size*.5,c.size,c.size);}else if(c.shape===2){g.beginPath();g.arc(0,0,c.size*.45,0,Math.PI*2);g.fill();}else{g.beginPath();g.ellipse(0,0,c.size*.35,c.size,0,0,Math.PI*2);g.fill();}
  g.restore();}
 // impact rings and score pops
 for(let i=pops.length-1;i>=0;i--){const p=pops[i],dt=t-p.at,k=dt/p.life;if(k>=1){pops.splice(i,1);continue;}if(dt<0)continue;
  if(p.ring){const e=1-Math.pow(1-k,3);g.save();g.strokeStyle=p.color;g.globalAlpha=(1-k)*.8;g.lineWidth=6*(1-k)+1;g.beginPath();g.ellipse(p.x,p.y,p.size*e/sx,p.size*e*.62,0,0,Math.PI*2);g.stroke();g.restore();continue;}
  const sc=reduced?1:k<.18?.7+.5*(k/.18):k<.3?1.2-.2*((k-.18)/.12):1,y=p.y-(reduced?0:k*40);
  g.save();g.translate(p.x,y);g.scale(sc/sx,sc);g.globalAlpha=k>.7?(1-k)/.3:1;g.font=font(p.size);g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=p.size*.16;g.strokeStyle='#171223';g.strokeText(p.text,0,0);g.fillStyle=p.color;g.fillText(p.text,0,0);g.restore();}
 // round / goal banner
 for(let i=banners.length-1;i>=0;i--){const b=banners[i],dt=t-b.at,k=dt/b.life;if(k>=1){banners.splice(i,1);continue;}
  const enter=reduced?1:Math.min(1,dt/.28),e=1-Math.pow(1-enter,4),out=k>.82?(1-k)/.18:1;
  g.save();g.globalAlpha=out;g.translate(600,150);g.scale(1/sx,1);
  const w=560,h=160;g.fillStyle='#151321e6';g.strokeStyle=b.color+'88';g.lineWidth=3;g.save();g.scale(.92+.08*e,.92+.08*e);g.beginPath();g.roundRect(-w/2,-h/2,w,h,36);g.fill();g.stroke();
  const glow=g.createRadialGradient(0,-10,10,0,0,w*.6);glow.addColorStop(0,b.color+'30');glow.addColorStop(1,b.color+'00');g.fillStyle=glow;g.fill();g.restore();
  g.textAlign='center';g.textBaseline='middle';g.translate(0,(1-e)*24);g.font=font(78);g.lineJoin='round';g.lineWidth=10;g.strokeStyle='#171223';g.strokeText(b.title,0,-22);g.fillStyle=b.color;g.fillText(b.title,0,-22);
  g.font='600 34px KardiaFit,HeyPalsText,system-ui';g.fillStyle='#f7f1ff';let sub=b.sub;if(g.measureText(sub).width>w-60){const a=Array.from(sub);while(a.length&&g.measureText(a.join('')+'…').width>w-60)a.pop();sub=a.join('')+'…';}g.fillText(sub,0,46);
  g.restore();}
 for(let i=flashes.length-1;i>=0;i--){const f=flashes[i],k=(t-f.at)/f.life;if(k>=1){flashes.splice(i,1);continue;}g.fillStyle=f.color;g.globalAlpha=(1-k)*.22;g.fillRect(0,0,1200,720);g.globalAlpha=1;}
}

function countdown(g,s){
 const n=Math.ceil(s.countdown),frac=s.countdown-Math.floor(s.countdown),k=1-frac,t=clock();
 g.save();g.translate(600,350);
 g.strokeStyle='#ffffff1f';g.lineWidth=10;g.beginPath();g.arc(0,0,118,0,Math.PI*2);g.stroke();
 g.strokeStyle='#c8ff73';g.lineCap='round';g.beginPath();g.arc(0,0,118,-Math.PI/2,-Math.PI/2+Math.PI*2*frac);g.stroke();
 const sc=reduced?1:k<.2?1.35-.35*(k/.2):1;g.save();g.scale(sc,sc);g.font=font(150);g.textAlign='center';g.textBaseline='middle';g.fillStyle='#ffffff';g.fillText(String(n),0,8);g.restore();
 g.font='600 30px KardiaFit,HeyPalsText,system-ui';g.textAlign='center';g.fillStyle='#e9e1ff';g.fillText(L('Готовьтесь взлетать','Get ready to flap'),0,175);void t;g.restore();
}

/* ---------- Phone ---------- */
const tapTimes=[];let lastTeamScore=null,lastWins=null,statsKey='';
function haptic(type,intensity){const feel=window.LocalPartyFeel;if(feel?.emit){try{feel.emit(type,{intensity,visual:false});return;}catch{}}try{navigator.vibrate?.(Math.round(6+intensity*14));}catch{}}
function press(e,button,mode){
 button.classList.remove('arc-pressed');void button.offsetWidth;button.classList.add('arc-pressed');
 clearTimeout(button._arcRelease);button._arcRelease=setTimeout(()=>button.classList.remove('arc-pressed'),mode==='punchmeter'?10000:110);
 if(!reduced){const r=button.getBoundingClientRect(),ripple=document.createElement('i');ripple.className='arc-ripple';ripple.setAttribute('aria-hidden','true');const size=Math.max(r.width,r.height)*1.25;
  ripple.style.cssText=`--x:${e.clientX-r.left}px;--y:${e.clientY-r.top}px;--s:${size}px`;button.append(ripple);setTimeout(()=>ripple.remove(),460);while(button.querySelectorAll('.arc-ripple').length>5)button.querySelector('.arc-ripple').remove();}
 if(mode==='taprace'||mode==='flappy'){const now=performance.now();tapTimes.push(now);while(tapTimes.length&&now-tapTimes[0]>1000)tapTimes.shift();haptic('shot',mode==='flappy'?.22:.12);}
 else if(mode==='carryball')haptic('shot',.45);
}
function release(button,power){clearTimeout(button._arcRelease);button.classList.remove('arc-pressed');if(power!=null)haptic('hit',.25+power*.75);}
function stat(label,value,cls=''){return {label,value:String(value),cls};}
function parentOwnsStat(s,field){
 if(window.parent===window||!document.documentElement.matches('.party-managed.party-player'))return false;
 try{
  const parent=window.parent,ui=parent.PARTY_UI,hud=parent.document.getElementById('hudTimer');
  if(parent.PARTY_GAME?.id!==s.mode||!hud||hud.hidden||!hud.getClientRects().length)return false;
  const visible=id=>{const el=parent.document.getElementById(id);return el&&!el.hidden&&el.getClientRects().length?el.textContent.trim():'';};
  if(field==='round'){const progress=visible('hudProgress')||visible('hudValue'),match=progress.match(/(\d+)\s*\/\s*5/);return !!match&&Number(match[1])===Math.min(5,s.round);}
  if(!Number.isFinite(ui?.endsAt)||!['playing','reveal'].includes(ui.phase))return false;
  const value=visible('hudValue');if(!/^\d+(?::\d{2})?$/.test(value))return false;
  const parts=value.split(':').map(Number),seconds=parts.length===2?parts[0]*60+parts[1]:parts[0];
  return Math.abs(seconds-Math.ceil(Math.max(0,s.timer)))<=1;
 }catch{return false;}
}
function phone(s,p,selfId){
 const root=document.querySelector('.controller');if(!root)return;
 let box=document.getElementById('arcadeStats');
 const mode=s.mode;if(mode==='punchmeter'||!p){if(box)box.hidden=true;return;}
 if(!box){box=document.createElement('div');box.id='arcadeStats';box.className='hp-stat-group arcade-stats';box.setAttribute('role','group');document.getElementById('status')?.after(box);}
 box.hidden=false;
 const place=1+s.players.filter(q=>q.score>p.score).length,n=s.players.length;
 const speed=tapTimes.filter(x=>performance.now()-x<1000).length;
 let stats;
 if(mode==='taprace')stats=[stat(L('Место','Place'),place+'/'+n),stat(L('Очки','Points'),p.score),stat(L('Скорость','Speed'),speed+'/s')];
 else if(mode==='flappy')stats=[stat(L('Место','Place'),place+'/'+n),stat(L('Очки','Points'),p.score),stat(L('Статус','Status'),s.phase==='finished'?L('Финиш','Done'):s.countdown>0?L('Готов','Ready'):p.alive?L('Летит','Flying'):L('Выбыл','Out'),p.alive?'':'is-out')];
 else if(mode==='hungry')stats=[stat(L('Место','Place'),place+'/'+n),stat(L('Очки','Points'),p.score),stat(L('Время','Time'),Math.max(0,s.timer)+'s')];
 else if(mode==='snakelines')stats=[stat(L('Раунд','Round'),Math.min(5,s.round)+'/5'),stat(L('Победы','Wins'),p.score),stat(L('Статус','Status'),s.phase==='finished'?L('Финиш','Done'):s.countdown>0?L('Готов','Ready'):p.alive?L('В игре','Alive'):L('Выбыл','Out'),p.alive?'':'is-out')];
 else if(mode==='carryball'){const team=p.team||0,teams=s.teams||[0,0];stats=[stat(L('Счёт','Score'),teams[team]+' : '+teams[1-team]),stat(L('Время','Time'),Math.max(0,s.timer)+'s')];}
 if(['hungry','carryball'].includes(mode)&&parentOwnsStat(s,'time'))stats=stats.filter(x=>x.label!==L('Время','Time'));
 if(mode==='snakelines'&&parentOwnsStat(s,'round'))stats=stats.filter(x=>x.label!==L('Раунд','Round'));
 if(!stats){box.hidden=true;return;}
 box.style.setProperty('--arc-cols',String(stats.length));
 const key=stats.map(x=>x.label+'='+x.value+x.cls).join('|');
 if(box.children.length!==stats.length){box.replaceChildren(...stats.map(()=>{const d=document.createElement('div'),sm=document.createElement('small'),st=document.createElement('strong');d.className='hp-stat';sm.className='hp-stat-label';st.className='hp-number';d.append(sm,st);return d;}));}
 if(key!==statsKey){statsKey=key;stats.forEach((x,i)=>{const d=box.children[i],[sm,st]=d.children;if(sm.textContent!==x.label)sm.textContent=x.label;if(st.textContent!==x.value)st.textContent=x.value;d.className='hp-stat'+(x.cls?' '+x.cls:'');});}
 // Team identity and celebratory moments for this player's own wins.
 if(mode==='carryball'){let chip=document.getElementById('arcadeTeam');if(!chip){chip=document.createElement('p');chip.id='arcadeTeam';chip.className='arcade-team';box.before(chip);}const team=p.team||0;chip.dataset.team=String(team);const label=team?L('Фиолетовые','Violet team'):L('Лаймовые','Lime team');if(chip.textContent!==label)chip.textContent=label;
  const mine=(s.teams||[0,0])[team];if(lastTeamScore!=null&&mine>lastTeamScore&&s.phase==='playing'){celebrate(box,TEAM[team]);}lastTeamScore=mine;}
 if(mode==='snakelines'){if(lastWins!=null&&p.score>lastWins)celebrate(box,p.color);lastWins=p.score;}
 if(mode==='taprace'){let track=document.getElementById('arcadeTrack');if(!track){track=document.createElement('div');track.id='arcadeTrack';track.className='arcade-track';track.setAttribute('aria-hidden','true');track.innerHTML='<i class="arcade-track-flag"></i>';box.after(track);}
  const seen=new Set();for(const q of s.players){seen.add(q.id);let dot=track.querySelector(`[data-pid="${CSS.escape(q.id)}"]`);if(!dot){dot=document.createElement('b');dot.dataset.pid=q.id;track.append(dot);}dot.classList.toggle('is-me',q.id===selfId);dot.style.setProperty('--c',q.color);dot.style.setProperty('--k',String(Math.max(0,Math.min(1,q.score/2000))));}
  for(const d of track.querySelectorAll('[data-pid]'))if(!seen.has(d.dataset.pid))d.remove();}
}
function celebrate(anchor,color){haptic('score',.7);const r=anchor.getBoundingClientRect();if(window.HeyPalsSprites?.burst&&!reduced)try{window.HeyPalsSprites.burst(r.left+r.width/2,r.top+r.height/2,{count:14,spread:90});}catch{}anchor.classList.remove('arc-win');void anchor.offsetWidth;anchor.classList.add('arc-win');anchor.style.setProperty('--arc-win',color);setTimeout(()=>anchor.classList.remove('arc-win'),700);}

function cue(mode){return {flappy:L('Лети между трубами','Fly through the gaps'),hungry:L('Ешь и расти','Eat and grow'),snakelines:L('Уходи от следов','Dodge every trail'),carryball:L('Забивай за команду','Score for your team')}[mode]||'';}
window.ArcadeJuice=Object.freeze({init,cue,observe,shake,squash,environment,ambient,front,countdown,press,release,phone,revision:'arcade-juice-20261002.1'});
})();
