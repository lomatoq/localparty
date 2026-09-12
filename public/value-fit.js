/* Fit short HUD/stat values inside their padded boxes, never game canvases or body text. */
(() => {
  'use strict';
  if (window.__partyValueFit) return;
  window.__partyValueFit = true;
  const selector = '#hudValue,#hudLabel,#hudProgress,#progressText,.round-badge,.stats strong,.stats b,.stat strong,.stat b,.metric strong,.metric b,.score strong,.score b,.timer strong,.timer b';
  const fixed = new Set(['hudValue','hudLabel','hudProgress','progressText']);
  const bases = new WeakMap();
  let queued = false;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  function fit() {
    queued = false;
    if (innerWidth > 850 || !ctx) return;
    document.querySelectorAll(selector).forEach(el => {
      const text = el.textContent.trim();
      if (!text || text.length > 48 || (!fixed.has(el.id) && !/\d/.test(text)) || el.children.length || !el.getClientRects().length) return;
      const parent = el.parentElement, s = getComputedStyle(el), ps = getComputedStyle(parent);
      if (s.display === 'none' || ps.display === 'none') return;
      let base = bases.get(el);
      if (!base) { base = parseFloat(s.fontSize); bases.set(el, base); }
      let available = parent.clientWidth - parseFloat(ps.paddingLeft || 0) - parseFloat(ps.paddingRight || 0);
      if (ps.display.includes('flex') && ps.flexDirection.startsWith('row')) {
        const siblings = [...parent.children].filter(n => n !== el && n.getClientRects().length);
        available -= siblings.reduce((sum,n) => sum + n.getBoundingClientRect().width,0) + siblings.length * (parseFloat(ps.columnGap) || 0);
      }
      if (s.display !== 'inline' && el.clientWidth > 0 && !fixed.has(el.id)) available = Math.min(available, el.clientWidth);
      available -= 8;
      if (available < 20) return;
      ctx.font = `${s.fontStyle} ${s.fontWeight} ${base}px ${s.fontFamily}`;
      const width = ctx.measureText(text).width + Math.max(0,text.length-1) * (parseFloat(s.letterSpacing) || 0);
      const size = Math.min(base, Math.max(10, base * Math.min(1, available / Math.max(1,width))));
      const desired = size.toFixed(2) + 'px';
      if (el.style.fontSize !== desired) el.style.setProperty('font-size', desired, 'important');
    });
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(fit); } }
  function init() {
    new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','hidden']});
    addEventListener('resize', () => { document.querySelectorAll(selector).forEach(el => { el.style.removeProperty('font-size'); bases.delete(el); }); schedule(); });
    document.fonts?.ready.then(schedule);
    schedule();
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
