(() => {
 'use strict';
 const prefix=document.currentScript.dataset.prefix;
 document.documentElement.dataset.partyGame=prefix.split('/').filter(Boolean).pop();
 const syncLobbyRail=()=>{document.documentElement.style.setProperty('--shared-rail-top',Math.max(170,Math.min(260,innerHeight*.21))+'px');};
 syncLobbyRail();window.addEventListener('resize',syncLobbyRail);
 const profile=window.PARTY_PROFILE=(window.parent!==window?window.parent.PARTY_PROFILE:null)||{};
 const player=!!profile.id;
 if(parent!==window)document.documentElement.classList.add('party-managed',player?'party-player':'party-host');
 document.addEventListener('DOMContentLoaded',()=>{
  // WebKit can suspend animation frames in an opacity:0 iframe. Readiness must
  // not wait on frames from the document that the parent is waiting to reveal.
  let announced=false;const reveal=()=>{if(announced)return;announced=true;parent.postMessage({type:'party-visual-ready',instance:parent.PARTY_INSTANCE},location.origin);};
  const deadline=setTimeout(reveal,350);Promise.resolve(document.fonts?.ready).then(()=>{clearTimeout(deadline);setTimeout(reveal,0);},reveal);
 });
 const nativeConnections=new Set(),ioConnections=new Set();let lastResume=0;
 const announce=(status,message='')=>{if(window.parent!==window)window.parent.postMessage({type:'party-game-status',status,message,instance:window.parent.PARTY_INSTANCE},location.origin);};
 const nativeGet=Storage.prototype.getItem,nativeSet=Storage.prototype.setItem,nativeRemove=Storage.prototype.removeItem;
 const scope=`party-game:${prefix}:${profile.id||'host'}:${window.parent.PARTY_INSTANCE||'standalone'}:`;
 Storage.prototype.getItem=function(k){return nativeGet.call(this,scope+k);};
 Storage.prototype.setItem=function(k,v){return nativeSet.call(this,scope+k,v);};
 Storage.prototype.removeItem=function(k){return nativeRemove.call(this,scope+k);};
 if(player){
  for(const k of ['lt_name','lpp_name','mc_name','spyName'])localStorage.setItem(k,profile.name);
  for(const k of ['lt_hand','lpp_hand','mc_hand','kart_hand'])localStorage.setItem(k,profile.hand||'right');
  for(const k of ['spyPlayerId','mc_playerId','kart_player_id'])localStorage.setItem(k,profile.id);
  for(const k of ['lt_token','lpp_token','mc_token'])localStorage.setItem(k,profile.token);
 }
 function credentials(payload={}){return player?{...payload,partyId:profile.id,partyToken:profile.token,party:{id:profile.id,token:profile.token},name:profile.name,handedness:profile.hand}:payload;}
 const rewrite=value=>{const u=new URL(value,location.href);if(u.host===location.host&&!u.pathname.startsWith(prefix+'/'))u.pathname=prefix+u.pathname;return u.href;};
 const NativeSocket=window.WebSocket;
 window.WebSocket=class extends NativeSocket{
  constructor(url,protocols){super(rewrite(url),protocols);const native=!String(url).includes('socket.io');if(native)nativeConnections.add(this);this.addEventListener('open',()=>{if(native)announce('connecting');});this.addEventListener('close',()=>{nativeConnections.delete(this);if(native&&![...nativeConnections].some(s=>s.readyState===1))announce('connecting');});this.addEventListener('message',event=>{
   try{const m=JSON.parse(event.data);if(['joined','resumed'].includes(m.type))announce('ready');if(['join_error','resume_error'].includes(m.type))announce('error',m.message||m.error||'Повторяем вход…');}catch{}
  });}
  send(raw){if(player&&typeof raw==='string'){try{const m=JSON.parse(raw);if(['join','resume'].includes(m.type)){if(m.data)m.data=credentials(m.data);else Object.assign(m,credentials(m));raw=JSON.stringify(m);}}catch{}}return super.send(raw);}
 };
 window.partyIO=options=>{
  const socket=window.io(options),emit=socket.emit.bind(socket);
  ioConnections.add(socket);
  socket.emit=function(event,...args){
   if(player&&['player:join','player:resume'].includes(event)){
    args[0]=credentials(args[0]||{});
    const last=args.length-1,callback=typeof args[last]==='function'?args[last]:null;
    const ack=result=>{if(result?.ok)announce('ready');else if(result?.error)announce('error',result.error);callback?.(result);};
    if(callback)args[last]=ack;else args.push(ack);
   }
   return emit(event,...args);
  };
  socket.on('connect',()=>announce('connecting'));socket.on('disconnect',()=>announce('connecting'));
  return socket;
 };
 const fetchOriginal=window.fetch.bind(window);
 window.fetch=(input,options)=>input instanceof Request?fetchOriginal(new Request(rewrite(input.url),input),options):fetchOriginal(rewrite(input),options);
 document.addEventListener('DOMContentLoaded',()=>{
  document.documentElement.classList.add(player?'party-player':'party-host');
  const editable=target=>target instanceof Element&&!!target.closest('input,textarea,[contenteditable=true]');
  for(const name of ['contextmenu','selectstart','dragstart'])document.addEventListener(name,e=>{if((player||e.target.closest?.('button,canvas,[role=button]'))&&!editable(e.target))e.preventDefault();},true);
  const presses=new Map();
  document.addEventListener('pointerdown',e=>{const b=e.target.closest?.('button,[role=button]');if(!b||b.disabled)return;presses.set(e.pointerId,b);b.classList.add('party-pressed');},{passive:true});
  const release=id=>{const b=presses.get(id);presses.delete(id);if(b&&![...presses.values()].includes(b))b.classList.remove('party-pressed');};
  for(const event of ['pointerup','pointercancel'])window.addEventListener(event,e=>release(e.pointerId),{passive:true});
  window.addEventListener('blur',()=>{for(const id of [...presses.keys()])release(id);});
  if(window.parent!==window){document.documentElement.classList.add('party-managed');applyUI(window.parent.PARTY_UI);}
  document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(!b||window.parent===window)return;if(b.id==='lobbyBtn'||/^в лобби$/i.test(b.textContent.trim())){e.preventDefault();e.stopImmediatePropagation();window.parent.postMessage({type:'party-exit',instance:window.parent.PARTY_INSTANCE},location.origin);}},true);
 });
 function resume(){if(!player||Date.now()-lastResume<600)return;lastResume=Date.now();announce('connecting');for(const s of [...nativeConnections])if(s.readyState<2)s.close(1000,'resume');for(const s of ioConnections){s.disconnect();s.connect();}}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)window.dispatchEvent(new Event('blur'));else resume();});
 window.addEventListener('pageshow',e=>{if(e.persisted)resume();});window.addEventListener('online',resume);
 function applyUI(ui){if(!ui)return;const root=document.documentElement,changed=root.dataset.partyPhase!==ui.phase;root.dataset.partyPhase=ui.phase;if(ui.phase!=='paused')root.classList.toggle('party-session-active',['countdown','playing','reveal','results'].includes(ui.phase));window.PARTY_UI=ui;if(changed){if(ui.phase==='paused')window.dispatchEvent(new Event('blur'));root.classList.remove('party-phase-enter');requestAnimationFrame(()=>{root.classList.add('party-phase-enter');clearTimeout(applyUI.timer);applyUI.timer=setTimeout(()=>root.classList.remove('party-phase-enter'),260);});window.dispatchEvent(new CustomEvent('party-phase-change',{detail:ui}));}}
 let startInstance='';
 function requestStart(instance){if(player||startInstance===instance)return;const id=prefix.split('/').at(-1),selectors={push:'button[data-mode="push"]',shrink:'button[data-mode="shrink"]',knives:'button[data-mode="knives"]',bomb:'button[data-mode="bomb"]',western:'button[data-mode="western"]',tanks:'button[data-mode="survival"]',kart:'#startBtn',spy:'#startBtn',monster:'#startGame'};let tries=0;const attempt=()=>{if(startInstance===instance)return;const b=document.querySelector(selectors[id]||'#start');if(document.readyState==='complete'&&b&&!b.disabled){startInstance=instance;b.click();return;}if(tries++<50)setTimeout(attempt,100);};attempt();}
 window.addEventListener('message',e=>{if(e.source!==window.parent||e.origin!==location.origin)return;if(e.data?.type==='party-resume')resume();if(e.data?.type==='party-release')window.dispatchEvent(new Event('blur'));if(e.data?.type==='party-ui')applyUI(e.data.ui);if(e.data?.type==='party-start')requestStart(e.data.instance);});
 if(window.parent.PARTY_TEST_BOT){window.PARTY_TEST_CONNECTIONS={native:nativeConnections,io:ioConnections};document.addEventListener('DOMContentLoaded',()=>{const script=document.createElement('script');script.src='/test-bot.js';document.head.append(script);});}
})();

