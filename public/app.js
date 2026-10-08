(() => {
 'use strict';
 // Keep a running host's cached catalog visually current without interrupting a match.
 const menuPalette={"push":["#a96aff","#5ce9ef"],"shrink":["#31dfff","#9760ff"],"knives":["#ff5977","#41d7ef"],"bomb":["#ae54ff","#ff9f35"],"western":["#ffac43","#a75bff"],"tanks":["#b4ec35","#8c55ff"],"tankarena":["#b6fa32","#a45cff"],"chaos":["#9b58ff","#17cfff"],"kart":["#ff634b","#c0ef3a"],"monster":["#25d8e5","#aa65f6"],"spy":["#b56aff","#f5bf51"],"millionaire":["#ffc949","#33dfff"],"sinyakquiz":["#bcf735","#a663ff"],"warsaw":["#efbb60","#b0ec3b"],"crocodile":["#a8ec32","#a866ef"],"jenga":["#f4b24e","#a872f5"],"crane":["#ffcc36","#19cfe9"],"naval":["#28d7f0","#8c68ef"],"drawguess":["#9f63f5","#b5ed35"],"western_duel":["#b363f5","#ffc440"],"taprace":["#ffc04d","#be63f3"],"punchmeter":["#ff6589","#ae63f5"],"flappy":["#3adef5","#b259ff"],"hungry":["#b2ef39","#ffad3e"],"snakelines":["#b4ed3f","#a86bff"],"carryball":["#36dbe9","#a7e83d"]};
 const $=id=>document.getElementById(id),host=!!window.PARTY_HOST_KEY;
 const setupAudio=()=>{const audio=window.HeyPalsAudio;if(!audio)return;audio.configure({surface:host?'host':'phone',musicOwner:false});const container=document.createElement('div');container.className='room-audio-settings';$('roomDialog').querySelector('.room-content').append(container);audio.mountSettings(container);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupAudio,{once:true});else setupAudio();

 const languagePicker=window.PartyI18n?.createPicker();if(languagePicker)$('joinForm').querySelector('.profile-fields').append(languagePicker);
 const pauseLanguagePicker=window.PartyI18n?.createPicker();if(pauseLanguagePicker)$('pauseOverlay').firstElementChild.append(pauseLanguagePicker);
 new ResizeObserver(()=>{const height=$('sessionControls').getBoundingClientRect().height;if(height>0)$('play').style.setProperty('--session-controls-height',height+'px');}).observe($('sessionControls'));
 if(host&&window.PartyI18n){const settings=document.createElement('div');settings.className='party-language-controls';settings.append(window.PartyI18n.createPicker());const force=document.createElement('button');force.type='button';force.className='quiet';force.textContent='Применить язык ко всем';force.onclick=()=>{if(confirm(window.PartyI18n.t('Переключить язык у всех игроков? Каждый сможет изменить его снова.')))send({type:'force-language',language:window.PartyI18n.language});};settings.append(force);$('testModeBox').after(settings);}
 let profile=null,state=null,ws,frameKey=null,replaced=false,editing=false,accepted=false,everAccepted=false,gameStatus='connecting',lastRanks='',freshIdentityPending=false,reconnectTimer,pongTimer,clockOffset=0,waitingKey='',catalogFilter='all',pendingAvatar=null,accessClosed=false,recoveryId='';
 const clientId=(()=>{let id=localStorage.getItem('local-party-client-id');if(!id){id=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;localStorage.setItem('local-party-client-id',id);}return id;})();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const freshIds=['curling','bowling','swarm_gate','peek_shoot','taprace','punchmeter','flappy','hungry','snakelines','carryball'];
 const gameCategory=g=>['chaos','jenga','crane','naval','millionaire','warsaw','sinyakquiz'].includes(g.id)?'logic':['monster','spy','crocodile','drawguess'].includes(g.id)?'party':'action';
 let testProfiles=[],liveScoreInstance='',guestCategory='all',guestSearch='',removed=false,rosterSource=null,rosterForGames=[],rosterPostedSource=null;
 document.body.classList.toggle('guest-catalog',!host);
 const incidentBanner=el('div','room-incident');incidentBanner.setAttribute('role','status');incidentBanner.hidden=true;document.querySelector('.app-header').after(incidentBanner);
 const profileBackdrop=el('div','profile-sheet-backdrop');profileBackdrop.hidden=true;document.body.append(profileBackdrop);
 let profileMotion=null,profileOpener=null;
 function syncProfileSheet(show,hideOnboarding){
  const sheet=$('onboarding'),wasOpen=document.body.classList.contains('profile-editing');
  if(show&&wasOpen&&!profileMotion?.exiting)return;
  if(!show&&profileMotion?.exiting){profileMotion.hide=hideOnboarding;return;}
  if(!show&&!wasOpen){sheet.hidden=hideOnboarding;profileBackdrop.hidden=true;$('profileCancel').hidden=true;return;}
  const current=wasOpen?getComputedStyle(sheet):null,from=current?{opacity:current.opacity,scale:current.scale==='none'?'1':current.scale,transform:current.transform}:null,shadeOpacity=getComputedStyle(profileBackdrop).opacity;
  if(profileMotion){clearTimeout(profileMotion.timer);profileMotion.animations.forEach(a=>a.cancel());profileMotion=null;}
  sheet.style.setProperty('animation','none','important');profileBackdrop.style.setProperty('animation','none','important');
  const quiet=matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden;
  if(show){
   document.body.removeAttribute('data-profile-closing');document.body.classList.add('profile-editing');sheet.hidden=false;profileBackdrop.hidden=false;$('profileCancel').hidden=false;
   sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.style.removeProperty('pointer-events');profileBackdrop.style.removeProperty('pointer-events');
   if(!quiet){const animations=[sheet.animate([from||{opacity:0,scale:'.965',transform:'translate(-50%,14px)'},{opacity:1,scale:'1',transform:'translate(-50%,0)'}],{duration:240,easing:'cubic-bezier(.2,.78,.2,1)'}),profileBackdrop.animate([{opacity:wasOpen?shadeOpacity:0},{opacity:1}],{duration:240})];const record={animations,exiting:false,timer:0};profileMotion=record;record.timer=setTimeout(()=>{if(profileMotion===record)profileMotion=null;},240);}
   return;
  }
  const finish=record=>{
   if(record&&profileMotion!==record)return;
   profileMotion=null;document.body.removeAttribute('data-profile-closing');document.body.classList.remove('profile-editing');sheet.hidden=record?record.hide:hideOnboarding;profileBackdrop.hidden=true;$('profileCancel').hidden=true;
   sheet.removeAttribute('role');sheet.removeAttribute('aria-modal');sheet.style.removeProperty('animation');sheet.style.removeProperty('pointer-events');profileBackdrop.style.removeProperty('animation');profileBackdrop.style.removeProperty('pointer-events');record?.animations.forEach(a=>a.cancel());
   const opener=profileOpener;profileOpener=null;if(opener?.isConnected&&!opener.closest('[hidden]'))opener.focus({preventScroll:true});
  };
  if(quiet){finish();return;}
  document.body.setAttribute('data-profile-closing','');sheet.style.pointerEvents='none';profileBackdrop.style.pointerEvents='none';
  const animations=[sheet.animate([from,{opacity:0,scale:'.96',transform:'translate(-50%,8px)'}],{duration:180,easing:'cubic-bezier(.23,1,.32,1)',fill:'forwards'}),profileBackdrop.animate([{opacity:shadeOpacity},{opacity:0}],{duration:180,easing:'ease-out',fill:'forwards'})];
  const record={animations,exiting:true,hide:hideOnboarding,timer:0};profileMotion=record;record.timer=setTimeout(()=>finish(record),190);
 }
 function updateTestCompanion(){if(host)window.PartyBots?.update(state,testProfiles);}
 window.PARTY_PROFILE={};
 const tell=text=>{delete $('notice').dataset.avatarError;$('notice').textContent=text;window.LocalPartyDialogs?.setVisible($('notice'),true);clearTimeout(tell.timer);tell.timer=setTimeout(()=>window.LocalPartyDialogs?.setVisible($('notice'),false),6000);};
 const send=data=>{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify(data));return true;}$('connection').textContent=accessClosed?'Ждём приглашения ведущего':'Подключаемся…';return false;};
 async function persist(){localStorage.setItem('local-party-profile',JSON.stringify(profile));try{await fetch('/api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:profile.token})});}catch{}}
 function connect(){
  clearTimeout(reconnectTimer);
  ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/lobby`);
  const channel=ws;
  ws.onopen=()=>{if(ws!==channel)return;$('joinForm').querySelector('button[type="submit"]').disabled=avatarBusy;$('connection').textContent='В одной сети';$('connection').classList.add('online');if(host)send({type:'host',key:window.PARTY_HOST_KEY});else if(profile)send({type:'join',...profile,clientId});};
  ws.onmessage=event=>{if(ws!==channel)return;const m=JSON.parse(event.data);
   if(m.type==='state'){window.PartyI18n?.protectPlayers([...(m.players||[]),...(m.leaderboard||[]),...(m.active?.roster||[])]);window.PartyI18n?.acceptRoomLanguage(m.languageOverride);}
   if(m.type==='joined')window.PartyI18n?.protectPlayers([m]);
   if(m.type==='pong')clearTimeout(pongTimer);
   if(m.type==='test-profiles'&&host){testProfiles=m.profiles||[];updateTestCompanion();return;}
   if(m.type==='session-start'&&host&&m.instance===state?.active?.instance){$('gameFrame').contentWindow?.postMessage({type:'party-start',instance:m.instance},location.origin);return;}
   if(m.type==='game-ui'&&state?.active?.instance===m.instance){state.active.ui=m.ui;clockOffset=Date.now()-m.ui.serverNow;renderHUD();return;}
   if(m.type==='access-closed'){accessClosed=true;if(state){state={...state,active:null,incident:null};render();}$('notice').hidden=true;$('connection').textContent='Ждём приглашения ведущего';}
   if(m.type==='profile-required'){recoveryId=profile?.id||recoveryId;profile=null;window.PARTY_PROFILE={};localStorage.removeItem('local-party-profile');accepted=everAccepted=false;editing=true;render();}
   if(m.type==='state'){accessClosed=false;for(const g of m.catalog){const p=menuPalette[g.id];if(p){g.color=p[0];g.secondaryColor=p[1];}}state=m;if(!host&&editing&&profile&&m.active)saveProfileEdits();if(m.active?.ui?.serverNow)clockOffset=Date.now()-m.active.ui.serverNow;render();}
   if(m.type==='host-ok'){accepted=everAccepted=true;render();}
   if(m.type==='joined'){const firstJoin=!everAccepted;freshIdentityPending=false;recoveryId='';accepted=everAccepted=true;profile={id:m.id,token:m.token,name:m.name,hand:m.hand,avatar:m.avatar||null};pendingAvatar=profile.avatar;window.PARTY_PROFILE=profile;persist();editing=false;render();if(firstJoin&&!state?.active)requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));}
   if(m.type==='error'){window.HeyPalsMatchResults?.rejectRematch?.(m.message);tell(m.message);if(!host&&!everAccepted){editing=true;render();}}
   if(m.type==='kicked'){removed=true;freshIdentityPending=true;accepted=everAccepted=false;replaced=true;profile=null;pendingAvatar=null;window.PARTY_PROFILE={};localStorage.removeItem('local-party-profile');frameKey=null;$('gameFrame').src='about:blank';editing=true;render();incidentBanner.textContent=m.message+' Для повторного входа укажите имя и нажмите «Я в игре».';incidentBanner.hidden=false;return;}
   if(m.type==='replaced'){freshIdentityPending=false;accepted=everAccepted=false;replaced=true;recoveryId=profile?.id||recoveryId;frameKey=null;$('gameFrame').src='about:blank';editing=true;render();tell('Связь перешла в другую вкладку. Нажми «Я в игре», чтобы вернуться здесь.');}
  };
  ws.onclose=event=>{if(ws!==channel)return;if(event.code===4001&&!replaced){freshIdentityPending=false;accepted=everAccepted=false;replaced=true;recoveryId=profile?.id||recoveryId;editing=true;render();}else accepted=false;$('joinForm').querySelector('button[type="submit"]').disabled=!replaced;$('connection').textContent=removed?'Вы удалены из комнаты':replaced?'Другая вкладка':accessClosed?'Ждём приглашения ведущего':'Подключаемся…';$('connection').classList.remove('online');if(!replaced)reconnectTimer=setTimeout(connect,800);};
  ws.onerror=()=>{};
 }
 function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
 function menuCounter(node,value,label='',total=null,labelFirst=false){
  const key=JSON.stringify([value,label,total,labelFirst]);
  if(node.dataset.counterKey===key&&node.querySelector('.hp-menu-counter-value'))return node;
  node.dataset.counterKey=key;node.classList.add('hp-menu-counter');node.classList.toggle('hp-catalog-counter',/^(?:игр(?:а|ы)?|games?)$/i.test(label));
  const number=el('span','hp-menu-counter-value',String(value));number.dataset.noTranslate='';
  const caption=el('span','hp-menu-counter-label',label);caption.dataset.i18nUi='';
  const readout=el('span','hp-menu-counter-readout');readout.append(number);
  if(total!==null){const denominator=el('span','hp-menu-counter-total',String(total));denominator.dataset.noTranslate='';readout.append(el('span','hp-menu-counter-separator',' / '),denominator);}
  node.replaceChildren(...(labelFirst?[caption,document.createTextNode(' '),readout]:[readout,...(label?[document.createTextNode(' '),caption]:[])]));return node;
 }
 function initial(name){return Array.from(String(name||'?').trim())[0]?.toUpperCase()||'?';}
 function paintAvatarPhoto(node,photo,alt=''){
  node.classList.remove('has-photo');delete node.dataset.photoState;
  if(!photo)return;
  const img=el('img','lp-avatar-image');img.alt=alt;img.decoding='async';
  node.classList.add('has-photo');node.dataset.photoState='loading';
  let settled=false;
  const finish=failed=>{if(settled)return;settled=true;clearTimeout(deadline);if(!node.contains(img))return;
   node.dataset.photoState=failed?'error':'ready';
   if(failed){img.remove();node.classList.remove('has-photo');}else img.dataset.decoded='true';
  };
  const deadline=setTimeout(()=>finish(true),12000);
  img.addEventListener('error',()=>finish(true),{once:true});
  img.addEventListener('load',async()=>{try{await img.decode?.();finish(!img.naturalWidth);}catch{finish(true);}},{once:true});
  node.append(img);img.src=photo;
 }
 function avatarNode(p,className='avatar'){
  const node=el('span',className,initial(p?.name));node.dataset.initial=initial(p?.name);node.setAttribute('data-no-translate','');window.HeyPalsAvatar?.paint(node,p?.name);
  paintAvatarPhoto(node,p?.avatar);
  return node;
 }
 function updateAvatarPreview(){const preview=$('avatarPreview'),letter=initial($('name').value||profile?.name);preview.dataset.initial=letter;preview.setAttribute('data-no-translate','');preview.replaceChildren(el('span','',letter));paintAvatarPhoto(preview,pendingAvatar,'Предпросмотр фото');$('avatarRemove').hidden=!pendingAvatar;$('photoTitle').textContent=pendingAvatar?'Твоё фото':'Добавь фото';$('photoHint').textContent='Для игры и пьедестала.';}
 async function prepareAvatar(file){
  if(!file||!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>12*1024*1024)throw Error('Выбери JPEG, PNG или WebP до 12 МБ.');
  let source,release=()=>{};try{if('createImageBitmap' in window)source=await createImageBitmap(file,{imageOrientation:'from-image'});else{const url=URL.createObjectURL(file);release=()=>URL.revokeObjectURL(url);source=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});}}catch{release();throw Error(window.PartyI18n?.language==='ru'?'Не удалось открыть фото. Выбери другой JPEG, PNG или WebP.':'Could not open this photo. Choose another JPEG, PNG or WebP.');}
  try{const side=Math.min(source.width,source.height),sx=(source.width-side)/2,sy=(source.height-side)/2,canvas=document.createElement('canvas');canvas.width=canvas.height=192;const c=canvas.getContext('2d',{alpha:false});c.fillStyle='#17131f';c.fillRect(0,0,192,192);c.drawImage(source,sx,sy,side,side,0,0,192,192);for(const quality of [.82,.72,.62,.52]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<128000)return data;}throw Error('Фото не удалось достаточно уменьшить.');}finally{source.close?.();release();}
 }
 // Profile lives in the masthead: a round avatar with your initial/photo opens the editor.
 function profileChip(){
  if(host)return;let chip=$('editFromCatalog');
  if(!chip){chip=el('button','profile-chip');chip.id='editFromCatalog';chip.type='button';chip.onclick=openProfile;document.querySelector('.app-header>nav:last-of-type')?.append(chip);}
  const key=JSON.stringify([profile?.name,profile?.avatar]);if(chip.dataset.key!==key){chip.dataset.key=key;chip.replaceChildren(avatarNode(profile,'profile-chip-avatar'));}
  if(profile?.name)window.PartyI18n?.protectPlayers([profile]);chip.setAttribute('aria-label','Профиль и фото'+(profile?.name?': '+profile.name:''));chip.hidden=!profile;
 }
 function render(){
  updateTestCompanion();profileChip();
  const ready=(accepted||everAccepted)&&(host||!!profile);
  const profileSheet=!host&&editing&&!!profile&&ready;
  syncProfileSheet(profileSheet,host||ready&&!editing);$('home').hidden=!ready;
  if(!state)return;
  window.PartySpotlight?.update(state,{launch:id=>send({type:'spotlight-launch',id}),host,ready:ready&&!editing});
  incidentBanner.hidden=!state.incident;incidentBanner.textContent=state.incident?.message||'';
  const game=state.catalog.find(g=>g.id===state.active?.id),inGame=ready&&!!game;
  const returningToLobby=!inGame&&!!frameKey;
  if(returningToLobby){
   // Clear game-owned surfaces before exposing the catalog, in the same paint.
   $('pauseOverlay').hidden=true;$('waitingRules').hidden=true;
   document.body.classList.remove('game-waiting','session-active');
   delete $('play').dataset.waiting;window.PARTY_INSTANCE=null;
   for(const id of ['rulesDialog','roomDialog'])$(id)?.close();
   window.LocalPartyUIFeel?.cancel();
  }
  $('lobby').hidden=inGame;$('play').hidden=!inGame;
  if(inGame){
   $('playingTitle').textContent=game.title;$('playingControls').textContent=game.controls;$('back').hidden=!host;
   const key=state.active.instance+':'+(profile?.id||'host');
   if(frameKey!==key){window.PARTY_INSTANCE=state.active.instance;frameKey=key;gameStatus='connecting';$('gameFrame').dataset.loading='true';$('gameFrame').src=`/games/${game.id}${host?game.host:game.player}`;}
   const count=state.players.filter(p=>p.gameReady).length;
   // A cached room snapshot can still say ready while this iframe reconnects.
   // Only the current iframe's handshake may re-enable readiness controls.
   $('gameConnection').textContent=host?`${count}/${state.players.length} в игре`:gameStatus==='ready'?'Ты в игре':gameStatus==='error'?'Повторяем вход…':'Подключаем контроллер…';
   $('gameConnection').classList.toggle('ready',host?count===state.players.length:gameStatus==='ready');
  }else if(frameKey){$('gameFrame').src='about:blank';frameKey=null;}
  $('invite').hidden=!host;$('me').hidden=host||!profile;
  if(!host){const headline=window.PartyI18n?.t('Компания в сборе.')||'The party is here.';if($('headline').dataset.copy!==headline){$('headline').dataset.copy=headline;$('headline').replaceChildren(...headline.split(/(party)/i).map(part=>/^party$/i.test(part)?el('em','',part):document.createTextNode(part)));}$('subtitle').textContent='Голосуйте за игру. Когда выберут все, запустится лидер голосования.';$('myName').textContent=profile?`Ты — ${profile.name}`:'';}
  const urls=state.urls.length?state.urls:[location.origin+'/'];
  if(host&&JSON.stringify(urls)!==$('address').dataset.urls){$('address').dataset.urls=JSON.stringify(urls);$('address').replaceChildren(...urls.map(url=>{const o=el('option','',url);o.value=url;return o;}));updateQR();}
  menuCounter($('count'),state.players.length,'',16);$('empty').hidden=!!state.players.length;
  $('players').replaceChildren(...state.players.map((p,i)=>{const row=el('div','player'),avatar=avatarNode(p);avatar.style.setProperty('--card',state.catalog[i%state.catalog.length].color);row.append(avatar,el('b','',p.name),el('small',p.gameReady?'is-ready':'',p.gameReady?'в игре':p.id===profile?.id?'это ты':'в сети'));return row;}));
  if(!$('games').children.length)buildCatalog();
  updateVotes();
  const ballotNote=document.querySelector('.guest-ballot-status');if(ballotNote){const b=state.ballot,explanation=b?.reason==='tie'?'Ничья. Подключите ТВ — сервер случайно выберет одну из игр-лидеров.':b?.reason==='player-count'?'Для выбранной игры не подходит число игроков. Выберите другую игру.':b?.reason==='ready'?'Все проголосовали. Подключите ТВ — игра запустится автоматически.':'';if(explanation){ballotNote.classList.remove('hp-menu-counter');ballotNote.textContent=explanation;}else menuCounter(ballotNote,b?.voted||0,'Голосов',b?.total||0,true);}
  for(const b of document.querySelectorAll('.start-game'))b.disabled=state.busy;
  if(state.busy)$('connection').textContent='Запускаем игру…';else if(ws?.readyState===WebSocket.OPEN)$('connection').textContent='В одной сети';
  renderRanks();renderMiniRanks();renderRoom();renderHUD();
  if(returningToLobby)window.dispatchEvent(new CustomEvent('party-lobby-enter',{detail:{root:$('lobby')}}));
 }
 function buildCatalog(){
  if(!host){buildGuestCatalog();return;}
  menuCounter($('totalGames'),state.catalog.length,'игр');menuCounter($('arcadeCount'),state.catalog.filter(g=>g.section!=='table').length,'игр');
  const featureCandidates=state.catalog.filter(g=>g.section!=='table'&&!freshIds.includes(g.id));
  const popular=Object.entries(state.gamePopularity||{}).filter(([id])=>featureCandidates.some(g=>g.id===id)).sort((a,b)=>b[1]-a[1]);
  const featured=popular[0]?.[1]>0?popular[0][0]:featureCandidates.find(g=>g.id==='tankarena')?.id||featureCandidates[0]?.id;
  [...state.catalog].sort((a,b)=>Number(b.id===featured)-Number(a.id===featured)).forEach((g)=>{const i=state.catalog.findIndex(x=>x.id===g.id);
   const card=el('article','game');card.style.setProperty('--enter-delay',Math.min(i*35,120)+'ms');card.dataset.id=g.id;card.dataset.category=['chaos','jenga','crane','naval','millionaire','warsaw','sinyakquiz'].includes(g.id)?'logic':['monster','spy','crocodile','drawguess'].includes(g.id)?'party':'action';card.style.setProperty('--card',g.color);card.style.setProperty('--card-secondary',g.secondaryColor||g.color);
   const art=el('div','art'),artwork=el('img','symbol');artwork.src=g.artwork?'/assets/games/'+g.artwork:'/assets/games/'+(g.id==='tankarena'?'tankarena-hd':g.id)+'.webp?v=0.6-premium';artwork.alt='';artwork.loading=i<5?'eager':'lazy';artwork.draggable=false;art.append(el('span','tag',g.tag),artwork,el('span','number',String(i+1).padStart(2,'0')));if(g.id===featured){card.classList.add('featured');card.append(el('span','featured-label',popular[0]?.[1]>0?'↗ Чаще играем':'✳ Выбор вечера'));}
   card.style.setProperty('--lp-card-art',`url("${artwork.getAttribute('src')}")`);
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
  const updateArrows=()=>{previous.disabled=track.scrollLeft<=2;next.disabled=track.scrollLeft>=track.scrollWidth-track.clientWidth-2;track.style.setProperty("--fresh-fade-left",previous.disabled?"0px":"28px");track.style.setProperty("--fresh-fade-right",next.disabled?"0px":"28px");};const advance=direction=>window.HeyPalsScroll?.by(track,direction*(track.clientWidth*.95)) || track.scrollBy({left:direction*(track.clientWidth*.95),behavior:'auto'});previous.onclick=()=>advance(-1);next.onclick=()=>advance(1);track.addEventListener('scroll',updateArrows,{passive:true});new ResizeObserver(updateArrows).observe(track);requestAnimationFrame(updateArrows);
 }
 function voteButton(game){
  const b=el('button','catalog-vote');b.type='button';b.dataset.vote=game.id;
  b.onclick=()=>send({type:'vote-game',id:(state.votes||[]).some(v=>v.playerId===profile?.id&&v.gameId===game.id)?null:game.id});return b;
 }
 function updateVotes(){rankGuests();for(const b of document.querySelectorAll('[data-vote]')){const votes=(state.votes||[]).filter(v=>v.gameId===b.dataset.vote),mine=votes.some(v=>v.playerId===profile?.id);const key=mine+':'+votes.length;if(b.dataset.counterVote!==key){b.dataset.counterVote=key;b.replaceChildren(el('span','hp-button-label',mine?'✓ Ваш голос':'Голосовать'));if(votes.length){const number=el('span','hp-vote-count',String(votes.length));number.dataset.noTranslate='';b.append(document.createTextNode(' · '),number);}}if(b.getAttribute('aria-pressed')!==String(mine))b.setAttribute('aria-pressed',String(mine));if(b.disabled!==!accepted)b.disabled=!accepted;window.PartyButtonProgress?.set(b,votes.length,(state.players||[]).filter(p=>!p.testBot).length);}}
 // Guest catalog = a ranked list: the most-voted game on top (tall card with the vote
 // count), the next two medium, the rest compact rows (art, title, rules "?", vote).
 function guestCard(game){
  const card=el('article','guest-game rank-row');card.dataset.id=game.id;card.dataset.section=game.section;
  if(/^#[a-f\d]{6}$/i.test(game.color||''))card.style.setProperty('--card',game.color);
  if(/^#[a-f\d]{6}$/i.test(game.secondaryColor||''))card.style.setProperty('--card-secondary',game.secondaryColor);
  const img=el('img','guest-art');img.sizes='64px';img.srcset='/assets/games/controller/'+game.id+'-192.webp 192w, /assets/games/controller/'+game.id+'-640.webp 640w';img.src='/assets/games/controller/'+game.id+'-640.webp';img.alt='';img.loading='eager';img.decoding='async';img.fetchPriority='low';img.onerror=()=>{img.hidden=true;};
  const copy=el('div','guest-copy'),lead=el('span','guest-lead');lead.hidden=true;copy.append(lead,el('strong','',game.title),menuCounter(el('small','guest-player-range'),game.min+'–'+game.max,'игроков'));
  const title=copy.querySelector('strong'),logo=el('img','guest-title-logo');title.classList.add('guest-title-text');logo.alt=game.title;logo.decoding='async';logo.src='/assets/game-logos-v1/logos/'+encodeURIComponent(game.id)+'.png?v=1';logo.onload=()=>card.classList.add('has-title-logo');logo.onerror=()=>logo.remove();copy.insertBefore(logo,title);
  const info=el('button','guest-info','?');info.type='button';info.setAttribute('aria-label','Правила: '+game.title);info.onclick=()=>showRules(game);
  const actions=el('div','guest-actions');actions.append(info,voteButton(game));
  card.append(img,copy,actions);return card;
 }
 const plural=(n,one,few,many)=>{const a=n%10,b=n%100;return a===1&&b!==11?one:a>=2&&a<=4&&(b<12||b>14)?few:many;};
 function rankGuests(){
  const list=$('games');if(!list||list.className!=='guest-games')return;
  const tally=new Map();for(const v of state.votes||[])tally.set(v.gameId,(tally.get(v.gameId)||0)+1);
  const order=new Map(state.catalog.map((g,i)=>[g.id,i])),cards=[...list.children];
  const sorted=[...cards].sort((a,b)=>(tally.get(b.dataset.id)||0)-(tally.get(a.dataset.id)||0)||order.get(a.dataset.id)-order.get(b.dataset.id));
  const moved=sorted.some((c,i)=>c!==cards[i]),before=moved&&!reduced?new Map(cards.map(c=>[c,c.getBoundingClientRect()])):null;
  if(moved)list.append(...sorted);
  let place=0;for(const card of sorted){const rank=card.hidden?'row':place===0?'hero':place<3?'big':'row';if(!card.hidden)place++;
   for(const r of ['hero','big','row'])card.classList.toggle('rank-'+r,r===rank);
   const art=card.querySelector('.guest-art'),size=rank==='row'?'64px':'200px';if(art&&art.sizes!==size){art.sizes=size;art.fetchPriority=rank==='row'?'low':'high';}
   const n=tally.get(card.dataset.id)||0,lead=card.querySelector('.guest-lead');if(lead.hidden!==(rank!=='hero'))lead.hidden=rank!=='hero';
   if(lead.dataset.votes!==String(n)){lead.dataset.votes=String(n);if(n){const readout=menuCounter(el('span',''),n,plural(n,'голос','голоса','голосов'));lead.replaceChildren(document.createTextNode('Лидер · '),readout);}else lead.textContent='Голосуй первым';}}
  // FLIP: cards glide to their new places instead of jumping.
  if(before)for(const card of sorted){const was=before.get(card),now=card.getBoundingClientRect();if(!was||card.hidden)continue;const dy=was.top-now.top;if(Math.abs(dy)<1)continue;
   card.animate([{transform:`translateY(${dy}px)`},{transform:'none'}],{duration:520,easing:'cubic-bezier(.32,.72,0,1)'});}
 }
 function buildGuestCatalog(){
  menuCounter($('totalGames'),state.catalog.length,'игр');menuCounter($('arcadeCount'),state.catalog.length,'игр');$('tableSection').hidden=true;
  $('games').className='guest-games';$('games').replaceChildren(...state.catalog.map(guestCard));
  const tools=el('div','guest-catalog-tools'),search=el('input','');search.type='search';search.placeholder='Game title';search.setAttribute('aria-label','Найти игру');search.oninput=()=>{guestSearch=search.value;filterGuests();};

  const ballot=el('details','guest-ballot'),summary=el('summary','','Как выбираем игру');ballot.append(summary,el('p','','Один голос на человека. Когда проголосуют все, игра запустится сама. При равенстве — случайный выбор среди лидеров.'));
  const status=el('p','guest-ballot-status');status.setAttribute('role','status');const row=el('div','guest-ballot-row');row.append(status,ballot);
  tools.append(search,row);$('games').before(tools);
 }
 function filterGuests(){let count=0;for(const card of $('games').children){const g=state.catalog.find(g=>g.id===card.dataset.id),matchesTab=catalogFilter==='all'||(catalogFilter==='fresh'?freshIds.includes(g.id):gameCategory(g)===catalogFilter);card.hidden=!matchesTab||!(guestCategory==='all'||(guestCategory==='table'?g.section==='table':g.section!=='table'))||!(()=>{const t=window.PartyI18n?.t||(x=>x),q=guestSearch.trim().toLocaleLowerCase();return !q||[g.title,g.id,g.tag,g.description,g.tag&&t(g.tag),g.description&&t(g.description)].filter(Boolean).join(' ').replace(/_/g,' ').toLocaleLowerCase().includes(q);})();if(!card.hidden)count++;}menuCounter($('arcadeCount'),count,'игр');rankGuests();}
 function filterCatalog(value){catalogFilter=value;for(const b of document.querySelectorAll('[data-filter]')){b.classList.toggle('active',b.dataset.filter===value);b.setAttribute('aria-pressed',String(b.dataset.filter===value));}document.body.dataset.filter=value;updateFilterIndicator();if(!host){guestCategory='all';filterGuests();return;}for(const card of document.querySelectorAll('.game')){card.hidden=!['all','fresh'].includes(value)&&card.dataset.category!==value;}$('tableSection').hidden=![...$('tableGames').children].some(c=>!c.hidden);if($('freshSection'))$('freshSection').hidden=!['all','fresh','action'].includes(value);menuCounter($('arcadeCount'),[...document.querySelectorAll('#games>.game,#moreGames>.game,#freshTrack>.game')].filter(c=>!c.hidden).length,'игр');if(value==='fresh')requestAnimationFrame(()=>$('freshSection')?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'}));}
 function updateFilterIndicator(){const nav=$('catalogFilters'),active=nav.querySelector('.active');if(!active||nav.hidden)return;nav.style.setProperty('--tab-x',active.offsetLeft+'px');nav.style.setProperty('--tab-y',active.offsetTop+'px');nav.style.setProperty('--tab-w',active.offsetWidth+'px');nav.style.setProperty('--tab-h',active.offsetHeight+'px');nav.classList.toggle('fresh-active',active.dataset.filter==='fresh');nav.classList.add('indicator-ready');}
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
  if(!g)return;$('rulesTitle').textContent=g.title;$('rulesBody').replaceChildren();$('rulesBody').onclick=e=>{const row=e.target.closest('#rulesBody>*');if(row)row.classList.toggle('open');};
  const rows=[['01 · ЦЕЛЬ',g.goal||g.description],['02 · УПРАВЛЕНИЕ',g.controls],['03 · КАК ПОБЕДИТЬ',g.win||'Следи за счётом на общем экране. Итоги появятся в конце партии.'],['ВХОД ВО ВРЕМЯ ИГРЫ',g.lateJoin||'Входи в любой момент. Если ход уже начался, игра подскажет, когда ты вступаешь.']];
  for(const [title,body] of rows){const row=el('div','rule-row');row.append(el('b','',title),el('p','',body));$('rulesBody').append(row);}
  $('rulesDialog').showModal();$('rulesTitle').tabIndex=-1;$('rulesTitle').focus({preventScroll:true});$('rulesDialog').scrollTop=0;
 }
 function awardIcon(key,cls='hp-award'){const img=el('img',cls);img.src='/assets/awards/'+key+'.png';img.alt='';img.setAttribute('aria-hidden','true');img.decoding='async';return img;}
 const awardMedals=['medal-gold','medal-silver','medal-bronze'];
 function placeNode(rank,cls,award='medal'){return window.HeyPalsUI?.createPlace(rank,{className:cls,award})||el('span',cls,String(rank));}
 function companyPlaces(rows){let rank=0,last='';return rows.map((p,i)=>{const key=`${Number(p.coins??p.points)||0}:${Number(p.wins)||0}`;if(key!==last){rank=i+1;last=key;}return rank;});}
 function literalName(name,cls=''){const n=el('b',cls+' hp-player-name',name);n.dataset.noTranslate='';return n;}
 const metricAwards={kills:'power',deaths:'survivor',shots:'accuracy',hits:'accuracy',correct:'accuracy',answers:'fair-play',streak:'win-streak',bestStreak:'win-streak',drawings:'party-veteran',strokes:'party-veteran',laps:'speed',captures:'defender',levels:'all-rounder',actions:'all-rounder',wins:'cup-star',votesCorrect:'fair-play',questions:'fair-play',bestLap:'personal-best',reactionMs:'speed',bestReactionMs:'personal-best',roundWins:'cup-gold',level:'all-rounder',spyRounds:'clutch',votes:'fair-play',finishTime:'speed',distance:'speed',boosts:'speed',damage:'power',guessed:'accuracy',performed:'party-veteran',placed:'defender',perfects:'accuracy',towerHeight:'new-record',sunk:'power',survived:'survivor',extracted:'clutch',blocks:'defender',bestPunch:'personal-best',punches:'power',flightSeconds:'clutch',finalMass:'survivor',teamGoals:'teamwork',rounds:'all-rounder'};
 const metricLabels={kills:'Уничтожений',deaths:'Возрождений',shots:'Выстрелов',hits:'Попаданий',correct:'Верных ответов',answers:'Ответов',streak:'Серия',drawings:'Рисунков',strokes:'Штрихов',laps:'Кругов',falseStarts:'Фальстартов',captures:'Флагов',levels:'Уровней',actions:'Действий',wins:'Побед',votesCorrect:'Верных голосов',questions:'Вопросов',bestLap:'Лучший круг',reactionMs:'Реакция, мс',bestReactionMs:'Лучшая реакция, мс',bestStreak:'Лучшая серия',roundWins:'Побед в раундах',wrong:'Ошибок',level:'Уровень',spyRounds:'Раундов шпионом',votes:'Голосований',finishTime:'Лучший финиш, с',distance:'Дистанция',boosts:'Ускорений',collisions:'Столкновений',damage:'Урона',guessed:'Угадано',skips:'Пропусков',performed:'Выходов на сцену',placed:'Блоков установлено',perfects:'Точных установок',misses:'Промахов',towerHeight:'Рекорд высоты',sunk:'Потоплено',survived:'Сохранено палуб',extracted:'Блоков вытянуто',blocks:'Блоков',skipped:'Пропущено ходов',collapsed:'Обрушений',timeouts:'Пропусков по времени'};
 function renderRanks(){
  const ranking=state.leaderboard||[],places=companyPlaces(ranking);const signature=JSON.stringify([ranking,state.lastResult?.key]);if(signature===lastRanks)return;lastRanks=signature;
  $('rankEmpty').hidden=!!ranking.length;$('partyMatches').textContent=String(state.totalMatches||0);
  const before=new Map([...$('leaderboard').children].map(n=>[n.dataset.id,n.getBoundingClientRect().top]));
  const existing=new Map([...$('leaderboard').children].map(n=>[n.dataset.id,n]));
  ranking.forEach((p,i)=>{
   const row=existing.get(p.id)||el('button','rank-row');row.type='button';row.dataset.id=p.id;row.dataset.place=places[i];row.classList.toggle('champion',places[i]===1);const rank=placeNode(places[i],'rank-number','cup');const identity=el('span','rank-identity');identity.append(avatarNode(p,'rank-avatar'),literalName(p.name,'rank-name'),el('small','rank-history',`${p.wins||0} побед · ${p.played||0} партий`));row.replaceChildren(rank,identity);
   const stats=el('span','rank-stats');window.HeyPalsCoins?.amount(stats,p.coins??p.points??0);row.classList.toggle('wide-score',String(Math.abs(Number(p.coins??p.points??0))).length>6);row.append(stats);row.onclick=()=>showPlayerStats(p);$('leaderboard').append(row);existing.delete(p.id);
  });for(const row of existing.values())row.remove();
  if(!reduced)for(const row of $('leaderboard').children){const prev=before.get(row.dataset.id),delta=prev===undefined?15:prev-row.getBoundingClientRect().top;row.animate([{transform:`translateY(${delta}px)`,opacity:prev===undefined?0:1},{transform:'translateY(0)',opacity:1}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'});}
  const result=state.lastResult;$('lastResult').hidden=!result;if(result){const game=state.catalog.find(g=>g.id===result.game),gameIdentity=el('span','last-result-game');if(game){const logo=el('img','last-match-logo');logo.src='/assets/game-logos-v1/logos/'+encodeURIComponent(game.id)+'.png?v=1';logo.alt='';logo.decoding='async';logo.setAttribute('data-hp-game-logo','');logo.onerror=()=>logo.remove();gameIdentity.append(logo);}gameIdentity.append(el('span','',game?.title||result.game));$('resultTitle').replaceChildren(el('span','last-result-label','Последняя партия'),gameIdentity);$('resultRows').replaceChildren(...[...result.players].sort((a,b)=>(a.rank||99)-(b.rank||99)).map((p,i)=>{const r=el('div','result-row');const team=result.ranking?.kind==='teams',score=el('span','last-result-score');score.append(el('strong','',Number(team?p.teamScore:p.score).toLocaleString('ru-RU')),el('small','',team?'Счёт команды':'очков'));const identity=el('span','last-result-identity');identity.append(avatarNode(ranking.find(player=>player.id===p.id)||p,'rank-avatar'),literalName(p.name,'last-result-name'));r.dataset.place=p.rank||i+1;r.classList.toggle('champion',(p.rank||i+1)===1);r.classList.toggle('wide-score',String(Math.abs(Number(team?p.teamScore:p.score))).length>6);r.append(placeNode(p.rank||i+1,'last-result-place','cup'),identity,score);return r;}));}
 }
 function showPlayerStats(p){
  $('statsName').setAttribute('data-no-translate','');
  $('statsName').replaceChildren(avatarNode(p,'profile-avatar'),literalName(p.name,'profile-name'));$('statsBody').className='profile-content';const back=el('button','quiet stats-back hp-popup-back');back.setAttribute('aria-label','Топ компании');back.onclick=showTop;$('statsDialog').querySelector('.hp-popup-actions .stats-back')?.remove();$('closeStats').hidden=true;$('statsDialog').querySelector('.hp-popup-actions').append(back);const summary=el('div','profile-summary');for(const [value,label] of [[p.played||0,'Партий'],[p.wins||0,'Побед'],[(p.played?Math.round(p.wins/p.played*100):0)+'%','Доля побед']]){const tile=el('div','');tile.append(el('strong','',String(value)),el('small','',label));tile.prepend(awardIcon(['party-veteran','cup-gold','accuracy'][summary.children.length]));summary.append(tile);}$('statsBody').replaceChildren(summary);if(p.wins>0){const awards=el('div','profile-earned');const first=awardIcon('first-win');first.title='First victory';awards.append(first);if(state.leaderboard?.[0]?.id===p.id){const mvp=awardIcon('mvp');mvp.title='Party leader';awards.append(mvp);}$('statsBody').append(awards);}
  for(const [id,s] of Object.entries(p.games||{})){const game=state.catalog.find(g=>g.id===id);if(!game)continue;const box=el('section','stat-game');const gameSummary=el('p','stat-game-summary',`${s.played||0} партий · ${s.wins||0} побед · `);gameSummary.prepend(awardIcon('personal-best'));gameSummary.append(el('span','','Лучший'),document.createTextNode(' '+Number(s.bestScore||0).toLocaleString('ru-RU')));box.append(el('h3','',game.title),gameSummary);
   const metrics=el('dl','stat-metrics');for(const [k,v] of Object.entries(s.metrics||{})){const label=metricLabels[k]||({bestPunch:'Лучший удар',punches:'Ударов',flightSeconds:'Полёт, с',finalMass:'Вес в финале',teamGoals:'Голов команды',rounds:'Раундов'}[k]);if(!label||!Number.isFinite(v)||(k==='bestPunch'&&id!=='punchmeter')||(k==='rounds'&&id!=='snakelines'))continue;const item=el('div','');item.classList.add('has-award');item.append(awardIcon(metricAwards[k]||'all-rounder'));item.append(el('dt','',label),el('dd','',Number((Math.round(v*100)/100)).toLocaleString('ru-RU')));metrics.append(item);}if(metrics.children.length)box.append(metrics);$('statsBody').append(box);}
  if(!Object.keys(p.games||{}).length)$('statsBody').append(el('p','stats-empty','После первой партии здесь появятся результаты по играм.'));
  $('statsDialog').showModal();$('statsName').tabIndex=-1;$('statsName').focus({preventScroll:true});$('statsDialog').scrollTop=0;$('statsBody').scrollTop=0;
 }
 let lastHUD='',lastUIMessage='';
 function renderHUDClock(ui,active){
  if(!active)return;
  const timed=Number.isFinite(ui.endsAt)&&['playing','countdown','reveal'].includes(ui.phase),seconds=timed?Math.max(0,Math.ceil((ui.endsAt-(Date.now()-clockOffset))/1000)):null;
  const matchId=state?.active?.id;
  const progress=matchId==='crane'?(ui.progress||'').split('·')[0].trim():ui.progress||'';
  const craneCount=matchId==='crane'&&seconds===null&&/^\d+/.test(progress);
  const liveState=craneCount?progress.match(/^\d+/)[0]:matchId==='spy'&&/роль|role/i.test(ui.progress||ui.label||'')?'Проверь роль':progress||(!/^(?:Игра|Game)$/i.test(ui.label||'')?ui.label:'')||'';
  const value=seconds===null?(ui.phase==='playing'?liveState:({paused:'Пауза',results:'Итог',reveal:'Итог',waiting:'Ждём'}[ui.phase]||'Ждём')):seconds>=60?Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'):String(seconds).padStart(2,'0');
  if($('hudValue').textContent!==value)$('hudValue').textContent=value;
  // The live Bow controller already shows remaining arrows beside its quiver.
  // Keep the shared timer, and retain progress until that local readout exists.
  let localBowArrows=false;
  if(!host&&matchId==='bow_club'&&ui.phase==='playing')try{const readout=$('gameFrame').contentDocument?.querySelector('#view:not([hidden]) #score span:last-child strong');localBowArrows=!!readout&&/^\d+$/.test(readout.textContent);}catch{}
  $('hudValue').hidden=!value;$('hudProgress').hidden=localBowArrows||!$('hudProgress').textContent||seconds===null&&value===liveState&&!craneCount;
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
  window.HeyPalsMatchResults?.update({active:active?state.active:null,selfId:profile?.id,host,busy:!!state?.busy,onReplay:instance=>{if(state?.active?.instance!==instance||state.active.ui?.phase!=='results'||state.busy)return false;return send({type:'rematch',instance});}});
  window.HeyPalsAudio?.scene(!active?'lobby':state.active.session?.paused?'pause':ui.phase==='waiting'?'matchmaking':ui.phase==='results'?'results':'game');
  renderHUDClock(ui,active);
  // The 200 ms clock tick must not rebuild avatars, SVG buttons, or measure
  // hidden title text. Only semantic room changes update the surrounding UI.
  const signature=JSON.stringify({game,active,accepted:everAccepted,profile,gameStatus,players:state?.players,testMode:state?.testMode,botCount:state?.botCount,run:state?.active&&{...state.active,ui:{...ui,endsAt:null,serverNow:0}}});
  if(force!==true&&signature===lastHUD)return;
  lastHUD=signature;
  const titleGame=state?.catalog.find(g=>g.id===state.active?.id);window.PARTY_GAME_INFO=titleGame;document.body.style.setProperty('--game-title-accent',titleGame?.color||'#c8f58b');document.body.style.setProperty('--active-game-art',titleGame?`url("/assets/games/${titleGame.id==='tankarena'?'tankarena-hd':titleGame.id}.webp?v=0.6-premium")`:'none');
  if(titleGame&&innerWidth<=850&&ui.phase==='waiting'){const title=$('waitingTitle'),measure=document.createElement('canvas').getContext('2d');measure.font='italic 800 100px '+getComputedStyle(title).fontFamily;const available=Math.max(240,innerWidth-36),width=measure.measureText(titleGame.title.toUpperCase()).width;title.style.setProperty('--mobile-title-size',Math.max(28,Math.min(92,available/width*96))+'px');const decor={push:['🥊','💥'],shrink:['🌀','⚡'],knives:['🎯','🗡️'],bomb:['💣','🔥'],western:['🤠','⭐'],tankarena:['🛡️','💥'],tanks:['🛡️','💥'],chaos:['🖱️','🌀'],kart:['🏎️','🏁'],monster:['👾','🖍️'],spy:['🕵️','🔍'],millionaire:['💎','💰'],sinyakquiz:['🎤','❓'],warsaw:['🏙️','🚋'],crocodile:['🐊','🎭'],jenga:['🪵','🧱'],crane:['🏗️','🧱'],naval:['🚢','⚓'],drawguess:['🎨','🖌️'],western_duel:['🤠','⭐'],taprace:['👟','🏁'],punchmeter:['🥊','💥'],flappy:['🐤','🪽'],hungry:['🍔','🍩'],snakelines:['🐍','⚡'],carryball:['🏉','🥅']}[titleGame.id]||['✨','⚡'];title.style.setProperty('--mobile-deco-left',JSON.stringify(decor[0]));title.style.setProperty('--mobile-deco-right',JSON.stringify(decor[1]));$('waitingRules').style.setProperty('--mobile-deco-left',JSON.stringify(decor[0]));$('waitingRules').style.setProperty('--mobile-deco-right',JSON.stringify(decor[1]));}
  document.body.classList.toggle('lobby-connected',!!everAccepted);
  let strip=$('mobileRoomStrip');if(!strip){strip=el('button','mobile-room-strip');strip.id='mobileRoomStrip';strip.type='button';strip.onclick=()=>$('companyRoomOpen').click();showStats.before(strip);}
  const online=state?.players||[];
  strip.replaceChildren(el('span','mobile-room-label',String(online.length)),...online.map((p,i)=>{const avatar=avatarNode(p,'mobile-room-avatar');avatar.title=p.name;avatar.style.setProperty('--avatar-color',['#c8f58b','#a49aff','#75ddd5','#f5b47e'][i%4]);return avatar;}));
  strip.setAttribute('aria-label',`В комнате ${online.length}. Показать всех игроков`);
  document.body.classList.toggle('in-game',active);document.body.classList.toggle('is-host',host);document.body.classList.toggle('is-player',!host);document.body.dataset.phase=ui.phase;if(ui.phase!=='paused')document.body.classList.toggle('session-active',active&&['countdown','playing','reveal','results'].includes(ui.phase));
  $('hudTimer').hidden=!active;$('sessionIdentity').hidden=!active;$('gameRules').hidden=!active;$('joinOpen').hidden=!host;$('qrDock').hidden=!host||active;$('catalogFilters').hidden=active||!everAccepted;queueQrDockLayout();
  $('testModeBox').hidden=!host||active;$('testMode').checked=!!state?.testMode;$('botCount').textContent=state?.botCount||0;$('botMinus').disabled=active||!(state?.botCount);$('botPlus').disabled=active||(state?.botCount||0)>=15||(state?.players.length||0)>=16;
  $('back').hidden=!active||!host;$('roomRules').hidden=!active;$('retryGame').hidden=!active;$('closeRoom').setAttribute('aria-label',active?'Вернуться в игру':'Вернуться');$('companyRoomOpen').hidden=!(state?.players?.length);
  $('lobbyExit').hidden=!active;$('sessionControls').hidden=!active;$('gameObjective').hidden=!active||host;const pauseVisible=active&&!!state?.active?.session?.paused;if(window.LocalPartyDialogs)LocalPartyDialogs.setVisible($('pauseOverlay'),pauseVisible);else $('pauseOverlay').hidden=!pauseVisible;
  $('liveTop').hidden=true;
  if(!active){$('waitingRules').hidden=true;document.body.classList.remove('game-waiting','session-active');return;}
  $('headerName').textContent=host?({waiting:'Собираемся',countdown:'На старт',playing:'Игра идёт',reveal:'Результат хода',results:'Матч окончен',paused:'Пауза'}[ui.phase]||'Общий экран'):profile?.name||'Игрок';$('headerGame').textContent=host?'ОБЩИЙ ЭКРАН':game.title;$('roomToggle').hidden=false;
  const hudLabel=game.id==='jenga'&&ui.phase==='playing'?'Ход':game.id==='spy'&&/роль|role/i.test(ui.label||'')?'Проверь роль':ui.label||'Время';$('hudLabel').hidden=ui.phase==='paused'||/^(?:Игра|Game)$/i.test(hudLabel);$('hudLabel').textContent=hudLabel;const fullProgress=ui.progress||ui.currentPlayer||'';$('hudProgress').textContent=game.id==='jenga'&&ui.phase==='playing'&&Number.isFinite(ui.endsAt)?'Ход':game.id==='crane'?(Number.isFinite(ui.endsAt)?fullProgress.split('·')[0].trim():'Этажей'):game.id==='bowling'&&!ui.progress?'':fullProgress;$('hudProgress').title=fullProgress;$('hudProgress').dataset.roundCount=/\d+\s*\/\s*\d+/.test(ui.progress||'')?'true':'false';
  const session=state.active.session||{},waiting=!host&&ui.phase==='waiting';$('waitingRules').hidden=!waiting;const play=$('play');if(play.dataset.waiting!==String(waiting)){play.dataset.waiting=String(waiting);requestAnimationFrame(()=>{play.scrollTop=0;document.documentElement.scrollTop=0;document.body.scrollTop=0;});}
  document.body.classList.toggle('game-waiting',waiting);
  const systemPause=session.pauseReason==='host-background';$('pauseTitle').textContent=systemPause?'Ждём iPhone-сервер':'Пауза';$('pauseHint').textContent=systemPause?'Откройте HeyPals на iPhone-сервере. Игра продолжится автоматически.':'Продолжить может любой игрок или ведущий с телефона.';$('resumeButton').hidden=systemPause;$('pauseButton').disabled=systemPause||ui.phase==='results';
  const mine=profile?.id,readyIds=session.readyIds||[],eligible=session.eligibleIds||state.active.ready||[],spectating=(session.spectatorIds||[]).includes(mine),roster=state.active.roster||state.players,own=roster.find(p=>p.id===mine),needsConnection=!own?.connected||!own?.gameReady;
  $('waitingRules').classList.toggle('needs-connection',needsConnection);
  const freshReady=new Set(readyIds.filter(id=>window.__lpLastReady&&!window.__lpLastReady.has(id)));window.__lpLastReady=new Set(readyIds);
  $('waitingRoster').replaceChildren(...roster.map(p=>{const chip=el('span','waiting-player '+(readyIds.includes(p.id)?'is-ready':!p.connected?'is-missing':p.gameReady?'is-waiting':'is-loading'),(readyIds.includes(p.id)?'✓ ':!p.connected?'○ ':p.gameReady?'… ':'↻ ')+p.name);if(p.id===mine)chip.classList.add('is-me');if(freshReady.has(p.id))chip.classList.add('just-ready');return chip;}));
  $('readyButton').textContent=readyIds.includes(mine)?'✓ Готов · отменить':'Я готов';$('readyButton').setAttribute('aria-pressed',String(readyIds.includes(mine)));$('readyButton').disabled=spectating||gameStatus!=='ready';
  $('spectateButton').textContent=spectating?'Хочу играть':'Пока смотрю';$('spectateButton').setAttribute('aria-pressed',String(spectating));
  const expected=roster.filter(p=>!p.testBot).length;
  window.PartyButtonProgress?.set($('readyButton'),readyIds.filter(id=>eligible.includes(id)).length,expected);
  window.PartyButtonProgress?.set($('exitVoteButton'),(session.exitVotes||[]).filter(id=>eligible.includes(id)).length,host?0:eligible.length);
  $('readyProgress').textContent=needsConnection?'Твой контроллер ещё не подключён. Не закрывай страницу — повторяем вход автоматически.':spectating?'Ты наблюдаешь. Можно присоединиться перед стартом.':`Готовы ${readyIds.filter(id=>eligible.includes(id)).length} из ${expected}. ${roster.some(p=>!p.testBot&&!p.connected)?'Ждём тех, кто вышел из комнаты.':expected>eligible.length?'Подключаем контроллеры.':'Когда все готовы — начнём автоматически.'}`;
  $('pauseButton').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">'+(session.paused?'<path d="m8 5 11 7-11 7Z"/>':'<path d="M8 5v14M16 5v14"/>')+'</svg><span>'+(session.paused?'Продолжить':'Пауза')+'</span>';const votedToExit=(session.exitVotes||[]).includes(mine);$('exitVoteButton').innerHTML='<svg class="hp-button-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(votedToExit&&!host?'<path d="m5 12 4 4L19 6"/>':'<path d="m11 5-7 7 7 7M4 12h16"/>')+'</svg><span class="hp-button-label"></span>';$('exitVoteButton').querySelector('span').textContent=host?'Все в лобби':votedToExit?`Выход ${session.exitVotes.length}/${eligible.length}`:'Лобби';
  const key=state.active.instance+':'+game.id;if(waitingKey!==key){waitingKey=key;const title=$('waitingTitle'),logo=el('img','waiting-game-logo');title.classList.remove('waiting-logo-loaded');logo.alt='';logo.decoding='async';logo.src='/assets/game-logos-v1/logos/'+encodeURIComponent(game.id)+'.png?v=1';logo.onload=()=>{if(logo.isConnected)title.classList.add('waiting-logo-loaded');};logo.onerror=()=>logo.remove();title.replaceChildren(el('span','waiting-game-title',game.title),logo);if(logo.complete&&logo.naturalWidth)title.classList.add('waiting-logo-loaded');$('gameObjective').replaceChildren(el('strong','objective-title',game.title),el('p','objective-copy',game.goal||game.description));const goal=el('p','waiting-goal',game.goal||game.description),details=el('details','waiting-details'),summary=el('summary','');const rulesLabel=el('span','waiting-summary-label','Rules & controls'),rulesIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');rulesIcon.setAttribute('viewBox','0 0 24 24');rulesIcon.setAttribute('aria-hidden','true');rulesIcon.classList.add('waiting-summary-icon');const chevron=document.createElementNS('http://www.w3.org/2000/svg','path');chevron.setAttribute('d','m6 9 6 6 6-6');rulesIcon.append(chevron);summary.append(rulesLabel,rulesIcon);const rulesBody=el('div','waiting-rules-body'),ruleGoal=el('div','waiting-rule-goal');ruleGoal.append(el('b','','ЦЕЛЬ'),el('p','',game.goal||game.description));rulesBody.append(ruleGoal);rulesBody.append(...[['Управление',game.controls],['Победа',game.win]].map(([label,text])=>{const d=el('div','');d.append(el('b','',label),el('p','',text||''));return d;}));details.append(summary,rulesBody);$('waitingContent').replaceChildren(goal,details);}
 }
 // Measure both layouts once, then unfold the reading surface without scaling
 // its lettering. The title/description move in the same 300ms transition.
 let waitingMorph=null;
 function toggleWaitingDetails(details){
  const next=waitingMorph?.details===details?!waitingMorph.next:!details.open;
  if(waitingMorph){cancelAnimationFrame(waitingMorph.frame);waitingMorph.animations.forEach(a=>a.cancel());waitingMorph.details.style.removeProperty('width');waitingMorph.details.style.removeProperty('height');waitingMorph.details.style.removeProperty('flex');waitingMorph.details.style.removeProperty('translate');waitingMorph=null;}
  const nodes=[...$('waitingRules').querySelectorAll('.waiting-intro>.eyebrow,.waiting-emoji-row,#waitingTitle,.waiting-goal')],before=new Map(nodes.map(n=>[n,n.getBoundingClientRect()])),from=details.getBoundingClientRect();
  details.open=next;const to=details.getBoundingClientRect();
  if(reduced||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const animations=[];
  for(const node of nodes){const prior=before.get(node),now=node.getBoundingClientRect(),dy=prior.top-now.top;if(Math.abs(dy)>.5)animations.push(node.animate([{translate:'0 '+dy+'px'},{translate:'0 0'}],{duration:300,easing:'cubic-bezier(.2,.78,.2,1)'}));}
  if(next){const body=details.querySelector('.waiting-rules-body');animations.push(body.animate([{opacity:0,translate:'0 -8px'},{opacity:1,translate:'0 0'}],{duration:240,delay:60,easing:'cubic-bezier(.2,.78,.2,1)',fill:'backwards'}));}
  const record={details,next,animations,frame:0},start=performance.now();waitingMorph=record;
  details.style.setProperty('flex','0 0 auto','important');
  const tick=now=>{
   if(waitingMorph!==record)return;
   const p=Math.min(1,(now-start)/300),ease=1-Math.pow(1-p,3);
   details.style.setProperty('width',from.width+(to.width-from.width)*ease+'px','important');
   details.style.setProperty('height',from.height+(to.height-from.height)*ease+'px','important');
   details.style.setProperty('translate','0 '+(from.top-to.top)*(1-ease)+'px');
   if(p<1)record.frame=requestAnimationFrame(tick);else{for(const property of ['width','height','flex','translate'])details.style.removeProperty(property);waitingMorph=null;}
  };tick(start);
 }
 $('waitingContent').addEventListener('click',event=>{const summary=event.target.closest('summary');if(!summary?.parentElement.matches('.waiting-details')||innerWidth>850)return;event.preventDefault();toggleWaitingDetails(summary.parentElement);});
 function renderMiniRanks(){
  const all=state?.leaderboard||[],matches=state?.totalMatches||0,leader=all[0],last=state?.lastResult;
  $('eveningStats').replaceChildren(...[[String(matches),'Партий вместе'],[String(new Set(all.flatMap(p=>Object.keys(p.games||{}))).size),'Игр попробовали'],[leader?`${Math.round(leader.wins/Math.max(1,leader.played)*100)}%`:'—','Победы лидера'],[last?state.catalog.find(g=>g.id===last.game)?.title||'—':'—','Последняя игра']].map(([value,label])=>{const d=el('div','');d.append(el('b','',value),el('small','',label));return d;}));
  const ranks=state?.leaderboard||[],places=companyPlaces(ranks),mine=ranks.findIndex(p=>p.id===profile?.id);$('myRank').textContent=host?'':mine<0?'':`#${places[mine]}`;
  $('miniLeaderboard').replaceChildren(...(ranks.length?ranks.slice(0,3).map((p,i)=>{const r=el('div','mini-rank');r.append(placeNode(places[i],'mini-place','cup'),avatarNode(p,'mini-avatar'),literalName(p.name),window.HeyPalsCoins?.amount(el('strong','mini-score'),p.coins??p.points??0));return r;}):[el('p','mini-empty','Первый раунд решит, кто окажется наверху.')]));
  $('liveTop').replaceChildren(...(ranks.length?ranks.slice(0,3).map((p,i)=>{const d=el('span','');d.className='live-top-row';d.append(placeNode(places[i],'live-top-place','cup'),literalName(p.name),window.HeyPalsCoins?.amount(el('strong','live-top-score'),p.coins??p.points??0));return d;}):[el('span','','↗ Топ компании · первая партия впереди')]));
 }
 function renderRoom(){const players=state?.players||[]; $('roomToggle').setAttribute('aria-label',`В комнате ${players.length}. Показать всех игроков`);$('roomToggle').hidden=!state;$('roomCount').textContent=players.length;$('roomAvatars').replaceChildren(...players.slice(0,3).map((p,i)=>{const n=avatarNode(p,'room-avatar-chip');n.style.setProperty('--avatar-color',['#b4ff39','#8a86ff','#62ded5'][i]);return n;}));$('roomPlayers').replaceChildren(...(players.length?players.map(p=>{const n=el('div','room-player');n.append(avatarNode(p),el('b','',p.name),el('small','',p.gameReady?'В игре':'Подключён'));return n;}):[el('p','','Компания ещё собирается.')]));}
 let lastViewedTop=[];
 function animateViewedTop(){
  const rows=[...$('statsBody').querySelectorAll('.stats-rank')],previous=lastViewedTop;
  lastViewedTop=rows.map(row=>row.dataset.id);
  if(reduced||!previous.length||!rows.length)return;
  const positions=rows.map(row=>row.offsetTop);
  rows.forEach((row,index)=>{
   const old=previous.indexOf(row.dataset.id);
   if(old<0||old===index)return;
   const delta=(positions[Math.min(old,positions.length-1)]||0)-positions[index];
   row.animate([{transform:`translateY(${delta}px)`},{transform:'translateY(0)'}],{duration:650,delay:220,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}).id='hp-rank-shift';
   if(index===0)row.animate([{filter:'brightness(1)'},{filter:'brightness(1.22)',offset:.6},{filter:'brightness(1)'}],{duration:900,delay:500});
  });
 }
 function showTop(){$('statsDialog').querySelector('.hp-popup-actions .stats-back')?.remove();$('closeStats').hidden=false;$('statsName').removeAttribute('data-no-translate');const ranks=state?.leaderboard||[],places=companyPlaces(ranks);$('statsName').textContent='Топ компании';$('statsBody').className='ranking-content';$('statsBody').replaceChildren(el('p','stats-intro','Каждая партия меняет расстановку. Нажми на игрока, чтобы увидеть его результаты.'),...(ranks.length?ranks.map((p,i)=>{const b=el('button','stats-rank');b.type='button';b.dataset.id=p.id;b.dataset.place=places[i];b.classList.toggle('is-self',p.id===profile?.id);const avatar=avatarNode(p,'stats-avatar'),identity=el('span','stats-identity'),score=el('span','stats-score'),place=placeNode(places[i],'stats-place','cup');identity.append(literalName(p.name),el('small','',`${p.wins||0} побед · ${p.played||0} партий`));if(p.id===profile?.id)identity.append(el('span','stats-you','You'));window.HeyPalsCoins?.amount(score,p.coins??p.points??0);b.append(place,avatar,identity,score);b.onclick=()=>showPlayerStats(p);return b;}):[el('p','stats-empty','Сыграйте первую партию — здесь появятся победы и рекорды.')]));$('statsName').tabIndex=-1;$('statsDialog').showModal();$('statsName').focus({preventScroll:true});$('statsDialog').scrollTop=0;$('statsBody').scrollTop=0;animateViewedTop();}
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
 // The crossfade centres at the start of the catalogue heading, keeping its text on the quiet wall.
 let heroLayoutFrame=0;
 function queueHeroBackground(){if(heroLayoutFrame)return;heroLayoutFrame=requestAnimationFrame(()=>{
  heroLayoutFrame=0;if(!heroStage||!document.body.classList.contains('is-player')||document.body.classList.contains('in-game'))return;
  const heading=$('catalogSection')?.querySelector(':scope>.section-title');if(!heading)return;
  const help=document.querySelector('.return-entry-help'),helpHeight=help?.open?help.querySelector('.return-entry-body')?.getBoundingClientRect().height||0:0;
  const height=Math.max(240,heading.getBoundingClientRect().top-heroStage.getBoundingClientRect().top-helpHeight+45);
  const value=Math.round(height)+'px';if(heroStage.style.getPropertyValue('--hero-art-height')!==value)heroStage.style.setProperty('--hero-art-height',value);
 });}
 const heroBackgroundObserver=new ResizeObserver(queueHeroBackground);
 [heroStage,$('catalogSection')].filter(Boolean).forEach(e=>heroBackgroundObserver.observe(e));
 addEventListener('resize',queueHeroBackground,{passive:true});document.fonts.ready.then(queueHeroBackground);

 if(heroStage&&!reduced){heroStage.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=heroStage.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),y=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));heroStage.style.setProperty('--art-x',(x*4).toFixed(2)+'px');heroStage.style.setProperty('--art-y',(y*3).toFixed(2)+'px');},{passive:true});heroStage.addEventListener('pointerleave',()=>{heroStage.style.setProperty('--art-x','0px');heroStage.style.setProperty('--art-y','0px');});}
 $('railTop').onclick=()=>window.scrollTo({top:0,behavior:reduced?'auto':'smooth'});
 $('goTable').onclick=()=>{filterCatalog('all');$('tableSection').scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});};
 // Parallax belongs only to the decorative landscape. Writing its variable on
 // <html> invalidated every descendant on each eased scroll frame, including
 // the entire catalogue behind an open profile sheet.
 const landscapeNodes=[...document.querySelectorAll('.party-landscape')];
 let scrollFrame=0,landscapeY=0,lastLandscapeTime=0,landscapeTargets=[];
 const landscapeBlocked=()=>document.hidden||document.body.classList.contains('profile-editing')||!!document.querySelector('dialog[open]:modal');
 const stopLandscape=()=>{if(scrollFrame)cancelAnimationFrame(scrollFrame);scrollFrame=0;lastLandscapeTime=0;};
 const updateLandscape=time=>{
  if(landscapeBlocked()||!landscapeTargets.length){stopLandscape();return;}
  const target=Math.max(0,Math.min(64,scrollY*.025)),dt=Math.min(40,time-(lastLandscapeTime||time-16));lastLandscapeTime=time;
  landscapeY+=(target-landscapeY)*(1-Math.exp(-dt/180));
  const value=landscapeY.toFixed(2)+'px';
  for(const node of landscapeTargets)if(node.isConnected&&node.style.getPropertyValue('--landscape-shift')!==value)node.style.setProperty('--landscape-shift',value);
  if(Math.abs(target-landscapeY)>.08)scrollFrame=requestAnimationFrame(updateLandscape);else{scrollFrame=0;lastLandscapeTime=0;}
 };
 window.addEventListener('scroll',()=>{
  if(reduced||scrollFrame||landscapeBlocked()||!landscapeNodes.length)return;
  landscapeTargets=landscapeNodes.filter(node=>node.isConnected&&node.getClientRects().length);
  if(landscapeTargets.length)scrollFrame=requestAnimationFrame(updateLandscape);
 },{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLandscape();});
 $('address').onchange=updateQR;$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('address').value);tell('Адрес скопирован');}catch{tell('Адрес для друзей: '+$('address').value);}};
 function saveProfileEdits(){if(!profile||avatarBusy)return false;const name=$('name').value.trim()||profile.name;const hand=document.querySelector('[name=hand]:checked').value;const avatar=pendingAvatar||null;if(name!==profile.name||hand!==profile.hand||avatar!==profile.avatar){profile={...profile,name,hand,avatar};window.PARTY_PROFILE=profile;void persist();send({type:'join',token:profile.token,name,hand,avatar});}editing=false;render();return true;}
 $('joinForm').onsubmit=e=>{e.preventDefault();if(profile&&!replaced){saveProfileEdits();return;}const data={type:'join',id:profile?.id,recoverId:recoveryId||undefined,clientId,token:profile?.token,freshIdentity:freshIdentityPending,name:$('name').value,hand:document.querySelector('[name=hand]:checked').value,avatar:pendingAvatar||null};if(replaced){removed=false;replaced=false;connect();ws.addEventListener('open',()=>send(data),{once:true});}else send(data);};
 function openProfile(){if(!document.body.classList.contains('profile-editing'))profileOpener=document.activeElement;editing=true;pendingAvatar=profile?.avatar||null;$('name').value=profile?.name||'';updateAvatarPreview();$('avatarStatus').textContent='';render();const sheet=$('onboarding');sheet.tabIndex=-1;sheet.querySelector('.profile-fields').scrollTop=0;sheet.focus({preventScroll:true});}
 $('profileCancel').onclick=()=>{if(!profile)return;editing=false;pendingAvatar=profile.avatar||null;$('name').value=profile.name||'';document.querySelector(`[name=hand][value="${profile.hand==='left'?'left':'right'}"]`).checked=true;updateAvatarPreview();render();};
 const bindProfileBackdrop=()=>window.LocalPartyDialogs?.bindBackdrop(profileBackdrop,$('onboarding'),saveProfileEdits);
 if(window.LocalPartyDialogs)bindProfileBackdrop();else document.addEventListener('DOMContentLoaded',bindProfileBackdrop,{once:true});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&editing&&document.body.classList.contains('profile-editing')&&!avatarBusy){event.preventDefault();$('profileCancel').click();}});
 $('edit').onclick=openProfile;
 let avatarBusy=false;
 $('name').addEventListener('input',updateAvatarPreview);
 $('avatarCapture').onclick=()=>$('avatarFile').click();
 $('avatarGallery').onclick=()=>$('avatarLibrary').click();
 $('avatarRemove').onclick=()=>{if(avatarBusy)return;pendingAvatar=null;$('avatarFile').value=$('avatarLibrary').value='';updateAvatarPreview();$('avatarStatus').textContent='';};
 async function selectAvatar(event){
  const input=event.currentTarget,file=input.files?.[0];if(!file||avatarBusy)return;
  avatarBusy=true;['avatarCapture','avatarGallery','avatarRemove'].forEach(id=>$(id).disabled=true);$('joinForm').querySelector('button[type="submit"]').disabled=true;
  document.querySelector('.profile-photo-field').setAttribute('aria-busy','true');$('avatarStatus').textContent='Готовим фото…';
  try{pendingAvatar=await prepareAvatar(file);updateAvatarPreview();$('avatarStatus').textContent='';if($('notice').dataset.avatarError==='true'){$('notice').hidden=true;delete $('notice').dataset.avatarError;}}
  catch(e){$('avatarStatus').textContent=e.message;tell(e.message);$('notice').dataset.avatarError='true';}
  finally{avatarBusy=false;input.value='';['avatarCapture','avatarGallery','avatarRemove'].forEach(id=>$(id).disabled=false);$('joinForm').querySelector('button[type="submit"]').disabled=ws?.readyState!==WebSocket.OPEN&&!replaced;document.querySelector('.profile-photo-field').setAttribute('aria-busy','false');if(editing&&profile&&state?.active)saveProfileEdits();}
 }
 $('avatarFile').onchange=$('avatarLibrary').onchange=selectAvatar;
 $('joinForm').addEventListener('submit',e=>{if(avatarBusy){e.preventDefault();e.stopImmediatePropagation();tell('Фото ещё готовится. Сохрани профиль через секунду.');}},{capture:true});
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
 $('resumeButton').prepend(awardIcon('comeback'));$('showStats').onclick=showTop;$('showGames').onclick=showCatalog;
 $('allRanks').onclick=showTop;$('qrDock').onclick=()=>$('joinOpen').click();for(const b of document.querySelectorAll('[data-filter]'))b.onclick=()=>{filterCatalog(b.dataset.filter);if(b.dataset.filter==='all'){requestAnimationFrame(()=>window.scrollTo({top:0,behavior:reduced?'auto':'smooth'}));}else if(window.innerWidth<900&&b.dataset.filter!=='fresh')$('catalogSection').scrollIntoView({behavior:reduced?'auto':'smooth'});};
 $('roomToggle').onclick=()=>{$('roomDialog').showModal();$('roomTitle').focus({preventScroll:true});$('roomDialog').scrollTop=0;};$('closeRoom').onclick=()=>$('roomDialog').close();$('roomRules').onclick=()=>{$('roomDialog').close();$('gameRules').click();};
 $('companyRoomOpen').onclick=()=>{$('roomDialog').showModal();$('roomTitle').focus({preventScroll:true});$('roomDialog').scrollTop=0;};
 $('joinOpen').onclick=()=>{$('dialogQr').src=$('qr').src;$('dialogAddress').textContent=$('address').value||location.origin;$('joinDialog').showModal();const title=$('joinDialog').querySelector('h2');title.tabIndex=-1;title.focus({preventScroll:true});$('joinDialog').querySelector('.dialog-body').scrollTop=0;};$('closeJoin').onclick=()=>$('joinDialog').close();$('copyDialogAddress').onclick=()=>$('copy').click();$('closeCatalog').onclick=()=>$('catalogDialog').close();
 // Give every embedded controller the space actually left between the header
 // and native menu. The session dock remains a non-shrinking flex sibling, so
 // 100dvh inside any game means its usable viewport, never the whole phone.
 let controllerFitPending=0;
 function fitControllerViewport(){
  controllerFitPending=0;if(host||!document.body.classList.contains('in-game'))return;
  const play=$('play'),frame=$('gameFrame');if(play.hidden)return;
  const viewport=window.visualViewport,viewportBottom=viewport?viewport.offsetTop+viewport.height:document.documentElement.clientHeight;
  const nativeDock=$('partyNativeDock'),dockTop=nativeDock&&!nativeDock.hidden?nativeDock.getBoundingClientRect().top:viewportBottom;
  const available=Math.max(1,Math.min(viewportBottom,dockTop)-Math.max(0,play.getBoundingClientRect().top));
  const value=Math.floor(available)+'px';for(const name of ['--controller-play-height','--native-play-height'])if(play.style.getPropertyValue(name)!==value)play.style.setProperty(name,value);
  const controls=$('sessionControls');play.style.setProperty('--controller-dock-height',Math.ceil(controls.hidden?0:controls.getBoundingClientRect().height)+'px');
  frame.contentWindow?.postMessage({type:'party-viewport',height:frame.clientHeight,width:frame.clientWidth,instance:state?.active?.instance},location.origin);
 }
 function queueControllerViewport(){if(!controllerFitPending)controllerFitPending=requestAnimationFrame(fitControllerViewport);}
 const controllerSizeObserver=new ResizeObserver(queueControllerViewport);for(const node of [document.querySelector('.app-header'),$('sessionControls'),$('gameObjective'),$('waitingRules')])if(node)controllerSizeObserver.observe(node);
 new MutationObserver(queueControllerViewport).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.visualViewport?.addEventListener('resize',queueControllerViewport,{passive:true});window.visualViewport?.addEventListener('scroll',queueControllerViewport,{passive:true});
 $('gameFrame').addEventListener('load',()=>{rosterPostedSource=null;renderHUD(true);queueControllerViewport();});window.addEventListener('resize',()=>{renderHUD(true);queueControllerViewport();});document.fonts?.ready.then(()=>{renderHUD(true);queueControllerViewport();});setInterval(renderHUD,200);
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===$('gameFrame').contentWindow&&e.data?.type==='party-visual-ready'&&e.data.instance===state?.active?.instance)$('gameFrame').dataset.loading='false';});
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==$('gameFrame').contentWindow||e.data?.type!=='party-score'||e.data.instance!==state?.active?.instance)return;liveScoreInstance=e.data.instance;const rows=Array.isArray(e.data.rows)?e.data.rows:[];$('liveTop').replaceChildren(...rows.slice(0,16).map((p,i)=>{const d=el('span','');d.append(el('b','',`${i+1}. ${p.name}`),document.createTextNode(` · ${Number(p.score)||0}`));return d;}));$('liveTop').setAttribute('aria-label',e.data.label||'Счёт игры');});
 // Decorative pressure is handled once by the shared motion.js layer.

 $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{tell('Полный экран доступен в меню браузера.');}};
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==$('gameFrame').contentWindow||e.data?.type!=='party-game-status'||e.data.instance!==state?.active?.instance||host)return;gameStatus=e.data.status;if(gameStatus==='ready')requestAnimationFrame(()=>requestAnimationFrame(()=>{if(e.data.instance===state?.active?.instance)$('gameFrame').dataset.loading='false';}));if(e.data.message)tell(e.data.message);if(ws?.readyState===WebSocket.OPEN)send({type:'game-status',status:gameStatus,instance:state?.active?.instance});render();});
 document.addEventListener('contextmenu',e=>{if(e.target.closest?.('button,.game,.player,.playbar'))e.preventDefault();});
 document.addEventListener('selectstart',e=>{if(e.target.closest?.('button,.game,.playbar'))e.preventDefault();});
 function resume(){if(replaced)return;if(state?.active&&!host){gameStatus='connecting';render();}$('gameFrame').contentWindow?.postMessage({type:'party-resume'},location.origin);clearTimeout(pongTimer);const checked=ws;const reopen=()=>{if(ws!==checked)return;const old=ws;ws=null;old?.close();connect();};if(ws?.readyState!==WebSocket.OPEN){reopen();return;}send({type:'ping'});pongTimer=setTimeout(reopen,1800);}
 window.addEventListener('party-native-resume',resume);window.addEventListener('party-native-hide',()=>{$('gameFrame').contentWindow?.postMessage({type:'party-release'},location.origin);});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)resume();});window.addEventListener('online',resume);window.addEventListener('pageshow',e=>{if(e.persisted)resume();});
 async function init(){if(!host){try{profile=JSON.parse(localStorage.getItem('local-party-profile')||'null');}catch{}const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),1800);try{const data=await(await fetch('/api/profile',{signal:abort.signal})).json();profile=data.profile||profile;}catch{}finally{clearTimeout(timeout);}window.PARTY_PROFILE=profile||{};if(profile){$('name').value=profile.name;pendingAvatar=profile.avatar||null;document.querySelector(`[name=hand][value=${profile.hand==='left'?'left':'right'}]`).checked=true;}updateAvatarPreview();}render();connect();}
 init();
})();

// Waiting copy and roster reveal scroll affordances only when content overflows.
(()=>{const nodes=['waitingContent','waitingRoster'].map(id=>document.getElementById(id)).filter(Boolean);let queued=false;function update(){queued=false;for(const n of nodes){n.dataset.scrollBefore=String(n.scrollTop>1);n.dataset.scrollAfter=String(n.scrollHeight-n.clientHeight-n.scrollTop>1);}}function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}const resize=new ResizeObserver(schedule);for(const n of nodes){resize.observe(n);n.addEventListener('scroll',schedule,{passive:true});new MutationObserver(schedule).observe(n,{childList:true,subtree:true,characterData:true});}document.getElementById('waitingRules')?.addEventListener('toggle',schedule,true);window.addEventListener('resize',schedule,{passive:true});schedule();})();
