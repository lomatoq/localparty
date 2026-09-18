'use strict';
const $=id=>document.getElementById(id),host=!!window.IS_HOST;let ws,state,id,joinRetry=0,axis={x:0,y:0},motionEnabled=false,motionPeak=0,lastMotion=0;
const send=(type,data={})=>{if(ws?.readyState===1)ws.send(JSON.stringify({type,data}));},esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function join(){const profile=window.PARTY_PROFILE||{};send('join',{partyId:profile.id,partyToken:profile.token,name:profile.name||$('nickname')?.value||'Игрок',token:localStorage.getItem('arcade-id')});}
function connect(){ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws');ws.onopen=()=>{clearInterval(joinRetry);if(host)return send('host');const attempt=()=>{if(window.PARTY_PROFILE?.id||localStorage.getItem('arcade-id'))join();};attempt();joinRetry=setInterval(attempt,900);};ws.onclose=()=>{clearInterval(joinRetry);if(!host)$('status').textContent='Восстанавливаем связь…';setTimeout(connect,700);};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='joined'){clearInterval(joinRetry);id=m.data.id;localStorage.setItem('arcade-id',id);$('join').hidden=true;$('name').textContent=m.data.name;}if(m.type==='state'){if(host&&m.data.mode==='snakelines')for(const p of m.data.players){const previous=state?.players.find(q=>q.id===p.id)?.trail||[];p.trail=previous.slice(0,p.trailFrom||0).concat(p.trail);}state=m.data;if(!host&&state.selfId)id=state.selfId;update();}if(m.type==='error'&&!host)$('status').textContent=m.data;};}connect();
const instructions={taprace:'Тапай как можно быстрее! Каждый тап разгоняет бегуна.',punchmeter:'Три попытки. Держи телефон крепко и сделай короткое движение рукой. Без датчика: зажми кнопку и отпусти на пике шкалы.',flappy:'Тап — взмах вверх. Пролетай между трубами.',hungry:'Веди джойстик к еде. Большие медленнее. После поражения вернёшься через 1,5 секунды.',snakelines:'Веди джойстик в нужную сторону экрана. Не касайся стен и любых следов.',carryball:'Джойстик — бег. Подойди к мячу, чтобы подобрать. Кнопка — пас в сторону движения.'};
let boardKey='';function update(){const s=state,playing=s.phase==='playing',p=s.players.find(p=>p.id===id);if(host){$('title').textContent=s.title;$('lobbyStage').hidden=playing;$('start').textContent=s.phase==='finished'?'Сыграть ещё →':'Начать игру →';$('hint').textContent=instructions[s.mode];$('phase').textContent=s.phase==='finished'?'Результаты':s.mode==='carryball'?`Команды ${s.teams[0]} : ${s.teams[1]}`:'Игроки';const key=JSON.stringify(s.players.map(p=>[p.id,p.score,p.hits,p.alive,p.connected]));if(key!==boardKey){boardKey=key;$('board').innerHTML=[...s.players].sort((a,b)=>b.score-a.score).map((p,i)=>`<div class="runner-row"><span class="avatar" style="--color:${p.color}">${['😎','🦊','🐸','🐻'][s.players.indexOf(p)%4]}</span><span>${esc(p.name)}${s.mode==='punchmeter'?`<small>${p.hits.length}/3 · лучший ${Math.max(0,...p.hits)}</small>`:''}</span><b>${p.score}</b></div>`).join('');}}else{const joy=['hungry','snakelines','carryball'].includes(s.mode);$('joy').hidden=!joy;$('action').hidden=joy&&s.mode!=='carryball';$('action').classList.toggle('pass',s.mode==='carryball');$('action').textContent=s.mode==='carryball'?'ПАС →':s.mode==='punchmeter'?'ЗАЖМИ → ОТПУСТИ':s.mode==='flappy'?'ВЗМАХ ↑':'ТАП!';$('action').disabled=!playing||!p||!p.alive||s.mode==='punchmeter'&&(p.hits.length>=3||s.punchTurn!==id);$('motion').hidden=s.mode!=='punchmeter'||motionEnabled;$('help').textContent=instructions[s.mode];$('status').textContent=!p?'Войди в игру':!playing?(s.phase==='finished'?`Финиш · ${p.score} очков`:'Ждём старта на общем экране'):p.dead>0?'Возвращение через '+Math.ceil(p.dead)+'с':!p.alive?'Ты выбыл. Следи за общим экраном.':s.mode==='punchmeter'?`${s.punchTurn===id?'ТВОЙ УДАР · попытка '+(p.hits.length+1)+'/3':'Сейчас бьёт: '+(s.players.find(q=>q.id===s.punchTurn)?.name||'—')} · лучший ${Math.max(0,...p.hits)} · сумма ${p.score}`:s.mode==='taprace'?`До финиша ${Math.max(0,2000-p.score)} · Тапай быстрее!`:Math.ceil(s.timer)+' секунд · '+p.score+' очков';if(s.mode==='flappy'&&playing&&p&&!p.alive){$('action').textContent='ПОЛЁТ ЗАВЕРШЁН';$('help').textContent='Следи за оставшимися птицами на общем экране.';$('status').textContent=`Ты выбыл · ${p.score} очков. Следующий забег после завершения этого раунда.`;}if(s.mode==='punchmeter')renderPunchPhone(s,p);}}
function renderPunchPhone(s,p){
 let panel=$('punchResult');if(!panel){panel=document.createElement('div');panel.id='punchResult';panel.setAttribute('role','status');$('status').after(panel);$('action').before($('motion'));}
 const turn=s.players.find(q=>q.id===s.punchTurn),mine=s.punchTurn===id;
 $('status').textContent=s.phase==='finished'?(p?.hits.length===3?'Все удары завершены':'Время вышло · матч завершён'):s.phase!=='playing'?'Готовимся к ударам':mine?'ТВОЯ ОЧЕРЕДЬ БИТЬ':'СЕЙЧАС БЬЁТ: '+(turn?.name||'—');
 panel.textContent=s.phase==='finished'?`Выполнено ${p?.hits.length||0}/3 · лучший ${Math.max(0,...(p?.hits||[]))} · сумма ${p?.score||0}`:p?.hits.length?'✓ '+p.hits.at(-1)+' — '+punchTitle(p.hits.at(-1))+'. Осталось '+(3-p.hits.length)+' из 3 · сумма '+p.score:'Ударов пока нет · 3 попытки';
 $('motion').hidden=motionEnabled||s.phase==='finished';
 let sense=$('punchSense');if(!sense){sense=document.createElement('div');sense.id='punchSense';sense.className='punch-sense';sense.setAttribute('role','group');sense.setAttribute('aria-label','Чувствительность датчика');sense.append(Object.assign(document.createElement('span'),{textContent:'Датчик'}));
  for(const [key,label] of [['soft','Мягко'],['normal','Норма'],['sharp','Чутко']]){const b=document.createElement('button');b.type='button';b.dataset.sense=key;b.textContent=label;b.onclick=()=>{try{localStorage.setItem('lp.punchSense',key);}catch{}update();};sense.append(b);}
  $('motion').after(sense);}
 let senseLevel='soft';try{senseLevel=localStorage.getItem('lp.punchSense')||'soft';}catch{}
 for(const b of sense.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.sense===senseLevel));sense.hidden=s.phase==='finished';
 $('help').textContent=s.phase==='finished'?'Результаты на общем экране.':!mine?'Дождись своей очереди — телефон подскажет, когда бить.':motionEnabled?'Сделай короткое движение рукой и остановись. После удара здесь появятся очки. Держи телефон крепко.':'Нажми «Разрешить движение» для удара телефоном. Или зажми нижнюю кнопку и отпусти на заполненной шкале.';
 if(!motionEnabled&&!$('motionFeedback'))$('motion').textContent='Разрешить движение';
 $('action').textContent=s.phase==='finished'?'Матч завершён':mine?'Удар кнопкой: зажми → отпусти':'Ждём очередь';
}