document.addEventListener('DOMContentLoaded',()=>{
/* Local, accessible settings picker. The original select remains the source of truth. */
(() => {
  if (!document.documentElement.classList.contains('party-host') || document.documentElement.dataset.partyLayout==='native-v2') return;
  const enhanced = new WeakSet();
  let active = null;
  function close(focus = false) {
    if (!active) return;
    const old = active; active = null;
    old.menu.hidden = true; old.button.setAttribute('aria-expanded', 'false');
    if (focus) old.button.focus();
  }
  function enhance(select) {
    if (enhanced.has(select) || select.multiple || select.size > 1) return;
    enhanced.add(select);
    const button = document.createElement('button'), menu = document.createElement('div');
    button.type = 'button'; button.className = 'lp-select';
    button.setAttribute('aria-haspopup', 'listbox'); button.setAttribute('aria-expanded', 'false');
    menu.className = 'lp-select-menu'; menu.hidden = true; menu.setAttribute('role', 'listbox');
    menu.id = 'lp-options-' + (select.id || document.querySelectorAll('.lp-select').length);
    button.setAttribute('aria-controls', menu.id);
    const label = select.labels?.[0]?.childNodes;
    const name = select.getAttribute('aria-label') || (label ? [...label].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ') : '') || 'Настройка';
    const sync = () => {
      button.textContent = select.selectedOptions[0]?.textContent || 'Выбрать';
      button.disabled = select.disabled; button.hidden = select.hidden;
      button.setAttribute('aria-label', name + ': ' + button.textContent);
    };
    select.classList.add('lp-native-select'); select.tabIndex = -1;
    select.after(button); document.body.append(menu);
    const open = () => {
      if (button.disabled) return;
      close(); menu.replaceChildren();
      [...select.options].forEach(option => {
        if (option.hidden) return;
        const item = document.createElement('button'); item.type = 'button';
        item.textContent = option.textContent; item.disabled = option.disabled;
        item.setAttribute('role', 'option'); item.setAttribute('aria-selected', String(option.selected));
        item.onclick = () => { select.value = option.value; select.dispatchEvent(new Event('input', {bubbles:true})); select.dispatchEvent(new Event('change', {bubbles:true})); sync(); close(true); };
        menu.append(item);
      });
      const rect = button.getBoundingClientRect();
      menu.style.width = Math.min(Math.max(rect.width, 180), innerWidth - 24) + 'px';
      menu.style.left = Math.max(12, Math.min(rect.left, innerWidth - parseFloat(menu.style.width) - 12)) + 'px';
      menu.hidden = false;
      const room = innerHeight - rect.bottom - 20;
      const below = room >= Math.min(menu.scrollHeight, 220);
      menu.style.maxHeight = Math.max(96, Math.min(320, below ? room : rect.top - 20)) + 'px';
      menu.style.top = (below ? rect.bottom + 8 : Math.max(12, rect.top - menu.getBoundingClientRect().height - 8)) + 'px';
      active = {button, menu}; button.setAttribute('aria-expanded', 'true');
      (menu.querySelector('[aria-selected=true]') || menu.querySelector('button:not(:disabled)'))?.focus();
    };
    button.onclick = () => active?.button === button ? close() : open();
    button.onkeydown = e => { if (['ArrowDown','ArrowUp'].includes(e.key)) {e.preventDefault();open();} };
    menu.onkeydown = e => {
      const items = [...menu.querySelectorAll('button:not(:disabled)')], index = items.indexOf(document.activeElement);
      if (['ArrowDown','ArrowUp','Home','End'].includes(e.key)) {
        e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items[next]?.focus();
      }
      if (e.key === 'Escape') {e.preventDefault();close(true);}
      if (e.key === 'Tab') close();
    };
    select.addEventListener('change', sync);
    new MutationObserver(sync).observe(select, {attributes:true, childList:true, subtree:true});
    sync();
  }
  document.querySelectorAll('select').forEach(enhance);
  document.addEventListener('pointerdown', e => { if (active && !active.menu.contains(e.target) && !active.button.contains(e.target)) close(); });
  window.addEventListener('resize', () => close());
  document.addEventListener('scroll', e => {if (active && !active.menu.contains(e.target)) close();}, true);
})();

});

/* Rules belong to the lobby card; every engine keeps its own controls. */
document.addEventListener('DOMContentLoaded',()=>{
 if(!document.documentElement.classList.contains('party-host')||document.documentElement.dataset.partyLayout==='native-v2')return;
 const info=parent.PARTY_GAME_INFO;if(!info)return;
 document.documentElement.style.setProperty('--lobby-accent',info.color||'#c8f58b');
 document.documentElement.style.setProperty('--lobby-secondary',info.secondaryColor||info.color||'#c8f58b');
 document.documentElement.style.setProperty('--lobby-art',`url("/assets/games/${info.id==='tankarena'?'tankarena-hd':info.id}.webp?v=0.6-premium")`);
 if(document.documentElement.dataset.partyGame==='western_duel'){
  const main=document.querySelector('main'),side=document.createElement('aside');side.className='lp-duel-sidebar';
  main.append(side);for(const element of main.querySelectorAll(':scope>#notice,:scope>.glass,:scope>#board,:scope>#start,:scope>details'))side.append(element);
 }
 const start=document.querySelector('#startGame,#startBtn,#start');
 const card=document.querySelector('#lobbyOverlay .left-panel,#lobbyOverlay .modes-card,.setup-card,.lobbyPanel,#lobbyStage') || (document.documentElement.dataset.partyGame==='crane'?document.querySelector('aside'):null) || start?.closest('aside,.panel,.card,section,main');
 if(!card)return;
 document.querySelectorAll('details').forEach(detail=>{if(/правила|как играть/i.test(detail.querySelector('summary')?.textContent||''))detail.hidden=true;});
 card.classList.add('lp-start-card');
 const rules=document.createElement('details');rules.className='lp-lobby-rules';
 const summary=document.createElement('summary');summary.textContent='Правила и управление';rules.append(summary);
 for(const value of [info.goal,info.controls,info.win]){if(!value)continue;const p=document.createElement('p');p.textContent=Array.isArray(value)?value.join(' · '):value;rules.append(p);}
 const heading=card.querySelector('h1,h2');
 let headingRow=heading;while(headingRow&&headingRow.parentElement!==card)headingRow=headingRow.parentElement;
 if(headingRow&&!card.classList.contains('lp-duel-sidebar'))headingRow.after(rules);else card.prepend(rules);
 if(document.documentElement.dataset.partyGame==='spy'&&start)card.append(start);
});


/* Shared numeric fitting for narrow controller displays. */
if(document.documentElement.dataset.partyLayout!=="native-v2"){const fitScript=document.createElement("script");fitScript.src="/value-fit.js";(document.head||document.documentElement).append(fitScript);}
