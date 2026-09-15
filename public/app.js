(() => {
 'use strict';
 // Keep a running host's cached catalog visually current without interrupting a match.
 const menuPalette={"push":["#a96aff","#5ce9ef"],"shrink":["#31dfff","#9760ff"],"knives":["#ff5977","#41d7ef"],"bomb":["#ae54ff","#ff9f35"],"western":["#ffac43","#a75bff"],"tanks":["#b4ec35","#8c55ff"],"tankarena":["#b6fa32","#a45cff"],"chaos":["#9b58ff","#17cfff"],"kart":["#ff634b","#c0ef3a"],"monster":["#25d8e5","#aa65f6"],"spy":["#b56aff","#f5bf51"],"millionaire":["#ffc949","#33dfff"],"sinyakquiz":["#bcf735","#a663ff"],"warsaw":["#efbb60","#b0ec3b"],"crocodile":["#a8ec32","#a866ef"],"jenga":["#f4b24e","#a872f5"],"crane":["#ffcc36","#19cfe9"],"naval":["#28d7f0","#8c68ef"],"drawguess":["#9f63f5","#b5ed35"],"western_duel":["#b363f5","#ffc440"],"taprace":["#ffc04d","#be63f3"],"punchmeter":["#ff6589","#ae63f5"],"flappy":["#3adef5","#b259ff"],"hungry":["#b2ef39","#ffad3e"],"snakelines":["#b4ed3f","#a86bff"],"carryball":["#36dbe9","#a7e83d"]};
 const $=id=>document.getElementById(id),host=!!window.PARTY_HOST_KEY;
 let profile=null,state=null,ws,frameKey=null,replaced=false,editing=false,accepted=false,everAccepted=false,gameStatus='connecting',lastRanks='',freshIdentityPending=false,reconnectTimer,pongTimer,clockOffset=0,waitingKey='',catalogFilter='all',pendingAvatar=null,accessClosed=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let testProfiles=[],liveScoreInstance='',guestCategory='all',guestSearch='',removed=false,rosterSource=null,rosterForGames=[],rosterPostedSource=null;
 document.body.classList.toggle('guest-catalog',!host);
 const incidentBanner=el('div','room-incident');incidentBanner.setAttribute('role','status');incidentBanner.hidden=true;document.querySelector('.app-header').after(incidentBanner);
 function updateTestCompanion(){if(host)window.PartyBots?.update(state,testProfiles);}
 window.PARTY_PROFILE={};
 const tell=text=>{$('notice').textContent=text;$('notice').hidden=false;clearTimeout(tell.timer);tell.timer=setTimeout(()=>$('notice').hidden=true,6000);};
 const send=data=>{if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(data));else $('connection').textContent=accessClosed?'Ждём приглашения ведущего':'Подключаемся…';};
 async function persist(){localStorage.setItem('local-party-profile',JSON.stringify(profile));try{await fetch('/api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:profile.token})});}catch{}}
 function connect(){
  clearTimeout(reconnectTimer);
  ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/lobby`);
  const channel=ws;
  ws.onopen=()=>{if(ws!==channel)return;$('joinForm').querySelector('button[type="submit"]').disabled=false;$('connection').textContent='В одной сети';$('connection').classList.add('online');if(host)send({type:'host',key:window.PARTY_HOST_KEY});else if(profile)send({type:'join',...profile});};
  ws.onmessage=event=>{if(ws!==channel)return;const m=JSON.parse(event.data);
   if(m.type==='pong')clearTimeout(pongTimer);
   if(m.type==='test-profiles'&&host){testProfiles=m.profiles||[];updateTestCompanion();return;}
   if(m.type==='session-start'&&host&&m.instance===state?.active?.instance){$('gameFrame').contentWindow?.postMessage({type:'party-start',instance:m.instance},location.origin);return;}
   if(m.type==='game-ui'&&state?.active?.instance===m.instance){state.active.ui=m.ui;clockOffset=Date.now()-m.ui.serverNow;renderHUD();return;}
   if(m.type==='access-closed'){accessClosed=true;if(state){state={...state,active:null,incident:null};render();}$('notice').hidden=true;$('connection').textContent='Ждём приглашения ведущего';}
   if(m.type==='profile-required'){profile=null;window.PARTY_PROFILE={};localStorage.removeItem('local-party-profile');accepted=everAccepted=false;editing=true;render();}
   if(m.type==='state'){accessClosed=false;for(const g of m.catalog){const p=menuPalette[g.id];if(p){g.color=p[0];g.secondaryColor=p[1];}}state=m;if(m.active?.ui?.serverNow)clockOffset=Date.now()-m.active.ui.serverNow;render();}
   if(m.type==='host-ok'){accepted=everAccepted=true;render();}
   if(m.type==='joined'){freshIdentityPending=false;accepted=everAccepted=true;profile={id:m.id,token:m.token,name:m.name,hand:m.hand,avatar:m.avatar||null};pendingAvatar=profile.avatar;window.PARTY_PROFILE=profile;persist();editing=false;render();}
   if(m.type==='error'){tell(m.message);if(!host&&!everAccepted){editing=true;render();}}
   if(m.type==='kicked'){removed=true;freshIdentityPending=true;accepted=everAccepted=false;replaced=true;profile=null;pendingAvatar=null;window.PARTY_PROFILE={};localStorage.removeItem('local-party-profile');frameKey=null;$('gameFrame').src='about:blank';editing=true;render();incidentBanner.textContent=m.message+' Для повторного входа укажите имя и нажмите «Я в игре».';incidentBanner.hidden=false;return;}
   if(m.type==='replaced'){freshIdentityPending=true;accepted=everAccepted=false;replaced=true;profile=null;pendingAvatar=null;frameKey=null;$('gameFrame').src='about:blank';editing=true;render();tell('Ты открыл игру в другой вкладке. Здесь можно войти другим игроком.');}
  };
  ws.onclose=()=>{if(ws!==channel)return;accepted=false;$('joinForm').querySelector('button[type="submit"]').disabled=!replaced;$('connection').textContent=removed?'Вы удалены из комнаты':replaced?'Другая вкладка':accessClosed?'Ждём приглашения ведущего':'Подключаемся…';$('connection').classList.remove('online');if(!replaced)reconnectTimer=setTimeout(connect,800);};
  ws.onerror=()=>{};
 }
 function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
 function initial(name){return Array.from(String(name||'?').trim())[0]?.toUpperCase()||'?';}
 function avatarNode(p,className='avatar'){
  const node=el('span',className,initial(p?.name));node.dataset.initial=initial(p?.name);
  if(p?.avatar){const img=el('img','');img.src=p.avatar;img.alt='';node.replaceChildren(img);node.classList.add('has-photo');}
  return node;
 }
 function updateAvatarPreview(){const preview=$('avatarPreview'),letter=initial($('name').value||profile?.name);preview.dataset.initial=letter;preview.replaceChildren();if(pendingAvatar){const img=el('img','');img.src=pendingAvatar;img.alt='Предпросмотр фото';preview.append(img);preview.classList.add('has-photo');}else{preview.append(el('span','',letter));preview.classList.remove('has-photo');}$('avatarRemove').hidden=!pendingAvatar;}
 async function prepareAvatar(file){
  if(!file||!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>12*1024*1024)throw Error('Выбери JPEG, PNG или WebP до 12 МБ.');
  let source,release=()=>{};if('createImageBitmap' in window)source=await createImageBitmap(file,{imageOrientation:'from-image'});else{const url=URL.createObjectURL(file);release=()=>URL.revokeObjectURL(url);source=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});}
  try{const side=Math.min(source.width,source.height),sx=(source.width-side)/2,sy=(source.height-side)/2,canvas=document.createElement('canvas');canvas.width=canvas.height=192;const c=canvas.getContext('2d',{alpha:false});c.fillStyle='#17131f';c.fillRect(0,0,192,192);c.drawImage(source,sx,sy,side,side,0,0,192,192);for(const quality of [.82,.72,.62,.52]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<128000)return data;}throw Error('Фото не удалось достаточно уменьшить.');}finally{source.close?.();release();}
 }
 function render(){
  updateTestCompanion();
  const ready=(accepted||everAccepted)&&(host||!!profile&&!editing);
  $('onboarding').hidden=ready||host;$('home').hidden=!ready;
  if(!state)return;
  incidentBanner.hidden=!state.incident;incidentBanner.textContent=state.incident?.message||'';
  const game=state.catalog.find(g=>g.id===state.active?.id),inGame=ready&&!!game;
  $('lobby').hidden=inGame;$('play').hidden=!inGame;
  if(inGame){
   $('playingTitle').textContent=game.title;$('playingControls').textContent=game.controls;$('back').hidden=!host;
   const key=state.active.instance+':'+(profile?.id||'host');
   if(frameKey!==key){window.PARTY_INSTANCE=state.active.instance;frameKey=key;gameStatus='connecting';$('gameFrame').dataset.loading='true';$('gameFrame').src=`/games/${game.id}${host?game.host:game.player}`;}
   const count=state.players.filter(p=>p.gameReady).length;
   if(!host&&state.players.find(p=>p.id===profile?.id)?.gameReady)gameStatus='ready';
   $('gameConnection').textContent=host?`${count}/${state.players.length} в игре`:gameStatus==='ready'?'Ты в игре':gameStatus==='error'?'Повторяем вход…':'Подключаем контроллер…';
   $('gameConnection').classList.toggle('ready',host?count===state.players.length:gameStatus==='ready');
  }else if(frameKey){$('gameFrame').src='about:blank';frameKey=null;}
  $('invite').hidden=!host;$('me').hidden=host||!profile;
  if(!host){$('headline').textContent='Компания в сборе.';$('subtitle').textContent='Голосуйте за игру. Когда выберут все, запустится лидер голосования.';$('myName').textContent=profile?`Ты — ${profile.name}`:'';}
  const urls=state.urls.length?state.urls:[location.origin+'/'];
  if(host&&JSON.stringify(urls)!==$('address').dataset.urls){$('address').dataset.urls=JSON.stringify(urls);$('address').replaceChildren(...urls.map(url=>{const o=el('option','',url);o.value=url;return o;}));updateQR();}
  $('count').textContent=`${state.players.length} / 16`;$('empty').hidden=!!state.players.length;
  $('players').replaceChildren(...state.players.map((p,i)=>{const row=el('div','player'),avatar=avatarNode(p);avatar.style.setProperty('--card',state.catalog[i%state.catalog.length].color);row.append(avatar,el('b','',p.name),el('small',p.gameReady?'is-ready':'',p.gameReady?'в игре':p.id===profile?.id?'это ты':'в сети'));return row;}));
  if(!$('games').children.length)buildCatalog();
  updateVotes();
  const ballotNote=document.querySelector('.guest-catalog-tools p');if(ballotNote){const b=state.ballot;ballotNote.textContent=b?.reason==='tie'?'Ничья. Подключите ТВ — сервер случайно выберет одну из игр-лидеров.':b?.reason==='player-count'?'Для выбранной игры не подходит число игроков. Выберите другую игру.':b?.reason==='ready'?'Все проголосовали. Подключите ТВ — игра запустится автоматически.':`Проголосовали ${b?.voted||0} из ${b?.total||0}. Когда выберут все, лидер запустится сам.`;}
  for(const b of document.querySelectorAll('.start-game'))b.disabled=state.busy;
  if(state.busy)$('connection').textContent='Запускаем игру…';else if(ws?.readyState===WebSocket.OPEN)$('connection').textContent='В одной сети';
  renderRanks();renderMiniRanks();renderRoom();renderHUD();
 }
 function buildCatalog(){
  if(!host){buildGuestCatalog();return;}
  const freshIds=['curling','bowling','swarm_gate','peek_shoot','taprace','punchmeter','flappy','hungry','snakelines','carryball'];
  $('totalGames').textContent=`${state.catalog.length} игр`;$('arcadeCount').textContent=`${state.catalog.filter(g=>g.section!=='table').length} игр`;
  const featureCandidates=state.catalog.filter(g=>g.section!=='table'&&!freshIds.includes(g.id));
  const popular=Object.entries(state.gamePopularity||{}).filter(([id])=>featureCandidates.some(g=>g.id===id)).sort((a,b)=>b[1]-a[1]);
  const featured=popular[0]?.[1]>0?popular[0][0]:featureCandidates.find(g=>g.id==='tankarena')?.id||featureCandidates[0]?.id;
  [...state.catalog].sort((a,b)=>Number(b.id===featured)-Number(a.id===featured)).forEach((g)=>{const i=state.catalog.findIndex(x=>x.id===g.id);
   const card=el('article','game');card.style.setProperty('--enter-delay',Math.min(i*35,120)+'ms');card.dataset.id=g.id;card.dataset.category=['chaos','jenga','crane','naval','millionaire','warsaw','sinyakquiz'].includes(g.id)?'logic':['monster','spy','crocodile','drawguess'].includes(g.id)?'party':'action';card.style.setProperty('--card',g.color);card.style.setProperty('--card-secondary',g.secondaryColor||g.color);
   const art=el('div','art'),artwork=el('img','symbol');artwork.src=g.artwork?'/assets/games/'+g.artwork:'/assets/games/'+(g.id==='tankarena'?'tankarena-hd':g.id)+'.webp?v=0.6-premium';artwork.alt='';artwork.loading=i<5?'eager':'lazy';artwork.draggable=false;art.append(el('span','tag',g.tag),artwork,el('span','number',String(i+1).padStart(2,'0')));if(g.id===featured){card.classList.add('featured');card.append(el('span','featured-label',popular[0]?.[1]>0?'↗ Чаще играем':'✳ Выбор вечера'));}
   const info=el('div','game-info');info.append(el('h3','',g.title),el('p','',g.description));
   const bottom=el('div','game-bottom'),rules=el('button','rules-link','Как играть'),start=el('button','start-game',host?'Играть ↗':'Управление ↗');start.type=rules.type='button';
   start.replaceChildren(el('span','start-label',start.textContent));
   rules.onclick=e=>{e.stopPropagation();showRules(g);};start.onclick=e=>{e.stopPropagation();host?send({type:'launch',id:g.id}):showRules(g);};
   bottom.append(rules,start);info.append(bottom);card.append(art,info);card.onclick=()=>host&&!state.busy?send({type:'launch',id:g.id}):showRules(g);
   if(freshIds.includes(g.id))card.dataset.fresh='true';
   $(g.section==='table'?'tableGames':'games').append(card);
 });
  const section=el('section','fresh-section');section.id='freshSection';section.setAttribute('aria-labelledby','freshTitle');
  const heading=el('div','fresh-heading'),copy=el('div','fresh-copy'),title=el('h2','','Свежий завоз');title.id='freshTitle';copy.append(el('span','fresh-badge','ФРЕШ'),title,el('p','','Новые игры. Тот же повод собраться.'));
  const arrows=el('div','fresh-arrows'),previous=el('button','fresh-arrow'),next=el('button','fresh-arrow');previous.type=next.type='button';previous.setAttribute('aria-label','Предыдущие новинки');next.setAttribute('aria-label','Следующие новинки');previous.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>';next.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg>';arrows.append(previous,next);heading.append(copy,arrows);
  const track=el('div','fresh-track');track.id='freshTrack';track.setAttribute('aria-label','Свежие игры');track.tabIndex=0;for(const id of freshIds){const card=document.querySelector('.game[data-id="'+id+'"]');if(card){card.classList.remove('featured');card.querySelector('.featured-label')?.remove();track.append(card);}}
  section.append(heading,track);const ordinary=[...$('games').children];if(ordinary.length>6){const rest=el('div','games catalog-continuation');rest.id='moreGames';ordinary.slice(6).forEach(card=>rest.append(card));$('games').after(section,rest);}else $('games').after(section);
  const updateArrows=()=>{previous.disabled=track.scrollLeft<=2;next.disabled=track.scrollLeft>=track.scrollWidth-track.clientWidth-2;track.style.setProperty("--fresh-fade-left",previous.disabled?"0px":"28px");track.style.setProperty("--fresh-fade-right",next.disabled?"0px":"28px");};const advance=direction=>track.scrollBy({left:direction*(track.clientWidth*.85),behavior:reduced?'auto':'smooth'});previous.onclick=()=>advance(-1);next.onclick=()=>advance(1);track.addEventListener('scroll',updateArrows,{passive:true});new ResizeObserver(updateArrows).observe(track);requestAnimationFrame(updateArrows);
 }
 function voteButton(game){
  const b=el('button','catalog-vote');b.type='button';b.dataset.vote=game.id;
  b.onclick=()=>send({type:'vote-game',id:(state.votes||[]).some(v=>v.playerId===profile?.id&&v.gameId===game.id)?null:game.id});return b;
 }
 function updateVotes(){for(const b of document.querySelectorAll('[data-vote]')){const votes=(state.votes||[]).filter(v=>v.gameId===b.dataset.vote),mine=votes.some(v=>v.playerId===profile?.id);b.textContent=(mine?'✓ Ваш голос':'Голосовать')+(votes.length?' · '+votes.length:'');b.setAttribute('aria-pressed',String(mine));b.disabled=!accepted;}}
 function guestCard(game){
  const card=el('article','guest-game');card.dataset.id=game.id;card.dataset.section=game.section;
  const details=el('button','guest-game-details');details.type='button';details.setAttribute('aria-label','Правила: '+game.title);
  const img=el('img','');img.src='/assets/games/'+(game.id==='tankarena'?'tankarena-hd':game.id)+'.webp';img.alt='';img.loading='lazy';
  details.append(img,el('strong','',game.title),el('small','',game.min+'–'+game.max+' игроков'));details.onclick=()=>showRules(game);
  card.append(details,voteButton(game));return card;
 }
 function buildGuestCatalog(){
  $('totalGames').textContent=state.catalog.length+' игр';$('arcadeCount').textContent=state.catalog.length+' игр';$('tableSection').hidden=true;
  $('games').className='guest-games';$('games').replaceChildren(...state.catalog.map(guestCard));
  const tools=el('div','guest-catalog-tools'),search=el('input','');search.type='search';search.placeholder='Найти игру';search.setAttribute('aria-label','Найти игру');search.oninput=()=>{guestSearch=search.value;filterGuests();};
  const filters=el('div','guest-filters');for(const [id,title]of [['all','Все'],['arcade','Аркады'],['table','За столом']]){const b=el('button','',title);b.type='button';b.dataset.category=id;b.setAttribute('aria-pressed',String(id==='all'));b.onclick=()=>{guestCategory=id;filterGuests();};filters.append(b);}
  tools.append(search,filters,el('p','','Один голос на человека. Когда проголосуют все, игра запустится сама. При равенстве — случайный выбор среди лидеров.'));$('games').before(tools);
 }
 function filterGuests(){for(const b of document.querySelectorAll('.guest-filters button'))b.setAttribute('aria-pressed',String(b.dataset.category===guestCategory));let count=0;for(const card of $('games').children){const g=state.catalog.find(g=>g.id===card.dataset.id);card.hidden=!(guestCategory==='all'||(guestCategory==='table'?g.section==='table':g.section!=='table'))||!g.title.toLocaleLowerCase().includes(guestSearch.toLocaleLowerCase());if(!card.hidden)count++;}$('arcadeCount').textContent=count+' игр';}
 function filterCatalog(value){if(!host)return;catalogFilter=value;for(const b of document.querySelectorAll('[data-filter]')){b.classList.toggle('active',b.dataset.filter===value);b.setAttribute('aria-pressed',String(b.dataset.filter===value));}for(const card of document.querySelectorAll('.game')){card.hidden=!['all','fresh'].includes(value)&&card.dataset.category!==value;}$('tableSection').hidden=![...$('tableGames').children].some(c=>!c.hidden);if($('freshSection'))$('freshSection').hidden=!['all','fresh','action'].includes(value);$('arcadeCount').textContent=`${[...document.querySelectorAll('#games>.game,#moreGames>.game,#freshTrack>.game')].filter(c=>!c.hidden).length} игр`;document.body.dataset.filter=value;if(value==='fresh')requestAnimationFrame(()=>$('freshSection')?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'}));}
 function updateFilterIndicator(){const nav=$('catalogFilters'),active=nav.querySelector('.active');if(!active||nav.hidden)return;nav.style.setProperty('--tab-x',active.offsetLeft+'px');nav.style.setProperty('--tab-y',active.offsetTop+'px');nav.style.setProperty('--tab-w',active.offsetWidth+'px');nav.style.setProperty('--tab-h',active.offsetHeight+'px');nav.classList.add('indicator-ready');}
 new MutationObserver(updateFilterIndicator).observe($('catalogFilters'),{attributes:true,attributeFilter:['hidden'],subtree:false});
 new ResizeObserver(updateFilterIndicator).observe($('catalogFilters'));
 $('catalogFilters').addEventListener('click',()=>requestAnimationFrame(updateFilterIndicator));
 document.querySelector('.console-moods')?.addEventListener('click',()=>requestAnimationFrame(updateFilterIndicator));
 function alignCatalogRails(){const section=$('catalogSection');if(!section||$('home').hidden)return;const desired=section.getBoundingClientRect().top+scrollY;document.documentElement.style.setProperty('--catalog-rail-top',Math.round(Math.max(110,desired))+'px');}
 new ResizeObserver(alignCatalogRails).observe(document.querySelector('.intro'));
 new ResizeObserver(alignCatalogRails).observe(document.querySelector('.company'));
 window.addEventListener('resize',alignCatalogRails,{passive:true});
 document.fonts.ready.then(()=>{updateFilterIndicator();alignCatalogRails();});
 function showRules(g){
  if(!g)return;$('rulesTitle').textContent=g.title;$('rulesBody').replaceChildren();
  const rows=[['01 · ЦЕЛЬ',g.goal||g.description],['02 · УПРАВЛЕНИЕ',g.controls],['03 · КАК ПОБЕДИТЬ',g.win||'Следи за счётом на общем экране. Итоги появятся в конце партии.'],['ВХОД ВО ВРЕМЯ ИГРЫ',g.lateJoin||'Входи в любой момент. Если ход уже начался, игра подскажет, когда ты вступаешь.']];
  for(const [title,body] of rows){const row=el('div','rule-row');row.append(el('b','',title),el('p','',body));$('rulesBody').append(row);}
  $('rulesDialog').showModal();$('rulesTitle').tabIndex=-1;$('rulesTitle').focus({preventScroll:true});$('rulesDialog').scrollTop=0;
 }
 const metricLabels={kills:'Уничтожений',deaths:'Возрождений',shots:'Выстрелов',hits:'Попаданий',correct:'Верных ответов',answers:'Ответов',streak:'Серия',drawings:'Рисунков',strokes:'Штрихов',laps:'Кругов',falseStarts:'Фальстартов',captures:'Флагов',levels:'Уровней',actions:'Действий',wins:'Побед',votesCorrect:'Верных голосов',questions:'Вопросов',bestLap:'Лучший круг',reactionMs:'Реакция, мс',bestReactionMs:'Лучшая реакция, мс',bestStreak:'Лучшая серия',roundWins:'Побед в раундах',wrong:'Ошибок',level:'Уровень',spyRounds:'Раундов шпионом',votes:'Голосований',finishTime:'Лучший финиш, с',distance:'Дистанция',boosts:'Ускорений',collisions:'Столкновений',damage:'Урона',guessed:'Угадано',skips:'Пропусков',performed:'Выходов на сцену',placed:'Блоков установлено',perfects:'Точных установок',misses:'Промахов',towerHeight:'Рекорд высоты',sunk:'Потоплено',survived:'Сохранено палуб',extracted:'Блоков вытянуто',blocks:'Блоков',skipped:'Пропущено ходов',collapsed:'Обрушений',timeouts:'Пропусков по времени'};
 function renderRanks(){
  const ranking=state.leaderboard||[];const signature=JSON.stringify([ranking,state.lastResult?.key]);if(signature===lastRanks)return;lastRanks=signature;
  $('rankEmpty').hidden=!!ranking.length;$('partyMatches').textContent=String(state.totalMatches||0);
  const before=new Map([...$('leaderboard').children].map(n=>[n.dataset.id,n.getBoundingClientRect().top]));
  const existing=new Map([...$('leaderboard').children].map(n=>[n.dataset.id,n]));
  ranking.forEach((p,i)=>{
   const row=existing.get(p.id)||el('button','rank-row');row.type='button';row.dataset.id=p.id;row.classList.toggle('champion',i===0);row.replaceChildren(el('span','rank-number',i===0?'♛':String(i+1)),el('b','rank-name',p.name));
   const stats=el('span','rank-stats');stats.append(el('span','',`${p.wins} побед · ${p.played} партий`),el('strong','',`${p.points}`),el('small','','очков'));row.append(avatarNode(p,'rank-avatar'),stats);row.onclick=()=>showPlayerStats(p);$('leaderboard').append(row);existing.delete(p.id);
  });for(const row of existing.values())row.remove();
  if(!reduced)for(const row of $('leaderboard').children){const prev=before.get(row.dataset.id),delta=prev===undefined?15:prev-row.getBoundingClientRect().top;row.animate([{transform:`translateY(${delta}px)`,opacity:prev===undefined?0:1},{transform:'translateY(0)',opacity:1}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'});}
  const result=state.lastResult;$('lastResult').hidden=!result;if(result){$('resultTitle').textContent=`Последняя партия · ${state.catalog.find(g=>g.id===result.game)?.title||result.game}`;$('resultRows').replaceChildren(...result.players.sort((a,b)=>Number(b.won)-Number(a.won)||b.score-a.score).map(p=>{const r=el('div','result-row');r.append(el('b','',`${p.won?'★ ':''}${p.name}`),el('span','',p.score.toLocaleString('ru-RU')));return r;}));}
 }
 function showPlayerStats(p){
  $('statsName').textContent=p.name;$('statsBody').className='profile-content';const back=el('button','stats-back','← Топ компании');back.onclick=showTop;const hero=el('div','profile-identity');hero.append(avatarNode(p,'profile-avatar'),el('b','',p.name));const summary=el('div','profile-summary');for(const [value,label] of [[p.played||0,'Партий'],[p.wins||0,'Побед'],[(p.played?Math.round(p.wins/p.played*100):0)+'%','Доля побед']]){const tile=el('div','');tile.append(el('strong','',String(value)),el('small','',label));summary.append(tile);}$('statsBody').replaceChildren(back,hero,summary);
  for(const [id,s] of Object.entries(p.games||{})){const game=state.catalog.find(g=>g.id===id);if(!game)continue;const box=el('section','stat-game');box.append(el('h3','',game.title),el('p','stat-game-summary',`${s.played||0} партий · ${s.wins||0} побед · рекорд ${Number(s.bestScore||0).toLocaleString('ru-RU')}`));
   const metrics=el('dl','stat-metrics');for(const [k,v] of Object.entries(s.metrics||{})){const label=metricLabels[k]||({bestPunch:'Лучший удар',punches:'Ударов',flightSeconds:'Полёт, с',finalMass:'Вес в финале',teamGoals:'Голов команды',rounds:'Раундов'}[k]);if(!label||!Number.isFinite(v)||(k==='bestPunch'&&id!=='punchmeter')||(k==='rounds'&&id!=='snakelines'))continue;const item=el('div','');item.append(el('dt','',label),el('dd','',Number((Math.round(v*100)/100)).toLocaleString('ru-RU')));metrics.append(item);}if(metrics.children.length)box.append(metrics);$('statsBody').append(box);}
  if(!Object.keys(p.games||{}).length)$('statsBody').append(el('p','stats-empty','После первой партии здесь появятся результаты по играм.'));
  $('statsDialog').showModal();$('statsName').tabIndex=-1;$('statsName').focus({preventScroll:true});$('statsDialog').scrollTop=0;
 }
 let lastHUD='',lastUIMessage='';
 function renderHUDClock(ui,active){
  if(!active)return;
  const timed=Number.isFinite(ui.endsAt)&&['playing','countdown','reveal'].includes(ui.phase),seconds=timed?Math.max(0,Math.ceil((ui.endsAt-(Date.now()-clockOffset))/1000)):null;
  const value=seconds===null?({paused:'Пауза',results:'Итог',playing:'Игра',reveal:'Итог',waiting:'Ждём'}[ui.phase]||'Ждём'):seconds>=60?Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'):String(seconds).padStart(2,'0');
  if($('hudValue').textContent!==value)$('hudValue').textContent=value;
  $('hudTimer').classList.toggle('word-time',seconds===null);
  $('hudTimer').classList.toggle('urgent',seconds!==null&&seconds<=5&&ui.phase==='playing');
 }
 function renderHUD(force=false){
  const game=state?.catalog.find(g=>g.id===state.active?.id),active=!!game&&everAccepted,ui=state?.active?.session?.paused?{...state.active.ui,phase:'paused',endsAt:null,label:'Пауза'}:state?.active?.ui||{phase:'waiting',endsAt:null,label:'Ожидание'};
  document.body.dataset.gameId=active?game.id:'';
  document.body.classList.toggle('game-owns-hud',host&&active&&game.engine==='sports_siege');
  const nextRosterSource=state?.players||[];
  if(rosterSource!==nextRosterSource){rosterSource=nextRosterSource;rosterForGames=nextRosterSource.map(({id,name,hand,avatar,testBot,gameReady})=>({id,name,hand,avatar:avatar||null,testBot:!!testBot,gameReady:!!gameReady}));}
  window.PARTY_ROSTER=rosterForGames;
  window.PARTY_UI=ui;window.PARTY_GAME=game;window.PARTY_SESSION=state?.active?.session;
  if(active){
   const message={type:'party-ui',ui,session:state.active.session,game:{id:game.id,title:game.title},host},key=JSON.stringify(message);
   if(force===true||key!==lastUIMessage||rosterPostedSource!==rosterSource){lastUIMessage=key;if(force===true||rosterPostedSource!==rosterSource){message.roster=rosterForGames;rosterPostedSource=rosterSource;}$('gameFrame').contentWindow?.postMessage(message,location.origin);}
   if(host&&state.active.session?.startRequested&&ui.phase==='waiting')$('gameFrame').contentWindow?.postMessage({type:'party-start',instance:state.active.instance},location.origin);
  }else lastUIMessage='';
  renderHUDClock(ui,active);
  // The 200 ms clock tick must not rebuild avatars, SVG buttons, or measure
  // hidden title text. Only semantic room changes update the surrounding UI.
  const signature=JSON.stringify({game,active,accepted:everAccepted,profile,gameStatus,players:state?.players,testMode:state?.testMode,botCount:state?.botCount,run:state?.active&&{...state.active,ui:{...ui,endsAt:null,serverNow:0}}});
  if(force!==true&&signature===lastHUD)return;
  lastHUD=signature;
  const titleGame=state?.catalog.find(g=>g.id===state.active?.id);window.PARTY_GAME_INFO=titleGame;document.body.style.setProperty('--game-title-accent',titleGame?.color||'#c8f58b');document.body.style.setProperty('--active-game-art',titleGame?`url("/assets/games/${titleGame.id==='tankarena'?'tankarena-hd':titleGame.id}.webp?v=0.6-premium")`:'none');
  if(titleGame&&innerWidth<=850&&ui.phase==='waiting'){const title=$('waitingTitle'),measure=document.createElement('canvas').getContext('2d');measure.font='italic 800 100px '+getComputedStyle(title).fontFamily;const available=Math.max(240,innerWidth-36),width=measure.measureText(titleGame.title.toUpperCase()).width;title.style.setProperty('--mobile-title-size',Math.max(28,Math.min(92,available/width*96))+'px');const decor={push:['🥊','💥'],shrink:['🌀','⚡'],knives:['🎯','🗡️'],bomb:['💣','🔥'],western:['🤠','⭐'],tankarena:['🛡️','💥'],tanks:['🛡️','💥'],chaos:['🖱️','🌀'],kart:['🏎️','🏁'],monster:['👾','🖍️'],spy:['🕵️','🔍'],millionaire:['💎','💰'],sinyakquiz:['🎤','❓'],warsaw:['🏙️','🚋'],crocodile:['🐊','🎭'],jenga:['🪵','🧱'],crane:['🏗️','🧱'],naval:['🚢','⚓'],drawguess:['🎨','🖌️'],western_duel:['🤠','⭐'],taprace:['👟','🏁'],punchmeter:['🥊','💥'],flappy:['🐤','🪽'],hungry:['🍔','🍩'],snakelines:['🐍','⚡'],carryball:['🏉','🥅']}[titleGame.id]||['✨','⚡'];title.style.setProperty('--mobile-deco-left',JSON.stringify(decor[0]));title.style.setProperty('--mobile-deco-right',JSON.stringify(decor[1]));}
  document.body.classList.toggle('lobby-connected',!!everAccepted);
  let strip=$('mobileRoomStrip');if(!strip){strip=el('button','mobile-room-strip');strip.id='mobileRoomStrip';strip.type='button';strip.onclick=()=>$('companyRoomOpen').click();showStats.before(strip);}
  const online=state?.players||[];
  strip.replaceChildren(el('span','mobile-room-label',String(online.length)),...online.map((p,i)=>{const avatar=avatarNode(p,'mobile-room-avatar');avatar.title=p.name;avatar.style.setProperty('--avatar-color',['#c8f58b','#a49aff','#75ddd5','#f5b47e'][i%4]);return avatar;}));
  strip.setAttribute('aria-label',`В комнате ${online.length}. Показать всех игроков`);
  document.body.classList.toggle('in-game',active);document.body.classList.toggle('is-host',host);document.body.classList.toggle('is-player',!host);document.body.dataset.phase=ui.phase;if(ui.phase!=='paused')document.body.classList.toggle('session-active',active&&['countdown','playing','reveal','results'].includes(ui.phase));
  $('hudTimer').hidden=!active;$('sessionIdentity').hidden=!active;$('gameRules').hidden=!active;$('joinOpen').hidden=!host;$('qrDock').hidden=!host||active;$('catalogFilters').hidden=active||!everAccepted;queueQrDockLayout();
  $('testModeBox').hidden=!host||active;$('testMode').checked=!!state?.testMode;$('botCount').textContent=state?.botCount||0;$('botMinus').disabled=active||!(state?.botCount);$('botPlus').disabled=active||(state?.botCount||0)>=15||(state?.players.length||0)>=16;
  $('back').hidden=!active||!host;$('roomRules').hidden=!active;$('retryGame').hidden=!active;$('closeRoom').textContent=active?'Вернуться в игру':'Вернуться';$('companyRoomOpen').hidden=!(state?.players?.length);
  $('lobbyExit').hidden=!active;$('sessionControls').hidden=!active;$('gameObjective').hidden=!active||host;$('pauseOverlay').hidden=!active||!state?.active?.session?.paused;
  $('liveTop').hidden=true;
  if(!active){$('waitingRules').hidden=true;return;}
  $('headerName').textContent=host?({waiting:'Собираемся',countdown:'На старт',playing:'Игра идёт',reveal:'Результат хода',results:'Матч окончен',paused:'Пауза'}[ui.phase]||'Общий экран'):profile?.name||'Игрок';$('headerGame').textContent=host?'ОБЩИЙ ЭКРАН':game.title;$('roomToggle').hidden=false;
  $('hudLabel').textContent=ui.label||'Время';$('hudProgress').textContent=ui.progress||ui.currentPlayer||'';
  const session=state.active.session||{},waiting=!host&&ui.phase==='waiting';$('waitingRules').hidden=!waiting;
  document.body.classList.toggle('game-waiting',waiting);
  const systemPause=session.pauseReason==='host-background';$('pauseTitle').textContent=systemPause?'Ждём iPhone-сервер':'Пауза';$('pauseHint').textContent=systemPause?'Откройте LocalParty на iPhone-сервере. Игра продолжится автоматически.':'Продолжить может любой игрок или ведущий с телефона.';$('resumeButton').hidden=systemPause;$('pauseButton').disabled=systemPause;
  const mine=profile?.id,readyIds=session.readyIds||[],eligible=session.eligibleIds||state.active.ready||[],spectating=(session.spectatorIds||[]).includes(mine);
  $('readyButton').textContent=readyIds.includes(mine)?'✓ Готов · отменить':'Я готов';$('readyButton').setAttribute('aria-pressed',String(readyIds.includes(mine)));$('readyButton').disabled=spectating||gameStatus!=='ready';
  $('spectateButton').textContent=spectating?'Хочу играть':'Пока смотрю';$('spectateButton').setAttribute('aria-pressed',String(spectating));
  const expected=(state.players||[]).filter(p=>!p.testBot).length;
  $('readyProgress').textContent=spectating?'Ты наблюдаешь. Можно присоединиться перед стартом.':`Готовы ${readyIds.filter(id=>eligible.includes(id)).length} из ${expected}. ${expected>eligible.length?'Ждём подключения остальных.':'Когда все готовы — начнём автоматически.'}`;
  $('pauseButton').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">'+(session.paused?'<path d="m8 5 11 7-11 7Z"/>':'<path d="M8 5v14M16 5v14"/>')+'</svg><span>'+(session.paused?'Продолжить':'Пауза')+'</span>';$('exitVoteButton').textContent=host?'← Все в лобби':(session.exitVotes||[]).includes(mine)?`✓ Выход ${session.exitVotes.length}/${eligible.length}`:'← В лобби';
  const key=state.active.instance+':'+game.id;if(waitingKey!==key){waitingKey=key;$('waitingTitle').textContent=game.title;$('gameObjective').replaceChildren(el('strong','objective-title',game.title),el('p','objective-copy',game.goal||game.description));const goal=el('p','waiting-goal',game.goal||game.description),details=el('details','waiting-details'),summary=el('summary','','Правила и управление');details.append(summary,...[['Управление',game.controls],['Победа',game.win]].map(([label,text])=>{const d=el('div','');d.append(el('b','',label),el('p','',text||''));return d;}));$('waitingContent').replaceChildren(goal,details);}
 }
 function renderMiniRanks(){
  const all=state?.leaderboard||[],matches=state?.totalMatches||0,leader=all[0],last=state?.lastResult;
  $('eveningStats').replaceChildren(...[[String(matches),'Партий вместе'],[String(new Set(all.flatMap(p=>Object.keys(p.games||{}))).size),'Игр попробовали'],[leader?`${Math.round(leader.wins/Math.max(1,leader.played)*100)}%`:'—','Победы лидера'],[last?state.catalog.find(g=>g.id===last.game)?.title||'—':'—','Последняя игра']].map(([value,label])=>{const d=el('div','');d.append(el('b','',value),el('small','',label));return d;}));
  const ranks=state?.leaderboard||[],mine=ranks.findIndex(p=>p.id===profile?.id);$('myRank').textContent=host?'':mine<0?'':`#${mine+1}`;
  $('miniLeaderboard').replaceChildren(...(ranks.length?ranks.slice(0,3).map((p,i)=>{const r=el('div','mini-rank');r.append(el('span','',i===0?'♛':String(i+1)),avatarNode(p,'mini-avatar'),el('b','',p.name),el('strong','',p.points));return r;}):[el('p','mini-empty','Первый раунд решит, кто окажется наверху.')]));
  $('liveTop').replaceChildren(...(ranks.length?ranks.slice(0,3).map((p,i)=>{const d=el('span','');d.append(el('b','',`${i+1}. `),document.createTextNode(`${p.name} · ${p.points}`));return d;}):[el('span','','↗ Топ компании · первая партия впереди')]));
 }
 function renderRoom(){const players=state?.players||[]; $('roomToggle').setAttribute('aria-label',`В комнате ${players.length}. Показать всех игроков`);$('roomToggle').hidden=!state?.active;$('roomCount').textContent=players.length;$('roomAvatars').replaceChildren(...players.slice(0,3).map((p,i)=>{const n=avatarNode(p,'room-avatar-chip');n.style.setProperty('--avatar-color',['#b4ff39','#8a86ff','#62ded5'][i]);return n;}));$('roomPlayers').replaceChildren(...(players.length?players.map(p=>{const n=el('div','room-player');n.append(avatarNode(p),el('b','',p.name),el('small','',p.gameReady?'В игре':'Подключён'));return n;}):[el('p','','Компания ещё собирается.')]));}
 function showTop(){const ranks=state?.leaderboard||[];$('statsName').textContent='Топ компании';$('statsBody').className='ranking-content';$('statsBody').replaceChildren(el('p','stats-intro','Каждая партия меняет расстановку. Нажми на игрока, чтобы увидеть его результаты.'),...(ranks.length?ranks.map((p,i)=>{const b=el('button','stats-rank');b.type='button';b.dataset.place=i+1;const avatar=avatarNode(p,'stats-avatar'),identity=el('span','stats-identity'),score=el('span','stats-score');identity.append(el('b','',p.name),el('small','',`${p.wins||0} побед · ${p.played||0} партий`));score.append(el('strong','',Number(p.points||0).toLocaleString('ru-RU')),el('small','','очков'));b.append(el('span','stats-place',i===0?'♛':String(i+1)),avatar,identity,score);b.onclick=()=>showPlayerStats(p);return b;}):[el('p','stats-empty','Сыграйте первую партию — здесь появятся победы и рекорды.')]));$('statsDialog').showModal();$('statsBody').scrollTop=0;}
 function showCatalog(){if(!state)return;if(!state.active){$('catalogSection').scrollIntoView({behavior:reduced?'auto':'smooth'});return;}if(!host){$('catalogQuick').className='guest-games';$('catalogQuick').replaceChildren(...state.catalog.map(guestCard));updateVotes();$('catalogDialog').showModal();return;}$('catalogQuick').replaceChildren(...state.catalog.map(g=>{const b=el('button',''),img=el('img','');img.src=g.artwork?'/assets/games/'+g.artwork:'/assets/games/'+(g.id==='tankarena'?'tankarena-hd':g.id)+'.webp?v=0.6-premium';img.alt='';b.append(img,el('span','',g.title));b.onclick=()=>{$('catalogDialog').close();host?send({type:'launch',id:g.id}):showRules(g);};return b;}));$('catalogDialog').showModal();}
 function updateQR(){$('qr').src='/api/qr?url='+encodeURIComponent($('address').value);$('dockQr').src=$('qr').src;}
 const qrDock=$('qrDock'),joinOpen=$('joinOpen'),appHeader=document.querySelector('.app-header');
 const qrAvoid=[document.querySelector('#home .company'),document.querySelector('#home>.evening-console')].filter(Boolean);
 const overlaps=(a,b,gap=10)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
 let qrLayoutFrame=0;
 function queueQrDockLayout(){if(qrLayoutFrame)return;qrLayoutFrame=requestAnimationFrame(()=>{qrLayoutFrame=0;layoutQrDock();});}
 function layoutQrDock(){
  if(!qrDock||qrDock.hidden||!host||document.body.classList.contains('in-game')){qrDock?.classList.remove('qr-dock--header');if(qrDock)qrDock.dataset.mode='corner';return;}
  const previous=qrDock.classList.contains('qr-dock--header');
  qrDock.classList.remove('qr-dock--header');qrDock.classList.add('qr-dock--measuring');
  const fullRect=qrDock.getBoundingClientRect();
  const conflict=window.innerWidth<=850||qrAvoid.some(node=>{
   if(node.hidden)return false;
   const style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden')return false;
   const rect=node.getBoundingClientRect();return rect.width>0&&rect.height>0&&overlaps(fullRect,rect);
  });
  qrDock.classList.remove('qr-dock--measuring');qrDock.classList.toggle('qr-dock--header',conflict);qrDock.dataset.mode=conflict?'header':'corner';
  if(conflict){
   const headerRect=appHeader.getBoundingClientRect();
   let buttonLeft=0,node=joinOpen;while(node){buttonLeft+=node.offsetLeft;node=node.offsetParent;}
   const buttonCenter=buttonLeft+joinOpen.offsetWidth/2,preferredSize=Math.max(64,Math.min(92,joinOpen.offsetWidth-12||76));
   const centeredLimit=Math.max(48,2*(window.innerWidth-buttonCenter)-12),size=Math.min(preferredSize,centeredLimit);
   qrDock.style.setProperty('--qr-compact-size',`${Math.round(size)}px`);
   const dockWidth=qrDock.offsetWidth||size+12;
   const left=Math.max(0,Math.min(window.innerWidth-dockWidth,buttonCenter-dockWidth/2));
   qrDock.style.setProperty('--qr-compact-left',`${Math.round(left)}px`);qrDock.style.setProperty('--qr-compact-top',`${Math.round(headerRect.bottom+8)}px`);
  }else if(previous){qrDock.style.removeProperty('--qr-compact-left');qrDock.style.removeProperty('--qr-compact-top');qrDock.style.removeProperty('--qr-compact-size');}
 }
 const settleQrDockLayout=()=>{queueQrDockLayout();requestAnimationFrame(()=>requestAnimationFrame(queueQrDockLayout));};
 window.addEventListener('resize',settleQrDockLayout,{passive:true});window.visualViewport?.addEventListener('resize',settleQrDockLayout,{passive:true});window.addEventListener('scroll',queueQrDockLayout,{passive:true});
 const qrResizeObserver=new ResizeObserver(settleQrDockLayout);qrResizeObserver.observe(appHeader);qrResizeObserver.observe(joinOpen);qrAvoid.forEach(node=>qrResizeObserver.observe(node));document.fonts.ready.then(settleQrDockLayout);
 $('surpriseGame').onclick=()=>{const candidates=state?.catalog.filter(g=>catalogFilter==='all'||document.querySelector('.game[data-id="'+g.id+'"]')?.dataset.category===catalogFilter)||[];if(candidates.length){const chosen=candidates[Math.floor(Math.random()*candidates.length)];document.querySelector('.game[data-id="'+chosen.id+'"]').scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});showRules(chosen);}};
 const heroStage=document.querySelector('.headline-stage');
 if(heroStage&&!reduced){heroStage.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=heroStage.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),y=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));heroStage.style.setProperty('--art-x',(x*4).toFixed(2)+'px');heroStage.style.setProperty('--art-y',(y*3).toFixed(2)+'px');},{passive:true});heroStage.addEventListener('pointerleave',()=>{heroStage.style.setProperty('--art-x','0px');heroStage.style.setProperty('--art-y','0px');});}
 $('railTop').onclick=()=>window.scrollTo({top:0,behavior:reduced?'auto':'smooth'});
 $('goTable').onclick=()=>{filterCatalog('all');$('tableSection').scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});};
 let scrollFrame=0,landscapeY=0,lastLandscapeTime=0;const updateLandscape=time=>{const target=Math.min(64,scrollY*.025),dt=Math.min(40,time-(lastLandscapeTime||time-16));lastLandscapeTime=time;landscapeY+=(target-landscapeY)*(1-Math.exp(-dt/180));document.documentElement.style.setProperty('--landscape-shift',landscapeY.toFixed(2)+'px');if(Math.abs(target-landscapeY)>.08&&!document.hidden)scrollFrame=requestAnimationFrame(updateLandscape);else{scrollFrame=0;lastLandscapeTime=0;}};window.addEventListener('scroll',()=>{if(!reduced&&!scrollFrame)scrollFrame=requestAnimationFrame(updateLandscape);},{passive:true});
 $('address').onchange=updateQR;$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('address').value);tell('Адрес скопирован');}catch{tell('Адрес для друзей: '+$('address').value);}};
 $('joinForm').onsubmit=e=>{e.preventDefault();const data={type:'join',token:profile?.token,freshIdentity:freshIdentityPending,name:$('name').value,hand:document.querySelector('[name=hand]:checked').value,avatar:pendingAvatar||null};if(replaced){removed=false;replaced=false;connect();ws.addEventListener('open',()=>send(data),{once:true});}else send(data);};
 $('edit').onclick=()=>{editing=true;pendingAvatar=profile?.avatar||null;$('name').value=profile?.name||'';updateAvatarPreview();render();$('name').focus();};
 $('name').addEventListener('input',updateAvatarPreview);$('avatarCapture').onclick=()=>$('avatarFile').click();$('avatarRemove').onclick=()=>{pendingAvatar=null;$('avatarFile').value='';updateAvatarPreview();};$('avatarFile').onchange=async()=>{const file=$('avatarFile').files?.[0];if(!file)return;$('avatarCapture').disabled=true;try{pendingAvatar=await prepareAvatar(file);updateAvatarPreview();tell('Фото готово — сохрани профиль.');}catch(e){tell(e.message);}finally{$('avatarCapture').disabled=false;}};
 const requestLobbyExit=()=>{if(!host){const votes=state?.active?.session?.exitVotes||[];send({type:'exit-vote',vote:!votes.includes(profile?.id),instance:state?.active?.instance});return;}$('roomDialog').close();$('confirmStop').returnValue='';$('confirmStop').showModal();};
 window.addEventListener('message',e=>{if(e.source!==$('gameFrame').contentWindow||e.origin!==location.origin||e.data?.type!=='party-exit'||e.data.instance!==state?.active?.instance)return;if(host&&state.active.ui?.phase==='results')send({type:'stop'});else requestLobbyExit();});
 $('back').onclick=requestLobbyExit;$('lobbyExit').onclick=requestLobbyExit;$('exitVoteButton').onclick=requestLobbyExit;
 $('confirmStop').onclose=()=>{if($('confirmStop').returnValue==='yes')send({type:'stop'});};
 $('readyButton').onclick=()=>send({type:'ready-set',ready:!(state?.active?.session?.readyIds||[]).includes(profile?.id),instance:state?.active?.instance});
 $('spectateButton').onclick=()=>send({type:'spectate-set',spectating:!(state?.active?.session?.spectatorIds||[]).includes(profile?.id),instance:state?.active?.instance});
 $('pauseButton').onclick=()=>send({type:'pause-set',paused:!state?.active?.session?.paused,instance:state?.active?.instance});$('resumeButton').onclick=()=>send({type:'pause-set',paused:false,instance:state?.active?.instance});
 $('sessionRules').onclick=()=>showRules(state?.catalog.find(g=>g.id===state.active?.id));
 document.querySelector('.company-people').append($('testModeBox'));
 $('botMinus').onclick=()=>send({type:'bots-set',count:Math.max(0,(state?.botCount||0)-1)});
 $('botPlus').onclick=()=>send({type:'bots-set',count:(state?.botCount||0)+1});
 $('testMode').onchange=()=>send({type:'test-mode',enabled:$('testMode').checked});
 $('retryGame').onclick=()=>{$('roomDialog').close();frameKey=null;render();};$('gameRules').onclick=()=>showRules(state?.catalog.find(g=>g.id===state.active?.id));
 $('backRules').onclick=()=>$('rulesDialog').close();
 $('closeRules').onclick=()=>$('rulesDialog').close();$('closeStats').onclick=()=>$('statsDialog').close();
 $('showStats').onclick=showTop;$('showGames').onclick=showCatalog;
 $('allRanks').onclick=showTop;$('qrDock').onclick=()=>$('joinOpen').click();for(const b of document.querySelectorAll('[data-filter]'))b.onclick=()=>{filterCatalog(b.dataset.filter);if(window.innerWidth<900&&b.dataset.filter!=='fresh')$('catalogSection').scrollIntoView({behavior:reduced?'auto':'smooth'});};
 $('roomToggle').onclick=()=>{$('roomDialog').showModal();$('roomTitle').focus({preventScroll:true});$('roomDialog').scrollTop=0;};$('closeRoom').onclick=()=>$('roomDialog').close();$('roomRules').onclick=()=>{$('roomDialog').close();$('gameRules').click();};
 $('companyRoomOpen').onclick=()=>{$('roomDialog').showModal();$('roomTitle').focus({preventScroll:true});$('roomDialog').scrollTop=0;};
 $('joinOpen').onclick=()=>{$('dialogQr').src=$('qr').src;$('dialogAddress').textContent=$('address').value||location.origin;$('joinDialog').showModal();};$('closeJoin').onclick=()=>$('joinDialog').close();$('copyDialogAddress').onclick=()=>$('copy').click();$('closeCatalog').onclick=()=>$('catalogDialog').close();
 $('gameFrame').addEventListener('load',()=>{rosterPostedSource=null;renderHUD(true);});window.addEventListener('resize',()=>renderHUD(true));document.fonts?.ready.then(()=>renderHUD(true));setInterval(renderHUD,200);
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===$('gameFrame').contentWindow&&e.data?.type==='party-visual-ready'&&e.data.instance===state?.active?.instance)$('gameFrame').dataset.loading='false';});
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==$('gameFrame').contentWindow||e.data?.type!=='party-score'||e.data.instance!==state?.active?.instance)return;liveScoreInstance=e.data.instance;const rows=Array.isArray(e.data.rows)?e.data.rows:[];$('liveTop').replaceChildren(...rows.slice(0,16).map((p,i)=>{const d=el('span','');d.append(el('b','',`${i+1}. ${p.name}`),document.createTextNode(` · ${Number(p.score)||0}`));return d;}));$('liveTop').setAttribute('aria-label',e.data.label||'Счёт игры');});
 const presses=new Map();document.addEventListener('pointerdown',e=>{const b=e.target.closest?.('button,[role=button]');if(!b||b.disabled)return;presses.set(e.pointerId,b);b.classList.add('party-pressed');},{passive:true});
 const releasePress=id=>{const b=presses.get(id);presses.delete(id);if(b&&![...presses.values()].includes(b))b.classList.remove('party-pressed');};for(const name of ['pointerup','pointercancel'])window.addEventListener(name,e=>releasePress(e.pointerId));window.addEventListener('blur',()=>{for(const id of [...presses.keys()])releasePress(id);});
 $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{tell('Полный экран доступен в меню браузера.');}};
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==$('gameFrame').contentWindow||e.data?.type!=='party-game-status'||e.data.instance!==state?.active?.instance||host)return;gameStatus=e.data.status;if(gameStatus==='ready')requestAnimationFrame(()=>requestAnimationFrame(()=>{if(e.data.instance===state?.active?.instance)$('gameFrame').dataset.loading='false';}));if(e.data.message)tell(e.data.message);if(ws?.readyState===WebSocket.OPEN)send({type:'game-status',status:gameStatus,instance:state?.active?.instance});render();});
 document.addEventListener('contextmenu',e=>{if(e.target.closest?.('button,.game,.player,.playbar'))e.preventDefault();});
 document.addEventListener('selectstart',e=>{if(e.target.closest?.('button,.game,.playbar'))e.preventDefault();});
 function resume(){if(replaced)return;$('gameFrame').contentWindow?.postMessage({type:'party-resume'},location.origin);clearTimeout(pongTimer);const checked=ws;const reopen=()=>{if(ws!==checked)return;const old=ws;ws=null;old?.close();connect();};if(ws?.readyState!==WebSocket.OPEN){reopen();return;}send({type:'ping'});pongTimer=setTimeout(reopen,1800);}
 window.addEventListener('party-native-resume',resume);window.addEventListener('party-native-hide',()=>{$('gameFrame').contentWindow?.postMessage({type:'party-release'},location.origin);});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)resume();});window.addEventListener('online',resume);window.addEventListener('pageshow',e=>{if(e.persisted)resume();});
 async function init(){if(!host){try{profile=JSON.parse(localStorage.getItem('local-party-profile')||'null');}catch{}const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),1800);try{const data=await(await fetch('/api/profile',{signal:abort.signal})).json();profile=data.profile||profile;}catch{}finally{clearTimeout(timeout);}window.PARTY_PROFILE=profile||{};if(profile){$('name').value=profile.name;pendingAvatar=profile.avatar||null;document.querySelector(`[name=hand][value=${profile.hand==='left'?'left':'right'}]`).checked=true;}updateAvatarPreview();}render();connect();}
 init();
})();
