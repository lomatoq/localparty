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
function resetJoy(){joyPointer=null;zone.dataset.held='false';joy.x=joy.y=0;knob.style.transform='translate(-50%,-50%)';socket.emit('joystick',joy);}
zone.addEventListener('pointerdown',e=>{if(joyPointer!==null||zone.getAttribute('aria-disabled')==='true')return;e.preventDefault();joyPointer=e.pointerId;zone.dataset.held='true';zone.setPointerCapture?.(e.pointerId);updateJoyFromPointer(e);});
zone.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)updateJoyFromPointer(e);});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(ev,e=>{if(e.pointerId===joyPointer)resetJoy();});
window.addEventListener('blur',resetJoy);window.addEventListener('pagehide',resetJoy);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetJoy();});
setInterval(()=>{if(joyPointer!==null)socket.emit('joystick',joy);},120);

// Haptic tiers go through LocalPartyFeel (native haptics in the app, vibrate on web).
function feel(type,options={}){try{return window.LocalPartyFeel?.emit(type,{visual:false,...options});}catch{return null;}}
function pressHaptic(ms){if(window.LocalPartyFeel)feel('shot',{intensity:.22});else if(navigator.vibrate)navigator.vibrate(ms);}
// One-shot WAAPI accent; transform/opacity only, skipped for reduced motion.
function accent(el,frames,duration){if(!el?.animate||matchMedia('(prefers-reduced-motion: reduce)').matches)return;el.animate(frames,{duration,easing:'cubic-bezier(.23,1,.32,1)'});}
function flashClass(el,name,ms){if(!el)return;el.classList.remove(name);void el.offsetWidth;el.classList.add(name);clearTimeout(el['_t'+name]);el['_t'+name]=setTimeout(()=>el.classList.remove(name),ms);}
$('throwBtn').addEventListener('pointerdown',e=>{e.preventDefault();if(!self||self.status!=='playing'||!self.active||self.knivesRemaining<=0)return;socket.emit('throw');pressHaptic(22);});
$('fireBtn').addEventListener('pointerdown',e=>{e.preventDefault();if(!self||self.status!=='playing'||self.shotThisRound||self.falseStart||e.isPrimary===false)return;socket.emit('westernShoot',{round:self.round});pressHaptic(18);});
function modeName(mode){return mode==='shrink'?'СЖИМАЮЩАЯСЯ АРЕНА':mode==='push'?'PUSH PIT':mode==='knives'?'COLOR KNIVES':mode==='bomb'?'BOMB TAG':mode==='western'?'ONE SHOT WESTERN':'LOBBY';}
function hideControls(){moveControls.classList.add('hidden');knifeControls.classList.add('hidden');westernControls.classList.add('hidden');}
function actionState(button,state,title,hint){
 const locale=window.PartyI18n?.language||'ru',key=[state,title,hint,locale].join('|');
 if(button.dataset.copyKey===key)return;button.dataset.copyKey=key;button.dataset.controlState=state;
 button.querySelector('span').textContent=window.PartyI18n?.t(title)||title;button.querySelector('small').textContent=window.PartyI18n?.t(hint)||hint;
}
function spectatorState(controls,visible,title){
 controls.dataset.spectator=String(visible);const scene=controls.querySelector('.action-spectator');scene.hidden=!visible;if(!visible)return;
 const src=window.PartyArt?.mascotSource({seed:window.PARTY_PROFILE?.id||self?.name,avatar:window.PARTY_PROFILE?.avatar})||'/assets/avatars/atlas-mascots/mascot-01.webp';
 const key=[title,src,window.PartyI18n?.language||'ru'].join('|');if(scene.dataset.copyKey===key)return;scene.dataset.copyKey=key;
 scene.querySelector('img').dataset.photo=String(!!window.PARTY_PROFILE?.avatar);if(scene.querySelector('img').getAttribute('src')!==src)scene.querySelector('img').src=src;
 scene.querySelector('strong').textContent=window.PartyI18n?.t(title)||title;
 scene.querySelector('p').textContent=window.PartyI18n?.t('ЖДИ СЛЕДУЮЩИЙ РАУНД')||'ЖДИ СЛЕДУЮЩИЙ РАУНД';
}
function flashFeedback(s){
  if(!s.lastFeedbackAt||s.lastFeedbackAt===lastFeedbackAt)return;lastFeedbackAt=s.lastFeedbackAt;
  const text=s.lastFeedback||'',key=`party:${s.mode}:${s.round}:${s.lastFeedbackAt}`;
  if(s.mode==='knives'){
    // Tiered outcome: own colour pops lime (score haptic comes from the shared tracker), misses and clangs warn.
    const outcome=/YOUR COLOR/.test(text)?'good':/DANGER/.test(text)?'danger':/CLANG/.test(text)?'clang':/WRONG|MISS/.test(text)?'bad':'neutral',fb=$('feedback');
    fb.dataset.feedbackRole='state';fb.dataset.outcome=outcome;fb.textContent=text||'THROW';
    accent(fb,[{transform:`scale(${outcome==='good'?1.3:outcome==='neutral'?1.08:1.18})`},{transform:'scale(1)'}],outcome==='neutral'?140:260);
    if(outcome==='danger')feel('hit',{id:key,intensity:.75,color:'#ff667c'});else if(outcome==='clang')feel('collision',{id:key,intensity:.55});else if(outcome==='bad')feel('hit',{id:key,intensity:.4,color:'#ff9f6b'});
  }
  if(s.mode==='western'){$('westernFeedback').textContent=text||'Смотри на экран';if(s.falseStart)feel('elimination',{id:key,intensity:.8,color:'#ff667c'});}
  if(s.mode==='bomb'){
    const boom=text.includes('BOOM'),passed=/Передал|→/.test(text)&&!s.hasBomb;
    if(window.LocalPartyFeel){if(boom)feel('elimination',{id:key,intensity:.95,color:'#ffad54'});else if(s.hasBomb)feel('danger',{id:key,intensity:.85,color:'#ff667c'});else if(passed)feel('hit',{id:key,intensity:.35,color:'#c8ff73'});}
    else if(navigator.vibrate){if(boom)navigator.vibrate([120,60,180]);else if(s.hasBomb)navigator.vibrate([45,30,45]);}
    if(s.hasBomb)flashClass(moveControls,'bomb-caught',420);else if(passed)flashClass(moveControls,'bomb-passed',420);
  }
}
function applySelf(s){
  self=s;$('modeLabel').textContent=modeName(s.mode);$('roundLabel').textContent=s.mode?(s.status==='playing'&&s.mode!=='western'?Math.ceil(s.timer)+'с':`${s.round}/${s.maxRounds}`):'—';flashFeedback(s);
  const inRound=s.mode&&(s.status==='countdown'||s.status==='playing');hideControls();waiting.classList.toggle('hidden',!!inRound);

  if(inRound&&((s.mode==='push'||s.mode==='shrink')||s.mode==='bomb')){
    moveControls.classList.remove('hidden');moveControls.classList.toggle('has-bomb',s.mode==='bomb'&&s.hasBomb);
    $('moveLabelA').textContent='ПОБЕДЫ';$('moveStatA').textContent=s.roundWins;
    if((s.mode==='push'||s.mode==='shrink')){
      $('joyTip').textContent=s.mode==='shrink'?'Держись ближе к центру · арена сжимается':'Веди пальцем · толкай их за край';$('moveLabelB').textContent='СТАТУС';
      $('moveStatB').textContent=!s.active?'NEXT':s.status==='countdown'?String(Math.max(1,Math.ceil(s.countdown))):s.alive?'IN':'OUT';$('moveStatB').dataset.tone=!s.active||s.status==='countdown'?'':s.alive?'safe':'out';
    }else{
      $('joyTip').textContent=s.hasBomb?'💣 Догони кого-нибудь и коснись':'Убегай от бомбы · не дай себя коснуться';$('moveLabelB').textContent='БОМБА';
      $('moveStatB').textContent=!s.active?'NEXT':s.status==='countdown'?String(Math.max(1,Math.ceil(s.countdown))):!s.alive?'OUT':s.hasBomb?'У ТЕБЯ!':'SAFE';$('moveStatB').dataset.tone=!s.active||s.status==='countdown'?'':!s.alive?'out':s.hasBomb?'hot':'safe';
    }
  }
  const cannotMove=!inRound||!s.active||!s.alive||s.status!=='playing';
  zone.setAttribute('aria-disabled',String(cannotMove));
  const out=inRound&&(!s.active||!s.alive);zone.dataset.out=String(out);
  if(out){const src=window.PartyArt?.mascotSource({seed:window.PARTY_PROFILE?.id||s.name,avatar:window.PARTY_PROFILE?.avatar})||'/assets/avatars/atlas-mascots/mascot-01.webp';$('outMascot').dataset.photo=String(!!window.PARTY_PROFILE?.avatar);if($('outMascot').getAttribute('src')!==src)$('outMascot').src=src;}

  if(cannotMove&&joyPointer!==null)resetJoy();
  if(inRound&&!moveControls.classList.contains('hidden')){
    if(!s.active)$('joyTip').textContent='ЖДИ СЛЕДУЮЩИЙ РАУНД';
    else if(!s.alive)$('joyTip').textContent='Ты выбыл · следи за экраном. Скоро следующий раунд.';
    else if(s.status==='countdown')$('joyTip').textContent='Смотри на экран';
  }
  if(inRound&&s.mode==='knives'){
    knifeControls.classList.remove('hidden');$('throwBtn').disabled=s.status!=='playing'||!s.active||s.knivesRemaining<=0;$('knivesLeft').textContent=s.knivesRemaining;$('roundScore').textContent=s.roundScore;$('totalScore').textContent=s.totalScore;
    const control=s.status!=='playing'?'countdown':!s.active?'next':s.knivesRemaining<=0?'empty':'ready';
    actionState($('throwBtn'),control,control==='ready'?'THROW':control==='empty'?'НОЖИ КОНЧИЛИСЬ':control==='countdown'?'ГОТОВИМСЯ':'ЖДЁМ',control==='ready'?'Тапни в нужный момент':control==='countdown'?'Смотри на экран':'ЖДИ СЛЕДУЮЩИЙ РАУНД');
    spectatorState(knifeControls,control==='empty'||control==='next',control==='empty'?'НОЖИ КОНЧИЛИСЬ':'ЖДЁМ');
  }
  if(inRound&&s.mode==='western'){
    westernControls.classList.remove('hidden');$('westernWins').textContent=s.roundWins;$('westernBest').textContent=s.bestReactionMs==null?'—':`${s.bestReactionMs}ms`;$('westernFalse').textContent=s.falseStarts;
    const locked=s.status!=='playing'||!s.active||s.falseStart||s.shotThisRound;$('fireBtn').classList.toggle('locked',locked);$('fireBtn').disabled=locked;
    const control=s.status!=='playing'?'countdown':!s.active?'next':s.falseStart?'false-start':s.shotThisRound?'shot':'ready';
    actionState($('fireBtn'),control,control==='ready'?'FIRE':control==='shot'?'ВЫСТРЕЛЕНО':control==='false-start'?'ВЫБЫЛ':control==='countdown'?'ГОТОВИМСЯ':'ЖДЁМ',control==='ready'?'Не стреляй до DRAW!':control==='countdown'?'Смотри на экран':'ЖДИ СЛЕДУЮЩИЙ РАУНД');
    spectatorState(westernControls,['next','false-start','shot'].includes(control),control==='shot'?'ВЫСТРЕЛЕНО':control==='false-start'?'ВЫБЫЛ':'ЖДЁМ');
    $('westernFeedback').dataset.feedbackRole=s.status==='countdown'||s.falseStart?'state':s.shotThisRound&&s.reactionMs!=null?'numeric':'instruction';
    if(s.status==='countdown')$('westernFeedback').textContent='ПРИГОТОВЬСЯ · СМОТРИ НА БОЛЬШОЙ ЭКРАН';
    else if(s.falseStart)$('westernFeedback').textContent='TOO EARLY';
    else if(s.shotThisRound&&s.reactionMs!=null){$('westernFeedback').textContent=`${s.reactionMs} ms`;const rk=s.round+':'+s.reactionMs;if($('westernFeedback').dataset.reveal!==rk){$('westernFeedback').dataset.reveal=rk;accent($('westernFeedback'),[{transform:'translateY(8px) scale(.92)',opacity:.3},{transform:'none',opacity:1}],280);}}
    else $('westernFeedback').textContent='Смотри на большой экран · не ведись на фейки';
  }

  if(s.status==='finished'){
    hideControls();waiting.classList.remove('hidden');showRoundCard(s.winnerText||'МАТЧ ОКОНЧЕН','Следующий матч запускается с компьютера.');
  }else if(s.status==='between'){
    hideControls();waiting.classList.remove('hidden');showRoundCard(s.winnerText||'РАУНД ОКОНЧЕН','Следующий раунд сейчас начнётся.');
  }else if(!inRound){
    showRoundCard('ЖДЁМ СТАРТ НА КОМПЬЮТЕРЕ','Ты уже подключён. На большом экране выберите игру.');
  }
}
// Round outcome card. Names arrive inside server text, so build it from text
// nodes; the leading emoji becomes the card's illustration. Rebuilt (and so
// re-animated) only when the visible message actually changes.
function showRoundCard(title,detail){
  const match=String(title).match(/^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s*/u),key=title+'\n'+detail;
  if(waiting.dataset.roundCard===key)return;waiting.dataset.roundCard=key;
  const card=document.createElement('div');card.className='round-card hp-info-card';
  const portrait=document.createElement('img');portrait.className='round-mascot';portrait.dataset.photo=String(!!window.PARTY_PROFILE?.avatar);portrait.alt='';portrait.src=window.PartyArt?.mascotSource({seed:window.PARTY_PROFILE?.id||self?.name,avatar:window.PARTY_PROFILE?.avatar})||'/assets/avatars/atlas-mascots/mascot-01.webp';card.append(portrait);
  const heading=document.createElement('b');heading.textContent=match?title.slice(match[0].length):title;
  const note=document.createElement('span');note.textContent=detail;card.append(heading,note);
  waiting.replaceChildren(card);
}
socket.on('selfState',applySelf);

// Managed lobby identity, also on the first connection.
