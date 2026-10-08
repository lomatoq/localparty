# Polish 128 — 2026-10-05

- Mine Together phone: green individual directional buttons; transparent shared backing.
- TV menu card numbers: removed transparency masks and internal text gradient; uniform existing low opacity retained.
- Swarm Gate: generated untiled courtyard, darker wall, overhead cannon and concentric pedestal; housing pivot aligned and existing muzzle reach preserved.
- Gates: matching intact/damaged/destroyed atlas, native alpha preserved; UV selects thirds. Built-in ImageGen used. Original files copied without bitmap edits to `public/assets/gameplay/sports-siege/turrets-v6/`. Prompt/source provenance: `output/imagegen/gate128/provenance.json`.
- Soft wall/gate contact shadows. Turret head/base/shadow stencil excludes opaque wall and gate pixels, without changing collision or shooting rules.

## Evidence

- `node --test tests/swarm-score-events.test.cjs`: 16 passed.
- `node --check games/sports_siege/public/host.js`, `git diff --check`: passed.
- Browser capture `gate128-review/new-gates/report.json`: passed, 18 captures, 8 guards including pointer fire, hit/score, pause/reload and geometry.
- Visually reviewed new-gates/4p-hit-score-tv-720.png and new-gates/4p-playing-tv-1080.png. Intact gate, repair overlay, shadows and wall occlusion verified visually. Damaged/destroyed atlas art inspected; those live health states not separately captured.
- Mine phone and home 1280 captures reviewed earlier in this pass.
- Fresh focused gallery: output/playwright/polish128-review/index.html. Older style127 archive is not refreshed by this focused pass.
- No native build/install or remote push performed.
