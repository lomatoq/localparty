import {PartyConnection} from './net.js';
import {FreeMotionThrow, ShakeSweep, SportsSensors} from '/sports-motion.js';
const $=id=>document.getElementById(id),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mode=window.SS_CONFIG.mode,sports=['curling','bowling'].includes(mode),bot=!!window.parent.PARTY_TEST_BOT;
document.body.dataset.ssMode=mode;
const net=new PartyConnection();let state=null,me=null,gesture=null,aimPointer=null,firePointer=null,sweepPointer=null,fire=false,sweep=false;
const currentName=document.createElement('span');currentName.id='ss-current-name';currentName.className='hp-player-name';currentName.setAttribute('data-no-translate','');currentName.hidden=true;$('ss-turn').after(currentName);
const personalScore=document.createElement('strong');personalScore.id='ss-personal-score';personalScore.setAttribute('data-no-translate','');
// Readout = [score + unit] · [detail]. Both parts are stat labels, so the shared stat glyphs
// (trophy for points, etc.) paint in front of them; the text stays the same as before.
const personalStat=document.createElement('span'),personalUnit=document.createTextNode(''),personalDetail=document.createElement('span');personalStat.className='hp-stat-label ss-personal-stat';personalStat.append(personalScore,personalUnit);personalDetail.className='ss-personal-detail';const taskCopy=document.createElement('div');taskCopy.className='ss-task-copy';const status=document.querySelector('.ss-controller-status');status.prepend(taskCopy);taskCopy.append($('ss-turn'),currentName,personalDetail);
let controlMode='swipe',motionReady=false,motionSweep=false,connected=false;
let aim={x:.5,y:.5},lastEvent=0,pendingTurn='',sound=false,audio,hand=window.PARTY_PROFILE?.hand||sessionStorage.getItem('ss-hand')||'right';
$('ss-sports').hidden=!sports;$('ss-shooter').hidden=sports;
$('ss-title')?.remove();
function applyHand(){document.body.classList.toggle('ss-left',hand==='left');$('ss-hand-label').textContent=hand==='left'?'Левая':'Правая';$('ss-hand').setAttribute('aria-pressed',String(hand==='left'));}
applyHand();
$('ss-hand').querySelector('img').src='/assets/icons/game-pack/switch.svg';
$('ss-sound').querySelector('img').src='/assets/icons/game-pack/mute.svg';
document.querySelector('.ss-swipe-arrow').src='/assets/icons/game-pack/arrow-up.svg';
$('ss-fire').querySelector('img').src='/assets/icons/atlas-stat-glyphs/hit.webp';
$('ss-sound-label').textContent='Звук: выкл.';
let observer,observerHint,sweepLabel,sportsScoreUnit,throwCaption,throwExplanation,powerLabel,motionPanel,motionTitle,motionDetail,motionArt,motionPower;
if(sports){
  $('ss-throw-art').src='assets/atlas-sports/'+(mode==='curling'?'curling-stone-coral':'bowling-ball-lime')+'.webp';
  // Sports have no left/right trigger layout. Keep sound beside the actual identity;
  // put the round detail and score together before the action rather than scattering them.
  $('ss-hand').hidden=true;
  const match=document.createElement('div');match.className='ss-sports-match';status.before(match);match.append(personalDetail,$('ss-personal'));
  const motionControls=document.createElement('div');motionControls.id='ss-motion-controls';motionControls.setAttribute('data-hp-theme-preserve','');
  const modes=document.createElement('div');modes.className='ss-input-modes';modes.setAttribute('role','group');modes.setAttribute('aria-label','Throw controls');
  for(const [id,label] of [['ss-mode-swipe','Swipe'],['ss-mode-motion','Motion']]){const button=document.createElement('button');button.id=id;button.type='button';button.textContent=label;button.setAttribute('aria-pressed',String(id==='ss-mode-swipe'));modes.append(button);}
  const enable=document.createElement('button');enable.id='ss-enable-motion';enable.type='button';enable.hidden=true;
  const sensorStatus=document.createElement('span');sensorStatus.id='ss-motion-status';sensorStatus.setAttribute('role','status');sensorStatus.hidden=true;
  motionControls.append(modes,enable,sensorStatus);$('ss-sports').prepend(motionControls);
  const station=document.createElement('div');station.id='ss-launch-station';station.setAttribute('data-hp-theme-preserve','');station.className='controls-panel';$('ss-sports').prepend(station);station.append(document.querySelector('.ss-throw-settings'),$('ss-throw-pad'));station.before(motionControls);
  observer=document.createElement('div');observer.id='ss-observer';observer.hidden=true;
  const art=document.createElement('img');art.src=$('ss-throw-art').src;art.alt='';
  observerHint=document.createElement('span');observer.append(art,observerHint);$('ss-sports').append(observer);
  sweepLabel=document.createElement('span');sweepLabel.id='ss-sweep-label';
  const broom=document.createElement('img');broom.src='assets/atlas-sports/broom.webp';broom.alt='';$('ss-sweep').replaceChildren(broom,sweepLabel);
  sportsScoreUnit=document.createElement('span');personalStat.replaceChildren(personalScore,sportsScoreUnit);
  const hint=$('ss-throw-hint');throwCaption=document.createElement('b');throwExplanation=document.createElement('small');const powerReadout=document.createElement('div');powerReadout.className='ss-gesture-power';powerLabel=document.createElement('span');powerReadout.append(powerLabel,$('ss-power'));hint.replaceChildren(throwCaption,throwExplanation,powerReadout);
  motionPanel=document.createElement('div');motionPanel.id='ss-motion-throw';motionPanel.hidden=true;
  motionArt=document.createElement('img');motionArt.alt='';motionArt.src=$('ss-throw-art').src;
  motionTitle=document.createElement('b');motionDetail=document.createElement('p');motionPower=document.createElement('strong');
  motionPanel.append(motionArt,motionTitle,motionDetail,motionPower);station.append(motionPanel);
  // One instruction belongs to the gesture surface. Observer states have their own copy.
  document.querySelector('.ss-controller-foot').hidden=true;
}
function setSweepLabel(text){if(sweepLabel)sweepLabel.textContent=text;else $('ss-sweep').textContent=text;}
$('ss-ability-art').src=mode==='swarm_gate'?'/assets/icons/atlas-stat-glyphs/lightning.webp':'/assets/icons/atlas-stat-glyphs/rocket.webp';
if(mode==='peek_shoot'){const guide=document.createElement('div');guide.className='ss-target-guide';const art=document.createElement('img');art.src='assets/targets-flat-v2/target-friendly-v2.webp';art.alt='';const hint=document.createElement('span');hint.textContent=window.PartyI18n?.language==='ru'?'Белый флажок: не стрелять':'White flag: do not shoot';guide.append(art,hint);$('ss-shooter').before(guide);}
for(const id of ['ss-position','ss-spin']){const update=()=>{const n=Math.round(Number($(id).value)*100);$(id+'-value').textContent=(n>0?'+':'')+n+'%';};$(id).addEventListener('input',update);update();}
$('ss-hand').onclick=()=>{release();hand=hand==='left'?'right':'left';sessionStorage.setItem('ss-hand',hand);applyHand();};
$('ss-sound').onclick=()=>{sound=!sound;$('ss-sound-label').textContent=sound?'Звук: вкл.':'Звук: выкл.';$('ss-sound').querySelector('img').src='/assets/icons/game-pack/'+(sound?'volume':'mute')+'.svg';$('ss-sound').setAttribute('aria-pressed',String(sound));if(sound){audio||=new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}};
function ping(good=true){if(navigator.vibrate)navigator.vibrate(good?12:30);if(sound&&audio?.state==='running'){const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(good?640:180,audio.currentTime);o.frequency.exponentialRampToValueAtTime(good?940:95,audio.currentTime+.06);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.1);}}
let feedbackTimer;
function feedback(text,good=true){$('ss-feedback').textContent=text;$('ss-feedback').classList.add('show');clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>$('ss-feedback').classList.remove('show'),700);ping(good);}
net.addEventListener('status',e=>{
  $('ss-connection').textContent=e.detail;connected=e.detail==='В игре';
  if(sports&&e.detail!=='В игре'&&state){
    release();document.body.dataset.ssControlState='watch';$('ss-launch-station').hidden=true;$('ss-throw-pad').hidden=true;document.querySelector('.ss-throw-settings').hidden=true;$('ss-sweep').hidden=true;document.querySelector('.ss-meter').hidden=true;
    observer.hidden=false;observerHint.textContent=window.PartyI18n?.language==='ru'?'Восстанавливаем связь…':'Reconnecting…';
  }
});
net.addEventListener('joined',e=>{net.id=e.detail.id;$('ss-name').textContent=e.detail.name;});
net.addEventListener('state',e=>{
  state=e.detail;me=state.players.find(p=>p.id===net.id);if(!me)return;
  document.documentElement.style.setProperty('--ss-player',me.color);$('ss-name').textContent=`${me.number}. ${me.name}`;
  if(pendingTurn&&pendingTurn!==state.turnToken)pendingTurn='';
  if(gesture&&(!canMotionThrow()||gesture.token!==state.turnToken))cancelGesture();
  if(!canMotionSweep()){motionSweep=false;shake.reset();}
  const current=state.players.find(p=>p.id===state.currentId),time=Math.max(0,Math.ceil(state.deadline-state.t));
  let title=state.phase==='waiting'?'Ждём готовности компании':state.phase==='results'?(state.result.winners.includes(me.id)?'Победа! Красиво.':'Матч закончен'):!me.participant?'Ты смотришь. Вступишь в следующий матч.':'';
  if(!title)title=sports?(state.stage==='aim'?(state.currentId===me.id?'ТВОЙ БРОСОК':(window.PartyI18n?.language==='ru'?'СЕЙЧАС БРОСАЕТ':'NOW THROWING')):state.stage==='rolling'?'Смотри на общий экран':state.stage==='end'?'Считаем энд':'Красиво катится…'):mode==='swarm_gate'?(me.lockedUntil>state.t?(window.PartyI18n?.language==='ru'?'ДАЙ ТУРЕЛИ ОСТЫТЬ':'LET THE TURRET COOL'):state.stage==='break'?(window.PartyI18n?.language==='ru'?'ВОРОТА РЕМОНТИРУЮТСЯ':'GATE REPAIRING'):(window.PartyI18n?.language==='ru'?'ЗАЩИЩАЙ ВОРОТА':'DEFEND THE GATE')):`До финала: ${time} сек`;
  const nativeRu=window.PartyI18n?.language==='ru';if(state.phase==='playing'&&me.participant){if(mode==='curling')title=state.stage==='aim'?(state.currentId===me.id?(nativeRu?'Твой бросок':'Your throw'):(nativeRu?'Сейчас бросает':'Now throwing')):state.stage==='rolling'?(sweep?(nativeRu?'Трём лёд':'Sweeping'):me.team===current?.team?(nativeRu?'Помоги камню свипом':'Sweep your team’s stone'):(nativeRu?'Камень соперников':'Opponent’s stone')):state.stage==='end'?(nativeRu?'Считаем энд':'Measuring the end'):(nativeRu?'Камень остановился':'Stone settled');else if(mode==='bowling')title=state.stage==='aim'?(state.currentId===me.id?(nativeRu?'Твой бросок':'Your throw'):(nativeRu?'Сейчас бросает':'Now throwing')):state.stage==='rolling'?(nativeRu?'Шар на дорожке':'Ball rolling'):(nativeRu?'Считаем кегли':'Counting pins');else if(mode==='peek_shoot')title=nativeRu?'Целься и стреляй':'Aim and fire';} $('ss-turn').textContent=title;
  currentName.hidden=!sports||state.phase!=='playing'||state.currentId===me.id;currentName.textContent=current?.name||'';currentName.title=current?.name||'';
  const ru=window.PartyI18n?.language==='ru';personalScore.textContent=String(mode==='curling'?state.teams?.[me.team]||0:mode==='swarm_gate'?me.kills:me.score);
  const shown=Number(personalScore.textContent)||0,ptsRu=shown%10===1&&shown%100!==11?'очко':shown%10>=2&&shown%10<=4&&(shown%100<12||shown%100>14)?'очка':'очков',ptsEn=shown===1?'point':'points';
  const unit=mode==='swarm_gate'?(ru?' целей':' targets'):' '+(ru?ptsRu:ptsEn);
  const detail=mode==='bowling'?(ru?`фрейм ${me.frames?.length||1}/${state.frameCount||5}`:`Frame ${me.frames?.length||1}/${state.frameCount||5}`):mode==='curling'?(ru?`${me.team===0?'Коралловая':'Бирюзовая'} команда`:`${me.team===0?'Coral':'Turquoise'} team`):mode==='swarm_gate'?(ru?`ворота ${Math.ceil((state.gate||0)/10)}%`:`Gate ${Math.ceil((state.gate||0)/10)}%`):(ru?'Белый флажок — мирный':'White flag = friendly');
  if(personalUnit.data!==unit)personalUnit.data=unit;if(personalDetail.textContent!==detail)personalDetail.textContent=detail;personalDetail.classList.remove('hp-stat-label');personalDetail.style.setProperty('--ss-team',me.team===0?'#ff8e83':'#81e9ee');
  if($('ss-personal').firstChild!==personalStat)$('ss-personal').replaceChildren(personalStat);
  document.querySelector('.ss-meter').hidden=mode==='bowling'||mode==='curling'&&(state.stage!=='rolling'||me.team!==current?.team||state.phase!=='playing');$('ss-progress').style.width=(mode==='swarm_gate'?me.heat*100:mode==='curling'?me.energy*100:mode==='peek_shoot'?me.gunUntil>state.t?(me.gunUntil-state.t)/8*100:me.charge?100:me.streak/6*100:Math.min(100,time/25*100))+'%';
  const canThrow=state.phase==='playing'&&me.participant&&state.currentId===me.id&&state.stage==='aim'&&pendingTurn!==state.turnToken;
  $('ss-throw-pad').classList.toggle('disabled',!canThrow);$('ss-position').disabled=$('ss-spin').disabled=!canThrow;
  $('ss-sweep').hidden=mode!=='curling';$('ss-sweep').disabled=state.phase!=='playing'||state.stage!=='rolling'||me.team!==current?.team||me.energy<.03||!me.participant;
  setSweepLabel(sweep?(ru?'Трём лёд':'Sweeping'):(ru?'Держи для свипа':'Hold to sweep'));
  if(sports){
    const rolling=state.phase==='playing'&&state.stage==='rolling',canSweep=mode==='curling'&&rolling&&me.team===current?.team&&me.participant;
    if(mode==='curling'){
      const ownArt='assets/atlas-sports/curling-stone-'+(me.team===1?'teal':'coral')+'.webp',shownTeam=current?.team??me.team,watchArt='assets/atlas-sports/curling-stone-'+(shownTeam===1?'teal':'coral')+'.webp';
      if($('ss-throw-art').getAttribute('src')!==ownArt)$('ss-throw-art').src=ownArt;
      if(observer.firstElementChild.getAttribute('src')!==watchArt)observer.firstElementChild.src=watchArt;
    }
    document.body.dataset.ssControlState=canThrow?'aim':canSweep?'sweep':'watch';
    $('ss-launch-station').hidden=!canThrow||controlMode==='motion'&&!motionReady;document.querySelector('.ss-throw-settings').hidden=!canThrow;pad.hidden=!canThrow;
    $('ss-sweep').hidden=!canSweep;observer.hidden=canThrow||canSweep;
    currentName.hidden=state.phase!=='playing'||state.currentId===me.id||state.stage!=='aim';
    const finalCurlingScore=mode==='curling'&&state.endIndex>=state.endCount&&(state.stage==='end'||state.stage==='reveal'&&state.throwIndex+1>=state.throwCount);
    observerHint.textContent=state.phase!=='playing'?(ru?'Смотри на общий экран':'Watch the TV'):rolling?(ru?(mode==='bowling'?'Шар катится. Ждём кегли.':'Следи за камнем на общем экране.'):(mode==='bowling'?'The ball is rolling. Watch the pins.':'Follow the stone on TV.')):state.stage==='aim'?(ru?'Твой пульт откроется в твой ход':'Your controls appear on your turn'):finalCurlingScore?(ru?'Ждём итог матча':'Waiting for the final result'):(ru?'Следующий бросок после подсчёта':'Next throw after the score');
    pad.setAttribute('aria-disabled',String(!canThrow));
    if(sweep&&$('ss-sweep').disabled){sweep=false;sweepPointer=null;$('ss-sweep').classList.remove('pressed');sendInput();}
    powerLabel.textContent=ru?'Сила':'Power';refreshMotionCopy();
    const scoreUnit=unit.trim();personalStat.classList.remove('hp-stat-label');personalStat.classList.add('ss-sports-score');
    if(sportsScoreUnit.textContent!==scoreUnit)sportsScoreUnit.textContent=scoreUnit;
    $('ss-position').setAttribute('aria-label',ru?'Позиция броска':'Throw position');$('ss-spin').setAttribute('aria-label',ru?'Подкрутка':'Spin');
  }
  $('ss-fire').disabled=state.phase!=='playing'||!me.participant||(mode==='swarm_gate'&&me.lockedUntil>state.t);
  $('ss-meter-label').textContent=mode==='swarm_gate'?(me.lockedUntil>state.t?(ru?'ПЕРЕГРЕВ':'OVERHEATED'):(ru?'НАГРЕВ':'HEAT'))+' · '+Math.round(me.heat*100)+'%':mode==='curling'?(ru?'ЭНЕРГИЯ СВИПА':'SWEEP ENERGY')+' · '+Math.round(me.energy*100)+'%':mode==='peek_shoot'?(me.gunUntil>state.t?(ru?'ПУЛЕМЁТ':'MACHINE GUN')+' · '+Math.ceil(me.gunUntil-state.t)+' '+(ru?'с':'s'):me.charge?(ru?'ПУЛЕМЁТ ГОТОВ':'MACHINE GUN READY'):(ru?'СЕРИЯ':'STREAK')+' · '+me.streak+'/6'):(ru?'НА БРОСОК':'THROW IN')+' · '+time+' '+(ru?'с':'s');
  const ability=$('ss-ability'),abilityLabel=$('ss-ability-label');
  if(mode==='swarm_gate'){const remaining=Math.ceil(Math.max(0,me.abilityAt-state.t));ability.disabled=!!remaining||state.phase!=='playing'||!me.participant;abilityLabel.textContent=remaining?`${ru?'ИМПУЛЬС':'PULSE'} · ${remaining}\u00a0${ru?'с':'s'}`:(ru?'ИМПУЛЬС':'PULSE');}
  else{const remaining=Math.ceil(Math.max(0,me.gunUntil-state.t)),compact=window.innerWidth<=360;ability.disabled=!me.charge||!!remaining||state.phase!=='playing'||!me.participant;abilityLabel.textContent=remaining?`${ru?(compact?'Пул.':'ПУЛЕМЁТ'):(compact?'MG':'MACHINE GUN')} · ${remaining}\u00a0${ru?'с':'s'}`:me.charge?(ru?(compact?'Пуск':'ВКЛЮЧИТЬ'):(compact?'Use MG':'ACTIVATE')):'6 ПОПАДАНИЙ';}
  $('ss-help').textContent=mode==='bowling'?(state.stage==='aim'?(ru?'Позиция и подкрутка → свайп вверх':'Set position and spin, then swipe up'):(ru?'Следующий бросок после подсчёта':'Next throw after the pins settle')):mode==='curling'?(ru?(state.stage==='rolling'?(me.team===current?.team?'Держи свип, чтобы помочь камню':'Смотри на камень соперников'):'Позиция и подкрутка → свайп вверх'):(state.stage==='rolling'?(me.team===current?.team?'Hold sweep to guide your stone':'Watch the other team’s stone'):'Set position and spin, then swipe up')):mode==='swarm_gate'?(ru?'Веди прицел. Держи огонь.':'Move the aim. Hold fire.'):(ru?'Прицел — тачпад. Огонь — кнопка.':'Aim with the pad. Fire with the button.');
  if(sports&&controlMode==='motion')refreshMotionHelp();
  if(sports&&state.phase==='playing'&&state.stage==='aim'&&state.currentId!==me.id)$('ss-help').textContent=ru?'Следи за броском на общем экране':'Watch the current throw on TV';
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
  if(!gesture||gesture.motion)return;
  ctx.lineWidth=4;ctx.lineCap='round';ctx.strokeStyle=me?.color||'#c8ff73';ctx.beginPath();gesture.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
  const b=gesture.points.at(-1);ctx.beginPath();ctx.arc(b.x,b.y,12,0,Math.PI*2);ctx.stroke();$('ss-power').textContent=Math.round(measure(gesture).power*100)+'%';
}
function cancelGesture(){gesture=null;motionThrow.cancel();pad.classList.remove('active');$('ss-power').textContent='0%';drawGesture();}
const motionThrow=new FreeMotionThrow(),shake=new ShakeSweep();
function paused(){return document.hidden||window.PARTY_UI?.phase==='paused'||window.PARTY_SESSION?.paused||window.parent.PARTY_SESSION?.paused;}
function canMotionThrow(){return sports&&connected&&!paused()&&state?.phase==='playing'&&me?.participant&&state.currentId===net.id&&state.stage==='aim'&&pendingTurn!==state.turnToken;}
function canMotionSweep(){return mode==='curling'&&connected&&!paused()&&state?.phase==='playing'&&me?.participant&&state.stage==='rolling'&&me.team===state.players.find(p=>p.id===state.currentId)?.team&&me.energy>=.03;}
function refreshMotionHelp(){
  if(!sports||controlMode!=='motion')return;const ru=window.PartyI18n?.language==='ru';
  if(state?.stage==='aim'&&state.currentId===net.id)$('ss-help').textContent=motionReady?(ru?'Бросай движением руки к экрану; поворот кисти задаёт подкрутку':'Throw toward the TV; turn your wrist for spin'):(ru?'Ждём датчики. Пока не бросай.':'Waiting for sensors. Hold off on throwing.');
  else if(canMotionSweep())$('ss-help').textContent=ru?'Тряси телефон, чтобы помочь камню':'Shake your phone to sweep';
}
function motionDiagnostic(stats){window.webkit?.messageHandlers?.partyShell?.postMessage({type:'sports-motion-diagnostic',stats});}
function refreshMotionCopy(){
  if(!sports)return;const ru=window.PartyI18n?.language==='ru',motion=controlMode==='motion';
  document.body.dataset.ssInputMode=controlMode;
  $('ss-mode-swipe').textContent=ru?'Свайп':'Swipe';$('ss-mode-motion').textContent=ru?'Движение':'Motion';
  $('ss-mode-swipe').setAttribute('aria-pressed',String(!motion));$('ss-mode-motion').setAttribute('aria-pressed',String(motion));
  const failed=sensors.status==='denied'||sensors.status==='unavailable';
  $('ss-enable-motion').hidden=motionReady||!motion&&!failed;
  const throwing=canMotionThrow(),sweeping=canMotionSweep();
  if(state)$('ss-launch-station').hidden=!(throwing||motion&&sweeping);
  document.querySelector('.ss-throw-settings').hidden=!throwing||motion;pad.hidden=!throwing||motion;
  motionPanel.hidden=!motion; if(motion&&mode==='curling')$('ss-sweep').hidden=true;
  if(motion){
    const calibrated=!!motionThrow.frame,ready=motionThrow.state==='ready';
    motionArt.src=sweeping?'assets/atlas-sports/broom.webp':$('ss-throw-art').src;
    motionTitle.textContent=sweeping?(motionSweep?(ru?'Трём лёд':'Sweeping'):(ru?'Тряси телефон':'Shake to sweep')):!motionReady?(ru?'Ждём датчики':'Starting sensors'):!calibrated?(ru?'Задаём направление':'Face the TV'):motionThrow.state==='throwing'?(ru?'Бросок…':'Throwing…'):ready?(ru?'Бросай к экрану':'Throw toward the TV'):(ru?'На секунду замри':'Hold still briefly');
    motionDetail.textContent=sweeping?(ru?'Движения помогают камню скользить дальше':'Your movements help the stone slide farther'):!calibrated?(ru?'Встань лицом к экрану. Направь к нему верх телефона или его заднюю сторону и замри на полсекунды.':'Face the TV. Point the phone’s top edge or its back toward it and hold still for half a second.'):(ru?'Сильнее движение — сильнее бросок. Поверни кисть для подкрутки.':'A stronger movement makes a stronger throw. Turn your wrist for spin.');
    motionPower.hidden=sweeping||!motionThrow.attempt;motionPower.textContent=Math.round(motionThrow.preview()*100)+'%';
  }
  $('ss-enable-motion').textContent=failed?(ru?'Повторить доступ к датчикам':'Retry motion'):(ru?'Включаем датчики…':'Starting motion…');
  throwCaption.textContent=ru?'Свайпни вверх':'Swipe up';
  throwExplanation.textContent=ru?'Быстрее свайп — сильнее бросок':'Faster swipe, stronger throw';
  $('ss-throw-art').hidden=motion;
  pad.setAttribute('aria-label',ru?'Свайпни вверх для броска':'Swipe up to throw');
  if(mode==='curling'&&motion&&motionReady)setSweepLabel(sweep||motionSweep?(ru?'Трём лёд':'Sweeping'):(ru?'Тряси телефон':'Shake to sweep'));
  refreshMotionHelp();
}
const sensors=new SportsSensors({onDiagnostic:motionDiagnostic,onSample:sample=>{
  if(controlMode==='motion'&&motionReady){
    const previousState=motionThrow.state,previousPower=Math.round(motionThrow.preview()*100);
    const shot=motionThrow.feed(sample,canMotionThrow());
    if(shot&&canMotionThrow()){
      pendingTurn=state.turnToken;net.send('throw',{...shot,turnToken:pendingTurn});
      motionDiagnostic({event:'auto-throw',valid:true,received:sensors.received,fresh:!!sensors.fresh()});
      feedback(`${Math.round(shot.power*100)}% · ${window.PartyI18n?.language==='ru'?'БРОСОК':'THROW'}`);
    }
    if(shot||previousState!==motionThrow.state||previousPower!==Math.round(motionThrow.preview()*100))refreshMotionCopy();
  }
  const next=controlMode==='motion'&&motionReady&&shake.add(sample,canMotionSweep());
  if(next!==motionSweep){motionSweep=next;refreshMotionCopy();$('ss-sweep').classList.toggle('pressed',sweep||motionSweep);sendInput();}
},onStatus:status=>{
  if(!sports)return;motionReady=status==='ready';const ru=window.PartyI18n?.language==='ru';
  const label=$('ss-motion-status');label.hidden=false;label.dataset.ready=String(motionReady);
  if(status==='waiting'){cancelGesture();motionSweep=false;shake.reset();$('ss-sweep').classList.toggle('pressed',sweep);sendInput();}
  label.textContent=status==='ready'?(ru?'Датчики готовы · крепко держи телефон':'Motion ready · keep a firm grip'):status==='waiting'?(ru?'Ждём данные датчиков…':'Waiting for motion…'):status==='denied'?(ru?'Доступ закрыт. Свайп работает.':'Permission denied. Swipe is available.'):(ru?'Датчики недоступны. Свайп работает.':'No motion data. Swipe is available.');
  $('ss-enable-motion').disabled=status==='waiting';
  if(status==='denied'||status==='unavailable'){controlMode='swipe';motionSweep=false;shake.reset();cancelGesture();$('ss-sweep').classList.toggle('pressed',sweep);sendInput();}
  refreshMotionCopy();
}});
if(sports)Object.defineProperty(window,'PartySportsMotionDiagnostics',{configurable:true,get:()=>Object.freeze({mode:controlMode,status:sensors.status,transport:sensors.transport||null,received:sensors.received,ready:motionReady,fresh:!!sensors.fresh(),holding:false,calibrated:!!motionThrow.frame,armed:motionThrow.armed,gestureState:motionThrow.state,connected,stage:state?.stage||null,phase:state?.phase||null,ownTurn:state?.currentId===net.id,canThrow:!!canMotionThrow()})});
function stopMotion(){sensors.stop();motionThrow.reset();motionReady=motionSweep=false;shake.reset();if(sports){controlMode='swipe';$('ss-enable-motion').disabled=false;$('ss-motion-status').hidden=true;refreshMotionCopy();}}
if(sports){
  $('ss-mode-swipe').onclick=()=>{release();};
  $('ss-mode-motion').onclick=()=>{cancelGesture();motionThrow.reset();controlMode='motion';refreshMotionCopy();if(!sensors.running)sensors.enable();};
  $('ss-enable-motion').onclick=()=>{cancelGesture();motionThrow.reset();controlMode='motion';refreshMotionCopy();sensors.enable();};
  refreshMotionCopy();
}
pad.addEventListener('pointerdown',e=>{
  if(controlMode==='motion'||gesture||!canMotionThrow())return;e.preventDefault();
  gesture={pointer:e.pointerId,token:state.turnToken,points:[point(e)]};
  pad.setPointerCapture(e.pointerId);pad.classList.add('active');drawGesture();
});
pad.addEventListener('pointermove',e=>{if(gesture?.pointer!==e.pointerId||gesture.motion)return;e.preventDefault();gesture.points.push(point(e));if(gesture.points.length>120)gesture.points.splice(1,1);drawGesture();});
pad.addEventListener('pointerup',e=>{
  if(gesture?.pointer!==e.pointerId)return;e.preventDefault();
  const token=gesture.token,allowed=canMotionThrow()&&token===state.turnToken;let shot;
  gesture.points.push(point(e));shot=measure(gesture);
  cancelGesture();
  if(allowed&&shot?.valid){pendingTurn=token;net.send('throw',{...shot,turnToken:token});feedback(`${Math.round(shot.power*100)}% · ${window.PartyI18n?.language==='ru'?'БРОСОК':'THROW'}`);}
  else if(allowed)feedback(window.PartyI18n?.language==='ru'?'Повтори замах или свайп':'Try a fuller swing or swipe',false);
});
pad.addEventListener('pointercancel',()=>{cancelGesture();motionSweep=false;shake.reset();sendInput();});pad.addEventListener('lostpointercapture',()=>{if(gesture)cancelGesture();});
const aimPad=$('ss-aim-pad');
aimPad.addEventListener('pointerdown',e=>{if(aimPointer)return;e.preventDefault();aimPointer={id:e.pointerId,x:e.clientX,y:e.clientY};aimPad.setPointerCapture(e.pointerId);});
aimPad.addEventListener('pointermove',e=>{if(aimPointer?.id!==e.pointerId)return;e.preventDefault();const r=aimPad.getBoundingClientRect();aim.x=clamp(aim.x+(e.clientX-aimPointer.x)/r.width*.95);aim.y=clamp(aim.y+(e.clientY-aimPointer.y)/r.height*.95);aimPointer.x=e.clientX;aimPointer.y=e.clientY;updateCrosshair();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])aimPad.addEventListener(event,e=>{if(aimPointer?.id===e.pointerId)aimPointer=null;});
function updateCrosshair(){
  const label=aimPad.querySelector('span'),bottom=Math.max(24,aimPad.clientHeight-24);
  // Only the pad indicator avoids its static caption; authoritative aim stays normalized.
  const top=Math.min(bottom,Math.max(24,(label?.offsetTop||0)+(label?.offsetHeight||0)+24));
  $('ss-pad-crosshair').style.left=(10+aim.x*80)+'%';$('ss-pad-crosshair').style.top=(top+aim.y*(bottom-top))+'px';
}
if(!sports)new ResizeObserver(updateCrosshair).observe(aimPad);
function hold(button,kind){
  button.addEventListener('pointerdown',e=>{if(button.disabled)return;e.preventDefault();if(kind==='fire'){if(firePointer!==null)return;firePointer=e.pointerId;fire=true;}else{if(sweepPointer!==null)return;sweepPointer=e.pointerId;sweep=true;setSweepLabel(window.PartyI18n?.language==='ru'?'Трём лёд':'Sweeping');navigator.vibrate?.(10);}button.setPointerCapture(e.pointerId);button.classList.add('pressed');sendInput();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{if(kind==='fire'&&firePointer===e.pointerId){firePointer=null;fire=false;}if(kind==='sweep'&&sweepPointer===e.pointerId){sweepPointer=null;sweep=false;}button.classList.remove('pressed');sendInput();});
}
hold($('ss-fire'),'fire');hold($('ss-sweep'),'sweep');$('ss-ability').onclick=()=>net.send('ability');
function sendInput(){if(state?.phase==='playing')net.send('input',{...aim,fire,sweep:sweep||motionSweep&&canMotionSweep()});}
// Bowling has no aim pad: the shared aim channel carries the chosen launch position and
// spin so the TV can preview the spot and hook direction. The throw itself still sends both.
if(mode==='bowling'){const syncAim=()=>{aim={x:clamp((Number($('ss-position').value)+1)/2),y:clamp((Number($('ss-spin').value)+1)/2)};};for(const id of ['ss-position','ss-spin'])$(id).addEventListener('input',syncAim);syncAim();}
function release(preservePermission=false){if(!preservePermission)stopMotion();motionSweep=false;shake.reset();fire=sweep=false;firePointer=sweepPointer=null;aimPointer=null;cancelGesture();$('ss-fire').classList.remove('pressed');$('ss-sweep').classList.remove('pressed');sendInput();}
for(const name of ['pagehide','party-native-hide'])window.addEventListener(name,()=>{if(sensors.running)motionDiagnostic({event:'cancel',reason:name,holding:!!gesture?.motion});release();});
// Native insets, font/layout settlement and browser chrome can resize the frame
// without leaving this game. Cancel its neutral/held input, keep sensor opt-in.
window.addEventListener('orientationchange',()=>release(true));
window.addEventListener('resize',()=>{if(sensors.running)motionDiagnostic({event:'cancel',reason:'layout-resize',holding:!!gesture?.motion});release(true);});
window.addEventListener('blur',()=>release(sensors.permissionPending&&!gesture));
document.addEventListener('visibilitychange',()=>{if(document.hidden)release(sensors.permissionPending&&!gesture);});
window.addEventListener('party-phase-change',e=>{if(e.detail?.phase==='paused')release();});
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!sports){e.preventDefault();fire=true;sendInput();}if(e.key.startsWith('Arrow')){e.preventDefault();aim.x=clamp(aim.x+(e.key==='ArrowRight'?.025:e.key==='ArrowLeft'?-.025:0));aim.y=clamp(aim.y+(e.key==='ArrowDown'?.025:e.key==='ArrowUp'?-.025:0));updateCrosshair();}});
window.addEventListener('keyup',e=>{if(e.code==='Space'){fire=false;sendInput();}});
setInterval(()=>{if(sports&&motionSweep&&(!canMotionSweep()||!shake.active(performance.now())||!sensors.fresh())){motionSweep=false;$('ss-sweep').classList.toggle('pressed',sweep);refreshMotionCopy();}if(!document.hidden||bot)sendInput();},33);
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
