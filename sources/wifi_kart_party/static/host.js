const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const leaderboard = document.getElementById('leaderboard');
const raceStatus = document.getElementById('raceStatus');
const raceClock = document.getElementById('raceClock');
const lapTarget = document.getElementById('lapTarget');
const playerCount = document.getElementById('playerCount');
const countdownEl = document.getElementById('countdown');
const winnerBanner = document.getElementById('winnerBanner');
const lapsInput = document.getElementById('lapsInput');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const joinUrl = document.getElementById('joinUrl');
const qr = document.getElementById('qr');

let ws;
let state = {
  status: 'lobby', laps: 10, countdown: 0, race_time: 0, players: [],
  track: {width:1600,height:900,cx:800,cy:450,outer_rx:730,outer_ry:380,inner_rx:430,inner_ry:170,mid_rx:580,mid_ry:275}
};
let prevPositions = new Map();
let displayPositions = new Map();

function connect(){
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if(msg.type === 'state'){
      for(const p of state.players || []) prevPositions.set(p.id, {x:p.x,y:p.y,angle:p.angle});
      state = msg;
      updateHud();
    }
  };
  ws.onclose = () => setTimeout(connect, 900);
}
connect();

fetch('/api/info').then(r=>r.json()).then(info=>{
  joinUrl.textContent = info.join_url;
  qr.src = `/qr.png?t=${Date.now()}`;
}).catch(()=>{ joinUrl.textContent = 'Use this computer’s LAN IP + :8765/controller'; });

function send(obj){ if(ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj)); }
startBtn.onclick = () => send({type:'host_start'});
resetBtn.onclick = () => send({type:'host_reset'});
lapsInput.onchange = () => send({type:'host_set_laps',laps:Number(lapsInput.value)});
fullscreenBtn.onclick = async () => {
  try{ if(!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }catch(e){}
};

function fmtTime(sec, millis=true){
  if(sec == null || !isFinite(sec)) return '—';
  const m = Math.floor(sec/60);
  const s = Math.floor(sec%60);
  const ms = Math.floor((sec-Math.floor(sec))*1000);
  return millis ? `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(ms).padStart(3,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function updateHud(){
  lapTarget.textContent = state.laps;
  lapsInput.value = state.laps;
  lapsInput.disabled = state.status !== 'lobby';
  raceClock.textContent = fmtTime(state.race_time);
  const connected = state.players.filter(p=>p.connected).length;
  playerCount.textContent = `${connected} player${connected===1?'':'s'}`;
  startBtn.disabled = connected === 0 || state.status === 'countdown' || state.status === 'racing';
  startBtn.textContent = state.status === 'results' ? 'RACE AGAIN' : 'START';

  const label = {lobby:'LOBBY',countdown:'GET READY',racing:'RACING',results:'RESULTS'}[state.status] || state.status.toUpperCase();
  raceStatus.textContent = label;

  if(state.status === 'countdown'){
    countdownEl.classList.remove('hidden');
    countdownEl.textContent = Math.max(1, Math.ceil(state.countdown));
  } else {
    countdownEl.classList.add('hidden');
  }

  const ordered = [...state.players].sort((a,b)=>(a.position||999)-(b.position||999));
  if(!ordered.length){
    leaderboard.className='leaderboard empty-state';
    leaderboard.textContent='Waiting for drivers…';
  }else{
    leaderboard.className='leaderboard';
    leaderboard.innerHTML = ordered.map(p=>{
      const lap = Math.min(p.lap+1,state.laps);
      const finish = p.finish_order ? `FINISH #${p.finish_order}` : `Lap ${lap}/${state.laps}`;
      const best = p.best_lap==null ? 'best —' : `best ${fmtTime(p.best_lap)}`;
      return `<div class="leader-row">
        <div class="leader-pos">${p.finish_order ? '#'+p.finish_order : p.position}</div>
        <div class="leader-dot" style="background:${p.color}"></div>
        <div class="leader-name"><strong>${escapeHtml(p.name)}${p.connected?'':' · offline'}</strong><span>${finish}</span></div>
        <div class="leader-meta"><strong>${p.finish_time!=null?fmtTime(p.finish_time):Math.round(p.speed*0.55)+' km/h'}</strong><span>${best}</span></div>
      </div>`;
    }).join('');
  }

  if(state.status === 'results' && ordered.length){
    const winner = ordered.find(p=>p.finish_order===1) || ordered[0];
    winnerBanner.innerHTML = `<div style="font-size:12px;color:#8D96A8;letter-spacing:.14em">WINNER</div><div style="color:${winner.color}">🏁 ${escapeHtml(winner.name)}</div><div style="font-size:14px;margin-top:4px">${winner.finish_time?fmtTime(winner.finish_time):''}</div>`;
    winnerBanner.classList.remove('hidden');
  } else winnerBanner.classList.add('hidden');
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

