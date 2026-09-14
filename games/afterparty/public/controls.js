(() => {
 'use strict';
 const $=id=>document.getElementById(id),clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),profile=window.PARTY_PROFILE||{},sports=()=>['curling','bowling'].includes(mode);
 let ws,state,identity={},mode='',closed=false,reconnect,lastPacket=0,lastPing=0,rtt=null,swipe=null,aimPointer=null,fire=false,sweeping=false,pending='',pendingAt=0,lastHit=0,feedbackAt=0,received=0;
 let left=(localStorage.getItem('ap-hand')||profile.hand)==='left',aim={x:0,z:0};const releases=[];
 const token=localStorage.getItem('ap-token')||('guest-'+Math.random().toString(36).slice(2));localStorage.setItem('ap-token',token);
 const me=()=>state?.players.find(p=>p.id===identity.id),paused=()=>document.documentElement.dataset.partyPhase==='paused';
 const active=()=>ws?.readyState===1&&state?.phase==='playing'&&!identity.spectator&&!paused();
 const yourTurn=()=>active()&&state.currentId===identity.id&&state.state==='aim'&&pending!==state.turnId;
 function send(type,data={}){if(ws?.readyState===1)ws.send(JSON.stringify({type,data}));}
 function feedback(text,bad=false){$('ap-feedback').textContent=text;$('ap-feedback').style.background=bad?'#ecc2a9':'#d2efa4';feedbackAt=performance.now();try{navigator.vibrate?.(bad?22:12);}catch{}}
 function applyHand(){document.body.classList.toggle('ap-left',left);$('ap-hand').textContent=left?'⇄ Левая':'⇄ Правая';$('ap-hand').setAttribute('aria-label',left?'Сейчас левая рука. Переключить на правую':'Сейчас правая рука. Переключить на левую');}
 applyHand();
 function time(){return (state?.time||0)+(paused()?0:clamp((performance.now()-received)/1000,0,.18));}
 function setText(el,text){if(el.textContent!==String(text))el.textContent=String(text);}
 function render(){
  if(!state||!identity.id)return;const p=me(),current=state.players.find(p=>p.id===state.currentId),t=time(),waiting=state.phase==='waiting',result=state.phase==='results';
  document.body.classList.toggle('ap-spectator',!!identity.spectator);if(p){document.documentElement.style.setProperty('--player',p.color);setText($('ap-you'),`${parent===window?p.name+' · ':''}${p.score||0} ОЧКОВ${mode==='curling'?' · '+(p.team?'БИРЮЗОВЫЕ':'ФИОЛЕТОВЫЕ'):''}`);}
  setText($('ap-state'),paused()?'Пауза':identity.spectator?'Следующий матч — твой':waiting?'Готовность — в лобби':result?'Вот это сыграли!':sports()?(yourTurn()?'Твой бросок':pending===state.turnId&&state.state==='aim'?'Отправляем бросок…':state.state==='rolling'?'Смотри на экран!':state.state==='reveal'?'Считаем результат':`Бросает ${current?.name||'команда'}`):mode==='gate_siege'?`Волна ${state.wave} / 8`:'Лови беглецов!');
  setText($('ap-instruction'),sports()?(mode==='curling'?'Свайп вверх. Команда помогает щёткой.':'Свайп вверх. Изгиб конца — подкрутка.'):mode==='gate_siege'?'Держи огонь. Следи за нагревом.':'5 попаданий — пулемёт. Курьера не трогай.');
  $('ap-throw').disabled=!yourTurn();$('ap-precise-open').disabled=!yourTurn();for(const id of ['ap-offset','ap-spin','ap-power','ap-angle'])$(id).disabled=!yourTurn();document.querySelector('.ap-swipe-wrap').classList.toggle('disabled',!yourTurn());
  if(swipe&&(!yourTurn()||swipe.turn!==state.turnId))cancelSwipe();
  const canSweep=mode==='curling'&&active()&&state.state==='rolling'&&p?.team===current?.team;
  $('ap-sweep').hidden=mode!=='curling';$('ap-sweep').disabled=!canSweep||(p?.stamina||0)<.02;if(!canSweep)sweeping=false;
  setText($('ap-sweep'),sweeping?'ТРЁМ ЛЁД!':'Щётка · держи');$('ap-fire').disabled=!active()||(mode==='gate_siege'&&p?.overheatUntil>t);
  let value=0,label='';
  if(sports()){const seconds=Math.max(0,Math.ceil(state.deadline-t));label=yourTurn()?`На бросок: ${seconds} с`:mode==='curling'?`Щётка: ${Math.round((p?.stamina||0)*100)}%`:`Фрейм ${p?.card?.length||1} / ${state.frames||5}`;value=yourTurn()?seconds/25:p?.stamina||0;}
  else if(mode==='gate_siege'){value=p?.heat||0;label=p?.overheatUntil>t?`Остывает: ${(p.overheatUntil-t).toFixed(1)} с`:`Нагрев ${Math.round(value*100)}% · ворота ${Math.ceil(state.hp||0)}`;const cd=Math.max(0,(p?.repairUntil||0)-t);$('ap-ability').disabled=!active()||cd>0||state.hp>=state.maxHp;setText($('ap-ability'),cd>0?`Починка через ${cd.toFixed(1)} с`:'Починить ворота · +8 HP');}
  else{const remain=Math.max(0,(p?.boostUntil||0)-t);label=remain>0?`ПУЛЕМЁТ · ${remain.toFixed(1)} с`:p?.ready?'ПУЛЕМЁТ ГОТОВ':`Серия ${p?.streak||0} / 5`;value=remain?remain/5:p?.ready?1:(p?.streak||0)/5;$('ap-ability').disabled=!active()||!p?.ready||remain>0;setText($('ap-ability'),remain>0?`ПУЛЕМЁТ · ${remain.toFixed(1)} с`:'Включить пулемёт · 5 секунд');}
  $('ap-phone-meter').querySelector('i').style.width=clamp(value*100,0,100)+'%';setText($('ap-phone-meter').querySelector('span'),label);
  if((p?.hits||0)>lastHit){lastHit=p.hits;feedback('Попадание!');}
  if(result||paused()){fire=sweeping=false;}
  if(!swipe)drawSwipe();
 }
 function connect(){if(closed)return;clearTimeout(reconnect);const s=ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws`);
  s.onopen=()=>{lastPacket=performance.now();send('join',{name:profile.name||'Игрок',token,hand:left?'left':'right'});};
  s.onmessage=e=>{if(ws!==s)return;lastPacket=performance.now();let m;try{m=JSON.parse(e.data);}catch{return;}
   if(m.type==='state'){if(state&&m.data.time<state.time){lastHit=0;pending='';release();}state=m.data;received=performance.now();if(!mode){mode=state.mode;document.body.dataset.mode=mode;$('ap-sports').hidden=!sports();$('ap-shooter').hidden=sports();aim.z=mode==='gate_siege'?-18:0;}if(pending&&pending!==state.turnId)pending='';render();}
   if(m.type==='private'){identity=m.data;render();}
   if(m.type==='joined'){identity.id=m.data.id;pending='';setText($('ap-network'),'В игре');render();}
   if(m.type==='pong'&&typeof m.data?.client==='number'){rtt=Math.round(performance.now()-m.data.client);setText($('ap-network'),rtt>140?`Задержка ${rtt} мс`:`${rtt} мс`);}
   if(m.type==='throw-ack'&&pending===m.data.turnId&&!m.data.accepted){pending='';feedback('Бросок не принят. Проверь, чей ход.',true);render();}
   if(m.type==='error'||m.type==='join_error')feedback(typeof m.data==='string'?m.data:m.data.message,true);
  };
  s.onclose=()=>{if(ws!==s||closed)return;release();pending='';setText($('ap-state'),'Восстанавливаем связь…');setText($('ap-network'),'Нет связи');reconnect=setTimeout(connect,800);};s.onerror=()=>{};
 }
 function throwBall(data){if(!yourTurn())return;pending=state.turnId;pendingAt=performance.now();$('ap-precise').close();send('throw',{...data,offset:Number($('ap-offset').value),turnId:state.turnId});feedback(`${Math.round(data.power*100)}% · Бросок!`);render();}
 $('ap-throw').onclick=()=>throwBall({power:Number($('ap-power').value),angle:Number($('ap-angle').value),spin:Number($('ap-spin').value)});
 $('ap-precise-open').onclick=()=>{release();$('ap-precise').showModal();};$('ap-precise').addEventListener('click',e=>{if(e.target===$('ap-precise'))$('ap-precise').close();});
 const canvas=$('ap-swipe'),ctx=canvas.getContext('2d');
 function sample(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top,t:performance.now()};}
 function cancelSwipe(){const old=swipe;swipe=null;document.querySelector('.ap-swipe-wrap').classList.remove('active');$('ap-gesture-value').textContent='';if(old&&canvas.hasPointerCapture(old.id))canvas.releasePointerCapture(old.id);drawSwipe();}
 canvas.addEventListener('pointerdown',e=>{if(!yourTurn()||swipe)return;e.preventDefault();swipe={id:e.pointerId,turn:state.turnId,samples:[sample(e)]};canvas.setPointerCapture(e.pointerId);document.querySelector('.ap-swipe-wrap').classList.add('active');drawSwipe();});
 canvas.addEventListener('pointermove',e=>{if(swipe?.id!==e.pointerId)return;e.preventDefault();swipe.samples.push(sample(e));if(swipe.samples.length>160)swipe.samples.splice(1,1);const r=canvas.getBoundingClientRect(),g=PartyRules.gesture(swipe.samples,r.width,r.height);$('ap-gesture-value').textContent=g?Math.round(g.power*100)+'%':'';drawSwipe();});
 canvas.addEventListener('pointerup',e=>{if(swipe?.id!==e.pointerId)return;swipe.samples.push(sample(e));const r=canvas.getBoundingClientRect(),g=PartyRules.gesture(swipe.samples,r.width,r.height);cancelSwipe();if(g)throwBall({...g,spin:clamp(g.spin+Number($('ap-spin').value),-1,1)});else feedback('Свайпни вверх чуть дальше',true);});
 for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{if(swipe?.id===e.pointerId)cancelSwipe();});
 function drawSwipe(){const r=canvas.getBoundingClientRect();if(r.width<1||r.height<1||!ctx)return;const d=Math.min(devicePixelRatio||1,2),w=Math.round(r.width*d),h=Math.round(r.height*d);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,r.width,r.height);
  ctx.strokeStyle='#c1d2eb27';ctx.setLineDash([3,8]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(r.width/2,r.height-50);ctx.lineTo(r.width/2,55);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle=yourTurn()?'#c8f58b':'#91a2b4';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(r.width/2-8,65);ctx.lineTo(r.width/2,54);ctx.lineTo(r.width/2+8,65);ctx.stroke();
  ctx.fillStyle=yourTurn()?'#d4edba':'#92a2b4';ctx.font='500 12px Rubik,system-ui';ctx.textAlign='center';ctx.fillText(yourTurn()?'Свайпни вверх':'Следи за общим экраном',r.width/2,r.height-17);
  if(swipe){ctx.strokeStyle='#c8f58b';ctx.lineWidth=4;ctx.beginPath();swipe.samples.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
 }
 function hold(button,set){let pointer=null;const clear=()=>{const old=pointer;pointer=null;set(false);button.classList.remove('held');if(old!==null&&button.hasPointerCapture(old))button.releasePointerCapture(old);};releases.push(clear);button.addEventListener('pointerdown',e=>{if(button.disabled||pointer!==null)return;e.preventDefault();pointer=e.pointerId;button.setPointerCapture(pointer);button.classList.add('held');set(true);});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{if(e.pointerId===pointer)clear();});for(const event of ['pointerup','pointercancel'])window.addEventListener(event,e=>{if(e.pointerId===pointer)clear();});}
 hold($('ap-fire'),v=>{fire=v;emitInput();});hold($('ap-sweep'),v=>{sweeping=v;send('sweep',{held:v});});
 $('ap-ability').onclick=()=>send('ability');$('ap-hand').onclick=()=>{release();left=!left;localStorage.setItem('ap-hand',left?'left':'right');applyHand();};
 const pad=$('ap-aim');pad.addEventListener('pointerdown',e=>{if(!active()||aimPointer)return;e.preventDefault();aimPointer={id:e.pointerId,x:e.clientX,y:e.clientY};pad.setPointerCapture(e.pointerId);});
 pad.addEventListener('pointermove',e=>{if(aimPointer?.id!==e.pointerId)return;e.preventDefault();const r=pad.getBoundingClientRect(),gain=Number($('ap-sensitivity').value);aim.x=clamp(aim.x+(e.clientX-aimPointer.x)/r.width*38*gain,-20,20);aim.z=clamp(aim.z+(e.clientY-aimPointer.y)/r.height*(mode==='gate_siege'?41:28)*gain,mode==='gate_siege'?-34:-14,mode==='gate_siege'?7:14);aimPointer.x=e.clientX;aimPointer.y=e.clientY;paintAim();});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(event,e=>{if(aimPointer?.id===e.pointerId)aimPointer=null;});
 function paintAim(){$('ap-aim-dot').style.left=(8+(aim.x+20)/40*84)+'%';$('ap-aim-dot').style.top=(8+(aim.z+(mode==='gate_siege'?34:14))/(mode==='gate_siege'?41:28)*84)+'%';}
 function emitInput(){if(!sports()&&mode)send('input',{...aim,fire:fire&&active()});}
 function release(){for(const clear of releases)clear();fire=sweeping=false;aimPointer=null;cancelSwipe();emitInput();send('sweep',{held:false});}
 for(const e of ['blur','offline','orientationchange'])window.addEventListener(e,release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});window.addEventListener('party-phase-change',()=>{if(paused())release();render();});
 window.addEventListener('keydown',e=>{if(e.target.matches('input,button,select')||!active())return;if(e.code==='Space'&&!sports()){e.preventDefault();fire=true;emitInput();}if(e.key.startsWith('Arrow')&&!sports()){e.preventDefault();aim.x=clamp(aim.x+(e.key==='ArrowRight'?.6:e.key==='ArrowLeft'?-.6:0),-20,20);aim.z=clamp(aim.z+(e.key==='ArrowDown'?.6:e.key==='ArrowUp'?-.6:0),mode==='gate_siege'?-34:-14,mode==='gate_siege'?7:14);paintAim();emitInput();}});window.addEventListener('keyup',e=>{if(e.code==='Space'){fire=false;emitInput();}});
 let botAt=0;const timer=setInterval(()=>{
  const now=performance.now();if(ws?.readyState===1&&now-lastPing>2000){lastPing=now;send('ping',{client:now});}
  if(!state)return;if(!document.hidden){emitInput();if(yourTurn()){const r=canvas.getBoundingClientRect(),g=swipe?PartyRules.gesture(swipe.samples,r.width,r.height):null;send('preview',{turnId:state.turnId,offset:Number($('ap-offset').value),power:g?.power||Number($('ap-power').value),angle:g?.angle??Number($('ap-angle').value),spin:clamp((g?.spin||0)+Number($('ap-spin').value),-1,1)});}if(sweeping&&active())send('sweep',{held:true});render();}
  if(pending&&now-pendingAt>4000&&state.state==='aim'){pending='';feedback('Не получили подтверждение. Попробуй ещё раз.',true);}
  if(now-feedbackAt>1800)$('ap-feedback').textContent='';
  if(window.parent?.PARTY_TEST_BOT===true&&active()){const t=now/1000;if(yourTurn()&&t-botAt>1.5){botAt=t;throwBall({power:mode==='curling'?.60:.76,angle:(Math.random()-.5)*.1,spin:0});}if(mode==='gate_siege'){aim={x:Math.sin(t*.8)*3,z:-3-Math.abs(Math.sin(t*.25))*7};fire=true;}if(mode==='pop_shots'){aim={x:Math.sin(t*.75)*18,z:[-9,-1,7][Math.floor(t)%3]};fire=true;}if(me()?.ready)send('ability');if(mode==='curling')sweeping=state.state==='rolling';emitInput();}
 },50);
 window.addEventListener('resize',()=>{release();drawSwipe();});window.addEventListener('pagehide',e=>{release();if(!e.persisted){closed=true;clearInterval(timer);clearTimeout(reconnect);ws?.close();}});connect();
})();
