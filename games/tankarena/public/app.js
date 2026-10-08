// Event banners live in the roster footer, outside every playable cell.
let arsenalEvents,arsenalEventsContext;
function drawArsenalEvents(arena,fx){
 if(!arsenalEvents){
  arsenalEvents=document.createElement('canvas');arsenalEvents.id='arsenalEvents';arsenalEvents.width=360;arsenalEvents.height=124;arsenalEvents.setAttribute('aria-hidden','true');
  $('board').after(arsenalEvents);arsenalEventsContext=arsenalEvents.getContext('2d');
 }
 arsenalEvents.hidden=!state||state.phase!=='playing'||!fx?.diagnostics().banners;
 if(arsenalEvents.hidden){window.ArsenalEventFeed={banners:0,visible:false,placement:'roster-footer'};return;}
 const r=arsenalEvents.getBoundingClientRect();
 window.ArsenalEventFeed={left:r.left,top:r.top,width:r.width,height:r.height,fieldBottom:arena.getBoundingClientRect().bottom,banners:fx?.diagnostics().banners||0,placement:'roster-footer',visible:true};
 arsenalEventsContext.clearRect(0,0,360,124);fx?.drawBanners(arsenalEventsContext,performance.now(),{width:360,y:24,stacked:true});
}
// Uniform world units fill the measured field; the trusted server owns its height.
function beginArsenalProjection(g,canvas){
 g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,canvas.width,canvas.height);
 const box=canvas.getBoundingClientRect(),height=1200*box.height/Math.max(1,box.width),scale=box.width/1200;
 window.PartyArt?.beginFrame(g,1200,height);
 g.setTransform(canvas.width/1200,0,0,canvas.height/height,0,0);
 window.ArsenalProjection={receiver:{x:box.x,y:box.y,width:box.width,height:box.height,bottom:box.bottom},logical:{width:1200,height},world:{width:1200,height:state?.H||height,x:0,y:0,scale:1},cssScale:scale,worldCSS:{x:box.x,y:box.y,width:box.width,height:(state?.H||height)*scale},viewport:{width:innerWidth,height:innerHeight}};
 const board=document.getElementById('board')?.getBoundingClientRect();if(board){const margin=Math.max(16,innerWidth-board.right),end=board.left-margin;document.body.style.setProperty('--terrain-end',end+'px');}
 publishArsenalBounds(box,scale,height);
}
function publishArsenalBounds(box,scale,height){
 if(!box.width||!box.height)return;
 const rail=document.querySelector('[data-tv-hud-rail]')?.getBoundingClientRect();
 const regions=[...(window.PARTY_HUD_EXCLUSIONS||[]),...(rail?[rail]:[])];
 const exclusions=regions.map(r=>({x:(r.left-box.left)/scale,y:(r.top-box.top)/scale,w:r.width/scale,h:r.height/scale}));
 const geometry={width:1200,height,exclusions},signature=JSON.stringify(geometry),now=performance.now();
 window.ArsenalBoundsProof={...geometry,projection:{left:box.left,top:box.top,scale},authoritative:state?.playfield||null};
 if(signature!==arsenalBoundsSignature||now-arsenalBoundsSentAt>1000){arsenalBoundsSignature=signature;arsenalBoundsSentAt=now;send('responsiveHudInsets',{...geometry,sequence:++arsenalBoundsSequence});}
}
let arsenalFloor,arsenalBoundsSequence=0,arsenalBoundsSignature='',arsenalBoundsSentAt=0;
const $=id=>document.getElementById(id),host=!!window.IS_HOST;let ws,state,id=localStorage.getItem('tankarena_id'),joy={x:0,y:0,fire:false},pointer=null,boardKey='';const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function send(type,data){if(ws?.readyState===1)ws.send(JSON.stringify({type,data}));}function join(){const profile=window.PARTY_PROFILE;send('join',{name:profile?.name||$('nickname')?.value||localStorage.getItem('tankarena_name')||'Танкист',token:id,partyId:profile?.id,partyToken:profile?.token,party:profile});}
function connect(){ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws');ws.onopen=()=>{joy={x:0,y:0,fire:false};if(host){send('host');arsenalBoundsSignature='';arsenalBoundsSentAt=0;}else if(window.PARTY_PROFILE||id)join();};ws.onclose=()=>{if(!host){$('status').hidden=false;if($('combatStats'))$('combatStats').hidden=true;$('status').textContent='Связь потеряна — подключаемся снова…';}setTimeout(connect,650);};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='joined'){id=m.data.id;localStorage.setItem('tankarena_id',id);localStorage.setItem('tankarena_name',m.data.name);$('join').hidden=true;$('name').textContent=m.data.name;}if(m.type==='state'){state=m.data;update();}if(m.type==='error'&&!host)$('status').textContent=m.data;};}connect();
if(host)$('start').onclick=()=>send('start');else{$('join').onsubmit=e=>{e.preventDefault();join();};const zone=$('joy'),fire=$('fire'),firePointers=new Set();function reset(){firePointers.clear();pointer=null;joy.x=joy.y=0;joy.fire=false;$('knob').style.transform='translate(-50%,-50%)';send('input',joy);}function move(e){const r=zone.getBoundingClientRect(),max=r.width*.32;let x=(e.clientX-r.left-r.width/2)/max,y=(e.clientY-r.top-r.height/2)/max,n=Math.hypot(x,y);if(n>1){x/=n;y/=n;}joy.x=x;joy.y=y;$('knob').style.transform=`translate(calc(-50% + ${x*max}px),calc(-50% + ${y*max}px))`;send('input',joy);}zone.onpointerdown=e=>{if(zone.getAttribute('aria-disabled')==='true'||pointer!==null)return;e.preventDefault();pointer=e.pointerId;zone.setPointerCapture(pointer);move(e);};zone.onpointermove=e=>{if(e.pointerId===pointer)move(e);};const releaseMove=e=>{if(e?.pointerId!==undefined&&e.pointerId!==pointer)return;pointer=null;joy.x=joy.y=0;$('knob').style.transform='translate(-50%,-50%)';send('input',joy);};zone.onpointerup=zone.onpointercancel=zone.onlostpointercapture=releaseMove;fire.onpointerdown=e=>{e.preventDefault();firePointers.add(e.pointerId);fire.setPointerCapture(e.pointerId);joy.fire=true;send('input',joy);const box=fire.getBoundingClientRect();if(box.width){fire.style.setProperty('--press-x',((e.clientX-box.left)/box.width*100).toFixed(1)+'%');fire.style.setProperty('--press-y',((e.clientY-box.top)/box.height*100).toFixed(1)+'%');}fire.classList.remove('is-pressed');void fire.offsetWidth;fire.classList.add('is-pressed');if(window.LocalPartyFeel)window.LocalPartyFeel.emit('shot',{intensity:.22,visual:false});else navigator.vibrate?.(15);};const releaseFire=e=>{firePointers.delete(e.pointerId);joy.fire=firePointers.size>0;if(!firePointers.size)fire.classList.remove('is-pressed');send('input',joy);};fire.onpointerup=fire.onpointercancel=fire.onlostpointercapture=releaseFire;window.addEventListener('blur',reset);window.addEventListener('pagehide',reset);window.addEventListener('offline',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});setInterval(()=>{if(pointer!==null||firePointers.size)send('input',joy);},120);}
function update(){$('timer').textContent=Math.ceil(state.timer)+'с';const ps=[...state.players].sort((a,b)=>b.score-a.score),key=JSON.stringify(ps.map(p=>[p.id,p.score,p.kills,p.deaths,p.connected,Math.ceil(p.hp),p.dead>0]));if(key!==boardKey){boardKey=key;updateArsenalBoard(ps);}if(host){document.body.dataset.phase=state.phase;$('start').hidden=state.phase==='playing';$('start').textContent=state.phase==='finished'?'ЕЩЁ БОЙ · 90 СЕКУНД':'НАЧАТЬ БОЙ · 90 СЕКУНД';}else{const p=state.players.find(p=>p.id===id);const stats=$('combatStats'),showStats=!!p&&state.phase==='playing'&&p.dead<=0;if(stats){stats.hidden=!showStats;$('status').hidden=showStats&&!(p.shield>0||p.boost>0);if(showStats){$('combatHealth').textContent=Math.ceil(p.hp);$('combatWeapon').textContent=state.weapons[p.weapon].name;$('combatScore').textContent=p.score;}}const enabled=state.phase==='playing'&&!!p&&p.dead<=0;$('fire').disabled=!enabled;arsenalPhoneFeel(p,enabled);$('joy').setAttribute('aria-disabled',String(!enabled));if(!enabled){pointer=null;joy.x=joy.y=0;joy.fire=false;$('knob').style.transform='translate(-50%,-50%)';}if(p)$('status').textContent=state.phase==='finished'?'🏆 Бой окончен · '+p.score+' очков':state.phase==='lobby'?'Ты в игре. Ждём старт на компьютере.':p.dead>0?'💥 Возвращение через '+Math.ceil(p.dead)+'с':`♥ ${Math.ceil(p.hp)} · ${state.weapons[p.weapon].name} · ${p.score} очков${p.shield>0?' · 🛡 '+Math.ceil(p.shield):''}${p.boost>0?' · ⚡ '+Math.ceil(p.boost):''}`;if(showStats)$('status').textContent=[p.shield>0?'🛡 '+Math.ceil(p.shield):'',p.boost>0?'⚡ '+Math.ceil(p.boost):''].filter(Boolean).join(' · ');}}
if(host){const c=$('arena'),g=c.getContext('2d'),tankFX=window.HeyPalsTankFX?.create({width:1200,height:720,bannerY:52,inset:20,externalBanners:true});let fxSeen=null;function render(){if(tankFX&&state&&state!==fxSeen){fxSeen=state;tankFX.observe({round:state.phase==='lobby'?'lobby':'match',playing:state.phase!=='lobby',bullets:state.bullets,tanks:state.players.map(p=>({id:p.id,x:p.x,y:p.y,radius:22,hp:p.hp,alive:p.connected&&p.dead<=0,kills:p.kills,name:p.name,color:p.color}))});}if(tankFX?.holding()){requestAnimationFrame(render);return;}beginArsenalProjection(g,c);const shake=tankFX?.shake()||{x:0,y:0};g.save();g.beginPath();g.rect(0,0,1200,state?.H||window.ArsenalProjection.logical.height);g.clip();if(shake.x||shake.y){g.fillStyle='#1e282d';g.fillRect(0,0,1200,state?.H||window.ArsenalProjection.logical.height);g.translate(shake.x,shake.y);}drawArenaFloor(g);if(state){drawArsenalHistory(g,state);if(state.phase!=='lobby')tankFX?.drawUnder(g);for(const p of state.pickups){g.fillStyle='#ffc769';g.save();g.translate(p.x,p.y);softArsenalShadow(g,0,14,15,5);drawPickup(g,p);g.restore();g.fillStyle='#fff';g.font='italic 900 21px KardiaFatRunner, sans-serif';g.textAlign='center';g.fillText(p.kind==='heal'?'HEAL +40':p.kind==='shield'?'SHIELD':p.kind==='boost'?'BOOST':state.weapons[p.weapon].name,p.x,p.y-24);}for(const p of state.players){if(state.phase==='lobby')continue;if(!p.connected||p.dead>0)continue;const fxPose=tankFX?.pose(p.id)||{dx:0,dy:0,glow:0};softArsenalShadow(g,p.x,p.y+17,24,10);g.save();g.translate(p.x+fxPose.dx,p.y+fxPose.dy);g.rotate(p.angle);if(!tankArtwork(g,22,p.color)){g.fillStyle='#090f16';g.fillRect(-24,-25,48,14);g.fillRect(-24,11,48,14);g.fillStyle=p.color;g.shadowColor=p.color;g.shadowBlur=12;g.fillRect(-21,-15,42,30);g.shadowBlur=0;g.fillStyle='#e1f2fa';g.fillRect(0,-5,38,10);g.fillStyle=p.color;g.beginPath();g.arc(0,0,12,0,Math.PI*2);g.fill();}if(fxPose.glow>0){g.globalCompositeOperation='lighter';g.globalAlpha=fxPose.glow*.85;const hot=g.createRadialGradient(0,0,0,0,0,38);hot.addColorStop(0,'#ffffff');hot.addColorStop(.45,'#ffd9de');hot.addColorStop(1,'#ff5b6700');g.fillStyle=hot;g.beginPath();g.arc(0,0,38,0,Math.PI*2);g.fill();}g.restore();if(p.shield>0){g.strokeStyle='#91efff99';g.beginPath();g.arc(p.x,p.y,36,0,Math.PI*2);g.stroke();}}for(const b of state.bullets){g.save();const speed=Math.hypot(b.vx,b.vy)||1,dx=b.vx/speed,dy=b.vy/speed,col=b.kind==='rocket'?'#ffbc64':b.color;g.translate(b.x,b.y);g.rotate(Math.atan2(dy,dx));g.shadowColor=col||'#ffe5a2';g.shadowBlur=b.kind==='rocket'?14:8;g.fillStyle=b.kind==='flame'?'#ff985b':b.kind==='sniper'?'#97f4ff':'#fff2cc';g.beginPath();g.ellipse(0,0,b.kind==='rocket'?9:b.kind==='sniper'?12:b.kind==='flame'?7:5,b.kind==='flame'?5:b.kind==='rocket'?4:2,0,0,7);g.fill();g.restore();}for(const e of state.effects){const t=1-e.t/(e.max||.7);g.save();g.translate(e.x,e.y);g.strokeStyle=e.color;g.lineWidth=3*(1-t)+1;g.globalAlpha=(1-t)**2;const radius=(e.max>.3?75:28)*(1-(1-t)**3)+3;g.beginPath();g.arc(0,0,radius,0,Math.PI*2);g.stroke();for(let i=0;i<8;i++){const a=i*2.399,r=radius*.8;g.beginPath();g.moveTo(Math.cos(a)*r,Math.sin(a)*r);g.lineTo(Math.cos(a)*(r+10*(1-t)),Math.sin(a)*(r+10*(1-t)));g.stroke();}g.restore();}if(state.phase!=='lobby')tankFX?.drawOver(g);drawArsenalEvents(c,tankFX);drawArsenalNames(g,c,state);if(state.phase!=='playing'){g.fillStyle='#141419e0';g.fillRect(280,270,640,150);g.fillStyle='#b4ff39';g.textAlign='center';g.font='italic 800 40px PartyRubik, Rubik, system-ui';g.fillText(state.phase==='finished'?'БОЙ ОКОНЧЕН':'ТАНКОВЫЙ БАР',600,340);g.font='italic 800 20px PartyRubik, Rubik, system-ui';g.fillText('7 оружий · 90 секунд · бесконечные возрождения',600,382,600);}}g.restore();requestAnimationFrame(render);}render();}


