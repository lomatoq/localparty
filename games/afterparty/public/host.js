const $=id=>document.getElementById(id);
const titles={curling:'Лёд & характер',bowling:'После страйка',gate_siege:'Последние ворота',pop_shots:'Ну, попались!'};
const sports=m=>m==='bowling'||m==='curling';
let ws,view,state,mode,loading=false,startWanted=false,closed=false,reconnect,lastAt=performance.now(),received=lastAt,toastAt=0,lastEvent=0,sound=false,audio,lastSfx=0;
const cards=new Map();
function send(type,data={}){if(ws?.readyState===1)ws.send(JSON.stringify({type,data}));}
function setText(el,value){value=String(value??'');if(el.textContent!==value)el.textContent=value;}
function announce(text,good=true){if(!text)return;setText($('ap-toast'),text);$('ap-toast').classList.add('show');toastAt=performance.now();beep(good?620:180,.12);}
function beep(freq,seconds){if(!sound||audio?.state!=='running'||performance.now()-lastSfx<85)return;lastSfx=performance.now();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.5,audio.currentTime+seconds);g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+seconds);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+seconds+.02);}
function showError(message){$('ap-error').hidden=false;setText($('ap-error'),message);}
async function setup(m){
 if(loading||view)return;loading=true;mode=m;document.body.dataset.mode=m;setText($('ap-title'),titles[m]);$('ap-camera').hidden=!sports(m);$('ap-quality').hidden=!sports(m);
 try{const module=await import(sports(m)?'./sports-view.js':'./arcade-view.js');view=sports(m)?new module.SportsView($('ap-stage'),m,showError):new module.ArcadeView($('ap-stage'),m);if(state)view.setState(state);document.body.dataset.sceneReady='true';hud();maybeStart();}
 catch(e){console.error(e);showError('Не удалось открыть площадку. '+e.message);}finally{loading=false;}
}
function createCard(p){const row=document.createElement('section');row.className='ap-score';const top=document.createElement('div'),name=document.createElement('b'),score=document.createElement('strong'),hint=document.createElement('small'),frames=document.createElement('div'),bar=document.createElement('div'),fill=document.createElement('i');frames.className='ap-frames';bar.className='ap-player-meter';bar.append(fill);top.append(name,score);row.append(top,frames,hint,bar);$('ap-scores').append(row);return {row,name,score,hint,frames,fill,frameKey:''};}
function hud(){if(!state)return;const s=state,waiting=s.phase==='waiting',results=s.phase==='results',current=s.players.find(p=>p.id===s.currentId);
 $('ap-wait').hidden=!waiting;$('ap-result').hidden=!results;$('start').hidden=!waiting;$('start').disabled=!view||s.players.filter(p=>p.connected).length<2;
 $('ap-frame-option').hidden=mode!=='bowling'||!waiting;$('ap-frames').disabled=!waiting;
 setText($('ap-wait-copy'),`${s.players.filter(p=>p.connected).length} игроков подключились. Когда все готовы — начинаем.`);
 setText($('ap-status'),waiting?'Выбирайте готовность':results?'Матч завершён':mode==='bowling'?`${s.state==='reveal'?'Результат броска':s.state==='rolling'?'Шар на дорожке':current?.name||'Ваш выход'}`:mode==='curling'?`Энд ${s.end} / ${s.ends||3} · ${s.teamScore?.join(' : ')||'0 : 0'}`:mode==='gate_siege'?`Волна ${s.wave||0} / ${s.maxWaves||8}`:`Лови беглецов · ${Math.ceil(Math.max(0,s.deadline-s.time))} с`);
 const frame=current?.card?.length||1;
 setText($('ap-subtitle'),waiting?'Локальный Wi-Fi · один общий экран':mode==='bowling'?`${current?.name||''} · фрейм ${frame}/${s.frames||5}${s.gutter?' · жёлоб':''}`:mode==='curling'?`${current?.name||''} · ${s.state==='rolling'?'помогайте щёткой':s.state==='end'?'считаем энд':'бросок по очереди'}`:mode==='gate_siege'?`${s.remaining||0} в рое · ${s.deadline>s.time?'передышка':'общая оборона'}`:'Курьер с белым флагом — не цель');
 $('ap-health').hidden=mode!=='gate_siege'||waiting;if(mode==='gate_siege'){setText($('ap-health-label'),`ВОРОТА ${Math.ceil(s.hp||0)} / ${s.maxHp||240}`);$('ap-health').querySelector('i').style.width=100*(s.hp||0)/(s.maxHp||240)+'%';document.querySelector('.ap-round').classList.toggle('danger',s.hp<s.maxHp*.25);}
 $('ap-scores').style.setProperty('--columns',Math.min(s.players.length||1,innerWidth<800?4:8));
 const seen=new Set();s.players.forEach((p,i)=>{seen.add(p.id);let card=cards.get(p.id);if(!card){card=createCard(p);cards.set(p.id,card);}card.row.style.setProperty('--player',p.color);card.row.classList.toggle('current',s.currentId===p.id&&s.phase==='playing');card.row.classList.toggle('offline',!p.connected);setText(card.name,`${i+1}. ${p.name}`);card.name.title=p.name;setText(card.score,p.score||0);
  const remaining=Math.max(0,(p.boostUntil||0)-s.time);let hint=!p.connected?'Возвращается в игру':waiting?'В комнате':mode==='curling'?(p.team===0?'Фиолетовая команда':'Бирюзовая команда'):mode==='bowling'?'Страйк X · спэр /':mode==='gate_siege'?(p.overheatUntil>s.time?'Перегрев · остываем':`${p.hits||0} попаданий`):remaining?`ПУЛЕМЁТ · ${remaining.toFixed(1)} с`:p.ready?'ПУЛЕМЁТ ГОТОВ':`Серия ${p.streak||0}/5`;setText(card.hint,hint);
  const key=JSON.stringify(p.card||[]);card.frames.hidden=mode!=='bowling'||!p.card;if(key!==card.frameKey){card.frameKey=key;card.frames.replaceChildren(...(p.card||[]).map((f,j)=>{const span=document.createElement('span');span.textContent=f.rolls.map((v,k)=>v===10?'X':k>0&&f.rolls[k-1]!==10&&f.rolls[k-1]+v===10?'/':v||'–').join(' ')||'·';span.title=`Фрейм ${j+1}: ${f.total===null?'ждём бонус':f.total}`;return span;}));}
  const fill=mode==='curling'?p.stamina:mode==='gate_siege'?p.heat:remaining?remaining/5:p.ready?1:(p.streak||0)/5;card.fill.style.width=Math.max(0,Math.min(100,(fill||0)*100))+'%';
 });for(const[id,card]of cards)if(!seen.has(id)){card.row.remove();cards.delete(id);}
 for(const e of s.events||[]){if(e.id<=lastEvent)continue;lastEvent=e.id;if(e.text)announce(e.text);else if(['strike','spare','roll'].includes(e.kind))announce(e.kind==='strike'?'СТРАЙК!':e.kind==='spare'?'СПЭР!':e.pins?`+${e.pins} кеглей`:'Чуть мимо. Следующий получится!');else if(e.kind==='impact')beep(140,.10);}
 if(results){setText($('ap-result').querySelector('h2'),s.result?.title||'Вот это сыграли');const winners=s.players.filter(p=>s.result?.winners.includes(p.id)).map(p=>p.name);setText($('ap-result').querySelector('p'),winners.length?'Победители: '+winners.join(', '):'В этот раз — термиты. Возьмём реванш?');}
}
function maybeStart(){if(startWanted&&state?.phase==='waiting'&&view&&!$('start').disabled){startWanted=false;send('start',{frames:Number($('ap-frames').value)});}}
function connect(){clearTimeout(reconnect);if(closed)return;const s=ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws`);s.onopen=()=>send('host');s.onmessage=e=>{if(ws!==s)return;let m;try{m=JSON.parse(e.data);}catch{return;}if(m.type==='state'){
 const next=m.data;if(state&&(next.time<state.time||state.phase==='results'&&next.phase==='waiting')){lastEvent=0;view?.clear();$('ap-toast').classList.remove('show');}
 state=next;received=performance.now();if(!mode)setup(state.mode);view?.setState(state);hud();maybeStart();
 }else if(m.type==='error')showError(typeof m.data==='string'?m.data:'Ошибка сервера');};s.onclose=()=>{if(ws===s&&!closed){setText($('ap-status'),'Восстанавливаем связь…');reconnect=setTimeout(connect,800);}};s.onerror=()=>{};}
$('start').onclick=()=>{if(!$('start').disabled)send('start',{frames:Number($('ap-frames').value)});};$('ap-again').onclick=()=>{startWanted=false;send('reset');};
$('ap-camera').onclick=()=>{const next=$('ap-camera').getAttribute('aria-pressed')!=='true';$('ap-camera').setAttribute('aria-pressed',String(next));setText($('ap-camera'),next?'◎ Обзор':'◉ Следить');view?.setOverview(next);};
$('ap-quality').onchange=()=>view?.setQuality($('ap-quality').value);
$('ap-sound').onclick=async()=>{sound=!sound;$('ap-sound').setAttribute('aria-pressed',String(sound));setText($('ap-sound'),sound?'Звук вкл.':'Звук выкл.');if(sound){try{audio||=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();beep(400,.1);}catch{sound=false;setText($('ap-sound'),'Звук недоступен');}}};
window.addEventListener('message',e=>{if(parent===window||e.source!==parent||e.origin!==location.origin||e.data?.type!=='party-start'||e.data.instance!==parent.PARTY_INSTANCE)return;startWanted=true;maybeStart();});
let raf;
function tick(now){raf=requestAnimationFrame(tick);const dt=Math.min(.08,(now-lastAt)/1000);lastAt=now;if(document.hidden)return;const paused=document.documentElement.dataset.partyPhase==='paused';try{view?.update(dt,now,paused);}catch(e){console.error(e);showError('Ошибка отрисовки: '+e.message);view?.dispose();view=null;}if(now-toastAt>2200)$('ap-toast').classList.remove('show');}
window.addEventListener('resize',()=>{hud();});window.addEventListener('pagehide',e=>{if(e.persisted)return;closed=true;clearTimeout(reconnect);cancelAnimationFrame(raf);ws?.close();view?.dispose();audio?.close();});connect();raf=requestAnimationFrame(tick);
