const joinScreen=document.getElementById('joinScreen');
const driveScreen=document.getElementById('driveScreen');
const nameInput=document.getElementById('nameInput');
const joinBtn=document.getElementById('joinBtn');
const joinError=document.getElementById('joinError');
const handBtns=[...document.querySelectorAll('.hand-btn')];
const controlsArea=document.getElementById('controlsArea');
const wheelPad=document.getElementById('wheelPad');

const gasBtn=document.getElementById('gasBtn');
const swapHandBtn=document.getElementById('swapHandBtn');
const steerValue=document.getElementById('steerValue');
const driverName=document.getElementById('driverName');
const colorDot=document.getElementById('colorDot');
const posText=document.getElementById('posText');
const lapText=document.getElementById('lapText');
const timeText=document.getElementById('timeText');
const bestText=document.getElementById('bestText');
const speedText=document.getElementById('speedText');
const statusStrip=document.getElementById('statusStrip');

let ws=null, playerId=null, gameState=null;
let steer=0, throttle=0;
let selectedHand=window.PARTY_PROFILE?.hand||localStorage.getItem('kart_hand')||'right';
let wheelPointer=null, gasPointer=null;
let lastCountdown=null, wasFinished=false;

function applyHand(hand){
  selectedHand=hand==='left'?'left':'right';
  localStorage.setItem('kart_hand',selectedHand);
  handBtns.forEach(b=>b.classList.toggle('active',b.dataset.hand===selectedHand));
  controlsArea.classList.toggle('left-handed',selectedHand==='left');
  controlsArea.classList.toggle('right-handed',selectedHand==='right');
  if(playerId) send({type:'set_hand',player_id:playerId,handedness:selectedHand});
}
handBtns.forEach(b=>b.onclick=()=>applyHand(b.dataset.hand));
applyHand(selectedHand);

function connect(){
  const proto=location.protocol==='https:'?'wss':'ws';
  ws=new WebSocket(`${proto}://${location.host}/ws`);
  ws.onopen=()=>{
    joinError.textContent='';
    const stored=localStorage.getItem('kart_player_id');
    if(stored){ send({type:'resume',player_id:stored}); }
    else if(window.PARTY_PROFILE?.name){ send({type:'join',name:window.PARTY_PROFILE.name,handedness:selectedHand}); }
  };
  ws.onmessage=e=>{
    const msg=JSON.parse(e.data);
    if(msg.type==='joined'){
      playerId=msg.player_id;localStorage.setItem('kart_token',msg.token);localStorage.setItem('kart_player_id',playerId);
      driverName.textContent=msg.name;colorDot.style.background=msg.color;
      joinScreen.classList.add('hidden');driveScreen.classList.remove('hidden');
      applyHand(selectedHand);
      try{navigator.vibrate?.(35)}catch(e){}
    }else if(msg.type==='resume_error'){
      localStorage.removeItem('kart_player_id');
      if(window.PARTY_PROFILE?.name)send({type:'join',name:window.PARTY_PROFILE.name,handedness:selectedHand});
      else {joinScreen.classList.remove('hidden');driveScreen.classList.add('hidden');}
    }else if(msg.type==='state'){
      gameState=msg;updateStats();
    }
  };
  ws.onclose=e=>{releaseGas();releaseWheel();if(e.code===4001){statusStrip.textContent='Игрок подключён в другой вкладке';return;}
    statusStrip.textContent='RECONNECTING…';
    setTimeout(connect,800);
  };
}
connect();
function send(o){if(o.type==='join'||o.type==='resume')Object.assign(o,{partyId:window.PARTY_PROFILE?.id,partyToken:window.PARTY_PROFILE?.token,token:localStorage.getItem('kart_token')});if(ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(o));}

joinBtn.onclick=()=>{
  if(!ws||ws.readyState!==WebSocket.OPEN){joinError.textContent='Server is reconnecting…';return;}
  localStorage.removeItem('kart_player_id');
  send({type:'join',name:nameInput.value.trim()||'Driver',handedness:selectedHand});
};
nameInput.addEventListener('keydown',e=>{if(e.key==='Enter')joinBtn.click()});
swapHandBtn.onclick=()=>applyHand(selectedHand==='right'?'left':'right');

