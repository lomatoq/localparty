const socket = io();
let state = null;
let cfg = null;
let localSettings = { spies:1, minutes:8, categoryHint:true };
let lobbyRoster244='',readyRoster244='';
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
  const rosterKey=JSON.stringify([ps.map(p=>[p.id,p.name,p.emoji,p.connected]),window.PartyI18n?.language]);if(rosterKey!==lobbyRoster244){lobbyRoster244=rosterKey;$('#playersList').innerHTML = ps.length ? ps.map(p=>`<div class="player-row"><div class="avatar">${esc(p.emoji)}</div><b class="player-name" data-no-translate>${esc(p.name)}</b><span class="status">${p.connected?'online':'offline'}</span><button class="kick" data-kick="${p.id}">×</button></div>`).join('') : '<div class="empty">Пока никого. Пусть первый игрок сканирует QR 👆</div>';
  document.querySelectorAll('[data-kick]').forEach(b=>b.onclick=()=>socket.emit('host:kick',{playerId:b.dataset.kick}));}
  $('#spiesVal').textContent=state.settings.spies; $('#minutes').value=state.settings.minutes; $('#hintToggle').classList.toggle('on',state.settings.categoryHint);
}

function renderReveal(){ const ps=(state.players||[]).filter(p=>!p.spectator),key=JSON.stringify([ps,window.PartyI18n?.language,profileView244()]);if(key===readyRoster244)return;readyRoster244=key; $('#readyGrid').style.setProperty('--spy-ready-count',Math.min(4,Math.max(1,ps.length))); const ready=ps.filter(p=>p.ready).length; $('#readyCount').textContent=`${ready} / ${ps.length}`; $('#readyGrid').innerHTML=ps.map(p=>`<div class="ready-item ${p.ready?'ready':''}"><span class="spy-identity-avatar" aria-hidden="true"></span><b class="player-name" data-no-translate>${esc(p.name)}</b><small>${p.ready?'готов':'смотрит роль…'}</small></div>`).join(''); [...$('#readyGrid').children].forEach((row,i)=>identityAvatar(row.querySelector('.spy-identity-avatar'),ps[i])); }
function identityAvatar(node,p){
 const profile=(window.PARTY_ROSTER||[]).find(x=>x.id===p?.id)||p||{},key=JSON.stringify([profile.id,profile.name,profile.avatar]);if(node.dataset.identity===key)return;node.dataset.identity=key;
 if(profile.avatar){const image=new Image();image.src=profile.avatar;image.alt='';image.className='spy-photo';node.replaceChildren(image);return;}
 const image=new Image();let seed=0;for(const ch of String(profile.id||profile.name||'?'))seed=(seed*31+ch.codePointAt(0))>>>0;image.src='/assets/avatars/atlas-mascots/mascot-'+String(seed%16+1).padStart(2,'0')+'.webp';image.alt='';image.className='spy-mascot';node.textContent=Array.from(profile.name||'?')[0];image.onload=()=>{if(node.dataset.identity===key)node.replaceChildren(image);};
}
let rosterIdentity='';
function renderPlaying(){$('#voteBtn').disabled=!!state.duel;$('#voteBtn').textContent=state.duel?'ДУЭЛЬ: УГАДАЙ ЛОКАЦИЮ ДО КОНЦА ТАЙМЕРА':'ПЕРЕЙТИ К ГОЛОСОВАНИЮ';
  $('#playCount').textContent=`${state.players.length} игроков`; $('#roundNum').textContent=state.round;
  const t=state.currentTurn; if(t?.asker&&t?.target){identityAvatar($('#askEmoji'),t.asker);$('#askName').textContent=t.asker.name;identityAvatar($('#targetEmoji'),t.target);$('#targetName').textContent=t.target.name}
  $('#questionTip').textContent=tips[(t?.index||0)%tips.length];
  const key=JSON.stringify([state.players.map(p=>[p.id,p.name,p.connected]),t?.asker?.id,t?.target?.id,window.PartyI18n?.language,profileView244()]);if(key===rosterIdentity)return;rosterIdentity=key;
  const rosterScroll=$('#playRoster').scrollTop;
  $('#playRoster').replaceChildren(...state.players.map(p=>{const row=document.createElement('div'),avatar=document.createElement('span'),copy=document.createElement('div'),name=document.createElement('b'),status=document.createElement('small');const asking=t?.asker?.id===p.id,answering=t?.target?.id===p.id;row.className='roster-item'+(asking?' asker':answering?' target':'');avatar.className='spy-roster-avatar';identityAvatar(avatar,p);name.className='player-name';name.dataset.noTranslate='';name.textContent=p.name;status.textContent=asking?'Asking':answering?'Answering':p.connected?'Listening':'Offline';copy.className='spy-roster-copy';copy.append(name,status);row.append(avatar,copy);return row;}));
  $('#playRoster').scrollTop=rosterScroll;$('#playRoster').dataset.density=state.players.length>8?'dense':'normal';
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
// Retain the presented snapshot, not network/game state. The clock still ticks
// from the newest state; locale/profile/input changes invalidate presentation.
let profileFields244=[],profileRevision244=0;
function profileView244(){const rows=window.PARTY_ROSTER||[],next=rows.map(p=>[p.id,p.name,p.avatar,!!p.testBot]);if(next.length!==profileFields244.length||next.some((row,i)=>row.some((value,j)=>value!==profileFields244[i]?.[j]))){profileFields244=next;profileRevision244++;}return profileRevision244;}
let presentedView244='';
function viewChanged244(snapshot,local=[]){const {serverTime,...view}=snapshot;const key=JSON.stringify([view,local,window.PartyI18n?.language,profileView244()]);if(key===presentedView244)return false;presentedView244=key;return true;}
const timerText244=new WeakMap();
function writeTimerText244(node,value){const text=String(value);if(timerText244.get(node)===text)return;timerText244.set(node,text);node.textContent=text;}

function render(){ if(!state)return;if(!viewChanged244(state)&&(state.phase!=='lobby'||$('#minutes').value===String(state.settings.minutes)))return; show(state.phase); if(state.phase==='lobby')renderLobby(); if(state.phase==='reveal')renderReveal(); if(state.phase==='playing')renderPlaying(); if(state.phase==='voting')renderVote(); if(state.phase==='result')renderResult(); }
function updateTimer(){ if(!state||state.phase!=='playing'||!state.timerEndsAt)return; const total=state.settings.minutes*60_000; const rem=Math.max(0,state.timerEndsAt-Date.now()); const m=Math.floor(rem/60000),s=Math.floor((rem%60000)/1000); writeTimerText244($('#timer'),`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`); $('#timerFill').style.width=`${Math.max(0,Math.min(100,rem/total*100))}%`; }
setInterval(updateTimer,250);
fetch('/api/config').then(r=>r.json()).then(c=>{cfg=c;$('#networkText').textContent=`${c.ip}:${c.port}`;$('#joinUrl').textContent=c.joinUrl;if(c.qr){$('#qrBox').classList.remove('skeleton');$('#qrBox').innerHTML=`<img src="${c.qr}" alt="QR">`;}});
socket.on('connect',()=>socket.emit('host:hello')); socket.on('state:public',s=>{state=s;localSettings={...s.settings};render()});
$('#startBtn').onclick=()=>socket.emit('host:start',{},r=>{if(!r?.ok)alert(r?.error||'Не удалось начать')});
$('#forcePlayBtn').onclick=()=>socket.emit('host:beginPlaying'); $('#nextTurnBtn').onclick=()=>socket.emit('host:nextTurn'); $('#voteBtn').onclick=()=>socket.emit('host:beginVote'); $('#finishVoteBtn').onclick=()=>socket.emit('host:finishVote'); $('#againBtn').onclick=()=>socket.emit('host:reset');
document.querySelectorAll('[data-spy]').forEach(b=>b.onclick=()=>{const n=Math.max(1,Math.min(3,(state?.settings.spies||1)+Number(b.dataset.spy)));socket.emit('host:settings',{spies:n})});
$('#minutes').onchange=e=>socket.emit('host:settings',{minutes:Number(e.target.value)}); $('#hintToggle').onclick=()=>socket.emit('host:settings',{categoryHint:!state.settings.categoryHint});
