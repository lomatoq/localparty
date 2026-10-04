'use strict';
const $=id=>document.getElementById(id),host=!!window.IS_HOST;let ws,state,id,joinRetry=0,axis={x:0,y:0},motionEnabled=false,motionPeak=0,lastMotion=0,punchReady=false,punchArmed=false,punchTurnSince=0,punchStillSince=0,punchCue='',carryHudSequence=0,carryHudSignature='',carryHudSentAt=0;
const send=(type,data={})=>{if(ws?.readyState===1)ws.send(JSON.stringify({type,data}));},esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function join(){const profile=window.PARTY_PROFILE||{};send('join',{partyId:profile.id,partyToken:profile.token,name:profile.name||$('nickname')?.value||'Игрок',token:localStorage.getItem('arcade-id')});}
function connect(){ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws');ws.onopen=()=>{clearInterval(joinRetry);if(host){carryHudSequence=0;carryHudSignature='';carryHudSentAt=0;return send('host');}const attempt=()=>{if(window.PARTY_PROFILE?.id||localStorage.getItem('arcade-id'))join();};attempt();joinRetry=setInterval(attempt,900);};ws.onclose=()=>{clearInterval(joinRetry);if(!host){document.body.dataset.arcadeConnection='offline';$('status').textContent=arcadeCopy('Восстанавливаем связь…','Reconnecting…');$('action').disabled=true;$('action').dispatchEvent(new Event('pointercancel'));$('joy').setAttribute('aria-disabled','true');$('joy').dispatchEvent(new Event('pointercancel'));}setTimeout(connect,700);};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='joined'){clearInterval(joinRetry);id=m.data.id;localStorage.setItem('arcade-id',id);$('join').hidden=true;$('name').textContent=m.data.name;}if(m.type==='state'){if(host&&m.data.mode==='snakelines')for(const p of m.data.players){const previous=state?.players.find(q=>q.id===p.id)?.trail||[];p.trail=previous.slice(0,p.trailFrom||0).concat(p.trail);}state=m.data;if(!host)document.body.dataset.arcadeConnection='online';if(host)window.PARTY_BOT_VIEW=state;if(!host&&state.selfId)id=state.selfId;update();}if(m.type==='error'&&!host)$('status').textContent=m.data;};}connect();
const instructions={taprace:'Тапай как можно быстрее! Каждый тап разгоняет бегуна.',punchmeter:'Три попытки. Когда придёт твоя очередь, нажми «Готов бить», затем сделай короткий удар. Без датчика: зажми кнопку и отпусти на пике шкалы.',flappy:'Тап — взмах вверх. Пролетай между трубами.',hungry:'Веди джойстик к еде. Расти и обходи крупных игроков.',snakelines:'Обходи стены и следы. Джойстик — поворот.',carryball:'Подбери мяч. Джойстик — бег, кнопка — пас.'};
let boardKey='';
const arcadeRows=new Map();
const arcadeCopy=(ru,en)=>(window.PartyI18n?.language||document.documentElement.lang)==='ru'?ru:en;
function phoneComposition(s,p,playing){
 const cue=$('arcadeCue'),art={taprace:'runner-a',punchmeter:'punch-bag',flappy:'bird-a',hungry:'hungry-blob',snakelines:'snake-head',carryball:'carry-ball'}[s.mode];
 if(cue&&art){const src='assets/atlas-arcade/'+art+'.webp';if(cue.getAttribute('src')!==src)cue.src=src;cue.hidden=false;}
 document.body.dataset.arcadeMode=s.mode;document.body.dataset.arcadeState=s.phase==='finished'?'finished':s.countdown>0?'countdown':!playing?'waiting':p?.dead>0?'returning':p?.alive?'active':'out';
 if(s.mode==='punchmeter')return;
 const states={taprace:['Разгоняйся','Reach the finish'],flappy:['Лети между трубами','Fly through the gaps'],hungry:['Ешь и расти','Eat and grow'],snakelines:['Уходи от следов','Dodge every trail'],carryball:['Играем за команду','Score for your team']};
 $('status').textContent=s.phase==='finished'?arcadeCopy('Финиш · ','Finished · ')+(p?.score||0):s.countdown>0?arcadeCopy('Старт через ','Starting in ')+Math.ceil(s.countdown):!playing?arcadeCopy('Ждём старта','Waiting for the start'):p?.dead>0?arcadeCopy('Возвращение через ','Back in ')+Math.ceil(p.dead)+arcadeCopy('с','s'):!p?.alive?arcadeCopy('Ты выбыл','You are out'):arcadeCopy(...states[s.mode]);
 if(s.countdown>0)$('help').textContent=arcadeCopy('Приготовься. Управление появится после отсчёта.','Get ready. Controls appear when the countdown ends.');
 if(s.phase==='finished')$('help').textContent=arcadeCopy('Результаты — на общем экране.','Results are on the shared screen.');
 if(playing&&s.mode==='hungry'&&p?.dead<=0)$('help').textContent=arcadeCopy('Ешь, чтобы расти. Коснись меньшего игрока, чтобы поглотить его. После появления действует защита 2 секунды.','Eat to grow. Touch a smaller blob to absorb it. New blobs are protected for 2 seconds.');
 if(playing&&p?.dead>0)$('help').textContent=arcadeCopy('Тебя съели. Скоро твой персонаж вернётся на поле.','You were eaten. Your blob returns to the field shortly.');
 if(s.mode==='flappy'&&playing&&!p?.alive)$('action').hidden=true;
 if(s.mode==='carryball'&&playing&&p){
  const carrier=s.players.find(q=>q.id===s.ball?.owner),hasBall=carrier?.id===id;
  document.body.dataset.arcadePossession=hasBall?'self':carrier?'other':'loose';
  $('status').textContent=hasBall?arcadeCopy('Мяч у тебя','You have the ball'):carrier?.team===p.team?arcadeCopy('Помоги своей команде','Support your teammate'):carrier?arcadeCopy('Отбери мяч','Win the ball back'):arcadeCopy('Подбери мяч','Pick up the ball');
  $('help').textContent=hasBall?arcadeCopy('Беги к воротам или передай мяч кнопкой «Пас».','Run to the goal or use Pass to release the ball.'):arcadeCopy('Веди джойстик к мячу. Пас станет доступен, когда подберёшь его.','Steer toward the ball. Pass becomes available when you pick it up.');
  $('action').disabled=!hasBall;
 }
 if(playing&&!p?.alive&&['flappy','snakelines'].includes(s.mode))$('help').textContent=s.mode==='flappy'?arcadeCopy('Следи за оставшимися игроками.','Watch the remaining players.'):arcadeCopy('Следи за общим экраном. Новый заезд — в следующем раунде.','Watch the remaining trails. You return next round.');
}

function renderArcadeBoard(s){
 const board=$('board'),ordered=[...s.players].sort((a,b)=>b.score-a.score),ids=new Set(ordered.map(p=>p.id));
 for(const [id,row] of arcadeRows)if(!ids.has(id)){row.remove();arcadeRows.delete(id);}
 const text=(el,value)=>{value=String(value);if(el.textContent!==value)el.textContent=value;};
 ordered.forEach((p,i)=>{
  let row=arcadeRows.get(p.id);
  if(!row){row=document.createElement('div');row.className='runner-row';row.dataset.player=p.id;
   const avatar=document.createElement('span'),name=document.createElement('span'),label=document.createElement('span'),detail=document.createElement('small'),score=document.createElement('b');
   avatar.className='avatar';name.append(label,detail);row.append(avatar,name,score);row.parts={avatar,label,detail,score};arcadeRows.set(p.id,row);}
  const {avatar,label,detail,score}=row.parts;
  const identity=window.PARTY_ROSTER?.find?.(q=>q.id===p.id)||p,src=window.PartyArt?.mascotSource?.({seed:p.id,avatar:identity.avatar||identity.photo,color:p.color});
  if(src&&avatar.dataset.src!==src){avatar.dataset.src=src;const portrait=document.createElement('img');portrait.src=src;portrait.alt='';portrait.className=identity.avatar||identity.photo?'player-photo':'player-mascot';avatar.replaceChildren(portrait);}
  if(avatar.style.getPropertyValue('--color')!==p.color)avatar.style.setProperty('--color',p.color);
  text(label,p.name);text(score,p.score);detail.hidden=s.mode!=='punchmeter';
  if(s.mode==='punchmeter')text(detail,p.hits.length+'/3 · лучший '+Math.max(0,...p.hits));
  if(board.children[i]!==row)board.insertBefore(row,board.children[i]||null);
 });
}
function update(){const s=state,playing=s.phase==='playing'&&!(s.countdown>0),p=s.players.find(p=>p.id===id);if(host){$('title').textContent=s.title;$('lobbyStage').hidden=s.phase==='playing';$('start').textContent=s.phase==='finished'?'Сыграть ещё →':'Начать игру →';$('hint').textContent=instructions[s.mode];$('phase').textContent=s.phase==='finished'?'Результаты':s.mode==='carryball'?`Команды ${s.teams[0]} : ${s.teams[1]}`:'Игроки';const key=JSON.stringify(s.players.map(p=>[p.id,p.name,p.color,p.score,p.hits,p.alive,p.connected]));if(key!==boardKey){boardKey=key;renderArcadeBoard(s);}}else{const joy=['hungry','snakelines','carryball'].includes(s.mode);$('joy').hidden=!joy;const joyDisabled=!playing||!p||!p.alive||p.dead>0;const wasJoyDisabled=$('joy').getAttribute('aria-disabled')==='true';$('joy').setAttribute('aria-disabled',String(joyDisabled));if(joyDisabled&&!wasJoyDisabled)$('joy').dispatchEvent(new Event('pointercancel'));$('action').hidden=joy&&s.mode!=='carryball';$('action').classList.toggle('pass',s.mode==='carryball');$('action').textContent=s.mode==='carryball'?'ПАС →':s.mode==='punchmeter'?'ЗАЖМИ → ОТПУСТИ':s.mode==='flappy'?'ВЗМАХ ↑':'ТАП!';$('action').disabled=!playing||!p||!p.alive||s.mode==='punchmeter'&&(p.hits.length>=3||s.punchTurn!==id);$('motion').hidden=s.mode!=='punchmeter'||motionEnabled;$('help').textContent=instructions[s.mode];$('status').textContent=!p?'Войди в игру':!playing?(s.phase==='finished'?`Финиш · ${p.score} очков`:'Ждём старта на общем экране'):p.dead>0?'Возвращение через '+Math.ceil(p.dead)+'с':!p.alive?'Ты выбыл. Следи за общим экраном.':s.mode==='punchmeter'?`${s.punchTurn===id?'ТВОЙ УДАР · попытка '+(p.hits.length+1)+'/3':'Сейчас бьёт: '+(s.players.find(q=>q.id===s.punchTurn)?.name||'—')} · лучший ${Math.max(0,...p.hits)} · сумма ${p.score}`:s.mode==='taprace'?`До финиша ${Math.max(0,2000-p.score)} · Тапай быстрее!`:(window.ArcadeJuice?.cue(s.mode)||Math.ceil(s.timer)+' секунд · '+p.score+' очков');if(s.mode==='flappy'&&playing&&p&&!p.alive){$('action').textContent='ПОЛЁТ ЗАВЕРШЁН';$('help').textContent='Следи за оставшимися птицами на общем экране.';$('status').textContent=`Ты выбыл · ${p.score} очков. Следующий забег после завершения этого раунда.`;}if(s.countdown>0){$('action').textContent=String(Math.ceil(s.countdown));$('status').textContent='Get ready — tap to flap when the countdown ends';}if(s.mode==='punchmeter')renderPunchPhone(s,p);window.ArcadeJuice?.phone(s,p,id);phoneComposition(s,p,playing);}}
function renderPunchPhone(s,p){
 let panel=$('punchResult');if(!panel){panel=document.createElement('div');panel.id='punchResult';panel.setAttribute('role','status');$('status').after(panel);$('action').before($('motion'));}
 const turn=s.players.find(q=>q.id===s.punchTurn),mine=s.punchTurn===id;
 const canPunch=s.phase==='playing'&&mine&&p&&p.hits.length<3;
 if(canPunch){const cue=s.round+':'+p.hits.length;if(cue!==punchCue){punchCue=cue;punchReady=false;punchArmed=false;motionPeak=0;try{navigator.vibrate?.([70,55,100]);}catch{}}}else{punchCue='';punchReady=false;punchArmed=false;}
 $('status').textContent=s.phase==='finished'?arcadeCopy('Твои результаты','Your results'):s.phase!=='playing'?arcadeCopy('Готовимся к ударам','Get ready'):mine?arcadeCopy('Твой удар','Your punch'):arcadeCopy('Бьёт: ','Punching: ')+(turn?.name||'—');
 const resultKey=[p?.hits.length||0,Math.max(0,...(p?.hits||[])),p?.score||0].join(':');
 if(panel.dataset.result!==resultKey){panel.dataset.result=resultKey;panel.replaceChildren(...[['Попытки',`${p?.hits.length||0}/3`],['Лучший',Math.max(0,...(p?.hits||[]))],['Всего',p?.score||0]].map(([label,value])=>{const box=document.createElement('div'),caption=document.createElement('small'),number=document.createElement('strong');caption.textContent=label;number.textContent=value;box.append(caption,number);return box;}));}
 document.body.classList.toggle('punch-finished',s.phase==='finished');
 if($('motionFeedback'))$('motionFeedback').hidden=motionEnabled||s.phase==='finished';
 $('action').hidden=!canPunch;

 $('motion').hidden=motionEnabled||s.phase==='finished';
 let ready=$('punchReady');if(!ready){ready=document.createElement('button');ready.id='punchReady';ready.type='button';ready.className='primary punch-ready';ready.onclick=()=>{if(!motionEnabled||!state||state.punchTurn!==id)return;punchReady=true;punchArmed=false;punchTurnSince=performance.now();punchStillSince=0;motionPeak=0;ready.textContent='Держи телефон ровно…';ready.classList.remove('turn-cue');try{navigator.vibrate?.(35);}catch{}};$('motion').after(ready);}
 ready.hidden=!motionEnabled||!canPunch;ready.disabled=punchReady;ready.textContent=punchArmed?'БЕЙ!':punchReady?'Держи телефон ровно…':'ГОТОВ БИТЬ';ready.classList.toggle('turn-cue',canPunch&&!punchReady);
 let sense=$('punchSense');if(!sense){sense=document.createElement('div');sense.id='punchSense';sense.className='punch-sense';sense.setAttribute('role','group');sense.setAttribute('aria-label','Чувствительность датчика');sense.append(Object.assign(document.createElement('span'),{textContent:'Датчик'}));
  for(const [key,label] of [['soft','Мягко'],['normal','Норма'],['sharp','Чутко']]){const b=document.createElement('button');b.type='button';b.dataset.sense=key;b.textContent=label;b.onclick=()=>{try{localStorage.setItem('lp.punchSense',key);}catch{}update();};sense.append(b);}
  $('motion').after(sense);}
 let senseLevel='soft';try{senseLevel=localStorage.getItem('lp.punchSense')||'soft';}catch{}
 $('action').before(ready);
 for(const b of sense.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.sense===senseLevel));sense.hidden=!motionEnabled||!canPunch;
 $('help').textContent=s.phase==='finished'?'Итоги — на общем экране.':!mine?'Жди сигнала своего хода.':motionEnabled?'Нажми «Готов бить», затем сделай удар.':'Зажми кнопку и отпусти на пике.';
 if(!motionEnabled&&!$('motionFeedback'))$('motion').textContent='Разрешить движение';
 $('action').textContent=s.phase==='finished'?'Матч завершён':mine?'Зажми → отпусти':'Ждём очередь';
}

