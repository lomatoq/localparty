const westernTownImage=new Image();let westernTownReady=false;westernTownImage.decoding='async';westernTownImage.onload=()=>{westernTownImage.decode().catch(()=>{}).then(()=>{westernTownReady=true;westernBackdrop=null;});};westernTownImage.src='/assets/gameplay/western-town.webp';
const socket=createSocketBus();socket.on('connect',()=>socket.emit('registerHost'));
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
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
socket.on('lobby',renderPlayers);socket.on('state',s=>{state=s;visualClock.push(s,performance.now());juiceObserve(s);renderPlayers(s.players||[]);updateUI(s);renderLiveStandings(s);publishScore(s);});
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
socket.on('westernCue',d=>{westernCueFlash={text:d.text,real:!!d.real,until:performance.now()+(d.real?2200:520),at:performance.now()};beep(!!d.real);});
socket.on('westernShot',d=>beep(!d.falseStart));
function formatTime(v){v=Math.max(0,Math.ceil(v||0));return `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`;}
function modeName(m){return m==='shrink'?'СЖИМАЮЩАЯСЯ АРЕНА':m==='push'?'PUSH PIT':m==='knives'?'COLOR KNIVES':m==='bomb'?'BOMB TAG':m==='western'?'ONE SHOT WESTERN':'LOBBY';}
function scoreValue(p,mode){return mode==='knives'?p.totalScore:p.roundWins;}
function metricText(p,mode){if(mode==='western')return p.bestReactionMs==null?`${p.falseStarts} фальстартов`:`лучшее ${p.bestReactionMs} мс · ${p.falseStarts} фальстартов`;if(mode==='knives')return `${p.roundWins} побед в раундах`;if(mode==='bomb')return `${p.roundWins} выживаний`;return `${p.roundWins} побед в раундах`;}
function comparePlayers(a,b,mode){if(mode==='knives')return b.totalScore-a.totalScore||b.roundWins-a.roundWins;if(mode==='western')return b.roundWins-a.roundWins||(a.bestReactionMs??1e9)-(b.bestReactionMs??1e9)||a.falseStarts-b.falseStarts;return b.roundWins-a.roundWins;}
function sortPlayers(ps,mode){return [...ps].sort((a,b)=>comparePlayers(a,b,mode));}
// A tied place uses the same tuple as the existing ordering, including tie-breakers.
function playerPlace(players,index,mode){while(index>0&&comparePlayers(players[index-1],players[index],mode)===0)index--;return index+1;}
function updateUI(s){
  const g=s.game;if(g.status==='lobby'||!g.mode){lobbyOverlay.classList.remove('hidden');resultOverlay.classList.add('hidden');joinBadge.classList.add('hidden');modeHud.textContent='LOBBY';return;}
  lobbyOverlay.classList.add('hidden');joinBadge.classList.remove('hidden');
  modeHud.textContent=`${modeName(g.mode)} · ${g.round}/${g.maxRounds}${g.status==='playing'&&g.mode!=='western'?` · ${formatTime(g.timer)}`:''}`;
  if(g.status==='countdown')modeHud.textContent=`${modeName(g.mode)} · ${Math.max(1,Math.ceil(g.countdown))}`;
  if(g.status==='between')modeHud.textContent=g.winnerText;
  if(g.status==='finished'){
    resultOverlay.classList.remove('hidden');$('resultText').textContent=g.winnerText||'Матч окончен';const sorted=sortPlayers(s.players,g.mode);
    if($('resultStats').dataset.match!==g.mode+':'+g.round){$('resultStats').dataset.match=g.mode+':'+g.round;$('resultStats').innerHTML=sorted.map((p,i)=>{const place=playerPlace(sorted,i,g.mode);return `<div class="stat-row" data-hp-rank="${place}"><b data-place="${place}" data-hp-rank="${place}">${place}</b><span class="name"><i class="dot" style="background:${p.color}"></i>${escapeHtml(p.name)}</span><span class="metric">${metricText(p,g.mode)}</span><span class="score">${scoreValue(p,g.mode)}</span></div>`;}).join('');}
  }else {delete $('resultStats').dataset.match;resultOverlay.classList.add('hidden');}
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
let partyReceiverHeight=720;
const roundBackdropPaths={push:'push-courtyard-v2.png',shrink:'last-circle-chamber-v1.png',knives:'knives-training-floor-v1.png',bomb:'bomb-storage-yard-v1.png'},roundBackdrops=new Map();
const roundEnvironment=$('roundEnvironment');let roundEnvironmentMode=null;
// A passive full-view layer sits behind the narrower arena receiver and rail.
// Decode only the active mode; cover preserves the original aspect on resize.
function alignPushBackdrop(center){
 const entry=roundBackdrops.get('push');if(roundEnvironmentMode!=='push'||!entry?.ready||!center)return;
 const box=roundEnvironment.getBoundingClientRect(),w=box.width,h=box.height,cx=center.x-box.left,seat=637/1672,ratio=entry.image.naturalWidth/entry.image.naturalHeight;
 if(w<=0||h<=0)return;
 // The edited stair seat follows the actual arena, with just enough overscan
 // to cover both edges. This never changes the arena or the canvas projection.
 const width=Math.max(w,h*ratio,cx/seat,(w-cx)/(1-seat)),height=width/ratio,x=cx-seat*width,y=(h-height)/2;
 const size=`${width}px ${height}px`,position=`${x}px ${y}px`;
 if(roundEnvironment.style.backgroundSize!==size)roundEnvironment.style.backgroundSize=size;
 if(roundEnvironment.style.backgroundPosition!==position)roundEnvironment.style.backgroundPosition=position;
 window.PartyPushBackdropProjection={seat,ratio,width,height,x,y,entryCenterX:box.left+x+seat*width,arenaCenterX:center.x,viewport:{width:w,height:h},covered:x<=.01&&x+width>=w-.01&&y<=.01&&y+height>=h-.01};
}
function drawRoundBackdrop(mode){
 const file=roundBackdropPaths[mode];
 if(!file||roundEnvironmentMode!==mode){if(roundEnvironmentMode!==null){roundEnvironment.hidden=true;roundEnvironment.style.backgroundImage='';canvas.style.background='';roundEnvironmentMode=null;}}
 if(!file||!roundEnvironment)return false;
 let entry=roundBackdrops.get(mode);
 if(!entry){const image=new Image();entry={image,ready:false};roundBackdrops.set(mode,entry);image.decoding='async';image.onload=()=>image.decode().then(()=>{entry.ready=image.naturalWidth>0&&image.naturalHeight>0;}).catch(()=>{});image.src='/assets/gameplay/round3/2026-10-03/'+file;}
 if(!entry.ready)return false;
 if(roundEnvironmentMode!==mode){roundEnvironment.style.backgroundImage=`url("${entry.image.src}")`;roundEnvironment.style.backgroundSize='cover';roundEnvironment.style.backgroundPosition='center';roundEnvironment.hidden=false;canvas.style.background='transparent';roundEnvironmentMode=mode;window.PartyPushBackdropProjection=null;}
 return true;
}
function bg(mode){if(drawRoundBackdrop(mode)||document.documentElement.classList.contains('party-managed')){ctx.clearRect(0,0,1280,partyReceiverHeight);return;}ctx.fillStyle='#080c12';ctx.fillRect(0,0,1280,720);ctx.strokeStyle='rgba(255,255,255,.03)';ctx.lineWidth=1;for(let x=0;x<1280;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,720);ctx.stroke()}for(let y=0;y<720;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1280,y);ctx.stroke()}const gr=ctx.createRadialGradient(640,360,30,640,360,620);gr.addColorStop(0,'rgba(62,89,120,.16)');gr.addColorStop(1,'rgba(0,0,0,.4)');ctx.fillStyle=gr;ctx.fillRect(0,0,1280,720);}
function partyIdentity(p){
 const roster=window.PARTY_ROSTER||[],profile=roster.find(q=>q.id===p.id)||roster.find(q=>String(q.name||'').trim().slice(0,20)===p.name);
 return {seed:profile?.id||p.name||p.id,avatar:profile?.avatar||p.avatar};
}
const pushSumoFacing=new Map();let pushSumoRound='';
function drawPlayerDisc(p,ghost=false,nameLift=0,sumo=false){
 ctx.save();const fade=roundDiscAlpha(p);if(ghost&&fade<=0){ctx.restore();return;}
 const alpha=(ghost?.18:1)*fade;ctx.globalAlpha=alpha;ctx.translate(p.x,p.y);if(!sumo||ghost)discSquashTransform(p,ghost);
 const sp=Math.hypot(p.vx,p.vy);if(sp>25){ctx.strokeStyle=p.color;ctx.globalAlpha*=.3;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-p.vx*.07,-p.vy*.07);ctx.lineTo(0,0);ctx.stroke();ctx.globalAlpha=alpha;}
 const art=window.PartyArt;
 // A colored ground footprint identifies the player without masking the art
 // or presenting the simulation radius as a debug outline.
 ctx.save();ctx.globalAlpha*=.65;ctx.fillStyle=p.color;ctx.shadowColor='#070711';ctx.shadowBlur=8;ctx.shadowOffsetY=5;
 ctx.beginPath();ctx.ellipse(0,p.radius*.74,p.radius*.83,p.radius*.26,0,0,Math.PI*2);ctx.fill();ctx.restore();
 let wrestler=null;
 if(sumo){
  if(!ghost&&sp>12)pushSumoFacing.set(p.id,Math.atan2(p.vy,p.vx)+Math.PI/2);
  const rotation=pushSumoFacing.get(p.id)||0;
  wrestler=window.PushSumoArt?.draw(ctx,{x:0,y:0,radius:p.radius,color:p.color,rotation});
  if(wrestler)window.PartyPushSumoFrame.push({id:p.id,x:p.x,y:p.y,radius:p.radius,vx:p.vx,vy:p.vy,ghost,...wrestler});
 }
 const mascot=wrestler||art?.drawMascot(ctx,0,-p.radius*.08,p.radius*2,p.radius*2,partyIdentity(p));
 if(!mascot){ctx.fillStyle='#0a0d11';ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();}ctx.restore();
}
// Preserve the readable 720-TV identity size when the whole TV composition grows.
function nameFontSize(){const m=ctx.getTransform(),box=canvas.getBoundingClientRect(),scale=Math.min(box.width/Math.max(1,canvas.width),box.height/Math.max(1,canvas.height))*Math.hypot(m.a,m.b);return 14*Math.max(1,innerWidth/1280)/Math.max(.25,scale);}
function fitPlayerName(name,width){const text=String(name||'');if(ctx.measureText(text).width<=width)return text;const letters=Array.from(text);while(letters.length&&ctx.measureText(letters.join('')+'…').width>width)letters.pop();return letters.join('')+'…';}
const discNameSlots=new Map();
const roundDiscGhosts=new Map();let roundDiscGhostKey='';
function roundDiscAlpha(p){const e=roundDiscGhosts.get(p.id);return p.alive||!roundArenaView?1:Math.max(0,1-((roundArenaView.visualTime||0)-(e?.at||0))/1400);}
let roundArenaView=null,roundArenaCamera=null;
function ninjaPose(p,count,c){
 const h=ninjaRenderHeight(count),a=p.launcherAngle,r=332-Math.max(0,-Math.sin(a))*(h-68),x=c.x+Math.cos(a)*r,y=c.y+Math.sin(a)*r;
 const body=window.PartyArt?.sprite('ninja-body-v1',p.color),arm=window.PartyArt?.sprite('ninja-arm-v1',p.color),bw=Math.round(h*(body?.w||684)/(body?.h||1005)),aw=Math.round(h*.47),ah=Math.round(aw*(arm?.h||153)/(arm?.w||463)),flip=Math.cos(a)>0?-1:1,sx=-.185*bw,sy=35-h*.55,target=Math.atan2(-Math.sin(a),flip*-Math.cos(a));
 const points=[[-bw/2,35-h],[bw/2,35],[0,28+Math.max(8,Math.round(h*.09))]];
 if(count>8)points.push([-24,70],[24,70]); // Contain the anchored local ammo beneath dense actors.
 // Include every authored throw pose, the held knife and the arm, not only the wheel.
 for(const wind of[-.8,0,.17,.25])for(const [xx,yy] of[[-aw*.08,-ah/2],[-aw*.08,ah/2],[aw*.92,-ah/2],[aw*.92,ah/2],[aw*.82+25,-12],[aw*.82+25,12]]){const angle=target+wind;points.push([flip*(sx+Math.cos(angle)*xx-Math.sin(angle)*yy),sy+Math.sin(angle)*xx+Math.cos(angle)*yy]);}
 return{x,y,h,bounds:{left:x+Math.min(...points.map(q=>q[0]))-2,right:x+Math.max(...points.map(q=>q[0]))+2,top:y+Math.min(...points.map(q=>q[1]))-2,bottom:y+Math.max(...points.map(q=>q[1]))+2}};
}
// Frame the live round in the full stage. A knockout stays visible for its authored
// effect, then its ghost fades and the camera gently returns to the requested size.
// A shrinking arena still shrinks; simulation geometry is never changed.
function applyRoundArenaView(s){
 const root=document.documentElement,tvOnly=root.classList.contains('party-display-only')||(parent!==window&&parent.PARTY_DISPLAY_ONLY===true),enabled=tvOnly&&['push','shrink','bomb','knives'].includes(s.game.mode)&&s.game.status!=='lobby';root.classList.toggle('party-round-arena-tv',enabled);
 if(!enabled){roundArenaView=null;roundArenaCamera=null;roundDiscGhosts.clear();roundDiscGhostKey='';window.PartyRoundArenaProjection=null;return;}
 const ghostKey=[s.game.mode,s.game.round].join(':');if(ghostKey!==roundDiscGhostKey){roundDiscGhosts.clear();roundDiscGhostKey=ghostKey;}
 for(const p of s.players.filter(p=>p.active)){if(p.alive)roundDiscGhosts.delete(p.id);else if(!roundDiscGhosts.has(p.id))roundDiscGhosts.set(p.id,{at:s.visualTime});}
 const box=canvas.getBoundingClientRect(),base=Math.min(box.width/1280,box.height/720),c=s.center,active=s.players.filter(p=>p.active),knives=s.game.mode==='knives',visible=active.filter(p=>knives||p.alive||s.visualTime-(roundDiscGhosts.get(p.id)?.at??s.visualTime)<1400);
 const displayScale=['push','shrink','bomb'].includes(s.game.mode)?.9:1;
 const rimRadius=knives?s.drum.radius+15:s.game.mode==='bomb'?s.bomb.arenaRadius+4.5:s.game.arenaRadius+2.5,initial=knives?s.drum.radius+40:s.game.mode==='bomb'?305:s.game.mode==='shrink'?342:297,requested=(box.height*.925)/(2*(knives?initial:s.game.mode==='bomb'?304.5:294.5)*base),actualBoxes=knives?active.map(p=>({id:p.id,...ninjaPose(p,active.length,c).bounds})):visible.map(p=>{const r=s.game.mode==='bomb'&&p.alive&&p.id===s.bomb.holderId?p.radius+19:p.radius+2;return{id:p.id,alive:p.alive,left:p.x-r,right:p.x+r,top:p.y-r,bottom:p.y+r};});
 if(knives)for(const k of s.flying)actualBoxes.push({id:k.id,left:k.x-30,right:k.x+30,top:k.y-30,bottom:k.y+30});
 const fit=(boxes)=>{const ex=Math.max(initial,...boxes.flatMap(b=>[c.x-b.left,b.right-c.x])),ey=Math.max(initial,...boxes.flatMap(b=>[c.y-b.top,b.bottom-c.y]));return displayScale*Math.min(requested,(box.width-16)/(2*ex*base),(box.height-16)/(2*ey*base));};
 const hardFit=fit(actualBoxes),predicted=actualBoxes.map(b=>{const p=active.find(p=>p.id===b.id),nearRim=!knives&&p?.alive&&Math.hypot(p.x-c.x,p.y-c.y)>initial-(p.radius||24)*.25,dx=nearRim?(p?.vx||0)*.09:0,dy=nearRim?(p?.vy||0)*.09:0;return{...b,left:b.left+Math.min(0,dx),right:b.right+Math.max(0,dx),top:b.top+Math.min(0,dy),bottom:b.bottom+Math.max(0,dy)};}),target=fit(predicted),now=performance.now(),key=[s.game.mode,s.game.round,box.width,box.height].join(':');
 if(!roundArenaCamera||roundArenaCamera.key!==key)roundArenaCamera={key,zoom:hardFit,time:now,restoreAt:0};
 const elapsed=Math.min(100,Math.max(0,now-roundArenaCamera.time));roundArenaCamera.time=now;
 if(target>roundArenaCamera.zoom+.001){roundArenaCamera.restoreAt||=now;}else roundArenaCamera.restoreAt=0;
 const restoring=roundArenaCamera.restoreAt&&now-roundArenaCamera.restoreAt>300,desired=target<roundArenaCamera.zoom?target:restoring?target:roundArenaCamera.zoom;
 roundArenaCamera.zoom=Math.min(hardFit,roundArenaCamera.zoom+(desired-roundArenaCamera.zoom)*(1-Math.exp(-elapsed/(desired<roundArenaCamera.zoom?70:240))));
 const zoom=roundArenaCamera.zoom,scale=base*zoom,bounds={left:c.x-(box.width/2-8)/scale,right:c.x+(box.width/2-8)/scale,top:c.y-(box.height/2-8)/scale,bottom:c.y+(box.height/2-8)/scale};
 roundArenaView={zoom,scale,bounds,visualTime:s.visualTime,center:{x:box.left+box.width/2,y:box.top+box.height/2},worldCenter:c};
 // Preserve names outside the actual notch rectangle without shrinking targets
 // or reserving an empty full-width band above the arena.
 const frame=parent.document.getElementById('gameFrame'),notch=parent.document.querySelector('#play .tv-info-center'),frameBox=frame?.getBoundingClientRect(),notchBox=notch?.getBoundingClientRect();
 if(frameBox&&notchBox){const receiverScale=frameBox.height/innerHeight,center=roundArenaView.center,x=(notchBox.left-frameBox.left)/receiverScale,y=(notchBox.top-frameBox.top)/receiverScale;
  roundArenaView.hudBounds={x:c.x+(x-center.x)/scale-6/scale,y:c.y+(y-center.y)/scale-6/scale,w:(notchBox.width/receiverScale+12)/scale,h:(notchBox.height/receiverScale+12)/scale};
 }
 ctx.translate(640,partyReceiverHeight/2);ctx.scale(zoom,zoom);ctx.translate(-c.x,-c.y);
 const radius=rimRadius,center=roundArenaView.center;
 window.PartyRoundArenaProjection={requestedCircleFraction:.925*displayScale,displayScale,ghostLifetime:1400,visibleGhostIds:visible.filter(p=>!p.alive).map(p=>p.id),requestedZoom:1.3,baselineZoom:knives?.82:1,zoom,scale,centerScreen:center,circleScreen:{left:center.x-radius*scale,right:center.x+radius*scale,top:center.y-radius*scale,bottom:center.y+radius*scale},playerBounds:actualBoxes.map(b=>({...b,left:center.x+(b.left-c.x)*scale,right:center.x+(b.right-c.x)*scale,top:center.y+(b.top-c.y)*scale,bottom:center.y+(b.bottom-c.y)*scale})),nameBounds:[]};
 if(s.game.mode==='push')alignPushBackdrop(center);
}
function drawDiscNames(s,liftFor=()=>0){
 const players=s.players.filter(p=>p.active&&(!roundArenaView||roundDiscAlpha(p)>0));if(!players.length)return;
 ctx.save();const font=nameFontSize(),gap=font*.4;
 ctx.font=`600 ${font}px HeyPalsText, KardiaFit, system-ui`;ctx.textAlign='center';ctx.textBaseline='alphabetic';
 const width=Math.min(210,font/14*160),placed=[];
 const overlap=(a,b)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
 const hitsDisc=(r,p)=>{const x=Math.max(r.x,Math.min(p.x,r.x+r.w)),y=Math.max(r.y,Math.min(p.y,r.y+r.h));return Math.hypot(x-p.x,y-p.y)<p.radius+5;};
 const activeIds=new Set(players.map(p=>p.id));for(const id of discNameSlots.keys())if(!activeIds.has(id))discNameSlots.delete(id);
 for(const p of players){
  const text=fitPlayerName(p.name,width),w=ctx.measureText(text).width+8,h=font*1.18,lift=liftFor(p),baseY=p.y-p.radius-9-lift;
  const preferred={x:p.x-w/2,y:baseY-h,w,h},previous=discNameSlots.get(p.id),candidates=[preferred];
  if(previous)candidates.push({x:p.x+previous.dx,y:p.y+previous.dy,w,h});
  for(let ring=0;ring<9;ring++)for(const a of[-Math.PI/2,Math.PI/2,-Math.PI/4,-3*Math.PI/4,Math.PI/4,3*Math.PI/4,0,Math.PI]){const d=p.radius+h*.65+10+ring*(h+8)+lift;candidates.push({x:p.x+Math.cos(a)*d-w/2,y:p.y+Math.sin(a)*d-h/2,w,h});}
  let best=null,bestCost=Infinity;
  const safe=roundArenaView?.bounds||{left:16,right:1264,top:24,bottom:696};
  for(const raw of candidates){const r={...raw,x:Math.max(safe.left,Math.min(safe.right-w,raw.x)),y:Math.max(safe.top,Math.min(safe.bottom-h,raw.y))};
   const collisions=placed.filter(q=>overlap(r,q)).length+players.filter(q=>hitsDisc(r,q)).length+(roundArenaView?.hudBounds&&overlap(r,roundArenaView.hudBounds)?1:0);
   const dx=r.x-preferred.x,dy=r.y-preferred.y,continuity=previous?Math.hypot(r.x-(p.x+previous.dx),r.y-(p.y+previous.dy)):0;
   const cost=collisions*1e7+dx*dx+dy*dy+continuity*font*1.5;if(cost<bestCost){best=r;bestCost=cost;}
  }
  placed.push({...best,p,text,baseline:best.y+h-font*.1});discNameSlots.set(p.id,{dx:best.x-p.x,dy:best.y-p.y});
 }
 // Draw leaders first, then all names, so neither later pucks nor lines cover text.
 for(const r of placed){const x=r.x+r.w/2,y=r.y+r.h/2,dx=x-r.p.x,dy=y-r.p.y,d=Math.hypot(dx,dy);if(d>r.p.radius+font*1.9){ctx.globalAlpha=(r.p.alive?.34:.12)*roundDiscAlpha(r.p);ctx.strokeStyle=r.p.color;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(r.p.x+dx/d*(r.p.radius+3),r.p.y+dy/d*(r.p.radius+3));ctx.lineTo(x,y);ctx.stroke();}}
 for(const r of placed){ctx.globalAlpha=(r.p.alive?1:.25)*roundDiscAlpha(r.p);ctx.fillStyle='#f8fbff';ctx.shadowColor='#081019';ctx.shadowBlur=4;ctx.fillText(r.text,r.x+r.w/2,r.baseline);}
 ctx.restore();
 window.PartyNameLabels=placed.map(r=>({id:r.p.id,text:r.text,x:r.x,y:r.y,w:r.w,h:r.h,pixelFont:14}));
 if(roundArenaView){const v=roundArenaView,c=v.worldCenter;window.PartyRoundArenaProjection.nameBounds=placed.map(r=>({id:r.p.id,left:v.center.x+(r.x-c.x)*v.scale,right:v.center.x+(r.x+r.w-c.x)*v.scale,top:v.center.y+(r.y-c.y)*v.scale,bottom:v.center.y+(r.y+r.h-c.y)*v.scale}));}
}

