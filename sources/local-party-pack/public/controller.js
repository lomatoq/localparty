const socket=createSocketBus();
const $=id=>document.getElementById(id);
const joinScreen=$('joinScreen'),controllerScreen=$('controllerScreen'),nameInput=$('nameInput'),joinBtn=$('joinBtn');
const leftHand=$('leftHand'),rightHand=$('rightHand'),pushControls=$('pushControls'),knifeControls=$('knifeControls'),waiting=$('waiting');
let handedness=localStorage.getItem('lpp_hand')||'right',joined=false,self=null,lastFeedbackAt=0;
function setHand(side,persist=true){handedness=side==='left'?'left':'right';leftHand.classList.toggle('selected',handedness==='left');rightHand.classList.toggle('selected',handedness==='right');controllerScreen.classList.toggle('left-handed',handedness==='left');controllerScreen.classList.toggle('right-handed',handedness==='right');if(persist)localStorage.setItem('lpp_hand',handedness);if(joined)socket.emit('setHandedness',handedness);}
setHand(handedness,false);leftHand.onclick=()=>setHand('left');rightHand.onclick=()=>setHand('right');
const savedName=localStorage.getItem('lpp_name');if(savedName)nameInput.value=savedName;
nameInput.addEventListener('input',()=>{if(/^(даша|dash|dasha)/i.test(nameInput.value.trim()))setHand('left',false);});
function join(){const name=nameInput.value.trim()||'PLAYER';localStorage.setItem('lpp_name',name);socket.emit('join',{name,handedness,token:localStorage.getItem('lpp_token')||undefined});}
joinBtn.onclick=join;nameInput.addEventListener('keydown',e=>{if(e.key==='Enter')join();});
socket.on('connect',()=>{if(joined||localStorage.getItem('lpp_token'))socket.emit('join',{name:localStorage.getItem('lpp_name')||'PLAYER',handedness:localStorage.getItem('lpp_hand')||handedness,token:localStorage.getItem('lpp_token')||undefined});});
socket.on('joined',d=>{joined=true;localStorage.setItem('lpp_token',d.token);self={...d};setHand(d.handedness||handedness,false);joinScreen.classList.add('hidden');controllerScreen.classList.remove('hidden');$('playerName').textContent=d.name;$('colorDot').style.background=d.color;$('colorDot').style.color=d.color;$('throwBtn').style.setProperty('--player',d.color);});

let joy={x:0,y:0},joyPointer=null;const zone=$('joystickZone'),base=$('joystickBase'),knob=$('joystickKnob');
function updateJoyFromPointer(e){const r=base.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.35,d=Math.hypot(dx,dy);if(d>max){dx=dx/d*max;dy=dy/d*max;}joy.x=dx/max;joy.y=dy/max;knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;socket.emit('joystick',joy);}
function resetJoy(){joy.x=joy.y=0;knob.style.transform='translate(-50%,-50%)';socket.emit('joystick',joy);}
zone.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;zone.setPointerCapture?.(e.pointerId);updateJoyFromPointer(e);});
zone.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)updateJoyFromPointer(e);});
for(const ev of ['pointerup','pointercancel'])zone.addEventListener(ev,e=>{if(e.pointerId===joyPointer){joyPointer=null;resetJoy();}});
window.addEventListener('blur',resetJoy);

$('throwBtn').addEventListener('pointerdown',e=>{e.preventDefault();socket.emit('throw');if(navigator.vibrate)navigator.vibrate(22);});
function modeName(mode){return mode==='push'?'PUSH PIT':mode==='knives'?'COLOR KNIVES':'LOBBY';}
function applySelf(s){self=s;$('modeLabel').textContent=modeName(s.mode);$('roundLabel').textContent=s.mode?`${s.round}/${s.maxRounds}`:'—';
  const activeGame=s.mode&&s.status!=='lobby'&&s.status!=='finished';waiting.classList.toggle('hidden',activeGame);
  pushControls.classList.toggle('hidden',!(activeGame&&s.mode==='push'));knifeControls.classList.toggle('hidden',!(activeGame&&s.mode==='knives'));
  if(s.mode==='push'){$('pushWins').textContent=s.roundWins;$('pushAlive').textContent=!s.active?'NEXT ROUND':s.status==='countdown'?String(Math.max(1,Math.ceil(s.countdown))):s.alive?'IN':'OUT';}
  if(s.mode==='knives'){$('knivesLeft').textContent=s.knivesRemaining;$('roundScore').textContent=s.roundScore;$('totalScore').textContent=s.totalScore;
    if(s.lastFeedbackAt&&s.lastFeedbackAt!==lastFeedbackAt){lastFeedbackAt=s.lastFeedbackAt;$('feedback').textContent=s.lastFeedback||'THROW';$('feedback').animate?.([{transform:'scale(1.25)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:180});}
  }
  if(s.status==='finished'){waiting.classList.remove('hidden');waiting.innerHTML=`<b>${s.winnerText||'МАТЧ ОКОНЧЕН'}</b><span>Следующий матч запускается с компьютера.</span>`;pushControls.classList.add('hidden');knifeControls.classList.add('hidden');}
  else if(!activeGame){waiting.innerHTML='<b>ЖДЁМ СТАРТ НА КОМПЬЮТЕРЕ</b><span>Ты уже подключён. На большом экране выберите игру.</span>';}
}
socket.on('selfState',applySelf);