if(host)$('start').onclick=()=>send('start');else{$('join').onsubmit=e=>{e.preventDefault();join();};let held=0,pointer=null;const action=$('action');action.onpointerdown=e=>{if(action.disabled||!state)return;e.preventDefault();action.setPointerCapture(e.pointerId);held=performance.now();if(state.mode!=='punchmeter')send('input',{...axis,action:state.mode==='carryball'?'pass':'tap'});window.ArcadeJuice?window.ArcadeJuice.press(e,action,state.mode):navigator.vibrate?.(10);};action.onpointerup=e=>{window.ArcadeJuice?.release(action);if(state?.mode==='punchmeter'&&held){const duration=(performance.now()-held)/1000,power=(Math.sin(duration*4-Math.PI/2)+1)/2;held=0;if(duration<.15)return;const r=action.getBoundingClientRect(),side=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2||1)));send('input',{action:'punch',power,side});window.ArcadeJuice?.release(action,power);}};action.onpointercancel=action.onlostpointercapture=()=>{held=0;window.ArcadeJuice?.release(action);};
 const zone=$('joy');function move(e){const r=zone.getBoundingClientRect(),radius=r.width*.32;let x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius,n=Math.max(1,Math.hypot(x,y));axis={x:x/n,y:y/n};$('knob').style.transform=`translate(calc(-50% + ${axis.x*radius}px),calc(-50% + ${axis.y*radius}px))`;send('input',axis);}function reset(){axis={x:0,y:0};pointer=null;held=0;window.ArcadeJuice?.release(action);$('knob').style.transform='translate(-50%,-50%)';send('input',axis);}zone.onpointerdown=e=>{if(pointer!==null||zone.getAttribute('aria-disabled')==='true')return;pointer=e.pointerId;zone.setPointerCapture(pointer);move(e);};zone.onpointermove=e=>{if(pointer===e.pointerId)move(e);};zone.onpointerup=zone.onpointercancel=zone.onlostpointercapture=reset;window.addEventListener('blur',reset);window.addEventListener('pagehide',reset);window.addEventListener('offline',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});setInterval(()=>{if(pointer!==null)send('input',axis);},120);
 // Motion permission alone is not proof that the phone is sending measurements.
 let motionPending=false,motionListener=null,motionWatchdog=null,motionGravity=null;
 let motionSide=0;
 // Sensitivity chosen on the controller (web or app); default is the calm "soft" profile.
 function punchSense(){let level='soft';try{level=window.localStorage?.getItem('lp.punchSense')||'soft';}catch{}return {soft:{trigger:16,full:52},normal:{trigger:12,full:40},sharp:{trigger:9,full:32}}[level]||{trigger:16,full:52};}
 $('motion').onclick=async()=>{
  if(motionPending||motionEnabled)return;
  const button=$('motion');let feedback=$('motionFeedback');if(!feedback){feedback=document.createElement('p');feedback.id='motionFeedback';feedback.setAttribute('role','status');feedback.style.cssText='font-size:13px;line-height:1.4;margin:8px 0;max-width:100%;overflow-wrap:anywhere';button.after(feedback);}
  const stopMotion=message=>{clearTimeout(motionWatchdog);if(motionListener)window.removeEventListener('devicemotion',motionListener);motionListener=null;motionPending=false;motionEnabled=false;motionPeak=0;punchReady=false;punchArmed=false;motionGravity=null;button.disabled=false;button.hidden=false;button.textContent='Повторить подключение датчика';feedback.textContent=message;if(state)update();};
  if(!window.isSecureContext){button.disabled=true;button.textContent=arcadeCopy('Датчик недоступен','Sensor unavailable');feedback.textContent='Датчик требует HTTPS. По этому HTTP-адресу используй кнопку «Зажми → отпусти».';return;}
  if(!window.DeviceMotionEvent){button.disabled=true;button.textContent=arcadeCopy('Датчик недоступен','Sensor unavailable');feedback.textContent='Этот браузер не поддерживает датчик движения. Используй кнопку «Зажми → отпусти».';return;}
  motionPending=true;button.disabled=true;button.textContent=arcadeCopy('Запрашиваем доступ…','Requesting access…');feedback.textContent='Запрашиваем доступ к движению…';
  try{
   if(typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted'){stopMotion('Доступ к движению не разрешён. Можно повторить запрос или играть кнопкой.');return;}
   button.textContent=arcadeCopy('Ждём датчик…','Waiting for sensor…');feedback.textContent='Доступ получен. Ждём данные датчика…';motionGravity=null;motionPeak=0;
   const armWatchdog=()=>{clearTimeout(motionWatchdog);motionWatchdog=setTimeout(()=>stopMotion('Данные движения не поступают. Проверь доступ в браузере или используй кнопку.'),4000);};
   motionListener=e=>{
    const valid=a=>a&&['x','y','z'].some(k=>typeof a[k]==='number'&&Number.isFinite(a[k]));let acceleration=e.acceleration,gravityFallback=false;
    if(!valid(acceleration)){if(!valid(e.accelerationIncludingGravity))return;acceleration=e.accelerationIncludingGravity;gravityFallback=true;}
    let vector=['x','y','z'].map(k=>Number.isFinite(acceleration[k])?acceleration[k]:0);
    if(gravityFallback){if(!motionGravity)motionGravity=vector.slice();const linear=vector.map((v,i)=>v-motionGravity[i]);motionGravity=vector.map((v,i)=>motionGravity[i]*.85+v*.15);vector=linear;}
    if(!motionEnabled){motionEnabled=true;motionPending=false;button.hidden=true;feedback.textContent='Датчик подключён';if(state)update();}
    armWatchdog();const magnitude=Math.hypot(...vector);
    // Movement is ignored until the player explicitly confirms this attempt.
    const now=performance.now();
    if(state?.mode!=='punchmeter'||state.phase!=='playing'||state.punchTurn!==id||!punchReady){motionPeak=0;return;}
    if(!punchArmed){if(magnitude<2.2){punchStillSince||=now;if(now-punchTurnSince>=700&&now-punchStillSince>=350){punchArmed=true;const ready=$('punchReady');if(ready)ready.textContent='БЕЙ!';}}else punchStillSince=0;motionPeak=0;return;}
    const sense=punchSense();if(magnitude>=motionPeak)motionSide=magnitude?vector[0]/magnitude:0;motionPeak=Math.max(motionPeak,magnitude);
    // Five times less motion gain BEFORE saturation; preserve arming/noise gates and the1000-point cap.
    if(magnitude<3&&motionPeak>sense.trigger&&now-lastMotion>1800){send('input',{action:'punch',side:Math.max(-1,Math.min(1,motionSide)),power:Math.max(0,Math.min(1,(motionPeak-sense.trigger*.5)/(5*(sense.full-sense.trigger*.5))))});motionPeak=0;lastMotion=now;punchReady=false;punchArmed=false;punchStillSince=0;}
   };window.addEventListener('devicemotion',motionListener);armWatchdog();
  }catch{stopMotion('Браузер не дал доступ к движению. Используй кнопку или повтори запрос.');}
 };
 function charge(){if(held&&state?.mode==='punchmeter'){const power=(Math.sin((performance.now()-held)/1000*4-Math.PI/2)+1)/2;action.style.background=`linear-gradient(90deg,#baff46 ${power*100}%,#506d35 ${power*100}%)`;}else action.style.background='';requestAnimationFrame(charge);}charge();}
