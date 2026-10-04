'use strict';

// Pure render-aware actor bounds. Games retain their own motion and collision
// radii; only the visible envelope is kept out of measured TV information.
const finite = value => typeof value === 'number' && Number.isFinite(value);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function normalizeLayout(raw, options) {
  if (!raw || !finite(raw.width) || raw.width !== options.width ||
      !finite(raw.height) || raw.height <= 0 || raw.height > 10000 ||
      !Array.isArray(raw.exclusions) || raw.exclusions.length > 8) return null;
  const height = clamp(raw.height, options.minHeight ?? options.baseHeight,
    options.maxHeight ?? options.baseHeight);
  const layout = { width: options.width, height, exclusions: [] };
  for (const rect of raw.exclusions) {
    if (!rect || !['x', 'y', 'w', 'h'].every(key => finite(rect[key])) ||
        rect.w < 0 || rect.h < 0 ||
        [rect.x, rect.y, rect.w, rect.h].some(value => Math.abs(value) > 10000)) return null;
    const x = clamp(rect.x, 0, layout.width), y = clamp(rect.y, 0, height);
    const right = clamp(rect.x + rect.w, 0, layout.width), bottom = clamp(rect.y + rect.h, 0, height);
    if (right > x && bottom > y) layout.exclusions.push({ x, y, w: right - x, h: bottom - y });
  }
  return layout;
}

function projectRect(rect, projection, world) {
  if (!rect || !projection || !world || !finite(projection.scale) || projection.scale <= 0 ||
      !['left', 'top', 'width', 'height'].every(key => finite(rect[key])) ||
      !finite(projection.left) || !finite(projection.top)) return null;
  const raw = { x: (rect.left - projection.left) / projection.scale,
    y: (rect.top - projection.top) / projection.scale,
    w: rect.width / projection.scale, h: rect.height / projection.scale };
  return normalizeLayout({ ...world, exclusions: [raw] },
    { width: world.width, baseHeight: world.height })?.exclusions[0] || null;
}

function overlaps(x, y, radius, rect) {
  const dx = x - clamp(x, rect.x, rect.x + rect.w), dy = y - clamp(y, rect.y, rect.y + rect.h);
  return dx * dx + dy * dy < radius * radius;
}

function fits(point, radius, layout, blockedAt = () => false) {
  return finite(point.x) && finite(point.y) && point.x >= radius && point.y >= radius &&
    point.x <= layout.width - radius && point.y <= layout.height - radius &&
    !layout.exclusions.some(rect => overlaps(point.x, point.y, radius, rect)) && !blockedAt(point.x, point.y);
}

function recover(point, radius, layout, blockedAt = () => false) {
  if (!finite(radius) || radius <= 0 || layout.width <= radius * 2 || layout.height <= radius * 2) return null;
  if (fits(point, radius, layout, blockedAt)) return { x: point.x, y: point.y };
  const base = { x: clamp(point.x, radius, layout.width - radius), y: clamp(point.y, radius, layout.height - radius) };
  const candidates = [base];
  for (const rect of layout.exclusions) {
    const xs = [rect.x - radius, rect.x + rect.w + radius], ys = [rect.y - radius, rect.y + rect.h + radius];
    for (const x of xs) candidates.push({ x, y: base.y });
    for (const y of ys) candidates.push({ x: base.x, y });
    for (const x of xs) for (const y of ys) candidates.push({ x, y });
  }
  const legal = candidates.filter(candidate => fits(candidate, radius, layout, blockedAt));
  // Geometry changes are rare. A bounded fallback also respects authored walls
  // when every nearest exclusion edge happens to land inside an obstacle.
  if (!legal.length) {
    const step = Math.max(12, radius / 2);
    for (let y = radius; y <= layout.height - radius; y += step)
      for (let x = radius; x <= layout.width - radius; x += step)
        if (fits({ x, y }, radius, layout, blockedAt)) legal.push({ x, y });
  }
  legal.sort((a, b) => (a.x - point.x) ** 2 + (a.y - point.y) ** 2 -
    ((b.x - point.x) ** 2 + (b.y - point.y) ** 2));
  return legal[0] || null;
}

module.exports = { normalizeLayout, projectRect, overlaps, fits, recover };
