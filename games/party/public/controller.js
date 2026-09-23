const socket=createSocketBus();
const $=id=>document.getElementById(id);
const joinScreen=$('joinScreen'),controllerScreen=$('controllerScreen'),nameInput=$('nameInput'),joinBtn=$('joinBtn');
const leftHand=$('leftHand'),rightHand=$('rightHand'),moveControls=$('moveControls'),knifeControls=$('knifeControls'),westernControls=$('westernControls'),waiting=$('waiting');
let handedness=localStorage.getItem('lpp_hand')||'right',joined=false,self=null,lastFeedbackAt=0;

function setHand(side,persist=true){
  handedness=side==='left'?'left':'right';leftHand.classList.toggle('selected',handedness==='left');rightHand.classList.toggle('selected',handedness==='right');
  controllerScreen.classList.toggle('left-handed',handedness==='left');controllerScreen.classList.toggle('right-handed',handedness==='right');
  if(persist)localStorage.setItem('lpp_hand',handedness);if(joined)socket.emit('setHandedness',handedness);
}
setHand(handedness,false);leftHand.onclick=()=>setHand('left');rightHand.onclick=()=>setHand('right');
const savedName=localStorage.getItem('lpp_name');if(savedName)nameInput.value=savedName;
nameInput.addEventListener('input',()=>{if(/^(даша|dash|dasha)/i.test(nameInput.value.trim()))setHand('left',false);});
function join(){const name=nameInput.value.trim()||'PLAYER';localStorage.setItem('lpp_name',name);socket.emit('join',{name,handedness,token:localStorage.getItem('lpp_token')||undefined});}
joinBtn.onclick=join;nameInput.addEventListener('keydown',e=>{if(e.key==='Enter')join();});
socket.on('connect',()=>{if(window.PARTY_PROFILE?.name){nameInput.value=window.PARTY_PROFILE.name;join();}else if(joined||localStorage.getItem('lpp_token'))socket.emit('join',{name:localStorage.getItem('lpp_name')||'PLAYER',handedness:localStorage.getItem('lpp_hand')||handedness,token:localStorage.getItem('lpp_token')||undefined});});
socket.on('joined',d=>{
  joined=true;localStorage.setItem('lpp_token',d.token);self={...d};setHand(d.handedness||handedness,false);joinScreen.classList.add('hidden');controllerScreen.classList.remove('hidden');
  $('playerName').textContent=d.name;$('colorDot').style.background=d.color;$('colorDot').style.color=d.color;$('throwBtn').style.setProperty('--player',d.color);
});

let joy={x:0,y:0},joyPointer=null;const zone=$('joystickZone'),base=$('joystickBase'),knob=$('joystickKnob');
function updateJoyFromPointer(e){
  const r=base.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.35,d=Math.hypot(dx,dy);if(d>max){dx=dx/d*max;dy=dy/d*max;}
  joy.x=dx/max;joy.y=dy/max;knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;socket.emit('joystick',joy);
}
function resetJoy(){joyPointer=null;joy.x=joy.y=0;knob.style.transform='translate(-50%,-50%)';socket.emit('joystick',joy);}
zone.addEventListener('pointerdown',e=>{if(joyPointer!==null)return;e.preventDefault();joyPointer=e.pointerId;zone.setPointerCapture?.(e.pointerId);updateJoyFromPointer(e);});
zone.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)updateJoyFromPointer(e);});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(ev,e=>{if(e.pointerId===joyPointer)resetJoy();});
window.addEventListener('blur',resetJoy);window.addEventListener('pagehide',resetJoy);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetJoy();});
setInterval(()=>{if(joyPointer!==null)socket.emit('joystick',joy);},120);