function transmitInput(){if(playerId)send({type:'input',player_id:playerId,steer,throttle});}
const steeringHolds=new Map();
function showSteer(){steerValue.textContent=steer===0?'STRAIGHT':steer<0?'← LEFT':'RIGHT →';for(const [id,direction] of [['steerLeft',-1],['steerRight',1]]){const b=document.getElementById(id);b.classList.toggle('held',steer===direction);b.setAttribute('aria-pressed',String(steer===direction));}}
function syncSteering(){steer=Math.max(-1,Math.min(1,[...steeringHolds.values()].reduce((a,b)=>a+b,0)));showSteer();transmitInput();}
function releaseWheel(){steeringHolds.clear();wheelPointer=null;syncSteering();}
for(const [id,direction] of [['steerLeft',-1],['steerRight',1]]){
 const b=document.getElementById(id);
 b.addEventListener('pointerdown',e=>{if(b.disabled||wheelPad.disabled)return;e.preventDefault();b.setPointerCapture(e.pointerId);steeringHolds.set(e.pointerId,direction);syncSteering();navigator.vibrate?.(7);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{if(steeringHolds.delete(e.pointerId))syncSteering();});
 b.addEventListener('keydown',e=>{if(![' ','Enter','ArrowLeft','ArrowRight'].includes(e.key)||e.repeat||b.disabled)return;e.preventDefault();steeringHolds.set('key:'+e.key,e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:direction);syncSteering();});
 b.addEventListener('keyup',e=>{if(steeringHolds.delete('key:'+e.key)){e.preventDefault();syncSteering();}});
 b.addEventListener('blur',releaseWheel);
}

gasBtn.addEventListener('pointerdown',e=>{e.preventDefault();if(gasPointer!==null||gasBtn.disabled)return;gasPointer=e.pointerId;gasBtn.setPointerCapture(e.pointerId);throttle=1;gasBtn.classList.add('active');transmitInput();try{navigator.vibrate?.(12)}catch(_){} });
function releaseGas(e){if(gasPointer===null||!e||e.pointerId===gasPointer){gasPointer=null;throttle=0;gasBtn.classList.remove('active');transmitInput();}}
gasBtn.addEventListener('pointerup',releaseGas);gasBtn.addEventListener('pointercancel',releaseGas);gasBtn.addEventListener('lostpointercapture',releaseGas);window.addEventListener('blur',()=>{releaseGas();releaseWheel()});

document.addEventListener('visibilitychange',()=>{if(document.hidden){throttle=0;steer=0;releaseGas();releaseWheel();}});
setInterval(transmitInput,1000/30);

function fmt(sec){if(sec==null)return'—';const m=Math.floor(sec/60),s=sec%60;return `${String(m).padStart(2,'0')}:${s.toFixed(2).padStart(5,'0')}`;}
function updateStats(){
  if(!gameState)return;
  const me=gameState.players.find(p=>p.id===playerId);
  if(!me)return;
  const ended=gameState.status==='results'||!!me.finish_order;
  gasBtn.disabled=ended;wheelPad.disabled=ended;for(const id of ['steerLeft','steerRight'])document.getElementById(id).disabled=ended;
  wheelPad.setAttribute('aria-disabled',String(ended));
  controlsArea.classList.toggle('race-ended',ended);
  if(ended){releaseGas();releaseWheel();}
  posText.textContent=me.finish_order?`#${me.finish_order}`:`${me.position||'—'}/${gameState.players.length}`;
  lapText.textContent=`${Math.min(me.lap+1,gameState.laps)}/${gameState.laps}`;
  timeText.textContent=fmt(gameState.race_time).split('.')[0];
  bestText.textContent=me.best_lap==null?'—':fmt(me.best_lap);
  speedText.textContent=`${Math.round(me.speed*.55)} km/h`;
  if(gameState.status==='lobby')statusStrip.textContent='ЖДЁМ СТАРТА';
  else if(!me.in_race && (gameState.status==='countdown'||gameState.status==='racing')) statusStrip.textContent='WAITING FOR NEXT RACE';
  else if(gameState.status==='countdown')statusStrip.textContent=`GET READY · ${Math.max(1,Math.ceil(gameState.countdown))}`;
  else if(gameState.status==='racing')statusStrip.textContent=me.offroad?'OFF‑ROAD · SLOWDOWN':'RACE!';
  else if(gameState.status==='results')statusStrip.textContent=me.finish_order?`FINISHED #${me.finish_order}`:'RACE OVER';

  if(gameState.status==='countdown'){
    const c=Math.max(1,Math.ceil(gameState.countdown));
    if(c!==lastCountdown){lastCountdown=c;try{navigator.vibrate?.(28)}catch(_){}}
  }else lastCountdown=null;
  if(me.finish_order&&!wasFinished){wasFinished=true;try{navigator.vibrate?.([70,60,70,60,160])}catch(_){}}
  if(!me.finish_order)wasFinished=false;
}