function softGroundShadow(x,y,rx,ry){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const shade=ctx.createRadialGradient(0,0,.55,0,0,1);shade.addColorStop(0,'#02061145');shade.addColorStop(.76,'#02061128');shade.addColorStop(1,'#02061100');ctx.fillStyle=shade;ctx.fillRect(-1,-1,2,2);ctx.restore();}
const arenaTextures=new Map();
function drawArena(c,r,bombMode=false,quietFloor=false){
  const key=bombMode?(quietFloor?'bomb-quiet':'bomb'):quietFloor?'push-quiet':'push';let floor=arenaTextures.get(key);
  if(!floor){floor=document.createElement('canvas');floor.width=floor.height=1280;const g=floor.getContext('2d');g.scale(2,2);const light=g.createRadialGradient(230,190,10,320,320,450);light.addColorStop(0,bombMode?'#44303b':'#284750');light.addColorStop(.7,bombMode?'#211c2a':'#142b39');light.addColorStop(1,'#07131e');g.fillStyle=light;g.fillRect(0,0,640,640);if(!quietFloor){g.lineWidth=1;g.strokeStyle='#ffffff07';for(let y=0;y<660;y+=36)for(let x=-36;x<660;x+=42){const xx=x+(y%72?21:0);g.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;const px=xx+24*Math.cos(a),py=y+24*Math.sin(a);i?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();g.stroke();}}arenaTextures.set(key,floor);}
  ctx.save();ctx.translate(c.x,c.y);softGroundShadow(0,12,r+42,r+38);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.save();ctx.clip();ctx.drawImage(floor,-320,-320,640,640);ctx.strokeStyle='#b9e9ef12';ctx.lineWidth=2;for(const rr of [r*.32,r*.65]){ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.stroke();}ctx.restore();
  const rim=ctx.createLinearGradient(-r,-r,r,r);rim.addColorStop(0,bombMode?'#cf8790':'#294852');rim.addColorStop(.45,bombMode?'#543940':'#091c28');rim.addColorStop(1,bombMode?'#ab6675':'#122d39');ctx.strokeStyle=rim;ctx.lineWidth=bombMode?9:5;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
  ctx.lineWidth=bombMode?3:1.5;ctx.strokeStyle=bombMode?'#ff6676':'#78d9e9b0';ctx.shadowColor='#5bdef5';ctx.shadowBlur=bombMode?0:7;ctx.beginPath();ctx.arc(0,0,r-(bombMode?6:1),0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  for(let i=0;i<48;i++){const a=i*Math.PI/24;ctx.strokeStyle=i%4===0?(bombMode?'#ffc0bd':'#94cbd55a'):'#d6eaff15';ctx.lineWidth=bombMode?2:1;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r-14),Math.sin(a)*(r-14));ctx.lineTo(Math.cos(a)*(r-21),Math.sin(a)*(r-21));ctx.stroke();}
  ctx.restore();
}
function drawPush(s){const sumo=s.game.mode==='push';if(sumo){const key=s.game.round+':'+s.players.filter(p=>p.active).map(p=>p.id).join(',');if(pushSumoRound!==key){pushSumoFacing.clear();pushSumoRound=key;}window.PartyPushSumoFrame=[];}drawShrinkForecast(s);drawArena(s.center,s.game.arenaRadius,false,sumo);drawArenaLife(s,s.center,s.game.arenaRadius,false);drawRimDanger(s);for(const p of s.players)if(p.active)drawPlayerDisc(p,!p.alive,0,sumo);drawDiscImpacts();drawWinnerBeat(s);drawDiscNames(s);drawVisualEvents(s);}
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
function drawNinja(p,x,y,a,age,height){
 const art=window.PartyArt,body=art?.sprite('ninja-body-v1',p.color),arm=art?.sprite('ninja-arm-v1',p.color),h=Math.round(height),bw=Math.round(h*(body?.w||684)/(body?.h||1005)),aw=Math.round(h*.47),ah=Math.round(aw*(arm?.h||153)/(arm?.w||463)),flip=Math.cos(a)>0?-1:1,target=Math.atan2(-Math.sin(a),flip*-Math.cos(a)),active=age>=0&&age<260,wind=active?(age<35?-.8*(1-age/35):age<95?.17*Math.sin((age-35)/60*Math.PI):.25*(age-95)/165):.25,angle=target+wind,sx=-.185*bw,sy=35-h*.55;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.scale(flip,1);
 const mascotHeight=h,mascot=art?.drawMascot(ctx,0,35-h/2,bw,h,partyIdentity(p));
 if(!mascot)art?.draw(ctx,'ninja-body-v1',0,35,bw,h,{color:p.color,pivot:{x:.5,y:1}});
 // The arm remains at its authored shoulder/muzzle; the full round body covers
 // its inner joint, keeping the eyes readable in every throwing direction.
 ctx.save();ctx.translate(sx,sy);ctx.rotate(angle);art?.draw(ctx,'ninja-arm-v1',0,0,aw,ah,{color:p.color,pivot:{x:.08,y:.5}});ctx.restore();
 if(mascot)art.drawMascot(ctx,0,35-mascotHeight/2,bw,mascotHeight,partyIdentity(p));
 if(p.knivesRemaining>0&&!active||active&&age<35){ctx.save();ctx.translate(sx,sy);ctx.rotate(angle);drawKnifeShape(aw*.82,0,0,p.color,.82);ctx.restore();}
 ctx.restore();return{x:x+flip*(sx+Math.cos(angle)*aw*.82),y:y+sy+Math.sin(angle)*aw*.82,age};
}
function drawKnives(s){
  ctx.save();if(!roundArenaView){ctx.translate(640,360);ctx.scale(.82,.82);ctx.translate(-640,-360);}
  const d=s.drum,c=s.center;if(ninjaRound!==s.game.round){ninjaThrows.clear();ninjaRound=s.game.round;}const hands=new Map(),nameTags=[];
  const halo=ctx.createRadialGradient(c.x,c.y,d.radius*.6,c.x,c.y,360);halo.addColorStop(0,'#366e7430');halo.addColorStop(1,'#0e223000');ctx.fillStyle=halo;ctx.fillRect(c.x-380,c.y-380,760,760);
  const kick=wheelKick();ctx.save();ctx.translate(c.x+kick.x,c.y+kick.y);softGroundShadow(0,14,d.radius+44,d.radius+40);ctx.rotate(d.angle);ctx.drawImage(wheelTexture(d),-256,-256,512,512);
  for(const k of d.stuck){const a=k.localAngle;drawKnifeShape(Math.cos(a)*(d.radius+16),Math.sin(a)*(d.radius+16),a+Math.PI,k.color,1.2);}ctx.restore();
  ctx.save();ctx.beginPath();ctx.arc(c.x,c.y,d.radius+10,0,Math.PI*2);ctx.clip();const keyLight=ctx.createLinearGradient(c.x-180,c.y-210,c.x+160,c.y+210);keyLight.addColorStop(0,'#d7faff55');keyLight.addColorStop(.38,'#c4e6ff0c');keyLight.addColorStop(.72,'#020c1d24');keyLight.addColorStop(1,'#01081760');ctx.fillStyle=keyLight;ctx.fillRect(c.x-250,c.y-250,500,500);ctx.strokeStyle='#ddffffa0';ctx.shadowColor='#8edfff';ctx.shadowBlur=12;ctx.lineWidth=3;ctx.beginPath();ctx.arc(c.x,c.y,d.radius+4,Math.PI*1.05,Math.PI*1.65);ctx.stroke();ctx.restore();
  const count=s.players.filter(p=>p.active).length,ninjaHeight=ninjaRenderHeight(count);
  for(const p of s.players){
    if(!p.active)continue;const a=p.launcherAngle,pose=ninjaPose(p,count,c),x=pose.x,y=pose.y;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,28,Math.round(ninjaHeight*.31),Math.max(8,Math.round(ninjaHeight*.09)),0,0,Math.PI*2);ctx.fill();
    let event=ninjaThrows.get(p.id);if(!event){event={remaining:p.knivesRemaining,time:-Infinity};ninjaThrows.set(p.id,event);}if(p.knivesRemaining<event.remaining){event.time=s.visualTime;}event.remaining=p.knivesRemaining;hands.set(p.id,drawNinja(p,x,y,a,s.visualTime-event.time,ninjaHeight));
    const labelSide=Math.abs(Math.sin(a))>.8,dx=labelSide?Math.round(ninjaHeight*.42):0,dy=labelSide?-8:(Math.sin(a)<0?-Math.round(ninjaHeight*.58):Math.round(ninjaHeight*.53));
    nameTags.push({p,x,y,ninjaHeight,dx,dy,labelSide});ctx.restore();
  }
  drawNinjaNames(nameTags,count,c,d.radius);
  for(const original of s.flying){const hand=hands.get(original.ownerId);if(hand&&hand.age<35)continue;const q=hand?Math.min(1,Math.max(0,(hand.age-35)/65)):1,k=hand?{...original,x:hand.x+(original.x-hand.x)*q,y:hand.y+(original.y-hand.y)*q}:original;ctx.save();ctx.strokeStyle=k.color+'80';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(k.x-Math.cos(k.angle)*26,k.y-Math.sin(k.angle)*26);ctx.lineTo(k.x,k.y);ctx.stroke();ctx.restore();drawKnifeShape(k.x,k.y,k.angle,k.color,1.35);}
  drawKnifeGlints();drawVisualEvents(s);ctx.restore();
}
function drawNinjaNames(tags,count,center,wheelRadius){
 // Dense rings already expose every full identity in the score wings. Keep
 // only local ammunition, anchored to the character rather than distant names.
 if(count>8){const font=nameFontSize()*1.15,labels=[];ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.font=`italic 900 ${font}px KardiaFatRunner, system-ui`;
  for(const {p,x,y}of tags){const yy=y+43+font*.4;drawKnifeShape(x-10,yy,-Math.PI/4,p.color,.45);ctx.fillStyle=p.color;ctx.fillText(String(p.knivesRemaining),x+4,yy);labels.push({id:p.id,text:String(p.knivesRemaining),x:x-19,y:yy-font/2,w:42,h:font});}
  ctx.restore();window.PartyNameLabels=labels;return;
 }
 ctx.save();const font=nameFontSize(),countFont=Math.max(count>8?18:22,font*1.25),gap=font*.25,placed=[];
 const touches=(a,b)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
 const bodies=tags.map(t=>({x:t.x-t.ninjaHeight*.38,y:t.y-t.ninjaHeight*.72,w:t.ninjaHeight*.76,h:t.ninjaHeight*1.02}));
 for(const t of tags){const {p,x,y,dx,dy,labelSide}=t;ctx.font=`600 ${font}px HeyPalsText, KardiaFit, system-ui`;
  const text=fitPlayerName(p.name,font*(count>8?8:16)),nameWidth=ctx.measureText(text).width;
  ctx.font=`italic 800 ${countFont}px PartyRubik, Rubik, system-ui`;const knives=window.PartyI18n?.t?.(`${p.knivesRemaining} НОЖЕЙ`)||`${p.knivesRemaining} НОЖЕЙ`,w=Math.max(nameWidth,ctx.measureText(knives).width)+8,h=font+countFont+8;
  const preferred={x:x+dx-(labelSide?0:w/2),y:y+dy-font,w,h},candidates=[preferred];
  for(let ring=0;ring<7;ring++)for(const a of[p.launcherAngle,-Math.PI/2,Math.PI/2,0,Math.PI,-Math.PI/4,-3*Math.PI/4,Math.PI/4,3*Math.PI/4]){const distance=t.ninjaHeight*.7+ring*(font+8);candidates.push({x:x+Math.cos(a)*distance-w/2,y:y+Math.sin(a)*distance-h/2,w,h});}
  // Dense rosters can use spare space beside the wheel without stacking labels.
  for(const column of[240,1040])for(let row=110;row<740;row+=h+12)candidates.push({x:column-w/2,y:row-h/2,w,h});
  let best=null,cost=Infinity;
  const safe=roundArenaView?.bounds||{left:16,right:1264,top:18,bottom:774};
  for(const raw of candidates){const r={...raw,x:Math.max(safe.left,Math.min(safe.right-w,raw.x)),y:Math.max(safe.top,Math.min(safe.bottom-h,raw.y))};const nearX=Math.max(r.x,Math.min(center.x,r.x+r.w)),nearY=Math.max(r.y,Math.min(center.y,r.y+r.h));
   const collisions=placed.filter(q=>touches(r,q)).length+bodies.filter(q=>touches(r,q)).length+(Math.hypot(nearX-center.x,nearY-center.y)<wheelRadius+14?1:0)+(roundArenaView?.hudBounds&&touches(r,roundArenaView.hudBounds)?1:0);
   const score=collisions*1e7+(r.x-preferred.x)**2+(r.y-preferred.y)**2;if(score<cost){best=r;cost=score;}
  }
  placed.push({...best,p,text,knives,actorX:x,actorY:y});
 }

 ctx.globalAlpha=1;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.shadowColor='#081019';ctx.shadowBlur=4;
 for(const r of placed){ctx.font=`600 ${font}px HeyPalsText, KardiaFit, system-ui`;ctx.fillStyle='#fff';ctx.fillText(r.text,r.x+r.w/2,r.y+font);ctx.font=`italic 800 ${countFont}px PartyRubik, Rubik, system-ui`;ctx.fillStyle=r.p.color;ctx.fillText(r.knives,r.x+r.w/2,r.y+font+countFont+7);}
 ctx.restore();window.PartyNameLabels=placed.map(r=>({id:r.p.id,text:r.text,x:r.x,y:r.y,w:r.w,h:r.h,pixelFont:14}));
 if(roundArenaView){const v=roundArenaView,c=v.worldCenter;window.PartyRoundArenaProjection.nameBounds=placed.map(r=>({id:r.p.id,left:v.center.x+(r.x-c.x)*v.scale,right:v.center.x+(r.x+r.w-c.x)*v.scale,top:v.center.y+(r.y-c.y)*v.scale,bottom:v.center.y+(r.y+r.h-c.y)*v.scale}));}
}

