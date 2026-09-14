(() => {
  'use strict';
  const TYPES = new Set(['hit', 'shot', 'collision', 'explosion', 'elimination', 'out-of-bounds', 'danger', 'score', 'round-result']);
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new Set();
  const timers = new WeakMap();
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
    clearTimeout(timers.get(target));
    timers.set(target, setTimeout(() => target.classList.remove(name), duration));
  }
  function haptic(type, intensity, enabled) {
    if (!enabled || !root.classList.contains('party-player') || typeof navigator.vibrate !== 'function') return false;
    const pattern = type === 'explosion' || type === 'elimination' ? [18, 26, 24] : type === 'danger' ? [12, 42, 12] : [Math.round(6 + intensity * 10)];
    return navigator.vibrate(pattern);
  }
  function emit(type, options = {}) {
    if (!TYPES.has(type)) throw new TypeError(`Unknown LocalPartyFeel event: ${type}`);
    const id = options.id == null ? '' : `${type}:${options.id}`;
    if (id && seen.has(id)) return { type, duplicate: true, suppressed: true };
    if (id) { seen.add(id); if (seen.size > 128) seen.delete(seen.values().next().value); }
    const intensity = clamp(options.intensity == null ? .55 : options.intensity, .12, 1);
    const duration = Math.round(clamp(options.duration || (type === 'danger' ? 300 : 210), 90, 420));
    const detail = { type, intensity, duration, reduced: reduced.matches };
    window.dispatchEvent(new CustomEvent('localparty:feel', { detail }));
    if (reduced.matches) return { ...detail, suppressed: true };

    const surface = options.target instanceof Element ? options.target : document.querySelector('[data-game-feel-surface],canvas');
    const host = ensureLayer(), p = point(options), color = options.color || (type === 'danger' || type === 'elimination' ? '#ff596f' : '#c8ff73');
    host.style.setProperty('--lp-feel-color', color);
    const flash = document.createElement('i');
    flash.className = `lp-feel-flash lp-feel-${type}`;
    flash.style.setProperty('--lp-feel-duration', `${duration}ms`);
    flash.style.setProperty('--lp-feel-alpha', String(.035 + intensity * .09));
    host.append(flash); setTimeout(() => flash.remove(), duration + 40);

    if (type === 'danger' || type === 'out-of-bounds') {
      const edge = document.createElement('i'); edge.className = 'lp-feel-edge';
      edge.style.setProperty('--lp-feel-duration', `${duration}ms`); edge.style.setProperty('--lp-feel-alpha', String(.12 + intensity * .2));
      host.append(edge); setTimeout(() => edge.remove(), duration + 40);
    }
    if (['hit', 'collision', 'explosion', 'elimination', 'score'].includes(type)) {
      const burst = document.createElement('span'); burst.className = 'lp-feel-burst'; burst.style.left = `${p.x}px`; burst.style.top = `${p.y}px`;
      const count = Math.round(clamp(4 + intensity * 7, 4, 11));
      for (let i = 0; i < count; i++) { const bit = document.createElement('i'); bit.style.setProperty('--i', i); bit.style.setProperty('--n', count); bit.style.setProperty('--d', `${Math.round(18 + intensity * 34)}px`); burst.append(bit); }
      host.append(burst); setTimeout(() => burst.remove(), 520);
    }
    if (surface && options.shake !== false && ['hit', 'collision', 'explosion', 'elimination'].includes(type)) {
      surface.style.setProperty('--lp-feel-shake', `${clamp(1 + intensity * 4, 1, 5)}px`);
      surface.style.setProperty('--lp-feel-duration', `${Math.min(duration, 190)}ms`);
      temporaryClass(surface, 'lp-feel-shake', Math.min(duration, 190) + 30);
    }
    if (options.impactTarget instanceof Element && ['hit', 'collision', 'score'].includes(type)) temporaryClass(options.impactTarget, 'lp-feel-impact', duration + 30);
    haptic(type, intensity, options.haptic !== false);
    return { ...detail, particles: host.querySelectorAll('.lp-feel-burst>i').length };
  }

  root.classList.toggle('lp-feel-reduced', reduced.matches);
  reduced.addEventListener?.('change', () => root.classList.toggle('lp-feel-reduced', reduced.matches));
  window.LocalPartyFeel = Object.freeze({ emit, types: Object.freeze([...TYPES]), reduced: () => reduced.matches });
})();
