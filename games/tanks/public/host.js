const socket = createSocketBus();
socket.on('connect',()=>{socket.emit('registerHost');tankBoundsSignature='';tankBoundsSentAt=0;});

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const lobbyOverlay = document.getElementById('lobbyOverlay');
const resultOverlay = document.getElementById('resultOverlay');
const resultText = document.getElementById('resultText');
const resultStats = document.getElementById('resultStats');
const modeHud = document.getElementById('modeHud');
const playerList = document.getElementById('playerList');
const playerCount = document.getElementById('playerCount');
const qr = document.getElementById('qr');
const miniQr = document.getElementById('miniQr');
const joinUrl = document.getElementById('joinUrl');
const joinBadge = document.getElementById('joinBadge');
const ipChoices = document.getElementById('ipChoices');
let lastState = null;
let lastMode = 'survival';
let info = null;
let lobbyPlayersKey=null,resultStatsKey=null;

function drawQR(el,url,size){
  try{renderQr(el,url,size)}catch(err){
    console.warn(err);
    el.innerHTML='<div style="padding:14px;text-align:center;color:#111;font:800 11px system-ui">QR error<br>введи адрес ниже</div>';
  }
}
function useJoinUrl(url){
  joinUrl.textContent=url;
  drawQR(qr,url,214);
  drawQR(miniQr,url,74);
  for(const b of ipChoices.querySelectorAll('button')) b.classList.toggle('active',b.dataset.url===url);
}
fetch('/api/info').then(r=>r.json()).then(data=>{
  info=data;
  const candidates=(data.candidates&&data.candidates.length?data.candidates:[{address:data.lanIp,url:data.controllerUrl}]);
  ipChoices.innerHTML=candidates.map((c,i)=>`<button data-url="${c.url}" class="${i===0?'active':''}">${c.address}</button>`).join('');
  ipChoices.addEventListener('click',e=>{const b=e.target.closest('button[data-url]');if(b)useJoinUrl(b.dataset.url)});
  useJoinUrl(data.controllerUrl);
}).catch(()=>{joinUrl.textContent='Открой на телефоне IP этого компьютера :3000';});

socket.on('lobby', renderLobbyPlayers);
// TV presentation layer only: reads each authoritative snapshot.
const tankFX=window.HeyPalsTankFX?.create({width:1280,height:720,bannerY:62,inset:30});
const tankRig=window.LocalTankRig?.create();window.LocalTankRigRuntime=tankRig;
function tankFXSnapshot(s){const g=s.game||{};return {round:(g.mode||'')+':'+(g.round||0)+':'+(g.status==='lobby'?'lobby':'match'),playing:!!g.mode&&g.status!=='lobby',bullets:s.bullets||[],
  tanks:[...(s.players||[]).map(p=>({id:'p'+p.id,x:p.x,y:p.y,radius:p.radius,hp:p.hp,alive:p.alive,kills:p.kills,name:p.name,color:p.color})),...(s.bots||[]).map(b=>({id:'b'+b.id,x:b.x,y:b.y,radius:b.radius,hp:b.hp,alive:b.alive,kills:0,name:b.type==='boss'?'BOSS':'GUARD',color:b.color}))]};}
socket.on('state', state => {
  lastState = state;
  tankRig?.observe(state);
  tankFX?.observe(tankFXSnapshot(state));
  renderLobbyPlayers(state.players || []);
  updateUI(state);
});

function renderLobbyPlayers(players=[]){
  const key=JSON.stringify(players.map(p=>[p.id,p.name,p.color,p.handedness,p.team]));
  if(key===lobbyPlayersKey)return;
  lobbyPlayersKey=key;
  playerCount.textContent = players.length;
  if(!players.length){
    playerList.innerHTML = '<div class="tiny-note">Пока никого. Первый телефон появится здесь сразу после ввода имени.</div>';
    return;
  }
  playerList.innerHTML = players.map(p=>{
    const team = p.team === 'red' ? 'RED' : p.team === 'blue' ? 'BLUE' : 'CO-OP';
    const teamColor = p.team === 'red' ? '#ff5b67' : p.team === 'blue' ? '#4e9cff' : '#d7ff42';
    return `<div class="player"><span class="swatch" style="background:${p.color}"></span><span class="pname">${escapeHtml(p.name)}</span>${p.handedness==='left'?'<span class="lefty">LEFTY</span>':''}<span class="team-pill" style="color:${teamColor}">${team}</span></div>`;
  }).join('');
}