if(host)$('start').onclick=()=>send('start');else{$('join').onsubmit=e=>{e.preventDefault();join();};let held=0,pointer=null;const action=$('action');action.onpointerdown=e=>{if(action.disabled||!state)return;e.preventDefault();action.setPointerCapture(e.pointerId);held=performance.now();if(state.mode!=='punchmeter')send('input',{...axis,action:state.mode==='carryball'?'pass':'tap'});navigator.vibrate?.(10);};action.onpointerup=e=>{if(state?.mode==='punchmeter'&&held){const duration=(performance.now()-held)/1000,power=(Math.sin(duration*4-Math.PI/2)+1)/2;held=0;if(duration<.15)return;const r=action.getBoundingClientRect(),side=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2||1)));send('input',{action:'punch',power,side});}};action.onpointercancel=()=>held=0;
 const zone=$('joy');function move(e){const r=zone.getBoundingClientRect(),radius=r.width*.32;let x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius,n=Math.max(1,Math.hypot(x,y));axis={x:x/n,y:y/n};$('knob').style.transform=`translate(calc(-50% + ${axis.x*radius}px),calc(-50% + ${axis.y*radius}px))`;send('input',axis);}function reset(){axis={x:0,y:0};pointer=null;held=0;$('knob').style.transform='translate(-50%,-50%)';send('input',axis);}zone.onpointerdown=e=>{if(pointer!==null)return;pointer=e.pointerId;zone.setPointerCapture(pointer);move(e);};zone.onpointermove=e=>{if(pointer===e.pointerId)move(e);};zone.onpointerup=zone.onpointercancel=reset;window.addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 // Motion permission alone is not proof that the phone is sending measurements.
 let motionPending=false,motionListener=null,motionWatchdog=null,motionGravity=null;
 let motionSide=0,punchWasMine=false,punchTurnSince=0,punchArmed=false,punchStillSince=0;
 // Sensitivity chosen on the controller (web or app); default is the calm "soft" profile.
 function punchSense(){let level='soft';try{level=window.localStorage?.getItem('lp.punchSense')||'soft';}catch{}return {soft:{trigger:16,full:52},normal:{trigger:12,full:40},sharp:{trigger:9,full:32}}[level]||{trigger:16,full:52};}
 $('motion').onclick=async()=>{
  if(motionPending||motionEnabled)return;
  const button=$('motion');let feedback=$('motionFeedback');if(!feedback){feedback=document.createElement('p');feedback.id='motionFeedback';feedback.setAttribute('role','status');feedback.style.cssText='font-size:13px;line-height:1.4;margin:8px 0;max-width:100%;overflow-wrap:anywhere';button.after(feedback);}
  const stopMotion=message=>{clearTimeout(motionWatchdog);if(motionListener)window.removeEventListener('devicemotion',motionListener);motionListener=null;motionPending=false;motionEnabled=false;motionPeak=0;motionGravity=null;button.disabled=false;button.hidden=false;button.textContent='Повторить подключение датчика';feedback.textContent=message;};
  if(!window.isSecureContext){feedback.textContent='Датчик требует HTTPS. По этому HTTP-адресу используй кнопку «Зажми → отпусти».';return;}
  if(!window.DeviceMotionEvent){feedback.textContent='Этот браузер не поддерживает датчик движения. Используй кнопку «Зажми → отпусти».';return;}
  motionPending=true;button.disabled=true;feedback.textContent='Запрашиваем доступ к движению…';
  try{
   if(typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted'){stopMotion('Доступ к движению не разрешён. Можно повторить запрос или играть кнопкой.');return;}
   feedback.textContent='Доступ получен. Ждём данные датчика…';motionGravity=null;motionPeak=0;
   const armWatchdog=()=>{clearTimeout(motionWatchdog);motionWatchdog=setTimeout(()=>stopMotion('Данные движения не поступают. Проверь доступ в браузере или используй кнопку.'),4000);};
   motionListener=e=>{
    const valid=a=>a&&['x','y','z'].some(k=>typeof a[k]==='number'&&Number.isFinite(a[k]));let acceleration=e.acceleration,gravityFallback=false;
    if(!valid(acceleration)){if(!valid(e.accelerationIncludingGravity))return;acceleration=e.accelerationIncludingGravity;gravityFallback=true;}
    let vector=['x','y','z'].map(k=>Number.isFinite(acceleration[k])?acceleration[k]:0);
    if(gravityFallback){if(!motionGravity)motionGravity=vector.slice();const linear=vector.map((v,i)=>v-motionGravity[i]);motionGravity=vector.map((v,i)=>motionGravity[i]*.85+v*.15);vector=linear;}
    if(!motionEnabled){motionEnabled=true;motionPending=false;button.hidden=true;feedback.textContent=gravityFallback?'Датчик работает: получены данные движения (с компенсацией гравитации).':'Датчик работает: получены данные ускорения.';}
    armWatchdog();const magnitude=Math.hypot(...vector);
    // A turn starts disarmed: the jolt of picking the phone up / the turn switching never
    // counts. The phone must be held still briefly first, and again after every punch.
    const now=performance.now();
    if(state?.mode!=='punchmeter'||state.phase!=='playing'||state.punchTurn!==id){motionPeak=0;punchWasMine=false;return;}
    if(!punchWasMine){punchWasMine=true;punchTurnSince=now;punchArmed=false;punchStillSince=0;motionPeak=0;}
    if(!punchArmed){if(magnitude<2.2){punchStillSince||=now;if(now-punchTurnSince>=1200&&now-punchStillSince>=350)punchArmed=true;}else punchStillSince=0;motionPeak=0;return;}
    const sense=punchSense();if(magnitude>=motionPeak)motionSide=magnitude?vector[0]/magnitude:0;motionPeak=Math.max(motionPeak,magnitude);
    if(magnitude<3&&motionPeak>sense.trigger&&now-lastMotion>1800){send('input',{action:'punch',side:Math.max(-1,Math.min(1,motionSide)),power:Math.max(0,Math.min(1,(motionPeak-sense.trigger*.5)/(sense.full-sense.trigger*.5)))});motionPeak=0;lastMotion=now;punchArmed=false;punchStillSince=0;}
   };window.addEventListener('devicemotion',motionListener);armWatchdog();
  }catch{stopMotion('Браузер не дал доступ к движению. Используй кнопку или повтори запрос.');}
 };
 function charge(){if(held&&state?.mode==='punchmeter'){const power=(Math.sin((performance.now()-held)/1000*4-Math.PI/2)+1)/2;action.style.background=`linear-gradient(90deg,#baff46 ${power*100}%,#506d35 ${power*100}%)`;}else action.style.background='';requestAnimationFrame(charge);}charge();}