if(host){const c=$('arena'),g=c.getContext('2d'),circle=(x,y,r,color)=>{g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();},text=(s,x,y,size=18,color='#f3f8ee')=>{g.fillStyle=color;g.font=`800 ${size}px HeyPalsText,system-ui`;g.textAlign='center';g.fillText(s,x,y);};
// Only text avoids the measured HUD; authoritative objects keep their world positions.
function hudWorldRects(){
 const r=c.getBoundingClientRect(),m=g.getTransform(),sx=r.width/c.width,sy=r.height/c.height;
 return (window.PARTY_HUD_EXCLUSIONS||[]).map(box=>({x:(box.left-r.left-m.e*sx)/(m.a*sx),y:(box.top-r.top-m.f*sy)/(m.d*sy),w:box.width/(m.a*sx),h:box.height/(m.d*sy)})).filter(box=>Number.isFinite(box.x)&&box.w>0&&box.h>0);
}
function fieldLabel(value,x,y,color='#faf7ff'){
 // Snake's reserved camera scales its unchanged world; identity cards retain
 // their existing CSS size rather than inheriting that world reduction.
 const scale=Math.max(.1,state?.mode==='snakelines'?arcadeCamera.scale*c.clientWidth/c.width:Math.min(c.clientWidth/1200,c.clientHeight/720)),sx=scale,sy=scale,size=14;const renderedWidth=1200*scale,renderedHeight=720*scale;
 g.save();g.font=`550 ${size}px HeyPalsText,system-ui`;g.textAlign='center';g.textBaseline='middle';
 const limit=Math.min(154,renderedWidth*.24),letters=Array.from(String(value));let label=letters.join('');
 while(letters.length&&g.measureText(label).width>limit){letters.pop();label=letters.join('')+'…';}
 const w=g.measureText(label).width+12,h=22;
 const px=Math.max(w/2+3,Math.min(renderedWidth-w/2-3,x*sx));let py=Math.max(h/2+3,Math.min(renderedHeight-h/2-3,y*sy));
 for(const box of hudWorldRects())if(px/sx+w/2/sx>box.x&&px/sx-w/2/sx<box.x+box.w&&py/sy+h/2/sy>box.y&&py/sy-h/2/sy<box.y+box.h)py=Math.min(renderedHeight-h/2-3,(box.y+box.h)*sy+h/2+8);
 g.translate(px/sx,py/sy);g.scale(1/sx,1/sy);g.shadowBlur=0;
 g.fillStyle='#211d32eb';g.beginPath();g.roundRect(-w/2,-h/2,w,h,7);g.fill();
 g.fillStyle=color;g.fillText(label,0,0);g.restore();
}

const reducedArtMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;let visualLast=performance.now(),visualKey='',visualPoints=new Map();
// Moving clusters keep stable, readable name cards after all character art.
const clusterLabelSlots=new Map();let clusterLabelScene='';
function drawClusterLabels(s){
 const rect=c.getBoundingClientRect(),m=g.getTransform(),scale=Math.max(.25,Math.min(rect.width/c.width,rect.height/c.height)*Math.hypot(m.a,m.b)),font=14/scale,gap=5/scale;
 const fit=Math.min(rect.width/c.width,rect.height/c.height),originY=rect.top+(rect.height-c.height*fit)/2+m.f*fit,rootStyle=getComputedStyle(document.documentElement);
 const hud=s.mode==='hungry'?Math.max(0,...['--party-stage-inset-top','--party-native-inset-top'].map(key=>parseFloat(rootStyle.getPropertyValue(key))||0)):0;
 const safeTop=hud?Math.max(10/scale,(hud+12-originY)/scale):10/scale;
 const key=s.mode+':'+s.round+':'+s.phase+':'+scale.toFixed(3)+':'+safeTop.toFixed(2);if(key!==clusterLabelScene){clusterLabelScene=key;clusterLabelSlots.clear();}
 const players=s.players.filter(p=>s.mode==='hungry'?p.dead<=0:s.mode==='flappy'?p.alive:true),radius=p=>s.mode==='hungry'?Math.sqrt(p.mass)*3.6+4:34;
 const entries=players.map(p=>({p,kind:'name',value:p.name,offset:-(radius(p)+18/scale)}));
 if(s.mode==='hungry')entries.push(...players.map(p=>({p,kind:'mass',value:Math.round(p.mass),offset:radius(p)+18/scale})));
 const exclusions=hudWorldRects(),placed=[],overlap=(a,b)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
 const hitsBody=(r,p)=>{const x=Math.max(r.x,Math.min(p.x,r.x+r.w)),y=Math.max(r.y,Math.min(p.y,r.y+r.h));return Math.hypot(x-p.x,y-p.y)<radius(p)+3/scale;};
 g.save();g.font=`550 ${font}px KardiaFit,HeyPalsText,system-ui`;g.textAlign='center';g.textBaseline='middle';g.shadowBlur=0;
 for(const entry of entries){
  const {p,kind}=entry,id=p.id+':'+kind,letters=Array.from(String(entry.value));let label=letters.join('');
  while(letters.length&&g.measureText(label).width>154/scale){letters.pop();label=letters.join('')+'…';}
  const w=g.measureText(label).width+12/scale,h=22/scale,preferred={x:p.x-w/2,y:p.y+entry.offset-h/2,w,h},previous=clusterLabelSlots.get(id);
  const constrain=r=>({...r,x:Math.max(10/scale,Math.min(1200-10/scale-w,r.x)),y:Math.max(safeTop,Math.min(720-10/scale-h,r.y))});
  const collisions=r=>placed.filter(q=>overlap(r,q)).length+players.filter(q=>hitsBody(r,q)).length+exclusions.filter(q=>overlap(r,q)).length+(s.mode==='carryball'&&hitsBody(r,{x:s.ball.x,y:s.ball.y})?1:0);
  let best=previous?constrain({x:p.x+previous.dx,y:p.y+previous.dy,w,h}):null;
  if(!best||collisions(best)){
   const candidates=[preferred];
   for(let ring=0;ring<12;ring++)for(const a of[-Math.PI/2,Math.PI/2,0,Math.PI,-Math.PI/4,-3*Math.PI/4,Math.PI/4,3*Math.PI/4]){const distance=radius(p)+h*.8+10/scale+ring*(h+8/scale);candidates.push({x:p.x+Math.cos(a)*distance-w/2,y:p.y+Math.sin(a)*distance-h/2,w,h});}
   let cost=Infinity;
   for(const candidate of candidates){const r=constrain(candidate),travel=Math.hypot(r.x-preferred.x,r.y-preferred.y),continuity=previous?Math.hypot(r.x-(p.x+previous.dx),r.y-(p.y+previous.dy)):0,value=collisions(r)*1e9+travel*travel+continuity*font*2;if(value<cost){best=r;cost=value;}}
  }
  placed.push({...best,p,kind,label});clusterLabelSlots.set(id,{dx:best.x-p.x,dy:best.y-p.y});
 }
 const ids=new Set(entries.map(e=>e.p.id+':'+e.kind));for(const id of clusterLabelSlots.keys())if(!ids.has(id))clusterLabelSlots.delete(id);
 for(const r of placed){const x=r.x+r.w/2,y=r.y+r.h/2,dx=x-r.p.x,dy=y-r.p.y,d=Math.hypot(dx,dy);if(r.kind==='name'&&d>radius(r.p)+38/scale){g.strokeStyle=r.p.color;g.globalAlpha=.4;g.lineWidth=1/scale;g.beginPath();g.moveTo(r.p.x+dx/d*radius(r.p),r.p.y+dy/d*radius(r.p));g.lineTo(x,y);g.stroke();}}
 g.globalAlpha=1;
 for(const r of placed){g.fillStyle='#211d32eb';g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,7/scale);g.fill();g.fillStyle=r.kind==='mass'?r.p.color:'#faf7ff';g.fillText(r.label,r.x+r.w/2,r.y+r.h/2);}
 g.restore();window.ArcadeNameLabels=placed.map(r=>({id:r.p.id,kind:r.kind,text:r.label,x:r.x,y:r.y,w:r.w,h:r.h,pixelFont:14,anchorX:r.p.x,anchorY:r.p.y,scale,safeTop}));
}
function visualState(raw){const now=performance.now(),dt=Math.min(.05,(now-visualLast)/1000);visualLast=now;const key=raw.mode+':'+raw.round+':'+raw.phase+(raw.mode==='carryball'?':'+JSON.stringify(raw.visibleHudLayout||null):'');if(key!==visualKey){visualPoints.clear();visualKey=key;}const alpha=1-Math.exp(-24*dt);function point(id,p){let q=visualPoints.get(id);if(!q||Math.hypot(p.x-q.x,p.y-q.y)>180)q={x:p.x,y:p.y,progress:p.progress||0};q.x+=(p.x-q.x)*alpha;q.y+=(p.y-q.y)*alpha;q.progress+=((p.progress||0)-q.progress)*alpha;visualPoints.set(id,q);return {...p,...q};}return {...raw,players:raw.players.map(p=>point(p.id,p)),...(raw.ball?{ball:point('ball',raw.ball)}:{})};}

