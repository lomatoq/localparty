const socket = createSocketBus();
socket.on('connect',()=>socket.emit('registerHost'));

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
    resultStats.innerHTML = [...s.players].sort((a,b)=>b.score-a.score).map((p,i)=>
      `<div class="stat-row"><b>${i+1}</b><span><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:8px"></i>${escapeHtml(p.name)}</span><span>${g.mode==='survival'?`${p.roundWins} wins`:g.mode==='ctf'?`${p.captures} flags`:`${p.kills} kills`}</span><b>${p.score}</b></div>`
    ).join('');
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
function drawGrid(){
  ctx.fillStyle='#0d1219';ctx.fillRect(0,0,1280,720);
  ctx.strokeStyle='rgba(255,255,255,.035)';ctx.lineWidth=1;
  for(let x=40;x<1280;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,720);ctx.stroke();}
  for(let y=40;y<720;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1280,y);ctx.stroke();}
  const grad=ctx.createRadialGradient(640,360,40,640,360,620);grad.addColorStop(0,'rgba(100,140,180,.08)');grad.addColorStop(1,'rgba(0,0,0,.34)');ctx.fillStyle=grad;ctx.fillRect(0,0,1280,720);
}
function drawWalls(walls){
  for(const w of walls){
    ctx.fillStyle='rgba(0,0,0,.32)';roundedRect(w.x+7,w.y+8,w.w,w.h,8);ctx.fill();
    ctx.fillStyle='#28313e';roundedRect(w.x,w.y,w.w,w.h,8);ctx.fill();
    ctx.strokeStyle='#3b4655';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.035)';ctx.fillRect(w.x+4,w.y+4,Math.max(0,w.w-8),3);
  }
}
function drawBase(x,y,color,label){
  ctx.save();ctx.globalAlpha=.18;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,54,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.75;ctx.strokeStyle=color;ctx.setLineDash([8,8]);ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=color;ctx.font='800 11px system-ui';ctx.textAlign='center';ctx.fillText(label,x,y+4);ctx.restore();
}
function drawFlag(f,color){
  ctx.save();ctx.translate(f.x,f.y);ctx.strokeStyle='#dfe6ef';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,18);ctx.lineTo(-8,-22);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-7,-22);ctx.lineTo(23,-14);ctx.lineTo(-7,-4);ctx.closePath();ctx.fill();ctx.restore();
}
function drawTank(p){
  if(!p.alive) return;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(3,5,p.radius+2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.radius,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=p.color;ctx.fillRect(p.radius-2,-7,22,14);
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.strokeRect(p.radius-2,-7,22,14);
  ctx.fillStyle='#11151d';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.save();ctx.textAlign='center';ctx.font='800 11px system-ui';ctx.fillStyle='#f8fbff';ctx.fillText(p.name,p.x,p.y-p.radius-17);
  const bw=46,bh=5;ctx.fillStyle='#1c222c';ctx.fillRect(p.x-bw/2,p.y+p.radius+10,bw,bh);ctx.fillStyle=p.hp>40?'#a8ef62':'#ff5b67';ctx.fillRect(p.x-bw/2,p.y+p.radius+10,bw*(p.hp/p.maxHp),bh);
  if(p.hasFlag){ctx.fillStyle='#fff';ctx.font='900 10px system-ui';ctx.fillText('⚑',p.x,p.y-38);} if(p.hasCore){ctx.fillStyle='#d7ff42';ctx.fillText('◆ CORE',p.x,p.y-38);}ctx.restore();
}
function drawBot(b){
  if(!b.alive) return;
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(4,5,b.radius+3,0,Math.PI*2);ctx.fill();ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(0,0,b.radius,0,Math.PI*2);ctx.fill();ctx.lineWidth=b.type==='boss'?4:2;ctx.strokeStyle=b.type==='boss'?'#ffd0d7':'#ffe0c6';ctx.stroke();ctx.fillRect(b.radius-2,-8,b.type==='boss'?30:23,16);ctx.restore();
  const bw=b.type==='boss'?90:52;ctx.fillStyle='#181d25';ctx.fillRect(b.x-bw/2,b.y-b.radius-18,bw,6);ctx.fillStyle=b.type==='boss'?'#ff3f62':'#ff934f';ctx.fillRect(b.x-bw/2,b.y-b.radius-18,bw*(b.hp/b.maxHp),6);ctx.fillStyle='#fff';ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.fillText(b.type==='boss'?'BOSS':'GUARD',b.x,b.y-b.radius-25);
}
function drawCore(g){
  if(!g.coreUnlocked) return;
  ctx.save();ctx.translate(g.core.x,g.core.y);ctx.rotate(performance.now()/500);ctx.shadowBlur=24;ctx.shadowColor='#d7ff42';ctx.fillStyle='#d7ff42';ctx.beginPath();for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;const x=Math.cos(a)*16,y=Math.sin(a)*16;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.restore();
}
function drawBullet(b){ctx.fillStyle=b.color||'#fff';ctx.shadowBlur=12;ctx.shadowColor=b.color||'#fff';ctx.beginPath();ctx.arc(b.x,b.y,b.radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
function drawCenterMessage(g){
  if(g.status==='between' || g.status==='finished'){
    ctx.save();ctx.fillStyle='rgba(8,10,14,.72)';roundedRect(380,307,520,106,20);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.12)';ctx.stroke();ctx.fillStyle='#fff';ctx.font='900 28px system-ui';ctx.textAlign='center';ctx.fillText(g.winnerText||'',640,360);ctx.restore();
  }
}

function render(){
  const s=lastState;
  drawGrid();
  if(s){
    if(s.game.mode==='ctf'){drawBase(s.flags.red.base.x,s.flags.red.base.y,'#ff5b67','RED BASE');drawBase(s.flags.blue.base.x,s.flags.blue.base.y,'#4e9cff','BLUE BASE');}
    if(s.game.mode==='coop') drawBase(s.game.extraction.x,s.game.extraction.y,'#d7ff42','EXTRACT');
    drawWalls(s.walls||[]);
    if(s.game.mode==='ctf'){drawFlag(s.flags.red,'#ff5b67');drawFlag(s.flags.blue,'#4e9cff');}
    if(s.game.mode==='coop') drawCore(s.game);
    for(const b of s.bullets||[]) drawBullet(b);
    for(const b of s.bots||[]) drawBot(b);
    for(const p of s.players||[]) drawTank(p);
    drawCenterMessage(s.game);
  }
  requestAnimationFrame(render);
}
render();
