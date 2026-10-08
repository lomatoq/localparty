/* Shared presentation only. Game engines own outcomes, scores and input. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('hp-ui');
  const roles = {
    '.screen-podium': 'hp-results',
    '[data-party-game=mines] #status,[data-party-game=push] #moveStatB,[data-party-game=shrink] #moveStatB,[data-party-game=bomb] #moveStatB': 'hp-readout',
    '.game h3,.lp-card h3,.lp-card-title,#choiceName,#choiceTitle,#activeTitle,#headerGame,.hp-result-game,.mode-label,.mode-card b,#modeName,#modeTitle': 'hp-game-title',
    '#waitingRules,body.tv-screen #waiting': 'hp-waiting',
    '#pauseOverlay,body.tv-screen #paused': 'hp-pause',
    '.phone-stat,.move-stats>div,.knife-stats>div,.punch-stats>div,#punchResult>div': 'hp-stat',
    '.knife-stats,.move-stats,.punch-stats,#punchResult': 'hp-stat-group',
    '.phone-stat strong,.move-stats b,.knife-stats b,.punch-stats strong,#punchResult strong,#knivesLeft,#hudValue,.podium-rank,.podium-score,#ss-power,.ss-player-score,#mineCoordinate': 'hp-number',
    '.phone-stat small,.move-stats small,.knife-stats small,.knife-count small,.punch-stats small,#punchResult small': 'hp-stat-label',
    '#playerName,#headerName,.podium-name,.hp-result-name,.pname,#ss-name,.ss-player-copy b': 'hp-player-name',
    '#waitingTitle,#pauseTitle,[data-party-game=punchmeter] #status,.turn,.stage-note>b,#ss-turn': 'hp-heading',
    '[data-party-game=tankarena] #fire,#throwBtn>span,[data-party-game=punchmeter] #action,[data-party-game=kart] #gasBtn,[data-party-game=spy] .secret-cover>b,[data-party-game=western_duel] #fire,#ss-fire': 'hp-action-primary',
    'button.catalog-vote,button.lime,button.primary,button.start-game,button.ss-primary,button.join-btn,button.fire,button.fire-btn,button.throw-btn,button.gas-btn,#draw,#action,#fire,#fireBtn,#forward,#motion,#readyButton,#choiceStart,#activeController,#joinButton,#joinBtn,#start,#startBtn,#marbleFire,#tankFire,#mineOpen,#drop,#guessed,#confirmGuess,#spyGuessBtn,#forcePlayBtn,#nextTurnPhone,#rematchBtn,#againBtn': 'hp-action-primary',
    '[role=tab],.deck-tabs button,.segmented button,.segmented-control button,.mode-switch button,.mode-tabs button,.tabs button,.hand-picker button,.hand-select button,.hand-btn,#leftHand,#rightHand': 'hp-selector-label',
    '[data-party-game=crane] #active,[data-party-game=kart] #statusStrip': 'hp-state-title',
    '[data-party-game=chaos] #roundSub,[data-party-game=monster] .secret-box>div:last-child>b,[data-party-game=monster] .secret-box>div:last-child>span,[data-party-game=tanks] #statusText,[data-party-game=tanks] #controls .control>em,[data-party-game=tankarena] #joy>small,#ss-aim-pad>span>small,[data-party-game=pocket_siege] #turnHint,[data-party-game=marble_bloom] .padlabel,[data-party-game=marble_bloom] .ammo-note,[data-party-game=monster] .instruction,[data-party-game=monster] .seam-help,[data-party-game=spy] #questionTip,[data-party-game=spy] .bottom-note,[data-party-game=spy] #secretSub,[data-party-game=bow_club] #calibrationHint,[data-party-game=bow_club] #draw>small,p:not(.hp-player-name):not(.hp-state-title):not(.hp-heading):not([data-no-translate]),#guessForm>label,.rules li,.rules .rule>span,.host-rules li,.waiting-details p,.rule-row p,.game-info p,.lp-card p,.quickrules,.explanation,.secret-cover>span,.joystick-hints,.joystick-wrap>small,#jengaForce,#detailGoal,#detailControls,#detailWin,#botHint,#ss-throw-hint small,#gameObjective:not(:has(.objective-title)),.hint,.subtitle,.muted,.help,.description,.status-text,.phone-panel>p,.waiting-goal,#waitingHint,#pauseHint,#help,#motionFeedback,#throwBtn small,#hudProgress,[data-party-game=jenga] #notice,#ss-personal,#ss-help,#mineHelp,#hockeyHelp': 'hp-copy',
  };
  function classifyTVValue(node) {
    if (!node) return;
    node.dataset.hpValueRole = node.hasAttribute('data-no-translate') ? 'name' : (/^[\d\s:.,/×+−–%\-]+$/.test(node.textContent.trim()) || /^\d+(?:\.\d+)?\s*[smс]$/i.test(node.textContent.trim())) ? 'numeric' : 'state';
  }
  // A measured floor preserves large CTAs and local button typography. Some
  // legacy controllers style nested labels with !important, so a class alone
  // cannot reliably protect their text at a 320px viewport.
  const controlSelector = 'button,[role="button"],summary,select,input[type="button"],input[type="submit"]';
  const labelOriginalStyles = new WeakMap();
  const pendingControls = new Set();
  let readabilityFrame = 0;
  function queueControlReadability(scope = document) {
    if (scope.matches?.(controlSelector)) pendingControls.add(scope);
    const owner = scope.closest?.(controlSelector);
    if (owner) pendingControls.add(owner);
    scope.querySelectorAll?.(controlSelector).forEach(node => pendingControls.add(node));
    if (!readabilityFrame && pendingControls.size) readabilityFrame = requestAnimationFrame(applyControlReadability);
  }
  function applyControlReadability() {
    readabilityFrame = 0;
    const mobile = innerWidth <= 850 && !root.classList.contains('party-host') && !document.body.classList.contains('tv-screen');
    const paints=[];
    for (const control of pendingControls) {
      if (!control.isConnected) continue;
      const labels = new Set([control]);
      const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
      let text;
      while ((text = walker.nextNode())) if (/[\p{L}\p{N}]/u.test(text.nodeValue) && !text.parentElement.closest('svg,script,style,option')) labels.add(text.parentElement);
      for (const label of labels) {
        // Editorial eyebrow is metadata inside a large button, not its action label.
        if (label.closest('.hp-popup-back,[data-action-fit]')) continue;
        if (label.matches('#choiceStrip .native-choice-copy > .eyebrow, #choiceMeta, #choiceMeta *, .stats-identity > small, .stats-score > small, .stats-you, .rank-stats > span, .rank-stats > small')) continue;
        const previous = labelOriginalStyles.get(label),css=mobile?getComputedStyle(label):null;
        if (previous && mobile && parseFloat(css.fontSize) >= 14) continue;
        const needsSize=mobile&&label.getClientRects().length&&css.visibility!=='hidden'&&/[\p{L}\p{N}]/u.test(label.textContent||label.value||'')&&parseFloat(css.fontSize)<14;
        if(previous||needsSize)paints.push(()=>{
          if(previous){if(previous.value)label.style.setProperty('font-size',previous.value,previous.priority);else label.style.removeProperty('font-size');label.classList.remove('hp-control-readable');}
          if(!needsSize)return;
          if(!previous)labelOriginalStyles.set(label,{value:label.style.getPropertyValue('font-size'),priority:label.style.getPropertyPriority('font-size')});
          label.classList.add('hp-control-readable');label.style.setProperty('font-size','14px','important');
        });
      }
    }
    for(const paint of paints)paint();
    pendingControls.clear();
  }
  // Passive information gets a different surface from controls. Never decorate
  // a container that owns an input, a gesture pad, or game artwork.
  const infoSelector = '.hp-stat-group,.western-stats,.combat-stats,.phone-meta,.phone-stat,.status-card,.phone-status,.ss-heading,.arena-status,.info-card,.info-panel';
  const infoInteractive = 'button,input,select,textarea,a[href],[role="button"],[role="application"],canvas';
  function decorateInfo(scope) {
    const ancestor = scope.closest?.('.hp-info-card');
    if (ancestor?.querySelector(infoInteractive)) ancestor.classList.remove('hp-info-card','hp-info-anchor');
    const candidates = [...(scope.matches?.(infoSelector) ? [scope] : []), ...(scope.querySelectorAll?.(infoSelector) || [])];
    for (const node of candidates) {
      if (node.matches(infoInteractive) || node.querySelector(infoInteractive) || node.parentElement?.closest('.hp-info-card')) continue;
      node.classList.add('hp-info-card');
    }
  }
  function enhance(scope = document) {
    queueControlReadability(scope);
    for (const [selector, name] of Object.entries(roles)) {
      if (scope.matches?.(selector)) scope.classList.add(name);
      scope.querySelectorAll?.(selector).forEach(node => node.classList.add(name));
    }
    // The primary role owns weight even when legacy game IDs use !important rules.
    const primaries = [...(scope.querySelectorAll?.('button.hp-action-primary') || [])];
    if (scope.matches?.('button.hp-action-primary')) primaries.push(scope);
    for (const button of primaries) {
      button.style.setProperty('font-weight', '900', 'important');
      for (const label of button.querySelectorAll(':scope > span:not(.hp-button-icon):not(.hp-copy):not(.hp-number):not(.hp-player-name),:scope > b,:scope > strong')) label.style.setProperty('font-weight', '900', 'important');
    }
    decorateInfo(scope);
  }
  function start() {
    enhance();
    classifyTVValue(document.getElementById('gameTitle'));
    document.querySelectorAll('.hp-readout').forEach(classifyTVValue);
    // Child insertion only: avoid a full-document scan on each game snapshot.
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes' && record.oldValue === record.target.getAttribute(record.attributeName)) continue;
        if (record.target.id === 'gameTitle' || record.target.classList?.contains('hp-readout')) classifyTVValue(record.target);
        if (record.type === 'attributes') queueControlReadability(record.target);
        if (record.target.nodeType === 1 && record.target.closest?.(controlSelector)) queueControlReadability(record.target);
        for (const node of record.addedNodes) if (node.nodeType === 1) enhance(node);
      }
    });
    addEventListener('resize', () => queueControlReadability());
    document.fonts?.ready.then(() => queueControlReadability());
    document.addEventListener('click', event => queueControlReadability(event.target.closest('dialog') || event.target.closest(controlSelector) || event.target), {capture:true});
    observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['data-no-translate', 'hidden', 'open', 'class']});
  }
  /** A place owns its award and number; identity is always a separate column. */
  function createPlace(rank, {award = 'cup', className = ''} = {}) {
    const place = document.createElement('span');
    place.className = `hp-place ${className}`.trim();
    const valid = Number.isInteger(Number(rank)) && Number(rank) > 0;
    place.dataset.place = valid ? String(rank) : '';
    place.dataset.placeDigits = valid ? String(String(rank).length) : '0';
    if (valid && Number(rank) <= 3) {
      const image = document.createElement('img');
      image.className = 'hp-award hp-place-award';
      if (award === 'cup' && Number(rank) === 1) image.classList.add('hp-result-crown');
      image.src = `/assets/awards/${award === 'medal' ? 'medal' : 'cup'}-${['gold','silver','bronze'][Number(rank)-1]}.png`;
      image.alt = ''; image.setAttribute('aria-hidden', 'true'); image.decoding = 'async';
      place.append(image);
    }
    const digit = document.createElement('span');
    digit.className = 'hp-place-digit'; digit.textContent = valid ? String(rank) : '—';
    place.append(digit);
    return place;
  }
  /** Entries arrive in engine order. Rank is explicit: no UI tie-break guesses. */
  function renderResults(container, entries, {selfId, label = ''} = {}) {
    const list = document.createElement('ol');
    list.className = 'hp-result-list';
    if (label) list.setAttribute('aria-label', label);
    entries.forEach(entry => {
      const row = document.createElement('li');
      row.className = 'hp-result-row';
      if (entry.id === selfId) row.dataset.self = 'true';
      row.append(createPlace(entry.rank, {className:'hp-result-rank'}));
      for (const [role, value] of [['name', entry.name], ['value', entry.value ?? entry.score ?? '—']]) {
        const node = document.createElement('span');
        node.className = `hp-result-${role}`;
        node.textContent = String(value ?? '');
        if (role === 'name') node.dataset.noTranslate = '';
        row.append(node);
      }
      list.append(row);
    });
    container.replaceChildren(list);
    return list;
  }
  window.HeyPalsUI = Object.freeze({enhance, createPlace, renderResults});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