const arsenalTankImage=new Image(),arsenalTankTints=new Map();arsenalTankImage.src='/assets/gameplay/refresh129/arsenal-tank.png';
function tankArtwork(context,r,color){
 if(!arsenalTankImage.complete||!arsenalTankImage.naturalWidth)return false;
 let sprite=arsenalTankTints.get(color);if(!sprite){sprite=document.createElement('canvas');sprite.width=sprite.height=192;const t=sprite.getContext('2d');t.drawImage(arsenalTankImage,0,0,192,192);t.globalCompositeOperation='multiply';t.fillStyle=color;t.fillRect(0,0,192,192);t.globalCompositeOperation='destination-in';t.drawImage(arsenalTankImage,0,0,192,192);arsenalTankTints.set(color,sprite);}
 context.save();context.rotate(Math.PI/2);context.drawImage(sprite,-r*1.65,-r*2.1,r*3.3,r*3.3);context.restore();return true;
}


// Generated ground texture (assets/arena-ground.png): a dimmed tiled layer under the grid; the floor cache is rebuilt once it decodes.
var arsenalGround;
function drawArenaFloor(g){
 if(document.getElementById('arsenalTerrain'))return;
 if(!arsenalGround){arsenalGround=new Image();arsenalGround.decoding='async';arsenalGround.onload=()=>{arsenalFloor=null;};arsenalGround.src='assets/arena-ground.png';}
 const height=Math.ceil(window.ArsenalProjection?.logical.height||720);
 if(!arsenalFloor||arsenalFloor.height!==height){
  arsenalFloor=document.createElement('canvas');arsenalFloor.width=1200;arsenalFloor.height=height;
  const t=arsenalFloor.getContext('2d'),v=t.createLinearGradient(0,0,1200,height);v.addColorStop(0,'#263235');v.addColorStop(.5,'#1e282d');v.addColorStop(1,'#302b36');t.fillStyle=v;t.fillRect(0,0,1200,height);
  if(arsenalGround.complete&&arsenalGround.naturalWidth){t.save();t.globalAlpha=.42;t.setTransform(.42,0,0,.42,0,0);t.fillStyle=t.createPattern(arsenalGround,'repeat');t.fillRect(0,0,1200/.42,height/.42);t.restore();t.fillStyle='#141a1f9a';t.fillRect(0,0,1200,height);}
 }
 g.drawImage(arsenalFloor,0,0);
}