function updateUI(s){
  const g=s.game;
  if(g.status!=='finished')resultStatsKey=null;
  if(g.status==='lobby' || !g.mode){
    lobbyOverlay.classList.remove('hidden');
    resultOverlay.classList.add('hidden');
    joinBadge.classList.add('hidden');
    modeHud.textContent='LOBBY';
    return;
  }
  lobbyOverlay.classList.add('hidden');
  joinBadge.classList.remove('hidden');
  if(g.mode==='survival') modeHud.textContent=`10 РАУНДОВ · ${Math.min(g.round,10)}/10`;
  if(g.mode==='ctf') modeHud.textContent=`ФЛАГ · RED ${g.redScore}:${g.blueScore} BLUE · ${formatTime(g.timer)}`;
  if(g.mode==='coop') modeHud.textContent=`ОГРАБЬ БОССА · ${formatTime(g.timer)}${g.coreUnlocked?' · ЯДРО ДОСТУПНО':''}`;
  if(g.status==='between') modeHud.textContent=`${g.winnerText} · следующий раунд…`;
  if(g.status==='finished'){
    resultOverlay.classList.remove('hidden');
    resultText.textContent=g.winnerText || 'Матч окончен';
    const sorted=[...s.players].sort((a,b)=>b.score-a.score);
    const key=JSON.stringify([g.mode,...sorted.map(p=>[p.id,p.name,p.color,p.score,p.roundWins,p.captures,p.kills])]);
    if(key!==resultStatsKey){resultStatsKey=key;resultStats.innerHTML = sorted.map((p,i)=>
      `<div class="stat-row"><b>${i+1}</b><span><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:8px"></i>${escapeHtml(p.name)}</span><span>${g.mode==='survival'?`${p.roundWins} wins`:g.mode==='ctf'?`${p.captures} flags`:`${p.kills} kills`}</span><b>${p.score}</b></div>`
    ).join('');}
  } else resultOverlay.classList.add('hidden');
}

for(const btn of document.querySelectorAll('.mode-card')){
  btn.addEventListener('click',()=>{
    lastMode=btn.dataset.mode;
    socket.emit('startGame',lastMode);
  });
}
document.getElementById('rematchBtn').onclick=()=>socket.emit('startGame',lastMode);
document.getElementById('backBtn').onclick=()=>socket.emit('backToLobby');
document.getElementById('lobbyBtn').onclick=()=>socket.emit('backToLobby');
document.getElementById('fullscreenBtn').onclick=()=>document.documentElement.requestFullscreen?.();