/* Scroll regions own their edge fades; fixed headings/actions stay outside. */
(() => {
 const lists = '#statsBody,#rulesBody,#catalogBody,#catalogQuick,#nearbyList,#waitingContent,#waitingRoster,.waiting-goal,.waiting-rules-body,.hp-result-scroll,.hp-result-list,.hp-results,#resultStats,#tvBrowse,#tvPodiumTail,.company-people,#roomPlayers,#roster,.dialog-body,.dialog-content,.scroll-area,.scroll-content,.weapon-list,.shop-items,.arsenal-list,.lp-select-menu,#board,#players,#scoreList,#voteList,#playRoster,#quizRosterScroll,#ss-scoreboard,#ss-results,.party-standings-board,.player-list,.leaderboard,.score-panel,#messages,#explanation,.broadcast-feed,.poker-quickrules p';
 const panels = 'dialog,[role="dialog"],.native-sheet,.sheet-card,.drawer-panel,#pauseOverlay,.overlay-panel,#lobbyOverlay,#tvSidebar,.company,.evening-console,.screen-standings,.screen-sidebar,.roster-card,.side-panel,.lp-duel-sidebar,.naval-console>details';
 const horizontal = '#tvRemoteGenres,#catalogFilters,.catalog-filters,.native-genres';
 const protectedContent = 'header,.native-sheet-head,.drawer-head,.drawer-close,.native-actions,.room-actions,.reveal-actions,.ready-actions,.loadout-dock,.lp-update-actions,.native-start-bots-head,[data-close],form[method="dialog"]';
 const regions = new Map(), dirtyRegions = new Set(); let frame = 0, discoveryPending = false;
 const setData = (node, key, value) => { value = String(value); if (node.dataset[key] !== value) node.dataset[key] = value; };
 const toggle = (node, name, enabled) => { if (node.classList.contains(name) !== enabled) node.classList.toggle(name, enabled); };
 const setStyle = (node, key, value) => { if (node.style.getPropertyValue(key) !== value) node.style.setProperty(key, value); };
 function clearItem(node) {
  toggle(node, 'hp-soft-scroll-item', false);
  for (const key of ['--hp-scroll-item-top-edge','--hp-scroll-item-top-solid','--hp-scroll-item-bottom-solid','--hp-scroll-item-bottom-edge']) if (node.style.getPropertyValue(key)) node.style.removeProperty(key);
 }
 function contentChildren(panel) {
  const result = [];
  function visit(node, direct = false) {
   const css = getComputedStyle(node);
   if (node.matches(protectedContent) || direct && node.matches('h1,h2,h3,button,summary') || ['fixed','sticky'].includes(css.position) || node.matches('script,style,canvas')) return;
   // Descend through a mixed wrapper rather than masking its heading or actions.
   if (node.matches('#pauseOverlay > div') || node.querySelector(protectedContent)) { for (const child of node.children) visit(child, node.matches('#pauseOverlay > div')); return; }
   result.push(node);
  }
  for (const child of panel.children) visit(child, true);
  return result;
 }
 function update() {
  frame = 0;
  if (discoveryPending) { discoveryPending = false; discover(); }
  const work = [...dirtyRegions], paints = []; dirtyRegions.clear();
  for (const node of work) {
   const record = regions.get(node); if (!record) continue;
   if (!node.isConnected) { resize.unobserve(node); node.removeEventListener('scroll', schedule); for (const item of record.items) clearItem(item); regions.delete(node); continue; }
   const css = getComputedStyle(node);
   const bounded = node.clientHeight > 0 && /^(auto|scroll)$/.test(css.overflowY) && node.scrollHeight > node.clientHeight + 2;
   const above = bounded && node.scrollTop > 1, below = bounded && node.scrollTop + node.clientHeight < node.scrollHeight - 1;
   // Genre/chip strips own a horizontal mask only when they do not also scroll vertically.
   const boundedX = record.horizontal && !bounded && node.clientWidth > 0 && /^(auto|scroll)$/.test(css.overflowX) && node.scrollWidth > node.clientWidth + 2;
   const left = boundedX && node.scrollLeft > 1, right = boundedX && node.scrollLeft + node.clientWidth < node.scrollWidth - 1;
   const nextItems = new Set(record.panel && bounded ? contentChildren(node) : []);
   paints.push(() => {
   setData(node, 'scrollLeft', left); setData(node, 'scrollRight', right);
   toggle(node, 'hp-soft-scroll-x', boundedX);
   setData(node, 'scrollAbove', above); setData(node, 'scrollBelow', below);
   toggle(node, 'hp-soft-scroll', bounded && !record.panel);
   toggle(node, 'hp-soft-scroll-panel', bounded && record.panel);
   for (const item of record.items) if (!nextItems.has(item)) clearItem(item);
   record.items = nextItems;
   });
   if (!record.panel || !bounded) continue;
   const viewport = node.getBoundingClientRect(), top = viewport.top + node.clientTop, bottom = top + node.clientHeight;
   for (const item of nextItems) {
    const rect = item.getBoundingClientRect();
    const fadeTop = above && rect.top < top + 16 && rect.bottom > top;
    const fadeBottom = below && rect.bottom > bottom - 24 && rect.top < bottom;
    if (!fadeTop && !fadeBottom) { paints.push(() => clearItem(item)); continue; }
    const topEdge = fadeTop ? top - rect.top : 0;
    const bottomEdge = fadeBottom ? bottom - rect.top : rect.height;
    paints.push(() => {
    toggle(item, 'hp-soft-scroll-item', true);
    setStyle(item, '--hp-scroll-item-top-edge', `${topEdge}px`);
    setStyle(item, '--hp-scroll-item-top-solid', `${fadeTop ? topEdge + 16 : 0}px`);
    setStyle(item, '--hp-scroll-item-bottom-solid', `${fadeBottom ? bottomEdge - 24 : rect.height}px`);
    setStyle(item, '--hp-scroll-item-bottom-edge', `${bottomEdge}px`);
    });
   }
  }
  // Measure every region before painting masks: no read/write layout thrashing.
  for (const paint of paints) paint();
 }
 function queueUpdate() { if (!frame) frame = requestAnimationFrame(update); }
 function schedule(event) {
  if (event?.type === 'scroll' && regions.has(event.currentTarget)) dirtyRegions.add(event.currentTarget);
  else for (const node of regions.keys()) dirtyRegions.add(node);
  queueUpdate();
 }
 const resize = new ResizeObserver(entries => { for (const {target} of entries) dirtyRegions.add(target); queueUpdate(); });
 function discover() {
  for (const node of document.querySelectorAll(`${lists},${panels},${horizontal}`)) {
   if (regions.has(node) || node.closest('.fresh-track,.fresh-viewport,[data-hp-no-scroll-fade]')) continue;
   const panel = node.matches(panels) && !node.matches(lists) || !!node.querySelector(':scope > h1,:scope > h2,:scope > h3,:scope > header,:scope > .native-sheet-head');
   setData(node, 'hpScrollRegion', panel ? 'panel' : 'content');
   regions.set(node, {panel, horizontal:node.matches(horizontal), items:new Set()}); dirtyRegions.add(node); node.addEventListener('scroll', schedule, {passive:true}); resize.observe(node);
  }
 }
 function start() {
  discover(); schedule();
  const candidates = `${lists},${panels},${horizontal}`;
  new MutationObserver(records => {
   for (const record of records) {
    const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
    if (!target) continue;
    if (record.type === 'attributes') {
     if (record.oldValue === target.getAttribute(record.attributeName)) continue;
     if (target.classList.contains('hp-soft-scroll-item') && ['style','class'].includes(record.attributeName)) continue;
     // Knob transforms, particles and counter effects cannot change a sibling list.
     for (const node of regions.keys()) if (target === node || target.contains(node) || node.contains(target)) dirtyRegions.add(node);
    } else {
     for (const node of regions.keys()) if (!node.isConnected || node.contains(target)) dirtyRegions.add(node);
    }
    if (record.type === 'childList') for (const node of record.addedNodes) {
     if (node.nodeType === 1 && (node.matches(candidates) || node.querySelector(candidates))) discoveryPending = true;
    }
    if (record.type === 'attributes' && record.attributeName === 'class' && target.matches(candidates) && !regions.has(target)) discoveryPending = true;
   }
   if (dirtyRegions.size || discoveryPending) queueUpdate();
  }).observe(document.body, {childList:true,subtree:true,characterData:true,attributes:true,attributeOldValue:true,attributeFilter:['open','hidden','class','style']});
  document.addEventListener('load', schedule, {capture:true});
  document.addEventListener('toggle', schedule, {capture:true});
  document.fonts?.ready.then(schedule); addEventListener('resize', schedule);
 }
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
/* A pre-round instruction must never float across the controller's readouts. */
(() => {
 const root=document.documentElement;let pending=false;
 const overlaps=(a,b)=>a.width>0&&a.height>0&&b.width>0&&b.height>0&&a.left<b.right&&a.right>b.left&&a.top<b.bottom+12&&a.bottom>b.top-12;
 function check(){pending=false;if(!root.classList.contains('party-player'))return;
  const panels=[...document.querySelectorAll('#combatStats,.combat-stats,.phone-meta,.phone-hud,.phone-stats,.stat-grid')].filter(e=>!e.hidden&&getComputedStyle(e).display!=='none');
  for(const hint of document.querySelectorAll('.instruction,.hint,.round-hint,.round-notice,#tankHint,#turnHint,#status')){
   const style=getComputedStyle(hint);if(!['absolute','fixed'].includes(style.position)||hint.hidden||style.display==='none')continue;
   if(panels.some(panel=>!panel.contains(hint)&&!hint.contains(panel)&&overlaps(hint.getBoundingClientRect(),panel.getBoundingClientRect())))hint.classList.add('hp-safe-intro-flow');
  }
 }
 const queue=()=>{if(!pending){pending=true;requestAnimationFrame(check)}};
 const start=()=>{new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});new MutationObserver(queue).observe(root,{attributes:true,attributeFilter:['data-party-phase']});new ResizeObserver(queue).observe(document.body);queue()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();addEventListener('resize',queue,{passive:true});
})();

/* Shared stick feel: every game keeps its own input math and inline knob
   transform. This layer only marks the touched stick so CSS can acknowledge
   the press and spring the knob home on release instead of teleporting. */
(() => {
 if(window.HeyPalsStickFeel)return;
 const zones='#joystickZone,#jengaJoystick,#joy,#hockeyJoy,#droneStick',active=new Map();
 const baseOf=zone=>zone.matches('#joystickZone')?zone.querySelector('#joystickBase')||zone:zone;
 function end(e){const base=active.get(e.pointerId);if(!base)return;active.delete(e.pointerId);if(![...active.values()].includes(base))base.removeAttribute('data-hp-stick');}
 addEventListener('pointerdown',e=>{const zone=e.target instanceof Element&&e.target.closest(zones);if(!zone||zone.matches('[aria-disabled=true],[hidden]'))return;const base=baseOf(zone);active.set(e.pointerId,base);base.setAttribute('data-hp-stick','active');},{capture:true,passive:true});
 for(const name of ['pointerup','pointercancel'])addEventListener(name,end,{capture:true,passive:true});
 addEventListener('blur',()=>{for(const base of active.values())base.removeAttribute('data-hp-stick');active.clear();});
 window.HeyPalsStickFeel=Object.freeze({revision:'stick-feel-20261001.1'});
})();

/* Stat glyphs: every controller readout label (WINS, BOMB, HEALTH, BEST, LAP…)
   gets a Game Icon Pack silhouette chosen by meaning, in English or Russian.
   The label only receives data attributes and the glyph is painted by CSS
   ::before as a mask, so games that rewrite label text every tick cannot make
   it flicker. A value change bumps the glyph once. Presentation only. */
(() => {
 if(window.HeyPalsStatGlyphs)return;
 const root=document.documentElement;
 const labels='.hp-stat-label,.western-stats small,.combat-stats small,.phone-meta small,.hp-stat-group small,.phone-stat>span:first-child';
 const table=[
  [/побед|\bwins?\b/i,'crown','gold'],[/бомб|\bbomb/i,'bomb','ember'],[/здоров|\bhealth\b|\bhp\b|жизн|\blives?\b/i,'health','rose'],
  [/оруж|\bweapon/i,'bullet','lilac'],[/лучш|рекорд|\bbest\b/i,'lightning','gold'],[/попыт|\battempts?\b/i,'hit-effect','lilac'],
  [/фальстарт|false start/i,'cross','rose'],[/мест|\bplace\b|\brank/i,'ranking','lilac'],[/круг|\blaps?\b/i,'formula-racing','lilac'],
  [/скорост|\bspeed\b/i,'rocket','lilac'],[/раунд|\bround\b/i,'clock','lilac'],[/врем|\btime\b|секунд/i,'clock','lilac'],
  [/нож|\bknives?\b/i,'dagger','lilac'],[/стрел|\barrows?\b/i,'bow','lilac'],[/убий|\bkills?\b|фраг/i,'target','ember'],
  [/смерт|\bdeaths?\b/i,'ghost','lilac'],[/статус|\bstatus\b|щит|\bshield/i,'shield','lilac'],[/этаж|высот|\bfloors?\b|\bheight\b/i,'arrow-up','lilac'],
  [/блок|\bblocks?\b/i,'puzzle-01','lilac'],[/флаг|\bflags?\b/i,'shield','lilac'],
  [/фрейм|\bframes?\b/i,'grid','lilac'],[/серия|\bstreak/i,'stamina','ember'],[/ворот|\bgate\b/i,'gate','lilac'],[/цел[иье]|\btargets?\b/i,'target','ember'],
  [/энд|\bend\b/i,'clock','lilac'],[/камен|камн|\bstones?\b/i,'stone','lilac'],
  [/очк|счёт|счет|итог|\bpoints?\b|\bscore\b|\btotal\b/i,'trophy','gold']
 ];
 const pick=text=>table.find(([re])=>re.test(text));
 const painted=new Set();let sheet=null;
 // 3D icons generated for HeyPals (public/assets/icons/atlas-stat-glyphs/*.webp).
 const art3d={crown:'crown',bomb:'bomb',health:'heart',lightning:'lightning','formula-racing':'flag-lap',trophy:'trophy',target:'target',ghost:'ghost',shield:'shield',clock:'clock',dagger:'dagger',bow:'bow',stamina:'flame',grid:'grid',gate:'gate',stone:'stone',rocket:'rocket','hit-effect':'hit',cross:'cross',ranking:'ranking'};
 function paint(name){
  if(painted.has(name))return true;
  if(art3d[name]){
   if(!sheet){sheet=document.createElement('style');sheet.dataset.hpStatGlyphs='';document.head.append(sheet);}
   const url=`/assets/icons/atlas-stat-glyphs/${art3d[name]}.webp`,probe=new Image();
   probe.onload=()=>sheet.append(`html.party-player [data-hp-glyph="${name}"]::before{-webkit-mask:none!important;mask:none!important;background:url("${url}") center/contain no-repeat!important;filter:drop-shadow(0 1px 2px #0006)!important;width:1.45em;height:1.45em;max-width:24px;max-height:24px}\n`);
   probe.src=url;
  }
  const make=window.PartyIcons?.create;if(typeof make!=='function')return false;
  const svg=make(name);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
  const url='url("data:image/svg+xml,'+encodeURIComponent(svg.outerHTML)+'")';
  if(!sheet){sheet=document.createElement('style');sheet.dataset.hpStatGlyphs='';document.head.append(sheet);}
  sheet.append(`html.party-player [data-hp-glyph="${name}"]::before{-webkit-mask-image:${url};mask-image:${url}}\n`);
  painted.add(name);return true;
 }
 const values=new WeakMap();
 function decorate(label){
  if(!(label instanceof Element)||!label.isConnected||label.closest('button,[role=button],.hp-result-row,svg'))return;
  const hit=pick((label.textContent||'').trim());
  if(!hit){if(label.dataset.hpGlyph){delete label.dataset.hpGlyph;delete label.dataset.hpGlyphTint;}return;}
  if(!paint(hit[1]))return;
  if(label.dataset.hpGlyph!==hit[1])label.dataset.hpGlyph=hit[1];
  if(label.dataset.hpGlyphTint!==hit[2])label.dataset.hpGlyphTint=hit[2];
  const stat=label.parentElement;if(!stat)return;
  const value=[...stat.children].filter(n=>n!==label).map(n=>n.textContent).join('|'),previous=values.get(label);values.set(label,value);
  if(previous===undefined||previous===value||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  label.removeAttribute('data-hp-glyph-bump');void label.offsetWidth;label.setAttribute('data-hp-glyph-bump','');
  clearTimeout(label.__hpBump);label.__hpBump=setTimeout(()=>label.removeAttribute('data-hp-glyph-bump'),460);
 }
 let pending=false;
 function scan(){pending=false;if(!root.classList.contains('party-player'))return;document.querySelectorAll(labels).forEach(decorate);}
 const queue=()=>{if(!pending){pending=true;requestAnimationFrame(scan);}};
 const start=()=>{new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});queue();setTimeout(queue,300);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.HeyPalsStatGlyphs=Object.freeze({revision:'stat-glyphs-20261001.2'});
})();

/* Search clear: shell search fields get a 44px × that appears only while the
   field has text, clears with one tap (firing the normal input event) and keeps
   focus. WebKit's own cancel button is hidden by the custom field styling. */
(() => {
 if(window.HeyPalsSearchClear)return;
 function attach(input){
  if(input.dataset.hpClear||input.closest('[data-party-game]')||document.documentElement.classList.contains('party-managed'))return;
  const host=input.parentElement;if(!host)return;input.dataset.hpClear='';
  const button=document.createElement('button');button.type='button';button.className='hp-search-clear';button.setAttribute('aria-label','Clear search');button.hidden=!input.value;
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';
  const sync=()=>{button.hidden=!input.value;input.classList.toggle('hp-has-clear',!!input.value);};
  button.addEventListener('click',()=>{input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));sync();input.focus({preventScroll:true});});
  input.addEventListener('input',sync);
  if(getComputedStyle(host).position==='static')host.style.position='relative';
  host.append(button);
 }
 // Attach lazily on the first keystroke: no document-wide observer, which could
 // ping-pong with catalogue re-renders that react to added nodes.
 document.addEventListener('input',e=>{const input=e.target;if(input instanceof HTMLInputElement&&input.type==='search'&&!input.dataset.hpClear){attach(input);input.dispatchEvent(new Event('hp-search-sync'));input.classList.toggle('hp-has-clear',!!input.value);const b=input.parentElement?.querySelector(':scope>.hp-search-clear');if(b)b.hidden=!input.value;}},true);
 window.HeyPalsSearchClear=Object.freeze({revision:'search-clear-20261001.1'});
})();

