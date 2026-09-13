(() => {
 'use strict';
 const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 let ws,state,privateState={},reconnect,mode='',samples=[],swipePointer=null,aimPointer=null,aimStart=null,pendingTurn='',fire=false,sweeping=false,left=false,aim={x:0,z:-15},feedbackAt=0,lastHit=0;
 const profile=window.PARTY_PROFILE||{},releaseHandlers=[];
 const savedToken=localStorage.getItem('ap-token')||('guest-'+Math.random().toString(36).slice(2));localStorage.setItem('ap-token',savedToken);
 left=(localStorage.getItem('ap-hand')||profile.hand)==='left';document.body.classList.toggle('ap-left',left);
 const me=()=>state?.players.find(p=>p.id===privateState.id),active=()=>state?.phase==='playing'&&!privateState.spectator&&document.documentElement.dataset.partyPhase!=='paused';
 const yourTurn=()=>active()&&state.currentId===privateState.id&&state.state==='aim'&&pendingTurn!==state.turnId;
 function send(type,data={}){if(ws?.readyState===1)ws.send(JSON.stringify({type,data}));}
 function feedback(text){$('ap-feedback').textContent=text;feedbackAt=performance.now();}
 function connect(){clearTimeout(reconnect);const s=ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws`);
   s.onopen=()=>send('join',{name:profile.name||'Игрок',token:savedToken,hand:left?'left':'right'});
   s.onmessage=e=>{if(ws!==s)return;const m=JSON.parse(e.data);if(m.type==='state'){state=m.data;if(!mode){mode=state.mode;const sports=['curling','bowling'].includes(mode);$('ap-sports').hidden=!sports;$('ap-shooter').hidden=sports;aim.z=mode==='gate_siege'?-18:0;}render();}if(m.type==='private'){privateState=m.data;render();}if(m.type==='throw-ack'&&!m.data.accepted&&pendingTurn===m.data.turnId){pendingTurn='';feedback('Бросок не принят: проверь, чей сейчас ход.');render();}if(m.type==='joined'){privateState.id=m.data.id;pendingTurn='';render();}if(m.type==='error'||m.type==='join_error'){feedback(typeof m.data==='string'?m.data:m.data.message);}};
   s.onclose=()=>{if(ws===s){release();$('ap-state').textContent='Восстанавливаем связь…';reconnect=setTimeout(connect,800);}};s.onerror=()=>{};
 }
 function render(){if(!state||!privateState.id)return;const p=me(),sports=['curling','bowling'].includes(mode),current=state.players.find(p=>p.id===state.currentId);
   if(p){document.documentElement.style.setProperty('--player',p.color);$('ap-you').textContent=p.name+' · '+(p.score||0)+' очков';}
   document.body.classList.toggle('ap-spectator',!!privateState.spectator);
   const waiting=state.phase==='waiting',result=state.phase==='results';
   $('ap-state').textContent=privateState.spectator?'Следующая партия — твоя':waiting?'Ждём готовность':result?'Вот это сыграли!':sports?(yourTurn()?'Твой бросок':state.state==='rolling'?'Смотри на экран!':`Бросает ${current?.name||'команда'}`):mode==='gate_siege'?`Волна ${state.wave} / 8`:'Лови беглецов!';
   $('ap-instruction').textContent=privateState.spectator?'Ты подключился после старта. Наблюдай; вступишь в следующую партию.':sports?(mode==='curling'?'Свайпни снизу вверх. Загни конец свайпа для подкрутки. Во время скольжения помогай своей команде щёткой.':'Свайпни снизу вверх: длина и скорость задают силу. Загни конец свайпа для подкрутки.'):mode==='gate_siege'?'Веди прицел тачпадом и удерживай огонь другой рукой. Не подпускайте термитов к воротам.':'Веди прицел и стреляй. Пять попаданий подряд заряжают пулемёт. Жёлтых курьеров не трогай!';
   $('ap-throw').disabled=!yourTurn();for(const id of ['ap-offset','ap-spin','ap-power','ap-angle'])$(id).disabled=!yourTurn();
   const canSweep=mode==='curling'&&active()&&state.state==='rolling'&&p?.team===current?.team;
   $('ap-sweep').hidden=mode!=='curling';$('ap-sweep').disabled=!canSweep||p.stamina<.02;
   if(!canSweep)sweeping=false;
   $('ap-fire').disabled=!active();
   let label='',fraction=0;
   if(sports){label=yourTurn()?`На бросок: ${Math.max(0,Math.ceil(state.deadline-state.time))} с`:mode==='curling'?`Щётка: ${Math.round((p?.stamina||0)*100)}%`:'Смотри общий экран';fraction=yourTurn()?Math.max(0,(state.deadline-state.time)/25):(p?.stamina||0);}
   else if(mode==='gate_siege'){
     label=p?.overheatUntil>state.time?`Остывает: ${(p.overheatUntil-state.time).toFixed(1)} с`:`Нагрев: ${Math.round((p?.heat||0)*100)}%`;fraction=p?.heat||0;
     const cd=Math.max(0,(p?.repairUntil||0)-state.time);$('ap-ability').disabled=!active()||cd>0||state.hp>=state.maxHp;$('ap-ability').textContent=cd>0?`Починка через ${cd.toFixed(1)} с`:'Починить ворота · +8 HP';
   }else{
     const remaining=Math.max(0,(p?.boostUntil||0)-state.time);label=remaining>0?`ПУЛЕМЁТ · ${remaining.toFixed(1)} с`:p?.ready?'ПУЛЕМЁТ ГОТОВ':`Серия: ${p?.streak||0} / 5`;fraction=remaining>0?remaining/5:p?.ready?1:(p?.streak||0)/5;
     $('ap-ability').disabled=!active()||!p?.ready||remaining>0;$('ap-ability').textContent=remaining>0?`ПУЛЕМЁТ · ${remaining.toFixed(1)} с`:'Активировать пулемёт · 5 секунд';
   }
   $('ap-phone-meter').querySelector('i').style.width=clamp(fraction*100,0,100)+'%';$('ap-phone-meter').querySelector('span').textContent=label;
   if(p?.hits>lastHit){lastHit=p.hits;navigator.vibrate?.(12);feedback('Попадание!');}
   if(result){feedback(state.result?.winners.includes(privateState.id)?'Победа! 🎉':'Ещё одну?');release();}
   drawSwipe();
 }
 function throwBall(data){if(!yourTurn())return;pendingTurn=state.turnId;send('throw',{...data,offset:Number($('ap-offset').value),turnId:state.turnId});feedback('Бросок!');navigator.vibrate?.(16);render();}
 $('ap-throw').onclick=()=>throwBall({power:Number($('ap-power').value),angle:Number($('ap-angle').value),spin:Number($('ap-spin').value)});
 const canvas=$('ap-swipe');
 function sample(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top,t:performance.now()};}
 canvas.addEventListener('pointerdown',e=>{if(!yourTurn()||swipePointer!==null)return;swipePointer=e.pointerId;samples=[sample(e)];canvas.setPointerCapture(e.pointerId);e.preventDefault();drawSwipe();});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==swipePointer)return;samples.push(sample(e));if(samples.length>240)samples.splice(1,1);drawSwipe();});
 canvas.addEventListener('pointerup',e=>{if(e.pointerId!==swipePointer)return;samples.push(sample(e));swipePointer=null;const r=canvas.getBoundingClientRect(),d=PartyRules.gesture(samples,r.width,r.height);
   if(!d){feedback('Проведи снизу вверх чуть длиннее.');samples=[];drawSwipe();return;}
   throwBall({...d,spin:clamp(d.spin+Number($('ap-spin').value),-1,1)});
 });
 for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(e.pointerId===swipePointer){swipePointer=null;samples=[];drawSwipe();}});
 function hold(button,set){let pointer=null;releaseHandlers.push(()=>{const old=pointer;pointer=null;if(old!==null&&button.hasPointerCapture(old))button.releasePointerCapture(old);set(false);button.classList.remove('held');});button.addEventListener('pointerdown',e=>{if(button.disabled||pointer!==null)return;pointer=e.pointerId;button.setPointerCapture(pointer);set(true);button.classList.add('held');e.preventDefault();});const end=e=>{if(e.pointerId!==pointer)return;pointer=null;set(false);button.classList.remove('held');};for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,end);}
 hold($('ap-fire'),v=>{fire=v;emitInput();});hold($('ap-sweep'),v=>{sweeping=v;send('sweep',{held:v});});
 $('ap-ability').onclick=()=>send('ability');$('ap-hand').onclick=()=>{left=!left;localStorage.setItem('ap-hand',left?'left':'right');document.body.classList.toggle('ap-left',left);release();};
 const pad=$('ap-aim');pad.addEventListener('pointerdown',e=>{if(!active()||aimPointer!==null)return;aimPointer=e.pointerId;aimStart={x:e.clientX,y:e.clientY,world:{...aim}};pad.setPointerCapture(aimPointer);e.preventDefault();});
 pad.addEventListener('pointermove',e=>{if(e.pointerId!==aimPointer)return;const r=pad.getBoundingClientRect(),gain=Number($('ap-sensitivity').value);aim.x=clamp(aimStart.world.x+(e.clientX-aimStart.x)/r.width*38*gain,-20,20);aim.z=clamp(aimStart.world.z+(e.clientY-aimStart.y)/r.height*(mode==='gate_siege'?41:28)*gain,mode==='gate_siege'?-34:-14,mode==='gate_siege'?7:14);$('ap-aim-dot').style.left=clamp((e.clientX-r.left)/r.width*100,3,97)+'%';$('ap-aim-dot').style.top=clamp((e.clientY-r.top)/r.height*100,3,97)+'%';});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(name,e=>{if(e.pointerId===aimPointer){aimPointer=null;aimStart=null;}});
 function emitInput(){if(!['gate_siege','pop_shots'].includes(mode))return;send('input',{x:aim.x,z:aim.z,fire:fire&&active()});}
 function release(){for(const clear of releaseHandlers)clear();fire=sweeping=false;aimPointer=swipePointer=null;samples=[];$('ap-fire').classList.remove('held');$('ap-sweep').classList.remove('held');emitInput();send('sweep',{held:false});}
 for(const name of ['blur','pagehide','offline'])window.addEventListener(name,release);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
 window.addEventListener('party-phase-change',()=>{if(document.documentElement.dataset.partyPhase==='paused')release();});
 function drawSwipe(){const r=canvas.getBoundingClientRect();if(!r.width)return;const d=Math.min(devicePixelRatio,2);if(canvas.width!==Math.round(r.width*d)||canvas.height!==Math.round(r.height*d)){canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);}const ctx=canvas.getContext('2d');ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,r.width,r.height);ctx.strokeStyle='#ffffff18';ctx.setLineDash([5,9]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(r.width/2,r.height-30);ctx.lineTo(r.width/2,35);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=yourTurn()?'#c8ff73':'#73828a';ctx.font='700 34px Rubik, sans-serif';ctx.textAlign='center';ctx.fillText('↑',r.width/2,47);ctx.font='500 13px Rubik, sans-serif';ctx.fillText(yourTurn()?'Свайпни вверх':'Следи за общим экраном',r.width/2,r.height-15);if(samples.length){ctx.strokeStyle='#c8ff73';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();samples.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}}
 let botAt=0;
 setInterval(()=>{if(!state)return;const bot=window.parent?.PARTY_TEST_BOT===true;
   if(bot&&active()&&!document.hidden){const t=performance.now()/1000;if(yourTurn()&&t-botAt>1.5){botAt=t;throwBall({power:mode==='curling'?.60:.76,angle:(Math.random()-.5)*.12,spin:(Math.random()-.5)*.2});}if(mode==='gate_siege'){aim={x:Math.sin(t*.8)*3,z:-3-Math.abs(Math.sin(t*.25))*7};fire=true;}if(mode==='pop_shots'){aim={x:Math.sin(t*.75)*18,z:[-9,-1,7][Math.floor(t)%3]};fire=true;}if(me()?.ready)send('ability');if(mode==='curling')sweeping=active()&&state.state==='rolling';}
   emitInput();if(sweeping&&active())send('sweep',{held:true});if(performance.now()-feedbackAt>2400&&state.phase!=='results')$('ap-feedback').textContent='';
 },50);
 window.addEventListener('resize',drawSwipe);connect();
})();