function escapeHtml(s){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function formatTime(v){v=Math.max(0,Math.ceil(v||0));return `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`;}

function roundedRect(x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.roundRect(x,y,w,h,rr);
}
let tankCamera={x:0,y:0,width:1280,height:720,scale:1};
let tankBoundsSequence=0,tankBoundsSignature='',tankBoundsSentAt=0;
function publishTankBounds(){
 const box=canvas.getBoundingClientRect(),scale=tankCamera.scale;
 if(!box.width||!scale)return;
 const left=box.left-tankCamera.x*scale,top=box.top-tankCamera.y*scale;
 const exclusions=(window.PARTY_HUD_EXCLUSIONS||[]).map(r=>({x:(r.left-left)/scale,y:(r.top-top)/scale,w:r.width/scale,h:r.height/scale}));
 const geometry={width:1280,height:720,exclusions},signature=JSON.stringify(geometry),now=performance.now();
 window.LocalTankHUDRects=exclusions;window.LocalTankBoundsProof={...geometry,projection:{left,top,scale}};
 if(signature!==tankBoundsSignature||now-tankBoundsSentAt>1000){tankBoundsSignature=signature;tankBoundsSentAt=now;socket.emit('responsiveHudInsets',{...geometry,sequence:++tankBoundsSequence});}
}
function beginTankFrame(){
  // Match the receiver, then fit the whole authoritative world uniformly inside it.
  canvas.style.setProperty('object-fit','fill','important');
  const box=canvas.getBoundingClientRect(),width=Math.max(1,box.width),height=Math.max(1,box.height),dpr=Math.min(2,devicePixelRatio||1,Math.sqrt(5000000/(width*height)));
  const pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr);
  if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}
  const fit=Math.min(width/1280,height/720),viewWidth=width/fit,viewHeight=height/fit;
  tankCamera={x:(1280-viewWidth)/2,y:(720-viewHeight)/2,width:viewWidth,height:viewHeight,scale:fit};
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.setTransform(fit*dpr,0,0,fit*dpr,-tankCamera.x*fit*dpr,-tankCamera.y*fit*dpr);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  window.LocalTankCamera={...tankCamera,viewportWidth:width,viewportHeight:height,worldWidth:1280,worldHeight:720};
  publishTankBounds();
}
function extendArenaEdges(image){
  const {x,y,width,height}=tankCamera,sx=image.width/1280,sy=image.height/720;
  // Surplus receiver space is wall/terrain, never additional playable coordinates.
  if(x<0){ctx.drawImage(image,0,0,24*sx,image.height,x,0,-x,720);ctx.drawImage(image,image.width-24*sx,0,24*sx,image.height,1280,0,width+x-1280,720);}
  if(y<0){ctx.drawImage(image,0,0,image.width,24*sy,0,y,1280,-y);ctx.drawImage(image,0,image.height-24*sy,image.width,24*sy,0,720,1280,height+y-720);}
}
let terrainCache;
function drawGrid(){
 if(!terrainCache){terrainCache=document.createElement('canvas');terrainCache.width=1280;terrainCache.height=720;const t=terrainCache.getContext('2d');const g=t.createLinearGradient(0,0,1280,720);g.addColorStop(0,'#273831');g.addColorStop(.5,'#192927');g.addColorStop(1,'#17252e');t.fillStyle=g;t.fillRect(0,0,1280,720);
 for(let i=0;i<460;i++){const x=(i*197)%1280,y=(i*113)%720;t.fillStyle=i%3?'#bed0b008':'#030e1715';t.fillRect(x,y,2+i%9,1+i%3);}
 t.strokeStyle='#bcc8b009';t.lineWidth=1;for(let x=0;x<1280;x+=80){t.beginPath();t.moveTo(x,0);t.lineTo(x,720);t.stroke();}for(let y=0;y<720;y+=80){t.beginPath();t.moveTo(0,y);t.lineTo(1280,y);t.stroke();}
 const v=t.createRadialGradient(640,360,80,640,360,750);v.addColorStop(0,'#00000000');v.addColorStop(1,'#02081399');t.fillStyle=v;t.fillRect(0,0,1280,720);}
 extendArenaEdges(terrainCache);ctx.drawImage(terrainCache,0,0);
}
function drawCombatEffects(effects){for(const e of effects||[]){const t=1-e.t/e.max;ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=(1-t)*(1-t);ctx.strokeStyle=e.color;ctx.lineWidth=3*(1-t)+1;ctx.beginPath();ctx.arc(0,0,4+36*(1-(1-t)**3),0,Math.PI*2);ctx.stroke();for(let i=0;i<9;i++){const a=i*2.399,r=8+55*t;ctx.strokeStyle=i%2?'#fff3c7':e.color;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+12*(1-t)),Math.sin(a)*(r+12*(1-t)));ctx.stroke();}ctx.restore();}}
let wallCache, wallCacheKey='';
function tankBoundaryRecess(rect,clearance=8){
  if(!rect||![rect.x,rect.y,rect.w,rect.h].every(Number.isFinite)||rect.w<=0||rect.h<=0||rect.y>24)return null;
  return {left:rect.x-clearance,right:rect.x+rect.w+clearance,bottom:rect.y+rect.h+clearance,radius:22+clearance,clearance};
}
function traceTankBoundary(c,box,recess){
  const {x,y,w,h,r}=box,right=x+w,bottom=y+h;
  c.moveTo(x+r,y);
  if(recess&&recess.left>x+r+12&&recess.right<right-r-12&&recess.bottom>y+24){
    const mouth=12,curve=Math.min(recess.radius,(recess.right-recess.left)/2,recess.bottom-y-mouth);
    c.lineTo(recess.left-mouth,y);c.quadraticCurveTo(recess.left,y,recess.left,y+mouth);
    c.lineTo(recess.left,recess.bottom-curve);c.quadraticCurveTo(recess.left,recess.bottom,recess.left+curve,recess.bottom);
    c.lineTo(recess.right-curve,recess.bottom);c.quadraticCurveTo(recess.right,recess.bottom,recess.right,recess.bottom-curve);
    c.lineTo(recess.right,y+mouth);c.quadraticCurveTo(recess.right,y,recess.right+mouth,y);
  }
  c.lineTo(right-r,y);c.quadraticCurveTo(right,y,right,y+r);
  c.lineTo(right,bottom-r);c.quadraticCurveTo(right,bottom,right-r,bottom);
  c.lineTo(x+r,bottom);c.quadraticCurveTo(x,bottom,x,bottom-r);
  c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();
}
function drawWalls(walls){
  const cap=(window.LocalTankHUDRects||[]).find(r=>r.y<=24&&r.w>0&&r.h>0),recess=tankBoundaryRecess(cap);
  window.LocalTankBoundaryProof={cap:cap||null,recess,clearance:8,actorArtwork:'tank-body + tank-turret; no mascot overlay'};
  const key=JSON.stringify([walls,recess]);
  if(!wallCache||key!==wallCacheKey){
    wallCacheKey=key;wallCache=document.createElement('canvas');wallCache.width=2560;wallCache.height=1440;
    const c=wallCache.getContext('2d');c.scale(2,2);
    const panel=(w,border=false)=>{
      const shape=()=>{c.beginPath();if(border){traceTankBoundary(c,{x:w.x,y:w.y,w:w.w,h:w.h,r:10},tankBoundaryRecess(cap,-15));traceTankBoundary(c,{x:24,y:24,w:1232,h:672,r:4},recess);}else c.roundRect(w.x,w.y,w.w,w.h,7);};
      c.save();shape();c.fillStyle='#121f26';c.shadowColor='#0009';c.shadowBlur=10;c.shadowOffsetY=5;c.fill('evenodd');c.restore();
      c.save();shape();c.clip('evenodd');
      const metal=c.createLinearGradient(w.x,w.y,w.x+w.w*.35,w.y+w.h);metal.addColorStop(0,'#45634d');metal.addColorStop(.24,'#233d35');metal.addColorStop(.55,'#142b29');metal.addColorStop(1,'#284239');c.fillStyle=metal;c.fillRect(w.x,w.y,w.w,w.h);
      c.lineWidth=.65;c.strokeStyle='#baff4752';c.beginPath();
      for(let x=Math.floor(w.x/12)*12;x<w.x+w.w;x+=12){c.moveTo(x,w.y);c.lineTo(x,w.y+w.h);}
      for(let y=Math.floor(w.y/12)*12;y<w.y+w.h;y+=12){c.moveTo(w.x,y);c.lineTo(w.x+w.w,y);}c.stroke();
      c.strokeStyle='#dbff9b36';c.lineWidth=1.1;c.beginPath();
      for(let d=-720;d<1280;d+=96){c.moveTo(d,0);c.lineTo(d+720,720);}c.stroke();
      c.restore();
      c.save();shape();c.lineWidth=2;c.strokeStyle='#a7e96b';c.shadowColor='#99ff39';c.shadowBlur=8;c.stroke();c.shadowBlur=0;
      if(!border){c.strokeStyle='#e6ffb988';c.lineWidth=1;c.beginPath();c.moveTo(w.x+7,w.y+4);c.lineTo(w.x+w.w-7,w.y+4);c.stroke();
        c.fillStyle='#d5ff9d';for(const end of [0,1]){const x=w.w>w.h?w.x+10+end*(w.w-20):w.x+w.w/2;const y=w.w>w.h?w.y+w.h/2:w.y+11+end*(w.h-22);c.fillRect(x-2,y-2,4,4);}}
      c.restore();
    };
    // One continuous ring replaces the four overlapping boundary rectangles.
    if(walls.some(w=>w.x===0&&w.y===0))panel({x:1,y:1,w:1278,h:718},true);
    for(const w of walls){if(w.x===0||w.y===0||w.x+w.w===1280||w.y+w.h===720)continue;panel(w);}
  }
  extendArenaEdges(wallCache);ctx.drawImage(wallCache,0,0,1280,720);
}
const treadMarks=[],treadLast=new Map();let treadRound='';
function drawTreadTrails(s){
  const now=window.PARTY_GAME_CLOCK?.now?.()??performance.now(),round=s.game.mode+':'+s.game.round;
  if(round!==treadRound||s.game.status==='lobby'){treadMarks.length=0;treadLast.clear();treadRound=round;}
  if(s.game.status==='playing')for(const p of [...s.players||[],...s.bots||[]]){
    if(!p.alive)continue;const id=p.id??p.name,prev=treadLast.get(id),distance=prev?Math.hypot(p.x-prev.x,p.y-prev.y):0;
    if(prev&&distance>=4&&distance<80){treadMarks.push({x:p.x,y:p.y,a:p.angle,r:p.radius,t:now});if(treadMarks.length>512)treadMarks.shift();}
    if(!prev||distance>=4)treadLast.set(id,{x:p.x,y:p.y});
  }
  while(treadMarks.length&&now-treadMarks[0].t>1700)treadMarks.shift();
  ctx.save();for(const m of treadMarks){ctx.save();ctx.globalAlpha=.15*Math.pow(Math.max(0,1-(now-m.t)/1700),1.5);ctx.translate(m.x,m.y);ctx.rotate(m.a);ctx.fillStyle='#c6ef91';const offset=m.r*.86;ctx.fillRect(-4,-offset-2,8,4);ctx.fillRect(-4,offset-2,8,4);ctx.restore();}ctx.restore();
}
function tankLabelSafeTop(){
  const box=canvas.getBoundingClientRect(),m=ctx.getTransform(),fit=Math.min(box.width/canvas.width,box.height/canvas.height),projection=Math.max(.25,fit*Math.hypot(m.a,m.b));
  const style=getComputedStyle(document.documentElement),hud=Math.max(0,...['--party-stage-inset-top','--party-native-inset-top'].map(key=>parseFloat(style.getPropertyValue(key))||0));
  const originY=box.top+(box.height-canvas.height*fit)/2+m.f*fit;
  return hud?Math.max(0,(hud+12-originY)/projection):0;
}
function drawBase(x,y,color,label){
  ctx.save();ctx.globalAlpha=.18;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,54,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.75;ctx.strokeStyle=color;ctx.setLineDash([8,8]);ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=color;ctx.font='italic 900 16px KardiaFatRunner, system-ui';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.globalAlpha=1;
  // Only the label moves: a top-edge base keeps its authoritative position.
  const safeTop=tankLabelSafeTop(),w=ctx.measureText(label).width,players=[...(lastState?.players||[]),...(lastState?.bots||[])].filter(p=>p.alive);
  const candidates=[{x,y:y-68},{x,y:y+80},{x,y:y+112},{x,y:y+144},{x,y:y+176},{x,y:y+208}];let best,cost=Infinity;
  for(const [i,c]of candidates.entries()){const r={x:Math.max(w/2+18,Math.min(1262-w/2,c.x)),y:Math.max(safeTop+16,Math.min(696,c.y))};const hits=players.filter(p=>Math.abs(r.x-p.x)<w/2+p.radius*2&&Math.abs(r.y-8-p.y)<p.radius*2.4+10).length;const score=hits*1e6+Math.abs(r.y-c.y)*100+i*10;if(score<cost){best=r;cost=score;}}
  (window.LocalTankBaseLabels??=[]).push({text:label,x:best.x-w/2,y:best.y-16,w,h:20,safeTop,color,baseX:x,baseY:y});ctx.restore();
}
function drawBaseLabels(){
 ctx.save();ctx.font='italic 900 16px KardiaFatRunner, system-ui';ctx.textAlign='center';ctx.textBaseline='alphabetic';
 for(const r of window.LocalTankBaseLabels||[]){const x=r.x+r.w/2,y=r.y+16;ctx.shadowColor='#081019';ctx.shadowBlur=5;ctx.fillStyle=r.color;ctx.fillText(r.text,x,y);ctx.shadowBlur=0;}
 ctx.restore();
}
function drawFlag(f,color){
  ctx.save();ctx.translate(f.x,f.y);ctx.strokeStyle='#dfe6ef';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,18);ctx.lineTo(-8,-22);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-7,-22);ctx.lineTo(23,-14);ctx.lineTo(-7,-4);ctx.closePath();ctx.fill();ctx.restore();
}

