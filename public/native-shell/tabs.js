/* Shared local-only navigation. It never sends game or administration commands. */
(()=>{
 'use strict';
 if(window!==window.top||window.LocalPartyTabs)return;
 const native=!!window.webkit?.messageHandlers?.partyShell;
 if(!native)return;
 const send=tab=>window.webkit.messageHandlers.partyShell.postMessage({type:'native-tab',tab});
 let current=location.protocol==='partyapp:'?'games':'controller',dock;
 const icons={games:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',controller:'<path d="M7 7h10c3 0 5 9 3 11-2 2-4-2-5-2H9c-1 0-3 4-5 2-2-2 0-11 3-11Z"/><path d="M7 10v5m-2.5-2.5h5M16 11h.01M18 14h.01"/>',host:'<path d="M3 7h18M3 17h18"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>'};
 function labels(){const ru=window.PartyI18n?.language==='ru';return ru?['Игры','Пульт','Ведущий']:['Games','Controller','Host'];}
 function paint(){if(!dock)return;const names=labels();[...dock.querySelectorAll('button')].forEach((b,i)=>{b.setAttribute('aria-current',b.dataset.tab===current?'page':'false');b.querySelector('span').textContent=names[i];});dock.style.setProperty('--tab',String(['games','controller','host'].indexOf(current)));}
 function select(tab,notify=true){
  if(!['games','controller','host'].includes(tab))return;
  if(notify&&window.__partyPersistentTabs){send(tab);return;}
  const host=document.getElementById('hostPanel');
  if(host&&tab!=='controller'){
   const previous=current;
   // The catalog stays laid out (and painted) under the opaque host panel. Hiding it
   // with display:none and restoring the scroll made every return re-render 36 cards.
   document.body.classList.toggle('native-host-tab',tab==='host');
   // aria-hidden, not inert: inert restyles the whole catalog (70-170 ms). The opaque
   // full-screen panel already blocks pointer input to it.
   const main=document.querySelector('body>main');if(main){if(tab==='host')main.setAttribute('aria-hidden','true');else main.removeAttribute('aria-hidden');}
   if(tab==='host'){if(host.open)host.close();host.show();}else if(host.open)host.close();
   if(!window.__partyPersistentTabs&&previous!==tab&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const target=tab==='host'?host:document.querySelector('body>main');target?.animate([{opacity:0,translate:tab==='host'?'20vw 0':'-20vw 0'},{opacity:1,translate:'0 0'}],{duration:460,easing:'cubic-bezier(.22,1,.36,1)'});}
  }
  current=tab;paint();if(notify)send(tab);
 }

 // Chrome styles must be in place for the very first paint (the masthead jumped once
 // they arrived after DOMContentLoaded), yet still come after the page's stylesheets:
 // append them the moment the parser reaches <body>.
 let style=null;
 function installStyle(){
  if(style||!document.head)return;style=document.createElement('style');style.textContent=`
   :root{--native-tab-reserve:calc(56px - clamp(0px,calc(env(safe-area-inset-bottom) - 20px),12px) + env(safe-area-inset-bottom))}
   body.native-shell{padding-bottom:calc(var(--native-tab-reserve) + 8px)!important}
   body.native-controller{padding-bottom:var(--native-tab-reserve)!important}
   #partyNativeDock.native-tabs{position:fixed;inset:auto 0 0;z-index:65;height:var(--native-tab-reserve);padding:2px 12px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;box-sizing:border-box;isolation:isolate;background:none}
   #partyNativeDock.native-tabs:before{content:'';position:absolute;inset:-32px 0 0;z-index:-2;pointer-events:none;background:linear-gradient(to bottom,#0b101600,#0b1016e6 42%,#0b1016);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);mask-image:linear-gradient(to bottom,transparent,#000 40%);-webkit-mask-image:linear-gradient(to bottom,transparent,#000 40%)}
   #partyNativeDock.native-tabs button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:0;min-height:44px;margin:0;padding:3px;background:transparent;border:0;box-shadow:none;border-radius:16px;color:#b9b2c9;font:italic 800 10px/1.1 Rubik,PartyRubik,system-ui,sans-serif;text-transform:uppercase;transform:none}
   #partyNativeDock.native-tabs button[aria-current=page]{color:#d1ff89}
   #partyNativeDock.native-tabs svg{width:21px;height:21px;flex:none}
   .native-tab-selection{position:absolute;top:4px;left:12px;width:calc((100% - 32px)/3);height:48px;border:1px solid #c6b1ff36;border-radius:16px;background:#b99bff1a;z-index:-1;box-sizing:border-box;translate:calc(var(--tab,0) * (100% + 4px)) 0;transition:translate 280ms cubic-bezier(.2,.8,.2,1)}
   body.native-shell #openController,body.native-shell #openHost{display:none!important}
   html body.native-shell .app-header{grid-template-columns:1fr!important;justify-items:center;min-height:calc(72px + env(safe-area-inset-top))!important;padding-bottom:8px!important}
   html body.native-shell .app-header>nav{display:none!important}
   html body.native-shell .app-header>.identity{width:auto;justify-self:center;align-self:end;position:relative;overflow:visible!important}
   html body.native-shell .app-header .identity-copy{display:grid;grid-template-columns:auto 83px;column-gap:8px;row-gap:3px;align-items:center;justify-items:center;position:static}
   html body.native-shell .app-header .brand{grid-column:1;grid-row:1}
   html body:is(.native-shell,.native-controller) .app-header .identity .brand{font-family:Rubik,PartyRubik,system-ui,sans-serif!important;font-size:22px!important;font-weight:900!important;font-style:italic!important;line-height:1.15!important;letter-spacing:-.88px!important;white-space:nowrap;flex-shrink:0;transform:none!important}
   html body:is(.native-shell,.native-controller) .app-header .identity .brand span{font:inherit!important;letter-spacing:inherit!important}
   html body.native-shell .app-header .native-header-mascot{position:absolute;right:0;bottom:-8px;width:83px;height:70px;object-fit:contain;object-position:center bottom;pointer-events:none;-webkit-mask-image:linear-gradient(to bottom,#000 62%,#000a 82%,transparent);mask-image:linear-gradient(to bottom,#000 62%,#000a 82%,transparent)}
   html body.native-shell .app-header{background:transparent!important;isolation:isolate}
   html body.native-shell .app-header::before{inset:0 0 -20px;opacity:1;background:linear-gradient(to bottom,#0d1017 0%,#0d1017 calc(100% - 36px),#0d101799 calc(100% - 18px),transparent);-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 20px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 20px),transparent)}
   /* Joined sticky rows: never fade the header over the selected-game card.
      Only the bottom row owns the transparent trailing edge. */
   html body.native-shell:not(.native-host-tab):has(#choiceStrip:not([hidden])) .app-header::before,
   html body.native-shell:not(.native-host-tab):has(#activeCard:not([hidden])) .app-header::before{bottom:0;background:#0d1017;-webkit-mask-image:none;mask-image:none}
   html body.native-shell #choiceStrip::before{left:50%;right:auto;width:100vw;transform:translateX(-50%);top:-2px;bottom:-8px}
   html body.native-shell.tools-stuck #choiceStrip::before{bottom:-8px;background:#0d1017}
   html body.native-shell.tools-stuck .native-catalog-tools::before{left:50%;right:auto;width:100vw;transform:translateX(-50%);top:-1px}
   html body.native-host-tab #hostPanel[open]{z-index:38}
   /* The host panel scrolls under the masthead: keep the logo on a solid backing, fading only its last 20px. */
   html body.native-shell.native-host-tab header#brandHeader.app-header{background:linear-gradient(180deg,#2d263e 0%,#282239 calc(100% - 20px),#28223900 100%)!important}
   html body.native-shell.native-host-tab{background:#282239!important}
   html body.native-shell.native-host-tab .app-header::before{bottom:-20px;background:#282239!important;-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 20px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 20px),transparent)}
   html body.native-shell.native-host-tab #hostPanel[open]{background:#282239!important;border-top:0!important;box-shadow:none!important}
   html body.native-shell>main{background:#0d1017}
   html body.native-shell .app-header #connection{grid-column:1/-1;grid-row:2;justify-self:center;text-align:center;justify-content:center;margin:0!important}
   body.native-host-tab>.native-run{display:none!important}
   html body.native-host-tab #hostPanel[open]{overscroll-behavior:contain}
   html body.native-host-tab #hostPanel[open]{position:fixed;inset:0;width:100%;max-width:none;height:auto;max-height:none;margin:0;padding:calc(var(--host-head,76px) + 20px) 16px calc(var(--native-tab-reserve) + 36px);border:0;border-radius:0;background:#0d1017;box-shadow:none;overflow:auto;animation:none!important}
   html body.native-controller.profile-editing #onboarding{bottom:calc(var(--native-tab-reserve) + 8px)!important;max-height:calc(100dvh - var(--native-tab-reserve) - 16px)!important;border-bottom:1px solid #bca3ff55!important;border-radius:28px!important;padding-bottom:20px!important}
   @keyframes nativeProfileEnter{from{opacity:0;translate:0 56px}to{opacity:1;translate:0 0}}
   @media(prefers-reduced-motion:no-preference){body.native-controller #onboarding:not([hidden]){animation:nativeProfileEnter 680ms cubic-bezier(.22,1,.36,1)!important}}
   body.native-host-tab #hostPanel [data-close=hostPanel]{display:none!important}
   @media(prefers-reduced-motion:reduce){.native-tab-selection{transition:none}}
  `;
  if(window.__partyPersistentTabs)style.textContent+=' #partyNativeDock.native-tabs{visibility:hidden!important;pointer-events:none!important}';
  document.head.append(style);
 }
 if(document.body)installStyle();else new MutationObserver((_,observer)=>{if(document.body){observer.disconnect();installStyle();}}).observe(document.documentElement,{childList:true});
 function mount(){
  if(document.body.classList.contains('native-shell'))current='games';
  dock=document.getElementById('partyNativeDock');if(!dock){dock=document.createElement('nav');dock.id='partyNativeDock';document.body.append(dock);}
  dock.classList.add('native-tabs');dock.setAttribute('aria-label','Main navigation');dock.innerHTML='<i class="native-tab-selection" aria-hidden="true"></i>'+['games','controller','host'].map(tab=>'<button type="button" data-tab="'+tab+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">'+icons[tab]+'</svg><span></span></button>').join('');
  dock.querySelectorAll('button').forEach(b=>b.onclick=()=>select(b.dataset.tab));
  installStyle();if(window.__partyPersistentTabs)dock.setAttribute('aria-hidden','true');paint();window.dispatchEvent(new Event('resize'));
 }
 window.LocalPartyTabs=Object.freeze({select});
 window.addEventListener('party-language-change',paint);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,0),{once:true});else mount();
})();
