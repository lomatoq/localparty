/* Native discovery chooses the destination by ID; no URL or admin command is sent. */
(() => {
 'use strict';
 if(window!==window.top || !window.webkit?.messageHandlers?.partyShell || window.LocalPartyRooms)return;
 const style=document.createElement('style');style.textContent=`
 body.native-controller.has-nearby-rooms #brandHeader>.identity,body.native-controller.has-nearby-rooms #brandHeader :is(#roomToggle,#showStats){visibility:hidden}
 #nearbyToggle{position:fixed;top:calc(env(safe-area-inset-top) + 8px);left:8px;z-index:75;min-height:44px;width:92px;max-width:calc(50vw - 68px);padding:6px!important;font-size:12px!important;line-height:1.15;overflow-wrap:anywhere;border-radius:22px}
 html body.native-controller #nearbyDialog{padding:20px!important;width:calc(100% - 24px);max-width:460px;inset:env(safe-area-inset-top) 0 var(--native-tab-reserve,calc(56px + env(safe-area-inset-bottom)));height:fit-content;margin:auto;max-height:calc(100dvh - env(safe-area-inset-top) - var(--native-tab-reserve,calc(56px + env(safe-area-inset-bottom))) - 24px);box-sizing:border-box;overflow:auto;background:linear-gradient(145deg,#302a40,#211d30)!important}
 #nearbyDialog[open]{display:flex;flex-direction:column;overflow:hidden}
 #nearbyDialog>:not(#nearbyList){flex-shrink:0}
 #nearbyDialog h2{font-size:24px;text-align:center;margin:0 0 8px}
 #nearbyDialog>p{font-size:14px;text-align:center;margin:0 0 16px}
 #nearbyList{display:grid;gap:10px;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:none}
 #nearbyList::-webkit-scrollbar{display:none}
 #nearbyDialog .nearby-room{display:grid;grid-template-columns:minmax(0,1fr) max-content;gap:12px;align-items:center!important;padding:12px;border:1px solid #ffffff25;border-radius:22px;background:#ffffff06}
 #nearbyDialog .nearby-room>div{min-width:0;max-width:100%;white-space:normal}.nearby-room b,.nearby-room small{display:block;overflow-wrap:anywhere;white-space:normal}
 .nearby-room b{font-size:16px}.nearby-room small{font-size:13px;opacity:.75;margin-top:5px}
 #nearbyDialog .nearby-room button{display:flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;box-sizing:border-box;width:max-content;min-width:76px;max-width:112px;height:48px;min-height:48px;font-size:14px!important;line-height:1.2!important;padding:8px 12px!important;margin:0!important;text-align:center;white-space:nowrap}
 #nearbyDialog>.ready-actions{margin:24px 0 0!important;gap:12px}
 #nearbyClose{width:100%;margin-top:16px;min-height:48px}
 `;document.head.append(style);
 const sheetStyle=document.createElement('link');sheetStyle.rel='stylesheet';sheetStyle.href='/rooms-inline172.css';document.head.append(sheetStyle);
 const toggle=document.createElement('button');toggle.id='nearbyToggle';toggle.className='quiet';toggle.hidden=false;toggle.type='button';toggle.setAttribute('aria-label','Games on this Wi-Fi');
 const dialog=document.createElement('dialog');dialog.id='nearbyDialog';dialog.classList.add('ux-sheet');dialog.setAttribute('aria-labelledby','nearbyTitle');dialog.setAttribute('aria-describedby','nearbyHint');
 const title=document.createElement('h2');title.id='nearbyTitle';title.textContent='GAMES ON WI-FI';
 const hint=document.createElement('p');hint.id='nearbyHint';hint.textContent='Choose a room for your controller. Your own room stays available.';
 const list=document.createElement('div');list.id='nearbyList';
 const close=document.createElement('button');close.id='nearbyClose';close.className='quiet hp-popup-back';close.setAttribute('aria-label','Close');close.type='button';close.onclick=()=>dialog.close();
 const utilities=document.createElement('div');utilities.className='ready-actions';
 for(const [id,label] of [['roomToggle','Players'],['showStats','Rankings']]){const button=document.createElement('button');button.type='button';button.className='quiet';button.textContent=label;button.hidden=!document.getElementById(id);button.onclick=async()=>{dialog.close();await window.LocalPartyDialogs?.whenClosed(dialog);document.getElementById(id)?.click();};utilities.append(button);}
 const footer=document.createElement('div');footer.className='nearby-footer';footer.append(utilities,close);dialog.append(title,hint,list,footer);document.body.append(toggle,dialog);
 const paintNetworkIcon=()=>{if(!window.PartyIcons||toggle.querySelector('svg'))return;toggle.replaceChildren(window.PartyIcons.create('share'));};
 paintNetworkIcon();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',paintNetworkIcon,{once:true});
 const accessStyle=document.createElement('style');accessStyle.textContent=`html.hp-ui body:is(.native-controller,.native-shell) #nearbyDialog[open]{background:var(--hp-matte-panel)!important}html.hp-ui body #nearbyDialog::backdrop{background:#0b07154d;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)} html body #nearbyToggle{display:grid!important;place-items:center;box-sizing:border-box;top:calc(env(safe-area-inset-top) + 8px);left:8px;width:44px!important;min-width:44px;max-width:44px;height:44px!important;min-height:44px;padding:11px!important;border-radius:50%!important;border:1px solid #cbb5ff66!important;background:linear-gradient(145deg,#41364f,#231a33)!important;color:#eee4ff;box-shadow:0 0 12px #a772f326!important}html body #nearbyToggle svg{width:14px!important;height:14px!important;min-width:14px;min-height:14px;fill:currentColor}html body.native-shell #nearbyDialog{max-width:460px;width:calc(100% - 24px);box-sizing:border-box;padding:20px!important} `;document.head.append(accessStyle);
 toggle.onclick=()=>{paintNetworkIcon();if(!dialog.open||dialog.classList.contains('lp-dialog-closing'))dialog.showModal();};
 const tabs=document.createElement('div');tabs.className='rooms-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Room connection');
 const wifiTab=document.createElement('button'),codeTab=document.createElement('button');
 let onlineService=null,onlineBusy=false,onlineEpoch=0;
 const codePanel=document.createElement('form');codePanel.id='roomsCodePanel';codePanel.hidden=true;codePanel.className='rooms-code-panel';codePanel.setAttribute('role','tabpanel');codePanel.setAttribute('data-hp-input-group','');
 const ownOnline=document.createElement('section');ownOnline.className='rooms-own-online';
 const ownLabel=document.createElement('p');ownLabel.textContent='Your online room';
 const ownCode=document.createElement('output');ownCode.className='rooms-own-code';ownCode.textContent='Not created';
 const createOnline=document.createElement('button');createOnline.type='button';createOnline.className='quiet';createOnline.textContent='Create room';createOnline.disabled=true;
 const copyOnline=document.createElement('button');copyOnline.type='button';copyOnline.className='quiet';copyOnline.textContent='Copy code';copyOnline.hidden=true;
 ownOnline.append(ownLabel,ownCode,createOnline,copyOnline);
 copyOnline.onclick=async()=>{try{await navigator.clipboard.writeText(ownCode.value);codeStatus.textContent='Code copied';}catch{codeStatus.textContent='Room code: '+ownCode.value;}};
 createOnline.onclick=async()=>{if(!onlineService||onlineBusy)return;onlineBusy=true;createOnline.disabled=true;submit.disabled=true;const epoch=++onlineEpoch;codeStatus.textContent='Creating room…';try{const room=await onlineService.create();if(epoch!==onlineEpoch)return;if(!/^\d{6}$/.test(room?.code))throw new Error('Invalid room response');ownCode.value=room.code;copyOnline.hidden=false;codeStatus.textContent='Share this code with your friends';}catch{if(epoch===onlineEpoch)codeStatus.textContent='Could not create room. Try again.';}finally{if(epoch===onlineEpoch){onlineBusy=false;createOnline.disabled=!onlineService;validate();}}};
 const codeLabel=document.createElement('p');codeLabel.textContent='Enter the 6-digit room code';
 const cells=document.createElement('div');cells.className='rooms-code-cells';
 const submit=document.createElement('button');submit.type='submit';submit.className='primary hp-energy-action';submit.textContent='Connect';submit.disabled=true;submit.setAttribute('data-hp-input-action','');
 const codeStatus=document.createElement('p');codeStatus.className='rooms-code-status';codeStatus.setAttribute('role','status');codeStatus.textContent='Internet rooms are not connected yet.';
 const inputs=[];
 const validate=()=>{submit.disabled=onlineBusy||!inputs.every(input=>/^\d$/.test(input.value));};
 for(let i=0;i<6;i++){const input=document.createElement('input');input.type='text';input.setAttribute('data-room-digit','');input.inputMode='numeric';input.enterKeyHint=i===5?'done':'next';input.maxLength=1;input.autocomplete=i===0?'one-time-code':'off';input.setAttribute('aria-label','Code digit '+(i+1));
  input.addEventListener('focus',()=>input.select());
  input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(-1);if(input.value)inputs[i+1]?.focus();validate();});
  input.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!input.value&&i){e.preventDefault();inputs[i-1].value='';inputs[i-1].focus();validate();}if(e.key==='ArrowLeft')inputs[i-1]?.focus();if(e.key==='ArrowRight')inputs[i+1]?.focus();});
  input.addEventListener('paste',e=>{e.preventDefault();const digits=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);const start=digits.length===6?0:i;for(let j=0;j<digits.length&&start+j<6;j++)inputs[start+j].value=digits[j];inputs[Math.min(5,start+digits.length)]?.focus();validate();});
  inputs.push(input);cells.append(input);
 }
 codePanel.append(ownOnline,codeLabel,cells,submit,codeStatus);
 codePanel.onsubmit=async e=>{e.preventDefault();if(onlineBusy)return;if(!onlineService){codeStatus.textContent='Online rooms will be available when the internet service is connected.';return;}const code=inputs.map(n=>n.value).join('');if(!/^\d{6}$/.test(code))return;onlineBusy=true;submit.disabled=true;createOnline.disabled=true;const epoch=++onlineEpoch;codeStatus.textContent='Connecting…';try{await onlineService.join(code);if(epoch!==onlineEpoch)return;codeStatus.textContent='Connected';dialog.close();}catch(error){if(epoch===onlineEpoch)codeStatus.textContent=error?.code==='ROOM_NOT_FOUND'?'Room not found or code expired.':error?.code==='ROOM_FULL'?'This room is full.':'Could not connect. Try again.';}finally{if(epoch===onlineEpoch){onlineBusy=false;createOnline.disabled=!onlineService;validate();}}};
 const choose=online=>{const focused=document.activeElement;if((online?list:codePanel).contains(focused))focused.blur();wifiTab.setAttribute('aria-selected',String(!online));codeTab.setAttribute('aria-selected',String(online));list.hidden=online;hint.hidden=online;utilities.hidden=online;codePanel.hidden=!online;};
 for(const [button,label,online] of [[wifiTab,'Nearby',false],[codeTab,'By code',true]]){button.type='button';button.className='quiet';button.textContent=label;button.setAttribute('role','tab');button.setAttribute('aria-selected',String(!online));button.onclick=()=>choose(online);tabs.append(button);}
 title.textContent='ROOMS';title.after(tabs);list.after(codePanel);
 // Room controls share the existing sheet and type system, with one compact
 // group per task. Inner padding reserves space for focus rings and CTA bloom.
 const codeStyle=document.createElement('style');codeStyle.textContent=`
 html.hp-ui body #nearbyDialog{gap:0!important}
 html.hp-ui body #nearbyDialog h2{margin:2px 0 16px!important}
 html.hp-ui body #nearbyDialog .rooms-tabs{display:flex;gap:8px;margin:0 0 20px}
 html.hp-ui body #nearbyDialog .rooms-tabs button{flex:1;min-width:0;height:44px;min-height:44px;padding:0 12px!important;font:italic 900 16px/1 var(--hp-font-action)!important}
 html.hp-ui body #nearbyDialog .rooms-tabs [aria-selected=true]{color:#d6ff9b;border-color:#bdf57588;background:#a4d76318}
 html.hp-ui body #nearbyDialog form.rooms-code-panel{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0!important;text-align:center;padding:0 12px 12px!important;box-sizing:border-box;min-width:0;width:100%;overflow:auto;flex-shrink:1!important;scrollbar-width:none}
 html.hp-ui body #nearbyDialog .rooms-code-panel::-webkit-scrollbar{display:none}
 html.hp-ui body #nearbyDialog .rooms-code-panel>p{width:auto!important;margin:0!important;white-space:normal;font:italic 400 15px/1.4 var(--hp-font-copy)!important;color:#d6c7e8}
 html.hp-ui body #nearbyDialog .rooms-code-panel[hidden]{display:none!important}
 html.hp-ui body #nearbyDialog .rooms-code-cells{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;margin:14px 0 22px;padding:3px 0}
 html.hp-ui body #nearbyDialog .rooms-code-cells input{display:block;width:100%;min-width:0;max-width:none;height:52px;min-height:52px;padding:0!important;text-align:center!important;text-indent:0!important;letter-spacing:0!important;font:italic 900 24px/normal var(--hp-font-action)!important;box-sizing:border-box;border-radius:15px;border:1px solid #bba0ef66!important;background:linear-gradient(100deg,#30243f,#181122)!important;background-clip:border-box!important;-webkit-background-clip:border-box!important;color:#f2e7ff!important;-webkit-text-fill-color:#f2e7ff!important;caret-color:#caff83;box-shadow:none!important}
 html.hp-ui body #nearbyDialog .rooms-code-cells input:focus{outline:2px solid #c7ff82;outline-offset:2px}
 html.hp-ui body #nearbyDialog .rooms-code-panel>.primary{width:100%;height:48px;min-height:48px;flex:none;margin:0!important;font:italic 900 18px/1 var(--hp-font-action)!important}
 html.hp-ui body #nearbyDialog .rooms-own-online{margin:0 0 24px;padding:14px 12px;border-radius:24px;background:radial-gradient(ellipse at 0 0,#cb75ee14,transparent 72%),linear-gradient(135deg,#ac79d50c,transparent);display:grid;justify-items:center;gap:8px}
 html.hp-ui body #nearbyDialog .rooms-own-online p{margin:0;font:italic 400 14px/1.4 var(--hp-font-copy);color:#d3c3e3}
 html.hp-ui body #nearbyDialog .rooms-own-code{display:block;font:italic 900 22px/1.25 var(--hp-font-action);letter-spacing:.02em;color:#d8ffb0;margin:0}
 html.hp-ui body #nearbyDialog .rooms-own-online button{height:44px;min-height:44px;margin:0!important;padding:0 20px!important;font:italic 900 15px/1 var(--hp-font-action)!important}
 html.hp-ui body #nearbyDialog .rooms-code-panel .rooms-code-status{margin:12px 0 0!important;font-size:13px!important;color:#c7b4d9;line-height:1.4;min-height:18px}
 html.hp-ui body #nearbyDialog .nearby-footer{margin-top:8px!important}
 html.hp-ui body #nearbyDialog .nearby-footer:has(.ready-actions[hidden]){display:flex;justify-content:center}
 html.hp-ui body #nearbyDialog .nearby-footer:has(.ready-actions[hidden]) #nearbyClose{width:48px!important;height:48px!important;min-width:48px!important;max-width:48px!important;justify-self:center;margin:0!important}
 html.hp-ui body #nearbyDialog [hidden]{display:none!important}
 @media(max-width:350px){html.hp-ui body #nearbyDialog form.rooms-code-panel{padding-inline:8px!important}html.hp-ui body #nearbyDialog .rooms-code-cells{gap:6px}html.hp-ui body #nearbyDialog .rooms-code-cells input{height:48px;min-height:48px;font-size:22px!important}}
 `;document.head.append(codeStyle);

 const updateFade=()=>{list.dataset.before=String(list.scrollTop>1);list.dataset.after=String(list.scrollHeight-list.clientHeight-list.scrollTop>1);};
 list.addEventListener('scroll',updateFade,{passive:true});new ResizeObserver(updateFade).observe(list);dialog.addEventListener('toggle',updateFade);
 let last='',pending=null,saveTimer=null;
 const roomLabels=new WeakMap();
 const roomText=(node,value)=>{const text=String(value??'');if(roomLabels.get(node)===text)return;roomLabels.set(node,text);node.textContent=text;};
 function expand(row,open){
  const trigger=row.querySelector('.nearby-rename-toggle'),panel=row.querySelector('.nearby-rename');
  const input=row.querySelector('input');
  if(!open&&panel.contains(document.activeElement))document.activeElement.blur();
  trigger.setAttribute('aria-expanded',String(open));panel.inert=!open;panel.setAttribute('aria-hidden',String(!open));row.classList.toggle('renaming',open);
  // Focus remains in the trusted tap. Visibility is reconciled as both the
  // disclosure and the real keyboard resize their respective scroll areas.
  if(open){input.focus({preventScroll:true});window.PartyInputViewport?.ensureVisible(input);}
 }
 function addEditor(row){
  const trigger=document.createElement('button');trigger.type='button';trigger.className='quiet nearby-rename-toggle';trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','nearbyRename');trigger.setAttribute('aria-label','Edit room name');trigger.innerHTML='<span class="nearby-rename-disc" aria-hidden="true"><span class="nearby-rename-icon"></span></span>';
  const label=document.createElement('span');label.className='nearby-own-label';label.textContent='Your room';row.querySelector('.nearby-copy').prepend(label);
  const actions=document.createElement('div');actions.className='nearby-own-actions';const join=row.querySelector('.nearby-join');join.before(actions);actions.append(join,trigger);
  const panel=document.createElement('div');panel.id='nearbyRename';panel.className='nearby-rename';panel.inert=true;panel.setAttribute('aria-hidden','true');
  const inner=document.createElement('div');inner.className='nearby-rename-inner';
  const form=document.createElement('form');form.className='nearby-rename-form';form.setAttribute('data-hp-input-group','');
  const input=document.createElement('input');input.id='nearbyRoomName';input.name='roomName';input.type='text';input.maxLength=48;input.required=true;input.autocomplete='off';input.enterKeyHint='done';input.setAttribute('aria-label','Room name');input.className='nearby-name-input';
  const save=document.createElement('button');save.type='submit';save.className='primary nearby-rename-save';save.setAttribute('aria-label','Save room name');save.setAttribute('data-hp-input-action','');save.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const status=document.createElement('p');status.className='nearby-rename-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  form.append(input,save);inner.append(form,status);panel.append(inner);row.append(panel);
  trigger.onclick=()=>expand(row,trigger.getAttribute('aria-expanded')!=='true');
  input.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();expand(row,false);trigger.focus();}});
  form.onsubmit=e=>{e.preventDefault();const name=input.value.trim().replace(/\s+/g,' ');if(!name){input.focus();return;}if(pending)return;pending=row;save.disabled=true;status.textContent='Saving…';
   window.webkit.messageHandlers.partyShell.postMessage({type:'rename-room',name});
   saveTimer=setTimeout(()=>{if(pending!==row)return;pending=null;save.disabled=false;status.textContent='Could not save. Try again.';},5000);
  };
 }

 window.LocalPartyRooms=Object.freeze({configureOnline(service){
  ++onlineEpoch;onlineBusy=false;onlineService=service&&typeof service.create==='function'&&typeof service.join==='function'?service:null;
  createOnline.disabled=!onlineService;ownCode.value='Not created';copyOnline.hidden=true;codeStatus.textContent=onlineService?'Create a room or enter a friend’s code.':'Internet rooms are not connected yet.';validate();
 },renamed(name){
  if(!pending)return;const row=pending;pending=null;clearTimeout(saveTimer);row.querySelector('.nearby-rename-save').disabled=false;
  if(typeof name!=='string'||!name){row.querySelector('.nearby-rename-status').textContent='Use 1–48 characters.';return;}
  row.querySelector('b').textContent=name;row.querySelector('input').value=name;row.querySelector('input').dispatchEvent(new Event('input'));row.querySelector('.nearby-rename-status').textContent='Saved';expand(row,false);row.querySelector('.nearby-rename-toggle').focus({preventScroll:true});
 },update(rooms,selected){
  if(!Array.isArray(rooms))return;
  const available=true;
  toggle.hidden=!available;document.body.classList.toggle('has-nearby-rooms',available);
  const remote=rooms.filter(r=>r.id!=='own'),playing=remote.filter(r=>r.game);
  const title='Games on Wi-Fi · '+rooms.length;if(toggle.dataset.roomTitle!==title){toggle.dataset.roomTitle=title;toggle.title=title;}paintNetworkIcon();
  const key=JSON.stringify([rooms,selected]);if(key===last)return;last=key;
  // Patch stable rows so periodic discovery cannot steal keyboard focus.
  const ids=new Set(rooms.map(r=>r.id));
  const missing=selected!=='own'&&!ids.has(selected),empty=!rooms.length&&!missing;
  for(const row of [...list.children])if(row.dataset.room==='notice'?!missing&&!empty:!ids.has(row.dataset.room))row.remove();
  if(missing||empty){let notice=list.querySelector('[data-room=notice]');if(!notice){notice=document.createElement('p');notice.dataset.room='notice';notice.className='nearby-notice';notice.setAttribute('role','status');list.prepend(notice);}roomText(notice,missing?'Host is no longer nearby. Return to your room or wait for reconnection.':'No rooms nearby yet. Keep both phones on the same Wi-Fi.');}
  for(const room of rooms){
   let row=[...list.children].find(n=>n.dataset.room===room.id);
   if(!row){row=document.createElement('div');row.className='nearby-room';row.dataset.room=room.id;const copy=document.createElement('div');copy.className='nearby-copy';copy.append(document.createElement('b'),document.createElement('small'));const button=document.createElement('button');button.type='button';button.className='nearby-join';button.onclick=()=>{window.webkit.messageHandlers.partyShell.postMessage({type:'join-room',id:room.id});dialog.close();};row.append(copy,button);if(room.id==='own')addEditor(row);list.append(row);}
   const current=String(room.id===selected);if(row.dataset.current!==current)row.dataset.current=current;roomText(row.querySelector('b'),room.name);const input=row.querySelector('input');if(input&&!row.classList.contains('renaming')&&pending!==row&&input.value!==room.name){input.value=room.name;input.dispatchEvent(new Event('input'));}let hue=0;for(const c of room.id)hue=(hue*31+c.charCodeAt(0))%50;const hueText=String(265+hue);if(row.style.getPropertyValue('--room-hue')!==hueText)row.style.setProperty('--room-hue',hueText);
   const meta=row.querySelector('small');let game=meta.querySelector('.nearby-game'),count=meta.querySelector('.nearby-count');if(!game||!count){game=document.createElement('span');game.className='nearby-game';count=document.createElement('span');count.className='nearby-count';meta.replaceChildren(game,count);}roomText(game,(room.game||'Lobby')+(room.phase==='waiting'?' · Getting ready':room.phase==='results'?' · Results':''));roomText(count,room.players);if(count.dataset.roomPlayers!==String(room.players)){count.dataset.roomPlayers=String(room.players);count.setAttribute('aria-label',room.players+' players');}
   const button=row.querySelector('.nearby-join'),disabled=room.id===selected,buttonClass='nearby-join '+(disabled?'quiet':'primary');if(button.disabled!==disabled)button.disabled=disabled;if(button.className!==buttonClass)button.className=buttonClass;roomText(button,disabled?'Connected':room.id==='own'?'Return':'Join');
  }
  const own=list.querySelector('[data-room=own]');if(own&&list.firstElementChild!==own)list.prepend(own);
  updateFade();
 }});
 // Tell Swift to deliver again if the asynchronous script arrived after didFinish.
 window.webkit.messageHandlers.partyShell.postMessage({type:'rooms-ready'});
})();