function drawVisualEvents(s){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Keep every impact ring, but dense knife rosters need readable feedback, not a text cloud.
  const events=(s.visualEvents||[]).slice(-24),latestByColor=new Map(),labels=[];
  for(const e of events)if(e.label&&s.visualTime-e.time<650)latestByColor.set(e.color,e.id);
  const readableIds=new Set([...latestByColor.values()].slice(-6));
  for(const e of events){if(e.kind==='rim-out')continue;
    const t=(s.visualTime-e.time)/1000;if(t<0||t>1)continue;const q=Math.min(1,t/(e.kind==='bomb-explode'?1:.65)),boom=e.kind==='bomb-explode',radius=boom?155:45;
    ctx.save();ctx.globalAlpha=(1-q)*(1-q);ctx.strokeStyle=e.color;ctx.lineWidth=boom?8*(1-q)+2:3*(1-q)+1;ctx.beginPath();ctx.arc(e.x,e.y,4+radius*(1-Math.pow(1-q,3)),0,Math.PI*2);ctx.stroke();
    if(!reduced){const n=boom?22:9;for(let i=0;i<n;i++){const a=i*Math.PI*2/n+e.id*.37,travel=(18+radius*.75)*(1-Math.exp(-t*5))*(.65+(i%3)*.2);ctx.fillStyle=i%3===0?'#fff1c2':e.color;ctx.beginPath();ctx.arc(e.x+Math.cos(a)*travel,e.y+Math.sin(a)*travel+t*t*55,Math.max(.4,(boom?5:3)*(1-q)),0,Math.PI*2);ctx.fill();}}
    const label=e.label?.replace('YOUR COLOR','СВОЙ ЦВЕТ').replace('WRONG COLOR','ЧУЖОЙ ЦВЕТ').replace('DANGER','ОПАСНО').replace('CLANG','РИКОШЕТ').replace('MISS','МИМО');
    if(label&&readableIds.has(e.id)){
      const font=nameFontSize()*.8;ctx.font=`italic 900 ${font}px KardiaFatRunner,system-ui`;ctx.textAlign='center';
      const safe=roundArenaView?.bounds||{left:16,right:1264,top:24,bottom:770},text=window.PartyI18n?.t?.(label)||label,w=ctx.measureText(text).width+8,h=font*1.2,x=Math.max(safe.left+w/2,Math.min(safe.right-w/2,e.x));
      let box=null;for(const shift of [0,-1,1,-2,2,-3,3]){const y=Math.max(safe.top+h,Math.min(safe.bottom,e.y-23-t*24+shift*(h+5))),candidate={x:x-w/2,y:y-h,w,h};
        if(![...labels,...(window.PartyNameLabels||[])].some(r=>candidate.x<r.x+r.w+4&&candidate.x+w+4>r.x&&candidate.y<r.y+r.h+4&&candidate.y+h+4>r.y)){box=candidate;break;}
      }
      if(box){labels.push(box);ctx.globalAlpha=1-q;ctx.fillStyle=e.color;ctx.shadowColor='#061019';ctx.shadowBlur=5;ctx.fillText(text,x,box.y+h);}
    }ctx.restore();
  }
}
function drawBombIcon(x,y,t=0,pop=0){const sz=64*(1+Math.sin(t*12)*.025+pop),frame=window.PartyArt?.sprite('bomb'),sw=sz*(frame?.w||312)/(frame?.h||480);if(window.PartyArt?.draw(ctx,'bomb',x,y-5,sw,sz)){const fx=x+sw*.29,fy=y-5-sz*.31;ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<7;i++){const q=(t*2.7+i/7)%1,a=-Math.PI*.95+i*.37,travel=q*18;ctx.globalAlpha=(1-q)*.9;ctx.strokeStyle=i%2?'#ffb947':'#fff2b0';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(fx+Math.cos(a)*travel,fy+Math.sin(a)*travel+q*q*8);ctx.lineTo(fx+Math.cos(a)*(travel+3),fy+Math.sin(a)*(travel+3)+q*q*8);ctx.stroke();}ctx.restore();return;}ctx.save();ctx.translate(x,y);const pulse=1+Math.sin(t*12)*.06;ctx.scale(pulse,pulse);ctx.shadowBlur=24;ctx.shadowColor='#ff596b';ctx.fillStyle='#111318';ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#ff6675';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(10,-14);ctx.quadraticCurveTo(21,-28,27,-17);ctx.stroke();ctx.fillStyle='#ffbc4b';ctx.beginPath();ctx.arc(28,-18,4,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawBomb(s){const b=s.bomb,c=s.center;drawArena(c,b.arenaRadius,true,true);drawArenaLife(s,c,b.arenaRadius,true);for(const o of b.obstacles){ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(3,7,o.r+4,o.r+3,0,0,Math.PI*2);ctx.fill();const metal=ctx.createLinearGradient(-o.r,-o.r,o.r,o.r);metal.addColorStop(0,'#ac8b96');metal.addColorStop(.25,'#6c5065');metal.addColorStop(1,'#272433');ctx.fillStyle=metal;ctx.beginPath();ctx.arc(0,0,o.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e8bac73b';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#3b2c3b';ctx.beginPath();ctx.arc(0,0,o.r-7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#bd879861';ctx.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/2+.78;ctx.fillStyle='#b8a3a5';ctx.beginPath();ctx.arc(Math.cos(a)*(o.r-4),Math.sin(a)*(o.r-4),2,0,Math.PI*2);ctx.fill();}ctx.restore();}
  for(const p of s.players){if(!p.active)continue;drawPlayerDisc(p,!p.alive,p.alive&&p.id===b.holderId?65:0);if(p.alive&&p.id===b.holderId){drawBombHeat(p,s);const desiredY=p.y-50,iconY=roundArenaView?Math.max(roundArenaView.bounds.top+52,Math.min(roundArenaView.bounds.bottom-52,desiredY)):desiredY,iconX=roundArenaView&&iconY!==desiredY?(p.x+64<roundArenaView.bounds.right-35?p.x+64:p.x-64):p.x;drawBombIcon(iconX,iconY,s.visualTime/1000,bombCatchPop(p,s));if(roundArenaView){const v=roundArenaView,c=v.worldCenter;window.PartyRoundArenaProjection.holderIcon={id:p.id,x:iconX,y:iconY,clamped:iconY!==desiredY};window.PartyRoundArenaProjection.playerBounds.push({id:p.id+":holder",left:v.center.x+(iconX-35-c.x)*v.scale,right:v.center.x+(iconX+35-c.x)*v.scale,top:v.center.y+(iconY-52-c.y)*v.scale,bottom:v.center.y+(iconY+36-c.y)*v.scale});}}}
  drawBombPassZap(s);drawDiscImpacts();drawWinnerBeat(s);drawDiscNames(s,p=>p.alive&&p.id===b.holderId?65:0);
  for(const e of b.explosions){drawBombBlast(e);const q=Math.min(1,e.t/e.ttl),r=40+q*180;ctx.save();ctx.globalAlpha=1-q;ctx.lineWidth=14*(1-q)+3;ctx.strokeStyle='#ff724e';ctx.beginPath();ctx.arc(e.x,e.y,r,0,Math.PI*2);ctx.stroke();ctx.fillStyle=`rgba(255,201,77,${(1-q)*.16})`;ctx.beginPath();ctx.arc(e.x,e.y,r*.72,0,Math.PI*2);ctx.fill();ctx.restore();}
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
function westernPositions(count){const rows=count>8?2:1,cols=Math.ceil(count/rows);return Array.from({length:count},(_,i)=>{const row=Math.floor(i/cols),col=i%cols,n=Math.min(cols,count-row*cols),edge=n<=4?260:170,x=n===1?640:n===2?380+col*520:edge+col*(1280-2*edge)/(n-1);return{x,y:rows===1?570:row?638:470,scale:rows===1?Math.min(1.61,(940/Math.max(1,n-1)-22)/131):.75,flip:x<640?1:-1,labelWidth:n===2?400:Math.min(170,940/n)};});}
function drawWesternCinema(focus){
 const left=-(westernViewWidth-1280)/2,depth=58*focus;
 if(depth<1)return;
 for(const bottom of[false,true]){const edge=bottom?720:0,end=bottom?720-depth:depth,g=ctx.createLinearGradient(0,edge,0,end);g.addColorStop(0,'#080b10e6');g.addColorStop(1,'#080b1000');ctx.fillStyle=g;ctx.fillRect(left,bottom?720-depth:0,westernViewWidth,depth);}
}
function drawWestern(s){
  const w=s.western;const shake=westernShake();ctx.save();ctx.translate(shake.x,shake.y);drawWesternBackdrop();drawWesternDust(s);const focusPhase=s.game.status==='playing'?w.phase:s.game.status;if(focusPhase!==westernFocusPhase){westernFocusPhase=focusPhase;westernFocusStamp=s.visualTime;}const focusDt=Math.max(0,Math.min(.05,(s.visualTime-westernFocusLast)/1000));westernFocusLast=s.visualTime;const focusTarget=matchMedia('(prefers-reduced-motion: reduce)').matches?0:focusPhase==='waiting'?Math.min(1,(s.visualTime-westernFocusStamp)/2200):focusPhase==='draw'?1:0;westernFocus+=(focusTarget-westernFocus)*(1-Math.exp(-focusDt*7));if(westernBlurred&&westernFocus>.001){ctx.save();ctx.globalAlpha=westernFocus*.9;ctx.drawImage(westernBlurred,-(westernViewWidth-1280)/2,0,westernViewWidth,720);ctx.restore();}drawWesternCinema(westernFocus);
  if(s.game.status!=='between'){ctx.fillStyle='#fff2de';ctx.textAlign='center';ctx.font='italic 750 24px HeyPalsDisplay, PartyRubik, system-ui';ctx.fillText('ОДНА ПУЛЯ · СТРЕЛЯЙ ТОЛЬКО НА DRAW!',640,146);}
  const active=s.players.filter(p=>p.active),poses=westernPositions(active.length),roundKey=s.game.round;
  if(westernPoseRound!==roundKey){westernPoseRound=roundKey;westernDeaths.clear();westernAlive.clear();westernFalls.clear();}
  window.westernRigFrame=[];
  active.forEach((p,i)=>{if(westernAlive.get(p.id)===true&&!p.alive)westernFalls.set(p.id,s.visualTime);if(westernAlive.get(p.id)===true&&!p.alive&&!p.falseStart&&w.shots?.length)westernDeaths.set(p.id,s.visualTime);westernAlive.set(p.id,p.alive);
   const pose=poses[i],{x,y,scale,flip}=pose,age=p.shotThisRound?s.visualTime-p.shotVisualTime:Infinity,dead=!p.alive,fallAge=s.visualTime-(westernFalls.get(p.id)||s.visualTime)-(p.falseStart?220:0),fall=dead?1-(1-Math.min(1,Math.max(0,fallAge)/420))**3:0,height=150*scale;
   const rigOptions={x,y,height,color:p.color,flip,shotAge:age,early:p.falseStart,fall},contact=window.WesternMascotRig?.measure?.(rigOptions);
   if(contact?.shadow){const shadow=contact.shadow;softGroundShadow(shadow.x,shadow.y,shadow.rx,shadow.ry);}else{ctx.save();ctx.shadowColor='#17101488';ctx.shadowBlur=9;ctx.fillStyle='#20140c66';ctx.beginPath();ctx.ellipse(x-flip*height*.34*fall,y+8*scale,39*scale,9*scale,0,0,7);ctx.fill();ctx.restore();}
   const muzzle=westernRigActor(ctx,rigOptions);window.westernRigFrame.push({id:p.id,height,flip,fall,muzzle,shadow:contact?.shadow,alive:p.alive});const target=poses.filter(q=>q.y===y&&flip*(q.x-x)>0).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0]||pose;if(p.shotThisRound)westernShotFX(ctx,muzzle,{x:target.x,y:target.y-height*.54},age,p.falseStart,scale);
   const hitAge=s.visualTime-westernDeaths.get(p.id);if(hitAge>=0&&hitAge<340){ctx.save();ctx.translate(x,y-height*.54);ctx.globalAlpha=(1-hitAge/340)**2;ctx.strokeStyle='#d83c4f';ctx.lineWidth=4;for(let n=0;n<8;n++){const angle=n*Math.PI/4,r=8+hitAge*.10;ctx.beginPath();ctx.moveTo(Math.cos(angle)*r,Math.sin(angle)*r);ctx.lineTo(Math.cos(angle)*(r+9),Math.sin(angle)*(r+9));ctx.stroke();}ctx.restore();}if(hitAge>=0&&hitAge<2200){ctx.save();ctx.globalAlpha=.45*Math.min(1,(2200-hitAge)/600);ctx.fillStyle='#9e2534';ctx.beginPath();ctx.ellipse(x,y+8,22*scale,6*scale,0,0,7);ctx.fill();ctx.restore();}
   ctx.fillStyle=dead?'#ffcfb4':'#fff';const labelSize=nameFontSize(),nameY=y+(active.length>8?32:58),reactionHeight=active.length>8?20:29,statusY=nameY+labelSize*.25+8+reactionHeight*.75;ctx.font=`600 ${labelSize}px HeyPalsText, KardiaFit, system-ui`;ctx.textAlign='center';ctx.fillText(fitPlayerName(p.name,pose.labelWidth),x,nameY);if(p.reactionMs!=null&&!p.falseStart)drawReactionPlate(p,x,statusY,active,age,dead);else{ctx.font='italic 800 '+(active.length>8?11:14)+'px PartyRubik, Rubik, system-ui';ctx.fillText(dead?(p.falseStart?'РАНО — ВЫБЫЛ':'НЕ УСПЕЛ'):'ГОТОВ',x,statusY,pose.labelWidth);}
  });
  ctx.restore();drawWesternFlash();
  let cue=null,real=false;if(westernCueFlash&&performance.now()<westernCueFlash.until){cue=westernCueFlash.text;real=westernCueFlash.real;}else if(w.cue){cue=w.cue;real=w.cueReal;}
  if(cue&&s.game.status==='playing'){ctx.save();const isDraw=real&&cue==='DRAW!';ctx.fillStyle=isDraw?'#ffdf72':'#f4c898';ctx.shadowBlur=isDraw?45:15;ctx.shadowColor=isDraw?'#ff5b2e':'#000';ctx.font=`italic 800 ${isDraw?112:64}px PartyRubik, Rubik, system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';const punch=westernCuePunch(isDraw);ctx.translate(640,280);ctx.scale(punch,punch);ctx.fillText(cue,0,0);ctx.scale(1/punch,1/punch);ctx.translate(-640,-280);ctx.shadowBlur=0;if(!isDraw){ctx.fillStyle='#ffd9b066';ctx.font='italic 800 14px PartyRubik, Rubik, system-ui';ctx.fillText('FAKE?',640,335);}ctx.restore();}
}
let westernRoundNotice=null,westernRoundNoticeKey='';
addEventListener('resize',()=>{westernRoundNoticeKey='';});addEventListener('party-stage-resize',()=>{westernRoundNoticeKey='';});
function syncWesternRoundNotice(s){
 const g=s.game;if(g.mode!=='western'||g.status!=='between'){if(westernRoundNotice&&!westernRoundNotice.element.hidden)westernRoundNotice.hide();westernRoundNoticeKey='';return false;}
 if(!window.HeyPalsGameMessage)return false;
 westernRoundNotice||=window.HeyPalsGameMessage.create({game:'western'});
 const key=`western:${g.round}:${g.winnerText}`;if(key===westernRoundNoticeKey)return !westernRoundNotice.element.hidden;
 const m=ctx.getTransform(),box=canvas.getBoundingClientRect(),point=(x,y)=>({x:box.left+(m.a*x+m.c*y+m.e)*box.width/canvas.width,y:box.top+(m.b*x+m.d*y+m.f)*box.height/canvas.height});
 const active=s.players.filter(p=>p.active),winner=betweenAt.winners?.length===1?active.find(p=>p.id===betweenAt.winners[0]):null,avoid=westernPositions(active.length).map(p=>{const h=150*p.scale,a=point(p.x-h,p.y-h),b=point(p.x+h,p.y+h*.3);return{left:a.x,top:a.y,right:b.x,bottom:b.y};});
 westernRoundNoticeKey=key;return westernRoundNotice.show({key,text:g.winnerText,portrait:winner?window.PartyArt?.mascotSource(partyIdentity(winner)):'',anchor:point(640,145),avoid});
}
function drawCenterText(s){const g=s.game,noticeShown=syncWesternRoundNotice(s);if(g.status==='countdown'){ctx.fillStyle='#fff';ctx.font='italic 800 116px PartyRubik, Rubik, system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=25;ctx.shadowColor='#000';ctx.fillText(String(Math.max(1,Math.ceil(g.countdown))),640,360);ctx.shadowBlur=0;}else if(g.status==='between'){if(noticeShown)return;const top=g.mode==='western'?145:betweenCardTop(s),enter=betweenEnter();ctx.save();ctx.globalAlpha=enter.alpha;ctx.translate(640,top+55);ctx.scale(enter.scale,enter.scale);ctx.translate(-640,-(top+55));ctx.fillStyle='#080b10dd';roundRect(300,top,680,110,24);ctx.fill();ctx.strokeStyle='#ffffff22';ctx.stroke();drawBetweenShine(top,enter.age);ctx.fillStyle='#fff';ctx.font='italic 800 27px PartyRubik, Rubik, system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(g.winnerText,640,top+55,630);ctx.restore();}}
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
// Party juice (TV). Rendering-only feedback driven by authoritative snapshots:
// nothing here changes simulation, scoring or the protocol. Every effect is
// tied to a real event, decays to rest and respects reduced motion.
const juiceReduced=matchMedia('(prefers-reduced-motion: reduce)'),juiceSeen=new Set();
let juiceWins=new Map(),juiceTime=0,juiceRoundKey='',impactPrev=null,bombHold={id:null,from:null,since:-1e9},betweenAt={key:'',at:0,wall:0};
const discSquash=new Map(),discImpacts=[],impactCooldown=new Map(),scorchDecals=[],wheelKicks=[],knifeGlints=[];
const arenaMotes=Array.from({length:26},(_,i)=>({a:i*2.39996,d:Math.sqrt(((i*37)%101)/101),s:.55+((i*13)%10)/12,ph:i*1.618}));
const westernDust=Array.from({length:28},(_,i)=>({x:(i*211)%1400,y:440+((i*67)%250),s:.4+((i*29)%10)/10,ph:i*.77}));
function juiceObserve(s){
 const g=s.game,key=g.mode+':'+g.round;
 if(key!==juiceRoundKey){juiceRoundKey=key;impactPrev=null;discImpacts.length=0;discSquash.clear();impactCooldown.clear();scorchDecals.length=0;wheelKicks.length=0;knifeGlints.length=0;bombHold={id:null,from:null,since:-1e9};}
 // Winners are the players whose round wins rose in the packet that ended the round.
 if(g.status==='between'&&betweenAt.key!==key){betweenAt={key,at:s.visualTime,wall:performance.now(),winners:s.players.filter(p=>juiceWins.has(p.id)&&p.roundWins>juiceWins.get(p.id)).map(p=>p.id),top:null};}
 juiceWins=new Map(s.players.map(p=>[p.id,p.roundWins]));
 if(g.mode==='bomb'&&s.bomb&&s.bomb.holderId!==bombHold.id){bombHold={id:s.bomb.holderId,from:bombHold.id,since:s.visualTime};}
 for(const e of s.visualEvents||[]){
  if(juiceSeen.has(e.id))continue;juiceSeen.add(e.id);if(juiceSeen.size>96)juiceSeen.delete(juiceSeen.values().next().value);
  if(e.kind==='bomb-explode'){scorchDecals.push({x:e.x,y:e.y,time:e.time});if(scorchDecals.length>6)scorchDecals.shift();}
  if(e.kind==='knife-hit'||e.kind==='knife-clang'){const c=s.center,dx=c.x-e.x,dy=c.y-e.y,d=Math.hypot(dx,dy)||1;wheelKicks.push({time:e.time,dx:dx/d,dy:dy/d,amp:e.kind==='knife-clang'?7:/YOUR COLOR/.test(e.label||'')?5:4});if(wheelKicks.length>8)wheelKicks.shift();
   knifeGlints.push({time:e.time,x:e.x,y:e.y,color:e.color,kind:e.kind==='knife-clang'?'clang':/YOUR COLOR/.test(e.label||'')?'own':/DANGER/.test(e.label||'')?'danger':'other'});if(knifeGlints.length>10)knifeGlints.shift();}
 }
 detectDiscImpacts(s);
}
// Collisions are not separate server events, so read them from two consecutive
// authoritative packets: a sharp velocity change while two discs touch.
function detectDiscImpacts(s){
 const g=s.game;if(!['push','shrink','bomb'].includes(g.mode)||g.status!=='playing'){impactPrev=null;return;}
 const prev=impactPrev,alive=s.players.filter(p=>p.active&&p.alive);impactPrev=new Map(alive.map(p=>[p.id,{vx:p.vx,vy:p.vy}]));if(!prev)return;
 for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++){
  const a=alive[i],b=alive[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<.001||d>a.radius+b.radius+8)continue;
  const pa=prev.get(a.id),pb=prev.get(b.id);if(!pa||!pb)continue;
  const dv=Math.max(Math.hypot(a.vx-pa.vx,a.vy-pa.vy),Math.hypot(b.vx-pb.vx,b.vy-pb.vy));if(dv<75)continue;
  const pair=a.id<b.id?a.id+'|'+b.id:b.id+'|'+a.id;if(s.visualTime-(impactCooldown.get(pair)??-1e9)<280)continue;impactCooldown.set(pair,s.visualTime);
  const nx=dx/d,ny=dy/d,strength=Math.max(.2,Math.min(1,dv/240)),hit={time:s.visualTime,x:a.x+nx*a.radius,y:a.y+ny*a.radius,nx,ny,strength,colors:[a.color,b.color]};
  discImpacts.push(hit);if(discImpacts.length>12)discImpacts.shift();
  discSquash.set(a.id,{time:s.visualTime,nx,ny,strength});discSquash.set(b.id,{time:s.visualTime,nx,ny,strength});
  if(strength>.4)window.LocalPartyFeel?.emit('collision',{id:`party:bump:${juiceRoundKey}:${pair}:${Math.round(s.visualTime)}`,x:hit.x/1280,y:hit.y/720,color:'#f4fbff',intensity:.2+strength*.4,particles:false,shake:strength>.65,haptic:false});
 }
}
function discSquashTransform(p,ghost){
 // A knocked-out disc drops into the pit while its ghost fades.
 if(ghost&&roundArenaView&&!juiceReduced.matches){const fall=1-roundDiscAlpha(p),k=1-.42*fall*(2-fall);ctx.scale(k,k);return;}
 const sq=discSquash.get(p.id);if(!sq||juiceReduced.matches)return;const age=juiceTime-sq.time;if(age<0||age>200)return;
 const q=age/200,amt=sq.strength*.2*(1-q)*(1-q),a=Math.atan2(sq.ny,sq.nx);ctx.rotate(a);ctx.scale(1-amt,1+amt*.7);ctx.rotate(-a);
}
function drawDiscImpacts(){
 const reduced=juiceReduced.matches;
 for(const h of discImpacts){const age=juiceTime-h.time;if(age<0||age>420)continue;const q=age/420,e=1-Math.pow(1-q,3);
  ctx.save();ctx.globalCompositeOperation='screen';
  if(age<110){const rr=14+20*h.strength,core=ctx.createRadialGradient(h.x,h.y,0,h.x,h.y,rr);core.addColorStop(0,'#ffffff');core.addColorStop(.35,'#fff6d0aa');core.addColorStop(1,'#ffffff00');ctx.globalAlpha=(1-age/110)*(.5+.45*h.strength);ctx.fillStyle=core;ctx.beginPath();ctx.arc(h.x,h.y,rr,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=(1-q)*(1-q)*.8;ctx.strokeStyle='#f4fbff';ctx.lineWidth=1+2.2*h.strength*(1-q);ctx.beginPath();ctx.arc(h.x,h.y,6+(18+26*h.strength)*e,0,Math.PI*2);ctx.stroke();
  if(!reduced){const n=4+Math.round(h.strength*6),tangent=Math.atan2(h.nx,-h.ny);ctx.lineCap='round';for(let i=0;i<n;i++){const a=tangent+(i%2?Math.PI:0)+(((i*.37)%.9)-.45),travel=(10+34*h.strength)*e*(.7+.15*(i%3));ctx.globalAlpha=(1-q)*(1-q);ctx.strokeStyle=i%3===0?'#ffffff':h.colors[i%2];ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(h.x+Math.cos(a)*Math.max(0,travel-7),h.y+Math.sin(a)*Math.max(0,travel-7));ctx.lineTo(h.x+Math.cos(a)*travel,h.y+Math.sin(a)*travel);ctx.stroke();}}
  ctx.restore();
 }
}
// Idle life: drifting motes, a slow light sweep and two comets riding the rim.
function drawArenaLife(s,c,r,bombMode){
 const reduced=juiceReduced.matches,t=reduced?0:performance.now()/1000,tint=bombMode?'255,176,150':'150,236,255';
 ctx.save();ctx.translate(c.x,c.y);
 ctx.save();ctx.beginPath();ctx.arc(0,0,Math.max(1,r-2),0,Math.PI*2);ctx.clip();
 if(bombMode)drawScorchDecals(c);
 if(ctx.createConicGradient){const sweep=ctx.createConicGradient(t*.3,0,0);sweep.addColorStop(0,`rgba(${tint},0)`);sweep.addColorStop(.05,`rgba(${tint},.045)`);sweep.addColorStop(.13,`rgba(${tint},0)`);sweep.addColorStop(.5,`rgba(${tint},0)`);sweep.addColorStop(.55,`rgba(${tint},.035)`);sweep.addColorStop(.63,`rgba(${tint},0)`);sweep.addColorStop(1,`rgba(${tint},0)`);ctx.fillStyle=sweep;ctx.fillRect(-r,-r,r*2,r*2);}
 ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgb(${tint})`;
 if(!['push','bomb'].includes(s.game.mode))for(const m of arenaMotes){const a=m.a+t*.045*m.s,rr=m.d*r*.94,tw=.5+.5*Math.sin(t*1.25+m.ph);ctx.globalAlpha=.07+.13*tw;ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr+Math.sin(t*.6+m.ph)*5,1+m.s*1.2,0,Math.PI*2);ctx.fill();}
 ctx.restore();
 ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';ctx.strokeStyle=bombMode?'#ffb4aa':'#c4f7ff';
 for(let k=0;k<2;k++){const head=t*.42+k*Math.PI;for(let i=0;i<10;i++){const a0=head-i*.045;ctx.globalAlpha=(1-i/10)**2*.5;ctx.lineWidth=2.4-i*.14;ctx.beginPath();ctx.arc(0,0,r-1,a0-.05,a0);ctx.stroke();}}
 ctx.restore();
 // Last Circle: show the ground already lost and make the closing edge read as danger.
 if(s.game.mode==='shrink'&&s.game.status==='playing'&&r<291.5){
  const full=292,heat=Math.min(1,(full-r)/140),pulse=reduced?.5:.5+.5*Math.sin(t*6);
  ctx.beginPath();ctx.arc(0,0,full,0,Math.PI*2);ctx.arc(0,0,r+3,0,Math.PI*2,true);ctx.fillStyle=`rgba(255,82,112,${.045+.05*heat})`;ctx.fill();
  ctx.setLineDash([3,9]);ctx.strokeStyle='rgba(255,150,160,.24)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,full,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  const edge=ctx.createRadialGradient(0,0,Math.max(0,r-36),0,0,r);edge.addColorStop(0,'rgba(255,90,112,0)');edge.addColorStop(1,`rgba(255,70,100,${.08+.13*heat*(.6+.4*pulse)})`);ctx.fillStyle=edge;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
  ctx.globalCompositeOperation='screen';ctx.strokeStyle='#ff9fae';ctx.lineWidth=2;ctx.lineCap='round';
  for(let i=0;i<16;i++){const a=i*Math.PI/8+.2,ph=reduced?.5:(t*1.6+i*.13)%1,rr=r+11-ph*18,ux=-Math.cos(a),uy=-Math.sin(a),x=-ux*rr,y=-uy*rr;ctx.globalAlpha=Math.sin(ph*Math.PI)*(.35+.3*heat);ctx.beginPath();ctx.moveTo(x-ux*4-uy*5,y-uy*4+ux*5);ctx.lineTo(x,y);ctx.lineTo(x-ux*4+uy*5,y-uy*4-ux*5);ctx.stroke();}
 }
 ctx.restore();
}
function drawScorchDecals(c){
 for(const d of scorchDecals){const age=juiceTime-d.time;if(age<0||age>6000)continue;const a=Math.min(1,age/120)*(1-Math.max(0,age-3500)/2500),x=d.x-c.x,y=d.y-c.y;
  const g=ctx.createRadialGradient(x,y,4,x,y,70);g.addColorStop(0,`rgba(12,6,8,${.6*a})`);g.addColorStop(.55,`rgba(30,12,14,${.32*a})`);g.addColorStop(1,'rgba(30,12,14,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,70,0,Math.PI*2);ctx.fill();
  if(age<1600){ctx.save();ctx.globalCompositeOperation='screen';const ea=(1-age/1600)**2;for(let i=0;i<14;i++){const ang=i*2.39996,rr=26+((i*17)%22);ctx.globalAlpha=ea*(.5+.5*Math.sin(age/90+i));ctx.fillStyle=i%3?'#ff8a3d':'#ffd36b';ctx.beginPath();ctx.arc(x+Math.cos(ang)*rr,y+Math.sin(ang)*rr,1.6,0,Math.PI*2);ctx.fill();}ctx.restore();}
 }
}
// Bomb: heat grows with how long the current holder has kept it (never the hidden fuse).
function drawBombHeat(p,s){
 const held=bombHold.id===p.id?Math.max(0,s.visualTime-bombHold.since):0,heat=Math.min(1,held/6500),reduced=juiceReduced.matches,wob=reduced?0:Math.sin(s.visualTime/(95-45*heat))*(3+2*heat),glowR=p.radius+44+heat*22;
 ctx.save();ctx.globalCompositeOperation='screen';const glow=ctx.createRadialGradient(p.x,p.y,p.radius*.6,p.x,p.y,glowR);glow.addColorStop(0,`rgba(255,${Math.round(84+70*heat)},70,${.2+.22*heat})`);glow.addColorStop(1,'rgba(255,80,70,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(p.x,p.y,glowR,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.save();ctx.strokeStyle=heat>.55?'#ff8a5c':'#ff6372';ctx.lineWidth=6+heat*2;ctx.shadowBlur=28+heat*18;ctx.shadowColor=heat>.55?'#ff7a3d':'#ff4d5f';ctx.beginPath();ctx.arc(p.x,p.y,p.radius+13+wob,0,Math.PI*2);ctx.stroke();
 const age=s.visualTime-bombHold.since;if(bombHold.id===p.id&&bombHold.from&&age>=0&&age<360){const q=age/360;ctx.globalAlpha=(1-q)*(1-q);ctx.lineWidth=3;ctx.shadowBlur=0;ctx.strokeStyle='#fff1c2';ctx.beginPath();ctx.arc(p.x,p.y,p.radius+13+40*(1-Math.pow(1-q,3)),0,Math.PI*2);ctx.stroke();}
 ctx.restore();
}
function bombCatchPop(p,s){if(juiceReduced.matches||bombHold.id!==p.id||!bombHold.from)return 0;const age=s.visualTime-bombHold.since;return age>=0&&age<240?.2*(1-age/240)**2:0;}
function drawBombPassZap(s){
 if(!bombHold.from||juiceReduced.matches)return;const age=s.visualTime-bombHold.since;if(age<0||age>320)return;
 const a=s.players.find(p=>p.id===bombHold.from),b=s.players.find(p=>p.id===bombHold.id);if(!a||!b)return;
 const q=age/320,mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,bend=.18;
 ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
 for(const [w,col,al] of [[8,'#ff6a4d',.35],[2.5,'#fff1c2',.95]]){ctx.globalAlpha=(1-q)*(1-q)*al;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mx-dy*bend,my+dx*bend,b.x,b.y);ctx.stroke();}
 ctx.restore();
}
function drawBombBlast(e){
 const age=e.t*1000,reduced=juiceReduced.matches;ctx.save();ctx.globalCompositeOperation='screen';
 if(age<140){const rr=30+120*(age/140),g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,rr);g.addColorStop(0,'#ffffff');g.addColorStop(.4,'#ffe2a0cc');g.addColorStop(1,'#ff8a3d00');ctx.globalAlpha=1-age/140;ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.x,e.y,rr,0,Math.PI*2);ctx.fill();}
 ctx.restore();
 if(!reduced){const q=Math.min(1,e.t/e.ttl);ctx.save();for(let i=0;i<9;i++){const a=i*2.39996,d=(26+70*(1-Math.pow(1-q,2)))*(.8+.1*(i%3)),r=14+26*q;ctx.globalAlpha=.22*(1-q);ctx.fillStyle=i%2?'#3a2c33':'#5a4448';ctx.beginPath();ctx.arc(e.x+Math.cos(a)*d,e.y+Math.sin(a)*d-q*18,r,0,Math.PI*2);ctx.fill();}ctx.restore();}
}
// Round won on the field: one expanding gold ring and sparks around each survivor, then a calm halo.
function drawWinnerBeat(s){
 if(s.game.status!=='between'||betweenAt.key!==juiceRoundKey)return;const age=juiceTime-betweenAt.at,reduced=juiceReduced.matches;if(age<0)return;
 for(const p of s.players){if(!p.active||!betweenAt.winners?.includes(p.id))continue;ctx.save();ctx.globalCompositeOperation='screen';
  const halo=ctx.createRadialGradient(p.x,p.y,p.radius*.8,p.x,p.y,p.radius+30);halo.addColorStop(0,'rgba(255,211,107,.32)');halo.addColorStop(1,'rgba(255,211,107,0)');ctx.globalAlpha=Math.min(1,age/240);ctx.fillStyle=halo;ctx.beginPath();ctx.arc(p.x,p.y,p.radius+30,0,Math.PI*2);ctx.fill();
  if(age<760&&!reduced){const q=age/760,e=1-Math.pow(1-q,3);ctx.globalAlpha=(1-q)*(1-q);ctx.strokeStyle='#ffd36b';ctx.lineWidth=3*(1-q)+1;ctx.beginPath();ctx.arc(p.x,p.y,p.radius+8+54*e,0,Math.PI*2);ctx.stroke();
   for(let i=0;i<10;i++){const a=i*Math.PI/5+.3,d=p.radius+10+60*e;ctx.fillStyle=i%2?'#fff1c2':'#ffd36b';ctx.save();ctx.translate(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d);ctx.rotate(a);const k=3.2*(1-q)+.6;ctx.beginPath();ctx.moveTo(0,-k*1.8);ctx.lineTo(k*.6,0);ctx.lineTo(0,k*1.8);ctx.lineTo(-k*.6,0);ctx.closePath();ctx.fill();ctx.restore();}}
  ctx.restore();}
}
// Keep the round card off the winner so the field celebration stays visible.
function betweenCardTop(s){
 if(betweenAt.key!==juiceRoundKey||!['push','shrink','bomb'].includes(s.game.mode)||betweenAt.winners?.length!==1)return 305;if(betweenAt.top!=null)return betweenAt.top;
 const w=s.players.find(p=>p.id===betweenAt.winners[0]);if(!w)return 305;const b=roundArenaView?.bounds||{top:24,bottom:696};
 let top=w.y<360?w.y+w.radius+44:w.y-w.radius-200;top=Math.max(b.top+8,Math.min(b.bottom-118,top));return betweenAt.top=top;
}
function betweenEnter(){const age=performance.now()-betweenAt.wall;if(juiceReduced.matches||betweenAt.key!==juiceRoundKey)return{alpha:1,scale:1,age:1e9};const q=Math.min(1,Math.max(0,age/280)),e=1-Math.pow(1-q,3);return{alpha:e,scale:.94+.06*e,age};}
function drawBetweenShine(top,age){if(age>900)return;const q=age/900,x=300+680*q;ctx.save();roundRect(300,top,680,110,24);ctx.clip();const g=ctx.createLinearGradient(x-90,0,x+90,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,236,190,.09)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(x-90,top,180,110);ctx.globalAlpha=1-q;ctx.fillStyle='#ffd36b';ctx.fillRect(330,top,620*Math.min(1,q*2.2),2);ctx.restore();}
// Knives: the wheel recoils from each hit; your-colour hits get a gold glint, clangs white sparks.
function wheelKick(){let x=0,y=0;if(juiceReduced.matches)return{x,y};for(const k of wheelKicks){const age=juiceTime-k.time;if(age<0||age>180)continue;const m=k.amp*(1-age/180)**2;x+=k.dx*m;y+=k.dy*m;}return{x,y};}
function drawKnifeGlints(){
 const reduced=juiceReduced.matches;
 for(const g of knifeGlints){const age=juiceTime-g.time;if(age<0||age>420)continue;const q=age/420,e=1-Math.pow(1-q,3);ctx.save();ctx.globalCompositeOperation='screen';ctx.translate(g.x,g.y);
  if(g.kind==='own'){ctx.globalAlpha=(1-q)*(1-q);ctx.fillStyle='#fff1c2';const k=(10+16*e)*(reduced?.8:1);ctx.rotate(reduced?0:q*.8);ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?k*.22:k;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.strokeStyle='#ffd36b';ctx.lineWidth=2*(1-q)+.5;ctx.beginPath();ctx.arc(0,0,8+30*e,0,Math.PI*2);ctx.stroke();}
  else if(g.kind==='clang'&&!reduced){ctx.strokeStyle='#ffffff';ctx.lineCap='round';for(let i=0;i<7;i++){const a=i*.9+.4,tr=6+28*e;ctx.globalAlpha=(1-q)*(1-q);ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(Math.cos(a)*(tr-6),Math.sin(a)*(tr-6)+q*q*14);ctx.lineTo(Math.cos(a)*tr,Math.sin(a)*tr+q*q*14);ctx.stroke();}}
  else if(g.kind==='danger'){ctx.globalAlpha=(1-q)*.5;ctx.fillStyle='#ff5a6e';ctx.beginPath();ctx.arc(0,0,10+22*e,0,Math.PI*2);ctx.fill();}
  ctx.restore();}
}
// Western: anticipation dust, a hard DRAW flash and punch, readable reaction plates.
function westernDrawAge(){return westernCueFlash?.real?performance.now()-westernCueFlash.at:1e9;}
function westernShake(){const age=westernDrawAge();if(juiceReduced.matches||age>240)return{x:0,y:0};const m=6*(1-age/240)**2;return{x:Math.sin(age*.19)*m,y:Math.cos(age*.23)*m*.6};}
function drawWesternFlash(){const age=westernDrawAge();if(age>260)return;ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=(juiceReduced.matches?.18:.46)*(1-age/260)**2;ctx.fillStyle='#fff0cf';ctx.fillRect(-(westernViewWidth-1280)/2,0,westernViewWidth,720);ctx.restore();}
function westernCuePunch(isDraw){if(juiceReduced.matches||!westernCueFlash||performance.now()>westernCueFlash.until)return 1;const age=performance.now()-westernCueFlash.at;if(isDraw)return age<200?1+.42*(1-age/200)**3:1;return age<160?1+.16*(1-age/160)**2:1;}
function drawWesternDust(s){
 const reduced=juiceReduced.matches,t=reduced?0:performance.now()/1000,left=-(westernViewWidth-1280)/2,span=westernViewWidth+120;
 ctx.save();ctx.fillStyle='#f5d3a4';
 for(const d of westernDust){const x=left-60+((d.x+t*(14+18*d.s))%span),y=d.y+Math.sin(t*.8+d.ph)*4;ctx.globalAlpha=.08+.1*d.s;ctx.fillRect(x,y,2+d.s*4,1+d.s);}
 ctx.restore();
}
function drawReactionPlate(p,x,y,active,age,dead){
 const shooters=active.filter(q=>q.reactionMs!=null&&!q.falseStart),best=Math.min(...shooters.map(q=>q.reactionMs)),fastest=p.reactionMs===best,small=active.length>8,font=small?12:17,text=p.reactionMs+' мс';
 const q=juiceReduced.matches||!Number.isFinite(age)?1:Math.min(1,Math.max(0,age/220)),pop=q<1?.7+.3*(1-Math.pow(1-q,3))+.08*Math.sin(q*Math.PI):1;
 ctx.save();ctx.font=`italic 800 ${font}px PartyRubik, Rubik, system-ui`;const w=Math.min(160,ctx.measureText(text).width+(small?16:24)),h=font+(small?8:12);
 ctx.translate(x,y-h*.25);ctx.scale(pop,pop);ctx.globalAlpha=dead&&!fastest?.62:1;
 ctx.fillStyle=fastest?'#ffd36b':'#1d1624e6';roundRect(-w/2,-h/2,w,h,h/2);ctx.fill();ctx.strokeStyle=fastest?'#fff1c2':'#ffffff2e';ctx.lineWidth=1.2;ctx.stroke();
 ctx.fillStyle=fastest?'#2a1608':'#f7ecdf';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,0,1,w-8);
 if(fastest&&!juiceReduced.matches&&Number.isFinite(age)&&age<620){const e=Math.min(1,age/620),k=1-Math.pow(1-e,3);ctx.globalCompositeOperation='screen';ctx.globalAlpha=(1-e)*(1-e);ctx.fillStyle='#ffd36b';for(let i=0;i<8;i++){const a=i*Math.PI/4+.2,d=w*.45+30*k;ctx.beginPath();ctx.arc(Math.cos(a)*d,Math.sin(a)*d*.5,2.4*(1-e)+.6,0,Math.PI*2);ctx.fill();}}
 ctx.restore();
}
function render(){
  const roundReceiver=['push','shrink','bomb','knives'].includes(chosenMode||state?.game.mode)&&state?.game.status!=='lobby'&&(document.documentElement.classList.contains('party-display-only')||(parent!==window&&parent.PARTY_DISPLAY_ONLY===true));
  partyReceiverHeight=roundReceiver?1280*canvas.clientHeight/Math.max(1,canvas.clientWidth):720;
  westernViewWidth=(chosenMode||state?.game.mode)==='western'?Math.max(1280,720*canvas.clientWidth/Math.max(1,canvas.clientHeight)):1280;window.PartyArt?.beginFrame(ctx,westernViewWidth,partyReceiverHeight);ctx.save();if(state?.game.mode==='western')ctx.translate((westernViewWidth-1280)/2,0);
  ctx.textBaseline='alphabetic';
  const view=visualClock.sample(performance.now())||state;
  if(!state||state.game.mode!=='western')bg(view?.game.status!=='lobby'?view?.game.mode:null);
  if(view){juiceTime=view.visualTime;emitReliableFeelEvents(view);applyRoundArenaView(view);if((view.game.mode==='push'||view.game.mode==='shrink'))drawPush(view);else if(view.game.mode==='knives')drawKnives(view);else if(view.game.mode==='bomb'){drawBomb(view);drawVisualEvents(view);}else if(view.game.mode==='western')drawWestern(view);drawScore(view);drawCenterText(view);}ctx.restore();requestAnimationFrame(render);
}
render();