function tankArtwork(context,r,color,id){
  if(tankRig?.draw(context,r,color,id,0))return true;
  const art=window.PartyArt;if(!art?.sprite('tank-body',color)||!art.sprite('tank-turret',color))return false;
  // A larger hull and a wider barrel read at TV distance; reach stays at the shot anchor.
  art.draw(context,'tank-body',0,0,r*3.1,r*3.5,{color,rotation:Math.PI/2});
  art.draw(context,'tank-turret',0,0,r*2.15,r*2.85,{color,rotation:Math.PI/2,pivot:{x:.5,y:.76}});
  return true;
}
function drawTank(p){
  if(!p.alive) return;
  const fxPose=tankFX?.pose('p'+p.id)||{dx:0,dy:0,glow:0};
  ctx.save();ctx.translate(p.x+fxPose.dx,p.y+fxPose.dy);ctx.rotate(p.angle);
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(0,0,p.radius,0,Math.PI*2);ctx.fill();
  if(!tankArtwork(ctx,p.radius,p.color,'p'+p.id)){ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.radius,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=p.color;ctx.fillRect(p.radius-2,-7,22,14);
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.strokeRect(p.radius-2,-7,22,14);
  ctx.fillStyle='#11151d';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();}drawHitGlow(fxPose.glow,p.radius);ctx.restore();
  ctx.save();ctx.textAlign='center';
  const bw=56,bh=5,hpY=Math.min(706-bh,p.y+p.radius*2.4+8);ctx.fillStyle='#1c222c';ctx.fillRect(p.x-bw/2,hpY,bw,bh);ctx.fillStyle=p.hp>40?'#a8ef62':'#ff5b67';ctx.fillRect(p.x-bw/2,hpY,bw*(p.hp/p.maxHp),bh);
  if(p.hasFlag){ctx.fillStyle='#fff';ctx.font='italic 800 10px PartyRubik, Rubik, system-ui';ctx.fillText('⚑',p.x,p.y-p.radius*2.5-12);} if(p.hasCore){ctx.fillStyle='#d7ff42';ctx.fillText('◆ CORE',p.x,p.y-p.radius*2.5-12);}ctx.restore();
}
const tankNameSlots=new Map();
function drawTankNames(players=[]){
 const live=players.filter(p=>p.alive);ctx.save();const m=ctx.getTransform(),box=canvas.getBoundingClientRect(),projection=Math.min(box.width/canvas.width,box.height/canvas.height)*Math.hypot(m.a,m.b),pixelFont=14*Math.max(1,box.width/1280),font=pixelFont/Math.max(.25,projection),gap=font*.35;
 ctx.font=`500 ${font}px KardiaFit, system-ui`;ctx.textAlign='center';ctx.textBaseline='alphabetic';const placed=[],safeTop=Math.max(22,tankLabelSafeTop()),baseLabels=window.LocalTankBaseLabels||[];
 const overlap=(a,b)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
 const hitsTank=(r,p)=>{const x=Math.max(r.x,Math.min(p.x,r.x+r.w)),y=Math.max(r.y,Math.min(p.y,r.y+r.h));return Math.hypot(x-p.x,y-p.y)<p.radius*2.45;};
 const ids=new Set(live.map(p=>p.id));for(const id of tankNameSlots.keys())if(!ids.has(id))tankNameSlots.delete(id);
 for(const p of live){
  let text=String(p.name||''),letters=Array.from(text);const maxWidth=Math.min(210,font*11);
  while(letters.length&&ctx.measureText(text).width>maxWidth){letters.pop();text=letters.join('')+'…';}
  const w=ctx.measureText(text).width+8,h=font*1.2,preferred={x:p.x-w/2,y:p.y-p.radius*2.45-h-10,w,h},previous=tankNameSlots.get(p.id),candidates=[preferred];
  if(previous)candidates.push({x:p.x+previous.dx,y:p.y+previous.dy,w,h});
  for(let ring=0;ring<10;ring++)for(const a of[-Math.PI/2,Math.PI/2,-Math.PI/4,-3*Math.PI/4,Math.PI/4,3*Math.PI/4,0,Math.PI]){const d=p.radius*2.45+h+10+ring*(h+8);candidates.push({x:p.x+Math.cos(a)*d-w/2,y:p.y+Math.sin(a)*d-h/2,w,h});}
  let best=null,cost=Infinity;
  for(const raw of candidates){const r={...raw,x:Math.max(18,Math.min(1262-w,raw.x)),y:Math.max(safeTop,Math.min(698-h,raw.y))},collisions=placed.filter(q=>overlap(r,q)).length+baseLabels.filter(q=>overlap(r,q)).length+(window.LocalTankHUDRects||[]).filter(q=>overlap(r,q)).length+live.filter(q=>hitsTank(r,q)).length,continuity=previous?Math.hypot(r.x-p.x-previous.dx,r.y-p.y-previous.dy):0,score=collisions*1e7+(r.x-preferred.x)**2+(r.y-preferred.y)**2+continuity*font;
   if(score<cost){best=r;cost=score;}}
  placed.push({...best,p,text});tankNameSlots.set(p.id,{dx:best.x-p.x,dy:best.y-p.y});
 }
 for(const r of placed){const x=r.x+r.w/2,y=r.y+r.h/2,dx=x-r.p.x,dy=y-r.p.y,d=Math.hypot(dx,dy);if(d>r.p.radius+font*2){ctx.strokeStyle=r.p.color;ctx.globalAlpha=.3;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(r.p.x+dx/d*(r.p.radius+4),r.p.y+dy/d*(r.p.radius+4));ctx.lineTo(x,y);ctx.stroke();}}
 ctx.globalAlpha=1;ctx.fillStyle='#f8fbff';ctx.shadowColor='#081019';ctx.shadowBlur=4;for(const r of placed)ctx.fillText(r.text,r.x+r.w/2,r.y+font);
 ctx.restore();window.LocalTankNameLabels=placed.map(r=>({id:r.p.id,text:r.text,x:r.x,y:r.y,w:r.w,h:r.h,pixelFont,safeTop}));
}
// Confirmed damage: a brief additive white-hot glow over the hull.
function drawHitGlow(k,r){if(!(k>0))return;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=k*.85;const g=ctx.createRadialGradient(0,0,0,0,0,r*1.7);g.addColorStop(0,'#ffffff');g.addColorStop(.45,'#ffd9de');g.addColorStop(1,'#ff5b6700');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r*1.7,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawBot(b){
  if(!b.alive) return;
  const fxPose=tankFX?.pose('b'+b.id)||{dx:0,dy:0,glow:0};
  ctx.save();ctx.translate(b.x+fxPose.dx,b.y+fxPose.dy);ctx.rotate(b.angle);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(0,0,b.radius,0,Math.PI*2);ctx.fill();if(!tankArtwork(ctx,b.radius,b.color,'b'+b.id)){ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(0,0,b.radius,0,Math.PI*2);ctx.fill();ctx.lineWidth=b.type==='boss'?4:2;ctx.strokeStyle=b.type==='boss'?'#ffd0d7':'#ffe0c6';ctx.stroke();ctx.fillRect(b.radius-2,-8,b.type==='boss'?30:23,16);}drawHitGlow(fxPose.glow,b.radius);ctx.restore();
  const bw=b.type==='boss'?90:52,hpY=Math.max(tankLabelSafeTop()+20,Math.min(700,b.y-b.radius*2.4-12));ctx.fillStyle='#181d25';ctx.fillRect(b.x-bw/2,hpY,bw,6);ctx.fillStyle=b.type==='boss'?'#ff3f62':'#ff934f';ctx.fillRect(b.x-bw/2,hpY,bw*(b.hp/b.maxHp),6);ctx.fillStyle='#fff';ctx.font='italic 800 10px PartyRubik, Rubik, system-ui';ctx.textAlign='center';ctx.fillText(b.type==='boss'?'BOSS':'GUARD',b.x,hpY-7);
}
function drawCore(g){
  if(!g.coreUnlocked) return;
  ctx.save();ctx.translate(g.core.x,g.core.y);ctx.rotate(performance.now()/500);ctx.shadowBlur=24;ctx.shadowColor='#d7ff42';ctx.fillStyle='#d7ff42';ctx.beginPath();for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;const x=Math.cos(a)*16,y=Math.sin(a)*16;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.restore();
}
function drawBullet(b){
  const speed=Math.hypot(b.vx||0,b.vy||0)||1,dx=(b.vx||0)/speed,dy=(b.vy||0)/speed,color=b.color||"#fff";
  ctx.save();const tail=ctx.createLinearGradient(b.x-dx*26,b.y-dy*26,b.x,b.y);tail.addColorStop(0,"transparent");tail.addColorStop(1,color);ctx.strokeStyle=tail;ctx.lineWidth=b.radius*1.3;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(b.x-dx*26,b.y-dy*26);ctx.lineTo(b.x,b.y);ctx.stroke();
  ctx.fillStyle="#fff9dc";ctx.shadowBlur=12;ctx.shadowColor=color;ctx.beginPath();ctx.arc(b.x,b.y,b.radius*.7,0,Math.PI*2);ctx.fill();
  if(b.life>1.94){const t=(2-b.life)/.06;ctx.globalAlpha=Math.pow(1-t,2);ctx.translate(b.x-dx*speed*(2-b.life),b.y-dy*speed*(2-b.life));ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle="#ffe2a0";ctx.beginPath();ctx.moveTo(-3,-3);ctx.lineTo(18*(1-t)+6,0);ctx.lineTo(-3,3);ctx.fill();}
  ctx.restore();
}
function drawCenterMessage(g){
  if(g.status==='between' || g.status==='finished'){
    ctx.save();ctx.fillStyle='rgba(8,10,14,.72)';roundedRect(380,307,520,106,20);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.12)';ctx.stroke();ctx.fillStyle='#fff';ctx.font='italic 800 28px PartyRubik, Rubik, system-ui';ctx.textAlign='center';ctx.fillText(g.winnerText||'',640,360,480);ctx.restore();
  }
}

