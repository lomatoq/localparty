const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const sceneryCanvas = document.getElementById('kartScenery');
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
let displayPositions = new Map();

function connect(){
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if(msg.type === 'state'){
      observeKartBeats(state,msg);
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

function kartPortrait(node,p){
 const profile=(window.PARTY_ROSTER||[]).find(v=>v.id===p.id)||p;
 const key=JSON.stringify([profile.id,profile.name,profile.avatar]);if(node.dataset.identity===key)return;node.dataset.identity=key;
 let seed=0;for(const c of String(profile.id||profile.name||'driver'))seed=(seed*31+c.charCodeAt(0))>>>0;
 const image=new Image();image.alt='';image.className=profile.avatar?'kart-photo':'kart-mascot';image.src=profile.avatar||window.PartyArt?.mascotSource?.({seed:profile.id||profile.name})||'/assets/avatars/atlas-mascots/mascot-'+String(1+seed%16).padStart(2,'0')+'.webp';node.replaceChildren(image);
}
const leaderRows=new Map();
let leaderOrder='',winnerKey='';
const setText=(node,value)=>{value=String(value);if(node.textContent!==value)node.textContent=value;};
const setValue=(node,key,value)=>{if(node[key]!==value)node[key]=value;};
const kartLabel=(en,ru)=>window.PartyI18n?.language==='ru'?ru:en;
function updateHud(){
  setText(lapTarget,state.laps);
  setValue(lapsInput,'value',String(state.laps));
  setValue(lapsInput,'disabled',state.status!=='lobby');
  setText(raceClock,fmtTime(state.race_time));
  const connected=state.players.filter(p=>p.connected).length;
  setText(playerCount,kartLabel(`${connected} player${connected===1?'':'s'}`,`${connected} гонщиков`));
  setValue(startBtn,'disabled',connected===0||state.status==='countdown'||state.status==='racing');
  setText(startBtn,state.status==='results'?'RACE AGAIN':'START');
  setText(raceStatus,{lobby:'LOBBY',countdown:'GET READY',racing:'RACING',results:'RESULTS'}[state.status]||state.status.toUpperCase());
  countdownEl.classList.toggle('hidden',state.status!=='countdown');
  if(state.status==='countdown')setText(countdownEl,Math.max(1,Math.ceil(state.countdown)));

  const ordered=[...state.players].sort((a,b)=>(a.position||999)-(b.position||999));
  const order=JSON.stringify(ordered.map(p=>p.id)),reorder=order!==leaderOrder,animateRanks=!document.documentElement.classList.contains('party-managed')&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Speed updates do not change row geometry: keep the nodes and read layout
  // only when the ranking actually changes, not on every 50 ms snapshot.
  const previous=new Map();
  if(reorder&&animateRanks)for(const [id,row] of leaderRows)previous.set(id,row.element.offsetTop);
  const ids=new Set(ordered.map(p=>p.id));
  for(const [id,row] of leaderRows)if(!ids.has(id)){row.element.remove();leaderRows.delete(id);}
  leaderboard.classList.add('scroll-area');leaderboard.classList.toggle('empty-state',!ordered.length);
  if(!ordered.length)setText(leaderboard,'Waiting for drivers…');
  else {
    if(!leaderRows.size)leaderboard.textContent='';
    ordered.forEach((p,i)=>{
      let row=leaderRows.get(p.id);
      if(!row){
        const element=document.createElement('div');element.className='leader-row';element.dataset.id=p.id;element.setAttribute('data-hp-theme-preserve','');
        element.innerHTML='<div class="leader-pos"></div><div class="leader-dot" aria-hidden="true"></div><div class="leader-name"><strong class="hp-player-name" data-no-translate></strong><span></span></div><div class="leader-meta"><strong></strong><span></span></div>';
        row={element,position:element.children[0],dot:element.children[1],name:element.children[2].children[0],lap:element.children[2].children[1],speed:element.children[3].children[0],best:element.children[3].children[1]};
        leaderRows.set(p.id,row);
      }
      setText(row.position,p.finish_order?'#'+p.finish_order:p.position);
      if(row.color!==p.color){row.color=p.color;row.element.style.setProperty('--racer-color',p.color);}kartPortrait(row.dot,p);
      setText(row.name,p.name+(p.connected?'':' · offline'));
      setText(row.lap,p.finish_order?kartLabel('FINISH #','ФИНИШ №')+p.finish_order:`${kartLabel('Lap','Круг')} ${Math.min(p.lap+1,state.laps)}/${state.laps}`);
      setText(row.speed,p.finish_time!=null?fmtTime(p.finish_time):Math.round(p.speed*.55)+kartLabel(' km/h',' км/ч'));
      setText(row.best,kartLabel('best ','лучший ')+(p.best_lap==null?'—':fmtTime(p.best_lap)));
      if(leaderboard.children[i]!==row.element)leaderboard.insertBefore(row.element,leaderboard.children[i]||null);
    });
    if(reorder&&animateRanks)for(const row of leaderRows.values()){
      const old=previous.get(row.element.dataset.id),dy=old===undefined?30:old-row.element.offsetTop;
      if(dy)row.element.animate([{transform:`translateY(${dy}px)`,opacity:old===undefined?0:1},{transform:'translateY(0)',opacity:1}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
  }
  leaderOrder=order;
  if(state.status==='results'&&ordered.length){
    const winner=ordered.find(p=>p.finish_order===1)||ordered[0];
    const key=JSON.stringify([winner.id,winner.name,winner.color,winner.finish_time]);
    if(key!==winnerKey){winnerKey=key;winnerBanner.innerHTML=`<div style="font-size:12px;color:#8D96A8;letter-spacing:.14em">WINNER</div><div style="color:${winner.color}">🏁 ${escapeHtml(winner.name)}</div><div style="font-size:14px;margin-top:4px">${winner.finish_time?fmtTime(winner.finish_time):''}</div>`;}
    winnerBanner.classList.remove('hidden');
  }else winnerBanner.classList.add('hidden');
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
 paintTrees(ctx,0,0,1600,900);
 path();ctx.strokeStyle='#51e9df';ctx.lineWidth=t.width+22;ctx.shadowColor='#30dbd4';ctx.shadowBlur=22;ctx.stroke();ctx.shadowBlur=0;path();ctx.strokeStyle='#081923';ctx.lineWidth=t.width+34;ctx.stroke();path();ctx.strokeStyle='#afc2c044';ctx.lineWidth=t.width+28;ctx.stroke();path();ctx.strokeStyle='#7cf8e8';ctx.lineWidth=t.width+17;ctx.stroke();ctx.setLineDash([20,20]);path();ctx.strokeStyle='#9b79e8';ctx.stroke();ctx.setLineDash([]);path();const asphalt=ctx.createLinearGradient(0,0,0,900);asphalt.addColorStop(0,'#334657');asphalt.addColorStop(.5,'#1f3043');asphalt.addColorStop(1,'#283b52');ctx.strokeStyle=asphalt;ctx.lineWidth=t.width;ctx.stroke();path();ctx.strokeStyle='#e2eadd50';ctx.lineWidth=2;ctx.setLineDash([18,25]);ctx.stroke();ctx.setLineDash([]);
 for(let n=0;n<t.length;n+=115){const p=t.at(n);for(const side of [-1,1]){const x=p.x-Math.sin(p.angle)*(t.width/2+26)*side,y=p.y+Math.cos(p.angle)*(t.width/2+26)*side;ctx.fillStyle='#162536';ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fill();ctx.fillStyle=side>0?'#75e8c8':'#bea2ff';ctx.beginPath();ctx.arc(x-1,y-1,2.5,0,7);ctx.fill();}}
 for(const f of [.07,.40,.68]){const p=t.at(f*t.length);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#c8ff73';for(let i=-1;i<=1;i++)ctx.fillRect(i*18-5,-28,10,56);ctx.restore();}
 const start=t.at(0);ctx.save();ctx.translate(start.x,start.y);ctx.rotate(start.angle);for(let y=-t.width/2;y<t.width/2;y+=14)for(let x=-14;x<14;x+=14){ctx.fillStyle=(Math.round((y+t.width/2)/14)+x/14)%2?'#e7eadd':'#151719';ctx.fillRect(x,y,14,14);}ctx.restore();
 ctx.fillStyle='#102b36';ctx.beginPath();ctx.roundRect(340,405,375,170,22);ctx.fill();ctx.strokeStyle='#8ce1c455';ctx.lineWidth=2;ctx.stroke();for(let row=0;row<3;row++)for(let seat=0;seat<14;seat++){ctx.fillStyle=(seat+row)%3?'#d0776155':'#99d77a66';ctx.fillRect(358+seat*24,548+row*7,17,4);}ctx.textAlign='center';ctx.fillStyle='#d7ff9c';ctx.font='italic 800 29px PartyRubik, system-ui';ctx.fillText('НОЧНОЙ КАРТИНГ',527,470);ctx.fillStyle='#a8c4c3';ctx.font='italic 800 14px PartyRubik, system-ui';ctx.fillText('ПРЯМЫЕ · ШПИЛЬКА · S-ПОВОРОТЫ',527,500);ctx.fillStyle='#79e8c5';ctx.font='800 10px HeyPalsText,system-ui';ctx.fillText('LOCAL PARTY  •  GRAND PRIX',527,529);
}

let trackArtwork=null,trackArtworkScale=0;
function drawCachedTrack(scale=1){if(!trackArtwork||Math.abs(scale-trackArtworkScale)>.01){trackArtworkScale=scale;trackArtwork=document.createElement('canvas');trackArtwork.width=Math.round(1600*scale);trackArtwork.height=Math.round(900*scale);const cacheContext=trackArtwork.getContext('2d');cacheContext.setTransform(scale,0,0,scale,0,0);drawTrack(cacheContext);}ctx.drawImage(trackArtwork,0,0,1600,900);}
let groundBackdrop=null,groundBackdropKey='';
function paintGround(g,left,top,right,bottom){
 const field=g.createLinearGradient(0,0,1600,900);
 field.addColorStop(0,'#153f3b');field.addColorStop(.5,'#16362d');field.addColorStop(1,'#14213b');g.fillStyle=field;g.fillRect(left,top,right-left,bottom-top);
 for(let y=Math.floor((top-12)/22)*22+12;y<bottom;y+=22)for(let x=Math.floor((left-12)/22)*22+12;x<right;x+=22){g.fillStyle=((x*17+y*31)%7)<3?'#a9dda508':'#00000009';g.fillRect(x,y,9,2);}
}
let sceneryBackdropKey='';
function paintTrees(g,left,top,right,bottom){
 // One world-anchored grove paints every backing, including partial edge trees.
 const t=KartTrack;
 for(let y=Math.floor((top-72)/110)*110+40;y<bottom+32;y+=110)for(let x=Math.floor((left-67)/105)*105+35;x<right+32;x+=105){
  const xx=x+Math.sin(y*.3+x)*15,yy=y+Math.cos(x*.2)*12;
  if(t.nearest(xx,yy).distance<t.width/2+46||(xx>340&&xx<730&&yy>390&&yy<590))continue;
  g.fillStyle='#071c2350';g.beginPath();g.ellipse(xx+5,yy+9,21,14,0,0,7);g.fill();g.fillStyle='#21614b';g.beginPath();g.arc(xx,yy,18,0,7);g.fill();g.fillStyle='#388368';g.beginPath();g.arc(xx-5,yy-5,12,0,7);g.fill();g.fillStyle='#7ea98a44';g.beginPath();g.arc(xx-7,yy-8,5,0,7);g.fill();
 }
}
function drawSceneryBackdrop(dpr,fit,ox,oy){
 if(!sceneryCanvas?.clientWidth||fit<=0)return;
 const rect=canvas.getBoundingClientRect(),w=sceneryCanvas.clientWidth,h=sceneryCanvas.clientHeight,originX=rect.left+ox,originY=rect.top+oy,key=[w,h,dpr,fit,originX,originY].join(':');
 if(key===sceneryBackdropKey)return;sceneryBackdropKey=key;
 sceneryCanvas.width=Math.round(w*dpr);sceneryCanvas.height=Math.round(h*dpr);
 const g=sceneryCanvas.getContext('2d');g.setTransform(dpr*fit,0,0,dpr*fit,dpr*originX,dpr*originY);
 const left=-originX/fit,top=-originY/fit,right=(w-originX)/fit,bottom=(h-originY)/fit;
 paintGround(g,left,top,right,bottom);
 paintTrees(g,left,top,right,bottom);
}
function drawGroundBackdrop(w,h,dpr,fit,ox,oy){
 const key=[w,h,dpr,fit,ox,oy].join(':');
 if(key!==groundBackdropKey){
  groundBackdropKey=key;groundBackdrop=document.createElement('canvas');groundBackdrop.width=Math.round(w*dpr);groundBackdrop.height=Math.round(h*dpr);
  const g=groundBackdrop.getContext('2d');g.setTransform(dpr*fit,0,0,dpr*fit,dpr*ox,dpr*oy);
  // Continue the authored ground in world coordinates; never stretch a raster edge.
  paintGround(g,-ox/fit,-oy/fit,(w-ox)/fit,(h-oy)/fit);
  paintTrees(g,-ox/fit,-oy/fit,(w-ox)/fit,(h-oy)/fit);
 }
 ctx.drawImage(groundBackdrop,0,0,w,h);
}
document.fonts?.ready.then(()=>{trackArtwork=null;});
function angleLerp(a,b,t){
  let d=((b-a+Math.PI)%(Math.PI*2))-Math.PI; if(d<-Math.PI)d+=Math.PI*2; return a+d*t;
}
const kartReducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches,kartSkids=Array.from({length:160},()=>({time:-99,x:0,y:0,angle:0}));let kartSkidHead=0,kartEffectTime=0;
function drawKartEffects(){const time=state.race_time||0;if(time<kartEffectTime)for(const p of kartSkids)p.time=-99;kartEffectTime=time;ctx.save();ctx.lineCap='round';ctx.lineWidth=3;for(const p of kartSkids){const age=time-p.time;if(age<0||age>2.5)continue;ctx.globalAlpha=(1-age/2.5)*.4;ctx.strokeStyle='#0c1722';for(const side of [-1,1]){const x=p.x-Math.sin(p.angle)*10*side,y=p.y+Math.cos(p.angle)*10*side;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(p.angle)*13,y-Math.sin(p.angle)*13);ctx.stroke();}}ctx.restore();}
function drawWallImpacts(){const time=state.race_time||0;ctx.save();ctx.lineCap='round';for(const p of state.players){const hit=p.impact;if(!hit)continue;const age=time-hit.time;if(age<0||age>.45)continue;const t=age/.45;ctx.globalAlpha=(1-t)*(1-t);ctx.strokeStyle='#fff2b0';ctx.lineWidth=2;const count=kartReducedMotion?2:10;for(let i=0;i<count;i++){const angle=Math.atan2(-hit.ny,-hit.nx)+(i/(count-1)-.5)*2.5,d=(kartReducedMotion?6:42)*Math.pow(t,.55)*Math.min(1.8,hit.strength/140);const x=hit.x+Math.cos(angle)*d,y=hit.y+Math.sin(angle)*d;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*7*(1-t),y+Math.sin(angle)*7*(1-t));ctx.stroke();}}ctx.restore();}
// Race beats from authoritative snapshots only: lap crossings, place gains, finishes and boost pads.
const kartBeat=new Map(),kartPops=[],kartPads=[.07,.40,.68];
function observeKartBeats(prev,next){
  if(next.status!=='racing'&&next.status!=='results'){kartBeat.clear();kartPops.length=0;return;}
  const at=performance.now();
  for(const p of next.players){if(!p.in_race)continue;const old=prev.players?.find(q=>q.id===p.id),b=kartBeat.get(p.id)||{boostUntil:0,trail:[]};kartBeat.set(p.id,b);if(!old||prev.status!=='racing'&&prev.status!=='results')continue;
    if(p.finish_order&&!old.finish_order){kartPops.push({id:p.id,at,text:p.finish_order===1?'WINNER!':'FINISH #'+p.finish_order,color:p.finish_order===1?'#ffd36b':'#ffffff',big:true,flag:true});if(p.finish_order===1)window.LocalPartyFeel?.emit('round-result',{id:'kart-win:'+p.id+':'+Math.round(p.finish_time||0),intensity:.6,shake:false});}
    else if(p.lap>old.lap&&!p.finish_order){const final=p.lap+1===next.laps;kartPops.push({id:p.id,at,text:final?'FINAL LAP':'LAP '+(p.lap+1)+'/'+next.laps,color:final?'#ff8fd0':'#c8ff73',big:final});}
    else if(next.race_time>2&&p.position&&old.position&&p.position<old.position&&!p.finish_order){const previousPop=kartPops.findIndex(pop=>pop.id===p.id&&pop.up);if(previousPop>=0)kartPops.splice(previousPop,1);kartPops.push({id:p.id,at,text:'P'+p.position,color:'#7ee7ff',up:true});}
    if(p.speed-old.speed>28&&!p.offroad&&kartPads.some(f=>{const pad=KartTrack.at(f*KartTrack.length);return Math.hypot(pad.x-p.x,pad.y-p.y)<120;}))b.boostUntil=at+1500;
  }
  while(kartPops.length>10)kartPops.shift();
}
function drawBoostPads(now){if(kartReducedMotion)return;for(const f of kartPads){const p=KartTrack.at(f*KartTrack.length);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#f4ffd6';ctx.shadowColor='#c8ff73';ctx.shadowBlur=14;for(let i=-1;i<=1;i++){const phase=((now/520)-i*.22)%1;ctx.globalAlpha=Math.max(0,Math.sin(phase*Math.PI))*.55;ctx.fillRect(i*18-5,-28,10,56);}ctx.restore();}}
function drawTrails(now){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';for(const p of state.players){const d=displayPositions.get(p.id),b=kartBeat.get(p.id);if(!d||!b)continue;const boosting=b.boostUntil>now,trail=b.trail;trail.push({x:d.x-Math.cos(d.angle)*16,y:d.y-Math.sin(d.angle)*16});const keep=boosting?14:p.speed>150&&state.status==='racing'?7:0;while(trail.length>Math.max(1,keep))trail.shift();if(kartReducedMotion||trail.length<3)continue;
  for(let i=1;i<trail.length;i++){const k=i/trail.length;ctx.globalAlpha=k*(boosting?.7:.22);ctx.strokeStyle=boosting?(i%2?'#ffd36b':'#ff8fd0'):p.color;ctx.lineWidth=(boosting?12:7)*k;ctx.beginPath();ctx.moveTo(trail[i-1].x,trail[i-1].y);ctx.lineTo(trail[i].x,trail[i].y);ctx.stroke();}
  if(boosting){const tail=trail[trail.length-1],flick=.75+.25*Math.sin(now/30);const g=ctx.createRadialGradient(tail.x,tail.y,0,tail.x,tail.y,22*flick);g.addColorStop(0,'rgba(255,240,190,.9)');g.addColorStop(.4,'rgba(255,170,90,.45)');g.addColorStop(1,'rgba(255,120,80,0)');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.arc(tail.x,tail.y,22*flick,0,7);ctx.fill();}}
 ctx.restore();}
function drawKartPops(now){const fit=driverLabelFit;ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';for(let i=kartPops.length-1;i>=0;i--){const e=kartPops[i],t=(now-e.at)/(e.big?1500:1100);if(t>=1){kartPops.splice(i,1);continue;}const d=displayPositions.get(e.id);if(!d)continue;const rise=(1-Math.exp(-t*6))*34/fit,pop=t<.1?.86+t/.1*.2:1.06-Math.min(.06,(t-.1)*.3),size=(e.big?30:22)/fit;ctx.save();ctx.globalAlpha=t>.75?(1-t)/.25:1;ctx.translate(Math.max(driverViewport.left+120/fit,Math.min(driverViewport.right-120/fit,d.x)),Math.max(driverViewport.top+60/fit,d.y-58/fit-rise));ctx.scale(pop,pop);ctx.font=`800 ${size}px KardiaFatRunner, PartyRubik, sans-serif`;const label=e.text;ctx.lineWidth=7/fit;ctx.strokeStyle='#120f22e6';ctx.strokeText(label,0,0);ctx.fillStyle=e.color;ctx.fillText(label,0,0);if(e.up){const w=ctx.measureText(label).width/2+size*.62;ctx.beginPath();ctx.moveTo(-w,size*.28);ctx.lineTo(-w+size*.5,size*.28);ctx.lineTo(-w+size*.25,-size*.26);ctx.closePath();ctx.lineWidth=5/fit;ctx.stroke();ctx.fill();}ctx.restore();
  if(e.flag&&t<.6&&!kartReducedMotion){const start=KartTrack.at(0);for(let j=0;j<16;j++){const a=j*2.39996,r=(20+j%4*14)*Math.pow(t/.6,.6)*3;ctx.globalAlpha=(1-t/.6)*.9;ctx.fillStyle=j%2?'#e7eadd':'#151719';ctx.save();ctx.translate(start.x+Math.cos(a)*r,start.y+Math.sin(a)*r);ctx.rotate(a+t*6);ctx.fillRect(-4,-4,8,8);ctx.restore();}}}
 ctx.restore();}
function drawRacingKart(color,wheelAngle){
  ctx.save();
  ctx.fillStyle='#05111970';ctx.beginPath();ctx.ellipse(1,4,23,15,0,0,Math.PI*2);ctx.fill();
  // Rubber stays dark; only the car shell uses the player's authored color.
  for(const x of [-12,12])for(const y of [-12,12]){
    ctx.save();ctx.translate(x,y);if(x>0)ctx.rotate(wheelAngle);
    ctx.fillStyle='#09151e';roundedRect(-6,-4,12,8,3);ctx.fill();
    ctx.fillStyle='#63717b';roundedRect(-4,-3,8,2,1);ctx.fill();ctx.restore();
  }
  ctx.fillStyle='#0e2029';roundedRect(-21,-10,42,20,7);ctx.fill();
  ctx.fillStyle=color;roundedRect(-17,-10,34,20,8);ctx.fill();
  const shell=ctx.createLinearGradient(0,-10,0,10);shell.addColorStop(0,'#ffffff42');shell.addColorStop(.48,'#ffffff00');shell.addColorStop(1,'#00131d42');
  ctx.fillStyle=shell;roundedRect(-17,-10,34,20,8);ctx.fill();
  ctx.fillStyle='#dcefe6';roundedRect(15,-7,5,14,2);ctx.fill();
  ctx.fillStyle='#13242e';roundedRect(-8,-7,16,14,6);ctx.fill();
  ctx.fillStyle='#e9f2df';ctx.beginPath();ctx.arc(-3,0,5.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1b3549';roundedRect(-1,-3,5,6,2);ctx.fill();
  ctx.fillStyle='#fbf7ca';roundedRect(10,-8,4,3,1);ctx.fill();roundedRect(10,5,4,3,1);ctx.fill();
  ctx.fillStyle='#ff969a';roundedRect(-18,-6,3,4,1);ctx.fill();roundedRect(-18,2,3,4,1);ctx.fill();
  ctx.restore();
}
function drawCars(dt=1/60){
  const smoothing=1-Math.exp(-19.7*dt);
  for(const p of state.players){
    if(state.status !== 'lobby' && !p.in_race) continue;
    let d=displayPositions.get(p.id);
    if(!d){d={x:p.x,y:p.y,angle:p.angle};displayPositions.set(p.id,d);}
    const turn=Math.abs(Math.atan2(Math.sin(p.angle-d.angle),Math.cos(p.angle-d.angle)));d.x += (p.x-d.x)*smoothing;d.y += (p.y-d.y)*smoothing;d.angle=angleLerp(d.angle,p.angle,smoothing);
    if(!kartReducedMotion&&state.status==='racing'&&p.speed>110&&turn>.09&&(state.race_time||0)-(d.lastSkid||-1)>.06){const mark=kartSkids[kartSkidHead++%kartSkids.length];mark.x=d.x;mark.y=d.y;mark.angle=d.angle;mark.time=state.race_time||0;d.lastSkid=mark.time;}
    ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.angle);
    // Broad colored shell, four clear wheels and one helmet read at TV size.
    // Everything shares the same overhead view as the road and collision world.
    drawRacingKart(p.color,Math.max(-.42,Math.min(.42,Math.atan2(Math.sin(p.angle-d.angle),Math.cos(p.angle-d.angle))*2)));
    ctx.restore();
  }
  drawDriverNames();
}
let driverLabelFit=1,driverViewport={left:0,right:1600,top:0,bottom:900};
new ResizeObserver(()=>{const r=canvas.getBoundingClientRect();driverLabelFit=Math.max(.1,Math.min(r.width/1600,r.height/900));driverViewport={left:0,right:1600,top:0,bottom:900};}).observe(canvas);
function drawDriverNames(){
  const fit=driverLabelFit,pad=6/fit,font=14/fit,line=22/fit,gutter=5/fit,used=[],labels=[];
  ctx.save();ctx.font=`550 ${font}px KardiaFit,system-ui`;ctx.textAlign='left';ctx.textBaseline='middle';
  for(const p of state.players){
    if(state.status!=='lobby'&&!p.in_race)continue;
    const d=displayPositions.get(p.id);if(!d)continue;
    let text=p.name;const limit=112/fit;
    if(ctx.measureText(text).width>limit){while(text.length&&ctx.measureText(text+'…').width>limit)text=text.slice(0,-1);text+='…';}
    const w=ctx.measureText(text).width+pad*3+6/fit,h=line;
    let box=null;
    for(let row=0;row<18&&!box;row++)for(const col of [0,-1,1,-2,2]){
      const x=Math.max(driverViewport.left+gutter,Math.min(driverViewport.right-w-gutter,d.x-w/2+col*(w+gutter)));
      const y=Math.max(driverViewport.top+gutter,Math.min(driverViewport.bottom-h-gutter,d.y-29/fit-row*(h+gutter)));
      const r={x,y,w,h};if(!used.some(b=>r.x<b.x+b.w+gutter&&r.x+r.w+gutter>b.x&&r.y<b.y+b.h+gutter&&r.y+r.h+gutter>b.y)){box=r;break;}
    }
    if(!box)continue;
    used.push(box);ctx.fillStyle='#15151bd9';roundedRect(box.x,box.y,box.w,box.h,8/fit);ctx.fill();
    ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(box.x+pad+3/fit,box.y+box.h/2,3/fit,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f8f8fc';ctx.fillText(text,box.x+pad*2+6/fit,box.y+box.h/2);
    labels.push({id:p.id,name:p.name,text,fontPx:font*fit,x:box.x,y:box.y,w:box.w,h:box.h});
  }
  ctx.restore();window.KartNameLabels=labels;
}
let lastFrameTime=performance.now();
function frame(now){
 const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(2,devicePixelRatio||1),fit=Math.min(w/1600,h/900),ox=(w-1600*fit)/2,oy=(h-900*fit)/2;
 drawSceneryBackdrop(dpr,fit,ox,oy);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));}
 ctx.setTransform(dpr,0,0,dpr,0,0);drawGroundBackdrop(w,h,dpr,fit,ox,oy);
 ctx.setTransform(dpr*fit,0,0,dpr*fit,dpr*ox,dpr*oy);const scale=Math.max(1,fit*dpr),dt=Math.min(.05,Math.max(0,(now-lastFrameTime)/1000));lastFrameTime=now;drawCachedTrack(scale);
drawBoostPads(now);drawKartEffects();drawTrails(now);drawCars(dt);drawWallImpacts();drawKartPops(now);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
