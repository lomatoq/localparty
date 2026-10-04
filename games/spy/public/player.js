const socket = io();
const $=s=>document.querySelector(s); const screens={join:$('#joinView'),lobby:$('#lobbyView'),reveal:$('#revealView'),playing:$('#playView'),voting:$('#voteView'),result:$('#resultView')};
let publicState=null, privateState=null, playerId=window.PARTY_PROFILE?.id||localStorage.getItem('spyPlayerId')||(crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now()), joined=false, selectedEmoji=localStorage.getItem('spyEmoji')||'😎', lastName=window.PARTY_PROFILE?.name||localStorage.getItem('spyName')||'';
const emojis=['😎','🤠','🥸','👽','🐸','🦊','🐼','🐵','🦄','🤖','👻','🦖'];
function esc(s=''){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function show(name){if(name!=='playing'){$('#guessSheet')?.classList.add('hidden');$('#guessSheet')?.classList.remove('closing');}Object.values(screens).forEach(x=>x.classList.add('hidden'));(screens[name]||screens.join).classList.remove('hidden')}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function renderEmoji(){ $('#emojiRow').innerHTML=emojis.map(e=>`<button type="button" class="emoji-choice ${e===selectedEmoji?'selected':''}" data-e="${e}">${e}</button>`).join(''); document.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{selectedEmoji=b.dataset.e;localStorage.setItem('spyEmoji',selectedEmoji);renderEmoji()}); }
renderEmoji(); $('#nameInput').value=lastName;
function tryJoin(name=lastName){ if(!name)return; socket.emit('player:join',{id:playerId,name,emoji:selectedEmoji},r=>{if(!r?.ok){toast(r?.error||'Не удалось войти');show('join');return} playerId=r.id;joined=true;localStorage.setItem('spyPlayerId',playerId);localStorage.setItem('spyName',name);lastName=name;render();}); }
$('#joinForm').onsubmit=e=>{e.preventDefault();const n=$('#nameInput').value.trim();if(!n)return;tryJoin(n)};
socket.on('connect',()=>{if(lastName)tryJoin(lastName)}); socket.on('toast',toast); socket.on('state:public',s=>{publicState=s;render()}); socket.on('state:private',s=>{privateState=s;joined=true;render()});
function renderLobby(){const me=privateState?.player; if(!me)return;$('#lobbyEmoji').textContent=me.emoji;$('#lobbyName').textContent=me.name;$('#lobbyCount').textContent=publicState?.players?.length||0}
function renderReveal(){if(seenRound!==publicState?.round){seenRound=publicState?.round;heldLongEnough=false;revealEnd();}const s=privateState?.secret;if(!s)return;$('#secretIcon').textContent=privateState.isSpy?'🕵️':'📍';$('#secretTitle').textContent=s.title;$('#secretRole').textContent=s.role?`Твоя роль: ${s.role}`:'';$('#secretRole').style.display=s.role?'block':'none';$('#secretSub').textContent=s.subtitle; const ready=privateState?.player?.ready;$('#readyPill').textContent=ready?'готов ✓':'не готов';$('#readyBtn').disabled=ready||!heldLongEnough;$('#readyBtn').textContent=ready?'ГОТОВ ✓':'Я УВИДЕЛ — ГОТОВ';}
let holdTimer=null, heldLongEnough=false,seenRound=0; const secret=$('#secretCard'); function revealStart(e){e?.preventDefault();heldLongEnough=false;clearTimeout(holdTimer);holdTimer=setTimeout(()=>{heldLongEnough=true;secret.classList.add('revealing');$('#readyBtn').disabled=!!privateState?.player?.ready},260)} function revealEnd(){clearTimeout(holdTimer);secret.classList.remove('revealing')};['pointerdown'].forEach(ev=>secret.addEventListener(ev,revealStart,{passive:false}));['pointerup','pointercancel','pointerleave'].forEach(ev=>secret.addEventListener(ev,revealEnd));
secret.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)&&!e.repeat){revealStart(e);}});secret.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();revealEnd();}});secret.addEventListener('blur',revealEnd);window.addEventListener('blur',revealEnd);
$('#readyBtn').onclick=()=>{if(!heldLongEnough||privateState?.player?.ready)return;$('#readyBtn').disabled=true;socket.emit('player:ready');};
function playerName(name){const node=document.createElement('span');node.className='player-name turn-name';node.dataset.noTranslate='';node.textContent=name||'—';return node;}
function turnHeading(action,name){const verb=document.createElement('span');verb.className='turn-action';verb.textContent=action;$('#turnTitle').replaceChildren(verb,document.createTextNode(' '),playerName(name));}
function identityAvatar(node,p){
 const profile=(window.PARTY_ROSTER||[]).find(x=>x.id===p?.id)||p||{},key=JSON.stringify([profile.id,profile.name,profile.avatar]);if(node.dataset.identity===key)return;node.dataset.identity=key;
 if(profile.avatar){const image=new Image();image.src=profile.avatar;image.alt='';image.className='spy-photo';node.replaceChildren(image);return;}
 const image=new Image();let seed=0;for(const ch of String(profile.id||profile.name||'?'))seed=(seed*31+ch.codePointAt(0))>>>0;image.src='/assets/avatars/atlas-mascots/mascot-'+String(seed%16+1).padStart(2,'0')+'.webp';image.alt='';image.className='spy-mascot';node.textContent=Array.from(profile.name||'?')[0];image.onload=()=>{if(node.dataset.identity===key)node.replaceChildren(image);};
}
function renderPlay(){
 if(!publicState||!privateState)return;
 $('#phoneRound').textContent=publicState.round;
 $('#duelTag').classList.toggle('hidden',!publicState.duel);
 const t=publicState.currentTurn,me=privateState.player,ask=t?.asker?.id===me.id,target=t?.target?.id===me.id;
 $('#turnBox').classList.toggle('me',ask||target);
 $('#turnBox').dataset.turn=ask?'asking':target?'answering':'listening';
 identityAvatar($('#phoneAskerAvatar'),t?.asker);identityAvatar($('#phoneTargetAvatar'),t?.target);$('#phoneAskerName').textContent=t?.asker?.name||'—';$('#phoneTargetName').textContent=t?.target?.name||'—';
 $('#turnKicker').textContent=ask?'Your turn':target?'Your answer':'Listen closely';
 if(ask){turnHeading('Ask',t.target.name);$('#turnSub').textContent='Ask one question aloud, then pass the turn.';}
 else if(target){turnHeading('Answer',t.asker.name);$('#turnSub').textContent="Answer naturally, but don't name the location directly.";}
 else {$('#turnTitle').textContent='Listen closely';$('#turnSub').textContent='Listen carefully. Contradictions expose the spy.';}
 $('#nextTurnPhone').classList.toggle('hidden',!ask);
 const sec=privateState.secret,icon=document.createElement('img'),title=document.createElement('h3'),detail=document.createElement('p');
 icon.className='secret-mini-icon';icon.alt='';icon.src='/assets/icons/game-pack/'+(privateState.isSpy?'question-mark':'anchor')+'.svg';
 title.className='secret-mini-title';title.textContent=privateState.isSpy?'You are the spy':sec?.location||'—';
 detail.className='secret-mini-detail';detail.textContent=privateState.isSpy?sec?.subtitle||'':sec?.role?`Role: ${sec.role}`:'';
 const heading=document.createElement('div');heading.className='secret-mini-heading';heading.append(icon,title);
 $('#mySecretMini').replaceChildren(heading,detail);$('#mySecretMini').classList.toggle('is-spy',!!privateState.isSpy);
 $('#spyGuessBtn').classList.toggle('hidden',!privateState.isSpy);
 if(privateState.isSpy){
  const previous=$('#locationGuess').value,options=[...$('#locationGuess').options],guesses=privateState.locationsForGuess||[];
  if(options.length===guesses.length&&options.every((option,index)=>option.value===guesses[index]))return;
  $('#locationGuess').replaceChildren(...(privateState.locationsForGuess||[]).map(x=>{const option=document.createElement('option');option.value=x;option.textContent=x;return option;}));
  if([...$('#locationGuess').options].some(x=>x.value===previous))$('#locationGuess').value=previous;
 }
}
$('#nextTurnPhone').onclick=()=>socket.emit('player:nextTurn');
let guessCloseTimer=null;
function showGuess(){clearTimeout(guessCloseTimer);const sheet=$('#guessSheet');sheet.classList.remove('hidden','closing');$('#closeGuess').focus();}
function closeGuess(){const sheet=$('#guessSheet');if(sheet.classList.contains('hidden'))return;sheet.classList.add('closing');clearTimeout(guessCloseTimer);guessCloseTimer=setTimeout(()=>{sheet.classList.add('hidden');sheet.classList.remove('closing');$('#spyGuessBtn').focus();},matchMedia('(prefers-reduced-motion: reduce)').matches?0:220);}
$('#spyGuessBtn').onclick=showGuess;$('#closeGuess').onclick=closeGuess;
$('#guessSheet').onclick=e=>{if(e.target===$('#guessSheet'))closeGuess();};
document.addEventListener('keydown',e=>{
 const sheet=$('#guessSheet');if(sheet.classList.contains('hidden'))return;
 if(e.key==='Escape'){e.preventDefault();closeGuess();return;}
 if(e.key==='Tab'){const controls=[...sheet.querySelectorAll('button,select')].filter(x=>!x.disabled&&x.getClientRects().length),first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
});
$('#confirmGuess').onclick=()=>{const location=$('#locationGuess').value;if(!confirm(`Точно выбрать «${location}»? Это финальная попытка.`))return;socket.emit('player:spyGuess',{location},r=>{if(!r?.ok)toast(r?.error||'Ошибка');closeGuess();})};
let voteLocked=false; function renderVote(){const me=privateState?.player;if(!me)return; const already=publicState.players.find(p=>p.id===me.id)?.hasVoted;voteLocked=already;$('#voteStatus').textContent=already?'голос принят ✓':'выбери игрока';const voteScroll=$('#voteList').scrollTop;$('#voteList').innerHTML=publicState.players.filter(p=>p.id!==me.id).map(p=>`<button class="vote-option" data-vote="${p.id}" ${already?'disabled':''}><span class="emoji spy-identity-avatar" aria-hidden="true"></span><b class="player-name" data-no-translate>${esc(p.name)}</b><span>→</span></button>`).join('');$('#voteList').scrollTop=voteScroll;document.querySelectorAll('[data-vote]').forEach(b=>{const person=publicState.players.find(p=>p.id===b.dataset.vote);identityAvatar(b.querySelector('.spy-identity-avatar'),person);b.onclick=()=>{if(voteLocked)return;const p=publicState.players.find(x=>x.id===b.dataset.vote);if(!confirm(`Голосовать против ${p.name}?`))return; socket.emit('player:vote',{targetId:p.id},r=>{if(r?.ok){voteLocked=true;toast('Голос принят');}else toast(r?.error||'Ошибка')})};});}
function renderResult(){const r=publicState.result||{};const spyNames=(publicState.players||[]).filter(p=>r.spyIds?.includes(p.id)).map(p=>p.name);let title='Раунд окончен',icon='🕵️',text='';if(r.reason==='spy_caught'){title='Шпион пойман!';icon='🎯';text='Мирные вычислили шпиона.'}if(r.reason==='wrong_accusation'){title='Шпион победил';icon='😈';text='Группа обвинила не того игрока.'}if(r.reason==='tie'){title='Шпион спасён';icon='🫥';text='Голоса разделились.'}if(r.reason==='spy_guessed'){title='Шпион победил';icon='🧠';text='Локация была угадана.'}if(r.reason==='duel_timeout'){title='Мирный победил';icon='⏱';text='Время дуэли вышло. Шпион не угадал локацию.'}if(r.reason==='spy_failed_guess'){title='Мирные победили';icon='💥';text='Шпион ошибся с локацией.'}$('#phoneResultIcon').textContent=icon;$('#phoneResultTitle').textContent=title;$('#phoneResultText').textContent=text;$('#phoneLocation').textContent=r.location||'—';$('#phoneSpies').innerHTML=spyNames.map(n=>`<span class="pill">🕵️ ${esc(n)}</span>`).join('')}
function render(){if(privateState?.player?.spectator&&publicState?.phase!=='lobby'){show('lobby');renderLobby();$('#lobbyName').textContent=privateState.player.name+' · наблюдатель';const hint=screens.lobby.querySelector('p');if(hint)hint.textContent='Раунд уже идёт. Ты подключён и получишь роль в следующем раунде. Секреты пока скрыты.';return;}if(!joined||!privateState){show(lastName?'lobby':'join');return}const ph=publicState?.phase||'lobby';show(ph);if(ph==='lobby')renderLobby();if(ph==='reveal')renderReveal();if(ph==='playing')renderPlay();if(ph==='voting')renderVote();if(ph==='result')renderResult();}
setInterval(()=>{if(publicState?.phase!=='playing'||!publicState.timerEndsAt)return;const rem=Math.max(0,publicState.timerEndsAt-Date.now());const m=Math.floor(rem/60000),s=Math.floor(rem%60000/1000);$('#timerMini').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`},250);
