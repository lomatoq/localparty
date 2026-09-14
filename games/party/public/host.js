const westernTownImage=new Image();let westernTownReady=false;westernTownImage.decoding='async';westernTownImage.onload=()=>{westernTownImage.decode().catch(()=>{}).then(()=>{westernTownReady=true;westernBackdrop=null;});};westernTownImage.src='/assets/gameplay/western-town.webp';
const socket=createSocketBus();socket.on('connect',()=>socket.emit('registerHost'));
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');installCanvasCaps(ctx);
const $=id=>document.getElementById(id);let state=null,lastMode='push',rounds=7,joinUrl='',westernCueFlash=null,audioCtx=null;
const lobbyOverlay=$('lobbyOverlay'),resultOverlay=$('resultOverlay'),joinBadge=$('joinBadge'),modeHud=$('modeHud');
const visualClock=new PartyVisualClock(50);
for(let n=5;n<=10;n++){const b=document.createElement('button');b.textContent=n;b.dataset.n=n;if(n===7)b.classList.add('active');b.onclick=()=>{rounds=n;for(const x of $('roundButtons').children)x.classList.toggle('active',Number(x.dataset.n)===n)};$('roundButtons').appendChild(b);}
function useJoinUrl(url){joinUrl=url;$('joinUrl').textContent=url;$('miniUrl').textContent=url.replace(/^https?:\/\//,'');$('qr').innerHTML='';$('miniQr').innerHTML='';new QRCode($('qr'),{text:url,width:176,height:176,correctLevel:QRCode.CorrectLevel.M});new QRCode($('miniQr'),{text:url,width:54,height:54,correctLevel:QRCode.CorrectLevel.M});for(const b of $('ipChoices').children)b.classList.toggle('active',b.dataset.url===url);}
fetch('/api/info').then(r=>r.json()).then(d=>{const cs=d.candidates?.length?d.candidates:[{address:d.lanIp,url:d.controllerUrl}];$('ipChoices').innerHTML=cs.map((c,i)=>`<button data-url="${c.url}" class="${i===0?'active':''}">${c.address}</button>`).join('');$('ipChoices').onclick=e=>{const b=e.target.closest('button[data-url]');if(b)useJoinUrl(b.dataset.url)};useJoinUrl(d.controllerUrl);}).catch(()=>{$('joinUrl').textContent='Открой IP компьютера :3000';});
function escapeHtml(s){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
let lobbyPlayersKey='';function renderPlayers(ps=[]){const key=JSON.stringify(ps.map(p=>[p.id,p.name,p.color,p.handedness]));if(key===lobbyPlayersKey)return;lobbyPlayersKey=key;$('playerCount').textContent=ps.length;$('playerList').innerHTML=ps.length?ps.map(p=>`<div class="player"><span class="swatch" style="background:${p.color};color:${p.color}"></span><span class="pname">${escapeHtml(p.name)}</span>${p.handedness==='left'?'<span class="lefty">LEFTY</span>':''}</div>`).join(''):'<div class="empty">Сканируйте QR первым телефоном.</div>';}
let sharedScoreKey='';
function publishScore(s){
  if(window.parent===window)return;
  const rows=sortPlayers(s.players||[],s.game.mode).map(p=>({id:p.id,name:p.name,score:scoreValue(p,s.game.mode)||0}));
  const key=JSON.stringify(rows);if(key===sharedScoreKey)return;sharedScoreKey=key;
  window.parent.postMessage({type:'party-score',instance:window.parent.PARTY_INSTANCE,rows,label:s.game.mode==='knives'?'Очки':'Победы в раундах'},location.origin);
}
socket.on('lobby',renderPlayers);socket.on('state',s=>{state=s;visualClock.push(s,performance.now());renderPlayers(s.players||[]);updateUI(s);publishScore(s);});
function ensureAudio(){if(!audioCtx)try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch{};audioCtx?.resume?.();}
function beep(real){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=real?'square':'triangle';o.frequency.value=real?880:real===false?220:440;g.gain.setValueAtTime(real ? .16 : .055,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+(real ? .13 : .07));o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+(real ? .14 : .08));}
for(const b of document.querySelectorAll('.mode-card'))b.onclick=()=>{ensureAudio();lastMode=b.dataset.mode;socket.emit('startGame',{mode:lastMode,maxRounds:rounds,shrinkSpeed:document.querySelector('#shrinkSpeed')?.value||'normal'});};
if(new URLSearchParams(location.search).get('mode')==='shrink'){const b=document.querySelector('[data-mode=push]');b.dataset.mode='shrink';}
const chosenMode=new URLSearchParams(location.search).get('mode');
if(['push','shrink','knives','bomb','western'].includes(chosenMode)){
  lastMode=chosenMode;
  document.title=modeName(chosenMode);
  document.querySelector('.topbar .brand').textContent=modeName(chosenMode);
  document.querySelector('#lobbyOverlay h1').textContent=modeName(chosenMode);
  document.querySelector('#lobbyOverlay .hint').textContent='Выберите число раундов и начинайте. Другую игру можно выбрать в общем меню.';
  document.querySelector('.mode-grid').style.gridTemplateColumns='1fr';
  for(const b of document.querySelectorAll('.mode-card')){
    b.hidden=b.dataset.mode!==chosenMode;
    b.style.display=b.hidden?'none':'';
    if(b.dataset.mode===chosenMode)b.querySelector('b').textContent='НАЧАТЬ ИГРУ →';
  }
}
$('rematchBtn').onclick=()=>{ensureAudio();socket.emit('startGame',{mode:lastMode,maxRounds:rounds,shrinkSpeed:document.querySelector('#shrinkSpeed')?.value||'normal'});};$('lobbyBtn').onclick=()=>socket.emit('backToLobby');$('fullscreenBtn').onclick=()=>document.documentElement.requestFullscreen?.();
socket.on('westernCue',d=>{westernCueFlash={text:d.text,real:!!d.real,until:performance.now()+(d.real?2200:520)};beep(!!d.real);});
socket.on('westernShot',d=>beep(!d.falseStart));
function formatTime(v){v=Math.max(0,Math.ceil(v||0));return `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`;}
function modeName(m){return m==='shrink'?'СЖИМАЮЩАЯСЯ АРЕНА':m==='push'?'PUSH PIT':m==='knives'?'COLOR KNIVES':m==='bomb'?'BOMB TAG':m==='western'?'ONE SHOT WESTERN':'LOBBY';}
function scoreValue(p,mode){return mode==='knives'?p.totalScore:p.roundWins;}
function metricText(p,mode){if(mode==='western')return p.bestReactionMs==null?`${p.falseStarts} фальстартов`:`лучшее ${p.bestReactionMs} мс · ${p.falseStarts} фальстартов`;if(mode==='knives')return `${p.roundWins} побед в раундах`;if(mode==='bomb')return `${p.roundWins} выживаний`;return `${p.roundWins} побед в раундах`;}
function sortPlayers(ps,mode){if(mode==='knives')return [...ps].sort((a,b)=>b.totalScore-a.totalScore||b.roundWins-a.roundWins);if(mode==='western')return [...ps].sort((a,b)=>b.roundWins-a.roundWins||(a.bestReactionMs??1e9)-(b.bestReactionMs??1e9)||a.falseStarts-b.falseStarts);return [...ps].sort((a,b)=>b.roundWins-a.roundWins);}
function updateUI(s){
  const g=s.game;if(g.status==='lobby'||!g.mode){lobbyOverlay.classList.remove('hidden');resultOverlay.classList.add('hidden');joinBadge.classList.add('hidden');modeHud.textContent='LOBBY';return;}
  lobbyOverlay.classList.add('hidden');joinBadge.classList.remove('hidden');
  modeHud.textContent=`${modeName(g.mode)} · ${g.round}/${g.maxRounds}${g.status==='playing'&&g.mode!=='western'?` · ${formatTime(g.timer)}`:''}`;
  if(g.status==='countdown')modeHud.textContent=`${modeName(g.mode)} · ${Math.max(1,Math.ceil(g.countdown))}`;
  if(g.status==='between')modeHud.textContent=g.winnerText;
  if(g.status==='finished'){
    resultOverlay.classList.remove('hidden');$('resultText').textContent=g.winnerText||'Матч окончен';const sorted=sortPlayers(s.players,g.mode);
    if($('resultStats').dataset.match!==g.mode+':'+g.round){$('resultStats').dataset.match=g.mode+':'+g.round;$('resultStats').innerHTML=sorted.map((p,i)=>`<div class="stat-row"><b>${i+1}</b><span class="name"><i class="dot" style="background:${p.color}"></i>${escapeHtml(p.name)}</span><span class="metric">${metricText(p,g.mode)}</span><span class="score">${scoreValue(p,g.mode)}</span></div>`).join('');}
  }else {delete $('resultStats').dataset.match;resultOverlay.classList.add('hidden');}
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function bg(){if(document.documentElement.classList.contains('party-managed')){ctx.clearRect(0,0,1280,720);return;}ctx.fillStyle='#080c12';ctx.fillRect(0,0,1280,720);ctx.strokeStyle='rgba(255,255,255,.03)';ctx.lineWidth=1;for(let x=0;x<1280;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,720);ctx.stroke()}for(let y=0;y<720;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1280,y);ctx.stroke()}const gr=ctx.createRadialGradient(640,360,30,640,360,620);gr.addColorStop(0,'rgba(62,89,120,.16)');gr.addColorStop(1,'rgba(0,0,0,.4)');ctx.fillStyle=gr;ctx.fillRect(0,0,1280,720);}
function drawPlayerDisc(p,ghost=false,nameLift=0){ctx.save();ctx.globalAlpha=ghost?.18:1;ctx.translate(p.x,p.y);const sp=Math.hypot(p.vx,p.vy);if(sp>25){ctx.strokeStyle=p.color;ctx.globalAlpha*=.3;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-p.vx*.07,-p.vy*.07);ctx.lineTo(0,0);ctx.stroke();ctx.globalAlpha=ghost?.18:1;}const puckArt=window.PartyArt?.draw(ctx,'puck',0,0,p.radius*2,p.radius*2,{color:p.color});ctx.globalAlpha=puckArt?0:(ghost?.18:1);ctx.shadowBlur=22;ctx.shadowColor=p.color;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#fff8';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#0a0d11';ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();ctx.restore();ctx.fillStyle='#f8fbff';ctx.globalAlpha=ghost?.25:1;ctx.font='italic 800 13px PartyRubik, Rubik, system-ui';ctx.textAlign='center';ctx.fillText(p.name,p.x,p.y-p.radius-13-nameLift,150);ctx.globalAlpha=1;}
const arenaTextures=new Map();
function drawArena(c,r,bombMode=false){
  const key=bombMode?'bomb':'push';let floor=arenaTextures.get(key);
  if(!floor){floor=document.createElement('canvas');floor.width=floor.height=1280;const g=floor.getContext('2d');g.scale(2,2);const light=g.createRadialGradient(230,190,10,320,320,450);light.addColorStop(0,bombMode?'#44303b':'#284750');light.addColorStop(.7,bombMode?'#211c2a':'#142b39');light.addColorStop(1,'#07131e');g.fillStyle=light;g.fillRect(0,0,640,640);g.lineWidth=1;g.strokeStyle='#ffffff07';for(let y=0;y<660;y+=36)for(let x=-36;x<660;x+=42){const xx=x+(y%72?21:0);g.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;const px=xx+24*Math.cos(a),py=y+24*Math.sin(a);i?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();g.stroke();}arenaTextures.set(key,floor);}
  ctx.save();ctx.translate(c.x,c.y);ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(0,10,r+12,r+10,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.save();ctx.clip();ctx.drawImage(floor,-320,-320,640,640);ctx.strokeStyle='#b9e9ef12';ctx.lineWidth=2;for(const rr of [r*.32,r*.65]){ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.stroke();}ctx.restore();
  const rim=ctx.createLinearGradient(-r,-r,r,r);rim.addColorStop(0,bombMode?'#cf8790':'#294852');rim.addColorStop(.45,bombMode?'#543940':'#091c28');rim.addColorStop(1,bombMode?'#ab6675':'#122d39');ctx.strokeStyle=rim;ctx.lineWidth=bombMode?9:5;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  ctx.lineWidth=bombMode?3:1.5;ctx.strokeStyle=bombMode?'#ff6676':'#78d9e9b0';ctx.shadowColor='#5bdef5';ctx.shadowBlur=bombMode?0:7;ctx.beginPath();ctx.arc(0,0,r-(bombMode?6:1),0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  for(let i=0;i<48;i++){const a=i*Math.PI/24;ctx.strokeStyle=i%4===0?(bombMode?'#ffc0bd':'#94cbd55a'):'#d6eaff15';ctx.lineWidth=bombMode?2:1;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r-14),Math.sin(a)*(r-14));ctx.lineTo(Math.cos(a)*(r-21),Math.sin(a)*(r-21));ctx.stroke();}
  ctx.restore();
}
function drawPush(s){drawArena(s.center,s.game.arenaRadius);drawRimDanger(s);for(const p of s.players)if(p.active)drawPlayerDisc(p,!p.alive);drawVisualEvents(s);}
function drawKnifeShape(x,y,a,color,scale=1){if(window.PartyArt?.draw(ctx,'knife',x,y,12*scale,36*scale,{color,rotation:a+Math.PI/2}))return;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.scale(scale,scale);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-7,-5);ctx.lineTo(-2,0);ctx.lineTo(-7,5);ctx.closePath();ctx.fill();ctx.fillStyle='#f2f5f9';ctx.fillRect(-15,-2,10,4);ctx.restore();}
let wheelCache=null,wheelCacheKey='';
function wheelTexture(d){
  const key=JSON.stringify([d.radius,d.sectors]);if(key===wheelCacheKey)return wheelCache;
  wheelCacheKey=key;const size=512,res=3,off=document.createElement('canvas');off.width=off.height=size*res;
  const g=off.getContext('2d');g.scale(res,res);g.translate(size/2,size/2);
  const circle=(r)=>{g.beginPath();g.arc(0,0,r,0,Math.PI*2);};
  let metal=g.createLinearGradient(-220,-220,190,220);metal.addColorStop(0,'#d7e2df');metal.addColorStop(.18,'#5a727a');metal.addColorStop(.45,'#152b38');metal.addColorStop(.73,'#668088');metal.addColorStop(1,'#142a36');
  circle(d.radius+15);g.fillStyle='#030b11';g.fill();circle(d.radius+11);g.fillStyle=metal;g.fill();
  for(const sec of d.sectors){
    g.save();g.beginPath();g.moveTo(0,0);g.arc(0,0,d.radius,sec.start,sec.end);g.closePath();g.clip();
    g.fillStyle=sec.color;g.fillRect(-d.radius,-d.radius,d.radius*2,d.radius*2);
    const enamel=g.createRadialGradient(-65,-90,20,0,0,d.radius);enamel.addColorStop(0,'#ffffff26');enamel.addColorStop(.7,'#ffffff00');enamel.addColorStop(1,'#00101968');g.fillStyle=enamel;g.fillRect(-d.radius,-d.radius,d.radius*2,d.radius*2);
    if(sec.type==='danger'){g.strokeStyle='#26091290';g.lineWidth=8;for(let x=-450;x<450;x+=25){g.beginPath();g.moveTo(x,-230);g.lineTo(x+460,230);g.stroke();}}
    g.strokeStyle='#07121dd9';g.lineWidth=4;g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(sec.start)*d.radius,Math.sin(sec.start)*d.radius);g.stroke();
    g.strokeStyle='#ffffff3b';g.lineWidth=2;g.beginPath();g.arc(0,0,d.radius-8,sec.start+.015,sec.end-.015);g.stroke();g.restore();
  }
  for(let i=0;i<48;i++){const a=i*Math.PI/24;g.strokeStyle=i%4===0?'#e9faffb0':'#bed3de42';g.lineWidth=i%4===0?3:1;g.beginPath();g.moveTo(Math.cos(a)*(d.radius+2),Math.sin(a)*(d.radius+2));g.lineTo(Math.cos(a)*(d.radius+8),Math.sin(a)*(d.radius+8));g.stroke();}
  circle(73);g.fillStyle='#031019cc';g.fill();circle(65);g.fillStyle=metal;g.fill();circle(56);g.fillStyle='#132b39';g.fill();
  g.strokeStyle='#b9d7df55';g.lineWidth=2;circle(48);g.stroke();
  for(let i=0;i<6;i++){const a=i*Math.PI/3;g.beginPath();g.arc(Math.cos(a)*59,Math.sin(a)*59,3,0,Math.PI*2);g.fillStyle='#bcd0d1';g.fill();}
  const hub=g.createRadialGradient(-7,-10,1,0,0,28);hub.addColorStop(0,'#e3efdc');hub.addColorStop(.2,'#8eaba5');hub.addColorStop(.75,'#3c555d');hub.addColorStop(1,'#0b1d2b');circle(29);g.fillStyle=hub;g.fill();
  wheelCache=off;return off;
}
const ninjaThrows=new Map();let ninjaRound=-1;
function ninjaRenderHeight(count){return count<=4?128:count<=8?108:96;}
function drawNinja(p,x,y,a,age,height){const art=window.PartyArt,body=art?.sprite('ninja-body-v1',p.color),arm=art?.sprite('ninja-arm-v1',p.color),h=Math.round(height),bw=Math.round(h*(body?.w||684)/(body?.h||1005)),aw=Math.round(h*.47),ah=Math.round(aw*(arm?.h||153)/(arm?.w||463)),flip=Math.cos(a)>0?-1:1,target=Math.atan2(-Math.sin(a),flip*-Math.cos(a)),active=age>=0&&age<260,wind=active?(age<35?-.8*(1-age/35):age<95?.17*Math.sin((age-35)/60*Math.PI):.25*(age-95)/165):.25,angle=target+wind,sx=-.185*bw,sy=35-h*.55;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.scale(flip,1);art?.draw(ctx,'ninja-body-v1',0,35,bw,h,{color:p.color,pivot:{x:.5,y:1}});ctx.translate(sx,sy);ctx.rotate(angle);art?.draw(ctx,'ninja-arm-v1',0,0,aw,ah,{color:p.color,pivot:{x:.08,y:.5}});if(p.knivesRemaining>0&&!active||active&&age<35)drawKnifeShape(aw*.82,0,0,p.color,.82);ctx.restore();return{x:x+flip*(sx+Math.cos(angle)*aw*.82),y:y+sy+Math.sin(angle)*aw*.82,age};}
function drawKnives(s){
  ctx.save();ctx.translate(640,360);ctx.scale(.88,.88);ctx.translate(-640,-360);
  const d=s.drum,c=s.center;if(ninjaRound!==s.game.round){ninjaThrows.clear();ninjaRound=s.game.round;}const hands=new Map();
  const halo=ctx.createRadialGradient(c.x,c.y,d.radius*.6,c.x,c.y,360);halo.addColorStop(0,'#366e7430');halo.addColorStop(1,'#0e223000');ctx.fillStyle=halo;ctx.fillRect(c.x-380,c.y-380,760,760);
  ctx.save();ctx.translate(c.x,c.y);ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,15,d.radius+21,d.radius+21,0,0,Math.PI*2);ctx.fill();ctx.rotate(d.angle);ctx.drawImage(wheelTexture(d),-256,-256,512,512);
  for(const k of d.stuck){const a=k.localAngle;drawKnifeShape(Math.cos(a)*(d.radius+16),Math.sin(a)*(d.radius+16),a+Math.PI,k.color,1.2);}ctx.restore();
  ctx.save();ctx.beginPath();ctx.arc(c.x,c.y,d.radius+10,0,Math.PI*2);ctx.clip();const keyLight=ctx.createLinearGradient(c.x-180,c.y-210,c.x+160,c.y+210);keyLight.addColorStop(0,'#d7faff55');keyLight.addColorStop(.38,'#c4e6ff0c');keyLight.addColorStop(.72,'#020c1d24');keyLight.addColorStop(1,'#01081760');ctx.fillStyle=keyLight;ctx.fillRect(c.x-250,c.y-250,500,500);ctx.strokeStyle='#ddffffa0';ctx.shadowColor='#8edfff';ctx.shadowBlur=12;ctx.lineWidth=3;ctx.beginPath();ctx.arc(c.x,c.y,d.radius+4,Math.PI*1.05,Math.PI*1.65);ctx.stroke();ctx.restore();
  const count=s.players.filter(p=>p.active).length,ninjaHeight=ninjaRenderHeight(count);
  for(const p of s.players){
    if(!p.active)continue;const a=p.launcherAngle,launcherRadius=332-Math.max(0,-Math.sin(a))*(ninjaHeight-68),x=c.x+Math.cos(a)*launcherRadius,y=c.y+Math.sin(a)*launcherRadius;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,28,Math.round(ninjaHeight*.31),Math.max(8,Math.round(ninjaHeight*.09)),0,0,Math.PI*2);ctx.fill();
    let event=ninjaThrows.get(p.id);if(!event){event={remaining:p.knivesRemaining,time:-Infinity};ninjaThrows.set(p.id,event);}if(p.knivesRemaining<event.remaining){event.time=s.visualTime;}event.remaining=p.knivesRemaining;hands.set(p.id,drawNinja(p,x,y,a,s.visualTime-event.time,ninjaHeight));
    const labelSide=Math.abs(Math.sin(a))>.8,dx=labelSide?Math.round(ninjaHeight*.42):0,dy=labelSide?-8:(Math.sin(a)<0?-Math.round(ninjaHeight*.58):Math.round(ninjaHeight*.53));
    ctx.textAlign=labelSide?'left':'center';ctx.fillStyle='#fff';ctx.font=`italic 800 ${count>8?12:14}px PartyRubik, Rubik, system-ui`;ctx.fillText(p.name,dx,dy,count>8?83:135);
    ctx.fillStyle=p.color;ctx.font=`italic 800 ${count>8?10:12}px PartyRubik, Rubik, system-ui`;ctx.fillText(`${p.knivesRemaining} НОЖЕЙ`,dx,dy+(count>8?15:18),95);ctx.restore();
  }
  for(const original of s.flying){const hand=hands.get(original.ownerId);if(hand&&hand.age<35)continue;const q=hand?Math.min(1,Math.max(0,(hand.age-35)/65)):1,k=hand?{...original,x:hand.x+(original.x-hand.x)*q,y:hand.y+(original.y-hand.y)*q}:original;ctx.save();ctx.strokeStyle=k.color+'80';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(k.x-Math.cos(k.angle)*26,k.y-Math.sin(k.angle)*26);ctx.lineTo(k.x,k.y);ctx.stroke();ctx.restore();drawKnifeShape(k.x,k.y,k.angle,k.color,1.35);}
  drawVisualEvents(s);ctx.restore();
}
function drawVisualEvents(s){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const e of (s.visualEvents||[]).slice(-24)){if(e.kind==='rim-out')continue;
    const t=(s.visualTime-e.time)/1000;if(t<0||t>1)continue;const q=Math.min(1,t/(e.kind==='bomb-explode'?1:.65)),boom=e.kind==='bomb-explode',radius=boom?155:45;
    ctx.save();ctx.globalAlpha=(1-q)*(1-q);ctx.strokeStyle=e.color;ctx.lineWidth=boom?8*(1-q)+2:3*(1-q)+1;ctx.beginPath();ctx.arc(e.x,e.y,4+radius*(1-Math.pow(1-q,3)),0,Math.PI*2);ctx.stroke();
    if(!reduced){const n=boom?22:9;for(let i=0;i<n;i++){const a=i*Math.PI*2/n+e.id*.37,travel=(18+radius*.75)*(1-Math.exp(-t*5))*(.65+(i%3)*.2);ctx.fillStyle=i%3===0?'#fff1c2':e.color;ctx.beginPath();ctx.arc(e.x+Math.cos(a)*travel,e.y+Math.sin(a)*travel+t*t*55,Math.max(.4,(boom?5:3)*(1-q)),0,Math.PI*2);ctx.fill();}}
    const label=e.label?.replace('YOUR COLOR','СВОЙ ЦВЕТ').replace('WRONG COLOR','ЧУЖОЙ ЦВЕТ').replace('DANGER','ОПАСНО').replace('CLANG','РИКОШЕТ').replace('MISS','МИМО');
    if(label){ctx.globalAlpha=1-q;ctx.font='italic 800 13px PartyRubik, Rubik, system-ui';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.shadowColor='#061019';ctx.shadowBlur=5;ctx.fillText(label,e.x,e.y-23-t*24,160);}ctx.restore();
  }
}
function drawBombIcon(x,y,t=0){const sz=64*(1+Math.sin(t*12)*.025),frame=window.PartyArt?.sprite('bomb'),sw=sz*(frame?.w||312)/(frame?.h||480);if(window.PartyArt?.draw(ctx,'bomb',x,y-5,sw,sz)){const fx=x+sw*.29,fy=y-5-sz*.31;ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<7;i++){const q=(t*2.7+i/7)%1,a=-Math.PI*.95+i*.37,travel=q*18;ctx.globalAlpha=(1-q)*.9;ctx.strokeStyle=i%2?'#ffb947':'#fff2b0';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(fx+Math.cos(a)*travel,fy+Math.sin(a)*travel+q*q*8);ctx.lineTo(fx+Math.cos(a)*(travel+3),fy+Math.sin(a)*(travel+3)+q*q*8);ctx.stroke();}ctx.restore();return;}ctx.save();ctx.translate(x,y);const pulse=1+Math.sin(t*12)*.06;ctx.scale(pulse,pulse);ctx.shadowBlur=24;ctx.shadowColor='#ff596b';ctx.fillStyle='#111318';ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#ff6675';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(10,-14);ctx.quadraticCurveTo(21,-28,27,-17);ctx.stroke();ctx.fillStyle='#ffbc4b';ctx.beginPath();ctx.arc(28,-18,4,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawBomb(s){const b=s.bomb,c=s.center;drawArena(c,b.arenaRadius,true);for(const o of b.obstacles){ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(3,7,o.r+4,o.r+3,0,0,Math.PI*2);ctx.fill();const metal=ctx.createLinearGradient(-o.r,-o.r,o.r,o.r);metal.addColorStop(0,'#ac8b96');metal.addColorStop(.25,'#6c5065');metal.addColorStop(1,'#272433');ctx.fillStyle=metal;ctx.beginPath();ctx.arc(0,0,o.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e8bac73b';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#3b2c3b';ctx.beginPath();ctx.arc(0,0,o.r-7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#bd879861';ctx.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/2+.78;ctx.fillStyle='#b8a3a5';ctx.beginPath();ctx.arc(Math.cos(a)*(o.r-4),Math.sin(a)*(o.r-4),2,0,Math.PI*2);ctx.fill();}ctx.restore();}
  for(const p of s.players){if(!p.active)continue;drawPlayerDisc(p,!p.alive,p.alive&&p.id===b.holderId?65:0);if(p.alive&&p.id===b.holderId){ctx.save();ctx.strokeStyle='#ff6372';ctx.lineWidth=6;ctx.shadowBlur=28;ctx.shadowColor='#ff4d5f';ctx.beginPath();ctx.arc(p.x,p.y,p.radius+13+Math.sin(s.visualTime/90)*3,0,Math.PI*2);ctx.stroke();ctx.restore();drawBombIcon(p.x,p.y-50,s.visualTime/1000);}}
  for(const e of b.explosions){const q=Math.min(1,e.t/e.ttl),r=40+q*180;ctx.save();ctx.globalAlpha=1-q;ctx.lineWidth=14*(1-q)+3;ctx.strokeStyle='#ff724e';ctx.beginPath();ctx.arc(e.x,e.y,r,0,Math.PI*2);ctx.stroke();ctx.fillStyle=`rgba(255,201,77,${(1-q)*.16})`;ctx.beginPath();ctx.arc(e.x,e.y,r*.72,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.textAlign='center';ctx.fillStyle='#e4b0b72c';ctx.font='italic 800 18px PartyRubik, Rubik, system-ui';ctx.fillText('ПЕРЕДАЙ БОМБУ',c.x,c.y+8);
}
let westernViewWidth=1280;let westernBackdrop=null,westernBackdropScale=0,westernBlurred=null,westernFocus=0,westernFocusStamp=0,westernFocusPhase="",westernFocusLast=0;
function drawWesternBackdrop(){
  const scale=canvas.width/1280;
  if(!westernBackdrop||Math.abs(scale-westernBackdropScale)>.05){
    westernBackdropScale=scale;const off=document.createElement('canvas');off.width=Math.ceil(1280*scale);off.height=Math.ceil(720*scale);const g=off.getContext('2d');g.scale(scale,scale);
    const sky=g.createLinearGradient(0,0,0,540);sky.addColorStop(0,'#171a30');sky.addColorStop(.48,'#8d4c51');sky.addColorStop(.78,'#d18a5b');sky.addColorStop(1,'#edb878');g.fillStyle=sky;g.fillRect(0,0,1280,720);
    const sun=g.createRadialGradient(1020,238,20,1020,238,220);sun.addColorStop(0,'#ffe7acaa');sun.addColorStop(.3,'#ffc77955');sun.addColorStop(1,'#ffbb6600');g.fillStyle=sun;g.fillRect(770,0,500,500);g.fillStyle='#ffdab0';g.beginPath();g.arc(1020,238,53,0,Math.PI*2);g.fill();
    const mesa=(x,y,w,h,color)=>{g.fillStyle=color;g.beginPath();g.moveTo(x,y);g.lineTo(x+w*.18,y-h*.55);g.lineTo(x+w*.26,y-h*.57);g.lineTo(x+w*.31,y-h);g.lineTo(x+w*.72,y-h*.97);g.lineTo(x+w*.78,y-h*.62);g.lineTo(x+w*.84,y-h*.6);g.lineTo(x+w,y);g.closePath();g.fill();};
    for(let i=0;i<7;i++)mesa(i*215-50,422,300,75+(i%3)*32,'#9a655b');for(let i=0;i<5;i++)mesa(i*330-95,450,340,110+(i%2)*45,'#72464b');
    const soil=g.createLinearGradient(0,425,0,720);soil.addColorStop(0,'#704842');soil.addColorStop(.3,'#443039');soil.addColorStop(1,'#1a1b28');g.fillStyle=soil;g.fillRect(0,430,1280,290);
    g.strokeStyle='#d29a6930';g.lineWidth=2;for(let x=-1000;x<2300;x+=180){g.beginPath();g.moveTo(640+(x-640)*.12,432);g.lineTo(x,720);g.stroke();}for(let i=1;i<8;i++){const y=430+Math.pow(i/8,1.7)*290;g.strokeStyle=i%2?'#100e1938':'#eac5971a';g.beginPath();g.moveTo(0,y);g.lineTo(1280,y);g.stroke();}
    const saloon=(x,flip)=>{g.save();g.translate(x,0);g.scale(flip,1);g.fillStyle='#2a202b';g.fillRect(0,320,200,180);g.fillStyle='#513538';g.fillRect(0,312,205,18);g.fillRect(25,277,145,36);g.fillStyle='#7b4c43';g.fillRect(20,270,155,9);g.fillStyle='#181924';g.fillRect(65,406,65,94);g.fillStyle='#e5ab6380';for(const xx of [25,140]){g.fillRect(xx,352,33,40);g.fillStyle='#2d222c';g.fillRect(xx+15,352,3,40);g.fillRect(xx,370,33,3);g.fillStyle='#e5ab6380';}g.fillStyle='#1e1c27';g.fillRect(-10,420,225,11);for(const xx of [0,192])g.fillRect(xx,423,9,100);g.strokeStyle='#97645155';g.lineWidth=2;for(let y=335;y<415;y+=15){g.beginPath();g.moveTo(0,y);g.lineTo(200,y);g.stroke();}g.restore();};saloon(0,1);saloon(1280,-1);
    for(const [x,y,sz] of [[275,440,1],[1145,480,1.4],[113,544,.7]]){g.save();g.translate(x,y);g.scale(sz,sz);g.strokeStyle='#292a31';g.lineCap='round';g.lineWidth=11;g.beginPath();g.moveTo(0,0);g.lineTo(0,-70);g.moveTo(0,-30);g.lineTo(-18,-30);g.lineTo(-18,-48);g.moveTo(0,-45);g.lineTo(16,-45);g.lineTo(16,-59);g.stroke();g.restore();}
    for(let i=0;i<120;i++){const x=(i*193)%1280,y=450+((i*97)%260);g.fillStyle=i%2?'#edb9820b':'#100f1922';g.fillRect(x,y,2+i%8,1);}
    if(westernTownReady){g.drawImage(westernTownImage,0,0,1280,720);const tint=g.createLinearGradient(0,0,0,720);tint.addColorStop(0,'#101c3544');tint.addColorStop(.65,'#101c3500');tint.addColorStop(1,'#241a1644');g.fillStyle=tint;g.fillRect(0,0,1280,720);}
    westernBackdrop=off;westernBlurred=document.createElement('canvas');westernBlurred.width=off.width;westernBlurred.height=off.height;const blur=westernBlurred.getContext('2d');blur.filter='blur('+8*scale+'px)';blur.drawImage(off,-18*scale,-18*scale,off.width+36*scale,off.height+36*scale);
  }
  ctx.drawImage(westernBackdrop,-(westernViewWidth-1280)/2,0,westernViewWidth,720);
}
let westernPoseRound=null;const westernDeaths=new Map(),westernAlive=new Map(),westernFalls=new Map();
function westernPositions(count){const rows=count>8?2:1,cols=Math.ceil(count/rows);return Array.from({length:count},(_,i)=>{const row=Math.floor(i/cols),col=i%cols,n=Math.min(cols,count-row*cols),x=n===1?640:n===2?380+col*520:170+col*940/(n-1);return{x,y:rows===1?570:row?638:470,scale:rows===1?Math.min(1.61,(940/Math.max(1,n-1)-22)/131):.75,flip:x<640?1:-1,labelWidth:n===2?230:Math.min(170,940/n)};});}
function drawWestern(s){
  const w=s.western;drawWesternBackdrop();const focusPhase=s.game.status==='playing'?w.phase:s.game.status;if(focusPhase!==westernFocusPhase){westernFocusPhase=focusPhase;westernFocusStamp=s.visualTime;}const focusDt=Math.max(0,Math.min(.05,(s.visualTime-westernFocusLast)/1000));westernFocusLast=s.visualTime;const focusTarget=matchMedia('(prefers-reduced-motion: reduce)').matches?0:focusPhase==='waiting'?Math.min(1,(s.visualTime-westernFocusStamp)/2200):focusPhase==='draw'?1:0;westernFocus+=(focusTarget-westernFocus)*(1-Math.exp(-focusDt*7));if(westernBlurred&&westernFocus>.001){ctx.save();ctx.globalAlpha=westernFocus*.9;ctx.drawImage(westernBlurred,-(westernViewWidth-1280)/2,0,westernViewWidth,720);ctx.restore();}ctx.fillStyle='#080b10';ctx.fillRect(-(westernViewWidth-1280)/2,0,westernViewWidth,205*westernFocus);ctx.fillRect(-(westernViewWidth-1280)/2,720-(s.players.length>8?18:64)*westernFocus,westernViewWidth,64*westernFocus);
  ctx.fillStyle='#fff2de';ctx.textAlign='center';ctx.font='italic 800 16px PartyRubik, Rubik, system-ui';ctx.fillText('ОДНА ПУЛЯ · СТРЕЛЯЙ ТОЛЬКО НА DRAW!',640,105);
  const active=s.players.filter(p=>p.active),poses=westernPositions(active.length),roundKey=s.game.round;
  if(westernPoseRound!==roundKey){westernPoseRound=roundKey;westernDeaths.clear();westernAlive.clear();westernFalls.clear();}
  window.westernRigFrame=[];
  active.forEach((p,i)=>{if(westernAlive.get(p.id)===true&&!p.alive)westernFalls.set(p.id,s.visualTime);if(westernAlive.get(p.id)===true&&!p.alive&&!p.falseStart&&w.shots?.length)westernDeaths.set(p.id,s.visualTime);westernAlive.set(p.id,p.alive);
   const pose=poses[i],{x,y,scale,flip}=pose,age=p.shotThisRound?s.visualTime-p.shotVisualTime:Infinity,dead=!p.alive,fallAge=s.visualTime-(westernFalls.get(p.id)||s.visualTime)-(p.falseStart?220:0),fall=dead?1-(1-Math.min(1,Math.max(0,fallAge)/420))**3:0,height=150*scale;
   ctx.save();ctx.shadowColor='#17101488';ctx.shadowBlur=9;ctx.fillStyle='#20140c66';ctx.beginPath();ctx.ellipse(x-flip*height*.34*fall,y+8*scale,39*scale,9*scale,0,0,7);ctx.fill();ctx.restore();
   const muzzle=westernRigActor(ctx,{x,y,height,color:p.color,flip,shotAge:age,early:p.falseStart,fall});window.westernRigFrame.push({id:p.id,height,flip,fall,muzzle,alive:p.alive});const target=poses.filter(q=>q.y===y&&flip*(q.x-x)>0).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0]||pose;if(p.shotThisRound)westernShotFX(ctx,muzzle,{x:target.x,y:target.y-height*.54},age,p.falseStart,scale);
   const hitAge=s.visualTime-westernDeaths.get(p.id);if(hitAge>=0&&hitAge<340){ctx.save();ctx.translate(x,y-height*.54);ctx.globalAlpha=(1-hitAge/340)**2;ctx.strokeStyle='#d83c4f';ctx.lineWidth=4;for(let n=0;n<8;n++){const angle=n*Math.PI/4,r=8+hitAge*.10;ctx.beginPath();ctx.moveTo(Math.cos(angle)*r,Math.sin(angle)*r);ctx.lineTo(Math.cos(angle)*(r+9),Math.sin(angle)*(r+9));ctx.stroke();}ctx.restore();}if(hitAge>=0&&hitAge<2200){ctx.save();ctx.globalAlpha=.45*Math.min(1,(2200-hitAge)/600);ctx.fillStyle='#9e2534';ctx.beginPath();ctx.ellipse(x,y+8,22*scale,6*scale,0,0,7);ctx.fill();ctx.restore();}
   ctx.fillStyle=dead?'#ffcfb4':'#fff';ctx.font='italic 800 '+(active.length>8?11:14)+'px PartyRubik, Rubik, system-ui';ctx.textAlign='center';ctx.fillText(p.name,x,y+(active.length>8?32:58),pose.labelWidth);ctx.fillText(dead?(p.falseStart?'РАНО — ВЫБЫЛ':'НЕ УСПЕЛ'):p.reactionMs!=null?p.reactionMs+' мс':'ГОТОВ',x,y+(active.length>8?50:78),pose.labelWidth);
  });
  let cue=null,real=false;if(westernCueFlash&&performance.now()<westernCueFlash.until){cue=westernCueFlash.text;real=westernCueFlash.real;}else if(w.cue){cue=w.cue;real=w.cueReal;}
  if(cue&&s.game.status==='playing'){ctx.save();const isDraw=real&&cue==='DRAW!';ctx.fillStyle=isDraw?'#ffdf72':'#f4c898';ctx.shadowBlur=isDraw?45:15;ctx.shadowColor=isDraw?'#ff5b2e':'#000';ctx.font=`italic 800 ${isDraw?112:64}px PartyRubik, Rubik, system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(cue,640,280);ctx.shadowBlur=0;if(!isDraw){ctx.fillStyle='#ffd9b066';ctx.font='italic 800 14px PartyRubik, Rubik, system-ui';ctx.fillText('FAKE?',640,335);}ctx.restore();}
}
function drawCenterText(s){const g=s.game;if(g.status==='countdown'){ctx.fillStyle='#fff';ctx.font='italic 800 116px PartyRubik, Rubik, system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=25;ctx.shadowColor='#000';ctx.fillText(String(Math.max(1,Math.ceil(g.countdown))),640,360);ctx.shadowBlur=0;}else if(g.status==='between'){ctx.fillStyle='#080b10dd';roundRect(300,g.mode==='western'?145:305,680,110,24);ctx.fill();ctx.strokeStyle='#ffffff22';ctx.stroke();ctx.fillStyle='#fff';ctx.font='italic 800 27px PartyRubik, Rubik, system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(g.winnerText,640,g.mode==='western'?200:360,630);}}
function drawScore(s){
  if(window.parent!==window)return;
  if(!s.game.mode||s.game.status==='lobby')return;const ps=sortPlayers(s.players,s.game.mode).slice(0,10);let y=96;ctx.textAlign='left';for(const p of ps){ctx.fillStyle='#0a1019cc';roundRect(22,y,245,34,11);ctx.fill();ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(39,y+17,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#edf2f8';ctx.font='italic 800 12px PartyRubik, Rubik, system-ui';ctx.fillText(p.name,52,y+21,135);ctx.textAlign='right';ctx.font='italic 800 12px PartyRubik, Rubik, system-ui';let txt=s.game.mode==='knives'?String(p.totalScore):s.game.mode==='western'?(p.bestReactionMs==null?`${p.roundWins} W`:`${p.roundWins} W · ${p.bestReactionMs}ms`):`${p.roundWins} W`;ctx.fillText(txt,254,y+21);ctx.textAlign='left';y+=40;}
}
const feltVisualEvents=new Set();
function emitReliableFeelEvents(s){
  for(const e of (s.visualEvents||[])){
    if(feltVisualEvents.has(e.id))continue;feltVisualEvents.add(e.id);if(feltVisualEvents.size>64)feltVisualEvents.delete(feltVisualEvents.values().next().value);
    const type=e.kind==='rim-out'?'out-of-bounds':e.kind==='bomb-explode'?'explosion':e.kind==='knife-hit'?'hit':'collision';
    window.LocalPartyFeel?.emit(type,{id:`party:${e.id}`,x:e.x/1280,y:e.y/720,color:e.color,intensity:e.kind==='bomb-explode'?.9:e.kind==='rim-out'?.72:.46,shake:e.kind!=='bomb-pass'});
  }
}
function render(){
  westernViewWidth=(chosenMode||state?.game.mode)==='western'?Math.max(1280,720*canvas.clientWidth/Math.max(1,canvas.clientHeight)):1280;window.PartyArt?.beginFrame(ctx,westernViewWidth,720);ctx.save();if(state?.game.mode==='western')ctx.translate((westernViewWidth-1280)/2,0);
  ctx.textBaseline='alphabetic';
  const view=visualClock.sample(performance.now())||state;
  if(!state||state.game.mode!=='western')bg();
  if(view){emitReliableFeelEvents(view);if((view.game.mode==='push'||view.game.mode==='shrink'))drawPush(view);else if(view.game.mode==='knives')drawKnives(view);else if(view.game.mode==='bomb'){drawBomb(view);drawVisualEvents(view);}else if(view.game.mode==='western')drawWestern(view);drawScore(view);drawCenterText(view);}ctx.restore();requestAnimationFrame(render);
}
render();

if(chosenMode==='shrink'){const l=document.createElement('label');l.style.cssText='display:block;margin:16px 0;font-size:18px';l.innerHTML='Темп арены <select id="shrinkSpeed" style="min-height:54px;font:inherit;padding:12px"><option value="normal">Обычный · 8 с пауза + 45 с сжатие</option><option value="fast">Быстрый · сразу, за 20 с</option></select>';document.querySelector('.mode-grid').before(l);}

function installCanvasCaps(context){const draw=context.fillText.bind(context),measure=context.measureText.bind(context);context.fillText=(text,...args)=>draw(String(text??'').toLocaleUpperCase('ru-RU'),...args);context.measureText=text=>measure(String(text??'').toLocaleUpperCase('ru-RU'));}



function westernGunBurst(g,x,y,age,flip,scale=1){const t=Math.min(1,age/220);g.save();g.translate(x,y);g.globalAlpha=(1-t)**2;g.fillStyle='#ffcc66';g.beginPath();g.arc(0,0,(6+17*Math.sin(t*Math.PI))*scale,0,7);g.fill();for(let i=0;i<12;i++){const a=i*2.399,r=(12+70*t)*scale;g.strokeStyle=i%3?'#ff8b39':'#fff0ad';g.lineWidth=3*scale;g.beginPath();g.moveTo(Math.cos(a)*r,Math.sin(a)*r);g.lineTo(Math.cos(a)*(r+9*scale),Math.sin(a)*(r+9*scale));g.stroke();}g.globalAlpha=.35*(1-t);g.fillStyle='#50453f';g.beginPath();g.arc(-flip*t*12,-t*30,12+20*t,0,7);g.fill();g.restore();}

function westernRigActor(g,{x,y,height,color,flip=1,shotAge=Infinity,early=false,fall=0}){
 const art=window.PartyArt,body=art?.sprite('cowboy-body-v2',color),arm=art?.sprite('cowboy-arm-pistol-v2',color),bodyMeta=art?.manifest?.frames?.['cowboy-body-v2'],armMeta=art?.manifest?.frames?.['cowboy-arm-pistol-v2'];
 const rig=bodyMeta?.rig,ready=!!(body&&arm&&rig&&armMeta.muzzle),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const aim=early?0:Number.isFinite(shotAge)?1-(1-Math.min(1,Math.max(0,shotAge)/60))**3:0,recoilAge=shotAge-60,recoil=recoilAge>=0&&recoilAge<160&&!early&&!reduced?4*Math.sin(recoilAge/160*Math.PI):0;
 const phi=-1.18*fall,bwContact=height*(body?.w||909)/(body?.h||1320),contactHull=[[0.0011,0.2606],[0.0022,0.2485],[0.0044,0.2394],[0.0099,0.2273],[0.0132,0.2212],[0.0154,0.2182],[0.0176,0.2152],[0.0198,0.2121],[0.0253,0.2061],[0.0308,0.2],[0.0341,0.197],[0.0407,0.1909],[0.0451,0.1879],[0.0627,0.1758],[0.2574,0.0545],[0.2629,0.0515],[0.2761,0.0455],[0.2838,0.0424],[0.2937,0.0394],[0.3135,0.0333],[0.3267,0.0303],[0.3421,0.0273],[0.3619,0.0242],[0.3872,0.0212],[0.5556,0.003],[0.6359,0.003],[0.6535,0.0061],[0.6634,0.0091],[0.6722,0.0121],[0.9417,0.1242],[0.9483,0.1273],[0.9549,0.1303],[0.9648,0.1364],[0.9692,0.1394],[0.9725,0.1424],[0.9824,0.1515],[0.989,0.1606],[0.9923,0.1667],[0.9956,0.1758],[0.9967,0.1818],[0.9967,0.197],[0.8394,0.9606],[0.8383,0.9636],[0.8328,0.9667],[0.824,0.9697],[0.8141,0.9727],[0.802,0.9758],[0.7877,0.9788],[0.7712,0.9818],[0.7492,0.9848],[0.4763,0.997],[0.4059,0.997],[0.3817,0.9939],[0.308,0.9818],[0.2926,0.9788],[0.2816,0.9758],[0.2728,0.9727],[0.2662,0.9697],[0.264,0.9667],[0.0077,0.2848],[0.0055,0.2788],[0.0022,0.2697]],lift=-Math.max(...contactHull.map(([px,py])=>(px-.5)*bwContact*Math.sin(phi)+(py-1)*height*Math.cos(phi)));g.save();g.translate(x,y+lift);g.scale(flip,1);g.rotate(phi);g.globalAlpha=1-fall*.20;
 let mx,my,angle;
 if(ready){const bw=height*body.w/body.h,aw=height*rig.armWidthRatio*1.3,ah=aw*arm.h/arm.w,shoulder={x:(rig.shoulder.x-.5)*bw,y:(rig.shoulder.y-1)*height},pivot=armMeta.pivot||{x:.1,y:.5};angle=1.05*(1-aim)-recoil*.012;
  art.draw(g,'cowboy-body-v2',0,0,bw,height,{color,pivot:{x:.5,y:1}});g.save();g.translate(shoulder.x,shoulder.y);g.rotate(angle);g.translate(-recoil,0);art.draw(g,'cowboy-arm-pistol-v2',0,0,aw,ah,{color,pivot});g.restore();const ax=(armMeta.muzzle.x-pivot.x)*aw-recoil,ay=(armMeta.muzzle.y-pivot.y)*ah;mx=shoulder.x+ax*Math.cos(angle)-ay*Math.sin(angle);my=shoulder.y+ax*Math.sin(angle)+ay*Math.cos(angle);
 }else{const f=art?.sprite('cowboy',color),bw=height*(f?.w||352)/(f?.h||404);if(!art?.draw(g,'cowboy',0,0,bw,height,{color,pivot:{x:.5,y:1}})){g.fillStyle=color;g.fillRect(-height*.15,-height*.75,height*.30,height*.75);}mx=height*.425;my=-height*.5;angle=0;}
 g.restore();return{x:x+flip*(mx*Math.cos(phi)-my*Math.sin(phi)),y:y+lift+mx*Math.sin(phi)+my*Math.cos(phi),angle:flip===1?angle+phi:Math.PI-angle-phi,ready};
}
function westernShotFX(g,muzzle,target,age,early,scale=1){
 if(early){if(age>=0&&age<220)westernGunBurst(g,muzzle.x,muzzle.y,age,Math.cos(muzzle.angle)>=0?1:-1,scale);return;}
 const t=age-60;if(t<0||t>240)return;const dx=Math.cos(muzzle.angle),dy=Math.sin(muzzle.angle);
 if(t<90){g.save();g.translate(muzzle.x,muzzle.y);g.rotate(muzzle.angle);g.globalAlpha=1-t/90;g.fillStyle='#fff2b5';g.beginPath();g.moveTo(0,-4*scale);g.lineTo((22*(1-t/90)+5)*scale,0);g.lineTo(0,4*scale);g.lineTo(5*scale,0);g.fill();g.restore();}
 if(t<120){const q=t/120,bx=muzzle.x+(target.x-muzzle.x)*q,by=muzzle.y+(target.y-muzzle.y)*q,a=Math.atan2(target.y-muzzle.y,target.x-muzzle.x);g.save();g.strokeStyle='#ffeab4';g.lineWidth=2*scale;g.beginPath();g.moveTo(bx-Math.cos(a)*18*scale,by-Math.sin(a)*18*scale);g.lineTo(bx,by);g.stroke();g.translate(bx,by);g.rotate(a);g.fillStyle='#fff9d9';g.beginPath();g.ellipse(0,0,5*scale,2*scale,0,0,7);g.fill();g.restore();}
 g.save();g.globalAlpha=.18*(1-t/240);g.fillStyle='#d7cec1';g.beginPath();g.arc(muzzle.x+dx*t*.025,muzzle.y+dy*t*.025-t*.025,(4+t*.02)*scale,0,7);g.fill();g.restore();
}


function drawRimDanger(s){const c=s.center,r=s.game.arenaRadius,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='butt';function light(a,span,strength,color){ctx.strokeStyle=color;const n=24;for(let i=0;i<n;i++){const u=(i+.5)/n*2-1,alpha=Math.cos(u*Math.PI/2)**2*strength;if(alpha<.004)continue;const start=a-span+i/n*span*2;ctx.globalAlpha=alpha*.30;ctx.lineWidth=8;ctx.beginPath();ctx.arc(c.x,c.y,r-1,start,start+span*2/n+.001);ctx.stroke();ctx.globalAlpha=alpha;ctx.lineWidth=2;ctx.beginPath();ctx.arc(c.x,c.y,r-1,start,start+span*2/n+.001);ctx.stroke();}}for(const p of s.players){if(!p.active||!p.alive||s.game.status!=='playing')continue;const dx=p.x-c.x,dy=p.y-c.y,d=Math.hypot(dx,dy),near=Math.max(0,Math.min(1,(d-(r-65))/65));if(near<=0)continue;const outward=Math.max(0,(p.vx*dx+p.vy*dy)/Math.max(1,d)),strength=near*(.25+Math.min(1,outward/250)*.65),a=Math.atan2(dy,dx);light(a,.24,strength,p.color);}let count=0;for(const e of(s.visualEvents||[]).slice(-24)){if(e.kind!=='rim-out')continue;const age=(s.visualTime-e.time)/1000;if(age<0||age>.9)continue;count++;const q=age/.9,a=Math.atan2(e.y-c.y,e.x-c.x);light(a,.30,Math.min(1.5,(1-q)**2*1.8),e.color);light(a,.095,(1-q)**3,'#f1fcff');if(!reduced){const wave=.65*(1-Math.exp(-age*4));light(a-wave,.14,(1-q)*.7,e.color);light(a+wave,.14,(1-q)*.7,e.color);for(let i=0;i<6;i++){const angle=a+(i-2.5)*.10,travel=34+(24+(i%3)*15)*(1-Math.exp(-age*6)),x=e.x+Math.cos(angle)*travel,y=e.y+Math.sin(angle)*travel+age*age*25;ctx.globalAlpha=(1-q)**2;ctx.strokeStyle=i%3===0?'#ecffff':e.color;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*5,y+Math.sin(angle)*5);ctx.stroke();}}}ctx.restore();window.pushRimFX={bursts:count,maxParticles:count*(reduced?0:6)};}

