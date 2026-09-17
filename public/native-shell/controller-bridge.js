/* Installed by WKUserScript only in the native, origin-validated controller. */
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
  window.LocalPartyNative = Object.freeze({haptic: vibrate, isNative: true});
  // Compatibility adapter for existing games, never injected into guest Safari.
  try { Object.defineProperty(navigator, 'vibrate', {configurable: true, value: vibrate}); } catch { /* explicit API remains available */ }
  if (window !== window.top) return;
  function mount() {
    const nav = document.querySelector('.app-header nav:last-child');
    if (!nav || document.getElementById('partyNativeMenu')) return;
    const b = document.createElement('button'); b.id = 'partyNativeMenu'; b.type = 'button'; b.className = 'nav'; b.textContent = 'Меню'; b.setAttribute('aria-label', 'Вернуться в меню LocalParty');
    b.addEventListener('click', () => send({type: 'menu'})); nav.prepend(b);
    const fullscreen = document.getElementById('fullscreen'); if (fullscreen) fullscreen.hidden = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true}); else mount();
})();
