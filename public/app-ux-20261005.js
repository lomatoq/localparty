/* HeyPals phone app UX · 2026-10-05 (Claude "app" lane).
   Top-level document only (never inside game iframes, never on the TV).
   Adds: draggable bottom sheets, card → detail shared-element flight, skeleton /
   empty states, calm Host-tab focus, join confetti and counter pops.
   No game commands, no network, no layout changes to approved Pause/Lobby. */
(() => {
 'use strict';
 if (window.__heypalsAppUX || window !== window.top) return;
 const body = document.body;
 if (!body || body.classList.contains('tv-screen') || window.PARTY_DISPLAY_ONLY) return;
 window.__heypalsAppUX = true;
 const $ = id => document.getElementById(id);
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const phone = matchMedia('(max-width: 640px)');
 const nativeHub = body.classList.contains('native-shell');
 const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
 const springEase = () => css('--ux-spring-sheet') || 'cubic-bezier(.22,1,.36,1)';
 const POP = 'linear(0,.0773,.2486,.447,.6322,.7844,.8972,.9729,1.0178,1.0396,1.046,1.0429,1.0353,1.0262,1.0176,1.0104,1.0051,1.0015,.9993,.9982,1)';
 const supportsLinear = CSS.supports?.('transition-timing-function', 'linear(0,1)');
 const popEase = supportsLinear ? POP : 'cubic-bezier(.34,1.56,.64,1)';

 function haptic(pattern) {
  try {
   if (nativeHub) window.webkit?.messageHandlers?.partyShell?.postMessage({type: 'haptic', pattern});
   else window.LocalPartyNative?.haptic?.(pattern);
  } catch { /* haptics are optional */ }
 }

 // A hero enters once after decoding. Scrolling never resets its pose.
 const hero=document.querySelector('.heypals-hero');
 if(hero){
  const enter=()=>{if(!hero.isConnected)return;hero.dataset.hpEntered='true';
   if(!reduced.matches&&!document.hidden&&hero.getClientRects().length)hero.animate([{translate:'0 28px',opacity:0},{translate:'0 0',opacity:1}],{duration:850,easing:'cubic-bezier(.16,1,.3,1)'});
  };
  const visible=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){visible.disconnect();hero.decode().catch(()=>{}).then(enter);}});
  visible.observe(hero);
 }

 // On-device evidence: aggregate once per ten seconds, never one bridge call per frame.
 if(window.webkit?.messageHandlers?.partyShell){
  let last=0,start=0,count=0,total=0,max=0,over50=0,over100=0;const bins=new Uint32Array(1001);
  const reset=()=>{last=start=count=total=max=over50=over100=0;bins.fill(0);};
  document.addEventListener('visibilitychange',reset);
  window.addEventListener('party-native-hide',reset);
  window.addEventListener('party-native-resume',reset);
  requestAnimationFrame(function sample(now){
   if(!document.hidden){
    if(last){const dt=now-last;count++;total+=dt;max=Math.max(max,dt);bins[Math.min(1000,Math.round(dt))]++;if(dt>50)over50++;if(dt>100)over100++;}
    if(!start)start=now;
    if(now-start>=10000&&count){let n=0,p95=0;for(;p95<1000;p95++){n+=bins[p95];if(n>=count*.95)break;}
     const running=document.getAnimations().filter(a=>a.playState==='running');
     window.webkit.messageHandlers.partyShell.postMessage({type:'ui-performance',stats:{surface:'phone',path:location.pathname,fps:Math.round(count*10000/total)/10,p95,max:Math.round(max),over50,over100,frames:count,viewport:innerWidth+'x'+innerHeight,visibility:document.visibilityState,runningAnimations:running.length,runningCSS:running.filter(a=>typeof CSSAnimation!=='undefined'&&a instanceof CSSAnimation).length,stage:document.querySelector('dialog[open]')?.id||(body.classList.contains('profile-editing')?'profile':body.classList.contains('in-game')?'game':'catalog')}});reset();start=now;
    }last=now;
   }requestAnimationFrame(sample);
  });
 }

 // WebKit may report a filtered ::backdrop while painting a sharp page.
 // Filter actual background branches, never an ancestor of the foreground sheet.
 const modalBackgrounds=new Set(),modalOrder=[];
 document.addEventListener('beforetoggle',event=>{
  if(event.newState!=='open'||!event.target.matches?.('dialog,[popover][role=dialog]'))return;
  const index=modalOrder.indexOf(event.target);if(index>=0)modalOrder.splice(index,1);modalOrder.push(event.target);
 },true);
 function syncModalBackground(){
  const dialogs=[...document.querySelectorAll('dialog[open]:modal')];
  const profile=body.classList.contains('profile-editing')?$('onboarding'):null;
  const panels=[...document.querySelectorAll('[popover][role=dialog]:popover-open,#pauseOverlay:not([hidden])')];
  const candidates=[...dialogs,...panels,...(profile?[profile]:[])];
  for(let i=modalOrder.length-1;i>=0;i--)if(!candidates.includes(modalOrder[i]))modalOrder.splice(i,1);
  for(const panel of candidates)if(!modalOrder.includes(panel))modalOrder.push(panel);
  const foreground=modalOrder.slice(-1);
  const active=panels.some(p=>!p.hasAttribute('data-lp-panel-closing'))||dialogs.some(d=>!d.classList.contains('lp-dialog-closing'))||!!(profile&&!body.hasAttribute('data-profile-closing'));
  const next=new Set();
  if(foreground.length){
   const visit=parent=>{for(const node of parent.children){
    if(node.matches('script,style,link,.profile-sheet-backdrop')||foreground.includes(node))continue;
    // Filtering main traps its sticky decks in a new stacking context below
    // the body-level header backing. Blur its existing branches instead, so
    // Host Pick and search retain their normal position and paint order.
    if((nativeHub&&node.matches('main'))||foreground.some(panel=>node.contains(panel)))visit(node);else next.add(node);
   }};visit(body);
  }
  for(const node of modalBackgrounds)if(!next.has(node)){node.removeAttribute('data-hp-modal-background');modalBackgrounds.delete(node);}
  for(const node of next)if(!modalBackgrounds.has(node)){node.setAttribute('data-hp-modal-background','');modalBackgrounds.add(node);}
  // Keep costly background motion parked until the outgoing sheet has actually
  // closed; the active flag still owns the unchanged backdrop/blur fade.
  body.toggleAttribute('data-hp-modal-present',foreground.length>0);
  body.toggleAttribute('data-hp-modal-active',active);
 }
 const modalObserver=new MutationObserver(records=>{
  if(records.some(r=>r.target===body||r.target.matches?.('dialog,[popover][role=dialog],#pauseOverlay')||(r.type==='childList'&&[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches('dialog,[popover][role=dialog]')||n.querySelector('dialog,[popover][role=dialog]'))))))syncModalBackground();
 });
 modalObserver.observe(body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','class','data-profile-closing','data-lp-panel-closing']});
 document.addEventListener('toggle',event=>{if(event.target.matches?.('[popover][role=dialog]'))syncModalBackground();},true);
 syncModalBackground();

 // Energy only runs on visible actions, including dynamically inserted popup controls.
 const energyButtons=new Set();
 const energyVisible=new Set();
 const energySync=()=>{
  const openDialogs=[...document.querySelectorAll('dialog[open]')];
  const foreground=openDialogs.at(-1)||(body.classList.contains('profile-editing')?$('onboarding'):null);
  for(const b of energyButtons){const state=energyVisible.has(b)&&!document.hidden&&!window.__partyNativeHidden&&!b.disabled&&(!foreground||foreground.contains(b))?'running':'paused';
   if(b.style.getPropertyValue('--hp-cta-play')!==state)b.style.setProperty('--hp-cta-play',state);
  }
 };
 const energyObserver=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)energyVisible.add(e.target);else energyVisible.delete(e.target);}energySync();});
 function wrapAudioSurfaces(root){
  const groups=[...(root.matches?.('fieldset.hp-audio-settings')?[root]:[]),...root.querySelectorAll('fieldset.hp-audio-settings')];
  for(const group of groups){if(group.parentElement?.classList.contains('hp-audio-surface'))continue;
   const surface=document.createElement('div');surface.className='hp-audio-surface';group.before(surface);surface.append(group);
  }
 }
 function watchEnergy(root){
  wrapAudioSurfaces(root);
  const buttons=[...(root.matches?.('button.primary,button.lime,button.quiet,button.start-game,button.lp-direct-start')?[root]:[]),...root.querySelectorAll('button.primary,button.lime,button.quiet,button.start-game,button.lp-direct-start')];
  for(const b of buttons)if(!energyButtons.has(b)){
   const priority=(b.matches('.primary,.lime,.start-game,.lp-direct-start')&&!b.closest('#tvDirectorControls,.tv-game-stepper,#tvRemoteGenres'))||b.matches('#detailController,#avatarCapture,#copy,#retryGame,#retryCatalog');
   b.classList.toggle('hp-energy-action',priority);
   if(priority){energyButtons.add(b);energyObserver.observe(b);}
  }
 }
 watchEnergy(body);
 new MutationObserver(records=>{
  for(const record of records)for(const n of record.addedNodes)if(n.nodeType===1)watchEnergy(n);
  for(const b of energyButtons)if(!b.isConnected){energyObserver.unobserve(b);energyButtons.delete(b);energyVisible.delete(b);}
 }).observe(body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',energySync);
 window.addEventListener('party-native-hide',energySync);
 window.addEventListener('party-native-resume',energySync);
 new MutationObserver(energySync).observe(body,{attributes:true,attributeFilter:['class']});
 new MutationObserver(energySync).observe(body,{attributes:true,subtree:true,attributeFilter:['open','disabled']});

 // Fit long translated action labels without changing the shared button height.
 function fitPopupActions(dialog){
  for(const back of dialog.querySelectorAll('button.hp-popup-back')){
   const row=back.parentElement;
   const actions=[...row.querySelectorAll(':scope>button,:scope>a[href]')].filter(b=>!b.hidden&&b.getClientRects().length&&getComputedStyle(b).display!=='none');
   const single=actions.length===1&&actions[0]===back;
   back.classList.toggle('hp-single-back-action',single);
   if(row!==dialog)row.classList.toggle('hp-single-back',single);
  }
  for(const button of dialog.querySelectorAll('.native-actions>button,.hp-popup-actions>button,.room-actions>button,.nearby-footer button,.lp-update-actions>button,form[method=dialog]>button')){
   if(button.hidden||button.classList.contains('hp-popup-back')||!button.getClientRects().length)continue;
   const fitKey=[button.textContent,button.clientWidth,innerWidth].join('|');if(button.dataset.actionFit===fitKey)continue;button.dataset.actionFit=fitKey;
   for(const size of (innerWidth<350?[14,13,12]:[15,14,13,12])){
    button.style.setProperty('font-size',size+'px','important');
    const range=document.createRange();range.selectNodeContents(button);const ink=range.getBoundingClientRect(),style=getComputedStyle(button);
    const available=button.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-4;
    if(ink.width<=available&&button.scrollHeight<=button.clientHeight+1)break;
   }
  }
 }
 const fittedDialogs=new WeakSet();
 function watchPopupActions(dialog){
  if(fittedDialogs.has(dialog))return;
  fittedDialogs.add(dialog);
  let pending=false;
  const schedule=()=>{if(!dialog.open||pending)return;pending=true;requestAnimationFrame(()=>{pending=false;fitPopupActions(dialog);});};
  dialog.addEventListener('toggle',schedule);
  new ResizeObserver(schedule).observe(dialog);
  new MutationObserver(schedule).observe(dialog,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
  document.fonts?.ready.then(schedule);
  schedule();
 }
 document.querySelectorAll('dialog').forEach(watchPopupActions);
 // Discovery and update dialogs can be added after the shell has initialized.
 new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){
  if(node.nodeType!==1)continue;
  if(node.matches('dialog'))watchPopupActions(node);
  node.querySelectorAll('dialog').forEach(watchPopupActions);
 }}).observe(document.body,{childList:true});
 window.addEventListener('party-language-change',()=>document.querySelectorAll('dialog[open]').forEach(fitPopupActions));

 // Gradient glyphs cannot be clipped reliably inside native WebKit inputs.
 const tintedInputs=[];
 function tintFields(root){const fields=[...(root.matches?.('#name,input[type=text],input[type=search]')?[root]:[]),...root.querySelectorAll('#name,input[type=text],input[type=search]')];fields.forEach(input=>{
  if(input.closest('.hp-input-tint')||input.hasAttribute('data-room-digit'))return;
  const wrap=document.createElement('div'),ink=document.createElement('span');wrap.className='hp-input-tint';ink.className='hp-input-ink';ink.setAttribute('aria-hidden','true');
  input.before(wrap);wrap.append(input,ink);
  const sync=()=>{
   const text=input.value||input.placeholder||(input.type==='search'?'Game title':'');
   if(ink.textContent!==text)ink.textContent=text;
   if(ink.classList.contains('is-placeholder')!==!input.value)ink.classList.toggle('is-placeholder',!input.value);
   // A closed sheet has no glyph geometry to synchronize. Its ResizeObserver
   // runs when it opens; avoid forcing hidden-field styles on every body class.
   if(!input.isConnected||!input.getClientRects().length)return;
   const cs=getComputedStyle(input);
   for(const [key,value]of [['font',cs.font],['letter-spacing',cs.letterSpacing],['padding-inline',cs.paddingLeft+' '+cs.paddingRight]])if(ink.style.getPropertyValue(key)!==value)ink.style.setProperty(key,value);
  };
  ['input','change','blur','focus'].forEach(event=>input.addEventListener(event,sync));new ResizeObserver(sync).observe(input);tintedInputs.push(sync);new MutationObserver(sync).observe(input,{attributes:true,attributeFilter:['placeholder']});sync();
 });}
 tintFields(body);
 new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)tintFields(n);}).observe(body,{childList:true,subtree:true});
 new MutationObserver(()=>tintedInputs.forEach(sync=>sync())).observe(body,{attributes:true,attributeFilter:['class']});
 document.fonts?.ready.then(()=>tintedInputs.forEach(sync=>sync()));

 /* ───────── Sheets ───────── */
 const SHEETS = nativeHub ? ['gameDetail','hostPanel'] : ['rulesDialog', 'statsDialog', 'roomDialog','joinDialog','catalogDialog'];
 const sheets = SHEETS.map($).filter(d => d instanceof HTMLDialogElement);
 for (const d of sheets) {
  d.classList.add('ux-sheet');
  if (!d.querySelector(':scope>.ux-grabber')) { const g = document.createElement('span'); g.className = 'ux-grabber'; g.setAttribute('aria-hidden', 'true'); d.prepend(g); }
  d.addEventListener('close', () => { d.style.removeProperty('translate'); d.classList.remove('ux-dragging'); d.style.removeProperty('--ux-drag-fade'); });
  installDrag(d);
 }

 function rubber(overshoot, dimension, c = .55) { return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot)); }
 function scrollableAt(node, stop) {
  for (let n = node; n && n !== stop.parentElement; n = n.parentElement) {
   if (!(n instanceof Element)) break;
   const s = getComputedStyle(n);
   if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight - n.clientHeight > 1 && n.scrollTop > 0.5) return true;
   if (n === stop) break;
  }
  return false;
 }
 let suppressClickUntil = 0;
 function installDrag(d) {
  let g = null;
  // A sheet can close while the pointer is still down (Escape, navigation or
  // another action). Never carry that gesture into the next opening.
  d.addEventListener('close', () => { g = null; });
  const blocked = 'input,select,textarea,[contenteditable],input[type=range],.no-drag,.fresh-track,[data-joystick]';
  d.addEventListener('pointerdown', e => {
   if (g || (d.id==='hostPanel' && body.classList.contains('native-host-tab')) || !phone.matches || !d.open || d.classList.contains('lp-dialog-closing') || !e.isPrimary || e.button !== 0) return;
   const t = e.target instanceof Element ? e.target : null;
   if (!t || t.closest(blocked) || scrollableAt(t, d)) return;
   g = {id: e.pointerId, x0: e.clientX, y0: e.clientY, active: false, samples: [{y: e.clientY, t: e.timeStamp}], h: d.getBoundingClientRect().height, offset: 0};
  }, {passive: true});
  d.addEventListener('pointermove', e => {
   if (!g || e.pointerId !== g.id) return;
   const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
   if (!g.active) {
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { g = null; return; }
    if (dy < -8) { g = null; return; }
    if (dy <= 8) return;
    g.active = true; g.start = e.clientY;
    try { d.setPointerCapture(e.pointerId); } catch {}
    window.LocalPartyUIFeel?.cancel?.();
    clearFlight(); // the hand takes over: a viewport-fixed art clone must not stay behind
    d.getAnimations().forEach(a => { if (a.playState !== 'finished') a.finish?.(); });
    d.classList.add('ux-dragging');
   }
   const raw = e.clientY - g.start;
   g.offset = raw >= 0 ? raw : rubber(raw, g.h);
   d.style.translate = `0 ${g.offset.toFixed(1)}px`;
   d.style.setProperty('--ux-drag-fade', String(Math.max(.25, 1 - Math.max(0, g.offset) / (g.h * 1.1))));
   g.samples.push({y: e.clientY, t: e.timeStamp}); if (g.samples.length > 6) g.samples.shift();
  }, {passive: true});
  const end = e => {
   if (!g || e.pointerId !== g.id) return;
   const state = g; g = null;
   if (!state.active) return;
   suppressClickUntil = performance.now() + 450; // a drag that began on a button is not a tap
   d.classList.remove('ux-dragging');
   const a = state.samples[0], b = state.samples[state.samples.length - 1];
   const v = b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0; // px per ms, positive = downward
   const dismiss = e.type === 'pointerup' && (state.offset > Math.min(170, state.h * .32) || (v > .45 && state.offset > 18));
   if (dismiss) { haptic([9]); d.close(); return; }
   const from = d.style.translate || '0 0';
   d.style.removeProperty('translate'); d.style.removeProperty('--ux-drag-fade');
   if (!reduced.matches && Math.abs(state.offset) > 1) d.animate([{translate: from}, {translate: '0 0'}], {duration: 420, easing: springEase()});
  };
  d.addEventListener('click', e => { if (performance.now() < suppressClickUntil) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  d.addEventListener('pointerup', end, {passive: true});
  d.addEventListener('pointercancel', end, {passive: true});
  d.addEventListener('lostpointercapture', end, {passive: true});
 }

 /* ───────── Shared-element flight: card art → game detail art (native hub) ───────── */
 let source = null;
 document.addEventListener('pointerdown', e => {
  const t = e.target instanceof Element ? e.target : null;
  if (!t) return;
  const card = t.closest('#catalog [data-game]');
  const img = card ? card.querySelector('img.symbol') : t.closest('#choiceOpen') ? $('choiceArt') : null;
  source = img ? {img, time: performance.now()} : null;
 }, {capture: true, passive: true});
 document.addEventListener('keydown', () => { source = null; keyboardAt = performance.now(); }, {capture: true});
 let keyboardAt = -Infinity;

 function contentRect(img, reference = img) {
  const r = img.getBoundingClientRect(), s = getComputedStyle(img);
  const nw = reference.naturalWidth, nh = reference.naturalHeight;
  if (!nw || !nh || !/contain|scale-down/.test(s.objectFit)) return r;
  const k = Math.min(r.width / nw, r.height / nh), w = nw * k, h = nh * k;
  return {left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h};
 }
 function visible(r) { return r.width > 4 && r.height > 4 && r.top < innerHeight && r.top + r.height > 0; }

 const detail = nativeHub ? $('gameDetail') : null, detailArt = $('detailArt');
 let flight = null;
 function detailRestRect(reference = detailArt) {
  const now = contentRect(detailArt, reference);
  // offsetTop is the fixed sheet's layout position, before entrance/exit motion.
  // It includes the approved negative bottom inset; reconstructing from viewport
  // height alone made the clone land 28px above the real art and snap afterwards.
  const dy = detail.getBoundingClientRect().top - detail.offsetTop;
  return {left: now.left, top: now.top - dy, width: now.width, height: now.height};
 }
 function clearFlight() {
  if (!flight) return;
  const f = flight; flight = null;
  f.anim?.cancel();
  f.raster?.cancel(); f.fade?.cancel(); f.reveal?.cancel();
  try { f.layer.hidePopover?.(); } catch {}
  f.layer.remove();
  if (f.source?.isConnected) f.source.style.removeProperty('opacity');
  detail?.classList.remove('ux-art-flying');
 }
 function animateFlight(f, fromRect, toRect, {duration, easing, sync, resolve = false, blur = 0, onDone}) {
  const s = fromRect.width / toRect.width;
  const dx = (fromRect.left + fromRect.width / 2) - (toRect.left + toRect.width / 2);
  const dy = (fromRect.top + fromRect.height / 2) - (toRect.top + toRect.height / 2);
  const anim = f.layer.animate([{transform: `translate(${dx}px,${dy}px) scale(${s})`}, {transform: 'translate(0,0) scale(1)'}], {duration, easing, fill: 'both'});
  const img = f.layer.firstElementChild, shadow = getComputedStyle(img).filter;
  // This softness is intentional motion treatment, independent of root blur.
  // Resolve it gradually before the two perfectly aligned images crossfade.
  const raster = img.animate([
   {filter: `${shadow} blur(${blur}px)`, offset: 0},
   {filter: `${shadow} blur(0px)`, offset: .82},
   {filter: `${shadow} blur(0px)`, offset: 1}
  ], {duration, easing: 'linear', fill: 'both'});
  f.anim = anim; f.raster = raster;
  const linked = [raster];
  detail.classList.add('ux-art-flying');
  const handoff = () => {
   if (flight !== f || f.anim !== anim) return;
    const elapsed = Number(anim.currentTime) || 0;
    const onTime = elapsed < duration * .82;
    // Create paired opacity effects together, rather than revealing the target
    // in a late rAF callback. WebKit can skip that callback while rasterizing a
    // frame; the compositor's common clock must still preserve the handoff.
    const options = {duration: onTime ? duration : 100, easing: 'linear', fill: 'both'};
    f.fade = img.animate(onTime ? [{opacity: 1, offset: 0}, {opacity: 1, offset: .82}, {opacity: 0, offset: 1}] : [{opacity: 1}, {opacity: 0}], options);
    f.reveal = detailArt.animate(onTime ? [{opacity: 0, offset: 0}, {opacity: 0, offset: .82}, {opacity: 1, offset: 1}] : [{opacity: 0}, {opacity: 1}], options);
    detail.classList.remove('ux-art-flying');
    if (onTime) {
     linked.push(f.fade, f.reveal);
     [f.fade, f.reveal].forEach(a => { a.currentTime = elapsed; if (anim.playState === 'paused') a.pause(); });
    }
    return f.reveal.finished;
  };
  // A decoded tapped texture stays fully visible until the detail texture is
  // actually ready. A slow cache/decode never leaves a transparent gap.
  const revealFinished = resolve ? (detailArt.complete && detailArt.naturalWidth ? Promise.resolve() : detailArt.decode()).then(handoff) : Promise.resolve();
  if (sync) sync(anim, linked);
  Promise.all([anim.finished, revealFinished]).then(() => { if (flight?.anim === anim) { onDone?.(); clearFlight(); } }, () => { if (flight?.anim === anim) clearFlight(); });
 }
 function fly(fromRect, toRect, src, options) {
  clearFlight();
  if (typeof HTMLElement.prototype.showPopover !== 'function') return;
  const layer = document.createElement('div');
  layer.className = 'ux-flight'; layer.setAttribute('popover', 'manual'); layer.setAttribute('aria-hidden', 'true');
  const img = document.createElement('img'); img.alt = ''; img.src = src.currentSrc || src.src; img.decoding = 'sync';
  layer.append(img);
  Object.assign(layer.style, {left: toRect.left + 'px', top: toRect.top + 'px', width: toRect.width + 'px', height: toRect.height + 'px'});
  // A shared element belongs to its foreground dialog. Body siblings are the
  // modal coordinator's background and therefore receive the 8px root blur.
  // The popover still paints in the top layer, outside the sheet's moving box.
  detail.append(layer);
  try { layer.showPopover(); } catch { layer.remove(); return; }
  flight = {layer, source: src};
  animateFlight(flight, fromRect, toRect, options);
 }
 function retargetFlight(to) {
  const f = flight;
  if (!f) return;
  // A reopened sheet keeps the same painted clone: reverse from its live pose,
  // rather than finishing the return to the card or replacing the image.
  const from = f.layer.getBoundingClientRect();
  const blur = parseFloat(getComputedStyle(f.layer.firstElementChild).filter.match(/blur\(([-\d.]+)px\)/)?.[1]) || 0;
  f.anim.cancel(); f.raster?.cancel(); f.fade?.cancel(); f.reveal?.cancel();
  Object.assign(f.layer.style, {left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px'});
  animateFlight(f, from, to, {duration: 180, easing: 'cubic-bezier(.23,1,.32,1)', resolve: true, blur});
 }

 if (detail && detailArt) {
  let wasOpen = detail.open, wasClosing = false;
  new MutationObserver(() => {
   const open = detail.open, closing = detail.classList.contains('lp-dialog-closing');
   if (open && !wasOpen) onDetailOpen();
   else if (open && closing && !wasClosing) onDetailClose();
   else if (open && !closing && wasClosing) onDetailReopen();
   else if (!open && wasOpen) clearFlight();
   wasOpen = open; wasClosing = closing;
  }).observe(detail, {attributes: true, attributeFilter: ['open', 'class']});

  function onDetailOpen() {
   const src = source; source = null;
   if (!src || performance.now() - src.time > 1500 || reduced.matches || !phone.matches || !src.img.isConnected) return;
   const from = contentRect(src.img);
   if (!visible(from) || !src.img.complete || !src.img.naturalWidth) return;
   // The tapped art is already decoded. Reuse it from the first foreground paint
   // even when the newly assigned detail image has not completed its cache load.
   const to = detailRestRect(src.img);
   if (!visible(to)) return;
   src.img.style.opacity = '0';
   fly(from, to, src.img, {
    duration: parseFloat(css('--ux-sheet-in-ms')) || 560, easing: springEase(), resolve: true, blur: 8,
    // Follow the sheet's own entrance clock (host.js holds it until first paint).
    sync(anim, linked) {
     const sheet = detail.getAnimations().find(a => a.animationName === 'ux-sheet-in');
     if (!sheet) return;
     [anim, ...linked].forEach(a => { a.pause(); a.currentTime = 0; });
     const follow = () => {
      if (flight?.anim !== anim) return;
      if (sheet.playState === 'running') { [anim, ...linked].forEach(a => { a.currentTime = sheet.currentTime || 0; a.play(); }); return; }
      if (sheet.playState === 'finished' || sheet.playState === 'idle') { [anim, ...linked].forEach(a => a.play()); return; }
      requestAnimationFrame(follow);
     };
     follow();
    },
    onDone() { if (src.img.isConnected) src.img.style.removeProperty('opacity'); }
   });
   if (flight) flight.source = src.img; else src.img.style.removeProperty('opacity');
   lastCardArt = src.img;
  }
  let lastCardArt = null;
  function onDetailReopen() {
   if (!flight) return;
   if (reduced.matches || !phone.matches) { clearFlight(); return; }
   lastCardArt = flight.source;
   retargetFlight(detailRestRect(flight.source));
  }
  function onDetailClose() {
   const card = lastCardArt; lastCardArt = null;
   const live = flight?.layer.getBoundingClientRect();
   const blur = flight ? parseFloat(getComputedStyle(flight.layer.firstElementChild).filter.match(/blur\(([-\d.]+)px\)/)?.[1]) || 0 : 0;
   clearFlight();
   if (!card?.isConnected || reduced.matches || !phone.matches || !card.naturalWidth) return;
   const to = contentRect(card), from = live || contentRect(detailArt);
   if (!visible(to) || !visible(from)) return;
   card.style.opacity = '0';
   // Land back in the card while the sheet drops away (inside the 190 ms exit).
   fly(from, to, card, {duration: 180, easing: 'cubic-bezier(.23,1,.32,1)', blur});
   if (flight) flight.source = card; else card.style.removeProperty('opacity');
  }
 }

 /* ───────── Loading skeleton (native hub) ───────── */
 const stateBox = $('catalogState');
 if (nativeHub && stateBox && !stateBox.querySelector('.ux-skeleton')) {
  const sk = document.createElement('div'); sk.className = 'ux-skeleton'; sk.setAttribute('aria-hidden', 'true');
  sk.innerHTML = '<i></i><i></i><i></i>'; stateBox.prepend(sk);
 }

 /* ───────── Empty search state ───────── */
 function makeEmpty(onClear) {
  const box = document.createElement('div'); box.className = 'ux-empty'; box.hidden = true; box.setAttribute('role', 'status');
  box.innerHTML = '<span class="ux-empty-mark" aria-hidden="true"></span><p>Ничего не нашлось. Попробуй другое название.</p><button type="button" class="quiet ux-empty-clear">Очистить</button>';
  box.querySelector('button').addEventListener('click', onClear);
  return box;
 }
 function clearInput(input) {
  if (!input) return;
  input.value = ''; input.dispatchEvent(new Event('input', {bubbles: true}));
  input.focus({preventScroll: true}); input.blur();
 }
 const noGames = $('noGames');
 if (nativeHub && noGames) {
  const empty = makeEmpty(() => clearInput($('search')));
  noGames.after(empty); noGames.classList.add('ux-has-empty');
  const sync = () => { empty.hidden = noGames.hidden; };
  new MutationObserver(sync).observe(noGames, {attributes: true, attributeFilter: ['hidden']}); sync();
 }
 if (!nativeHub) {
  let empty = null, frame = 0;
  const check = () => {
   frame = 0;
   const tools = document.querySelector('.guest-catalog-tools'), input = tools?.querySelector('input[type=search]'), grid = $('games');
   if (!tools || !input || !grid) return;
   if (!empty) { empty = makeEmpty(() => clearInput(input)); grid.after(empty); }
   const shown = [...document.querySelectorAll('.guest-games>.guest-game')].some(n => !n.hidden && n.getClientRects().length);
   empty.hidden = !input.value.trim() || shown;
   tools.style.setProperty('--ux-search-mid', (input.offsetTop + input.offsetHeight / 2) + 'px');
  };
  document.addEventListener('input', e => { if (e.target instanceof HTMLInputElement && e.target.type === 'search' && !frame) frame = requestAnimationFrame(check); }, true);
  addEventListener('resize', () => { if (!frame) frame = requestAnimationFrame(check); }, {passive: true});
 }

 /* ───────── Host tab: no focus ring on arrival ─────────
    dialog.show() focuses the first control; on a touch arrival that painted a
    focus ring around "Large QR" every time. Focus the panel title instead (same
    pattern as the Top sheet), unless the user is navigating by keyboard. */
 const hostPanel = $('hostPanel'), hostTitle = $('hostTitle');
 if (nativeHub && hostPanel && hostTitle) {
  hostTitle.tabIndex = -1;
  let was = hostPanel.open;
  new MutationObserver(() => {
   const open = hostPanel.open;
   if (open && !was && performance.now() - keyboardAt > 1500) queueMicrotask(() => {
    const a = document.activeElement;
    if (hostPanel.contains(a) && a !== hostTitle && a?.matches?.('button,[role=switch]')) hostTitle.focus({preventScroll: true});
   });
   was = open;
  }).observe(hostPanel, {attributes: true, attributeFilter: ['open']});
 }

 /* ───────── Counter pop (votes) ───────── */
 const popped = new WeakMap();
 function pop(el) {
  if (reduced.matches || !el.isConnected || !el.getClientRects().length) return;
  popped.get(el)?.cancel();
  popped.set(el, el.animate([{scale: '1'}, {scale: '1.16'}, {scale: '1'}], {duration: 380, easing: popEase, composite: 'replace'}));
 }
 const lastText = new WeakMap();
 new MutationObserver(records => {
  for (const r of records) {
   const node = r.type === 'characterData' ? r.target.parentElement : r.target;
   const el = node?.closest?.('.lp-card-votes,.hp-menu-counter-value,.guest-ballot-status .hp-menu-counter-value');
   if (!el) continue;
   const text = el.textContent; if (lastText.get(el) === text) continue;
   const had = lastText.has(el); lastText.set(el, text); if (had && text.trim()) pop(el);
  }
 }).observe(body, {subtree: true, childList: true, characterData: true});

 /* ───────── Join confetti (first profile only) ───────── */
 const joinForm = $('joinForm');
 if (joinForm && !nativeHub) {
  joinForm.addEventListener('submit', e => {
   if (body.classList.contains('profile-editing') || reduced.matches) return;
   const button = e.submitter || joinForm.querySelector('[type=submit]');
   const r = button?.getBoundingClientRect(); if (!r || !r.width) return;
   const x = r.left + r.width / 2, y = r.top + r.height / 2;
   requestAnimationFrame(() => confetti(x, y));
  });
 }
 function confetti(x, y) {
  const layer = document.createElement('div'); layer.className = 'ux-confetti'; layer.setAttribute('aria-hidden', 'true');
  const colors = ['#c8ff2e', '#a96aff', '#ff6fb5', '#5ce9ef', '#ffc949', '#ffffff'];
  const n = 26, anims = [];
  for (let i = 0; i < n; i++) {
   const p = document.createElement('i'); if (i % 3 === 0) p.className = 'ux-dot';
   p.style.background = colors[i % colors.length];
   layer.append(p);
   const angle = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.1;
   const speed = 150 + Math.random() * 190, dx = Math.cos(angle) * speed, up = Math.sin(angle) * speed;
   const spin = (Math.random() - .5) * 720, fall = 260 + Math.random() * 220;
   anims.push(p.animate([
    {transform: `translate(${x}px,${y}px) rotate(0deg) scale(.6)`, opacity: 1},
    {transform: `translate(${x + dx * .7}px,${y + up * .9}px) rotate(${spin * .5}deg) scale(1)`, opacity: 1, offset: .35},
    {transform: `translate(${x + dx}px,${y + up + fall}px) rotate(${spin}deg) scale(.9)`, opacity: 0}
   ], {duration: 1050 + Math.random() * 350, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'both'}));
  }
  body.append(layer);
  Promise.allSettled(anims.map(a => a.finished)).then(() => layer.remove());
  setTimeout(() => layer.remove(), 2200);
 }

 window.HeyPalsAppUX = Object.freeze({revision: 'app-ux-20261005.1'});
})();