if(host){const c=$('arena'),g=c.getContext('2d'),circle=(x,y,r,color)=>{g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();},text=(s,x,y,size=18,color='#f3f8ee')=>{g.fillStyle=color;g.font=`800 ${size}px system-ui`;g.textAlign='center';g.fillText(s,x,y);};
const reducedArtMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;let visualLast=performance.now(),visualKey='',visualPoints=new Map();
function visualState(raw){const now=performance.now(),dt=Math.min(.05,(now-visualLast)/1000);visualLast=now;const key=raw.mode+':'+raw.round+':'+raw.phase;if(key!==visualKey){visualPoints.clear();visualKey=key;}const alpha=1-Math.exp(-24*dt);function point(id,p){let q=visualPoints.get(id);if(!q||Math.hypot(p.x-q.x,p.y-q.y)>180)q={x:p.x,y:p.y,progress:p.progress||0};q.x+=(p.x-q.x)*alpha;q.y+=(p.y-q.y)*alpha;q.progress+=((p.progress||0)-q.progress)*alpha;visualPoints.set(id,q);return {...p,...q};}return {...raw,players:raw.players.map(p=>point(p.id,p)),...(raw.ball?{ball:point('ball',raw.ball)}:{})};}

const trailCanvas=document.createElement('canvas');trailCanvas.width=1200;trailCanvas.height=720;const trailCtx=trailCanvas.getContext('2d');let trailScene='',trailLengths=new Map();function paintTrails(s){const key=s.round+':'+s.phase+':'+c.width+':'+c.height;if(key!==trailScene||s.players.some(p=>(trailLengths.get(p.id)||0)>p.trail.length)){trailCanvas.width=c.width;trailCanvas.height=c.height;trailCtx.setTransform(c.width/1200,0,0,c.height/720,0,0);trailLengths.clear();trailScene=key;}for(const p of s.players){const n=trailLengths.get(p.id)||0;if(p.trail.length<=n)continue;trailCtx.strokeStyle=p.color;trailCtx.lineWidth=6;trailCtx.lineJoin='round';trailCtx.lineCap='round';trailCtx.beginPath();for(let i=Math.max(0,n-1);i<p.trail.length;i++){const t=p.trail[i];i===Math.max(0,n-1)?trailCtx.moveTo(t.x,t.y):trailCtx.lineTo(t.x,t.y);}trailCtx.stroke();trailLengths.set(p.id,p.trail.length);}g.drawImage(trailCanvas,0,0,1200,720);}

// Feedback follows authoritative event changes; simulation time freezes it on pause.
let feedbackState=null,feedbackKey='',feedbackBursts=[];
function drawFeedback(s){
 const key=s.mode+':'+s.round+':'+s.phase;
 if(key!==feedbackKey){feedbackBursts=[];feedbackState=null;feedbackKey=key;}
 const burst=(x,y,color,strength=1,kind='impact')=>{feedbackBursts.push({x,y,color,strength,kind,time:s.time});if(feedbackBursts.length>20)feedbackBursts.shift();};
 const feel=(type,x,y,color,intensity=.45)=>window.LocalPartyFeel?.emit(type,{id:`arcade:${s.mode}:${s.round}:${++drawFeedback.serial}`,x:x/1200,y:y/720,color,intensity,shake:!['score','shot'].includes(type)});
 if(state!==feedbackState){
  if(feedbackState&&s.phase==='playing'){
   for(const p of s.players){const old=feedbackState.players.find(q=>q.id===p.id);if(!old)continue;
    if(s.mode==='hungry'&&p.mass>old.mass+.5){burst(p.x,p.y,p.color,.55,'absorb');feel('score',p.x,p.y,p.color,.35);}
    if(s.mode==='hungry'&&old.dead<=0&&p.dead>0)feel('elimination',p.x,p.y,p.color,.65);
    if(['flappy','snakelines'].includes(s.mode)&&old.alive&&!p.alive){burst(p.x,p.y,p.color,1,'break');feel('collision',p.x,p.y,p.color,.58);}
    if(s.mode==='punchmeter'&&p.hits.length>old.hits.length){const pose=punchBagPose(s.bag),x=pose.x,y=pose.y+110*pose.scale*pose.squash;burst(x,y,p.color,1.5);feel('hit',x,y,p.color,.68);}
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

// Static world material is cached at the display backing resolution, never per entity.
const environment=document.createElement('canvas');let environmentKey='';
const runnerGaits=new Map(),runnerFacing=new Map();
function runnerArt(x,y,size,p,time){
 const art=window.PartyArt,body=art?.sprite('runner-body-v2',p.color),near=art?.sprite('runner-leg-near-v2',p.color),far=art?.sprite('runner-leg-far-v2',p.color);
 const speed=Math.hypot(p.vx||0,p.vy||0),now=window.PARTY_GAME_CLOCK?.now?.()??performance.now();let gait=runnerGaits.get(p.id);
 if(!gait){gait={t:now,phase:0};runnerGaits.set(p.id,gait);}const dt=Math.min(.05,Math.max(0,(now-gait.t)/1000));gait.t=now;gait.phase+=reducedArtMotion||speed<2?0:dt*(4+Math.min(17,speed*.055));
 const run=Math.min(1,speed/150),step=Math.sin(gait.phase),bob=reducedArtMotion?0:-Math.abs(step)*size*.028*run;
 g.save();g.translate(x,y+size*.43);g.scale(size*.38,size*.10);const shadow=g.createRadialGradient(0,0,0,0,0,1);shadow.addColorStop(0,'#030b18a0');shadow.addColorStop(1,'#030b1800');g.fillStyle=shadow;g.fillRect(-1,-1,2,2);g.restore();
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
function tapTrackGeometry(count){const lanes=Math.max(2,count),h=Math.min(150,600/lanes);return {lanes,h,top:(720-h*lanes)/2,height:h*lanes};}
function tapRaceRunnerLayout(p,index,count){
 const {h,top}=tapTrackGeometry(count),y=top+h*(index+.5),size=Math.min(108,h*.82),x=185+Math.min(1,p.progress/2000)*900;
 const bubbleHeight=Math.max(20,Math.min(34,h-10)),nameLength=Array.from(String(p.name||'')).length,bubbleWidth=Math.max(68,Math.min(98,46+nameLength*5.5));
 return {h,top,laneTop:top+h*index,y,size,x,rearX:x-size*.14,bubble:{x:30,y:y-bubbleHeight/2,width:bubbleWidth,height:bubbleHeight,radius:bubbleHeight/2}};
}
function drawTapRace(s){
 const {h,top}=tapTrackGeometry(s.players.length),now=(window.PARTY_GAME_CLOCK?.now?.()??performance.now())/1000;
 for(let i=0;i<s.players.length;i++){
  const p=s.players[i],layout=tapRaceRunnerLayout(p,i,s.players.length),{y,size,x,rearX,bubble}=layout,fast=Math.max(0,Math.min(1,((p.vx||0)-95)/130));
  g.save();g.fillStyle='#071723d9';g.strokeStyle=p.color+'99';g.lineWidth=1.5;g.beginPath();g.roundRect(bubble.x,bubble.y,bubble.width,bubble.height,bubble.radius);g.fill();g.stroke();
  const badge=bubble.height*.32;g.fillStyle=p.color;g.beginPath();g.arc(bubble.x+bubble.height*.52,y,badge,0,Math.PI*2);g.fill();g.fillStyle='#09131d';g.textAlign='center';g.textBaseline='middle';g.font=`900 ${Math.max(9,Math.min(12,bubble.height*.42))}px PartyRubik,Rubik,system-ui`;g.fillText(Array.from(String(p.name||'?').trim())[0]?.toUpperCase()||'?',bubble.x+bubble.height*.52,y+.5);
  g.fillStyle='#edf8fc';g.textAlign='left';g.font=`800 ${Math.max(9,Math.min(13,h*.27))}px PartyRubik,Rubik,system-ui`;g.fillText(p.name,bubble.x+bubble.height,bubble.y+bubble.height*.52,bubble.width-bubble.height-8);g.restore();
  if(fast>0&&!reducedArtMotion){g.save();g.beginPath();g.rect(148,top+i*h,977,h);g.clip();for(let j=0;j<5;j++){const t=(now*(2+j*.1)+j*.23)%1,yy=y+(j-2)*size*.11;const len=(25+fast*90)*(1-t),end=rearX-2;const tail=g.createLinearGradient(end-len,yy,end,yy);tail.addColorStop(0,'#0000');tail.addColorStop(1,p.color);g.strokeStyle=tail;g.globalAlpha=fast*(1-t)*.45;g.lineWidth=j===2?3:1.5;g.beginPath();g.moveTo(end-len,yy);g.lineTo(end,yy);g.stroke();}g.restore();}
  if(!runnerArt(x,y,size,p,s.time))circle(x,y,Math.min(17,h*.3),p.color);
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
  text(p.name,Math.max(65,Math.min(1135,p.x)),Math.max(18,p.y-42),13,p.color);
 }
 g.save();g.fillStyle='#030d2366';g.beginPath();g.ellipse(s.ball.x+2,s.ball.y+9,12,5,0,0,Math.PI*2);g.fill();g.restore();
 if(!window.PartyArt?.draw(g,'ball',s.ball.x,s.ball.y,26,26,{rotation:reducedArtMotion?0:(s.ball.x+s.ball.y)*.035}))circle(s.ball.x,s.ball.y,10,'#fff1c7');
}
function paintTapArena(q,s){
 const {lanes,h,top,height}=tapTrackGeometry(s.players.length);
 const base=q.createLinearGradient(0,0,1200,720);base.addColorStop(0,'#132c3b');base.addColorStop(.45,'#091c2b');base.addColorStop(1,'#241e3f');q.fillStyle=base;q.fillRect(0,0,1200,720);
 for(const [x,y,color] of [[300,0,'#46e4e62b'],[1100,700,'#a777ff2e']]){const glow=q.createRadialGradient(x,y,0,x,y,620);glow.addColorStop(0,color);glow.addColorStop(1,'#0000');q.fillStyle=glow;q.fillRect(0,0,1200,720);}
 q.strokeStyle='#8eeeff0c';q.lineWidth=1;for(let x=-600;x<1800;x+=100){q.beginPath();q.moveTo(600+(x-600)*.4,0);q.lineTo(x,720);q.stroke();}
 for(const y of [18,702]){q.fillStyle='#09121f';q.beginPath();q.roundRect(20,y-6,1160,12,6);q.fill();q.fillStyle='#87e6e56b';for(let x=42;x<1170;x+=84)q.fillRect(x,y-1,40,2);}
 // Raised running deck and its continuous illuminated safety edges.
 q.save();q.shadowColor='#000b';q.shadowBlur=30;q.shadowOffsetY=16;q.fillStyle='#101b2c';q.beginPath();q.roundRect(145,top-18,1005,height+36,18);q.fill();q.restore();
 for(let i=0;i<lanes;i++){
  const y=top+i*h,material=q.createLinearGradient(0,y,0,y+h);material.addColorStop(0,i%2?'#20374a':'#263e50');material.addColorStop(.46,'#152b3b');material.addColorStop(1,'#1d3046');q.fillStyle=material;q.fillRect(160,y,965,h);
  q.strokeStyle='#bdedff13';q.lineWidth=1;for(let x=176;x<1120;x+=64){q.beginPath();q.moveTo(x,y+3);q.lineTo(x,y+h-3);q.stroke();}
  q.fillStyle='#9fd6ec1b';for(let x=220;x<1080;x+=135){q.beginPath();q.moveTo(x,y+h/2-5);q.lineTo(x+8,y+h/2);q.lineTo(x,y+h/2+5);q.lineTo(x+3,y+h/2);q.closePath();q.fill();}
  if(i){q.strokeStyle='#9edbf23a';q.beginPath();q.moveTo(160,y);q.lineTo(1125,y);q.stroke();}
 }
 for(const y of [top-8,top+height+8]){q.save();q.strokeStyle=y<360?'#8cf5e4':'#ad95ff';q.lineWidth=3;q.shadowBlur=14;q.shadowColor=q.strokeStyle;q.beginPath();q.moveTo(163,y);q.lineTo(1130,y);q.stroke();q.restore();}
 q.fillStyle='#b5fff139';q.fillRect(165,top,3,height);q.fillStyle='#071521';q.fillRect(1118,top,22,height);
 for(let row=0;row<Math.ceil(height/12);row++)for(let col=0;col<2;col++){q.fillStyle=(row+col)%2?'#203d48':'#d9fff2';q.fillRect(1118+col*11,top+row*12,11,Math.min(12,height-row*12));}
 if(top>90){q.textAlign='center';q.font='italic 800 24px PartyRubik,system-ui';q.fillStyle='#b2fff1';q.fillText('NEON SPRINT',645,top-62);q.font='800 10px PartyRubik,system-ui';q.fillStyle='#7a9dac';q.fillText('РАЗГОНЯЙСЯ · ДО ФИНИША',645,top-39);
  for(const y of [top-42,top+height+52])for(const x of [230,380,870,1020]){q.save();q.translate(x,y);q.fillStyle='#3c546455';q.beginPath();q.moveTo(-35,0);q.lineTo(-25,-8);q.lineTo(30,-8);q.lineTo(35,0);q.closePath();q.fill();q.fillStyle='#82dddca0';q.fillRect(-20,-7,30,2);q.restore();}}
}
function paintEnvironment(s){
 const key=s.mode+':'+s.players.length+':'+c.width+':'+c.height;
 if(key!==environmentKey){environmentKey=key;environment.width=c.width;environment.height=c.height;
 const q=environment.getContext('2d');q.setTransform(c.width/1200,0,0,c.height/720,0,0);
 q.save();q.beginPath();q.roundRect(0,0,1200,720,30);q.clip();
 const palette={taprace:['#203845','#14222d'],punchmeter:['#252e43','#101924'],flappy:['#193e58','#2c6771'],hungry:['#244341','#142d30'],snakelines:['#202841','#111b2b'],carryball:['#244b42','#15352f']}[s.mode];
 const bg=q.createLinearGradient(0,0,0,720);bg.addColorStop(0,palette[0]);bg.addColorStop(1,palette[1]);q.fillStyle=bg;q.fillRect(0,0,1200,720);
 const glow=q.createRadialGradient(600,160,20,600,160,720);glow.addColorStop(0,'#caffdc12');glow.addColorStop(1,'#00000000');q.fillStyle=glow;q.fillRect(0,0,1200,720);
 if(s.mode==='taprace')paintTapArena(q,s);
 if(s.mode==='punchmeter'){
  q.fillStyle='#0a142294';q.fillRect(0,480,1200,240);
  q.strokeStyle='#7897ae24';q.lineWidth=2;for(let x=-400;x<1600;x+=160){q.beginPath();q.moveTo(600+(x-600)*.45,480);q.lineTo(x,720);q.stroke();}for(const y of [500,540,600,690]){q.beginPath();q.moveTo(0,y);q.lineTo(1200,y);q.stroke();}
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
  q.strokeStyle='#b9dfc008';q.lineWidth=1;for(let y=0;y<720;y+=48)for(let x=0;x<1200;x+=48){q.strokeRect(x,y,48,48);q.fillStyle='#caf3d40b';q.fillRect(x+23,y+23,2,2);}
 }
 if(s.mode==='snakelines')window.paintSnakeArena?.(q,s);
 if(s.mode==='carryball'){
  for(let x=20;x<1180;x+=116){q.fillStyle=Math.floor((x-20)/116)%2?'#ffffff05':'#00000008';q.fillRect(x,20,116,680);}
  q.strokeStyle='#d7f4d442';q.lineWidth=2;q.beginPath();q.arc(600,360,104,0,Math.PI*2);q.stroke();q.fillStyle='#e2f8d8';q.beginPath();q.arc(600,360,3,0,Math.PI*2);q.fill();
  q.strokeRect(20,190,145,340);q.strokeRect(1035,190,145,340);
  for(const x of [0,1155]){q.fillStyle=x?'#a583e020':'#bbff6420';q.fillRect(x,240,45,240);q.strokeStyle='#edffe52c';q.lineWidth=1;for(let y=250;y<480;y+=16){q.beginPath();q.moveTo(x,y);q.lineTo(x+45,y);q.stroke();}for(let a=x+8;a<x+45;a+=12){q.beginPath();q.moveTo(a,240);q.lineTo(a,480);q.stroke();}}
 }
 q.restore();q.strokeStyle='#d0eee821';q.lineWidth=2;q.beginPath();q.roundRect(1,1,1198,718,30);q.stroke();
 }
 g.drawImage(environment,0,0,1200,720);
}
function draw(){window.PartyArt?.beginFrame(g,1200,720);g.clearRect(0,0,1200,720);if(state){const s=visualState(state),ps=s.players;paintEnvironment(s);g.save();g.beginPath();g.roundRect(0,0,1200,720,30);g.clip();if(s.mode==='taprace')drawTapRace(s);
if(s.mode==='punchmeter'){const turn=s.players.find(p=>p.id===s.punchTurn);if(s.phase==='playing'&&turn){text('БЬЁТ: '+turn.name,600,35,26,turn.color);text('Попытка '+(turn.hits.length+1)+' из 3',600,690,22);}const pose=punchBagPose(s.bag),x=pose.x,y=pose.y;g.strokeStyle='#d7e9e9';g.lineWidth=5*pose.scale;g.beginPath();g.moveTo(600,70);g.lineTo(x,y);g.stroke();g.save();g.translate(x,y);g.rotate(pose.rotate);g.scale(pose.scale,pose.scale*pose.squash);g.filter=`brightness(${pose.light})`;const bagArt=window.PartyArt?.draw(g,'punchbag',0,-20,150,230,{pivot:{x:.5,y:0}});g.filter='none';g.globalAlpha=bagArt?0:1;g.fillStyle='#ff5788';g.shadowColor='#ff5788';g.shadowBlur=32;g.beginPath();g.roundRect(-70,-20,140,230,60);g.fill();g.shadowBlur=0;g.fillStyle='#17222c';g.fillRect(-70,30,140,28);text('BOOM',0,135,24);g.restore();const hit=s.bag.last;if(hit&&s.time-hit.time<3.8)punchScoreboard(hit,s.time-hit.time);}
if(s.mode==='flappy'){g.fillStyle='#00000000';g.beginPath();g.roundRect(0,0,1200,720,28);g.fill();for(let ci=0;ci<4;ci++)window.PartyArt?.draw(g,'cloud',((ci*340-(reducedArtMotion?0:s.time*12))%1400+1400)%1400-100,100+ci%2*140,145,75,{alpha:.14});for(const p of s.pipes||[]){const material=g.createLinearGradient(p.x-32,0,p.x+32,0);material.addColorStop(0,'#286c39');material.addColorStop(.18,'#73c65e');material.addColorStop(.38,'#99df78');material.addColorStop(.72,'#4c9d43');material.addColorStop(1,'#245a32');g.fillStyle=material;g.fillRect(p.x-32,0,64,p.gap-105);g.fillRect(p.x-32,p.gap+105,64,720-p.gap-105);window.PartyArt?.draw(g,'pipe-cap',p.x,p.gap-115,76,26);window.PartyArt?.draw(g,'pipe-cap',p.x,p.gap+115,76,26,{rotation:Math.PI});}for(const p of ps){if(!p.alive)continue;const birdArt=window.PartyArt?.draw(g,'bird',p.x,p.y,40,35,{color:p.color,rotation:Math.max(-.45,Math.min(.9,(p.vy||0)/650))});if(!birdArt){circle(p.x,p.y,16,p.color);circle(p.x+7,p.y-5,5,'#fff');circle(p.x+9,p.y-5,2,'#17222c');g.fillStyle=p.color;g.fillRect(p.x-25,p.y+Math.sin(s.time*20)*8,16,6);}else {g.save();g.translate(p.x,p.y);g.rotate(Math.max(-.45,Math.min(.9,(p.vy||0)/650)));window.PartyArt?.draw(g,'bird-wing',-2,3,20,18,{color:p.color,flipX:true,pivot:{x:.2,y:.65},rotation:reducedArtMotion?0:Math.sin(s.time*19)*.6});g.restore();}text(p.name,p.x-65,p.y+5,12);}}
if(s.mode==='hungry'){g.fillStyle='#00000000';g.beginPath();g.roundRect(0,0,1200,720,36);g.fill();for(const f of s.food||[])if(!window.PartyArt?.draw(g,['food-chicken','food-pizza','food-burger','food-donut'][f.kind],f.x,f.y,25,25))text(['🍗','🍕','🍔','🍩'][f.kind],f.x,f.y,24);for(const p of ps){if(p.dead>0)continue;circle(p.x,p.y,Math.sqrt(p.mass)*3.6+2,p.color);if(!window.PartyArt?.draw(g,'blob',p.x,p.y,Math.sqrt(p.mass)*7.2,Math.sqrt(p.mass)*7.2,{color:p.color}))circle(p.x,p.y,Math.sqrt(p.mass)*3,p.color);g.save();g.shadowColor='#000';g.shadowBlur=4;text(p.name,p.x,p.y-Math.sqrt(p.mass)*3.6-9,13,'#f5fff4');text(Math.round(p.mass),p.x,p.y+Math.sqrt(p.mass)*3.6+16,13,p.color);g.restore();}}
if(s.mode==='snakelines'){g.strokeStyle='#ffffff35';g.lineWidth=2;g.fillStyle='#00000000';g.beginPath();g.roundRect(10,10,1180,700,28);g.fill();g.stroke();paintTrails(s);for(const p of ps){if(p.alive){if(!window.PartyArt?.draw(g,'puck',p.x,p.y,20,20,{color:p.color,rotation:p.angle}))circle(p.x,p.y,9,p.color);text(p.name,p.x,p.y-18,13);}}window.drawSnakeAmbient?.(g,s);if(s.roundWait>0)text('Раунд '+s.round+' завершён',600,360,40);}
if(s.mode==='carryball')drawCarryScene(s);}
if(state){drawFeedback(state);g.restore();}requestAnimationFrame(draw);}draw();}






// Punch bag seen from the player: a hit swings it AWAY (it rises, shrinks and foreshortens
// in perspective, a little darker), with a small left/right lean from the punch direction.
function punchBagPose(bag){const a=bag?.angle||0,t=bag?.tilt||0,away=Math.sin(a),depth=Math.max(-.35,away);
 const scale=1/(1+.55*depth),rope=250*Math.cos(a)*scale;return {x:600+Math.sin(t)*170*scale,y:70+rope,scale,squash:.72+.28*Math.abs(Math.cos(a)),rotate:-t*.8,light:Math.max(.62,1-.35*Math.max(0,away))};}

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
 c.textAlign='center';c.font='900 96px system-ui';c.fillStyle=color;c.shadowColor=color;c.shadowBlur=30;c.fillText(String(shown),600,588);c.shadowBlur=0;
 if(k>=1){const pop=Math.min(1,(since-1.25)/.35),s=pop<1?.6+.55*Math.sin(pop*Math.PI*.75):1;c.translate(600,640);c.scale(s,s);c.font='900 34px system-ui';c.fillStyle='#f3f8ee';c.fillText(punchTitle(hit.score).toUpperCase(),0,0);}
 c.restore();}
