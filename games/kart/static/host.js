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
  qr.src = `qr.png?t=${Date.now()}`;
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
    leaderboard.className='leaderboard';if(!leaderboard.children.length)leaderboard.textContent='';
    const existing=new Map([...leaderboard.children].map(e=>[e.dataset.id,e]));const previous=new Map([...leaderboard.children].map(e=>[e.dataset.id,e.offsetTop]));
    const markup = ordered.map(p=>{
      const lap = Math.min(p.lap+1,state.laps);
      const finish = p.finish_order ? `FINISH #${p.finish_order}` : `Lap ${lap}/${state.laps}`;
      const best = p.best_lap==null ? 'best —' : `best ${fmtTime(p.best_lap)}`;
      return `<div class="leader-row" data-id="${escapeHtml(p.id)}">
        <div class="leader-pos">${p.finish_order ? '#'+p.finish_order : p.position}</div>
        <div class="leader-dot" style="background:${p.color}"></div>
        <div class="leader-name"><strong>${escapeHtml(p.name)}${p.connected?'':' · offline'}</strong><span>${finish}</span></div>
        <div class="leader-meta"><strong>${p.finish_time!=null?fmtTime(p.finish_time):Math.round(p.speed*0.55)+' km/h'}</strong><span>${best}</span></div>
      </div>`;
    }).join('');
    const template=document.createElement('template');template.innerHTML=markup;for(const fresh of [...template.content.children]){const row=existing.get(fresh.dataset.id)||fresh;if(row!==fresh&&row.innerHTML!==fresh.innerHTML)row.innerHTML=fresh.innerHTML;leaderboard.appendChild(row);existing.delete(fresh.dataset.id);}for(const row of existing.values())row.remove();for(const row of leaderboard.children){const old=previous.get(row.dataset.id),dy=old===undefined?30:old-row.offsetTop;if(dy)row.animate([{transform:`translateY(${dy}px)`,opacity:old===undefined?0:1},{transform:'translateY(0)',opacity:1}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});}
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
function drawTrack(ctx){ctx.clearRect(0,0,1600,900);const field=ctx.createLinearGradient(0,0,1600,900);field.addColorStop(0,'#153f3b');field.addColorStop(.5,'#16362d');field.addColorStop(1,'#14213b');ctx.fillStyle=field;ctx.fillRect(0,0,1600,900);const t=KartTrack;function path(){ctx.beginPath();t.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}ctx.lineJoin='round';ctx.lineCap='round';
 // Landscape is cached; seeded positions keep it stable between frames/resizes.
 for(let y=12;y<900;y+=22)for(let x=12;x<1600;x+=22){ctx.fillStyle=((x*17+y*31)%7)<3?'#a9dda508':'#00000009';ctx.fillRect(x,y,9,2);}
 for(let y=40;y<900;y+=110)for(let x=35;x<1600;x+=105){const xx=x+Math.sin(y*.3+x)*15,yy=y+Math.cos(x*.2)*12;if(t.nearest(xx,yy).distance<t.width/2+46||(xx>340&&xx<730&&yy>390&&yy<590))continue;ctx.fillStyle='#071c2350';ctx.beginPath();ctx.ellipse(xx+5,yy+9,21,14,0,0,7);ctx.fill();ctx.fillStyle='#21614b';ctx.beginPath();ctx.arc(xx,yy,18,0,7);ctx.fill();ctx.fillStyle='#388368';ctx.beginPath();ctx.arc(xx-5,yy-5,12,0,7);ctx.fill();ctx.fillStyle='#7ea98a44';ctx.beginPath();ctx.arc(xx-7,yy-8,5,0,7);ctx.fill();}
 path();ctx.strokeStyle='#51e9df';ctx.lineWidth=t.width+22;ctx.shadowColor='#30dbd4';ctx.shadowBlur=22;ctx.stroke();ctx.shadowBlur=0;path();ctx.strokeStyle='#081923';ctx.lineWidth=t.width+34;ctx.stroke();path();ctx.strokeStyle='#afc2c044';ctx.lineWidth=t.width+28;ctx.stroke();path();ctx.strokeStyle='#7cf8e8';ctx.lineWidth=t.width+17;ctx.stroke();ctx.setLineDash([20,20]);path();ctx.strokeStyle='#9b79e8';ctx.stroke();ctx.setLineDash([]);path();const asphalt=ctx.createLinearGradient(0,0,0,900);asphalt.addColorStop(0,'#334657');asphalt.addColorStop(.5,'#1f3043');asphalt.addColorStop(1,'#283b52');ctx.strokeStyle=asphalt;ctx.lineWidth=t.width;ctx.stroke();path();ctx.strokeStyle='#e2eadd50';ctx.lineWidth=2;ctx.setLineDash([18,25]);ctx.stroke();ctx.setLineDash([]);
 for(let n=0;n<t.length;n+=115){const p=t.at(n);for(const side of [-1,1]){const x=p.x-Math.sin(p.angle)*(t.width/2+26)*side,y=p.y+Math.cos(p.angle)*(t.width/2+26)*side;ctx.fillStyle='#162536';ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fill();ctx.fillStyle=side>0?'#75e8c8':'#bea2ff';ctx.beginPath();ctx.arc(x-1,y-1,2.5,0,7);ctx.fill();}}
 for(const f of [.07,.40,.68]){const p=t.at(f*t.length);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#c8ff73';for(let i=-1;i<=1;i++)ctx.fillRect(i*18-5,-28,10,56);ctx.restore();}
 const start=t.at(0);ctx.save();ctx.translate(start.x,start.y);ctx.rotate(start.angle);for(let y=-t.width/2;y<t.width/2;y+=14)for(let x=-14;x<14;x+=14){ctx.fillStyle=(Math.round((y+t.width/2)/14)+x/14)%2?'#e7eadd':'#151719';ctx.fillRect(x,y,14,14);}ctx.restore();
 ctx.fillStyle='#102b36';ctx.beginPath();ctx.roundRect(340,405,375,170,22);ctx.fill();ctx.strokeStyle='#8ce1c455';ctx.lineWidth=2;ctx.stroke();for(let row=0;row<3;row++)for(let seat=0;seat<14;seat++){ctx.fillStyle=(seat+row)%3?'#d0776155':'#99d77a66';ctx.fillRect(358+seat*24,548+row*7,17,4);}ctx.textAlign='center';ctx.fillStyle='#d7ff9c';ctx.font='italic 800 29px PartyRubik, system-ui';ctx.fillText('НОЧНОЙ КАРТИНГ',527,470);ctx.fillStyle='#a8c4c3';ctx.font='italic 800 14px PartyRubik, system-ui';ctx.fillText('ПРЯМЫЕ · ШПИЛЬКА · S-ПОВОРОТЫ',527,500);ctx.fillStyle='#79e8c5';ctx.font='800 10px system-ui';ctx.fillText('LOCAL PARTY  •  GRAND PRIX',527,529);
}

let trackArtwork=null,trackArtworkScale=0;
function drawCachedTrack(scale=1){if(!trackArtwork||Math.abs(scale-trackArtworkScale)>.01){trackArtworkScale=scale;trackArtwork=document.createElement('canvas');trackArtwork.width=Math.round(1600*scale);trackArtwork.height=Math.round(900*scale);const cacheContext=trackArtwork.getContext('2d');cacheContext.setTransform(scale,0,0,scale,0,0);drawTrack(cacheContext);}ctx.drawImage(trackArtwork,0,0,1600,900);}
document.fonts?.ready.then(()=>{trackArtwork=null;});
function angleLerp(a,b,t){
  let d=((b-a+Math.PI)%(Math.PI*2))-Math.PI; if(d<-Math.PI)d+=Math.PI*2; return a+d*t;
}
const kartReducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches,kartSkids=Array.from({length:160},()=>({time:-99,x:0,y:0,angle:0}));let kartSkidHead=0,kartEffectTime=0;
function drawKartEffects(){const time=state.race_time||0;if(time<kartEffectTime)for(const p of kartSkids)p.time=-99;kartEffectTime=time;ctx.save();ctx.lineCap='round';ctx.lineWidth=3;for(const p of kartSkids){const age=time-p.time;if(age<0||age>2.5)continue;ctx.globalAlpha=(1-age/2.5)*.4;ctx.strokeStyle='#0c1722';for(const side of [-1,1]){const x=p.x-Math.sin(p.angle)*10*side,y=p.y+Math.cos(p.angle)*10*side;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(p.angle)*13,y-Math.sin(p.angle)*13);ctx.stroke();}}ctx.restore();}
function drawWallImpacts(){const time=state.race_time||0;ctx.save();ctx.lineCap='round';for(const p of state.players){const hit=p.impact;if(!hit)continue;const age=time-hit.time;if(age<0||age>.45)continue;const t=age/.45;ctx.globalAlpha=(1-t)*(1-t);ctx.strokeStyle='#fff2b0';ctx.lineWidth=2;const count=kartReducedMotion?2:10;for(let i=0;i<count;i++){const angle=Math.atan2(-hit.ny,-hit.nx)+(i/(count-1)-.5)*2.5,d=(kartReducedMotion?6:42)*Math.pow(t,.55)*Math.min(1.8,hit.strength/140);const x=hit.x+Math.cos(angle)*d,y=hit.y+Math.sin(angle)*d;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*7*(1-t),y+Math.sin(angle)*7*(1-t));ctx.stroke();}}ctx.restore();}
function drawCars(dt=1/60){
  const smoothing=1-Math.exp(-19.7*dt);
  for(const p of state.players){
    if(state.status !== 'lobby' && !p.in_race) continue;
    let d=displayPositions.get(p.id);
    if(!d){d={x:p.x,y:p.y,angle:p.angle};displayPositions.set(p.id,d);}
    const turn=Math.abs(Math.atan2(Math.sin(p.angle-d.angle),Math.cos(p.angle-d.angle)));d.x += (p.x-d.x)*smoothing;d.y += (p.y-d.y)*smoothing;d.angle=angleLerp(d.angle,p.angle,smoothing);
    if(!kartReducedMotion&&state.status==='racing'&&p.speed>110&&turn>.09&&(state.race_time||0)-(d.lastSkid||-1)>.06){const mark=kartSkids[kartSkidHead++%kartSkids.length];mark.x=d.x;mark.y=d.y;mark.angle=d.angle;mark.time=state.race_time||0;d.lastSkid=mark.time;}
    ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.angle);
    ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=14;ctx.shadowOffsetY=6;
    const spriteCar=window.PartyArt?.draw(ctx,'kart',0,0,29,44,{color:p.color,rotation:Math.PI/2});
    if(!spriteCar){ctx.fillStyle=p.color;roundedRect(-18,-11,36,22,8);ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='#111722';roundedRect(2,-7,9,14,4);ctx.fill();
    ctx.fillStyle='#0A0D12';ctx.fillRect(-13,-15,8,5);ctx.fillRect(6,-15,8,5);ctx.fillRect(-13,10,8,5);ctx.fillRect(6,10,8,5);}
    ctx.restore();
    ctx.textAlign='center';ctx.textBaseline='bottom';ctx.font='italic 800 11px PartyRubik, system-ui';ctx.fillStyle='#fff';ctx.shadowColor='#000';ctx.shadowBlur=5;ctx.fillText(p.name.toUpperCase(),d.x,d.y-19);ctx.shadowBlur=0;
    if(p.position===1 && state.status==='racing'){ctx.font='italic 800 16px PartyRubik, system-ui';ctx.fillText('👑',d.x,d.y-34);}
  }
}
let lastFrameTime=performance.now();
function frame(now){const scale=window.PartyArt?.beginFrame?.(ctx,1600,900)||1;const dt=Math.min(.05,Math.max(0,(now-lastFrameTime)/1000));lastFrameTime=now;drawCachedTrack(scale);drawKartEffects();drawCars(dt);drawWallImpacts();requestAnimationFrame(frame)}
requestAnimationFrame(frame);