if(chosenMode==='shrink'){const l=document.createElement('label');l.style.cssText='display:block;margin:16px 0;font-size:18px';l.innerHTML='Темп арены <select id="shrinkSpeed" style="min-height:54px;font:inherit;padding:12px"><option value="normal">Обычный · 8 с пауза + 45 с сжатие</option><option value="fast">Быстрый · сразу, за 20 с</option></select>';document.querySelector('.mode-grid').before(l);}




function westernGunBurst(g,x,y,age,flip,scale=1){const t=Math.min(1,age/220);g.save();g.translate(x,y);g.globalAlpha=(1-t)**2;g.fillStyle='#ffcc66';g.beginPath();g.arc(0,0,(6+17*Math.sin(t*Math.PI))*scale,0,7);g.fill();for(let i=0;i<12;i++){const a=i*2.399,r=(12+70*t)*scale;g.strokeStyle=i%3?'#ff8b39':'#fff0ad';g.lineWidth=3*scale;g.beginPath();g.moveTo(Math.cos(a)*r,Math.sin(a)*r);g.lineTo(Math.cos(a)*(r+9*scale),Math.sin(a)*(r+9*scale));g.stroke();}g.globalAlpha=.35*(1-t);g.fillStyle='#50453f';g.beginPath();g.arc(-flip*t*12,-t*30,12+20*t,0,7);g.fill();g.restore();}

