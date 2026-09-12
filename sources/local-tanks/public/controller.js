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
  if(joined || localStorage.getItem('lt_token')){
    const name=localStorage.getItem('lt_name')||nameInput.value||'PLAYER';
    socket.emit('join',{name,handedness:localStorage.getItem('lt_hand')||handedness,token:localStorage.getItem('lt_token')||undefined});
  }
});

function bindHold(el,key){
  const down=e=>{e.preventDefault();input[key]=true;el.classList.add('pressed');socket.emit('input',input);if(key==='fire'&&navigator.vibrate)navigator.vibrate(12);try{el.setPointerCapture(e.pointerId)}catch{}};
  const up=e=>{e.preventDefault();input[key]=false;el.classList.remove('pressed');socket.emit('input',input);};
  el.addEventListener('pointerdown',down);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
}
bindHold(forwardBtn,'forward');bindHold(fireBtn,'fire');
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{if(document.hidden){input.forward=input.fire=false;socket.emit('input',input);}});

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
  currentTeam=s.team;updateTeamButtons();
  document.getElementById('hpFill').style.width=`${Math.max(0,100*s.hp/s.maxHp)}%`;
  document.getElementById('scoreMain').textContent=s.mode==='survival'?s.roundWins:s.mode==='ctf'?s.captures:s.score;
  document.getElementById('scoreLabel').textContent=s.mode==='survival'?'WINS':s.mode==='ctf'?'FLAGS':'SCORE';
  document.getElementById('kills').textContent=`${s.kills} kills`;
  document.getElementById('extraStat').textContent=`${s.deaths} deaths`;
  const lobbyTools=document.getElementById('lobbyTools');
  lobbyTools.classList.toggle('hidden',s.status!=='lobby' && s.mode!==null);
  let mode='Ждём старта';
  if(s.mode==='survival') mode=`10 РАУНДОВ · ${s.round}/${s.maxRounds}`;
  if(s.mode==='ctf') mode=`ФЛАГ · ${s.redScore}:${s.blueScore}`;
  if(s.mode==='coop') mode='ОГРАБЬ БОССА';
  document.getElementById('modeText').textContent=mode;
  let status='Смотри на большой экран 👀';
  if(!s.alive && s.respawnTimer>0) status=`Ты уничтожен · респавн ${Math.max(0,s.respawnTimer).toFixed(1)}с`;
  else if(s.hasFlag) status='У ТЕБЯ ФЛАГ — ТАЩИ НА СВОЮ БАЗУ! ⚑';
  else if(s.hasCore) status='У ТЕБЯ ЯДРО — ВАЛИ В ЗЕЛЁНУЮ БАЗУ! ◆';
  else if(s.status==='finished') status=s.winnerText||'Матч окончен';
  else if(s.mode==='coop') status=`${Math.max(0,Math.ceil(s.timer))}с · убей босса и укради ядро`;
  document.getElementById('statusText').textContent=status;
});