const arsenalTrails=new Map(),arsenalMarks=[],arsenalSeen=new Set();
function softArsenalShadow(g,x,y,rx,ry){g.save();g.translate(x,y);g.scale(1,ry/rx);const shade=g.createRadialGradient(0,0,0,0,0,rx);shade.addColorStop(0,'#02070ba0');shade.addColorStop(.45,'#02070b55');shade.addColorStop(1,'#02070b00');g.fillStyle=shade;g.beginPath();g.arc(0,0,rx,0,7);g.fill();g.restore();}
function drawArsenalHistory(g,s){const now=window.PARTY_GAME_CLOCK?.performanceNow?.()??performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(s.phase==='lobby'){arsenalTrails.clear();arsenalMarks.length=0;arsenalSeen.clear();}for(const b of s.bullets){let entry=arsenalTrails.get(b.id);if(!entry){entry={color:b.kind==='rocket'?'#ffc06c':b.color,width:b.kind==='rocket'?6:2.5,points:[]};arsenalTrails.set(b.id,entry);}const last=entry.points.at(-1);if(!last||Math.hypot(last.x-b.x,last.y-b.y)>2){entry.points.push({x:b.x,y:b.y,t:now});if(entry.points.length>16)entry.points.shift();}}while(arsenalTrails.size>128)arsenalTrails.delete(arsenalTrails.keys().next().value);g.save();g.globalCompositeOperation='screen';g.lineCap='round';for(const [id,e]of arsenalTrails){e.points=e.points.filter(p=>now-p.t<280);if(!e.points.length){arsenalTrails.delete(id);continue;}if(reduced)continue;for(let i=1;i<e.points.length;i++){const a=e.points[i-1],b=e.points[i],q=Math.max(0,1-(now-a.t)/280);g.globalAlpha=q*q*.7;g.strokeStyle=e.color;g.lineWidth=e.width*q;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();}}g.restore();for(const e of s.effects){if(!e.id||arsenalSeen.has(e.id))continue;arsenalSeen.add(e.id);arsenalMarks.push({x:e.x,y:e.y,t:now,size:e.max>.3?10:4});if(arsenalMarks.length>32)arsenalMarks.shift();}if(arsenalSeen.size>512)arsenalSeen.clear();for(let i=arsenalMarks.length-1;i>=0;i--){const m=arsenalMarks[i],age=now-m.t;if(age>2200){arsenalMarks.splice(i,1);continue;}g.save();g.globalAlpha=.65*Math.min(1,(2200-age)/700);softArsenalShadow(g,m.x,m.y,m.size,m.size*.65);g.restore();}window.arsenalFXCounts={trails:arsenalTrails.size,points:[...arsenalTrails.values()].reduce((n,e)=>n+e.points.length,0),marks:arsenalMarks.length};}

