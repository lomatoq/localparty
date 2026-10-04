const socket = createSocketBus();
const joinScreen=document.getElementById('joinScreen');
const controllerScreen=document.getElementById('controllerScreen');
const nameInput=document.getElementById('nameInput');
const joinBtn=document.getElementById('joinBtn');
const rightHand=document.getElementById('rightHand');
const leftHand=document.getElementById('leftHand');
const controls=document.getElementById('controls');
const forwardBtn=document.getElementById('forwardBtn');
const fireBtn=document.getElementById('fireBtn');
let handedness='right';
let handTouched=false;
let joined=false;
let currentTeam='red';
const input={forward:false,fire:false};
// The existing HP bar gains a truthful caption; it remains state-derived.
const healthReadout=document.createElement('div');healthReadout.className='tank-health-readout';
const healthLabel=document.createElement('small'),healthValue=document.createElement('b');healthReadout.append(healthLabel,healthValue);
controllerScreen.querySelector('.hp').before(healthReadout);
function sharedTeamMetric(s){
 if(window.parent===window||s.mode!=='ctf')return false;
 try{const e=window.parent.document.getElementById('hudProgress');return !!e&&!e.hidden&&e.getClientRects().length>0&&new RegExp('(?:^|[^0-9])'+s.redScore+'\\s*:\\s*'+s.blueScore+'(?:$|[^0-9])').test(e.textContent);}catch{return false;}
}


const savedName=localStorage.getItem('lt_name');if(savedName)nameInput.value=savedName;
const savedHand=localStorage.getItem('lt_hand');if(savedHand)setHand(savedHand);
nameInput.addEventListener('input',()=>{
  if(!handTouched && /^даш/i.test(nameInput.value.trim())) setHand('left',false);
});
rightHand.onclick=()=>{handTouched=true;setHand('right')};
leftHand.onclick=()=>{handTouched=true;setHand('left')};
function setHand(side,persist=true){
  handedness=side==='left'?'left':'right';
  rightHand.classList.toggle('selected',handedness==='right');
  leftHand.classList.toggle('selected',handedness==='left');
  controls.classList.toggle('left-handed',handedness==='left');
  controls.classList.toggle('right-handed',handedness==='right');
  if(persist)localStorage.setItem('lt_hand',handedness);
  if(joined)socket.emit('setHandedness',handedness);
}

joinBtn.onclick=join;
nameInput.addEventListener('keydown',e=>{if(e.key==='Enter')join()});
function join(){
  const name=nameInput.value.trim()||'PLAYER';
  localStorage.setItem('lt_name',name);localStorage.setItem('lt_hand',handedness);
  socket.emit('join',{name,handedness,token:localStorage.getItem('lt_token')||undefined});
}

socket.on('joined',data=>{
  joined=true;localStorage.setItem('lt_token',data.token);currentTeam=data.team;setHand(data.handedness||handedness);
  joinScreen.classList.add('hidden');controllerScreen.classList.remove('hidden');
  document.getElementById('playerName').textContent=data.name;
  document.getElementById('colorDot').style.background=data.color;
  document.getElementById('colorDot').style.color=data.color;
  updateTeamButtons();
});

socket.on('connect',()=>{
  if(window.PARTY_PROFILE?.name){nameInput.value=window.PARTY_PROFILE.name;join();}
  else if(joined || localStorage.getItem('lt_token')){
    const name=localStorage.getItem('lt_name')||nameInput.value||'PLAYER';
    socket.emit('join',{name,handedness:localStorage.getItem('lt_hand')||handedness,token:localStorage.getItem('lt_token')||undefined});
  }
});

function bindHold(el,key){
  const down=e=>{e.preventDefault();if(el.disabled)return;input[key]=true;pressPoint(el,e);el.classList.add('pressed');socket.emit('input',input);if(key==='fire')pressHaptic();try{el.setPointerCapture(e.pointerId)}catch{}};
  const up=e=>{e.preventDefault();input[key]=false;el.classList.remove('pressed');socket.emit('input',input);};
  el.addEventListener('pointerdown',down);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
}
// Press feedback starts at the finger; haptics go through the shared feel
// layer so the native iOS shell gets them too (navigator.vibrate is Android-only).
function pressPoint(el,e){const r=el.getBoundingClientRect();if(!r.width)return;el.style.setProperty('--press-x',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');el.style.setProperty('--press-y',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');}
function pressHaptic(){if(window.LocalPartyFeel)window.LocalPartyFeel.emit('shot',{intensity:.22,visual:false});else navigator.vibrate?.(12);}
let feelPrevious=null;
function selfFeel(s){const p=feelPrevious,ctl=document.getElementById('controls');feelPrevious={alive:s.alive,kills:s.kills,status:s.status,round:s.round,mode:s.mode};
  // Destroyed: controls dim and sink; back in play: one spring. State-derived, so reconnects are correct.
  const down=!s.alive&&!!s.mode&&s.status!=='lobby';ctl.classList.toggle('tank-destroyed',down);
  if(p&&!p.alive&&s.alive&&s.status==='playing'){ctl.classList.remove('tank-respawned');void ctl.offsetWidth;ctl.classList.add('tank-respawned');clearTimeout(selfFeel.timer);selfFeel.timer=setTimeout(()=>ctl.classList.remove('tank-respawned'),460);}
  const feel=window.LocalPartyFeel;if(!p||!feel||p.round!==s.round||p.mode!==s.mode||s.status==='lobby')return;
  if(p.alive&&!s.alive)feel.emit('elimination',{intensity:.9,visual:false,color:'#ff667c'});
  else if(s.kills>p.kills)feel.emit('score',{intensity:.7,visual:false});}
