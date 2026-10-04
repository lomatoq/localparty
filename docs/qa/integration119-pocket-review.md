# Integration 119 — Pocket Siege camera and turn identity

2026-10-04. Scoped presentation correction for the user's follow-up. No simulation, weapon balance, projectile life, controller input, protocol or physics changes.

## Change

- `games/arcade_deluxe/public/pocket-camera.js`: field framing has a 0.76 minimum scale and bounded vertical travel. A distant projectile cannot keep pulling the world away. Nearby visible shells still affect framing; distant fragments do not win over the field.
- `games/arcade_deluxe/public/render.js`: offscreen projectiles display at most three compact, team-colour markers. The arrow shows the **current authoritative velocity**, including the downward direction of a returning projectile; it does not promise a future impact for a homing/warping/branching weapon. Marker positions clear the actual full parent `.tv-info-dock` and lower crew dock, accounting for iframe scale.
- The shooter's name appears in a centred field notice for 1.8 simulation seconds when a new aim turn starts. It disappears immediately on firing. The notice and camera freeze during pause. Root separately suppresses the shared Pocket header actor.

## Evidence

`tests/pocket-camera-browser.cjs` passes in WebKit at 1280×720 and 1920×888, full and reduced motion. Deterministic presentation fixtures verify extremely distant ascent, descent, re-entry, 200-fragment cue capping, centred-name timeout, firing dismissal, pixel-identical pause, and immutable authoritative snapshot. The additional parent fixture uses a 1.5× scaled iframe and a measured 120px HUD: the marker clears its lower edge. These are renderer/geometry fixtures, not claims about real weapon trajectories or hardware.

Fresh originals: `output/playwright/pocket119-camera/`, including `turn-*`, `returning-*`, and `parent-safe-1280.png`. Viewed the real-font 720 centred notice, 1920 reduced centred notice, 1920 reduced returning marker and scaled parent HUD marker. No clipped ink, field disappearance, or HUD overlap in these originals.

`tests/pocket-projectile-visibility-browser.cjs` passes: Single Shot, emitter-only Quad/Chain carriers remain painted or have an edge cue in both tested TV shapes. Its old requirement that every far-away shell stay onscreen was updated to the explicitly requested bounded-field contract.

`tests/pocket-full-renderer-browser.cjs` passes for seven authoritative weapon families through production WebSocket and Connection hydration, **493 painted snapshots each** in full and reduced motion. IDs: `3_shot`, `dirt_mover`, `magic_wall`, `napalm`, `hail_storm`, `pin_cushion`, `nuke`. Both final reports have `errors:[]`, `changedFiles:[]`, no renderer/hydration/replay defect, and all shots settle. Evidence: `output/playwright/pocket119-seven-full-final/report.json` and `pocket119-seven-reduced-final/report.json`. This is accelerated replay with normal physics; not all 321 weapons or a physical-device proof. The harness now supports `QA_REDUCED=1` and includes the new camera module in future hash guards.

An earlier full replay in `pocket119-seven-full/` correctly failed its source freshness guard when the safe-edge measurement was finalised during capture; it is excluded from acceptance. The final runs use the settled source. Initial launch attempts were blocked by sandbox `listen EPERM` and an unrelated npm package expecting an absent WebKit revision; rerun with the installed Codex runtime succeeded.

Product hashes after final code freeze:

- `render.js`: `8ddc080f436655f0af093535c6c5fe2ff98c8d4e2fd29c42dd956582ff7fb8cf`
- `pocket-camera.js`: `49f09933e475f8479bae2031525cb6195d1660a44f024f9f1ba4210e622c37f3`

Build, install, final launcher gallery and repository push belong to root. This lane does not claim them complete.