const trailCanvas=document.createElement('canvas');trailCanvas.width=1200;trailCanvas.height=720;const trailCtx=trailCanvas.getContext('2d');let trailScene='',trailLengths=new Map();function paintTrails(s){const key=s.round+':'+s.phase+':'+c.width+':'+c.height;if(key!==trailScene||s.players.some(p=>(trailLengths.get(p.id)||0)>p.trail.length)){trailCanvas.width=c.width;trailCanvas.height=c.height;trailCtx.setTransform(c.width/1200,0,0,c.height/720,0,0);trailLengths.clear();trailScene=key;}for(const p of s.players){const n=trailLengths.get(p.id)||0;if(p.trail.length<=n)continue;trailCtx.strokeStyle=p.color;trailCtx.lineJoin='round';trailCtx.lineCap='round';trailCtx.beginPath();for(let i=Math.max(0,n-1);i<p.trail.length;i++){const t=p.trail[i];i===Math.max(0,n-1)?trailCtx.moveTo(t.x,t.y):trailCtx.lineTo(t.x,t.y);}trailCtx.globalAlpha=.13;trailCtx.lineWidth=18;trailCtx.stroke();trailCtx.globalAlpha=1;trailCtx.lineWidth=6;trailCtx.stroke();trailCtx.strokeStyle='#ffffff59';trailCtx.lineWidth=1.6;trailCtx.stroke();trailLengths.set(p.id,p.trail.length);}g.drawImage(trailCanvas,0,0,1200,720);}

// Feedback follows authoritative event changes; simulation time freezes it on pause.
let feedbackState=null,feedbackKey='',feedbackBursts=[];
function drawFeedback(s){
 const key=s.mode+':'+s.round+':'+s.phase;
 if(key!==feedbackKey){feedbackBursts=[];feedbackState=null;feedbackKey=key;}
 const burst=(x,y,color,strength=1,kind='impact')=>{feedbackBursts.push({x,y,color,strength,kind,time:s.time});if(feedbackBursts.length>20)feedbackBursts.shift();};
 const feel=(type,x,y,color,intensity=.45)=>globalThis.LocalPartyFeel?.emit(type,{id:`arcade:${s.mode}:${s.round}:${++drawFeedback.serial}`,x:x/1200,y:y/720,color,intensity,shake:s.mode!=='hungry'&&!['score','shot'].includes(type)});
 if(state!==feedbackState){
  if(feedbackState&&s.phase==='playing'){
   for(const p of s.players){const old=feedbackState.players.find(q=>q.id===p.id);if(!old)continue;
    if(s.mode==='hungry'&&p.mass>old.mass+.5){burst(p.x,p.y,p.color,.55,'absorb');feel('score',p.x,p.y,p.color,.35);}
    if(s.mode==='hungry'&&old.dead<=0&&p.dead>0)feel('elimination',p.x,p.y,p.color,.65);
    if(['flappy','snakelines'].includes(s.mode)&&old.alive&&!p.alive){burst(p.x,p.y,p.color,1,'break');feel('collision',p.x,p.y,p.color,.58);}
    if(s.mode==='punchmeter'&&p.hits.length>old.hits.length){const pose=punchBagPose(s.bag),x=pose.x,y=pose.y+200*pose.scale;burst(x,y,p.color,1.5);feel('hit',x,y,p.color,.68);}
   }
   if(s.mode==='taprace'){const leader=[...s.players].sort((a,b)=>b.score-a.score)[0],oldLeader=[...feedbackState.players].sort((a,b)=>b.score-a.score)[0];if(leader&&oldLeader&&leader.id!==oldLeader.id)feel('score',leader.x||600,leader.y||360,leader.color,.28);}
   if(s.mode==='carryball'){
    if(s.teams[0]>feedbackState.teams[0]){burst(1180,360,'#b9ff4d',2,'goal');feel('score',1180,360,'#b9ff4d',.75);}
    if(s.teams[1]>feedbackState.teams[1]){burst(20,360,'#c295ff',2,'goal');feel('score',20,360,'#c295ff',.75);}
    if(feedbackState.ball.owner&&!s.ball.owner){burst(s.ball.x,s.ball.y,'#fff1c7',.5,'pass');feel('collision',s.ball.x,s.ball.y,'#fff1c7',.38);}
   }
  }
  feedbackState=state;
 }
 feedbackBursts=feedbackBursts.filter(b=>s.time-b.time<.7);
 g.save();for(const b of feedbackBursts){
  const t=Math.max(0,(s.time-b.time)/.7),ease=1-Math.pow(1-t,3),absorb=b.kind==='absorb';
  g.globalAlpha=Math.pow(1-t,2);g.strokeStyle=b.color;g.fillStyle=b.color;g.lineWidth=2.5*(1-t)+.5;
  g.beginPath();g.arc(b.x,b.y,8+(absorb?1-ease:ease)*(reducedArtMotion?9:45)*b.strength,0,Math.PI*2);g.stroke();
  if(reducedArtMotion)continue;
  const count=b.kind==='goal'?18:b.kind==='impact'?12:8;
  for(let i=0;i<count;i++){
   const a=i*Math.PI*2/count+b.time,d=(absorb?1-ease:ease)*55*b.strength;
   const x=b.x+Math.cos(a)*d,y=b.y+Math.sin(a)*d+(absorb||b.kind==='pass'?0:t*t*55);
   g.save();g.translate(x,y);g.rotate(a+t*(i%2?4:-4));
   if(b.kind==='impact'||b.kind==='pass'){g.fillStyle=i%2?b.color:'#fff7d9';g.fillRect(-8*(1-t),-1.5,16*(1-t),3);}
   else if(absorb){g.beginPath();g.arc(0,0,2+3*(1-t),0,Math.PI*2);g.fill();}
   else{g.beginPath();g.moveTo(-4,-3);g.lineTo(5,-2);g.lineTo(1,5);g.closePath();g.fill();}
   g.restore();
  }
  if(b.kind==='impact'&&t<.24){g.globalAlpha=(1-t/.24)*.85;g.fillStyle='#fff9dd';g.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=(i%2?8:28)*b.strength*(1+t);const x=b.x+Math.cos(a)*r,y=b.y+Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();}
 }g.restore();
}