function westernRigActor(g,{x,y,height,color,flip=1,shotAge=Infinity,early=false,fall=0}){
 const mascot=window.WesternMascotRig?.draw(g,{x,y,height,color,flip,shotAge,early,fall});if(mascot)return mascot;
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

// Passive TV standings occupy the free wings; score data comes directly from state.
let liveStandingsKey='';
function renderLiveStandings(s){
 const mode=s.game.mode,active=['push','shrink','bomb','knives'].includes(mode)&&!['lobby','finished'].includes(s.game.status),players=sortPlayers((s.players||[]).filter(p=>p.active),mode);
 let rail=document.querySelector('.party-live-standings');
 if(!rail){
  rail=document.createElement('aside');rail.className='party-live-standings right';rail.dataset.tvHudRail='';rail.setAttribute('aria-label','Player standings');
  const board=document.createElement('div');board.className='party-standings-board';board.tabIndex=0;board.setAttribute('aria-label','Ordered player standings');
  const edges=()=>{board.dataset.scrollAbove=String(board.scrollTop>1);board.dataset.scrollBelow=String(board.scrollHeight-board.clientHeight-board.scrollTop>1);};
  board.addEventListener('scroll',edges,{passive:true});new ResizeObserver(edges).observe(board);rail.append(board);document.body.append(rail);
 }
 rail.hidden=!active;canvas.toggleAttribute('data-tv-hud-anchor',active||(mode==='western'&&s.game.status!=='lobby'));
 if(!active)return;const key=JSON.stringify([mode,players.map(p=>[p.id,p.name,p.color,scoreValue(p,mode),p.roundWins,p.alive])]);if(key===liveStandingsKey)return;liveStandingsKey=key;
 const board=rail.firstElementChild,scroll=board.scrollTop;
 board.replaceChildren(...players.map((p,i)=>{const row=document.createElement('div');row.className='party-standing'+(!p.alive?' out':'');const rank=document.createElement('span'),name=document.createElement('span'),points=document.createElement('strong'),place=playerPlace(players,i,mode);row.dataset.hpRank=String(place);rank.className='rank';rank.dataset.place=rank.dataset.hpRank=String(place);rank.textContent=place;name.className='name';name.textContent=p.name;name.title=(window.PARTY_ROSTER||[]).find(q=>String(q.name||'').trim().slice(0,20)===p.name)?.name||p.name;name.setAttribute('aria-label',name.title);points.textContent=scoreValue(p,mode)||0;row.style.setProperty('--player',p.color);const portrait=document.createElement('img');portrait.className='party-standing-portrait';portrait.dataset.photo=String(!!partyIdentity(p).avatar);portrait.src=window.PartyArt?.mascotSource(partyIdentity(p))||'/assets/avatars/atlas-mascots/mascot-01.webp';portrait.alt='';row.append(rank,portrait,name,points);return row;}));
 board.scrollTop=scroll;board.dataset.scrollAbove=String(board.scrollTop>1);board.dataset.scrollBelow=String(board.scrollHeight-board.clientHeight-board.scrollTop>1);
}
function drawShrinkForecast(s){
 if(s.game.mode!=='shrink'||s.game.status!=='playing')return;const r=s.game.arenaRadius,phase=matchMedia('(prefers-reduced-motion: reduce)').matches?.5:(s.visualTime%1700)/1700;
 ctx.save();ctx.lineWidth=1.4;for(let i=0;i<3;i++){const q=(phase+i/3)%1;ctx.strokeStyle='rgba(157,233,245,'+(.14*(1-q))+')';ctx.beginPath();ctx.arc(s.center.x,s.center.y,r+8+q*42,0,Math.PI*2);ctx.stroke();}ctx.restore();
}
