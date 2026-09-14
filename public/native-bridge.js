/* Native engines share identity/transport, not legacy DOM rewriting or typography. */
(() => {
 'use strict';
 const prefix=document.currentScript.dataset.prefix,root=document.documentElement,embedded=parent!==window;
 let profile={};try{profile=embedded?{...parent.PARTY_PROFILE}:{};}catch{}
 window.PARTY_PROFILE=profile;
 const player=!!profile.id,instance=embedded?parent.PARTY_INSTANCE:null;
 root.dataset.partyGame=prefix.split('/').filter(Boolean).at(-1);
 root.classList.add(player?'party-player':'party-host');if(embedded)root.classList.add('party-managed');
 function post(type,data={}){if(embedded)parent.postMessage({type,instance,...data},location.origin);}
 const connections=new Set();
 const status=(value,message='')=>post('party-game-status',{status:value,message});
 function rewrite(value){const url=new URL(value,document.baseURI);if(url.host===location.host&&url.pathname!=='/assets'&&!url.pathname.startsWith('/assets/')&&!url.pathname.startsWith(prefix+'/'))url.pathname=prefix+(url.pathname.startsWith('/')?url.pathname:'/'+url.pathname);return url.href;}
 const Socket=window.WebSocket;
 window.WebSocket=class extends Socket {
  constructor(url,protocols){super(rewrite(url),protocols);connections.add(this);this.partyJoined=false;
   this.addEventListener('message',event=>{let m;try{m=JSON.parse(event.data);}catch{return;}
    if(['joined','resumed'].includes(m.type)){this.partyJoined=true;status('ready');}
    if(['join_error','resume_error'].includes(m.type))status('error',m.data?.message||m.message||'Не удалось подключить контроллер');
   });
   this.addEventListener('close',()=>{connections.delete(this);if(player&&![...connections].some(s=>s.readyState===1&&s.partyJoined))status('connecting');});
  }
  send(raw){if(player&&typeof raw==='string'){try{const m=JSON.parse(raw);if(['join','resume'].includes(m.type)){m.data={...(m.data||{}),name:profile.name,partyId:profile.id,partyToken:profile.token,party:{id:profile.id,token:profile.token}};raw=JSON.stringify(m);}}catch{}}return super.send(raw);}
 };
 const nativeFetch=window.fetch.bind(window);
 window.fetch=(input,options)=>input instanceof Request?nativeFetch(new Request(rewrite(input.url),input),options):nativeFetch(rewrite(input),options);
 function apply(ui){if(!ui)return;const changed=root.dataset.partyPhase!==ui.phase;root.dataset.partyPhase=ui.phase;window.PARTY_UI=ui;
  if(ui.phase!=='paused')root.classList.toggle('party-session-active',['countdown','playing','reveal','results'].includes(ui.phase));
  if(changed){if(ui.phase==='paused')window.dispatchEvent(new Event('blur'));window.dispatchEvent(new CustomEvent('party-phase-change',{detail:ui}));}
 }
 // Never close a healthy socket just because its browser tab became visible.
 // Closing on every visibility event used to revoke readiness and lose held input.
 function resume(){window.dispatchEvent(new Event('blur'));for(const socket of connections)if(socket.readyState===1){Socket.prototype.send.call(socket,JSON.stringify({type:'ping',data:{client:performance.now()}}));if(player&&socket.partyJoined)status('ready');}}
 window.addEventListener('message',e=>{if(!embedded||e.source!==parent||e.origin!==location.origin)return;if(e.data?.instance&&e.data.instance!==instance)return;
  if(e.data?.type==='party-ui')apply(e.data.ui);
  if(e.data?.type==='party-release')window.dispatchEvent(new Event('blur'));
  if(e.data?.type==='party-resume')resume();
 });
 window.addEventListener('online',resume);window.addEventListener('pageshow',e=>{if(e.persisted)resume();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)window.dispatchEvent(new Event('blur'));else resume();});
 document.addEventListener('DOMContentLoaded',()=>{
  if(embedded)apply(parent.PARTY_UI);
  let done=false;const ready=()=>{if(done)return;done=true;post('party-visual-ready');};
  // Readiness cannot depend on requestAnimationFrame in an intentionally hidden iframe.
  setTimeout(ready,350);Promise.resolve(document.fonts?.ready).then(ready,ready);
  document.addEventListener('contextmenu',e=>{if(e.target.closest?.('canvas,button,[role=application]'))e.preventDefault();});
  if(embedded&&parent.PARTY_TEST_BOT){window.PARTY_TEST_CONNECTIONS={native:connections,io:new Set()};}
 });
})();
