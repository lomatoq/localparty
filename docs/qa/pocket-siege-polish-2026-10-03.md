# Pocket Siege feel and graphics pass · 2026-10-03

Owner request: make Pocket Siege look and feel more expensive, fun and juicy.
This pass changes rendering only. Simulation, terrain, protocol, weapons, balance and the weapon payload are untouched. Everything reads authoritative snapshots and events, and nothing is written back.

## What was wrong (baseline captures)

`before-720/`, real `Tanks` simulation streamed to the production renderer:

- Almost every explosion is an authored persistent wave (`explosionWaveId`). That suppresses the generic SiegeFX particles, so a Big Shot direct hit showed only a thin palette ring. There was no flash, fireball, debris, smoke or camera response.
- Shells had a short stroke with no exhaust. Tanks had no ground contact, and a hit didn't register on the hull.
- The terrain was flat banded greens with no surface light, and the sky was a bare gradient.

## Changes

### New: `games/arcade_deluxe/public/pocket-juice.js` (TV renderer only)

**Impact**, for every `blast` event, including authored-wave explosions:
- Warm light bloom and a generated flash sprite.
- A fireball, then a smoky fireball that rises and drifts with the wind.
- A shockwave ring sprite, and 1–4 smoke puffs that drift with the wind.
- When the blast is near the ground:
  - Terrain-coloured debris chunks with gravity, a bounce off the real terrain profile, then rest.
  - Ground dust.
  - A scorch mark.
- Size follows the authored radius (clamped to 6–150).
- Chain or cluster weapons (more than 3 blasts in 0.3 s) get thinned variants.

**Camera kick tiers** by radius: 0.12 / 0.24 / 0.38 / 0.55 trauma, plus a short zoom punch (at most 5%). The existing hit shake and hit-stop are kept.

**Muzzle**:
- An oriented generated muzzle-flash sprite, a light bloom, 3 exhaust puffs and track dust on both sides.
- A light camera kick.
- `render.js` `tank()`: a short hull recoil squash, driven by the existing `muzzle` event and server time.

**Shell exhaust trails**: soft puffs left along the actual interpolated path and blown by `s.wind`. Pellets, liquids and bodiless emitter nodes are skipped. Puff spacing widens when more than 10 shells are in flight.

**Tank life**:
- A soft contact shadow under every tank.
- A white hit flash on the struck hull (0.22 s).
- Wheel dust while the tank moves, including slides.
- A dust burst and a light kick on `land`.
- Dirt and bounce puffs.

**Hit callouts** for the attacker, in their colour, using Kardia Fat Runner:
- 25 or more damage: `DIRECT HIT!`; 50 or more: `MASSIVE HIT!`; 80 or more: `DEVASTATING!`. A self-hit shows `SELF HIT`.
- Hits on the same tank from a multi-stage weapon merge into one callout that grows and re-pops.
- Callouts sit above the existing `+N` glyph, are clamped on screen and last 1.35 s.

**Terrain crumble**: when a terrain revision lowers or raises columns, a few crumbs fall or dust rises (at most 8 per revision).

**Terrain surface bake**: drawn once into the cached terrain texture, so buried-tank occlusion still uses one texture.
- A grass rim on original ground and a pale cut edge on crater walls.
- Light from the upper left on slopes.
- Occlusion in caves.
- Blast scorches (at most 24; cleared each round).

**Sky** (classic sky only):
- Two distant ridge silhouettes with slight parallax against the shell-follow camera. They fade into the purple horizon glow, so the retro identity stays.
- A dim crescent moon.
- Both stay dimmer than any shell.

**Art**: nine generated HeyPals FX sprites (`explosion-1..3`, `smoke-puff-a/b`, `shockwave-ring`, `scorch-decal`, `muzzle-flash-side`, `dust-puff`) were copied into `games/arcade_deluxe/public/assets/fx/` (136 KB). They are loaded relative to the module, so the standalone server, the managed launcher and the tests all resolve them. If they are missing, soft procedural sprites are drawn instead.

