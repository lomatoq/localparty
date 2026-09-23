const socket = createSocketBus();
socket.on('connect',()=>socket.emit('registerHost'));

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');installCanvasCaps(ctx);
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
socket.on('state', state => {
  lastState = state;
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
let terrainCache;
function drawGrid(){
 if(!terrainCache){terrainCache=document.createElement('canvas');terrainCache.width=1280;terrainCache.height=720;const t=terrainCache.getContext('2d');const g=t.createLinearGradient(0,0,1280,720);g.addColorStop(0,'#273831');g.addColorStop(.5,'#192927');g.addColorStop(1,'#17252e');t.fillStyle=g;t.fillRect(0,0,1280,720);
 for(let i=0;i<460;i++){const x=(i*197)%1280,y=(i*113)%720;t.fillStyle=i%3?'#bed0b008':'#030e1715';t.fillRect(x,y,2+i%9,1+i%3);}
 t.strokeStyle='#bcc8b009';t.lineWidth=1;for(let x=0;x<1280;x+=80){t.beginPath();t.moveTo(x,0);t.lineTo(x,720);t.stroke();}for(let y=0;y<720;y+=80){t.beginPath();t.moveTo(0,y);t.lineTo(1280,y);t.stroke();}
 const v=t.createRadialGradient(640,360,80,640,360,750);v.addColorStop(0,'#00000000');v.addColorStop(1,'#02081399');t.fillStyle=v;t.fillRect(0,0,1280,720);}
 ctx.drawImage(terrainCache,0,0);
}
function drawCombatEffects(effects){for(const e of effects||[]){const t=1-e.t/e.max;ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=(1-t)*(1-t);ctx.strokeStyle=e.color;ctx.lineWidth=3*(1-t)+1;ctx.beginPath();ctx.arc(0,0,4+36*(1-(1-t)**3),0,Math.PI*2);ctx.stroke();for(let i=0;i<9;i++){const a=i*2.399,r=8+55*t;ctx.strokeStyle=i%2?'#fff3c7':e.color;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+12*(1-t)),Math.sin(a)*(r+12*(1-t)));ctx.stroke();}ctx.restore();}}
let wallCache, wallCacheKey='';
function drawWalls(walls){
  const key=JSON.stringify(walls);
  if(!wallCache||key!==wallCacheKey){
    wallCacheKey=key;wallCache=document.createElement('canvas');wallCache.width=2560;wallCache.height=1440;
    const c=wallCache.getContext('2d');c.scale(2,2);
    const panel=(w,border=false)=>{
      const shape=()=>{c.beginPath();c.roundRect(w.x,w.y,w.w,w.h,border?10:7);if(border)c.roundRect(24,24,1232,672,4);};
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
  ctx.drawImage(wallCache,0,0,1280,720);
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
function drawBase(x,y,color,label){
  ctx.save();ctx.globalAlpha=.18;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,54,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.75;ctx.strokeStyle=color;ctx.setLineDash([8,8]);ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=color;ctx.font='italic 800 11px PartyRubik, Rubik, system-ui';ctx.textAlign='center';ctx.fillText(label,x,y+4);ctx.restore();
}
function drawFlag(f,color){
  ctx.save();ctx.translate(f.x,f.y);ctx.strokeStyle='#dfe6ef';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,18);ctx.lineTo(-8,-22);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-7,-22);ctx.lineTo(23,-14);ctx.lineTo(-7,-4);ctx.closePath();ctx.fill();ctx.restore();
}

function tankArtwork(context,r,color){const art=window.PartyArt;if(!art?.sprite('tank-body',color)||!art.sprite('tank-turret',color))return false;art.draw(context,'tank-body',0,0,r*2.3,r*2.7,{color,rotation:Math.PI/2});art.draw(context,'tank-turret',0,0,r*1.6,r*2.7,{color,rotation:Math.PI/2,pivot:{x:.5,y:.76}});return true;}
function drawTank(p){
  if(!p.alive) return;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(3,5,p.radius+2,0,Math.PI*2);ctx.fill();
  if(!tankArtwork(ctx,p.radius,p.color)){ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.radius,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=p.color;ctx.fillRect(p.radius-2,-7,22,14);
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.strokeRect(p.radius-2,-7,22,14);
  ctx.fillStyle='#11151d';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();}ctx.restore();
  ctx.save();ctx.textAlign='center';ctx.font='italic 800 11px PartyRubik, Rubik, system-ui';ctx.fillStyle='#f8fbff';ctx.fillText(p.name,p.x,p.y-p.radius-17,150);
  const bw=46,bh=5;ctx.fillStyle='#1c222c';ctx.fillRect(p.x-bw/2,p.y+p.radius+10,bw,bh);ctx.fillStyle=p.hp>40?'#a8ef62':'#ff5b67';ctx.fillRect(p.x-bw/2,p.y+p.radius+10,bw*(p.hp/p.maxHp),bh);
  if(p.hasFlag){ctx.fillStyle='#fff';ctx.font='italic 800 10px PartyRubik, Rubik, system-ui';ctx.fillText('⚑',p.x,p.y-38);} if(p.hasCore){ctx.fillStyle='#d7ff42';ctx.fillText('◆ CORE',p.x,p.y-38);}ctx.restore();
}
function drawBot(b){
  if(!b.alive) return;
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(4,5,b.radius+3,0,Math.PI*2);ctx.fill();if(!tankArtwork(ctx,b.radius,b.color)){ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(0,0,b.radius,0,Math.PI*2);ctx.fill();ctx.lineWidth=b.type==='boss'?4:2;ctx.strokeStyle=b.type==='boss'?'#ffd0d7':'#ffe0c6';ctx.stroke();ctx.fillRect(b.radius-2,-8,b.type==='boss'?30:23,16);}ctx.restore();
  const bw=b.type==='boss'?90:52;ctx.fillStyle='#181d25';ctx.fillRect(b.x-bw/2,b.y-b.radius-18,bw,6);ctx.fillStyle=b.type==='boss'?'#ff3f62':'#ff934f';ctx.fillRect(b.x-bw/2,b.y-b.radius-18,bw*(b.hp/b.maxHp),6);ctx.fillStyle='#fff';ctx.font='italic 800 10px PartyRubik, Rubik, system-ui';ctx.textAlign='center';ctx.fillText(b.type==='boss'?'BOSS':'GUARD',b.x,b.y-b.radius-25);
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
  window.PartyArt?.beginFrame(ctx,1280,720);
  const s=lastState;
  drawGrid();
  if(s){
    drawTreadTrails(s);
    if(s.game.mode==='ctf'){drawBase(s.flags.red.base.x,s.flags.red.base.y,'#ff5b67','RED BASE');drawBase(s.flags.blue.base.x,s.flags.blue.base.y,'#4e9cff','BLUE BASE');}
    if(s.game.mode==='coop') drawBase(s.game.extraction.x,s.game.extraction.y,'#d7ff42','EXTRACT');
    if(s.game.status!=='lobby'&&s.game.mode)drawWalls(s.walls||[]);
    if(s.game.mode==='ctf'){drawFlag(s.flags.red,'#ff5b67');drawFlag(s.flags.blue,'#4e9cff');}
    if(s.game.mode==='coop') drawCore(s.game);
    for(const b of s.bullets||[]) drawBullet(b);
    for(const b of s.bots||[]) drawBot(b);
    for(const p of s.players||[]) drawTank(p);
    drawCombatEffects(s.effects);
    drawCenterMessage(s.game);
  }
  requestAnimationFrame(render);
}
render();

function installCanvasCaps(context){const draw=context.fillText.bind(context),measure=context.measureText.bind(context);context.fillText=(text,...args)=>draw(String(text??'').toLocaleUpperCase('ru-RU'),...args);context.measureText=text=>measure(String(text??'').toLocaleUpperCase('ru-RU'));}