// Generated pickup tokens (assets/tokens, sliced from games/tanks atlas-battlefield); procedural tile is the fallback.
var arsenalTokens;
function pickupToken(p){if(!arsenalTokens){arsenalTokens={};for(const k of ['heal','shield','boost','flame','machinegun']){const img=new Image();img.decoding='async';img.onload=()=>{arsenalTokens[k]=img;};img.src='assets/tokens/pickup-'+k+'.webp';}}
 const key=p.kind==='heal'||p.kind==='shield'||p.kind==='boost'?p.kind:p.weapon==='flame'?'flame':'machinegun';return arsenalTokens[key];}
function drawPickup(g,p){
 const token=pickupToken(p);if(token){const s=46/Math.max(token.width,token.height);g.drawImage(token,-token.width*s/2,-token.height*s/2,token.width*s,token.height*s);return;}
 // Every weapon and skill uses the same 36px tile and 24px glyph area.
 g.fillStyle=p.kind==='heal'?'#b9ff71':p.kind==='shield'?'#84ddff':p.kind==='boost'?'#e4b1ff':'#ffd074';
 g.beginPath();g.roundRect(-18,-18,36,36,9);g.fill();g.fillStyle='#161b2b';
 if(!p.kind||p.kind==='weapon'){
  const kind=p.weapon||'cannon';g.save();g.strokeStyle='#161b2b';g.lineWidth=3;g.lineCap='round';
  if(kind==='sniper'){g.beginPath();g.arc(0,0,8,0,Math.PI*2);g.moveTo(-12,0);g.lineTo(12,0);g.moveTo(0,-12);g.lineTo(0,12);g.stroke();}
  else if(kind==='flame'){g.beginPath();g.moveTo(0,-12);g.bezierCurveTo(12,-2,12,10,1,12);g.bezierCurveTo(-12,12,-12,2,-6,-5);g.lineTo(-3,2);g.closePath();g.fill();}
  else if(kind==='rocket'){g.beginPath();g.moveTo(0,-12);g.lineTo(7,-3);g.lineTo(7,6);g.lineTo(12,12);g.lineTo(0,8);g.lineTo(-12,12);g.lineTo(-7,6);g.lineTo(-7,-3);g.closePath();g.fill();}
  else{const n=kind==='shotgun'?3:kind==='twin'?2:1;for(let i=0;i<n;i++){const x=(i-(n-1)/2)*8;g.fillRect(x-2,-12,4,17);}g.fillRect(-10,5,20,7);if(kind==='rapid'){g.fillRect(-10,-10,4,4);g.fillRect(6,-3,4,4);}}
  g.restore();return;
 }
 if(p.kind==='heal'){g.fillRect(-4,-12,8,24);g.fillRect(-12,-4,24,8);}
 else if(p.kind==='shield'){g.beginPath();g.moveTo(-11,-11);g.lineTo(11,-11);g.lineTo(9,5);g.lineTo(0,13);g.lineTo(-9,5);g.closePath();g.fill();}
 else{g.beginPath();g.moveTo(1,-14);g.lineTo(-10,2);g.lineTo(-1,2);g.lineTo(-3,14);g.lineTo(11,-4);g.lineTo(3,-4);g.closePath();g.fill();}
}


