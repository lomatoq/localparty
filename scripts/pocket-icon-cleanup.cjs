'use strict';

// Eight-connected alpha components: only small, detached pieces near the
// original crop boundary are discarded. Never erode the main artwork.
function cleanBorderComponents(data, width, height, options = {}) {
  const threshold = options.alphaThreshold ?? 8;
  const edge = options.edgePixels ?? Math.max(1, Math.ceil(Math.min(width, height) * .012));
  const seen = new Uint8Array(width * height), components = [];
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || data[start * 4 + 3] <= threshold) continue;
    const pixels = [start]; seen[start] = 1;
    let touchesEdge = false;
    for (let cursor = 0; cursor < pixels.length; cursor++) {
      const p = pixels[cursor], x = p % width, y = Math.floor(p / width);
      if (x < edge || y < edge || x >= width - edge || y >= height - edge) touchesEdge = true;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, n = ny * width + nx;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || seen[n] || data[n * 4 + 3] <= threshold) continue;
        seen[n] = 1; pixels.push(n);
      }
    }
    components.push({ pixels, touchesEdge });
  }
  const largest = Math.max(0, ...components.map(c => c.pixels.length));
  const maxArea = Math.min(width * height * .045, largest * .18);
  let removedPixels = 0, removedComponents = 0, protectedEdgeComponents = 0;
  for (const c of components) {
    if (!c.touchesEdge) continue;
    if (c.pixels.length >= largest || c.pixels.length > maxArea) { protectedEdgeComponents++; continue; }
    removedComponents++; removedPixels += c.pixels.length;
    for (const p of c.pixels) data.fill(0, p * 4, p * 4 + 4);
  }
  // Very faint isolated pixels cannot become visible at the resized crop edge.
  for (let p = 0; p < seen.length; p++) if (data[p * 4 + 3] <= threshold) data.fill(0, p * 4, p * 4 + 4);
  return { removedPixels, removedComponents, protectedEdgeComponents, largestComponentPixels: largest };
}

module.exports = { cleanBorderComponents };
