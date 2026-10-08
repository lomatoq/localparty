/* Keep decorative catalogue animation phase, without ticking clipped/offscreen art. */
(() => {
  'use strict';
  if (!document.body.classList.contains('tv-screen') || !window.IntersectionObserver) return;
  const catalog = document.getElementById('tvCatalog');
  if (!catalog) return;
  const tracked = new Set();
  const visible = new Set();
  const sync = image => {
    image.style.setProperty('animation-play-state', visible.has(image) && !document.hidden ? 'running' : 'paused', 'important');
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio > 0) visible.add(entry.target);
      else visible.delete(entry.target);
      sync(entry.target);
    }
  });
  const scan = () => {
    for (const image of tracked) {
      if (!catalog.contains(image)) {
        observer.unobserve(image);
        tracked.delete(image);
        visible.delete(image);
      }
    }
    for (const image of catalog.querySelectorAll('img.symbol')) {
      if (tracked.has(image)) continue;
      tracked.add(image);
      sync(image);
      observer.observe(image);
    }
  };
  new MutationObserver(scan).observe(catalog, { childList: true, subtree: true });
  document.addEventListener('visibilitychange', () => tracked.forEach(sync));
  scan();
})();