// Keyed rows preserve scroll position and names during 30 Hz health updates.
const arsenalRows=new Map();
function updateArsenalBoard(players){
 const board=$('board'),active=new Set(players.map(p=>p.id)),previousScroll=board.scrollTop,atBottom=previousScroll>0&&previousScroll+board.clientHeight>=board.scrollHeight-2;
 for(const [id,row] of arsenalRows)if(!active.has(id)){row.remove();arsenalRows.delete(id);}
 players.forEach((p,index)=>{
  let row=arsenalRows.get(p.id);
  if(!row){row=document.createElement('div');row.className='stat';row.innerHTML='<div class="arsenal-identity"><span class="arsenal-rank"></span><img class="arsenal-avatar" alt=""><span class="arsenal-name hp-player-name" data-no-translate></span></div><div class="arsenal-metrics"><span class="arsenal-points"><small>Очки</small><strong class="arsenal-score">0</strong></span><span class="arsenal-kills"><small>Убийства</small><strong class="arsenal-kill-count">0</strong></span></div><div class="arsenal-health"><span></span><div class="arsenal-health-track" aria-hidden="true"><i></i></div></div>';arsenalRows.set(p.id,row);}
  row.style.setProperty('--player-color',p.color);row.dataset.connected=String(p.connected);row.dataset.dead=String(p.dead>0);
  row.querySelector('.arsenal-rank').textContent=players.findIndex(q=>q.score===p.score)+1;
  const avatar=row.querySelector('.arsenal-avatar'),profile=window.PARTY_ROSTER?.find(member=>member.id===p.id),identity=profile?.avatar||p.name||p.id;
  avatar.dataset.photo=String(!!profile?.avatar);if(avatar.dataset.identity!==identity){let seed=0;for(const c of String(p.name||p.id))seed=(seed*31+c.charCodeAt(0))>>>0;avatar.src=window.PartyArt?.mascotSource?.({seed:p.name||p.id,avatar:profile?.avatar})||profile?.avatar||'/assets/avatars/atlas-mascots/mascot-'+String(1+seed%16).padStart(2,'0')+'.webp';avatar.dataset.identity=identity;}
  const name=row.querySelector('.arsenal-name');name.textContent=p.name;name.title=p.name+(p.connected?'':' · offline');
  row.querySelector('.arsenal-score').textContent=p.score;
  const health=row.querySelector('.arsenal-health'),hp=p.dead>0?0:Math.max(0,Math.min(100,Math.ceil(p.hp)));health.style.setProperty('--hp',hp+'%');health.querySelector('span').textContent=hp+' HP';
  row.querySelector('.arsenal-kill-count').textContent=p.kills;
  if(board.children[index]!==row)board.insertBefore(row,board.children[index]||null);
 });
 board.scrollTop=atBottom?board.scrollHeight:previousScroll;
 updateArsenalScroll();
}
function updateArsenalScroll(){const board=$('board');if(!board)return;board.dataset.scrollAbove=String(board.scrollTop>1);board.dataset.scrollBelow=String(board.scrollTop+board.clientHeight<board.scrollHeight-1);}
if(host){$('board').addEventListener('scroll',updateArsenalScroll,{passive:true});new ResizeObserver(updateArsenalScroll).observe($('board'));}