function ellipsePoint(angle, rx, ry){
  const t=state.track;
  return {x:t.cx+rx*Math.cos(angle),y:t.cy+ry*Math.sin(angle)};
}
function roundedRect(x,y,w,h,r){
  r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function drawTrack(){
  const t=state.track;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const bg=ctx.createLinearGradient(0,0,0,900);bg.addColorStop(0,'#20344A');bg.addColorStop(1,'#152839');ctx.fillStyle=bg;ctx.fillRect(0,0,1600,900);

  // Decorative turf/noise dots
  ctx.globalAlpha=.12;ctx.fillStyle='#8EE7BE';
  for(let y=28;y<900;y+=42){for(let x=24+(y%84);x<1600;x+=84){ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fill();}}
  ctx.globalAlpha=1;

  // Track base as outer ellipse.
  ctx.save();
  ctx.fillStyle='#2D3441';ctx.beginPath();ctx.ellipse(t.cx,t.cy,t.outer_rx,t.outer_ry,0,0,Math.PI*2);ctx.fill();
  // inner island
  const island=ctx.createRadialGradient(t.cx,t.cy,50,t.cx,t.cy,t.inner_rx);island.addColorStop(0,'#1E4F49');island.addColorStop(1,'#183A3B');ctx.fillStyle=island;ctx.beginPath();ctx.ellipse(t.cx,t.cy,t.inner_rx,t.inner_ry,0,0,Math.PI*2);ctx.fill();
  // lane seams
  ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=3;ctx.setLineDash([18,22]);ctx.beginPath();ctx.ellipse(t.cx,t.cy,t.mid_rx,t.mid_ry,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  // borders
  ctx.lineWidth=9;ctx.strokeStyle='#E8EEF5';ctx.beginPath();ctx.ellipse(t.cx,t.cy,t.outer_rx-4,t.outer_ry-4,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(t.cx,t.cy,t.inner_rx+4,t.inner_ry+4,0,0,Math.PI*2);ctx.stroke();
  ctx.lineWidth=5;ctx.setLineDash([22,22]);ctx.strokeStyle='#FF4D82';ctx.beginPath();ctx.ellipse(t.cx,t.cy,t.outer_rx-4,t.outer_ry-4,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#52D6FF';ctx.beginPath();ctx.ellipse(t.cx,t.cy,t.inner_rx+4,t.inner_ry+4,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.restore();

  // Boost pads
  for(const a of [1.18,3.15,5.20]){
    const p=ellipsePoint(a,t.mid_rx,t.mid_ry);
    const tangent=Math.atan2(t.mid_ry*Math.cos(a),-t.mid_rx*Math.sin(a));
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(tangent);ctx.fillStyle='#A8FF66';ctx.shadowColor='#A8FF66';ctx.shadowBlur=18;
    for(let i=-1;i<=1;i++){roundedRect(-42+i*30,-25,18,50,7);ctx.fill();}
    ctx.restore();
  }

  // Start / finish checker at angle 0.
  const sx=t.cx+t.mid_rx;const sy=t.cy;ctx.save();ctx.translate(sx,sy);ctx.rotate(Math.PI/2);
  const cell=15;for(let yy=-60;yy<60;yy+=cell){for(let xx=-15;xx<15;xx+=cell){const ix=Math.round((xx+15)/cell),iy=Math.round((yy+60)/cell);ctx.fillStyle=(ix+iy)%2?'#0B0D12':'#F3F5F8';ctx.fillRect(xx,yy,cell,cell);}}
  ctx.restore();

  // Island signage
  ctx.fillStyle='rgba(255,255,255,.08)';roundedRect(t.cx-150,t.cy-42,300,84,28);ctx.fill();
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#EAF0F7';ctx.font='900 30px system-ui';ctx.fillText('WI‑FI KART',t.cx,t.cy-6);ctx.fillStyle='#7E8CA0';ctx.font='800 12px system-ui';ctx.fillText('LOCAL PARTY CIRCUIT',t.cx,t.cy+22);
}

function angleLerp(a,b,t){
  let d=((b-a+Math.PI)%(Math.PI*2))-Math.PI; if(d<-Math.PI)d+=Math.PI*2; return a+d*t;
}
function drawCars(){
  for(const p of state.players){
    if(state.status !== 'lobby' && !p.in_race) continue;
    let d=displayPositions.get(p.id);
    if(!d){d={x:p.x,y:p.y,angle:p.angle};displayPositions.set(p.id,d);}
    d.x += (p.x-d.x)*.28;d.y += (p.y-d.y)*.28;d.angle=angleLerp(d.angle,p.angle,.28);
    ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.angle);
    ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=14;ctx.shadowOffsetY=6;
    ctx.fillStyle=p.color;roundedRect(-18,-11,36,22,8);ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='#111722';roundedRect(2,-7,9,14,4);ctx.fill();
    ctx.fillStyle='#0A0D12';ctx.fillRect(-13,-15,8,5);ctx.fillRect(6,-15,8,5);ctx.fillRect(-13,10,8,5);ctx.fillRect(6,10,8,5);
    ctx.restore();
    ctx.textAlign='center';ctx.textBaseline='bottom';ctx.font='800 11px system-ui';ctx.fillStyle='#fff';ctx.shadowColor='#000';ctx.shadowBlur=5;ctx.fillText(p.name,d.x,d.y-19);ctx.shadowBlur=0;
    if(p.position===1 && state.status==='racing'){ctx.font='16px system-ui';ctx.fillText('👑',d.x,d.y-34);}
  }
}
function frame(){drawTrack();drawCars();requestAnimationFrame(frame)}
requestAnimationFrame(frame);
