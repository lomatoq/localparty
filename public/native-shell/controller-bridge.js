/* WKUserScript only. The controller has no administrative TV commands. */
(() => {
  'use strict';
  if (location.protocol !== 'http:' || location.hostname !== '127.0.0.1' || !window.webkit?.messageHandlers?.partyShell) return;
  const send = data => window.webkit.messageHandlers.partyShell.postMessage(data);
  function vibrate(value) {
    const pattern = Array.isArray(value) ? value : [value];
    if (!pattern.length) { send({type: 'haptic', pattern: [0]}); return true; }
    if (pattern.length > 12 || pattern.some(x => typeof x !== 'number' || !Number.isFinite(x) || x < 0)) return false;
    send({type: 'haptic', pattern: pattern.map(x => Math.min(500, Math.round(x)))}); return true;
  }
  window.LocalPartyNative = Object.freeze({haptic: vibrate, prepare:()=>send({type:'haptic-prepare'}), isNative: true});
  try { Object.defineProperty(navigator, 'vibrate', {configurable: true, value: vibrate}); } catch { /* explicit API remains available */ }
  if (window !== window.top) return;
  function mount() {
    if (document.getElementById('partyNativeMenu')) return;
    document.body.classList.add('native-controller');
    const style=document.createElement('style');style.textContent=`
      body.native-controller{padding-bottom:calc(56px + env(safe-area-inset-bottom))!important}
      body.native-controller.in-game #play{height:var(--native-play-height,calc(100svh - 128px - env(safe-area-inset-bottom)))!important;max-height:var(--native-play-height,calc(100svh - 128px - env(safe-area-inset-bottom)))!important;min-height:0!important}
      #partyNativeDock{position:fixed;inset:auto 0 0;z-index:65;height:calc(52px + env(safe-area-inset-bottom));padding:5px max(12px,env(safe-area-inset-right)) calc(5px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));display:flex;align-items:center;justify-content:space-between;gap:12px;background:#0b1016f5;border-top:1px solid #ffffff14;box-sizing:border-box;backdrop-filter:blur(18px)}
      #partyNativeDock #partyNativeMenu{display:inline-flex!important;align-items:center;gap:8px;min-width:92px;min-height:42px;height:42px;padding:8px 15px;font-size:12px;white-space:nowrap;margin:0}
      #partyNativeDock small{color:var(--muted,#a1aaa9);font-size:11px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    `;document.head.append(style);
    const dock=document.createElement('div');dock.id='partyNativeDock';
    const b=document.createElement('button');b.id='partyNativeMenu';b.type='button';b.className='nav';b.textContent='← Меню';b.setAttribute('aria-label','Вернуться в меню ведущего');
    b.addEventListener('click',()=>send({type:'menu'}));
    const label=document.createElement('small');label.textContent='Твой пульт · LocalParty';dock.append(b,label);document.body.append(dock);
    const fullscreen=document.getElementById('fullscreen');if(fullscreen)fullscreen.hidden=true;
    let pending=0;
    const fit=()=>{pending=0;const play=document.getElementById('play');if(!play||play.hidden)return;
      const height=Math.max(1,document.documentElement.clientHeight-Math.max(0,play.getBoundingClientRect().top)-dock.getBoundingClientRect().height);
      const value=Math.floor(height)+'px';if(play.style.getPropertyValue('--native-play-height')!==value)play.style.setProperty('--native-play-height',value);
    };
    const queue=()=>{if(!pending)pending=requestAnimationFrame(fit);};
    const ro=new ResizeObserver(queue);ro.observe(dock);const header=document.querySelector('.app-header');if(header)ro.observe(header);
    new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class']});
    const play=document.getElementById('play');if(play)new MutationObserver(queue).observe(play,{attributes:true,attributeFilter:['hidden']});
    window.addEventListener('resize',()=>{fit();queue();},{passive:true});window.visualViewport?.addEventListener('resize',queue,{passive:true});
    window.addEventListener('party-native-resume',()=>{fit();queue();});fit();queue();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true}); else mount();
})();
