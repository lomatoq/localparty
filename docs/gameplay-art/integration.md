# Gameplay art and presentation integration

2026-09-12. Six generated atlases contain 48 reusable sprites and 21 selective color masks. Exact generation prompts and all-26-game asset inventory live in `docs/gameplay-art/`; integer atlas rectangles, transparent gutters and pivots are in `public/assets/gameplay/manifest.json`.

## Runtime

`public/game-art.js` loads local atlases on demand, preserves procedural fallback, caches at most 256 colored variants, and colors only mask-selected paint. White specular highlights, eyes, dark joints and excluded metal remain unchanged. `tests/atlas-tint-check.png` compares original runner and three colors. Phones do not preload six gameplay atlases just to display controls.

Canvas games use the generated actors/props with original collision geometry. Tank bodies and turrets remain independent. Tap runners use separate feet; Flappy uses a wing and pitch; Carry uses runners without baked balls, plus exactly one real ball. Quiz, hidden-role and drawing games retain their semantic UI and user-created artwork; DOM props are accents. Jenga retains its 3D renderer.

## Performance changes

- Arcade controller packets omit food, pipes and trails; a real two-player Hungry sample measured about 4,800 bytes for host versus 867 bytes for phone (about 82% less per packet). State is withheld until role identification to prevent a host receiving controller projection during startup.
- Arcade display positions use time-based interpolation without mutating authoritative state.
- Snake trails append new segments to a persistent canvas instead of restroking the complete history each frame.
- Kart uses time-based smoothing and caches the static track; fonts finishing invalidate the track cache.
- Crane skips scoreboard DOM reconstruction when player/order content is unchanged.

## Evidence

`tests/gameplay-atlas-check.cjs`: all six atlases, 48 sprites, 21 masks, transparent gutters, complete 26-game inventory.

`tests/atlas-runtime.cjs` and `tests/facade-runtime.cjs`: real browser loads and draws original plus three colored variants.

`tests/arcade-projection.cjs`: actual WebSocket host/controller packets, no packet before role identification, required player feedback preserved.

`tests/arcade-feel.cjs`: equal taps, acceleration/coasting, screen-relative Snake, Flappy impulse/gravity and ball momentum.

The separate motion QA report records all-game flow checks and short 16-player render-cadence measurements. Those measurements are headless browser timing, not physical-phone or GPU profiling. Actual iPhone motion sensor quality remains a hardware validation item.