// TV camera fits the entire authoritative world uniformly; only scenery fills unused edges.
let arcadeCamera={scale:1,x:0,y:0};
function beginArcadeFrame(){
 const r=c.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1),limit=Math.min(dpr,Math.sqrt(5000000/Math.max(1,r.width*r.height))),w=Math.max(1,Math.round(r.width*limit)),h=Math.max(1,Math.round(r.height*limit));
 if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
 g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);
 // Action stages fit uniformly below the cap; full-field scenes continue underneath it.
 const hud=!['taprace','carryball'].includes(state?.mode)&&document.documentElement.classList.contains('party-display-only')?parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--party-hud-bottom'))||0:0;
 const safeTop=hud>0?(hud+16)*limit:0;
 const scale=Math.min(w/1200,Math.max(1,h-safeTop)/720),x=(w-1200*scale)/2,y=safeTop+(h-safeTop-720*scale)/2;arcadeCamera={scale,x,y};
 if(state?.mode==='taprace'){g.setTransform(w/1200,0,0,h/720,0,0);arcadeCamera={scale:h/720,x:0,y:0};}
 else g.setTransform(scale,0,0,scale,x,y);
 g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 window.ArcadeCamera={world:{width:1200,height:720},scale:scale/limit,x:x/limit,y:y/limit,safeTop:safeTop/limit,viewport:{width:r.width,height:r.height},uniform:state?.mode!=='taprace',responsiveLanes:state?.mode==='taprace'};
 publishCarryHudLayout(r,limit);
}
function publishCarryHudLayout(rect,limit){
 if(state?.mode!=='carryball'||!document.documentElement.classList.contains('party-display-only')||ws?.readyState!==1)return;
 const scale=arcadeCamera.scale/limit,left=rect.left+arcadeCamera.x/limit,top=rect.top+arcadeCamera.y/limit;
 // Small screen-pixel clearance covers subpixel field effects between measured packets.
 const clearance=2,exclusions=(window.PARTY_HUD_EXCLUSIONS||[]).map(box=>({x:(box.left-clearance-left)/scale,y:(box.top-clearance-top)/scale,w:(box.width+clearance*2)/scale,h:(box.height+clearance*2)/scale}));
 const layout={width:1200,height:720,exclusions},signature=JSON.stringify(layout),now=performance.now();
 // Retry measured geometry after pause/reconnect; the server accepts only this host's newest sequence.
 if(signature===carryHudSignature&&now-carryHudSentAt<1000)return;
 carryHudSignature=signature;carryHudSentAt=now;send('responsiveHudInsets',{sequence:++carryHudSequence,...layout});
}
// Static world material is cached at the display backing resolution, never per entity.
const environment=document.createElement('canvas');let environmentKey='';
const arcadeScenery={};for(const [key,file]of Object.entries({hungry:'hungry-floor.png',carryball:'carryball-pitch.png',taprace:'taprace-track.png',flappy:'flappy-sky.png',punchmeter:'/assets/gameplay/round3/2026-10-03/punch-gym-v1.png'})){const img=new Image();img.onload=()=>{environmentKey='';};img.src=file.startsWith('/')?file:'assets/'+file;arcadeScenery[key]=img;}
function croppedMaterial(q,img,sx,sy,sw,sh,x,y,w,h){if(!img?.complete||!img.naturalWidth)return false;const ratio=Math.max(w/sw,h/sh),dw=sw*ratio,dh=sh*ratio;q.save();q.beginPath();q.rect(x,y,w,h);q.clip();q.drawImage(img,sx,sy,sw,sh,x+(w-dw)/2,y+(h-dh)/2,dw,dh);q.restore();return true;}
function paintWorldMargins(q,s){
 const {x,y,scale}=arcadeCamera;if(s.mode==='taprace'||!x&&!y)return;
 q.save();q.setTransform(1,0,0,1,0,0);
 // Continuous arena material reaches the stage edge. Only the outside wall darkens gradually.
 if(['hungry','carryball','snakelines'].includes(s.mode)){
  const wall=(a,b)=>{const shade=q.createLinearGradient(a,0,b,0);shade.addColorStop(0,'#07101a00');shade.addColorStop(1,'#07101a88');q.fillStyle=shade;q.fillRect(Math.min(a,b),0,Math.abs(b-a),c.height);};
  if(x){wall(x,0);wall(c.width-x,c.width);}if(y){const shade=q.createLinearGradient(0,y,0,0);shade.addColorStop(0,'#07101a00');shade.addColorStop(1,'#07101a88');q.fillStyle=shade;q.fillRect(0,0,c.width,y);}
 }q.restore();
}
const runnerGaits=new Map(),runnerFacing=new Map();
function runnerArt(x,y,size,p,time){
 const art=window.PartyArt,body=art?.sprite('runner-body-v2',p.color),near=art?.sprite('runner-leg-near-v2',p.color),far=art?.sprite('runner-leg-far-v2',p.color);
 const speed=Math.hypot(p.vx||0,p.vy||0),now=window.PARTY_GAME_CLOCK?.now?.()??performance.now();let gait=runnerGaits.get(p.id);
 if(!gait){gait={t:now,phase:0};runnerGaits.set(p.id,gait);}const dt=Math.min(.05,Math.max(0,(now-gait.t)/1000));gait.t=now;gait.phase+=reducedArtMotion||speed<2?0:dt*(4+Math.min(17,speed*.055));
 const run=Math.min(1,speed/150),step=Math.sin(gait.phase),bob=reducedArtMotion?0:-Math.abs(step)*size*.028*run;
 g.save();g.translate(x,y+size*.43);g.scale(size*.38,size*.10);const shadow=g.createRadialGradient(0,0,0,0,0,1);shadow.addColorStop(0,'#030b1855');shadow.addColorStop(1,'#030b1800');g.fillStyle=shadow;g.fillRect(-1,-1,2,2);g.restore();
 if(!body||!near||!far){const source=art?.sprite('runner',p.color);return source?art.draw(g,'runner',x,y, size*source.w/source.h,size,{color:p.color}):false;}
 const bh=size*.7,bw=bh*body.w/body.h,rig=art.manifest.frames['runner-body-v2'].rig;
 g.save();g.translate(x,y+size*.13+bob);g.rotate(reducedArtMotion?0:run*.08+step*.018*run);
 const leg=(key,part,hip,phase,alpha=1)=>{const lh=bh*(key.includes('near')?rig.nearLegHeightRatio:rig.farLegHeightRatio);art.draw(g,key,(hip.x-.5)*bw,(hip.y-1)*bh,lh*part.w/part.h,lh,{color:p.color,rotation:.52+(reducedArtMotion?0:Math.sin(phase)*.57*run),alpha});};
 leg('runner-leg-far-v2',far,rig.farHip,gait.phase+Math.PI,.88);
 art.draw(g,'runner-body-v2',0,0,bw,bh,{color:p.color,pivot:{x:.5,y:1}});
 leg('runner-leg-near-v2',near,rig.nearHip,gait.phase);
 g.restore();return true;
}
drawFeedback.serial=0;
function tapTrackGeometry(count){const lanes=Math.max(2,count),height=570,h=height/lanes;return {lanes,h,top:(720-height)/2,height};}
function tapRaceRunnerLayout(p,index,count){
 const {h,top}=tapTrackGeometry(count),y=top+h*(index+.5),size=Math.min(108,h*.82),x=185+Math.min(1,p.progress/2000)*900;
 const bubbleHeight=Math.max(20,Math.min(34,h-10)),nameLength=Array.from(String(p.name||'')).length,bubbleWidth=Math.max(68,Math.min(98,46+nameLength*5.5));
 return {h,top,laneTop:top+h*index,y,size,x,rearX:x-size*.14,bubble:{x:30,y:y-bubbleHeight/2,width:bubbleWidth,height:bubbleHeight,radius:bubbleHeight/2}};
}
function drawTapRace(s){
 const {h,top}=tapTrackGeometry(s.players.length),now=(window.PARTY_GAME_CLOCK?.now?.()??performance.now())/1000;
 const stretch=state.mode==='taprace'?Math.max(.1,(c.clientWidth/c.clientHeight)/(1200/720)):1;
 for(let i=0;i<s.players.length;i++){
  const p=s.players[i],layout=tapRaceRunnerLayout(p,i,s.players.length),{y,size,x,rearX,bubble}=layout,fast=Math.max(0,Math.min(1,((p.vx||0)-95)/130));
  // Screen-space badges: the wide track may stretch, but type and circles must not.
  const sx=Math.max(.1,c.clientWidth/1200),sy=Math.max(.1,c.clientHeight/720),density=Math.max(1,Math.min(1.5,c.clientWidth/1232)),bh=Math.max(18,Math.min(34*density,h*sy-6)),bw=Math.max(60,(145-bubble.x)*sx-10);
  g.save();g.translate(bubble.x,y);g.scale(1/sx,1/sy);g.fillStyle='#211d35';g.strokeStyle='#c6b6ef66';g.lineWidth=1;g.beginPath();g.roundRect(0,-bh/2,bw,bh,Math.min(12*density,bh/2));g.fill();g.stroke();
  const badge=Math.min(9*density,bh*.27);g.fillStyle=p.color;g.beginPath();g.arc(8*density+badge,0,badge,0,Math.PI*2);g.fill();
  const fontSize=bh>=26*density?14*density:12,left=16*density+badge*2,available=bw-left-7*density;g.fillStyle='#faf7ff';g.textAlign='left';g.textBaseline='middle';g.font=`600 ${fontSize}px HeyPalsText,system-ui`;
  let name=String(p.name||'');if(g.measureText(name).width>available){const letters=Array.from(name);while(letters.length&&g.measureText(letters.join('')+'…').width>available)letters.pop();name=letters.join('')+'…';}g.fillText(name,left,.5);g.restore();
  if(fast>0&&!reducedArtMotion){g.save();g.beginPath();g.rect(148,top+i*h,977,h);g.clip();for(let j=0;j<5;j++){const t=(now*(2+j*.1)+j*.23)%1,yy=y+(j-2)*size*.11;const len=(25+fast*90)*(1-t),end=rearX-2;const tail=g.createLinearGradient(end-len,yy,end,yy);tail.addColorStop(0,'#0000');tail.addColorStop(1,p.color);g.strokeStyle=tail;g.globalAlpha=fast*(1-t)*.45;g.lineWidth=j===2?3:1.5;g.beginPath();g.moveTo(end-len,yy);g.lineTo(end,yy);g.stroke();}g.restore();}
  // The track fills wide TVs, but runners keep the same proportions as their art.
  g.save();g.translate(x,y);g.scale(1/stretch,1);g.translate(-x,-y);
  if(!runnerArt(x,y,size,p,s.time))circle(x,y,Math.min(17,h*.3),p.color);g.restore();
 }
}
let carryScores=[0,0],carryGoalTimes=[-10,-10];
function drawCarryScene(s){
 for(let team=0;team<2;team++)if(s.teams[team]>carryScores[team])carryGoalTimes[1-team]=s.time;
 carryScores=[...s.teams];
 g.strokeStyle='#d4fff02b';g.lineWidth=2;g.beginPath();g.roundRect(20,20,1160,680,32);g.stroke();g.beginPath();g.moveTo(600,20);g.lineTo(600,700);g.stroke();
 for(let side=0;side<2;side++){
  const age=s.time-carryGoalTimes[side],pulse=age>=0&&age<1?Math.sin(age*24)*Math.exp(-age*4):0,color=side?'#b398ff':'#c6ff79';
  g.save();g.translate(side?1200:0,0);g.scale(side?-1:1,1);
  g.fillStyle='#050f2470';g.beginPath();g.roundRect(4,242,48,248,12);g.fill();
  const net=g.createLinearGradient(0,0,50,0);net.addColorStop(0,'#123342e8');net.addColorStop(1,'#143d4033');g.fillStyle=net;g.fillRect(5,245,38,230);
  g.strokeStyle=side?'#b9abed5c':'#c6ec9566';g.lineWidth=1;g.beginPath();
  for(let y=250;y<480;y+=16){g.moveTo(6,y);g.quadraticCurveTo(22+Math.abs(pulse)*12,y+3,43,y);}
  for(let x=8;x<44;x+=9){g.moveTo(x,244);g.quadraticCurveTo(x+Math.abs(pulse)*12,360,x,476);}g.stroke();
  g.strokeStyle='#314c5a';g.lineWidth=9;g.lineJoin='round';g.beginPath();g.moveTo(7,477);g.lineTo(43,477);g.lineTo(43,243);g.lineTo(7,243);g.stroke();
  g.strokeStyle=color;g.lineWidth=3;g.shadowColor=color;g.shadowBlur=9+Math.abs(pulse)*18;g.beginPath();g.moveTo(8,475);g.lineTo(42,475);g.lineTo(42,245);g.lineTo(8,245);g.stroke();g.shadowBlur=0;
  for(const y of [244,476]){g.fillStyle='#d7eced';g.beginPath();g.ellipse(42,y,5,7,0,0,Math.PI*2);g.fill();}
  g.restore();
 }
 for(const p of s.players){
  if(Math.abs(p.vx||0)>.08)runnerFacing.set(p.id,p.vx<0?-1:1);const facing=runnerFacing.get(p.id)||1;
  g.save();g.translate(p.x,p.y);g.scale(facing,1);if(!runnerArt(0,0,64,p,s.time))circle(0,0,15,p.color);g.restore();
 }
 g.save();g.translate(s.ball.x+2,s.ball.y+8);g.scale(18,9);const ballShadow=g.createRadialGradient(0,0,0,0,0,1);ballShadow.addColorStop(0,'#030d2345');ballShadow.addColorStop(1,'#030d2300');g.fillStyle=ballShadow;g.fillRect(-1,-1,2,2);g.restore();
 if(!window.PartyArt?.draw(g,'ball',s.ball.x,s.ball.y,26,26,{rotation:reducedArtMotion?0:(s.ball.x+s.ball.y)*.035}))circle(s.ball.x,s.ball.y,10,'#fff1c7');
 drawClusterLabels(s);
}
function paintTapArena(q,s){
 const {lanes,h,top,height}=tapTrackGeometry(s.players.length);
 // Raised running deck and its continuous illuminated safety edges.
 q.save();q.fillStyle='#1e2438';q.fillRect(145,top-8,1005,height+16);q.restore();
 croppedMaterial(q,arcadeScenery.taprace,300,265,950,55,145,top,1005,height);q.fillStyle='#08121e75';q.fillRect(145,top,1005,height);
 for(let i=0;i<lanes;i++){
  const y=top+i*h,material=q.createLinearGradient(0,y,0,y+h);material.addColorStop(0,i%2?'#20374a':'#263e50');material.addColorStop(.46,'#152b3b');material.addColorStop(1,'#1d3046');q.fillStyle=i%2?'#090e2638':'#5d4d8826';q.fillRect(160,y,965,h);
  q.strokeStyle='#bdedff13';q.lineWidth=1;for(let x=176;x<1120;x+=64){q.beginPath();q.moveTo(x,y+3);q.lineTo(x,y+h-3);q.stroke();}
  q.fillStyle='#9fd6ec1b';for(let x=220;x<1080;x+=135){q.beginPath();q.moveTo(x,y+h/2-5);q.lineTo(x+8,y+h/2);q.lineTo(x,y+h/2+5);q.lineTo(x+3,y+h/2);q.closePath();q.fill();}
  if(i){q.strokeStyle='#9edbf23a';q.beginPath();q.moveTo(160,y);q.lineTo(1125,y);q.stroke();}
 }
 for(const y of [top-8,top+height+8]){q.save();q.strokeStyle=y<360?'#8cf5e4':'#ad95ff';q.lineWidth=3;q.shadowBlur=14;q.shadowColor=q.strokeStyle;q.beginPath();q.moveTo(163,y);q.lineTo(1130,y);q.stroke();q.restore();}
 q.fillStyle='#b5fff139';q.fillRect(165,top,3,height);q.fillStyle='#071521';q.fillRect(1110,top,30,height);
 for(let row=0;row<Math.ceil(height/12);row++)for(let col=0;col<2;col++){q.fillStyle=(row+col)%2?'#203d48':'#d9fff2';q.fillRect(1110+col*15,top+row*12,15,Math.min(12,height-row*12));}
}
function paintEnvironment(s){
 const key=s.mode+':'+s.players.length+':'+c.width+':'+c.height+':'+arcadeCamera.scale+':'+arcadeCamera.x+':'+arcadeCamera.y;
 if(key!==environmentKey){environmentKey=key;environment.width=c.width;environment.height=c.height;
 const q=environment.getContext('2d'),camera=arcadeCamera;
 q.setTransform(1,0,0,1,0,0);if(s.mode!=='taprace'){q.fillStyle=s.mode==='flappy'?'#282047':s.mode==='hungry'?'#231d38':s.mode==='carryball'?'#1b2933':'#141d2a';q.fillRect(0,0,c.width,c.height);}
 const gym=arcadeScenery.punchmeter,gymReady=s.mode==='punchmeter'&&gym.complete&&gym.naturalWidth;
 if(gymReady){const ratio=Math.max(c.width/gym.naturalWidth,c.height/gym.naturalHeight),w=gym.naturalWidth*ratio,h=gym.naturalHeight*ratio;q.drawImage(gym,(c.width-w)/2,(c.height-h)/2,w,h);}
 if(s.mode==='taprace')q.setTransform(c.width/1200,0,0,c.height/720,0,0);else q.setTransform(camera.scale,0,0,camera.scale,camera.x,camera.y);
 const extend=['punchmeter','flappy','hungry','carryball','snakelines'].includes(s.mode),extraX=extend?camera.x/camera.scale:0,extraY=extend?camera.y/camera.scale:0;
 q.save();q.beginPath();q.rect(-extraX,-extraY,1200+extraX*2,720+extraY*2);q.clip();
 const palette={taprace:['#203845','#14222d'],punchmeter:['#252e43','#101924'],flappy:['#193e58','#2c6771'],hungry:['#244341','#142d30'],snakelines:['#202841','#111b2b'],carryball:['#244b42','#15352f']}[s.mode];
 if(s.mode!=='taprace'&&!gymReady){
  const bg=q.createLinearGradient(0,0,0,720);bg.addColorStop(0,palette[0]);bg.addColorStop(1,palette[1]);q.fillStyle=bg;q.fillRect(-extraX,-extraY,1200+extraX*2,720+extraY*2);
  const glow=q.createRadialGradient(600,160,20,600,160,720);glow.addColorStop(0,'#caffdc12');glow.addColorStop(1,'#00000000');q.fillStyle=glow;q.fillRect(s.mode==='punchmeter'?-extraX:0,s.mode==='punchmeter'?-extraY:0,1200+(s.mode==='punchmeter'?extraX*2:0),720+(s.mode==='punchmeter'?extraY*2:0));
 }
 if(s.mode==='taprace')paintTapArena(q,s);
 if(s.mode==='punchmeter'){
  if(!gymReady){
  q.fillStyle='#0a142294';q.fillRect(-extraX,480,1200+extraX*2,240+extraY);
  q.strokeStyle='#7897ae24';q.lineWidth=2;for(let x=-400;x<1600;x+=160){const startX=600+(x-600)*.45;q.beginPath();q.moveTo(startX,480);q.lineTo(x+(x-startX)*extraY/240,720+extraY);q.stroke();}for(const y of [500,540,600,690]){q.beginPath();q.moveTo(-extraX,y);q.lineTo(1200+extraX,y);q.stroke();}
  }
  for(const x of [70,1110]){q.fillStyle='#566e8030';q.fillRect(x,110,20,375);q.fillStyle='#b9e2e942';q.beginPath();q.roundRect(x-14,95,48,15,6);q.fill();}
  q.strokeStyle='#899cab26';q.lineWidth=5;for(const y of [335,395,455]){q.beginPath();q.moveTo(80,y);q.lineTo(1120,y);q.stroke();}
  q.save();q.translate(600,594);q.scale(150,24);const shadow=q.createRadialGradient(0,0,.15,0,0,1);shadow.addColorStop(0,'#020916a0');shadow.addColorStop(1,'#02091600');q.fillStyle=shadow;q.fillRect(-1,-1,2,2);q.restore();
  q.fillStyle='#bac4ce';q.beginPath();q.roundRect(565,57,70,15,6);q.fill();
 }
 if(s.mode==='flappy'){
  for(let i=0;i<12;i++){const x=i*115;q.fillStyle=i%2?'#244753':'#254c59';q.beginPath();q.moveTo(x-100,690);q.quadraticCurveTo(x+40,500+(i%3)*40,x+170,690);q.fill();}
  q.fillStyle='#162f3f';q.fillRect(0,704,1200,16);q.fillStyle='#82b99c';q.fillRect(0,701,1200,3);
 }
 if(s.mode==='hungry'){
  croppedMaterial(q,arcadeScenery.hungry,350,190,970,530,-extraX,-extraY,1200+extraX*2,720+extraY*2);q.fillStyle='#18162f40';q.fillRect(-extraX,-extraY,1200+extraX*2,720+extraY*2);
  q.strokeStyle='#b9dfc008';q.lineWidth=1;for(let y=Math.floor(-extraY/48)*48;y<720+extraY;y+=48)for(let x=Math.floor(-extraX/48)*48;x<1200+extraX;x+=48){q.strokeRect(x,y,48,48);q.fillStyle='#caf3d40b';q.fillRect(x+23,y+23,2,2);}
 }
 if(s.mode==='snakelines')window.paintSnakeArena?.(q,s,{extraX,extraY});
 if(s.mode==='carryball'){
  croppedMaterial(q,arcadeScenery.carryball,410,180,230,125,-extraX,-extraY,1200+extraX*2,720+extraY*2);q.fillStyle='#10201975';q.fillRect(-extraX,-extraY,1200+extraX*2,720+extraY*2);
  for(let x=20;x<1180;x+=116){q.fillStyle=Math.floor((x-20)/116)%2?'#ffffff05':'#00000008';q.fillRect(x,20,116,680);}
  q.strokeStyle='#d7f4d442';q.lineWidth=2;q.beginPath();q.arc(600,360,104,0,Math.PI*2);q.stroke();q.fillStyle='#e2f8d8';q.beginPath();q.arc(600,360,3,0,Math.PI*2);q.fill();
  q.strokeRect(20,190,145,340);q.strokeRect(1035,190,145,340);
  for(const x of [0,1155]){q.fillStyle=x?'#a583e020':'#bbff6420';q.fillRect(x,240,45,240);q.strokeStyle='#edffe52c';q.lineWidth=1;for(let y=250;y<480;y+=16){q.beginPath();q.moveTo(x,y);q.lineTo(x+45,y);q.stroke();}for(let a=x+8;a<x+45;a+=12){q.beginPath();q.moveTo(a,240);q.lineTo(a,480);q.stroke();}}
 }
 window.ArcadeJuice?.environment(q,s);
 q.restore();paintWorldMargins(q,s);
 // The authored sky is decorative: cover the complete backing, including beside the cap.
 // Ambient hills, pipes and players retain their existing uniform world projection.
 const skyArt=arcadeScenery.flappy;
 if(s.mode==='flappy'&&skyArt.complete&&skyArt.naturalWidth){q.save();q.setTransform(1,0,0,1,0,0);const ratio=Math.max(c.width/skyArt.naturalWidth,c.height/skyArt.naturalHeight),w=skyArt.naturalWidth*ratio,h=skyArt.naturalHeight*ratio;q.drawImage(skyArt,(c.width-w)/2,(c.height-h)/2,w,h);q.fillStyle='#17142e3d';q.fillRect(0,0,c.width,c.height);q.restore();}
 }
 // Paint backing pixels directly so decorative extensions do not inherit world projection.
 g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(environment,0,0);g.restore();
}
function flappyPipeMaterial(x){const material=g.createLinearGradient(x-32,0,x+32,0);for(const [stop,color]of [[0,'#286c39'],[.18,'#73c65e'],[.38,'#99df78'],[.72,'#4c9d43'],[1,'#245a32']])material.addColorStop(stop,color);return material;}
function extendFlappyPipes(s){
 // Only upper pipe paint crosses the world clip. Gaps, birds and collision bounds stay unchanged.
 const top=-arcadeCamera.y/arcadeCamera.scale-8;
 for(const pipe of s.pipes||[]){g.fillStyle=flappyPipeMaterial(pipe.x);g.fillRect(pipe.x-32,top,64,-top);}
}
// Countdown dimming belongs to the whole display, outside the authoritative world clip.
// Food animation follows identity, never the mutable network array position.
function hungryFoodY(food,clock,reduced){const phase=Number.isFinite(food.id)?food.id:food.x*.13+food.y*.17;return food.y+(reduced?0:Math.sin(clock/430+phase*1.7)*2.5);}
function drawArcadeCountdown(context,s,canvas){
 context.save();context.setTransform(1,0,0,1,0,0);context.fillStyle='#0b081899';context.fillRect(0,0,canvas.width,canvas.height);context.restore();
 context.save();
 if(window.ArcadeJuice)window.ArcadeJuice.countdown(context,s);
 else{context.textAlign='center';context.fillStyle='#fff';context.font='900 116px Rubik,system-ui';context.fillText(String(Math.ceil(s.countdown)),600,380);context.font='700 28px Rubik,system-ui';context.fillText('Get ready to flap',600,440);}
 context.restore();
}
function draw(){beginArcadeFrame();if(state){window.ArcadeJuice?.observe(state);const sh=window.ArcadeJuice?.shake()||{x:0,y:0};g.save();g.translate(sh.x,sh.y);const s=visualState(state),ps=s.players;paintEnvironment(s);if(s.mode==='flappy')extendFlappyPipes(s);g.save();g.beginPath();if(s.mode==='flappy'){const extra=arcadeCamera.x/arcadeCamera.scale;g.rect(-extra,0,1200+extra*2,720);}else if(s.mode==='hungry'){const t=g.getTransform();g.rect(-t.e/t.a,-t.f/t.d,c.width/t.a,c.height/t.d);}else g.rect(0,0,1200,720);g.clip();window.ArcadeJuice?.ambient(g,s);if(s.mode==='taprace')drawTapRace(s);
if(s.mode==='punchmeter'){const turn=s.players.find(p=>p.id===s.punchTurn);const pose=punchBagPose(s.bag),x=pose.x,y=pose.y;g.strokeStyle='#d7e9e9';g.lineWidth=5*pose.scale;g.beginPath();g.moveTo(600,70);g.lineTo(x,y);g.stroke();g.save();g.translate(x,y);g.rotate(pose.rotate);g.scale(pose.scale,pose.scale);g.filter=`brightness(${pose.light})`;const bagArt=window.PartyArt?.draw(g,'punchbag',0,0,150,150*480/173,{pivot:{x:.5,y:.035}});g.filter='none';g.globalAlpha=bagArt?0:1;g.fillStyle='#ff5788';g.shadowColor='#ff5788';g.shadowBlur=32;g.beginPath();g.roundRect(-70,10,140,390,60);g.fill();g.shadowBlur=0;g.fillStyle='#17222c';g.fillRect(-70,30,140,28);text('BOOM',0,230,24);g.restore();const hit=s.bag.last;if(hit&&s.time-hit.time<3.8)punchScoreboard(hit,s.time-hit.time);}
if(s.mode==='flappy'){g.fillStyle='#00000000';g.beginPath();g.roundRect(0,0,1200,720,28);g.fill();for(let ci=0;ci<4;ci++)window.PartyArt?.draw(g,'cloud',((ci*340-(reducedArtMotion?0:s.time*12))%1400+1400)%1400-100,100+ci%2*140,145,75,{alpha:.14});for(const p of s.pipes||[]){g.fillStyle=flappyPipeMaterial(p.x);g.fillRect(p.x-32,0,64,p.gap-105);g.fillRect(p.x-32,p.gap+105,64,720-p.gap-105);window.PartyArt?.draw(g,'pipe-cap',p.x,p.gap-115,76,26);window.PartyArt?.draw(g,'pipe-cap',p.x,p.gap+115,76,26,{rotation:Math.PI});}for(const p of ps){if(!p.alive)continue;const birdArt=window.PartyArt?.draw(g,'bird',p.x,p.y,40,35,{color:p.color,rotation:Math.max(-.45,Math.min(.9,(p.vy||0)/650))});if(!birdArt){circle(p.x,p.y,16,p.color);circle(p.x+7,p.y-5,5,'#fff');circle(p.x+9,p.y-5,2,'#17222c');g.fillStyle=p.color;g.fillRect(p.x-25,p.y+Math.sin(s.time*20)*8,16,6);}else {g.save();g.translate(p.x,p.y);g.rotate(Math.max(-.45,Math.min(.9,(p.vy||0)/650)));window.PartyArt?.draw(g,'bird-wing',-2,3,20,18,{color:p.color,flipX:true,pivot:{x:.2,y:.65},rotation:reducedArtMotion?0:Math.sin(s.time*19)*.6});g.restore();}}drawClusterLabels(s);}
if(s.mode==='hungry'){window.ArcadeHungryBounds=[];window.ArcadeHungryFood=[];g.fillStyle='#00000000';g.beginPath();g.roundRect(0,0,1200,720,36);g.fill();(s.food||[]).forEach(f=>{const fy=hungryFoodY(f,window.PARTY_GAME_CLOCK?.now?.()??performance.now(),reducedArtMotion);window.ArcadeHungryFood.push({id:f.id,x:f.x,y:fy,kind:f.kind});if(!window.PartyArt?.draw(g,['food-chicken','food-pizza','food-burger','food-donut'][f.kind],f.x,fy,25,25))text(['🍗','🍕','🍔','🍩'][f.kind],f.x,fy,24);});for(const p of ps){if(p.dead>0)continue;const sq=window.ArcadeJuice?.squash(p.id)||{x:1,y:1},clipT=g.getTransform();g.save();g.translate(p.x,p.y);g.scale(sq.x,sq.y);g.translate(-p.x,-p.y);const t=g.getTransform(),r=c.getBoundingClientRect(),sx=r.width/c.width,sy=r.height/c.height,radius=Math.sqrt(p.mass)*3.6+2;
 const projected=(x,y)=>({x:(t.a*x+t.c*y+t.e)*sx+r.x,y:(t.b*x+t.d*y+t.f)*sy+r.y});
 const topLeft=projected(p.x-radius,p.y-radius),bottomRight=projected(p.x+radius,p.y+radius),worldTop={x:r.x,y:r.y},worldBottom={x:r.right,y:r.bottom};
 window.ArcadeHungryBounds.push({id:p.id,name:p.name,at:performance.now(),world:{x:p.x,y:p.y,mass:p.mass},squash:sq,body:{left:topLeft.x,top:topLeft.y,right:bottomRight.x,bottom:bottomRight.y},visible:{left:Math.max(topLeft.x,worldTop.x),top:Math.max(topLeft.y,worldTop.y),right:Math.min(bottomRight.x,worldBottom.x),bottom:Math.min(bottomRight.y,worldBottom.y)}});
 const art=window.HungryCreatureArt?.draw(g,{x:p.x,y:p.y,radius:Math.sqrt(p.mass)*3.6,color:p.color});window.ArcadeHungryBounds.at(-1).art=art;if(!art)circle(p.x,p.y,Math.sqrt(p.mass)*3.6,p.color);g.restore();}drawClusterLabels(s);}
if(s.mode==='snakelines'){paintTrails(s);for(const p of ps){if(p.alive){if(!window.PartyArt?.draw(g,'puck',p.x,p.y,20,20,{color:p.color,rotation:p.angle}))circle(p.x,p.y,9,p.color);fieldLabel(p.name,p.x,p.y-30);}}window.drawSnakeAmbient?.(g,s);if(s.roundWait>0&&!window.ArcadeJuice)text('Раунд '+s.round+' завершён',600,360,40);}
if(s.mode==='carryball')drawCarryScene(s);window.ArcadeJuice?.front(g,s);}
if(state){drawFeedback(state);g.restore();g.restore();if(state.countdown>0)drawArcadeCountdown(g,state,c);}requestAnimationFrame(draw);}window.ArcadeJuice?.init({canvas:c,tapLayout:tapRaceRunnerLayout});draw();}