### `render.js` (small hooks only)
- Import and construct the juice layer, clear it on round reset, and forward events (only once a previous snapshot exists, so a late host doesn't replay old explosions).
- Terrain delta on revision change.
- Sky before the stars. Shake and kick are combined, and the zoom punch is applied around the screen centre.
- Puffs before shells, a trail per shell, and wheel dust in the pose loop.
- Contact shadow, squash and hit flash in `tank()`.
- Draw order: juice sprites → SiegeFX (so `+N` glyphs stay readable over the smoke) → persistent waves → debris → callouts.
- `siegeShake` phase now uses a dt clock instead of `performance.now()`, so a paused frame with leftover trauma is still frozen.
- `bakeSurface` runs inside `terrain()`, and the texture is rebuilt when a scorch is added (not while paused).

### `controller.js`
The phone now gives a short 10 ms haptic when the player's own shot hits another tank. The existing incoming-hit haptic is unchanged.

## Constraints kept
- Weapon payload `Buffer.byteLength(JSON.stringify(WEAPONS))` = **399,982 bytes**, unchanged and under the 400,000 bound. No weapon or simulation file was edited.
- Determinism and pause:
  - All effects are clocked by the renderer's dt, which is 0 while paused, and randomness is seeded from event ids.
  - Art is drawn only after `decode()` and is copied into a canvas.
  - The flash sprite isn't rotated: a large rotated first draw in WebKit differed by one LSB from later draws, which broke the pixel-identical pause check.
- Bounds:
  - 260 sprites, 160 debris, 240 puffs, 6 callouts, 24 scorches.
  - Trail map pruned after 30 frames.
- Reduced motion:
  - No camera kick or zoom punch, no hull squash, no callout scale pop and no shockwave ring.
  - Sprite growth is cut to 30%, with fewer puffs, debris and smoke.
- Generic blast suppression for authored waves is unchanged: `bursts`, `rings`, `particles` and `siegeFX.items` stay at 0. The juice is a separate curated layer drawn on top of the faithful wave.

## Performance
WebKit headless, 1920×1080, three shots including Mega Nuke, rAF-driven, `Renderer.frame` cost measured inside the page (1 ms timer resolution):

| | median | p95 | p99 | max |
|---|---|---|---|---|
| Juice disabled (methods stubbed) | 0 ms | 1 ms | 3 ms | 8 ms |
| With juice | 0 ms | 1 ms | 4 ms | 13 ms |

The maxima are terrain re-bakes while soil falls. The rAF interval median was 17 ms in both runs; the p95 of 21 ms is dominated by the capture's own screenshots. This is desktop headless evidence, not an Apple TV measurement.

## Captures (all viewed)
Location: `.localparty-build/pocket-siege-polish-2026-10-03/`. The harness is `capture.cjs` (in the same folder): real `Tanks` simulation, 20 Hz snapshots, the production `Renderer`, and real-time rAF.

- `before-720/`: baseline.
- `after-720/`: final code, 1280×720. Aim, launch, flight with exhaust, impact flash, fireball, smoke, carve with debris, settle with the wave, and the turn-change ring. Shows `DIRECT → MASSIVE → DEVASTATING` callout merging on Mega Nuke and the large crater with cut-edge shading.
- `after-1080/`: 1920×1080, same flow. Captured before the final flash-rotation and debris-outline tweaks, which are visually negligible.
- `after-reduced-720/`: reduced motion (no kick, trail spacing). Captured before reduced growth was trimmed to 30%.
- `launcher-real/`: real launcher and human controllers, captured by `scripts/capture-pocket-round3.cjs` (2 players, interactions, finish).
  - TV at 720 and 1080: aim, fired with the shell trail, impact, and pause. Ridges and the moon sit clear of the HUD panel.
  - Results on TV at 720 and 1080: shared podium, unchanged.
  - Phone at 393 and 320: controller, arsenal, drone, AA, fired, other turn, and results.
  - Taken before the controller haptic line was added.

## Tests
- `node --test tests/pocket-*.test.cjs tests/siege-terrain.test.cjs`: 105/105 pass.
- Final sequential WebKit run passed 17 of 18 files: air-defense-render, burial, damage-feedback, deck, drone, explosion-waves, full-renderer (321 weapons through the complete renderer, including juice), juice (new), material-recovery, materials, projectile-art, projectile-coverage, projectile-visibility, runtime, siege-fx and deluxe-render-regression. The one failure, `pocket-loadout-browser.cjs`, already failed in the baseline before this pass (`320 !== 321` weapon rows: the draft list excludes the non-draft Single Shot). That is unrelated to rendering and was not changed.
- New: `tests/pocket-juice-browser.cjs` (full and reduced motion) checks:
  - With 400 blast, hit and muzzle events in one packet, every pool stays within its bound.
  - Puffs stay bounded with 40 trails.
  - A paused frame is pixel-identical with an explosion in flight.
  - All effects stay finite and retire.
  - Hits on one tank merge into a single `MASSIVE HIT!`.
  - The authoritative snapshot is not mutated.
  - Reduced motion has no camera kick.

## Not verified
- No physical Apple TV or iPhone, so 60 fps on a device and the new haptic weren't felt or measured.
- The air-defense and drone flows weren't recaptured visually. Their renderers were untouched, and the drone, deck and air-defense browser tests cover them.
- A shell exhaust trail runs through the shared code path for every weapon (the 321-weapon full-renderer test exercises it). Only a handful of weapons were inspected visually: Big Shot, Single Shot, Mega Nuke and 3 Shot.
- The generated sprites are cartoon-rendered while the field keeps its retro pixel identity. The art director should confirm that the mix is the intended direction.