function render(){
  // Hit-stop: a confirmed kill holds the previous frame for ~70 ms.
  if(tankFX?.holding()){requestAnimationFrame(render);return;}
  beginTankFrame();
  const s=lastState,shake=tankFX?.shake()||{x:0,y:0};
  window.LocalTankAuthoritativeBounds=s?.playfield||null;
  ctx.save();if(shake.x||shake.y){ctx.fillStyle='#0b1418';ctx.fillRect(tankCamera.x,tankCamera.y,tankCamera.width,tankCamera.height);ctx.translate(shake.x,shake.y);}
  drawGrid();window.LocalTankBaseLabels=[];
  if(s){
    drawTreadTrails(s);
    if(s.game.status!=='lobby'&&s.game.mode)tankFX?.drawUnder(ctx);
    if(s.game.mode==='ctf'){drawBase(s.flags.red.base.x,s.flags.red.base.y,'#ff5b67','RED BASE');drawBase(s.flags.blue.base.x,s.flags.blue.base.y,'#4e9cff','BLUE BASE');}
    if(s.game.mode==='coop') drawBase(s.game.extraction.x,s.game.extraction.y,'#d7ff42','EXTRACT');
    if(s.game.status!=='lobby'&&s.game.mode)drawWalls(s.walls||[]);
    if(s.game.mode==='ctf'){drawFlag(s.flags.red,'#ff5b67');drawFlag(s.flags.blue,'#4e9cff');}
    if(s.game.mode==='coop') drawCore(s.game);
    for(const b of s.bullets||[]) drawBullet(b);
    for(const b of s.bots||[]) drawBot(b);
    for(const p of s.players||[]) drawTank(p);
    drawBaseLabels();drawTankNames(s.players);
    drawCombatEffects(s.effects);
    if(s.game.status!=='lobby'&&s.game.mode)tankFX?.drawOver(ctx);
    drawCenterMessage(s.game);
  }
  ctx.restore();
  requestAnimationFrame(render);
}
render();