bindHold(forwardBtn,'forward');bindHold(fireBtn,'fire');
function releaseInputs(){input.forward=input.fire=false;forwardBtn.classList.remove('pressed');fireBtn.classList.remove('pressed');socket.emit('input',input);}
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseInputs();});window.addEventListener('blur',releaseInputs);window.addEventListener('pagehide',releaseInputs);window.addEventListener('offline',releaseInputs);setInterval(()=>{if(input.forward||input.fire)socket.emit('input',input);},120);

document.getElementById('teamRed').onclick=()=>socket.emit('setTeam','red');
document.getElementById('teamBlue').onclick=()=>socket.emit('setTeam','blue');
document.getElementById('swapHand').onclick=()=>setHand(handedness==='left'?'right':'left');

socket.on('lobby',list=>{
  const me=list.find(p=>p.id && p.name===document.getElementById('playerName').textContent && p.handedness===handedness) || null;
  if(me){currentTeam=me.team;updateTeamButtons();}
});

function updateTeamButtons(){
  document.getElementById('teamRed').classList.toggle('active',currentTeam==='red');
  document.getElementById('teamBlue').classList.toggle('active',currentTeam==='blue');
  document.getElementById('teamText').textContent=currentTeam==='red'?'RED TEAM':currentTeam==='blue'?'BLUE TEAM':'CO-OP';
}

socket.on('selfState',s=>{
  selfFeel(s);
  const inactive=s.status==='finished'||s.status==='between'||s.status==='lobby'||!s.alive;for(const button of [forwardBtn,fireBtn]){button.disabled=inactive;button.setAttribute('aria-disabled',String(inactive));if(inactive)button.classList.remove('pressed');}if(inactive&&(input.forward||input.fire)){input.forward=input.fire=false;socket.emit('input',input);}
  currentTeam=s.team;updateTeamButtons();
  document.documentElement.dataset.tankMode=s.mode||'';
  const english=window.PartyI18n?.language==='en'||localStorage.getItem('local-party-language')==='en';
  healthLabel.textContent=english?'Health':'Здоровье';healthValue.textContent=`${Math.max(0,Math.ceil(s.hp))} / ${s.maxHp}`;
  document.getElementById('hpFill').style.width=`${Math.max(0,100*s.hp/s.maxHp)}%`;
  document.getElementById('scoreMain').textContent=s.mode==='survival'?s.roundWins:s.mode==='ctf'?s.captures:s.score;
  document.getElementById('scoreLabel').textContent=s.mode==='survival'?'WINS':s.mode==='ctf'?(english?'Captured':'Захвачено'):'SCORE';
  document.getElementById('killsValue').textContent=s.kills;
  document.getElementById('deathsValue').textContent=s.deaths;
  const lobbyTools=document.getElementById('lobbyTools');
  lobbyTools.classList.toggle('hidden',s.status!=='lobby' && s.mode!==null);
  let mode='Ждём старта';
  if(s.mode==='survival') mode=`10 РАУНДОВ · ${s.round}/${s.maxRounds}`;
  if(s.mode==='ctf') mode=`ФЛАГ · ${s.redScore}:${s.blueScore}`;
  if(s.mode==='coop') mode='ОГРАБЬ БОССА';
  document.getElementById('modeText').textContent=mode;
  document.getElementById('modeText').hidden=sharedTeamMetric(s);
  let status='Смотри на большой экран 👀';
  if(!s.alive && s.respawnTimer>0) status=`Ты уничтожен · респавн ${Math.max(0,s.respawnTimer).toFixed(1)}с`;
  else if(s.hasFlag) status='У ТЕБЯ ФЛАГ — ТАЩИ НА СВОЮ БАЗУ! ⚑';
  else if(s.hasCore) status='У ТЕБЯ ЯДРО — ВАЛИ В ЗЕЛЁНУЮ БАЗУ! ◆';
  else if(s.status==='finished') status=s.winnerText||'Матч окончен';
  else if(s.mode==='ctf'&&s.status==='playing') status=english?'Bring the enemy flag to your base':'Принеси чужой флаг на свою базу';
  else if(s.mode==='coop') status=`${Math.max(0,Math.ceil(s.timer))}с · убей босса и укради ядро`;
  document.getElementById('statusText').textContent=status;
});

// Managed lobby identity, also on the first connection.
