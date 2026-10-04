/* Opt-in presentation only. The game owns visibility, copy, identity and timing. */
(() => {
  'use strict';
  const rect = value => {
    const left = Number(value?.left ?? value?.x), top = Number(value?.top ?? value?.y);
    const right = Number(value?.right ?? left + Number(value?.width ?? value?.w));
    const bottom = Number(value?.bottom ?? top + Number(value?.height ?? value?.h));
    return [left, top, right, bottom].every(Number.isFinite) && right > left && bottom > top
      ? {left, top, right, bottom} : null;
  };
  const overlaps = (a, b, gap) => a.left < b.right + gap && a.right > b.left - gap
    && a.top < b.bottom + gap && a.bottom > b.top - gap;
  const imageURL = value => {
    if (typeof value !== 'string' || !value) return '';
    try { const url = new URL(value, location.href); return /^(https?:|data:)$/.test(url.protocol) ? url.href : ''; }
    catch { return ''; }
  };
  function create({game = '', host = document.body} = {}) {
    const element = document.createElement('div');
    element.className = 'hp-game-message';
    element.dataset.game = game;
    element.dataset.hpThemePreserve = '';
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    element.setAttribute('aria-atomic', 'true');
    element.hidden = true;
    const identity = document.createElement('span'), portrait = document.createElement('img');
    const icon = document.createElement('span'), copy = document.createElement('div');
    // Generic paragraphs are reclassified as instructional copy by the shared
    // UI adapter. This result carries player identity and keeps its own voice.
    const text = document.createElement('div'), detail = document.createElement('span');
    identity.className = 'hp-game-message__identity';
    identity.setAttribute('aria-hidden', 'true');
    portrait.className = 'hp-game-message__portrait'; portrait.alt = ''; portrait.hidden = true;
    icon.className = 'hp-game-message__icon';
    copy.className = 'hp-game-message__copy';
    text.className = 'hp-game-message__text';
    detail.className = 'hp-game-message__detail'; detail.hidden = true;
    identity.append(portrait, icon); copy.append(text, detail); element.append(identity, copy); host.append(element);
    let current = null, key = null;
    function place() {
      if (!current) return false;
      const scale = Math.max(.65, Math.min(innerWidth / 1280, innerHeight / 720));
      const margin = 16 * scale, gap = 8 * scale;
      const exclusions = [...(window.PARTY_HUD_EXCLUSIONS || []), ...(current.avoid || [])].map(rect).filter(Boolean);
      const capBottom = Math.max(0, ...exclusions.filter(r => r.top < 32 * scale).map(r => r.bottom));
      const center = Number.isFinite(current.anchor?.x) ? current.anchor.x : innerWidth / 2;
      const top = Number.isFinite(current.anchor?.y) ? current.anchor.y : capBottom + 16 * scale;
      element.style.maxWidth = Math.min(460, (innerWidth - margin * 2) / scale) + 'px';
      element.style.transform = `scale(${scale})`;
      element.hidden = false;
      const width = element.offsetWidth * scale, height = element.offsetHeight * scale;
      const left = Math.max(margin, Math.min(center - width / 2, innerWidth - width - margin));
      // The supplied anchor is preferred. Alternatives remain beside that task,
      // rather than moving feedback to an unrelated corner or over an actor.
      const candidates = [top, capBottom + 16 * scale,
        ...exclusions.flatMap(r => [r.bottom + gap, r.top - height - gap])];
      const y = candidates.find(value => value >= margin && value + height <= innerHeight - margin
        && !exclusions.some(r => overlaps({left, top:value, right:left+width, bottom:value+height}, r, gap)));
      if (!Number.isFinite(y)) { element.hidden = true; return false; }
      element.style.left = left + 'px'; element.style.top = y + 'px';
      return true;
    }
    function show(payload = {}) {
      if (!payload.text) { hide(); return false; }
      const nextKey = payload.key ?? payload.text;
      const entering = current === null || key !== nextKey;
      current = payload; key = nextKey;
      element.dataset.kind = payload.kind === 'cue' ? 'cue' : 'round';
      if (text.textContent !== payload.text) text.textContent = payload.text;
      detail.textContent = payload.detail || ''; detail.hidden = !payload.detail;
      const source = imageURL(payload.portrait);
      if (source && portrait.src !== source) portrait.src = source;
      portrait.hidden = !source; element.dataset.portrait = String(!!source);
      const visible = place();
      if (entering && visible) { element.classList.remove('is-entering'); void element.offsetWidth; element.classList.add('is-entering'); }
      return visible;
    }
    function hide() { current = null; key = null; element.hidden = true; element.classList.remove('is-entering'); }
    portrait.addEventListener('error', () => { portrait.hidden = true; element.dataset.portrait = 'false'; });
    addEventListener('resize', place); addEventListener('party-stage-resize', place);
    return {element, show, hide, destroy() { hide(); removeEventListener('resize', place); removeEventListener('party-stage-resize', place); element.remove(); }};
  }
  window.HeyPalsGameMessage = Object.freeze({create});
})();