/* Celebration sprites: small procedural shapes (star, diamond, dot, spark) in
   brand colours. Used for the moment a player turns Ready; bounded, decorative,
   never over another player's name for longer than ~0.8 s. */
(() => {
 if(window.HeyPalsSprites)return;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const colors=['#cfff85','#c6b1ff','#ff8fd0','#ffd36b','#7ee7ff'];
 const shapes=['polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)','polygon(50% 0,100% 50%,50% 100%,0 50%)','circle(50%)','polygon(45% 0,55% 0,55% 100%,45% 100%)'];
 let layer=null;
 // Generated celebration sprites (public/assets/fx/atlas-fx-celebration/*.webp); clip-path shapes stay as fallback.
 const art=['confetti-rect','confetti-star','confetti-diamond','confetti-circle','confetti-swirl','confetti-heart','sparkle-4','star-pop'],ready=new Set();
 for(const key of art){const img=new Image();img.decoding='async';img.onload=()=>ready.add(key);img.src='/assets/fx/atlas-fx-celebration/'+key+'.webp';}
 function burst(x,y,{count=16,spread=110}={}){
  if(reduced()||document.hidden)return 0;
  if(!layer?.isConnected){layer=document.createElement('div');layer.className='hp-sprite-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);}
  for(let i=0;i<count;i++){
   const s=document.createElement('i'),size=6+Math.random()*8,angle=-Math.PI/2+(Math.random()-.5)*Math.PI*1.5,dist=spread*(.45+Math.random()*.55);
   const key=art[i%art.length];
   s.style.cssText=ready.has(key)?`left:${x}px;top:${y}px;width:${size*1.7}px;height:${size*1.7}px;background:url(/assets/fx/atlas-fx-celebration/${key}.webp) center/contain no-repeat`:`left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${colors[i%colors.length]};clip-path:${shapes[i%shapes.length]}`;
   layer.append(s);
   const a=s.animate([{transform:'translate(-50%,-50%) scale(.4) rotate(0deg)',opacity:1},{transform:`translate(calc(-50% + ${Math.cos(angle)*dist}px),calc(-50% + ${Math.sin(angle)*dist}px)) scale(1) rotate(${(Math.random()-.5)*540}deg)`,opacity:1,offset:.6},{transform:`translate(calc(-50% + ${Math.cos(angle)*dist*1.15}px),calc(-50% + ${Math.sin(angle)*dist*1.15+40}px)) scale(.6) rotate(${(Math.random()-.5)*720}deg)`,opacity:0}],{duration:760+Math.random()*240,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'});
   a.onfinish=()=>s.remove();
  }
  return count;
 }
 // Ready: burst only when this tap turns the player ready (server confirms by
 // flipping aria-pressed to true), from the button's centre.
 document.addEventListener('click',e=>{
  const button=e.target instanceof Element&&e.target.closest('#readyButton');if(!button||button.getAttribute('aria-pressed')==='true')return;
  const r=button.getBoundingClientRect(),start=performance.now();
  const wait=()=>{if(button.getAttribute('aria-pressed')==='true'){burst(r.left+r.width/2,r.top+r.height/2,{count:18,spread:Math.min(160,r.width*.6)});return;}if(performance.now()-start<1500)requestAnimationFrame(wait);};
  requestAnimationFrame(wait);
 },true);
 window.HeyPalsSprites=Object.freeze({burst,revision:'sprites-20261001.1'});
})();

/* Your turn: when a turn heading changes to this player's turn, its card
   springs once with a sheen and a light haptic. Detection is by text so it
   works across games without engine hooks. */
(() => {
 if(window.HeyPalsTurnCue)return;
 const root=document.documentElement;
 const mine=/\b(your (turn|throw|drawing|punch|move|shot))\b|тво[йяё] (ход|бросок|рисунок|удар|очередь)|ты рису|ты ходишь/i;
 const last=new WeakMap();
 let pending=false;
 function check(){pending=false;if(!root.classList.contains('party-player'))return;
  for(const node of document.querySelectorAll('.hp-heading,#ss-turn,.turn,#turnTitle')){
   const text=(node.textContent||'').trim(),was=last.get(node);last.set(node,text);
   if(was===undefined||was===text||!mine.test(text)||mine.test(was)||!node.getClientRects().length)continue;
   const card=node.closest('.hp-info-card,.ss-glass,section,article')||node;
   card.classList.remove('hp-turn-cue');void card.offsetWidth;card.classList.toggle('hp-turn-static',getComputedStyle(card).position==='static');card.classList.add('hp-turn-cue');setTimeout(()=>card.classList.remove('hp-turn-cue','hp-turn-static'),900);
   try{window.LocalPartyNative?.haptic?.([12,40,18]);}catch{}
  }
 }
 const queue=()=>{if(!pending){pending=true;requestAnimationFrame(check);}};
 const start=()=>{new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});queue();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.HeyPalsTurnCue=Object.freeze({revision:'turn-cue-20261001.1'});
})();

/* Procedural avatars: a player without a photo gets a stable two-hue gradient
   derived from their name (same colours on every screen and every night). */
(() => {
 if(window.HeyPalsAvatar)return;
 function hue(name){let h=2166136261;for(const ch of String(name||'?'))h=Math.imul(h^ch.codePointAt(0),16777619);return Math.abs(h)%360;}
 function paint(node,name){if(!node)return;node.dataset.avSeed='';node.style.setProperty('--av-h',String(hue(name)));}
 window.HeyPalsAvatar=Object.freeze({paint,hue});
})();

/* CTA wake: when a primary action becomes available (disabled → enabled), a
   single light ring leaves the button — "now you can". Never loops. */
(() => {
 if(window.HeyPalsCtaWake)return;
 const primary='.hp-action-primary,#readyButton,#choiceStart,.lp-direct-start,.start-game,#fire,#fireBtn,#throwBtn,#ss-fire';
 const last=new WeakMap();
 function wake(button){
  // Host Pick retains its own symmetric availability transition. A second
  // wake ring would restart on re-enabling and force an unnecessary layout.
  if(button.id==='choiceStart'&&document.body.classList.contains('native-shell'))return;
  const now=performance.now();if(now-(last.get(button)||-1e9)<1500)return;last.set(button,now);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!button.getClientRects().length)return;
  button.classList.remove('hp-cta-wake');void button.offsetWidth;button.classList.add('hp-cta-wake');
  setTimeout(()=>button.classList.remove('hp-cta-wake'),720);
 }
 const start=()=>new MutationObserver(records=>{for(const r of records){const b=r.target;if(r.oldValue!==null&&!b.disabled&&b.matches?.(primary))wake(b);}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['disabled'],attributeOldValue:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.HeyPalsCtaWake=Object.freeze({revision:'cta-wake-20261001.1'});
})();

/* Value tick: when a controller readout value really changes (score, place,
   status), it gives one small spring so the eye catches it. Baseline is taken
   silently on first sight; values that change continuously (speed, timers)
   are recognised by their rate and left still, so nothing flickers. Uses the
   independent `scale` property, never the element's own transform. */
(() => {
 if(window.HeyPalsValueTick)return;
 const root=document.documentElement;
 const values='.hp-stat-value,.hp-stat>strong,.hp-stat>b,.hp-stat-group strong,.western-stats strong,.combat-stats strong,.combat-stats b,.phone-meters strong,.phone-meters b,.mine-score-readout strong,#knivesLeft,#arcadeStats strong,#punchResult strong';
 const seen=new WeakMap();let pending=new Set(),frame=0;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function flush(){frame=0;const now=performance.now();if(!root.classList.contains('party-player')){pending.clear();return;}
  for(const el of pending){if(!el.isConnected)continue;const text=(el.textContent||'').trim(),rec=seen.get(el);
   if(!rec){seen.set(el,{text,hits:[]});continue;}
   if(rec.text===text)continue;rec.text=text;rec.hits=rec.hits.filter(t=>now-t<2000);rec.hits.push(now);
   if(rec.hits.length>3||reduced()||document.hidden||!el.getClientRects().length||getComputedStyle(el).display==='inline'||el.getBoundingClientRect().width>160)continue;
   el.classList.remove('hp-value-tick');void el.offsetWidth;el.classList.add('hp-value-tick');
   clearTimeout(el.__hpTick);el.__hpTick=setTimeout(()=>el.classList.remove('hp-value-tick'),420);
  }
  pending.clear();}
 function queue(node){const el=(node.nodeType===1?node:node.parentElement)?.closest?.(values);if(!el)return;pending.add(el);if(!frame)frame=requestAnimationFrame(flush);}
 function start(){
  document.querySelectorAll(values).forEach(el=>seen.set(el,{text:(el.textContent||'').trim(),hits:[]}));
  new MutationObserver(records=>{for(const r of records){queue(r.target);for(const n of r.addedNodes)if(n.nodeType===1&&n.matches?.(values))seen.has(n)||seen.set(n,{text:(n.textContent||'').trim(),hits:[]});}}).observe(document.body,{subtree:true,childList:true,characterData:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.HeyPalsValueTick=Object.freeze({revision:'value-tick-20261005.1'});
})();

/* Panel entrance: when a controller goes live (waiting → countdown/playing,
   or a fresh match after results) its blocks rise in with a short stagger so
   the screen assembles instead of hard-swapping. One shot per entrance; input
   is never blocked (opacity/translate only, pointer events untouched). Pause →
   resume and in-round re-renders do not replay it. */
(() => {
 if(window.HeyPalsPanelEntrance)return;
 const root=document.documentElement;
 const live=new Set(['countdown','playing']);let last=root.dataset.partyPhase||'';
 const visible=e=>{if(!e.getClientRects().length)return false;const s=getComputedStyle(e);return s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05;};
 // Descend through full-screen wrappers (screens, mains) to the element whose
 // children are the actual panels: stat cards, pads, primary actions.
 function blocks(){
  let box=document.body;
  for(let i=0;i<6;i++){const big=[...box.children].filter(e=>visible(e)&&!e.matches('script,style,canvas,dialog')&&e.getBoundingClientRect().height>=innerHeight*.4);const kids=[...box.children].filter(e=>visible(e)&&!e.matches('script,style'));if(big.length!==1||kids.length>2)break;box=big[0];}
  if(box===document.body)return [];
  return [...box.children].filter(e=>visible(e)&&e.getBoundingClientRect().height>=16&&!e.matches('script,style,canvas,dialog')&&getComputedStyle(e).position!=='fixed').slice(0,8);
 }
 function enter(){
  if(document.hidden||!root.classList.contains('party-player'))return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  blocks().forEach((el,i)=>{try{el.animate(reduced?{opacity:[.4,1]}:{opacity:[0,1],translate:['0 10px','0 0']},{duration:reduced?160:340,delay:reduced?0:Math.min(i,7)*45,easing:'cubic-bezier(.23,1,.32,1)',fill:'backwards'});}catch{}});
 }
 function onPhase(){const phase=root.dataset.partyPhase||'';if(phase===last)return;const from=last;last=phase;
  if(live.has(phase)&&!live.has(from)&&from!=='paused'&&from!=='reveal')requestAnimationFrame(()=>requestAnimationFrame(enter));}
 new MutationObserver(onPhase).observe(root,{attributes:true,attributeFilter:['data-party-phase']});
 window.HeyPalsPanelEntrance=Object.freeze({revision:'panel-entrance-20261005.1',enter});
})();
