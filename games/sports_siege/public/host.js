import {eventNotice} from './notice-copy.js';
import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {PartyConnection} from './net.js';
import {createBowlingScene} from './scene-bowling.js';
import {CurlingScene} from './scene-curling.js';
const $=id=>document.getElementById(id),mode=window.SS_CONFIG.mode,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,clamp=(value,min,max)=>Math.max(min,Math.min(max,value)),seededUnit=seed=>{const n=Math.sin(seed*12.9898+78.233)*43758.5453;return n-Math.floor(n);};document.body.dataset.ssMode=mode;
const net=new PartyConnection(true);let state=null,lastEvent=0,lastTurn='',noticeUntil=0,uiCards=new Map(),view,pendingHostStart=false,startSent=false;
const turretArt=[["coral",{"center":[0.5,0.24420463629096723],"worldSize":[1.4607853684776761,2.9474878967186657],"color":"#FF7B70","file":"turret-coral-v3.webp"}],["orange",{"center":[0.4991181657848324,0.23524451939291735],"worldSize":[1.3936363636363636,2.915084175084175],"color":"#FFA658","file":"turret-orange-v3.webp"}],["gold",{"center":[0.5,0.25063078216989065],"worldSize":[1.5117257142857143,2.975897142857143],"color":"#F4CB5F","file":"turret-gold-v3.webp"}],["lime",{"center":[0.5,0.2563429571303587],"worldSize":[1.5545323741007193,3.0014028776978416],"color":"#B8D966","file":"turret-lime-v3.webp"}],["leaf",{"center":[0.49919743178170145,0.2534979423868313],"worldSize":[1.5312794612794614,2.9863636363636363],"color":"#69B987","file":"turret-leaf-v3.webp"}],["mint",{"center":[0.5,0.22589020771513357],"worldSize":[1.3044087591240874,2.8731094890510946],"color":"#6FD5B9","file":"turret-mint-v3.webp"}],["teal",{"center":[0.5,0.24109470026064295],"worldSize":[1.4250962099125364,2.9395801749271135],"color":"#48BFC1","file":"turret-teal-v3.webp"}],["cyan",{"center":[0.5007396449704142,0.25605143721633883],"worldSize":[1.5301705426356589,2.9924341085271315],"color":"#70CAE9","file":"turret-cyan-v3.webp"}],["sky",{"center":[0.5,0.24578414839797635],"worldSize":[1.4359021058622652,2.956562322140011],"color":"#77AAE9","file":"turret-sky-v3.webp"}],["royal",{"center":[0.5,0.24054706355591315],"worldSize":[1.4301077586206896,2.933372844827586],"color":"#7D8CDA","file":"turret-royal-v3.webp"}],["violet",{"center":[0.49921259842519683,0.2505947660586836],"worldSize":[1.4969321851453175,2.9726480086114098],"color":"#A58BD8","file":"turret-violet-v3.webp"}],["orchid",{"center":[0.5,0.24101307189542487],"worldSize":[1.4344140197152244,2.9359912376779844],"color":"#C794DB","file":"turret-orchid-v3.webp"}],["pink",{"center":[0.5,0.23541009463722395],"worldSize":[1.382674357629785,2.912343995804929],"color":"#E69BBD","file":"turret-pink-v3.webp"}],["raspberry",{"center":[0.5,0.226027397260274],"worldSize":[1.3083116883116883,2.8747852147852146],"color":"#D7799F","file":"turret-raspberry-v3.webp"}],["cream",{"center":[0.5,0.23500410846343467],"worldSize":[1.3858032786885246,2.9128196721311475],"color":"#E5CE9D","file":"turret-cream-v3.webp"}],["steel",{"center":[0.5,0.20523212969786297],"worldSize":[1.1542588235294118,2.797016470588235],"color":"#9DBBC7","file":"turret-steel-v3.webp"}]];
const instructions={
  bowling:'На телефоне выбери позицию и подкрутку. Проведи пальцем вверх: направление и скорость свайпа задают бросок. Играем по очереди; страйки, спэры и бонусные броски считаются автоматически.',
  curling:'Две команды. Свайпом отправляй камень к центру круга и выбивай чужие. Пока камень вашей команды едет, все могут держать свип на телефоне. Очки получают только камни ближе ближайшего чужого.',
  swarm_gate:'Каждый игрок — на своей турели. Тачпадом веди прицел, другой рукой держи огонь. Не подпускайте рой к воротам: укусившие продолжают грызть! Импульс бьёт по области, а между волнами ворота частично ремонтируются.',
  peek_shoot:'Води прицел тачпадом и стреляй отдельной кнопкой. Чудики выезжают из укрытий — попадать можно только в видимую часть. Шесть точных попаданий подряд заряжают пулемёт на 8 секунд. Его нужно включить! Белый флажок — мирный.'
};
$('ss-title').textContent=window.SS_CONFIG.title;$('ss-instructions').textContent=instructions[mode];
// The game owns one compact HUD; the authored world stays continuous behind it.
const topHUD=document.querySelector('.ss-host-top'),heading=document.querySelector('.ss-heading'),matchMetrics=document.querySelector('.ss-hud-stats');
matchMetrics.classList.add('ss-match-metrics');topHUD.append(matchMetrics);topHUD.setAttribute('data-hp-theme-preserve','');
const wordmark=document.createElement('img');wordmark.className='ss-game-wordmark';wordmark.src='/assets/game-logos-v1/logos/'+mode+'.png';wordmark.alt=window.SS_CONFIG.title;wordmark.addEventListener('error',()=>{wordmark.hidden=true;$('ss-title').hidden=false;});$('ss-title').before(wordmark);$('ss-title').hidden=true;
$('ss-stage').classList.add('ss-phase-pill');document.querySelector('.ss-heading-copy').append($('ss-stage'));
if(mode==='swarm_gate')matchMetrics.append($('ss-gate-health'));
let scoreDrawer,scoreToggle,drawerHeading,drawerTeams=[],scoreRevealUntil=0,scoreKey='',drawerOpen=false;
if(mode==='curling'){
  scoreDrawer=document.createElement('aside');scoreDrawer.id='ss-score-drawer';scoreDrawer.className='ss-score-drawer';scoreDrawer.setAttribute('aria-label','Match scores');
  drawerHeading=document.createElement('header');drawerHeading.className='ss-drawer-heading';drawerHeading.append(text('b',''),text('small',''));scoreDrawer.append(drawerHeading,$('ss-scoreboard'));document.body.append(scoreDrawer);
  for(let team=0;team<2;team++){const group=document.createElement('section');group.className='ss-drawer-team';group.dataset.team=String(team);group.setAttribute('role','group');const head=document.createElement('header');head.className='ss-team-standing';const title=text('b',''),total=text('strong','0'),label=text('small','');head.append(title,total,label);const members=document.createElement('div');members.className='ss-team-members';members.setAttribute('role','list');group.append(head,members);drawerTeams.push({group,title,total,label,members});}

  scoreToggle=document.createElement('button');scoreToggle.type='button';scoreToggle.id='ss-scores-toggle';scoreToggle.className='ss-scores-toggle';scoreToggle.setAttribute('aria-controls','ss-score-drawer');scoreToggle.setAttribute('aria-expanded','false');document.body.append(scoreToggle);
  scoreToggle.onclick=()=>{scoreRevealUntil=drawerOpen?0:performance.now()+9000;setScoreDrawer(!drawerOpen);};
}
function setScoreDrawer(open){if(!scoreDrawer)return;drawerOpen=open;scoreDrawer.classList.toggle('open',open);scoreDrawer.setAttribute('aria-hidden',String(!open));scoreToggle.setAttribute('aria-expanded',String(open));scoreToggle.textContent=open?(window.PartyI18n?.language==='ru'?'Скрыть счёт':'Hide scores'):(window.PartyI18n?.language==='ru'?'Счёт':'Scores')+' · '+(state?.players.length||0);}
function paintScoreDrawer(s){
  if(!scoreDrawer)return;const dense=s.players.length>8&&s.phase==='playing',ru=window.PartyI18n?.language==='ru';scoreDrawer.classList.toggle('enabled',dense);scoreToggle.hidden=drawerHeading.hidden=!dense;
  const board=$('ss-scoreboard');if(!dense){for(const p of s.players){const card=uiCards.get(p.id);if(card&&card.parentElement!==board)board.append(card);}for(const {group} of drawerTeams)group.remove();scoreDrawer.removeAttribute('aria-hidden');return;}
  drawerHeading.firstChild.textContent=ru?'Счёт команд':'Team standings';drawerHeading.lastChild.textContent=(ru?'Энд ':'End ')+s.endIndex+'/'+s.endCount;board.setAttribute('role','group');board.setAttribute('aria-label',ru?'Счёт и состав команд':'Team scores and members');
  for(let team=0;team<2;team++){const ui=drawerTeams[team];ui.title.textContent=ru?(team===0?'Коралловые':'Бирюзовые'):(team===0?'Coral':'Turquoise');ui.total.textContent=String(s.teams?.[team]||0);ui.label.textContent=ru?'Личные очки':'Player points';ui.group.setAttribute('aria-label',ui.title.textContent);if(ui.group.parentElement!==board)board.append(ui.group);for(const p of s.players.filter(p=>p.team===team)){const card=uiCards.get(p.id);if(card){card.dataset.team=String(team);if(card.parentElement!==ui.members)ui.members.append(card);}}}
  const key=JSON.stringify([s.endIndex,s.teams,s.players.map(p=>[p.id,p.score,p.team])]);if(key!==scoreKey){scoreKey=key;scoreRevealUntil=performance.now()+9000;setScoreDrawer(true);}else if(performance.now()>scoreRevealUntil&&drawerOpen)setScoreDrawer(false);
}

