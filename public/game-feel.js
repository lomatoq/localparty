(() => {
  'use strict';
  const TYPES = new Set(['hit', 'shot', 'collision', 'explosion', 'elimination', 'out-of-bounds', 'danger', 'score', 'goal', 'round-result']);
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new Set();
  const timers = new WeakMap();
  const cooldown = new Map(), trackers = new Map();
  let lastHaptic = -Infinity, delivered = 0, controllerId = null;
  let layer;

  function ensureLayer() {
    if (layer?.isConnected) return layer;
    layer = document.createElement('div');
    layer.className = 'lp-feel-layer';
    layer.setAttribute('aria-hidden', 'true');
    (document.body || document.documentElement).append(layer);
    return layer;
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
  function point(options) {
    const x = options.x == null ? innerWidth / 2 : Math.abs(options.x) <= 1 ? options.x * innerWidth : options.x;
    const y = options.y == null ? innerHeight / 2 : Math.abs(options.y) <= 1 ? options.y * innerHeight : options.y;
    return { x: clamp(x, 0, innerWidth), y: clamp(y, 0, innerHeight) };
  }
  function temporaryClass(target, name, duration) {
    if (!(target instanceof Element)) return;
    target.classList.remove(name); void target.offsetWidth; target.classList.add(name);
    let names=timers.get(target);if(!names){names=new Map();timers.set(target,names);}
    clearTimeout(names.get(name));names.set(name,setTimeout(()=>{target.classList.remove(name);names.delete(name);},duration));
  }
  function haptic(type, intensity, enabled) {
    if (!enabled || document.hidden || !root.classList.contains('party-player') || performance.now()-lastHaptic<120) return false;
    const pattern = type === 'explosion' || type === 'elimination' ? [18, 26, 24] : type === 'danger' ? [12, 42, 12] : type === 'goal' ? [16, 35, 26] : [Math.round(6 + intensity * 10)];
    const pulse=window.LocalPartyNative?.haptic || (typeof navigator.vibrate==='function'?navigator.vibrate.bind(navigator):null);
    if(!pulse)return false;
    try{lastHaptic=performance.now();return pulse(pattern);}catch{return false;}
  }
  function emit(type, options = {}) {
    if (!TYPES.has(type)) throw new TypeError(`Unknown LocalPartyFeel event: ${type}`);
    const id = options.id == null ? '' : `${type}:${options.id}`;
    if (id && seen.has(id)) return { type, duplicate: true, suppressed: true };
    if (id) { seen.add(id); if (seen.size > 128) seen.delete(seen.values().next().value); }
    const intensity = clamp(options.intensity == null ? .55 : options.intensity, .12, 1);
    const duration = Math.round(clamp(options.duration || (type === 'danger' ? 300 : 210), 90, 420));
    const detail = { type, intensity, duration, reduced: reduced.matches, semantic: options.semantic || null };
    window.dispatchEvent(new CustomEvent('localparty:feel', { detail }));
    if (reduced.matches || document.hidden || window.PARTY_UI?.phase==='paused' || window.PARTY_GAME_CLOCK?.paused) return { ...detail, suppressed: true };
    if(options.conceded)haptic('hit',.4,options.haptic!==false);else haptic(type, intensity, options.haptic !== false);
    delivered++;
    if(options.impactTarget instanceof Element)temporaryClass(options.impactTarget,'lp-feel-counter',360);
    if(options.visual===false)return {...detail,particles:0};
    const at=performance.now();if(at-(cooldown.get(type)||-Infinity)<160)return {...detail,throttled:true};cooldown.set(type,at);

    const surface = options.target instanceof Element ? options.target : document.querySelector('[data-game-feel-surface],canvas');
    const host = ensureLayer(), p = point(options), color = options.color || (type === 'danger' || type === 'elimination' ? '#ff596f' : '#c8ff73');
    // Never flash the whole screen for rapid fire. Feedback remains peripheral
    // or at the impact point, leaving names, score and controls readable.
    if(type==='round-result'){
      const flash = document.createElement('i');flash.className='lp-feel-flash';
      flash.style.setProperty('--lp-feel-color',color);flash.style.setProperty('--lp-feel-duration', `${duration}ms`);
      flash.style.setProperty('--lp-feel-alpha', '.035');host.append(flash);setTimeout(()=>flash.remove(),duration+40);
    }

    if (type === 'danger' || type === 'out-of-bounds' || type === 'goal') {
      const edge = document.createElement('i'); edge.className = 'lp-feel-edge';
      edge.style.setProperty('--lp-feel-duration', `${duration}ms`); edge.style.setProperty('--lp-feel-alpha', String(.12 + intensity * .2));
      edge.style.setProperty('--lp-feel-color',color);
      host.append(edge); setTimeout(() => edge.remove(), duration + 40);
    }
    if(type==='goal'&&root.classList.contains('party-host')&&options.fieldRect){
      const r=options.fieldRect,label=document.createElement('strong');label.className='lp-feel-goal';
      label.textContent=options.announcement==='flag'?(window.PartyI18n?.language==='ru'?'ФЛАГ!':'FLAG!'):(window.PartyI18n?.language==='ru'?'ГОЛ!':'GOAL!');
      label.style.left=(r.x+r.width/2)+'px';label.style.top=(r.y+12)+'px';
      host.append(label);setTimeout(()=>label.remove(),700);
    }
    if (options.particles!==false && ['hit', 'collision', 'explosion', 'elimination', 'score', 'goal'].includes(type)) {
      const burst = document.createElement('span'); burst.className = 'lp-feel-burst'; burst.style.left = `${p.x}px`; burst.style.top = `${p.y}px`;
      burst.style.color=color;
      const count = Math.round(clamp(4 + intensity * 7, 4, 11));
      for (let i = 0; i < count; i++) { const bit = document.createElement('i'); bit.style.setProperty('--i', i); bit.style.setProperty('--n', count); bit.style.setProperty('--d', `${Math.round(18 + intensity * 34)}px`); burst.append(bit); }
      host.append(burst); setTimeout(() => burst.remove(), 520);
    }
    if (surface && options.shake !== false && ['hit', 'collision', 'explosion', 'elimination', 'goal'].includes(type)) {
      surface.style.setProperty('--lp-feel-shake', `${clamp(1 + intensity * 2, 1, 3)}px`);
      surface.style.setProperty('--lp-feel-duration', `${Math.min(duration, 190)}ms`);
      temporaryClass(surface, 'lp-feel-shake', Math.min(duration, 190) + 30);
    }
    if (options.impactTarget instanceof Element && ['hit', 'collision', 'score'].includes(type)) temporaryClass(options.impactTarget, 'lp-feel-impact', duration + 30);
    while(host.children.length>48)host.firstElementChild.remove();
    return { ...detail, particles: host.querySelectorAll('.lp-feel-burst>i').length };
  }

  function observe(snapshot,{channel='state',selfId}={}){
    if(!snapshot||typeof snapshot!=='object'||!window.LocalPartyFeelState)return;
    if(document.hidden){reset();return;}
    const game=root.dataset.partyGame;if(!window.LocalPartyFeelState.ids.includes(game))return;
    const player=root.classList.contains('party-player'),id=player?(snapshot.me?.id||snapshot.selfId||selfId||controllerId||window.PARTY_PROFILE?.id):null;
    let tracker=trackers.get(game);if(!tracker){tracker=window.LocalPartyFeelState.createTracker(game);trackers.set(game,tracker);}
    const info=window.LocalPartyTVInformation?.normalize({game:{id:game},snapshot,ui:window.PARTY_UI,now:Date.now()});
    const feedback=tracker.observe(snapshot,{channel,selfId:id,info});
    root.classList.toggle('lp-feel-critical',feedback.critical);
    root.classList.toggle('lp-feel-urgent',feedback.urgent);
    if(feedback.critical||feedback.urgent)ensureLayer();
    // The socket bridge runs before engine listeners update their DOM. Measure
    // the authored field after those listeners; no fixed field coordinates.
    queueMicrotask(()=>{for(const event of feedback.events){
      const candidates=event.impactSelector?[...document.querySelectorAll(event.impactSelector)].filter(e=>e.getClientRects().length):[];
      const target=candidates.find(e=>{const row=e.closest('[data-player-id],[data-id]');return event.impactPlayer&&[row?.dataset.playerId,row?.dataset.id].includes(event.impactPlayer);})||candidates.find(e=>!e.closest('[data-player-id],[data-id]'))||(!event.impactPlayer?candidates[0]:null);
      const surface=[...document.querySelectorAll('[data-game-feel-surface],#rink,#canvas,#game,#tower,canvas')].find(e=>e.getClientRects().length&&e.getBoundingClientRect().width>0);
      const fieldRect=surface?.getBoundingClientRect(),r=(target||surface)?.getBoundingClientRect();
      const goal=event.type==='goal'&&fieldRect?.width>0;
      emit(event.type,{...event,target:surface,impactTarget:target,fieldRect:goal?fieldRect:null,
        x:goal?fieldRect.x+fieldRect.width*(event.announcement==='flag'?.5:event.team===0?.96:.04):r?.width?r.x+r.width/2:undefined,y:goal?fieldRect.y+fieldRect.height/2:r?.height?r.y+r.height/2:undefined});
    }});
  }
  function reset(){for(const tracker of trackers.values())tracker.reset();root.classList.remove('lp-feel-critical','lp-feel-urgent');layer?.replaceChildren();
    for(const node of document.querySelectorAll('.lp-feel-shake,.lp-feel-impact,.lp-feel-counter')){for(const timer of timers.get(node)?.values()||[])clearTimeout(timer);timers.delete(node);node.classList.remove('lp-feel-shake','lp-feel-impact','lp-feel-counter');}
  }

  root.classList.toggle('lp-feel-reduced', reduced.matches);
  reduced.addEventListener?.('change', () => {root.classList.toggle('lp-feel-reduced', reduced.matches);if(reduced.matches)layer?.replaceChildren();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});addEventListener('pagehide',reset);
  addEventListener('party-phase-change',e=>{if(['paused','waiting','results'].includes(e.detail?.phase))reset();});
  window.LocalPartyFeel = Object.freeze({ emit, observe, reset, identify:id=>{controllerId=id;}, types: Object.freeze([...TYPES]), reduced: () => reduced.matches,
    diagnostics:()=>({delivered,seen:seen.size,children:layer?.children.length||0,critical:root.classList.contains('lp-feel-critical'),urgent:root.classList.contains('lp-feel-urgent')}) });
})();