// A hit swings the bag away with uniform perspective scaling: preserve the tall
// sprite proportions and hang it from a short rope, with a small sideways lean.
function punchBagPose(bag){const a=bag?.angle||0,t=bag?.tilt||0,away=Math.sin(a),depth=Math.max(-.35,away);
 const scale=1/(1+.55*depth),rope=(250/3)*Math.cos(a)*scale;return {x:600+Math.sin(t)*170*scale,y:70+rope,scale,rotate:-t*.8,light:Math.max(.62,1-.35*Math.max(0,away))};}

// Arcade-machine readout: 15 titles from a feeble tap to a hero's blow.
const PUNCH_TITLES=['Слабак','Котёнок','Пушинка','Разминка','Любитель','Крепыш','Боец','Задира','Ударник','Громила','Тяжеловес','Нокаутёр','Чемпион','Титан','Богатырь'];
function punchTitle(score){return PUNCH_TITLES[Math.max(0,Math.min(14,Math.floor((score-100)/900*15)))];}
// The number climbs like a real punching machine, a strength meter fills alongside,
// and the title pops in once the count lands.
function punchScoreboard(hit,since){const c=document.getElementById('arena')?.getContext('2d');if(!c)return;
 const k=Math.min(1,since/1.25),eased=1-Math.pow(1-k,3),shown=Math.round(hit.score*eased),level=shown/1000,color=level>.8?'#ffcf5a':level>.55?'#caff6a':'#7fe7ff';
 c.save();c.fillStyle='#0c1218cc';c.strokeStyle='#ffffff26';c.lineWidth=2;c.beginPath();c.roundRect(1048,150,70,420,35);c.fill();c.stroke();
 const h=Math.max(0,412*level),grad=c.createLinearGradient(0,566,0,154);grad.addColorStop(0,'#7fe7ff');grad.addColorStop(.55,'#caff6a');grad.addColorStop(.85,'#ffcf5a');grad.addColorStop(1,'#ff6f7d');
 c.fillStyle=grad;c.shadowColor=color;c.shadowBlur=24;c.beginPath();c.roundRect(1052,566-h,62,h,31);c.fill();c.shadowBlur=0;
 for(let i=1;i<15;i++){const y=566-412*i/15;c.fillStyle='#ffffff30';c.fillRect(1052,y,i%5?14:24,2);}
 c.textAlign='center';c.font='900 96px HeyPalsText,system-ui';c.fillStyle=color;c.shadowColor=color;c.shadowBlur=30;c.fillText(String(shown),600,588);c.shadowBlur=0;
 if(k>=1){const pop=Math.min(1,(since-1.25)/.35),s=pop<1?.6+.55*Math.sin(pop*Math.PI*.75):1;c.translate(600,640);c.scale(s,s);c.font='900 34px HeyPalsText,system-ui';c.fillStyle='#f3f8ee';c.fillText(punchTitle(hit.score).toUpperCase(),0,0);}
 c.restore();}