// Identity labels retain a14 CSS px floor; ellipses shorten names without
// squeezing their glyphs. Nearby tanks receive separate labels with leader lines.
const arsenalNameSlots=new Map();
function drawArsenalNames(g,canvas,s){
 const box=canvas.getBoundingClientRect(),matrix=g.getTransform(),projection=window.ArsenalProjection,receiverFit=Math.min(box.width/canvas.width,box.height/canvas.height),scale=Math.max(.25,projection?.cssScale||receiverFit*Math.hypot(matrix.a,matrix.b)),style=getComputedStyle(document.documentElement),hud=Math.max(0,...['--party-stage-inset-top','--party-native-inset-top'].map(key=>parseFloat(style.getPropertyValue(key))||0)),originY=projection?projection.worldCSS.y:box.top+(box.height-canvas.height*receiverFit)/2+matrix.f*receiverFit,safeTop=Math.max(20,(hud+12-originY)/scale);
 // The roster-docked notch no longer covers the arena. Avoid the measured
 // painted HUD regions instead of pushing every identity below its old depth.
 const blockers=(window.ArsenalBoundsProof?.exclusions||[]).map(r=>({...r}));let labelFloor=safeTop;
 if(parent!==window&&parent.document.body.classList.contains('tv-hud-over-roster')){
  const frame=parent.document.getElementById('gameFrame')?.getBoundingClientRect(),frameScale=frame?.width/innerWidth||1,originX=projection?projection.worldCSS.x:box.left+(box.width-canvas.width*receiverFit)/2+matrix.e*receiverFit;
  if(frame){for(const node of parent.document.querySelectorAll('#play .tv-info-center,#play .tv-info-wing')){const r=node.getBoundingClientRect();if(r.width&&r.height)blockers.push({x:((r.left-frame.left)/frameScale-originX)/scale,y:((r.top-frame.top)/frameScale-originY)/scale,w:r.width/frameScale/scale,h:r.height/frameScale/scale});}labelFloor=20;}
 }
 const players=s.phase==='lobby'?[]:s.players.filter(p=>p.connected&&p.dead<=0),font=14/scale,gap=font*.3,placed=[];
 g.save();g.font=`550 ${font}px KardiaFit, sans-serif`;g.textAlign='center';g.textBaseline='alphabetic';
 const overlap=(a,b)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
 const bodies=players.map(p=>({x:p.x-38,y:p.y-38,w:76,h:76}));
 for(const p of players){
  const maxWidth=Math.min(240,175/scale);let text=String(p.name),letters=Array.from(text);while(letters.length&&g.measureText(text).width>maxWidth){letters.pop();text=letters.join('')+'…';}
  const w=Math.max(g.measureText(text).width+12,font*3.8),h=font*2.45,preferred={x:p.x-w/2,y:p.y-48-h,w,h},previous=arsenalNameSlots.get(p.id),candidates=[preferred];
  if(previous)candidates.push({x:p.x+previous.dx,y:p.y+previous.dy,w,h});
  for(let ring=0;ring<8;ring++)for(const a of[-Math.PI/2,Math.PI/2,0,Math.PI,-Math.PI/4,-3*Math.PI/4,Math.PI/4,3*Math.PI/4]){const d=60+ring*(h+8);candidates.push({x:p.x+Math.cos(a)*d-w/2,y:p.y+Math.sin(a)*d-h/2,w,h});}
  let best,cost=Infinity;
  for(const raw of candidates){const r={...raw,x:Math.max(16,Math.min(1184-w,raw.x)),y:Math.max(labelFloor,Math.min((s.H||720)-20-h,raw.y))};const collisions=placed.filter(q=>overlap(r,q)).length+bodies.filter(q=>overlap(r,q)).length+blockers.filter(q=>overlap(r,q)).length;const continuity=previous?Math.hypot(r.x-p.x-previous.dx,r.y-p.y-previous.dy):0;const score=collisions*1e7+(r.x-preferred.x)**2+(r.y-preferred.y)**2+continuity*font;if(score<cost){best=r;cost=score;}}
  placed.push({...best,p,text});arsenalNameSlots.set(p.id,{dx:best.x-p.x,dy:best.y-p.y});
 }
 for(const r of placed){const x=r.x+r.w/2,y=r.y+r.h/2,d=Math.hypot(x-r.p.x,y-r.p.y);if(d>80){g.globalAlpha=.3;g.strokeStyle=r.p.color;g.lineWidth=1.2;g.beginPath();g.moveTo(r.p.x,r.p.y);g.lineTo(x,y);g.stroke();}}
 g.globalAlpha=1;
 for(const r of placed){
  const x=r.x+r.w/2,hp=Math.max(0,Math.min(100,Math.ceil(r.p.hp))),metricFont=font*.85,badgeWidth=font*3.8,badgeY=r.y+font+4,badgeHeight=font*1.25;
  g.font=`550 ${font}px KardiaFit, sans-serif`;g.shadowColor='#0a101c';g.shadowBlur=5;g.fillStyle='#faf7ff';g.fillText(r.text,x,r.y+font);g.shadowBlur=0;
  g.fillStyle='#100d1be8';g.beginPath();g.roundRect(x-badgeWidth/2,badgeY,badgeWidth,badgeHeight,6);g.fill();
  g.font=`italic 900 ${metricFont}px KardiaFatRunner, sans-serif`;g.fillStyle=hp<30?'#ffb0aa':'#f8f2ff';g.fillText(hp+' HP',x,badgeY+metricFont);
  g.fillStyle='#ffffff20';g.fillRect(x-badgeWidth/2+5,badgeY+badgeHeight-4,badgeWidth-10,2);g.fillStyle=hp<30?'#ff8b80':'#c8ff73';g.fillRect(x-badgeWidth/2+5,badgeY+badgeHeight-4,(badgeWidth-10)*hp/100,2);
 }
 g.restore();window.ArsenalNameLabels=placed.map(r=>({id:r.p.id,text:r.text,x:r.x,y:r.y,w:r.w,h:r.h,pixelFont:14,safeTop:labelFloor}));
 const active=new Set(players.map(p=>p.id));for(const id of arsenalNameSlots.keys())if(!active.has(id))arsenalNameSlots.delete(id);
}


