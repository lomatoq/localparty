const socket = io();
let state = null;
let cfg = null;
let localSettings = { spies:1, minutes:8, categoryHint:true };
const $ = s => document.querySelector(s);
const views = { lobby:$('#lobbyView'), reveal:$('#revealView'), playing:$('#playView'), voting:$('#voteView'), result:$('#resultView') };
const tips = [
  'Спроси про одежду: «я бы здесь выглядел странно в костюме?»',
  'Спроси про звук: «тут обычно тихо или громко?»',
  'Спроси про время: «ночью здесь что-то меняется?»',
  'Спроси про еду: «здесь нормально что-нибудь перекусить?»',
  'Спроси про поведение: «что здесь было бы очень странно делать?»'
];
function esc(s=''){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function show(phase){ Object.values(views).forEach(v=>v.classList.add('hidden')); (views[phase]||views.lobby).classList.remove('hidden'); $('#roundBadge').textContent = ({lobby:'лобби',reveal:'смотрим роли',playing:'идёт раунд',voting:'голосование',result:'результат'})[phase]||phase; }
function renderLobby(){
  const ps=state.players||[]; $('#playerCount').textContent=ps.length; $('#startBtn').disabled=ps.filter(p=>p.connected).length<2;
  $('#playersList').innerHTML = ps.length ? ps.map(p=>`<div class="player-row"><div class="avatar">${esc(p.emoji)}</div><b>${esc(p.name)}</b><span class="status">${p.connected?'online':'offline'}</span><button class="kick" data-kick="${p.id}">×</button></div>`).join('') : '<div class="empty">Пока никого. Пусть первый игрок сканирует QR 👆</div>';
  $('#spiesVal').textContent=state.settings.spies; $('#minutes').value=state.settings.minutes; $('#hintToggle').classList.toggle('on',state.settings.categoryHint);
  document.querySelectorAll('[data-kick]').forEach(b=>b.onclick=()=>socket.emit('host:kick',{playerId:b.dataset.kick}));
}
function renderReveal(){ const ps=(state.players||[]).filter(p=>!p.spectator); const ready=ps.filter(p=>p.ready).length; $('#readyCount').textContent=`${ready} / ${ps.length}`; $('#readyGrid').innerHTML=ps.map(p=>`<div class="ready-item ${p.ready?'ready':''}"><span>${esc(p.emoji)}</span><b>${esc(p.name)}</b><small>${p.ready?'готов':'смотрит роль…'}</small></div>`).join(''); }
function renderPlaying(){$('#voteBtn').disabled=!!state.duel;$('#voteBtn').textContent=state.duel?'ДУЭЛЬ: УГАДАЙ ЛОКАЦИЮ ДО КОНЦА ТАЙМЕРА':'ПЕРЕЙТИ К ГОЛОСОВАНИЮ';
  $('#playCount').textContent=`${state.players.length} игроков`; $('#roundNum').textContent=state.round;
  const t=state.currentTurn; if(t?.asker&&t?.target){$('#askEmoji').textContent=t.asker.emoji;$('#askName').textContent=t.asker.name;$('#targetEmoji').textContent=t.target.emoji;$('#targetName').textContent=t.target.name}
  $('#questionTip').textContent=tips[(t?.index||0)%tips.length];
  $('#playRoster').innerHTML=state.players.map(p=>`<div class="roster-item ${t?.asker?.id===p.id?'asker':''}"><span class="emoji">${esc(p.emoji)}</span><b>${esc(p.name)}</b><span class="muted">${p.connected?'●':'○'}</span></div>`).join('');
}
function renderVote(){ $('#voteCount').textContent=state.voteCount; $('#voteProgress').innerHTML=(state.players||[]).map((_,i)=>`<i class="vote-dot ${i<state.voteCount?'done':''}"></i>`).join(''); }
function renderResult(){
  const r=state.result||{}; const spies=(state.players||[]).filter(p=>r.spyIds?.includes(p.id)); const accused=(state.players||[]).filter(p=>r.accusedIds?.includes(p.id));
  let title='Раунд окончен', icon='🕵️', text='';
  if(r.reason==='spy_caught'){title='Шпион пойман!';icon='🎯';text=`Город победил. Подозреваемый оказался шпионом.`}
  if(r.reason==='wrong_accusation'){title='Шпион ускользнул';icon='😈';text=`Вы выбрали ${accused.map(x=>x.name).join(', ')}, но это был не шпион.`}
  if(r.reason==='tie'){title='Ничья — шпион спасён';icon='🫥';text='Голоса разделились. В этот раз шпиону повезло.'}
  if(r.reason==='spy_guessed'){title='Шпион угадал место';icon='🧠';text='Шпион сделал финальную попытку и попал точно.'}
  if(r.reason==='duel_timeout'){title='Мирный победил';icon='⏱';text='Время дуэли вышло. Шпион не угадал локацию.'}if(r.reason==='spy_failed_guess'){title='Шпион ошибся';icon='💥';text='Шпион рискнул угадать локацию и промахнулся.'}
  $('#resultTitle').textContent=title;$('#resultIcon').textContent=icon;$('#resultText').textContent=`${text} Локация: ${r.location||'—'}.`;
  $('#revealChips').innerHTML=spies.map(p=>`<span class="pill spy">🕵️ ${esc(p.name)}</span>`).join('');
}
function render(){ if(!state)return; show(state.phase); if(state.phase==='lobby')renderLobby(); if(state.phase==='reveal')renderReveal(); if(state.phase==='playing')renderPlaying(); if(state.phase==='voting')renderVote(); if(state.phase==='result')renderResult(); }
function updateTimer(){ if(!state||state.phase!=='playing'||!state.timerEndsAt)return; const total=state.settings.minutes*60_000; const rem=Math.max(0,state.timerEndsAt-Date.now()); const m=Math.floor(rem/60000),s=Math.floor((rem%60000)/1000); $('#timer').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; $('#timerFill').style.width=`${Math.max(0,Math.min(100,rem/total*100))}%`; }
setInterval(updateTimer,250);
fetch('/api/config').then(r=>r.json()).then(c=>{cfg=c;$('#networkText').textContent=`${c.ip}:${c.port}`;$('#joinUrl').textContent=c.joinUrl;if(c.qr){$('#qrBox').classList.remove('skeleton');$('#qrBox').innerHTML=`<img src="${c.qr}" alt="QR">`;}});
socket.on('connect',()=>socket.emit('host:hello')); socket.on('state:public',s=>{state=s;localSettings={...s.settings};render()});
$('#startBtn').onclick=()=>socket.emit('host:start',{},r=>{if(!r?.ok)alert(r?.error||'Не удалось начать')});
$('#forcePlayBtn').onclick=()=>socket.emit('host:beginPlaying'); $('#nextTurnBtn').onclick=()=>socket.emit('host:nextTurn'); $('#voteBtn').onclick=()=>socket.emit('host:beginVote'); $('#finishVoteBtn').onclick=()=>socket.emit('host:finishVote'); $('#againBtn').onclick=()=>socket.emit('host:reset');
document.querySelectorAll('[data-spy]').forEach(b=>b.onclick=()=>{const n=Math.max(1,Math.min(3,(state?.settings.spies||1)+Number(b.dataset.spy)));socket.emit('host:settings',{spies:n})});
$('#minutes').onchange=e=>socket.emit('host:settings',{minutes:Number(e.target.value)}); $('#hintToggle').onclick=()=>socket.emit('host:settings',{categoryHint:!state.settings.categoryHint});