$('throwBtn').addEventListener('pointerdown',e=>{e.preventDefault();socket.emit('throw');if(navigator.vibrate)navigator.vibrate(22);});
$('fireBtn').addEventListener('pointerdown',e=>{e.preventDefault();if(!self||self.status!=='playing'||self.shotThisRound||self.falseStart||e.isPrimary===false)return;socket.emit('westernShoot',{round:self.round});if(navigator.vibrate)navigator.vibrate(18);});
function modeName(mode){return mode==='shrink'?'СЖИМАЮЩАЯСЯ АРЕНА':mode==='push'?'PUSH PIT':mode==='knives'?'COLOR KNIVES':mode==='bomb'?'BOMB TAG':mode==='western'?'ONE SHOT WESTERN':'LOBBY';}
function hideControls(){moveControls.classList.add('hidden');knifeControls.classList.add('hidden');westernControls.classList.add('hidden');}
function flashFeedback(s){
  if(!s.lastFeedbackAt||s.lastFeedbackAt===lastFeedbackAt)return;lastFeedbackAt=s.lastFeedbackAt;
  if(s.mode==='knives'){$('feedback').textContent=s.lastFeedback||'THROW';$('feedback').animate?.([{transform:'scale(1.22)'},{transform:'scale(1)'}],{duration:180});}
  if(s.mode==='western'){$('westernFeedback').textContent=s.lastFeedback||'СМОТРИ НА ЭКРАН';}
  if(s.mode==='bomb'&&navigator.vibrate){if((s.lastFeedback||'').includes('BOOM'))navigator.vibrate([120,60,180]);else if(s.hasBomb)navigator.vibrate([45,30,45]);}
}
function applySelf(s){
  self=s;$('modeLabel').textContent=modeName(s.mode);$('roundLabel').textContent=s.mode?(s.status==='playing'&&s.mode!=='western'?Math.ceil(s.timer)+'с':`${s.round}/${s.maxRounds}`):'—';flashFeedback(s);
  const inRound=s.mode&&(s.status==='countdown'||s.status==='playing');hideControls();waiting.classList.toggle('hidden',!!inRound);

  if(inRound&&((s.mode==='push'||s.mode==='shrink')||s.mode==='bomb')){
    moveControls.classList.remove('hidden');moveControls.classList.toggle('has-bomb',s.mode==='bomb'&&s.hasBomb);
    $('moveLabelA').textContent='ПОБЕДЫ';$('moveStatA').textContent=s.roundWins;
    if((s.mode==='push'||s.mode==='shrink')){
      $('joyTip').textContent='ВЕДИ ПАЛЬЦЕМ · ТОЛКАЙ ИХ ЗА КРАЙ';$('moveLabelB').textContent='СТАТУС';
      $('moveStatB').textContent=!s.active?'NEXT':s.status==='countdown'?String(Math.max(1,Math.ceil(s.countdown))):s.alive?'IN':'OUT';
    }else{
      $('joyTip').textContent=s.hasBomb?'💣 ДОГОНИ КОГО-НИБУДЬ И КОСНИСЬ':'УБЕГАЙ ОТ БОМБЫ · НЕ ДАЙ СЕБЯ КОСНУТЬ';$('moveLabelB').textContent='БОМБА';
      $('moveStatB').textContent=!s.active?'NEXT':s.status==='countdown'?String(Math.max(1,Math.ceil(s.countdown))):!s.alive?'OUT':s.hasBomb?'У ТЕБЯ!':'SAFE';
    }
  }
  if(inRound&&s.mode==='knives'){
    knifeControls.classList.remove('hidden');$('knivesLeft').textContent=s.knivesRemaining;$('roundScore').textContent=s.roundScore;$('totalScore').textContent=s.totalScore;
  }
  if(inRound&&s.mode==='western'){
    westernControls.classList.remove('hidden');$('westernWins').textContent=s.roundWins;$('westernBest').textContent=s.bestReactionMs==null?'—':`${s.bestReactionMs}ms`;$('westernFalse').textContent=s.falseStarts;
    const locked=s.status!=='playing'||s.falseStart||s.shotThisRound;$('fireBtn').classList.toggle('locked',locked);$('fireBtn').disabled=locked;
    if(s.status==='countdown')$('westernFeedback').textContent='ПРИГОТОВЬСЯ · СМОТРИ НА БОЛЬШОЙ ЭКРАН';
    else if(s.falseStart)$('westernFeedback').textContent='TOO EARLY — ЖДИ СЛЕДУЮЩИЙ РАУНД';
    else if(s.shotThisRound&&s.reactionMs!=null)$('westernFeedback').textContent=`${s.reactionMs} ms`;
    else $('westernFeedback').textContent='СМОТРИ НА БОЛЬШОЙ ЭКРАН · НЕ ВЕДИСЬ НА ФЕЙКИ';
  }

  if(s.status==='finished'){
    hideControls();waiting.classList.remove('hidden');waiting.innerHTML=`<b>${s.winnerText||'МАТЧ ОКОНЧЕН'}</b><span>Следующий матч запускается с компьютера.</span>`;
  }else if(s.status==='between'){
    hideControls();waiting.classList.remove('hidden');waiting.innerHTML=`<b>${s.winnerText||'РАУНД ОКОНЧЕН'}</b><span>Следующий раунд сейчас начнётся.</span>`;
  }else if(!inRound){
    waiting.innerHTML='<b>ЖДЁМ СТАРТ НА КОМПЬЮТЕРЕ</b><span>Ты уже подключён. На большом экране выберите игру.</span>';
  }
}
socket.on('selfState',applySelf);

// Managed lobby identity, also on the first connection.