// Phone feel (presentation only). The FIRE ring shows the real server reload
// (player.cd against the weapon's cd), only for weapons slow enough to read.
// A finished long reload pops the button once; pickups and being destroyed
// pulse haptics through the shared feel layer (native iOS included).
let arsenalPhonePrevious=null;
function arsenalPhoneFeel(p,enabled){
 const fire=$('fire');if(!fire||!p)return;const w=state.weapons?.[p.weapon],total=w?.cd||0,left=enabled&&total>=.45?Math.max(0,Math.min(1,(p.cd||0)/total)):0;
 fire.style.setProperty('--reload',left.toFixed(3));fire.classList.toggle('is-reloading',left>0);
 const prev=arsenalPhonePrevious;arsenalPhonePrevious={cd:left,weapon:p.weapon,dead:p.dead>0,phase:state.phase};
 if(!prev||prev.phase!=='playing'||state.phase!=='playing')return;const feel=window.LocalPartyFeel;
 if(prev.cd>0&&left===0&&total>=.9&&enabled){fire.classList.remove('is-ready');void fire.offsetWidth;fire.classList.add('is-ready');}
 if(!prev.dead&&p.dead>0)feel?.emit('elimination',{intensity:.9,visual:false,color:'#ff667c'});
 else if(prev.weapon!==p.weapon&&!prev.dead&&p.dead<=0)feel?.emit('score',{intensity:.4,visual:false});
}
