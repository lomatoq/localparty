/* Native discovery chooses the destination by ID; no URL or admin command is sent. */
(() => {
 'use strict';
 if(window!==window.top || !window.LocalPartyNative || !window.webkit?.messageHandlers?.partyShell)return;
 const style=document.createElement('style');style.textContent=`
 body.has-nearby-rooms #brandHeader>.identity,body.has-nearby-rooms #brandHeader :is(#roomToggle,#showStats){visibility:hidden}
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
 const toggle=document.createElement('button');toggle.id='nearbyToggle';toggle.className='quiet';toggle.hidden=true;toggle.type='button';toggle.setAttribute('aria-label','Games on this Wi-Fi');
 const dialog=document.createElement('dialog');dialog.id='nearbyDialog';
 const title=document.createElement('h2');title.textContent='GAMES ON WI-FI';
 const hint=document.createElement('p');hint.textContent='Choose a room for your controller. Your own room stays available.';
 const list=document.createElement('div');list.id='nearbyList';
 const close=document.createElement('button');close.id='nearbyClose';close.className='quiet';close.textContent='Close';close.type='button';close.onclick=()=>dialog.close();
 const utilities=document.createElement('div');utilities.className='ready-actions';
 for(const [id,label] of [['roomToggle','Players'],['showStats','Rankings']]){const button=document.createElement('button');button.type='button';button.className='quiet';button.textContent=label;button.onclick=()=>{dialog.close();document.getElementById(id)?.click();};utilities.append(button);}
 dialog.append(title,hint,list,utilities,close);document.body.append(toggle,dialog);
 toggle.onclick=()=>dialog.showModal();
 let last='';
 window.LocalPartyRooms=Object.freeze({update(rooms,selected){
  if(!Array.isArray(rooms))return;
  const available=rooms.length>1||selected!=='own';
  toggle.hidden=!available;document.body.classList.toggle('has-nearby-rooms',available);
  const remote=rooms.filter(r=>r.id!=='own'),playing=remote.filter(r=>r.game);
  toggle.textContent=selected!=='own'?'Rooms · '+rooms.length:playing.length===1?'Join game':'Rooms · '+rooms.length;
  const key=JSON.stringify([rooms,selected]);if(key===last)return;last=key;
  // Patch stable rows so periodic discovery cannot steal keyboard focus.
  const ids=new Set(rooms.map(r=>r.id));
  if(selected!=='own'&&!ids.has(selected)){const lost=document.createElement('p');lost.dataset.room='lost';lost.textContent='Host is no longer nearby. Return to your room or wait for reconnection.';list.replaceChildren(lost);}
  else for(const row of [...list.children])if(!ids.has(row.dataset.room))row.remove();
  for(const room of rooms){
   let row=[...list.children].find(n=>n.dataset.room===room.id);
   if(!row){row=document.createElement('div');row.className='nearby-room';row.dataset.room=room.id;const copy=document.createElement('div');copy.append(document.createElement('b'),document.createElement('small'));const button=document.createElement('button');button.type='button';button.onclick=()=>{window.webkit.messageHandlers.partyShell.postMessage({type:'join-room',id:room.id});dialog.close();};row.append(copy,button);list.append(row);}
   row.querySelector('b').textContent=room.id==='own'?'Your room':room.name;
   row.querySelector('small').textContent=(room.game||'Lobby')+' · '+room.players+' players'+(room.phase==='waiting'?' · Getting ready':room.phase==='results'?' · Results':'');
   const button=row.querySelector('button');button.disabled=room.id===selected;button.className=room.id===selected?'quiet':'primary';button.textContent=room.id===selected?'Connected':room.id==='own'?'Return':'Join';
  }
 }});
 // Tell Swift to deliver again if the asynchronous script arrived after didFinish.
 window.webkit.messageHandlers.partyShell.postMessage({type:'rooms-ready'});
})();