const settings={bowling:['Фреймов','frames',[3,5,10],5],curling:['Эндов','ends',[1,3,5],3],swarm_gate:['Волн','waves',[4,6,8],6],peek_shoot:['Секунд','seconds',[60,90,120],90]}[mode];
const select=document.createElement('select');select.id='ss-length';select.setAttribute('aria-label',settings[0]);
for(const n of settings[2]){const option=new Option(`${settings[0]}: ${n}`,n,n===settings[3],n===settings[3]);select.add(option);}$('ss-settings').append(select);
const connectedRequired=mode==='curling'?2:1;
function requestHostStart(){
  if(startSent||state?.phase!=='waiting'){if(!state)pendingHostStart=true;return;}
  const connected=state.players.filter(p=>p.connected).length;
  if(connected<connectedRequired){pendingHostStart=true;$('start').dataset.pending='true';$('start').textContent='Подключаем игроков…';$('start').setAttribute('aria-busy','true');$('ss-status').textContent='Подключаем игроков к матчу — запуск продолжится автоматически';return;}
  pendingHostStart=false;startSent=true;$('start').dataset.pending='';$('start').removeAttribute('aria-busy');$('start').textContent='Запускаем…';net.send('start',{[settings[1]]:Number(select.value)});
}
$('start').onclick=requestHostStart;$('ss-again').onclick=()=>{startSent=false;pendingHostStart=false;net.send('reset');};
$('ss-lobby').onclick=()=>{if(window.parent!==window)window.parent.postMessage({type:'party-exit',instance:window.parent.PARTY_INSTANCE},location.origin);else location.href='/host';};
window.addEventListener('message',e=>{if(e.source===window.parent&&e.origin===location.origin&&e.data?.type==='party-start'){pendingHostStart=true;requestHostStart();}});
net.addEventListener('status',e=>{if(!state||state.phase==='waiting')$('ss-status').textContent=e.detail;});
function text(tag,value){const e=document.createElement(tag);e.textContent=value;return e;}
function frameText(frames){return (frames||[]).map(f=>{const r=f.rolls;return r.map((v,i)=>v===10?'X':i>0&&r[i-1]+v===10&&r[i-1]!==10?'/':v===0?'–':String(v)).join('');}).join(' · ');}
function hostNotice(event,players,language){
  if(event.kind!=='roll')return eventNotice(event,players,language);
  const player=players.find(p=>p.id===event.player),name=player?.name||'',ru=language==='ru',pins=event.pins,rolls=player?.frames.at(-1)?.rolls||[];
  const spare=rolls.length>=2&&rolls[0]+rolls[1]===10&&rolls[0]!==10;
  const result=pins===10?(ru?'СТРАЙК!':'Strike!'):spare?(ru?'СПЭР!':'Spare!'):pins===0?(ru?'Мимо кеглей':'Missed the pins'):ru?`${pins} кегл${pins===1?'я':pins<5?'и':'ей'}`:`${pins} ${pins===1?'pin':'pins'}`;
  return{text:`${name}: ${result}`,localized:true};
}
function makePlayerCard(p){
  const card=document.createElement('div');card.className='ss-player-card';card.setAttribute('data-hp-theme-preserve','');card.setAttribute('role','listitem');
  const badge=document.createElement('span');badge.className='ss-player-avatar';
  const avatar=document.createElement('img');avatar.className='ss-player-photo';avatar.alt='';avatar.hidden=true;avatar.addEventListener('error',()=>{avatar.hidden=true;badge.classList.remove('has-photo');});
  const initial=text('i','');const number=text('em','');badge.append(avatar,initial,number);
  const copy=document.createElement('span');copy.className='ss-player-copy';const name=text('b',''),detail=text('small','');name.className='hp-player-name';name.setAttribute('data-no-translate','');
  const bar=document.createElement('span');bar.className='ss-bar';bar.append(document.createElement('i'));copy.append(name,detail,bar);
  const score=text('strong','0');score.className='ss-player-score';const metric=document.createElement('span');metric.className='ss-score-metric';const label=text('small','Points');label.setAttribute('data-no-translate','');metric.append(label,score);card.append(badge,copy,metric);const mascot=document.createElement('img');mascot.className='ss-brand-mascot';mascot.alt='';let seed=0;for(const ch of String(p.id||p.name))seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;mascot.src='/assets/avatars/atlas-mascots/mascot-'+String(seed%16+1).padStart(2,'0')+'.webp';badge.prepend(mascot);card._ui={avatar,badge,initial,number,name,detail,bar:bar.firstChild,score,mascot};return card;
}
function paintUI(s){
  const playing=s.phase==='playing',waiting=s.phase==='waiting',current=s.players.find(p=>p.id===s.currentId),time=Math.max(0,Math.ceil(s.deadline-s.t)),ru=window.PartyI18n?.language==='ru',seconds=ru?'с':'s';
  if(!waiting){startSent=false;pendingHostStart=false;}
  $('ss-overlay').hidden=playing;$('start').hidden=!waiting;$('ss-again').hidden=s.phase!=='results';$('ss-settings').hidden=!waiting;
  const connected=s.players.filter(p=>p.connected).length,enoughPlayers=connected>=connectedRequired;
  $('start').disabled=false;$('start').removeAttribute('aria-disabled');
  if(waiting&&!startSent){$('start').textContent=pendingHostStart&&!enoughPlayers?'Подключаем игроков…':'Начать игру ↗';$('start').toggleAttribute('aria-busy',pendingHostStart&&!enoughPlayers);$('start').dataset.pending=pendingHostStart&&!enoughPlayers?'true':'';}
  $('ss-roster').textContent=waiting?(connected?`${connected} игроков подключились. Можно начинать.`:'Подключаем телефоны к матчу…'):'';
  $('ss-overlay-title').textContent=s.phase==='results'?s.result.reason:'Собираемся?';$('ss-instructions').hidden=s.phase==='results';
  $('ss-mode').textContent=mode==='bowling'?'3D BOWLING':mode==='curling'?'CURLING':mode==='swarm_gate'?'CO-OP DEFENCE':'SHOOTING GALLERY';
  $('ss-stage').textContent=waiting?'ЛОББИ':s.phase==='results'?'ФИНАЛ':mode==='bowling'?({aim:'ПРИЦЕЛ',rolling:'ШАР В ИГРЕ',reveal:'КЕГЛИ'}[s.stage]||'МАТЧ'):mode==='curling'?({aim:'БРОСОК',rolling:(s.sweepAmount>0?'СВИП':'КАМЕНЬ ИДЁТ'),reveal:'ЗАМЕР',end:'СЧЁТ ЭНДА'}[s.stage]||'МАТЧ'):mode==='swarm_gate'?s.stage==='break'?'РЕМОНТ':'ОБОРОНА':'ОХОТА';
  $('ss-status').textContent=waiting?(pendingHostStart&&!enoughPlayers?'Подключаем игроков — матч запустится автоматически':enoughPlayers?'Игроки подключены — можно начинать':'Откройте игру на телефонах'):mode==='bowling'?`фрейм ${current?.frames.length||1}/${s.frameCount} · ${s.stage==='aim'?'готовит бросок':s.stage==='rolling'?'шар на дорожке':'считаем кегли'}`:mode==='curling'?`${s.sweepAmount>0?(window.PartyI18n?.language==='ru'?'Свип · ':'Sweeping · '):''}Энд ${s.endIndex}/${s.endCount} · камень ${Math.min(s.throwCount||0,(s.throwIndex||0)+1)}/${s.throwCount||0}`:mode==='swarm_gate'?`Волна ${s.wave||0}/${s.waveCount||6} · ${s.enemies.length} у ворот · ещё ${s.waveLeft||0} в рое`:'Попадай в чудиков. Белый флажок — не цель.';
  let primary=['ИГРОКИ',String(s.players.filter(p=>p.connected).length)],secondary=['РЕЖИМ',settings[0].toUpperCase()];
  if(playing&&mode==='bowling'){primary=['ФРЕЙМ',`${current?.frames.length||1}/${s.frameCount}`];secondary=['НА БРОСОК',s.deadline?`${time} ${seconds}`:'—'];}
  else if(playing&&mode==='curling'){primary=['КОМАНДЫ',`${s.teams?.[0]||0} : ${s.teams?.[1]||0}`];secondary=['ЭНД · ХОД',`${s.endIndex||1}/${s.endCount||3} · ${time} ${seconds}`];}
  else if(playing&&mode==='swarm_gate'){primary=['ВОЛНА',`${s.wave||0}/${s.waveCount||6}`];secondary=['НА ПОЛЕ · В РОЕ',`${s.enemies.length} · ${s.waveLeft||0}`];}
  else if(playing){primary=['ДО ФИНАЛА',`${time} ${seconds}`];secondary=['ЛУЧШАЯ СЕРИЯ',String(Math.max(0,...s.players.map(p=>p.streak||0)))+'/6'];}
  else if(s.phase==='results'){primary=['ИТОГ',s.result?.winners?.length===1?'1 ПОБЕДИТЕЛЬ':'ФИНАЛ'];secondary=['ИГРОКИ',String(s.players.length)];}
  $('ss-primary-label').textContent=primary[0];$('ss-primary-value').textContent=primary[1];$('ss-secondary-label').textContent=secondary[0];$('ss-secondary-value').textContent=secondary[1];
  const gatePercent=Math.max(0,Math.min(100,(s.gate??1000)/10));$('ss-gate-health').hidden=mode!=='swarm_gate'||!playing;$('ss-gate-value').textContent=Math.ceil(gatePercent)+'%';$('ss-gate').style.width=gatePercent+'%';
  const scoreboard=$('ss-scoreboard'),scoreRows=Math.max(1,Math.ceil(s.players.length/8));scoreboard.dataset.count=String(s.players.length);scoreboard.style.setProperty('--ss-cols',String(Math.max(1,Math.min(8,s.players.length))));document.body.dataset.ssScoreRows=String(scoreRows);scoreboard.setAttribute('role','list');scoreboard.setAttribute('aria-label','Игроки и счёт');
  for(const p of s.players){
    let card=uiCards.get(p.id);
    if(!card){card=makePlayerCard(p);uiCards.set(p.id,card);scoreboard.append(card);}
    card.style.setProperty('--ss-player',p.color);card.classList.toggle('current',playing&&p.id===s.currentId);card.classList.toggle('offline',!p.connected);
    const ui=card._ui;card.dataset.playerId=p.id;ui.mascot.hidden=!!p.avatar;ui.name.textContent=p.name;ui.name.title=p.name;ui.initial.textContent=(p.name.trim()[0]||'?').toLocaleUpperCase('ru-RU');ui.number.textContent=p.number;ui.score.textContent=p.score;
    if(p.avatar&&ui.avatar.dataset.src!==p.avatar){ui.avatar.dataset.src=p.avatar;ui.avatar.hidden=false;ui.badge.classList.add('has-photo');ui.avatar.src=p.avatar;}else if(!p.avatar){ui.avatar.dataset.src='';ui.avatar.removeAttribute('src');ui.avatar.hidden=true;ui.badge.classList.remove('has-photo');}
    ui.detail.textContent=!p.participant&&!waiting?'Наблюдает':mode==='bowling'?frameText(p.frames):mode==='curling'?(p.team===0?'Коралловые':'Бирюзовые'):mode==='swarm_gate'?`${p.kills} целей${p.lockedUntil>s.t?' · перегрев':''}`:p.gunUntil>s.t?`${ru?'ПУЛЕМЁТ':'MACHINE GUN'} · ${Math.ceil(p.gunUntil-s.t)}\u00a0${seconds}`:p.charge?'ПУЛЕМЁТ ГОТОВ':`${p.streak}/6 · ${p.hits} попаданий`;
    ui.detail.toggleAttribute('data-no-translate',mode==='peek_shoot'&&p.gunUntil>s.t);
    const percent=mode==='swarm_gate'?p.heat*100:mode==='curling'?p.energy*100:p.gunUntil>s.t?(p.gunUntil-s.t)/8*100:p.charge?100:p.streak/6*100;
    ui.bar.style.width=Math.max(0,Math.min(100,percent))+'%';card.title=mode==='bowling'?frameText(p.frames):`${p.name}: ${p.score}`;card.setAttribute('aria-label',`${p.number}. ${p.name}: ${p.score}`);
  }
  for(const [id,card] of uiCards)if(!s.players.some(p=>p.id===id)){card.remove();uiCards.delete(id);}
  if(s.phase==='results'&&$('ss-results').dataset.id!==s.result.eventId){
    $('ss-results').dataset.id=s.result.eventId;$('ss-results').replaceChildren(...[...s.result.players].sort((a,b)=>b.score-a.score).map(p=>{const row=document.createElement('div');row.className='ss-result-row'+(p.won?' winner':'');row.append(text('b',(p.won?'★ ':'')+p.name),text('strong',String(p.score)));return row;}));
  }else if(waiting){$('ss-results').replaceChildren();$('ss-results').dataset.id='';}
  if(waiting&&pendingHostStart&&enoughPlayers&&!startSent)queueMicrotask(requestHostStart);
  for(const e of s.events){if(e.id<=lastEvent)continue;lastEvent=e.id;view?.effect(e,s);
    const feelType=e.kind==='shot'?(e.dead?'elimination':e.hit?'hit':'shot'):e.kind==='pulse'?'explosion':e.kind==='score'||e.kind==='roll'?'score':e.kind==='friendly'?'danger':e.kind==='finish'?'round-result':null;
    if(feelType){const fp=view?.feelPoint?.(e),feelX=fp?fp.x:mode==='swarm_gate'?.5+(e.x??0)/40:(e.x??.5),feelY=fp?fp.y:mode==='swarm_gate'?.25+((e.z??-14)+27)/27*.55:(e.y??.5);window.LocalPartyFeel?.emit(feelType,{id:`sports:${e.id}`,x:feelX,y:feelY,intensity:e.dead?.78:e.kind==='pulse'?.72:.42,shake:e.kind!=='score'&&e.kind!=='roll'&&!['swarm_gate','peek_shoot'].includes(mode)});}
    if(e.text&&e.kind!=='throw'&&e.kind!=='stone'&&e.kind!=='start'&&!(mode==='curling'&&e.kind==='end')){const el=$('ss-notice'),notice=hostNotice(e,s.players,window.PartyI18n?.language||'en');el.toggleAttribute('data-no-translate',notice.localized);el.textContent=notice.text;el.classList.add('show');noticeUntil=performance.now()+2200;}}
  paintScoreDrawer(s);view?.resize();
}
net.addEventListener('state',e=>{state=e.detail;paintUI(state);view?.setState(state);});
class Stage {
  constructor(){
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(mode==='bowling'?'#0e1420':mode==='curling'?'#102b35':mode==='peek_shoot'?'#222539':'#111b25');
    this.scene.fog=new THREE.Fog(this.scene.background,65,130);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,stencil:mode==='swarm_gate'||mode==='bowling',powerPreference:'high-performance'});
    const gl=this.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    const gpu=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'';
    this.software=/swiftshader|llvmpipe|softpipe|software/i.test(gpu);
    this.renderer.setPixelRatio(this.software?1:Math.min(devicePixelRatio||1,2));
    this.renderer.shadowMap.enabled=!this.software;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    document.body.dataset.renderQuality=this.software?'software-compatible':'full';
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=mode==='bowling'?1.34:mode==='curling'?1.28:1.18;
    $('ss-scene').append(this.renderer.domElement);
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{if(this.disposed)return;e.preventDefault();$('ss-error').hidden=false;$('ss-error').textContent='Графический контекст потерян. Перезагрузи экран ведущего — матч на сервере сохранится.';});
    this.camera=['bowling','curling'].includes(mode)?new THREE.PerspectiveCamera(mode==='bowling'?46:42,1,.1,180):new THREE.OrthographicCamera(-20,20,15,-15,.1,180);
    this.camera.position.set(...(mode==='bowling'?[0,5.3,17.5]:mode==='curling'?[0,3.6,22]:mode==='swarm_gate'?[0,30,22]:[0,0,35]));
    this.look=new THREE.Vector3(...(mode==='swarm_gate'?[0,0,-8]:mode==='peek_shoot'?[0,0,0]:[0,0,-2]));this.camera.lookAt(this.look);this.cameraBase=this.camera.position.clone();this.shakes=[];this.hitStop=null;
    this.scene.add(new THREE.HemisphereLight(mode==='bowling'?'#d9eaff':'#d9fbff',mode==='bowling'?'#2e1838':'#163540',2.35));
    const key=new THREE.DirectionalLight(mode==='bowling'?'#ffe2ba':'#e8fbff',4.1);key.position.set(-10,25,13);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
    Object.assign(key.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:.5,far:90});key.shadow.bias=-.00015;key.shadow.normalBias=.035;this.scene.add(key);key.target.position.set(0,0,-6);this.scene.add(key.target);
    const fill=new THREE.DirectionalLight(mode==='bowling'?'#a976ff':'#65e7f1',1.55);fill.position.set(14,12,-15);this.scene.add(fill);
    if(['bowling','curling'].includes(mode)){const rim=new THREE.PointLight(mode==='bowling'?'#c878ff':'#67f2ff',22,34,1.7);rim.position.set(0,7,-12);this.scene.add(rim);}
    this.materials=new Map();this.assetTextures=new Map();this.environmentModels=new Map();this.gltfLoader=new GLTFLoader();this.dynamic=new Map();this.crosshairs=new Map();this.turrets=new Map();this.popups=[];this.smoothBots=new Map();this.identityBubbles=[];
    this.unit=new THREE.Object3D();this.v=new THREE.Vector3();this.yAxis=new THREE.Vector3(0,1,0);this.clock=0;this.last=performance.now();this.cameraMode='wide';
    this.staticScene();this.makePools();this.resize();window.addEventListener('resize',()=>this.resize(true));document.fonts?.ready.then(()=>this.resize(true));
    this.loop=this.loop.bind(this);window.addEventListener('pagehide',e=>{if(!e.persisted)this.dispose();});
    // Compile in parallel before the first drawn frame. Synchronous first-use
    // shader linking otherwise freezes the TV shell while its doors are moving.
    document.body.dataset.shaderWarmup='pending';
    const warmup=this.renderer.compileAsync?.(this.scene,this.camera)||Promise.resolve();
    Promise.resolve(warmup).catch(error=>console.warn('Scene shader warmup:',error)).finally(()=>{
      if(this.disposed)return;document.body.dataset.shaderWarmup='ready';this.last=performance.now();this.raf=requestAnimationFrame(this.loop);
    });
  }
  mat(color,rough=.5,metal=.05,emission=0){const key=`${color}:${rough}:${metal}:${emission}`;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,emissive:color,emissiveIntensity:emission}));return this.materials.get(key);}
  assetTexture(name,options={}){
    if(this.assetTextures.has(name))return this.assetTextures.get(name);
    const root=options.root??'sprites',prefix=root?`${root}/`:'';
    const texture=new THREE.TextureLoader().load(`/assets/gameplay/sports-siege/${prefix}${name}.${options.ext||'webp'}`);
    texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
    if(options.repeat){texture.wrapS=texture.wrapT=THREE.MirroredRepeatWrapping;texture.repeat.set(...options.repeat);}
    this.assetTextures.set(name,texture);return texture;
  }
  localTexture(file,{repeat=null,root='environment'}={}){
    const key=`local:${root}:${file}:${repeat||''}`;if(this.assetTextures.has(key))return this.assetTextures.get(key);
    const texture=new THREE.TextureLoader().load(`./assets/${root}/${file}`);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
    if(repeat){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(...repeat);}this.assetTextures.set(key,texture);return texture;
  }
  assetSprite(name,width,height,options={}){
    const material=new THREE.SpriteMaterial({map:this.assetTexture(name),transparent:true,alphaTest:.035,depthTest:options.depthTest!==false,depthWrite:!!options.depthWrite,toneMapped:false,opacity:options.opacity??1});
    const sprite=new THREE.Sprite(material);sprite.scale.set(width,height,1);sprite.renderOrder=options.renderOrder||0;sprite.userData.assetSprite=true;return sprite;
  }
  projectileTrail(color){
    if(!this.projectileTrailTexture){const canvas=document.createElement('canvas');canvas.width=96;canvas.height=256;const c=canvas.getContext('2d'),gradient=c.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.12,'#fffffff0');gradient.addColorStop(.55,'#ffffff58');gradient.addColorStop(1,'#ffffff00');c.fillStyle=gradient;c.beginPath();c.moveTo(7,18);c.quadraticCurveTo(7,1,24,0);c.lineTo(72,0);c.quadraticCurveTo(89,1,89,18);c.quadraticCurveTo(72,124,48,252);c.quadraticCurveTo(24,124,7,18);c.fill();this.projectileTrailTexture=new THREE.CanvasTexture(canvas);this.projectileTrailTexture.colorSpace=THREE.SRGBColorSpace;}
    const material=new THREE.SpriteMaterial({map:this.projectileTrailTexture,color,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});const sprite=new THREE.Sprite(material);sprite.renderOrder=12;return sprite;
  }
  killHalo(color){
    if(!this.killHaloTexture){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d');c.translate(128,128);const glow=c.createRadialGradient(0,0,8,0,0,112);glow.addColorStop(0,'#ffffffff');glow.addColorStop(.18,'#ffffffd8');glow.addColorStop(.42,'#ffffff42');glow.addColorStop(1,'#ffffff00');c.fillStyle=glow;c.beginPath();c.arc(0,0,112,0,Math.PI*2);c.fill();c.strokeStyle='#ffffffff';c.lineWidth=9;c.beginPath();c.arc(0,0,54,0,Math.PI*2);c.stroke();c.lineCap='round';for(let i=0;i<12;i++){const a=i*Math.PI/6,inner=i%2?70:63,outer=i%2?91:108;c.lineWidth=i%2?5:8;c.beginPath();c.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);c.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);c.stroke();}this.killHaloTexture=new THREE.CanvasTexture(canvas);this.killHaloTexture.colorSpace=THREE.SRGBColorSpace;}
    const material=new THREE.SpriteMaterial({map:this.killHaloTexture,color,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});const sprite=new THREE.Sprite(material);sprite.renderOrder=15;return sprite;
  }
  killClouds(origin,seed,delay){
    if(!this.cloudTexture){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');for(const [x,y,r]of [[64,62,49],[36,68,29],[86,48,31],[82,83,27]]){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.55,'#ffffffb0');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);}this.cloudTexture=new THREE.CanvasTexture(c);}
    const up=new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion),right=new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion);
    for(let i=0;i<5;i++){const material=new THREE.SpriteMaterial({map:this.cloudTexture,color:i%2?'#be9291':'#ddb9a0',transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false});const sprite=new THREE.Sprite(material);sprite.renderOrder=17;sprite.visible=false;this.scene.add(sprite);this.effects.push({kind:'kill-cloud',pulseSprite:sprite,color:'#ddb9a0',origin:origin.clone(),up,right,angle:i*Math.PI*.4+seededUnit(seed)*2,radius:.3,size:1.2+seededUnit(seed+i)*.6,born:this.clock+delay,life:.72});}
  }
  scorePopup(origin,points,color,delay){
    const el=document.createElement('span');el.setAttribute('aria-hidden','true');el.dataset.ssScorePopup='';el.textContent='+'+points;const tier=mode==='swarm_gate'?(points>=100?1.35:points>=25?1.15:1):(points>=3?1.35:points>=2?1.15:1);el.style.cssText=`position:absolute;z-index:2;pointer-events:none;transform:translate(-50%,-50%);font-family:var(--hp-font-action,HeyPalsDisplay),sans-serif;font-style:italic;font-weight:900;font-size:${Math.round((mode==='swarm_gate'?22:24)*tier*clamp(innerWidth/1280,.8,1.5))}px;line-height:1;color:#ffe789;text-shadow:0 2px 3px #171223,0 0 5px #171223,0 0 14px ${color};-webkit-text-stroke:.5px #302335;will-change:transform,opacity;`;el.hidden=true;$('ss-scene').append(el);this.popups.push({el,origin:origin.clone(),born:this.clock+delay,life:.88});if(this.popups.length>32)this.popups.shift().el.remove();
  }
  mesh(geo,mat,x=0,y=0,z=0,parent=this.scene){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  box(w,h,d,color,x=0,y=0,z=0,parent=this.scene){return this.mesh(new THREE.BoxGeometry(w,h,d),this.mat(color),x,y,z,parent);}
  sphere(r,color,x=0,y=0,z=0,parent=this.scene){return this.mesh(new THREE.SphereGeometry(r,18,12),this.mat(color),x,y,z,parent);}
  cylinder(r,h,color,x,y,z,parent=this.scene){return this.mesh(new THREE.CylinderGeometry(r,r,h,28),this.mat(color),x,y,z,parent);}
  glowBox(w,h,d,color,x,y,z){return this.mesh(new THREE.BoxGeometry(w,h,d),this.mat(color,.4,.1,1.2),x,y,z);}
  label(value,color='#ffffff',size=1){
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;const c=canvas.getContext('2d');
    c.fillStyle='#0b1420';c.beginPath();c.roundRect(5,7,118,50,18);c.fill();c.strokeStyle=color;c.lineWidth=3;c.stroke();c.fillStyle=color;c.font='bold 34px HeyPalsText,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(value,64,34);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false}));sprite.scale.set(size*2,size,1);return sprite;
  }
  playerBubble(p,size=.55){
    // Colour/number markers connect the field to readable, literal rail names.
    // Names cannot be read in the old four-pixel crosshair texture.
    const canvas=document.createElement('canvas');canvas.width=96;canvas.height=64;const c=canvas.getContext('2d');
    c.fillStyle='#171223f2';c.beginPath();c.roundRect(3,3,90,58,22);c.fill();c.strokeStyle=p.color;c.lineWidth=4;c.stroke();
    c.fillStyle='#fff';c.font='italic 900 38px KardiaFatRunner, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(String(p.number),48,33);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,depthWrite:false,toneMapped:false}));
    const height=this.camera.isOrthographicCamera?24*clamp(innerWidth/1280,.55,1.5)*(this.camera.top-this.camera.bottom)/Math.max(1,this.renderer.domElement.clientHeight):size;
    sprite.scale.set(height*1.5,height,1);sprite.renderOrder=16;this.identityBubbles.push(sprite);return sprite;
  }
  environmentModel(file,{position=[0,0,0],rotation=[0,0,0],scale=1,tint=null,hideMaterials=[],omitRegions=[]}={}){
    let source=this.environmentModels.get(file);
    if(!source){source=new Promise((resolve,reject)=>this.gltfLoader.load(file,gltf=>resolve(gltf.scene),undefined,reject));this.environmentModels.set(file,source);}
    source.then(template=>{const model=template.clone(true);model.position.set(...position);model.rotation.set(...rotation);model.scale.setScalar(scale);model.traverse(child=>{if(!child.isMesh)return;const materialName=child.material?.name?.toLowerCase()||'';if(hideMaterials.some(name=>materialName.includes(name.toLowerCase()))){child.visible=false;return;}
      const regions=omitRegions.filter(region=>materialName.includes(region.material.toLowerCase()));if(regions.length&&child.geometry){child.geometry=child.geometry.clone();const position=child.geometry.getAttribute('position'),sourceIndex=child.geometry.index?Array.from(child.geometry.index.array):Array.from({length:position.count},(_,i)=>i),kept=[];for(let i=0;i<sourceIndex.length;i+=3){const ids=sourceIndex.slice(i,i+3),center=[0,0,0];for(const id of ids){center[0]+=position.getX(id)/3;center[1]+=position.getY(id)/3;center[2]+=position.getZ(id)/3;}if(!regions.some(region=>center.every((value,axis)=>value>=region.min[axis]&&value<=region.max[axis])))kept.push(...ids);}child.geometry.setIndex(kept);child.geometry.computeBoundingSphere();}
      child.castShadow=false;child.receiveShadow=true;if(child.material){child.material=child.material.clone();child.material.roughness=.72;child.material.metalness=Math.min(.12,child.material.metalness??0);if(child.material.color){if(tint)child.material.color.lerp(new THREE.Color(tint),.28);child.material.color.offsetHSL(0,.08,.025);child.material.emissive=child.material.color.clone().multiplyScalar(.045);child.material.emissiveIntensity=.5;}}});this.scene.add(model);}).catch(error=>console.warn('Environment asset failed',file,error));
  }
  staticScene(){
    if(mode==='bowling'){
      // Alley, lights, camera, pinsetter, ball return and feedback live in scene-bowling.js.
      this.bowling=createBowlingScene(this);
    }else if(mode==='curling'){
      // Club, sheet, stones, cameras and feedback live in scene-curling.js.
      this.curling=new CurlingScene(this,THREE,{reduced});
    }else if(mode==='swarm_gate'){
      // One authored courtyard fills the viewport; no repeated/mirrored tile grid.
      this.courtyard=this.turretPartTexture('courtyard.png');
      this.scene.background=this.courtyard;
      this.wallGroup=new THREE.Group();this.scene.add(this.wallGroup);
      for(const x of [-26.7375,26.7375]){
        const wall=new THREE.Sprite(new THREE.SpriteMaterial({map:this.turretPartTexture('wall.png'),transparent:true,alphaTest:.035,depthWrite:true,toneMapped:false}));
        const width=44.475*1374/1340;wall.scale.set(width,width*1145/1374,1);
        wall.center.set(.5,1-679/1145);wall.position.set(x,-.30,0);this.wallGroup.add(wall);
      }
      this.gateGroup=new THREE.Group();this.scene.add(this.gateGroup);
      this.gateSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:this.gateStateTexture('gate-closed'),transparent:true,alphaTest:.035,depthWrite:true,toneMapped:false}));this.gateSprite.scale.set(10.5/.92,10.5/.92,1);this.gateSprite.center.set(.5,.14);this.gateSprite.position.set(0,-.30,.12);this.gateGroup.add(this.gateSprite);
      for(const [x,width] of [[-26.7375,46],[26.7375,46],[0,12]]){const shadow=this.turretContactShadow();shadow.scale.set(width,2.8,1);shadow.position.set(x,-.48,.2);shadow.renderOrder=-1;this.scene.add(shadow);}
      this.repairSprite=this.assetSprite('wall-repair',3.8,3.8*327/316,{depthTest:false,renderOrder:8});this.repairSprite.position.set(0,2.7,.35);this.repairSprite.visible=false;this.scene.add(this.repairSprite);
      for(const part of [...this.wallGroup.children,this.gateSprite])Object.assign(part.material,{stencilWrite:true,stencilRef:1,stencilFunc:THREE.AlwaysStencilFunc,stencilZPass:THREE.ReplaceStencilOp});
      for(const kind of ['termite','runner','tank','boss'])for(let frame=0;frame<8;frame++)this.assetTexture(`swarm-death-${kind}-${frame}`);
      this.makeBots();
      // Claude swarm agent: 3D turrets, framing, shot/kill/gate juice and ambience live in swarm-*.js (render-only).
      import('./swarm-fx.js').then(m=>{this.swarmFX=new m.SwarmFX(this,THREE,{reduced});}).catch(error=>console.warn('Swarm FX unavailable',error));
    }else{
      this.scene.fog=null;for(let frame=0;frame<8;frame++)this.assetTexture(`gallery-death-${frame}`);
      // Flat orthographic meadow: decoration fills the viewport while cover/target coordinates remain exact.
      const meadow=new THREE.TextureLoader().load('/assets/gameplay/sports-siege/gallery-meadow-flat-v3.webp');meadow.colorSpace=THREE.SRGBColorSpace;
      this.scene.background=meadow;this.galleryLayers=[];
      for(let row=0;row<3;row++)for(let col=0;col<5;col++){
        const x=.025+col*.195+(row%2)*.012,y=.27+row*.225,w=.155,h=.1,depth=row+1,kind=(row+col)%4;
        const wx=(x+w/2-.5)*32,wy=(.5-y-h/2)*20,z=depth*2;
        const cover=new THREE.Sprite(new THREE.SpriteMaterial({map:this.localTexture('cover-'+['wood','stone','metal','hazard'][kind]+'-v3.webp',{root:'covers-flat-v3'}),transparent:true,alphaTest:.035,depthWrite:true,toneMapped:false}));cover.scale.set(w*32,h*20,1);cover.userData.assetSprite=true;cover.position.set(wx,wy,z);this.scene.add(cover);
      }
    }
  }
  makePools(){
    this.particles=new THREE.InstancedMesh(new THREE.TetrahedronGeometry(1,0),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false,transparent:true,opacity:.82,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}),360);this.particles.count=0;this.particles.renderOrder=16;this.particles.frustumCulled=false;this.scene.add(this.particles);
    this.effects=[];
  }
  makeBots(){
    const geometry=new THREE.PlaneGeometry(1,1),names={termite:'swarm-termite',runner:'swarm-runner',tank:'swarm-tank',boss:'swarm-boss'};this.botSprites={};this.botGhosts={};
    for(const [kind,name] of Object.entries(names)){
      const material=new THREE.MeshBasicMaterial({map:this.assetTexture(name),transparent:true,alphaTest:.035,depthWrite:true,toneMapped:false,side:THREE.DoubleSide});
      const mesh=new THREE.InstancedMesh(geometry,material,300);mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.renderOrder=2;this.botSprites[kind]=mesh;this.scene.add(mesh);
      const ghostMaterial=new THREE.MeshBasicMaterial({map:material.map,color:'#b4d9ff',transparent:true,opacity:.44,alphaTest:.08,depthTest:true,depthFunc:THREE.GreaterDepth,depthWrite:false,toneMapped:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,stencilWrite:true,stencilRef:1,stencilFunc:THREE.EqualStencilFunc});
      ghostMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n diffuseColor.rgb=vec3(0.60,0.79,1.0);diffuseColor.a*=0.85+0.15*sin(gl_FragCoord.y*1.2);');};
      const ghost=new THREE.InstancedMesh(geometry,ghostMaterial,300);ghost.instanceMatrix=mesh.instanceMatrix;ghost.count=0;ghost.frustumCulled=false;ghost.renderOrder=10;this.botGhosts[kind]=ghost;this.scene.add(ghost);
    }
  }
  stone(team){const g=new THREE.Group();this.cylinder(.43,.28,'#94aaa9',0,.19,0,g);this.cylinder(.35,.045,team?'#66d8df':'#ef9384',0,.35,0,g);
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.22,.36,0),new THREE.Vector3(-.19,.60,0),new THREE.Vector3(.19,.60,0),new THREE.Vector3(.22,.36,0)]);
    this.mesh(new THREE.TubeGeometry(curve,14,.06,8,false),this.mat(team?'#45c6d9':'#e97778',.3),0,0,0,g);return g;}
  goof(t){
    const regular=['target-chicken','target-bug','target-beetle','target-boss','target-chicken'];
    const name=t.kind==='friendly'?'target-friendly':t.kind==='gold'?'target-bonus':regular[t.style%regular.length];
    const key=name.replace('target-',''),ratios={bug:694/904,beetle:650/895,boss:689/969,chicken:632/1072,bonus:898/876,friendly:884/981},height=t.kind==='friendly'?3.15:t.style===3?3.1:2.65;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:this.localTexture('target-'+key+'-v2.webp',{root:'targets-flat-v2'}),transparent:true,alphaTest:.035,depthWrite:true,toneMapped:false}));sprite.scale.set(height*(ratios[key]||1),height,1);sprite.center.set(.5,.64);sprite.userData.assetSprite=true;return sprite;
  }
  crosshair(p){
    const g=new THREE.Group(),reticle=new THREE.Sprite(new THREE.SpriteMaterial({map:this.localTexture('gallery/crosshair-mask.png'),color:p.color,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));reticle.scale.set(.9,.9,1);reticle.renderOrder=15;g.add(reticle);
    const bubble=this.playerBubble(p,.44);bubble.position.set(.85,mode==='swarm_gate'?1.15:.8,.05);g.add(bubble);g.renderOrder=9;this.scene.add(g);return g;
  }
  flatAsset(file,width,height,{depthTest=true,depthWrite=false,renderOrder=0,root='swarm-v3'}={}){
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:this.localTexture(file,{root}),transparent:true,alphaTest:.035,depthTest,depthWrite,toneMapped:false}));sprite.scale.set(width,height,1);sprite.renderOrder=renderOrder;sprite.userData.assetSprite=true;return sprite;
  }
  turretContactShadow(){
    if(!this.turretShadowTexture){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=48;const c=canvas.getContext('2d');c.translate(64,24);c.scale(64,24);const shade=c.createRadialGradient(0,0,.08,0,0,1);shade.addColorStop(0,'#15132664');shade.addColorStop(.45,'#1513263a');shade.addColorStop(1,'#15132600');c.fillStyle=shade;c.fillRect(-1,-1,2,2);this.turretShadowTexture=new THREE.CanvasTexture(canvas);}
    const shadow=new THREE.Sprite(new THREE.SpriteMaterial({map:this.turretShadowTexture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));shadow.scale.set(2.3,.62,1);shadow.renderOrder=19;return shadow;
  }
  gateStateTexture(name){
    this.gateTextures||={};if(this.gateTextures[name])return this.gateTextures[name];
    const texture=this.turretPartTexture('gates.png').clone();texture.needsUpdate=true;texture.repeat.set(1/3,1);texture.offset.set(['gate-closed','gate-damaged','gate-open'].indexOf(name)/3,0);this.gateTextures[name]=texture;return texture;
  }
  turretPartTexture(file){
    const key='turret-v6:'+file;if(this.assetTextures.has(key))return this.assetTextures.get(key);
    const texture=new THREE.TextureLoader().load('/assets/gameplay/sports-siege/turrets-v6/'+file);
    texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;this.assetTextures.set(key,texture);return texture;
  }
  turret(p){const g=new THREE.Group(),pivot=new THREE.Vector3(0,.68,0);
    const [variant,art]=turretArt[(p.number-1)%turretArt.length],color=p.color||art.color;
    const up=new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion);
    const floorShadow=this.turretContactShadow();floorShadow.scale.set(3.7,.86,1);floorShadow.position.copy(pivot).addScaledVector(up,-.22);g.add(floorShadow);
    // Native generated alpha is retained. The circular plate stays stationary;
    // only the connected housing/barrel rotates, using the same real muzzle ray.
    const plate=new THREE.Sprite(new THREE.SpriteMaterial({map:this.turretPartTexture('pedestal.png'),color:new THREE.Color(color).multiplyScalar(.8),transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));
    const plateScale=3.472*1254/1126;plate.scale.set(plateScale,plateScale,1);plate.center.set(.5,.5);plate.position.copy(pivot);plate.renderOrder=21;g.add(plate);
    const head=new THREE.Sprite(new THREE.SpriteMaterial({map:this.turretPartTexture('cannon.png'),color,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));
    const muzzleReach=5.88*(285-37)/420,headScale=muzzleReach*1254/(882-137);head.scale.set(headScale,headScale,1);head.center.set(627/1254,1-882/1254);head.position.copy(pivot);head.renderOrder=22;head.userData.muzzleReach=muzzleReach;head.userData.variant=variant;g.add(head);
    const number=this.playerBubble(p,.62);number.position.copy(pivot).addScaledVector(up,-2.02);number.renderOrder=23;g.add(number);
    // Keep turret pixels behind opaque wall/gate silhouettes already in the stencil.
    for(const part of [floorShadow,plate,head])Object.assign(part.material,{stencilWrite:true,stencilRef:1,stencilFunc:THREE.NotEqualStencilFunc});
    g.userData.head=head;g.userData.base=plate;g.userData.bubble=number;g.userData.pivot=pivot.clone();this.scene.add(g);return g;}
  turretMuzzle(turret){
    const fxMuzzle=this.swarmFX?.muzzle(turret);if(fxMuzzle)return fxMuzzle;
    const head=turret?.userData.head;if(!head)return null;
    const origin=new THREE.Vector3();head.getWorldPosition(origin);
    const angle=head.material.rotation||0,up=new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion),right=new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion);
    return origin.addScaledVector(up,Math.cos(angle)*head.userData.muzzleReach).addScaledVector(right,-Math.sin(angle)*head.userData.muzzleReach);
  }
  // TV-only field feedback for the shooters: camera kicks (orthographic pan, decaying) and a
  // short hit-stop that freezes the visual clock. The server simulation never pauses.
  kick(amp,dur,at){if(reduced||!['swarm_gate','peek_shoot'].includes(mode))return;this.shakes.push({amp,dur,at,seed:Math.random()*9});if(this.shakes.length>6)this.shakes.shift();}
  freeze(seconds,at){if(reduced)return;if(this.hitStop&&at-this.hitStop.at<350)return;this.hitStop={at,until:at+seconds*1000};}
  applyShake(now){
    if(!this.shakes.length)return;let x=0,y=0;this.shakes=this.shakes.filter(k=>now<k.at+k.dur*1000);
    for(const k of this.shakes){const u=(now-k.at)/(k.dur*1000);if(u<0)continue;const a=k.amp*Math.pow(1-u,2),w=(now-k.at)/1000*38+k.seed;x+=Math.sin(w*1.9)*a;y+=Math.sin(w*2.6+1.3)*a*.8;}
    this.camera.position.copy(this.cameraBase);if(mode==='swarm_gate'){this.camera.position.x+=x;this.camera.position.z+=y;}else{this.camera.position.x+=x;this.camera.position.y+=y;}
  }
  // Shared feel bursts land on the field point of the event (page pixels), not on a
  // fraction of the whole TV page, so they never pop outside the arena.
  feelPoint(e){
    if(!['swarm_gate','peek_shoot'].includes(mode)||e.x==null)return null;
    const p=mode==='peek_shoot'?new THREE.Vector3((e.x-.5)*32,(.5-(e.y??.5))*20,10):new THREE.Vector3(e.x,.68,e.z??-14);p.project(this.camera);
    const r=this.renderer.domElement.getBoundingClientRect();return {x:Math.max(2,r.left+(p.x*.5+.5)*r.width),y:Math.max(2,r.top+(-p.y*.5+.5)*r.height)};
  }
  setState(s){this.state=s;}
  getObject(key,create){let obj=this.dynamic.get(key);if(!obj){obj=create();this.dynamic.set(key,obj);this.scene.add(obj);obj.userData.fresh=true;}obj.userData.used=true;return obj;}
  place(obj,x,y,z,q,alpha=1){
    if(obj.userData.fresh){alpha=1;obj.userData.fresh=false;}
    obj.position.lerp(this.v.set(x,y,z),alpha);
    if(q){this.q||=new THREE.Quaternion();this.q.set(...q);obj.quaternion.slerp(this.q,alpha);}
  }
  moveCamera(position,target,dt,speed=3){const a=reduced?1:1-Math.exp(-dt*speed);this.camera.position.lerp(position,a);this.look.lerp(target,a);this.camera.lookAt(this.look);}
  updateObjects(s,dt){
    if(s.stage==='rolling'&&this.previousStage!=='rolling')this.rollingStartedAt=s.t;
    this.previousStage=s.stage;
    const a=1-Math.exp(-dt*20);for(const obj of this.dynamic.values())obj.userData.used=false;
    if(mode==='bowling'){
      this.bowling.update(s,dt);
    }else if(mode==='curling'){
      this.curling.update(s,dt);
    }else if(mode==='swarm_gate'){
      for(const p of s.players.filter(p=>p.participant||s.phase==='waiting')){let turret=this.turrets.get(p.id);if(!turret){turret=this.turret(p);this.turrets.set(p.id,turret);}turret.position.x=p.turretX||0;turret.position.z=(p.turretZ??-9.5)-turret.userData.pivot.z;turret.updateMatrixWorld(true);const target=new THREE.Vector3((p.aim.x-.5)*36,.68,-27+p.aim.y*26),pivot=new THREE.Vector3();turret.userData.head.getWorldPosition(pivot);const pivotScreen=pivot.clone().project(this.camera),targetScreen=target.clone().project(this.camera);turret.userData.head.material.rotation=-Math.atan2((targetScreen.x-pivotScreen.x)*this.renderer.domElement.clientWidth,(targetScreen.y-pivotScreen.y)*this.renderer.domElement.clientHeight);}
      this.updateBots(s.enemies,dt,s.t);
      const chewing=s.enemies.some(b=>b.z>=-1);this.gateGroup.position.x=chewing&&!reduced?Math.sin(this.clock*43)*.018:0;
      this.gateGroup.rotation.z=s.gate<=0?-.18:0;
      const gateName=s.gate<=0?'gate-open':s.gate<(s.maxGate||1000)*.55?'gate-damaged':'gate-closed';if(this.gateSprite.userData.assetName!==gateName){this.gateSprite.userData.assetName=gateName;this.gateSprite.material.map=this.gateStateTexture(gateName);this.gateSprite.material.needsUpdate=true;}
      this.repairSprite.visible=s.stage==='break';if(this.repairSprite.visible)this.repairSprite.material.opacity=.72+Math.sin(this.clock*7)*.20;
      this.swarmFX?.update(s,dt);
    }else{
      for(const [index,layer] of (this.galleryLayers||[]).entries()){const orbit=reduced?0:this.clock*.18+index;layer.position.x=layer.userData.baseX+Math.sin(orbit)*.65;layer.position.y=layer.userData.baseY+Math.cos(orbit)*.22;layer.material.rotation=reduced?0:Math.sin(orbit)*.025;}
      for(const t of s.targets||[]){if(t.rise<.02)continue;const obj=this.getObject('target'+t.id,()=>this.goof(t));
        // Don't interpolate exposure: visuals and authoritative cover hitboxes agree.
        this.place(obj,(t.x-.5)*32,(.5-t.y)*20,(Math.ceil(t.depth))*2-.65,null,1);obj.material.rotation=Math.sin(this.clock*3+t.seed)*.025;}
    }
    for(const [key,obj]of this.dynamic)if(!obj.userData.used&&!(obj.userData.holdUntil>this.clock)){this.scene.remove(obj);obj.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.userData.assetSprite)n.material.dispose();});this.dynamic.delete(key);}
    if(mode==='swarm_gate'||mode==='peek_shoot')for(const p of s.players.filter(p=>p.connected&&p.participant)){
      let cross=this.crosshairs.get(p.id);if(!cross){cross=this.crosshair(p);this.crosshairs.set(p.id,cross);}
      this.place(cross,mode==='peek_shoot'?(p.aim.x-.5)*32:(p.aim.x-.5)*36,mode==='peek_shoot'?(.5-p.aim.y)*20:.18,mode==='peek_shoot'?10:-27+p.aim.y*26,null,a);
    }
    for(const [id,cross]of this.crosshairs)cross.visible=!!s.players.find(p=>p.id===id&&p.connected&&p.participant);
  }
  instance(mesh,i,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){this.unit.position.set(x,y,z);this.unit.rotation.set(rx,ry,rz);this.unit.scale.set(sx,sy,sz);this.unit.updateMatrix();mesh.setMatrixAt(i,this.unit.matrix);}
  updateBots(bots,dt,serverTime){
    const n=Math.min(300,bots.length),counts={termite:0,runner:0,tank:0,boss:0},used=new Set(),sizes={termite:[3.5,4.2],runner:[4,4],tank:[3.8,4],boss:[3.5,4.3]};
    for(let i=0;i<n;i++){
      const b=bots[i];used.add(b.id);let p=this.smoothBots.get(b.id);if(!p){p={x:b.x,z:b.z};this.smoothBots.set(b.id,p);}p.x+=(b.x-p.x)*(1-Math.exp(-dt*22));p.z+=(b.z-p.z)*(1-Math.exp(-dt*22));
      const r=b.r,y=r*.55+Math.sin(this.clock*(b.kind==='runner'?19:12)+b.seed)*.035,angle=Math.atan2(b.targetX-p.x,-.85-p.z),mesh=this.botSprites[b.kind],index=counts[b.kind]++,size=sizes[b.kind];
      const hitAge=serverTime-(b.hitAt??-100),hit=hitAge>=0&&hitAge<.22?1-hitAge/.22:0;mesh.setColorAt(index,new THREE.Color().setRGB(1,1-hit*.8,1-hit*.8));
      this.unit.position.set(p.x,y+Math.sin(hit*Math.PI)*.3,p.z);this.unit.quaternion.copy(this.camera.quaternion);this.unit.rotateZ(angle);this.unit.scale.set(r*size[0],r*size[1],1);this.unit.updateMatrix();mesh.setMatrixAt(index,this.unit.matrix);
    }
    for(const id of this.smoothBots.keys())if(!used.has(id))this.smoothBots.delete(id);
    for(const [kind,mesh] of Object.entries(this.botSprites)){mesh.count=counts[kind];this.botGhosts[kind].count=counts[kind];mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
  }
  effect(e,s){
    if(mode==='curling'){this.curling?.effect(e,s);return;}
    this.swarmFX?.effect(e,s);
    if(e.kind==='shot'){
      const p=s.players.find(p=>p.id===e.player);if(!p)return;
      const to=mode==='peek_shoot'?new THREE.Vector3((e.x-.5)*32,(.5-e.y)*20,10):new THREE.Vector3(e.x,.68,e.z);
      const from=mode==='peek_shoot'?new THREE.Vector3((p.number/(s.players.length+1)-.5)*25,-11,10):(this.turretMuzzle(this.turrets.get(p.id))||new THREE.Vector3(e.ox,.68,e.oz));
      const projectileName=mode==='peek_shoot'?(p.number%2?'shot-gold':'shot-violet'):(p.number%2?'turret-shell':'turret-bolt');
      const projectile=this.assetSprite(projectileName,mode==='peek_shoot'?1.65:.42,mode==='peek_shoot'?2.3:.70,{depthTest:false,renderOrder:25});projectile.position.copy(from);
      const fromScreen=from.clone().project(this.camera),toScreen=to.clone().project(this.camera),screenAngle=-Math.atan2((toScreen.x-fromScreen.x)*this.renderer.domElement.clientWidth,(toScreen.y-fromScreen.y)*this.renderer.domElement.clientHeight);projectile.material.rotation=screenAngle;this.scene.add(projectile);
      const color=e.hit?(e.good===false?'#ff5e7a':'#ffe568'):p.color,trail=this.projectileTrail(color);trail.position.copy(from);trail.center.set(.5,1);trail.material.rotation=projectile.material.rotation;trail.visible=false;this.scene.add(trail);
      const muzzle=this.assetSprite('muzzle-a',mode==='swarm_gate'?1.1:2.3,mode==='swarm_gate'?1.45:3.05,{depthTest:false,renderOrder:26});muzzle.center.set(.451,.464);muzzle.position.copy(from);muzzle.material.rotation=screenAngle;this.scene.add(muzzle);
      const flightDuration=e.source==='pulse'?0:mode==='peek_shoot'?.16:clamp(from.distanceTo(to)/100,.055,.18);
      const deathAt=e.deathPosition,deathOrigin=deathAt?(mode==='peek_shoot'?new THREE.Vector3((deathAt.x-.5)*32,(.5-deathAt.y)*20,10):new THREE.Vector3(deathAt.x,.68,deathAt.z)):to.clone();
      let heldTarget=mode==='peek_shoot'&&e.dead?this.dynamic.get('target'+e.targetId):null;
      if(mode==='peek_shoot'&&e.dead&&!heldTarget&&e.targetSnapshot){const t=e.targetSnapshot;heldTarget=this.getObject('target'+e.targetId,()=>this.goof(t));heldTarget.position.set((t.x-.5)*32,(.5-t.y)*20,Math.ceil(t.depth)*2-.65);}
      if(heldTarget){heldTarget.userData.holdUntil=this.clock+flightDuration;const ghost=heldTarget.clone();ghost.material=heldTarget.material.clone();ghost.material.color.set('#ff817c');ghost.material.depthTest=false;ghost.renderOrder=13;ghost.visible=false;this.scene.add(ghost);this.effects.push({kind:'death-pop',pulseSprite:ghost,baseScale:ghost.scale.clone(),born:this.clock+flightDuration,life:.28,size:ghost.scale.x,color:'#ff817c'});}
      const impactPrefix=mode==='swarm_gate'&&e.dead?`swarm-death-${e.targetKind||'termite'}`:mode==='peek_shoot'&&e.hit?'gallery-death':e.hit?'hit':'miss';
      const impactFrames=impactPrefix.startsWith('swarm-death-')||impactPrefix==='gallery-death'?8:2,impactBase=mode==='swarm_gate'?[3.5,3.5]:mode==='peek_shoot'&&e.dead?[7.2,7.2]:[3,4],impact=this.assetSprite(`${impactPrefix}-${impactFrames===8?'0':'a'}`,...impactBase,{depthTest:false,renderOrder:14});impact.position.copy(e.dead?deathOrigin:to);impact.visible=false;
      const seed=Number(e.id||0)+to.x*17.17+to.y*7.31+to.z*23.03,kindScale=mode==='swarm_gate'?({termite:.82,runner:.9,tank:1.08,boss:1.22}[e.targetKind]||.9):e.targetKind==='gold'?1.08:e.targetKind==='friendly'?.94:1;
      impact.material.rotation=clamp((seededUnit(seed+1)-.5)*.86,-.4,.4);this.scene.add(impact);const halo=mode==='peek_shoot'&&e.dead?this.killHalo(e.good===false?'#ff496c':e.targetKind==='gold'?'#fff27a':'#ffb13b'):null;if(halo){halo.position.copy(to);halo.visible=false;this.scene.add(halo);}
      this.effects.push({kind:'beam',eventId:e.id,seed,from,to,color,born:this.clock,life:flightDuration+(e.dead?.66:.44),flightDuration,pulseKill:e.source==='pulse',hit:e.hit,dead:e.dead,good:e.good,projectile,trail,muzzle,impact,halo,impactPrefix,impactFrames,impactBase,deathOrigin,impactScale:clamp(kindScale*(.78+seededUnit(seed)*.48),.65,1.5)});
      if(mode==='swarm_gate'&&e.dead){
        const kind=e.targetKind||'termite',size={termite:1.5,runner:1.3,tank:2.5,boss:4.2}[kind]||1.5;
        const ghost=this.assetSprite('swarm-'+kind,size,size,{depthTest:false,renderOrder:13});ghost.position.copy(deathOrigin);ghost.material.color.set('#ff8074');this.scene.add(ghost);
        this.effects.push({kind:'death-pop',pulseSprite:ghost,born:this.clock+flightDuration,life:.32,size,color:'#ff8074'});
        const mark=this.killHalo('#24202b');mark.position.copy(deathOrigin);mark.material.opacity=.45;mark.material.rotation=seededUnit(seed+9)*Math.PI*2;this.scene.add(mark);
        this.effects.push({kind:'scorch',pulseSprite:mark,color:'#24202b',born:this.clock+flightDuration+.28,life:2.1+seededUnit(seed+6)*1.8,size:1.4+seededUnit(seed+7)*1.4});
      }
      if(e.dead){this.killClouds(deathOrigin,e.id,flightDuration);if(e.awardedScore>0)this.scorePopup(deathOrigin,e.awardedScore,p.color,flightDuration);
        // Tiered kill juice, landing with the projectile: big targets get a short hit-stop and a
        // stronger camera kick; ordinary kills a light kick. Rate-limited so a busy wave stays readable.
        const big=mode==='swarm_gate'?['tank','boss'].includes(e.targetKind):e.targetKind==='gold'||e.good===false,at=performance.now()+flightDuration*1000;
        this.kick(big?.32:.13,big?.3:.18,at);if(big||mode==='peek_shoot')this.freeze(big?.085:.05,at);
        if(mode==='swarm_gate'&&big){const ring=this.killHalo(e.targetKind==='boss'?'#ffd36b':'#ffae51');ring.position.copy(deathOrigin);ring.visible=false;this.scene.add(ring);this.effects.push({kind:'shock',pulseSprite:ring,color:'#ffae51',born:this.clock+flightDuration,life:.42,size:e.targetKind==='boss'?9:6});}}
    }else if(e.kind==='pulse'){
      this.kick(.22,.26,performance.now());const pulseSprite=this.assetSprite('turret-selection',1,1,{depthTest:false,renderOrder:11});pulseSprite.position.set(e.x,.25,e.z);pulseSprite.material.color.set('#b9ff67');pulseSprite.visible=false;this.scene.add(pulseSprite);this.effects.push({kind:'pulse',pulseSprite,color:'#b9ff67',born:this.clock,life:.78});
    }
    else if((e.kind==='roll'||e.kind==='throw')&&this.bowling)this.bowling.event(e,s);
    if(this.effects.length>120){const removed=this.effects.splice(0,this.effects.length-120);for(const old of removed)for(const sprite of [old.projectile,old.trail,old.muzzle,old.impact,old.halo,old.pulseSprite])if(sprite){this.scene.remove(sprite);sprite.material.dispose();}}
  }
  updateEffects(){
    const alive=[];for(const e of this.effects){if(this.clock-e.born<e.life)alive.push(e);else for(const sprite of [e.projectile,e.trail,e.muzzle,e.impact,e.halo,e.pulseSprite])if(sprite){this.scene.remove(sprite);sprite.material.dispose();}}this.effects=alive;let particles=0;
    for(const e of this.effects){const age=(this.clock-e.born)/e.life,color=new THREE.Color(e.color);
      if(e.kind==='beam'){
        const gallery=mode==='peek_shoot',direction=e.to.clone().sub(e.from),length=direction.length(),flightEnd=e.flightDuration/e.life,travel=flightEnd?Math.min(1,age/flightEnd):1,settle=Math.max(0,(age-flightEnd)/(1-flightEnd)),projectileFade=travel<.82?1:Math.max(0,(1-travel)/.18);direction.normalize();
        e.projectile.position.copy(e.from).lerp(e.to,travel);e.projectile.visible=!e.pulseKill&&projectileFade>.01;e.projectile.material.opacity=projectileFade;e.projectile.scale.set(gallery?1.65:.42,gallery?2.3:.70,1).multiplyScalar(.72+.28*Math.sin(Math.min(1,travel*4)*Math.PI/2));
        const grown=Math.min(gallery?.82:.95,length*travel),trailLength=grown*Math.max(.04,1-settle),trailWidth=gallery?.45:.12;e.trail.visible=!e.pulseKill&&travel>.05&&settle<.95;e.trail.position.copy(travel<1?e.projectile.position:e.to);e.trail.scale.set(trailWidth,trailLength,1);e.trail.material.opacity=(gallery?.46:.44)*Math.pow(1-settle,1.55);
        const muzzleFrame=age<.13?'a':'b';e.muzzle.visible=!e.pulseKill&&age<.30;if(e.muzzle.userData.frame!==muzzleFrame){e.muzzle.userData.frame=muzzleFrame;e.muzzle.material.map=this.assetTexture(`muzzle-${muzzleFrame}`);e.muzzle.material.needsUpdate=true;e.muzzle.center.set(muzzleFrame==='a'?.451:.426,.464);}e.muzzle.material.opacity=Math.max(0,1-age/.30);
        const impactStart=flightEnd,impactAge=clamp((age-impactStart)/(1-impactStart),0,1);e.impact.visible=age>=impactStart;const frame=e.impactFrames===8?Math.min(gallery?6:7,Math.floor(Math.min(.999,impactAge/(gallery?.82:1))*8)):(impactAge<.45?'a':'b'),frameName=`${e.impactPrefix}-${frame}`;
        if(e.impact.userData.frame!==frameName){e.impact.userData.frame=frameName;e.impact.material.map=this.assetTexture(frameName);e.impact.material.needsUpdate=true;}const impactFade=gallery?(impactAge<.76?1:Math.max(0,(1-impactAge)/.24)):Math.min(1,(1-age)/.18);e.impact.material.opacity=impactFade;e.impact.scale.set(e.impactBase[0],e.impactBase[1],1).multiplyScalar(e.impactScale*(.82+impactAge*(gallery?.34:.22)));
        if(e.halo){e.halo.visible=age>=impactStart;const haloScale=3.6+impactAge*6.5;e.halo.scale.set(haloScale,haloScale,1);e.halo.material.opacity=Math.min(1,1.15*Math.pow(1-impactAge,1.05));e.halo.material.rotation=impactAge*.62;}
        if(gallery&&e.dead&&age>=impactStart)for(let i=0;i<18&&particles<360;i++){const angle=i*Math.PI/9+(Number(e.eventId||0)%9)*.17,spread=(.5+(i%4)*.20)+impactAge*3.1;this.instance(this.particles,particles,e.to.x+Math.cos(angle)*spread,e.to.y+Math.sin(angle)*spread,e.to.z+.1,.07,.28,.05,0,0,angle+impactAge*5);this.particles.setColorAt(particles++,new THREE.Color(i%3===0?'#ffffff':i%3===1?e.color:'#ff9f43'));}
        if(!gallery&&e.dead&&age>=impactStart&&!reduced)for(let i=0;i<16&&particles<360;i++){
          const random=seededUnit(e.seed+i*31),angle=random*Math.PI*2,speed=1.8+seededUnit(e.seed+i*17+3)*3.5,spread=impactAge*speed,size=(.06+random*.13)*(1-impactAge);
          this.instance(this.particles,particles,e.to.x+Math.cos(angle)*spread,e.to.y+Math.sin(impactAge*Math.PI)*(.5+random*2),e.to.z+Math.sin(angle)*spread,size,size*(1+random*2),size,angle,impactAge*8,angle);
          this.particles.setColorAt(particles++,new THREE.Color(i%3===0?'#fff5b5':i%3===1?'#ffae51':'#ac87db'));
        }
      }else if(e.kind==='death-pop'){
        e.pulseSprite.visible=age>=0;const growth=1+Math.max(0,age)*.85;if(e.baseScale)e.pulseSprite.scale.copy(e.baseScale).multiplyScalar(growth);else{const scale=e.size*growth;e.pulseSprite.scale.set(scale,scale,1);}e.pulseSprite.material.opacity=Math.pow(1-Math.max(0,age),1.5);
      }else if(e.kind==='kill-cloud'){
        e.pulseSprite.visible=age>=0;const u=Math.max(0,age),angle=e.angle+u*.72,radius=e.radius+u*.7;e.pulseSprite.position.copy(e.origin).addScaledVector(e.right,Math.cos(angle)*radius).addScaledVector(e.up,Math.sin(angle)*radius+u*.5);e.pulseSprite.scale.setScalar(e.size*(.55+u));e.pulseSprite.material.rotation=e.angle+u*1.6;e.pulseSprite.material.opacity=.55*Math.sin(Math.PI*Math.min(1,u));
      }else if(e.kind==='shock'){
        e.pulseSprite.visible=age>=0;const u=Math.max(0,age),scale=e.size*(.35+.65*(1-Math.pow(1-u,3)));e.pulseSprite.scale.set(scale,scale,1);e.pulseSprite.material.opacity=.9*Math.pow(1-u,1.6);
      }else if(e.kind==='scorch'){
        e.pulseSprite.visible=age>=0;e.pulseSprite.scale.set(e.size,e.size,1);e.pulseSprite.material.opacity=.4*Math.pow(1-Math.max(0,age),1.3);
      }else if(e.kind==='pulse'){
        const diameter=1.5+age*12.5;e.pulseSprite.visible=true;e.pulseSprite.scale.set(diameter,diameter,1);e.pulseSprite.material.opacity=Math.pow(1-age,1.35);e.pulseSprite.material.rotation=age*.32;
      }
    }
    const popAlive=[],visiblePopups=[];
    for(const popup of this.popups){
      const age=(this.clock-popup.born)/popup.life;if(age>=1){popup.el.remove();continue;}popAlive.push(popup);popup.el.hidden=age<0;if(age>=0)visiblePopups.push(popup);
    }
    this.popups=popAlive;
    if(visiblePopups.length){
    const sceneBox=$('ss-scene').getBoundingClientRect(),gap=8*clamp(innerWidth/1280,.8,1.5),wings=(mode==='swarm_gate'?[topHUD]:[heading,matchMetrics]).map(el=>el.getBoundingClientRect()),placed=[];
    // Read newly visible/font-resized labels together, before any placement writes.
    // Recover their unscaled layout box from the previous authored scale; the
    // current rounded scale below reproduces getBoundingClientRect's bounds.
    for(const popup of visiblePopups)if(popup.metrics?.version!==this.popupMetricsVersion){
      const box=popup.el.getBoundingClientRect(),scale=popup.drawScale||1;
      popup.metrics={width:box.width/scale,height:box.height/scale,version:this.popupMetricsVersion};
    }
    for(const popup of visiblePopups){
      const v=popup.origin.clone().project(this.camera),u=Math.max(0,(this.clock-popup.born)/popup.life),pop=reduced?1:mode==='swarm_gate'?(u<.16?.94+.10*(1-Math.pow(1-u/.16,3)):u<.3?1.04-.04*((u-.16)/.14):1):u<.14?.55+.65*(1-Math.pow(1-u/.14,3)):u<.26?1.2-.2*((u-.14)/.12):1;
      popup.drawScale=Number(pop.toFixed(3));popup.el.style.transform=`translate(-50%,-50%) scale(${popup.drawScale})`;
      // Only the label moves: the effect origin and the authoritative hit remain on the field.
      const halfW=popup.metrics.width*popup.drawScale/2+gap/2,halfH=popup.metrics.height*popup.drawScale/2+gap/2;
      let x=clamp((v.x*.5+.5)*sceneBox.width+Math.sin(u*Math.PI)*12,gap+halfW,sceneBox.width-gap-halfW);
      let y=clamp((-v.y*.5+.5)*sceneBox.height-22-u*64,gap+halfH,sceneBox.height-gap-halfH);
      for(const wing of wings){const left=wing.left-sceneBox.left-gap,right=wing.right-sceneBox.left+gap,top=wing.top-sceneBox.top-gap,bottom=wing.bottom-sceneBox.top+gap;
        if(x+halfW>left&&x-halfW<right&&y+halfH>top&&y-halfH<bottom)y=bottom+halfH;
      }
      if(mode==='swarm_gate'){const position=swarmPopupPosition({x,y,halfW,halfH,width:sceneBox.width,height:sceneBox.height,gap},placed);x=position.x;y=position.y;placed.push({left:x-halfW,right:x+halfW,top:y-halfH,bottom:y+halfH});}
      popup.el.style.left=x+'px';popup.el.style.top=y+'px';popup.el.style.opacity=String(Math.min(1,(1-u)/.25));
    }
    }
    this.particles.count=particles;this.particles.instanceMatrix.needsUpdate=true;if(particles)this.particles.instanceColor.needsUpdate=true;
  }
  resize(force=false){
    const layoutKey=[innerWidth,innerHeight,(state?.players.length||0)>8,document.documentElement.dataset.partyPhase].join(':');
    if(!force&&layoutKey===this.layoutKey)return;this.layoutKey=layoutKey;
    this.popupMetricsVersion=(this.popupMetricsVersion||0)+1;
    const scale=clamp(innerWidth/1280,.55,1.5),dense=(this.state?.players.length||state?.players.length||0)>8,root=document.documentElement;root.style.setProperty('--ss-tv-scale',scale);document.body.dataset.ssDense=String(dense);
    const scene=$('ss-scene');
    if(innerWidth>700){
      const margin=16*scale,top=0,height=innerHeight,width=innerWidth;
      scene.style.inset='0';scene.style.left='0';scene.style.top='0';scene.style.width=width+'px';scene.style.height=height+'px';
      topHUD.style.width='';topHUD.style.left='';
      root.style.setProperty('--ss-field-top',top+'px');root.style.setProperty('--ss-field-height',height+'px');root.style.setProperty('--ss-field-width',width+'px');const cap=topHUD.getBoundingClientRect(),after=getComputedStyle(topHUD,'::after'),lower=parseFloat(after.bottom)||0,capBottom=cap.bottom+Math.max(0,-lower);root.style.setProperty('--ss-notice-top',(capBottom+12*scale)+'px');root.style.setProperty('--ss-field-center',(width/2)+'px');
    }else{scene.style.inset='0';scene.style.width='';scene.style.height='';}
    const r=scene.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height),key=[w,h,dense,scale].join(':');if(this.curling){const rail=$('ss-scoreboard').getBoundingClientRect(),hud=topHUD.getBoundingClientRect();const sideRail=dense&&rail.left>w*.5;this.curling.presentationBounds={width:w,height:h,left:18,right:sideRail?Math.min(w-18,rail.left-18):w-18,top:Math.max(18,hud.bottom+12),bottom:sideRail?h-18:Math.min(h-18,rail.top-18)};}if(this.viewportKey===key)return;this.viewportKey=key;
    if(this.software)this.renderer.setPixelRatio(Math.min(1,640/w));this.renderer.setSize(w,h,false);
    if(this.camera.isPerspectiveCamera)this.camera.aspect=w/h;
    else{let height=mode==='peek_shoot'?(dense?26:23):mode==='curling'?32:mode==='swarm_gate'?(dense?36:30):32;height=Math.max(height,(mode==='peek_shoot'?39:mode==='curling'?17:42)/(w/h));const span=height+(mode==='swarm_gate'?6:0),center=mode==='swarm_gate'?3:0;this.camera.left=-span*w/h/2;this.camera.right=span*w/h/2;this.camera.top=center+span/2;this.camera.bottom=center-span/2;}
    if(this.courtyard){
      const aspect=w/h,imageAspect=1.5;
      this.courtyard.repeat.set(Math.min(1,aspect/imageAspect),Math.min(1,imageAspect/aspect));
      this.courtyard.offset.set((1-this.courtyard.repeat.x)/2,(1-this.courtyard.repeat.y)/2);
    }
    this.swarmFX?.frame(w,h);
    this.bowling?.resize(w,h);
    this.camera.updateProjectionMatrix();
    if(this.camera.isOrthographicCamera)for(const bubble of this.identityBubbles){const height=24*scale*(this.camera.top-this.camera.bottom)/h;bubble.scale.set(height*1.5,height,1);}
  }
  dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.raf);this.renderer.dispose();this.renderer.forceContextLoss();}
  loop(now){if(this.disposed)return;if(document.hidden||this.state?.phase==='waiting'){this.last=now;this.raf=requestAnimationFrame(this.loop);return;}if(now-this.last<(this.software?1000/15:1000/60)-1){this.raf=requestAnimationFrame(this.loop);return;}let dt=Math.min(.1,(now-this.last)/1000);this.last=now;if(this.hitStop&&now>=this.hitStop.at&&now<this.hitStop.until)dt=0;this.clock+=dt;
    if(this.state)this.updateObjects(this.state,dt);this.updateEffects();this.applyShake(now);this.renderer.render(this.scene,this.camera);
    if(mode==='swarm_gate'&&$('ss-notice').classList.contains('show')){const cap=topHUD.getBoundingClientRect(),after=getComputedStyle(topHUD,'::after'),lower=parseFloat(after.bottom)||0;$('ss-notice').style.top=(cap.bottom+Math.max(0,-lower)+12*clamp(innerWidth/1280,.55,1.5))+'px';}
    if(now>noticeUntil)$('ss-notice').classList.remove('show');this.raf=requestAnimationFrame(this.loop);
  }
}

