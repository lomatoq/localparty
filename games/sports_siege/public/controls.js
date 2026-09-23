import {PartyConnection} from './net.js';
const $=id=>document.getElementById(id),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mode=window.SS_CONFIG.mode,sports=['curling','bowling'].includes(mode),bot=!!window.parent.PARTY_TEST_BOT;
const net=new PartyConnection();let state=null,me=null,gesture=null,aimPointer=null,firePointer=null,sweepPointer=null,fire=false,sweep=false;
let aim={x:.5,y:.5},lastEvent=0,pendingTurn='',sound=false,audio,hand=window.PARTY_PROFILE?.hand||sessionStorage.getItem('ss-hand')||'right';
$('ss-sports').hidden=!sports;$('ss-shooter').hidden=sports;
$('ss-title')?.remove();
function applyHand(){document.body.classList.toggle('ss-left',hand==='left');$('ss-hand').textContent=hand==='left'?'Левая ⇆':'Правая ⇆';}
applyHand();
$('ss-hand').onclick=()=>{release();hand=hand==='left'?'right':'left';sessionStorage.setItem('ss-hand',hand);applyHand();};
$('ss-sound').onclick=()=>{sound=!sound;$('ss-sound').textContent=sound?'Звук: вкл.':'Звук: выкл.';$('ss-sound').setAttribute('aria-pressed',String(sound));if(sound){audio||=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}};
function ping(good=true){if(navigator.vibrate)navigator.vibrate(good?12:30);if(sound&&audio?.state==='running'){const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(good?640:180,audio.currentTime);o.frequency.exponentialRampToValueAtTime(good?940:95,audio.currentTime+.06);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.1);}}
let feedbackTimer;
function feedback(text,good=true){$('ss-feedback').textContent=text;$('ss-feedback').classList.add('show');clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>$('ss-feedback').classList.remove('show'),700);ping(good);}
net.addEventListener('status',e=>$('ss-connection').textContent=e.detail);
net.addEventListener('joined',e=>{net.id=e.detail.id;$('ss-name').textContent=e.detail.name;});
net.addEventListener('state',e=>{
  state=e.detail;me=state.players.find(p=>p.id===net.id);if(!me)return;
  document.documentElement.style.setProperty('--ss-player',me.color);$('ss-name').textContent=`${me.number}. ${me.name}`;
  if(pendingTurn&&pendingTurn!==state.turnToken)pendingTurn='';
  if(gesture&&(state.currentId!==me.id||state.stage!=='aim'||gesture.token!==state.turnToken))cancelGesture();
  const current=state.players.find(p=>p.id===state.currentId),time=Math.max(0,Math.ceil(state.deadline-state.t));
  let title=state.phase==='waiting'?'Ждём готовности компании':state.phase==='results'?(state.result.winners.includes(me.id)?'Победа! Красиво.':'Матч закончен'):!me.participant?'Ты смотришь. Вступишь в следующий матч.':'';
  if(!title)title=sports?(state.stage==='aim'?(state.currentId===me.id?'ТВОЙ БРОСОК':`Бросает ${current?.name||'игрок'}`):state.stage==='rolling'?'Смотри на общий экран':state.stage==='end'?'Считаем энд':'Красиво катится…'):mode==='swarm_gate'?`Волна ${state.wave} / ${state.waveCount}`:`До финала: ${time} сек`;
  $('ss-turn').textContent=title;
  $('ss-personal').textContent=mode==='bowling'?`${me.score} очков · фрейм ${me.frames?.length||1}/${state.frameCount||5}`:mode==='curling'?`${me.team===0?'Коралловая':'Бирюзовая'} команда · ${state.teams?.[me.team]||0} очков · энд ${state.endIndex||0}/${state.endCount||3}`:mode==='swarm_gate'?`${me.kills} уничтожено · ворота ${Math.ceil(state.gate||0)} / 1000`:`${me.score} очков · серия ${me.streak}/6`;
  $('ss-progress').style.width=(mode==='swarm_gate'?me.heat*100:mode==='curling'?me.energy*100:mode==='peek_shoot'?me.gunUntil>state.t?(me.gunUntil-state.t)/8*100:me.charge?100:me.streak/6*100:Math.min(100,time/25*100))+'%';
  const canThrow=state.phase==='playing'&&me.participant&&state.currentId===me.id&&state.stage==='aim'&&pendingTurn!==state.turnToken;
  $('ss-throw-pad').classList.toggle('disabled',!canThrow);$('ss-position').disabled=$('ss-spin').disabled=!canThrow;
  $('ss-sweep').hidden=mode!=='curling';$('ss-sweep').disabled=state.phase!=='playing'||state.stage!=='rolling'||me.team!==current?.team||me.energy<.03||!me.participant;
  $('ss-sweep').textContent=sweep?'ТРЁМ ЛЁД!':'ДЕРЖИ, ЧТОБЫ ТЕРЕТЬ ЛЁД';
  $('ss-fire').disabled=state.phase!=='playing'||!me.participant||(mode==='swarm_gate'&&me.lockedUntil>state.t);
  const ability=$('ss-ability');
  if(mode==='swarm_gate'){const remaining=Math.ceil(Math.max(0,me.abilityAt-state.t));ability.disabled=!!remaining||state.phase!=='playing'||!me.participant;ability.textContent=remaining?`ИМПУЛЬС · ${remaining} c`:'ИМПУЛЬС ↗';}
  else{const remaining=Math.ceil(Math.max(0,me.gunUntil-state.t));ability.disabled=!me.charge||!!remaining||state.phase!=='playing'||!me.participant;ability.textContent=remaining?`ПУЛЕМЁТ · ${remaining} c`:me.charge?'ВКЛЮЧИТЬ ПУЛЕМЁТ':'6 ПОПАДАНИЙ → ПУЛЕМЁТ';}
  $('ss-help').textContent=mode==='bowling'?'Свайп вверх: сила и направление. Подкрутку можно задать ползунком.':mode==='curling'?'Цель — ближе к центру. Пока камень своей команды едет — держи свип.':mode==='swarm_gate'?'Веди прицел и держи огонь. Импульс бьёт по области. Следи за нагревом.':'Прицел — тачпад. Огонь — отдельная кнопка. Белый флажок: не стрелять.';
  for(const event of state.events){if(event.id<=lastEvent)continue;lastEvent=event.id;
    if(event.player!==me.id)continue;
    if(event.kind==='shot'&&event.hit){ping(event.good!==false);if(event.dead)window.LocalPartyFeel?.emit('elimination',{id:state.roundSerial+':'+event.id,intensity:.7,haptic:true});}
    else if(event.kind==='charged')feedback('ПУЛЕМЁТ ГОТОВ!');
    else if(event.kind==='machinegun')feedback('8 СЕКУНД ОГНЯ!');
    else if(event.kind==='friendly')feedback('МИРНЫЙ! −15',false);
    else if(event.kind==='roll')feedback(event.pins===10?'СТРАЙК!':`+${event.pins}`);
  }
});
const pad=$('ss-throw-pad'),canvas=$('ss-gesture'),ctx=canvas.getContext('2d');
function point(e){const r=pad.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top,t:performance.now(),w:r.width,h:r.height};}
function measure(g){
  const a=g.points[0],b=g.points.at(-1),mid=g.points[Math.floor(g.points.length/2)],dy=a.y-b.y,dx=b.x-a.x;
  const recent=g.points.find(p=>b.t-p.t<120)||a,seconds=Math.max(.04,(b.t-recent.t)/1000);
  const velocity=Math.max(0,(recent.y-b.y)/seconds)/a.h;
  return {power:clamp(.12+Math.sqrt(clamp(dy/a.h))*.40+clamp(velocity,0,3)*.15),angle:clamp(Math.atan2(dx,Math.max(20,dy))*.32,-.32,.32),
    spin:clamp(Number($('ss-spin').value)+((b.x-a.x)-2*(mid.x-a.x))/a.w*3,-1,1),position:Number($('ss-position').value),valid:dy>a.h*.09&&b.t-a.t>65};
}
function drawGesture(){
  const r=pad.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);ctx.setTransform(d,0,0,d,0,0);
  if(!gesture)return;
  ctx.lineWidth=4;ctx.lineCap='round';ctx.strokeStyle=me?.color||'#c8ff73';ctx.beginPath();gesture.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
  const b=gesture.points.at(-1);ctx.beginPath();ctx.arc(b.x,b.y,12,0,Math.PI*2);ctx.stroke();$('ss-power').textContent=Math.round(measure(gesture).power*100)+'%';
}
function cancelGesture(){gesture=null;pad.classList.remove('active');$('ss-power').textContent='0%';drawGesture();}
pad.addEventListener('pointerdown',e=>{if(gesture||!state||state.phase!=='playing'||state.currentId!==net.id||state.stage!=='aim'||pendingTurn===state.turnToken)return;e.preventDefault();gesture={pointer:e.pointerId,token:state.turnToken,points:[point(e)]};pad.setPointerCapture(e.pointerId);pad.classList.add('active');drawGesture();});
pad.addEventListener('pointermove',e=>{if(gesture?.pointer!==e.pointerId)return;e.preventDefault();gesture.points.push(point(e));if(gesture.points.length>120)gesture.points.splice(1,1);drawGesture();});
pad.addEventListener('pointerup',e=>{if(gesture?.pointer!==e.pointerId)return;e.preventDefault();gesture.points.push(point(e));const shot=measure(gesture),token=gesture.token;cancelGesture();if(shot.valid){pendingTurn=token;net.send('throw',{...shot,turnToken:token});feedback(`${Math.round(shot.power*100)}% · БРОСОК`);}else feedback('Проведи вверх чуть дальше',false);});
pad.addEventListener('pointercancel',cancelGesture);pad.addEventListener('lostpointercapture',()=>{if(gesture)cancelGesture();});
const aimPad=$('ss-aim-pad');
aimPad.addEventListener('pointerdown',e=>{if(aimPointer)return;e.preventDefault();aimPointer={id:e.pointerId,x:e.clientX,y:e.clientY};aimPad.setPointerCapture(e.pointerId);});
aimPad.addEventListener('pointermove',e=>{if(aimPointer?.id!==e.pointerId)return;e.preventDefault();const r=aimPad.getBoundingClientRect();aim.x=clamp(aim.x+(e.clientX-aimPointer.x)/r.width*.95);aim.y=clamp(aim.y+(e.clientY-aimPointer.y)/r.height*.95);aimPointer.x=e.clientX;aimPointer.y=e.clientY;updateCrosshair();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])aimPad.addEventListener(event,e=>{if(aimPointer?.id===e.pointerId)aimPointer=null;});
function updateCrosshair(){$('ss-pad-crosshair').style.left=(10+aim.x*80)+'%';$('ss-pad-crosshair').style.top=(10+aim.y*80)+'%';}
function hold(button,kind){
  button.addEventListener('pointerdown',e=>{if(button.disabled)return;e.preventDefault();if(kind==='fire'){if(firePointer!==null)return;firePointer=e.pointerId;fire=true;}else{if(sweepPointer!==null)return;sweepPointer=e.pointerId;sweep=true;}button.setPointerCapture(e.pointerId);button.classList.add('pressed');sendInput();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{if(kind==='fire'&&firePointer===e.pointerId){firePointer=null;fire=false;}if(kind==='sweep'&&sweepPointer===e.pointerId){sweepPointer=null;sweep=false;}button.classList.remove('pressed');sendInput();});
}
hold($('ss-fire'),'fire');hold($('ss-sweep'),'sweep');$('ss-ability').onclick=()=>net.send('ability');
function sendInput(){if(state?.phase==='playing')net.send('input',{...aim,fire,sweep});}
function release(){fire=sweep=false;firePointer=sweepPointer=null;aimPointer=null;cancelGesture();$('ss-fire').classList.remove('pressed');$('ss-sweep').classList.remove('pressed');sendInput();}
for(const name of ['blur','pagehide','resize','orientationchange'])window.addEventListener(name,release);
document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
window.addEventListener('party-phase-change',e=>{if(e.detail?.phase==='paused')release();});
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!sports){e.preventDefault();fire=true;sendInput();}if(e.key.startsWith('Arrow')){e.preventDefault();aim.x=clamp(aim.x+(e.key==='ArrowRight'?.025:e.key==='ArrowLeft'?-.025:0));aim.y=clamp(aim.y+(e.key==='ArrowDown'?.025:e.key==='ArrowUp'?-.025:0));updateCrosshair();}});
window.addEventListener('keyup',e=>{if(e.code==='Space'){fire=false;sendInput();}});
setInterval(()=>{if(!document.hidden||bot)sendInput();},33);
let botTurn='',botAt=0;
if(bot)window.PARTY_BOT_ENGINE_TICK=()=>{
  if(window.PARTY_SESSION?.paused||window.parent.PARTY_SESSION?.paused){if(fire||sweep||gesture)release();return;}
  if(!state||!me||state.phase!=='playing'||!me.participant)return;
  if(sports){
    if(state.currentId===me.id&&state.stage==='aim'&&botTurn!==state.turnToken){botTurn=state.turnToken;botAt=state.t+1;}
    if(state.currentId===me.id&&state.stage==='aim'&&state.t>=botAt&&pendingTurn!==state.turnToken){pendingTurn=state.turnToken;net.send('throw',{turnToken:state.turnToken,power:mode==='curling'?.54+Math.random()*.05:.65,angle:(Math.random()-.5)*.025,spin:(Math.random()-.5)*.3,position:(Math.random()-.5)*.3});if(window.PARTY_BOT_DIAGNOSTICS)window.PARTY_BOT_DIAGNOSTICS.actions++;}
    sweep=mode==='curling'&&state.stage==='rolling'&&state.players.find(p=>p.id===state.currentId)?.team===me.team;
  }else if(mode==='swarm_gate'){
    const b=state.enemies?.filter(b=>b.hp>0).sort((a,b)=>b.z-a.z)[0];fire=!!b;if(b)aim={x:clamp(b.x/36+.5),y:clamp((b.z+27)/26)};
    if(b&&state.enemies.length>10&&state.t>=me.abilityAt)net.send('ability');
  }else{
    const t=state.targets?.find(t=>t.hp>0&&t.rise>.8&&t.kind!=='friendly');fire=!!t;if(t)aim={x:t.x,y:t.y};if(me.charge)net.send('ability');
  }
  if((fire||sweep)&&window.PARTY_BOT_DIAGNOSTICS)window.PARTY_BOT_DIAGNOSTICS.actions++;
  sendInput();
};
