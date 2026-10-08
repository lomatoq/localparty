/* HeyPals TV home premium layer (decorative only, Claude TV-main-screen lane 2026-10-04).
   Adds restrained lobby props inside the existing #tvStage>.ambient,
   and gives players without a photo a stable mascot avatar via a CSS variable.
   Never changes lobby DOM structure, text, sizes or behaviour. */
(() => {
 'use strict';
 if (window.HeyPalsTVHomePremium) return;
 const props = [
  {src: 'float-balloon-a', x: 572, y: 88, w: 40, o: .48, d: 15, dx: '4px', dy: '-10px', r: '-6deg'},
  {src: 'float-sparkle', x: 612, y: 144, w: 22, o: .42, d: 12, dl: -4, dx: '2px', dy: '-5px'}
 ];
 function ambient() {
  const host = document.querySelector('#tvStage>.ambient');
  if (!host || host.querySelector('.hpx-props')) return;
  const layer = document.createElement('div');
  layer.className = 'hpx-props';
  layer.setAttribute('aria-hidden', 'true');
  for (const p of props) {
   const img = new Image();
   img.src = '/assets/fx/atlas-lobby-props/' + p.src + '.webp';
   img.alt = '';
   img.decoding = 'async';
   img.draggable = false;
   const s = img.style;
   s.setProperty('--x', p.x + 'px'); s.setProperty('--y', p.y + 'px'); s.setProperty('--w', p.w + 'px');
   s.setProperty('--o', String(p.o)); s.setProperty('--d', p.d + 's');
   if (p.dl) s.setProperty('--dl', p.dl + 's');
   if (p.f) s.setProperty('--f', p.f);
   if (p.dx) s.setProperty('--dx', p.dx);
   if (p.dy) s.setProperty('--dy', p.dy);
   if (p.r) s.setProperty('--r', p.r);
   layer.append(img);
  }
  host.append(layer);
 }
 // Stable mascot per name, same hash family as HeyPalsAvatar.hue().
 function mascotFor(name) {
  let h = 2166136261;
  for (const ch of String(name || '?')) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return (Math.abs(h) % 16) + 1;
 }
 function mascots() {
  for (const avatar of document.querySelectorAll('#players .player:not(.tv-more) .avatar')) {
   if (avatar.classList.contains('has-photo')) { avatar.classList.remove('hpx-mascot'); continue; }
   const name = avatar.parentElement?.querySelector('b')?.textContent || avatar.dataset.initial || '?';
   const n = String(mascotFor(name)).padStart(2, '0');
   const url = 'url("/assets/avatars/atlas-mascots/mascot-' + n + '.webp")';
   if (avatar.style.getPropertyValue('--hpx-mascot') !== url) avatar.style.setProperty('--hpx-mascot', url);
   avatar.classList.add('hpx-mascot');
  }
 }
 function start() {
  ambient();
  const players = document.getElementById('players');
  if (players) {
   let queued = false;
   new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; mascots(); });
   }).observe(players, {childList: true});
   mascots();
  }
 }
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
 else start();
 window.HeyPalsTVHomePremium = Object.freeze({revision: 'tv-home-premium-20261004.3'});
})();