// Score labels retain every authoritative reward; only their screen-space placement separates nearby hits.
function swarmPopupPosition(box,placed){
  const {halfW,halfH,width,height,gap}=box,minY=box.y;let best={x:box.x,y:box.y},cost=Infinity;
  for(let row=0;row<8;row++)for(let col=0;col<9;col++){
    const direction=col%2?1:-1,distance=Math.ceil(col/2),x=clamp(box.x+direction*distance*(halfW*2+gap),halfW+gap,width-halfW-gap),y=clamp(minY+row*(halfH*2+gap),halfH+gap,height-halfH-gap);
    const overlap=placed.some(r=>x+halfW>r.left&&x-halfW<r.right&&y+halfH>r.top&&y-halfH<r.bottom),travel=Math.hypot(x-box.x,y-box.y);
    const value=(overlap?1e6:0)+travel;if(value<cost){cost=value;best={x,y};}if(!overlap&&row===0&&col===0)return best;
  }
  return best;
}
try{view=new Stage();if(state)view.setState(state);if(mode==='swarm_gate')window.__ssSwarmDiag=()=>{
 const size=view.renderer.getSize(new THREE.Vector2()),project=v=>{const q=v.clone().project(view.camera);return{x:(q.x*.5+.5)*size.x,y:(.5-q.y*.5)*size.y};},bounds=points=>({left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))});
 const enemies=[];for(const [kind,mesh] of Object.entries(view.botSprites))for(let i=0;i<mesh.count;i++){const matrix=new THREE.Matrix4();mesh.getMatrixAt(i,matrix);enemies.push({kind,...bounds([[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]].map(([x,y])=>project(new THREE.Vector3(x,y,0).applyMatrix4(matrix))))});}
 const turrets=[...view.turrets.entries()].map(([id,g])=>{const head=g.userData.head,number=g.userData.bubble,origin=head.getWorldPosition(new THREE.Vector3()),player=state?.players.find(p=>p.id===id),target=new THREE.Vector3((player?.aim.x-.5)*36,.68,-27+(player?.aim.y||0)*26),pivot=project(origin),muzzle=project(view.turretMuzzle(g)),aim=project(target),up=new THREE.Vector3(0,1,0).applyQuaternion(view.camera.quaternion),right=new THREE.Vector3(1,0,0).applyQuaternion(view.camera.quaternion),r=g.userData.base.scale.x*1126/1254/2;
 return{id,variant:head.userData.variant,loaded:!!head.material.map.image?.width&&!!g.userData.base.material.map.image?.width,muzzleReach:head.userData.muzzleReach,pivot,number:project(number.getWorldPosition(new THREE.Vector3())),muzzle,anchor:{x:origin.x,z:origin.z},base:bounds([-1,1].flatMap(x=>[-1,1].map(y=>project(origin.clone().addScaledVector(right,x*r).addScaledVector(up,y*r))))),muzzleRayError:Math.abs((muzzle.x-pivot.x)*(aim.y-pivot.y)-(muzzle.y-pivot.y)*(aim.x-pivot.x))/(Math.hypot(aim.x-pivot.x,aim.y-pivot.y)||1)};});
 const repair={ratio:view.repairSprite.scale.x/view.repairSprite.scale.y,native:view.repairSprite.material.map.image?{width:view.repairSprite.material.map.image.width,height:view.repairSprite.material.map.image.height}:null},cap=topHUD.getBoundingClientRect(),notice=$('ss-notice').getBoundingClientRect();
 return{camera:{left:view.camera.left,right:view.camera.right,top:view.camera.top,bottom:view.camera.bottom,position:view.camera.position.toArray(),look:view.look.toArray()},viewport:{width:size.x,height:size.y},enemies,turrets,repair,notice:{capBottom:cap.bottom,top:notice.top,gap:notice.top-cap.bottom,shown:$('ss-notice').classList.contains('show')},gate:state?.gate,stage:state?.stage};
};}catch(e){console.error(e);$('ss-error').hidden=false;$('ss-error').textContent='Не удалось включить 3D. Нужен браузер с WebGL 2 и аппаратным ускорением. '+e.message;}
