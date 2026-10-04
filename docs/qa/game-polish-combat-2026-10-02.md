# Combat lane polish · 2026-10-02 (tanks, tankarena, marble_bloom, pocket_siege)

Rendering and feedback only. No rules, scoring, balance, protocol or simulation
changes. All effects read authoritative snapshots/events and are bounded.
Reduced motion: no shake, no hit-stop, no press/spring animations, fewer particles.

## Changes per game

### Local Tanks (`games/tanks/`)
- New `public/tank-fx.js` (TV only, loaded by `host.html`):
  - Muzzle flash and turret recoil when a new bullet id appears.
  - Sparks, a white-hot hull glow and a `-N` damage number when HP drops.
  - A confirmed kill holds the frame for about 70 ms, then plays a shockwave ring, fireball, rotating debris in the tank's colour, soft smoke and embers. A scorch mark is left behind and fades over 7 s.
  - Trauma-based field shake, capped at 5 px and decaying.
  - Soft tread dust behind moving tanks and faint ambient motes.
  - Kill banner at the top of the field (killer, crosshair, struck-through victim; at most 3, 2.1 s each).
- `host.js`: wiring only. Recoil/glow are applied to player tanks and co-op bots. The FX stays live through `between`/`finished` so the kill that ends a round still explodes.
- Phone (`controller.js`, `controller.css`, `index.html`):
  - On press, a ring blooms from the finger and FIRE's glyph kicks back.
  - Controls spring once on respawn.
  - Haptics go through `LocalPartyFeel`, so the native iOS shell gets them too (before, only `navigator.vibrate` was used): light on fire, heavy on own destruction, success on own kill.
  - Kills, deaths and score labels now carry `hp-stat-label` and get Target/Ghost glyphs.

### Tank Arsenal (`games/tankarena/`)
- Same `tank-fx.js` (identical copy; each game serves its own `public/`), wired in `app.js`. Machine gun and flamethrower get a small flash or none, with no smoke, so a held trigger doesn't fog the tank.
- Phone:
  - FIRE has a press ring from the finger.
  - A real reload sweep on FIRE, from the server's `player.cd` against the weapon's `cd`. It shows only for weapons with `cd` ≥ 0.45 s.
  - One pop when a long reload (≥ 0.9 s) finishes.
  - Haptics via `LocalPartyFeel`: shot, own destruction, weapon pickup.

### Pocket Siege (`games/arcade_deluxe/public/render.js`)
- A server `hit` event adds decaying ground shake. Damage of 30 or more also triggers a ~60 ms hit-stop. The sky stays fixed and only the world shakes.
- A `turn` event lights a one-shot ring on the newly active tank.
- The classic sky gets 90 dim pixel stars, kept dimmer than any shell. Their clock stops while paused, so paused frames stay pixel-identical (`pocket-explosion-waves-browser` checks this).
- Phone: FIRE press ring (`controller.js`, `style.css`).

### Marble Bloom (`render.js`, `controller.js`, `style.css`)
- TV: each pop releases 5 spinning petals in the marble's colour. A combo score blooms 8 multicolour petals. Works per board in versus.
- Phone: FIRE press ring. The now/next previews spring when the authoritative colours change (fire or swap) instead of snapping.

## Evidence

Script: scratchpad `combat-capture.cjs`, with a real launcher, built-in bots, one web phone and one native-route phone (`controller-bridge.js` + `tabs.js`).

- Before: `.localparty-build/combat-polish/before/`
- First pass: `.localparty-build/combat-polish/after1/`. Solid grey smoke and dust discs read as blobs, and rapid fire fogged the tanks. Fixed with soft puff sprites and rapid-weapon tuning.
- Final: `.localparty-build/combat-polish/after/` (TV 720 burst + montage, TV 1080, phone 393, phone 320, native 402 for all four games).
- Press states: `after-press/` (Local Tanks ring and kick) and `after-press2/` (Tank Arsenal press glow plus reload sweep).
- Images I looked at:
  - Tank Arsenal: kill banner, scorch and soft dust (`after/tankarena-tv720-7.png`).
  - Local Tanks: flashes and sparks (`after/tanks-montage.png`). The explosion, banner and `-40` number are in `after1/tanks-tv720-1.png`, which predates the soft-smoke change.
  - Pocket Siege: stars at 1080.
  - Marble Bloom: petals (`after/marble-crops.png`).
  - All phone sizes, including native 402. No overflow, no page errors.

## Tests

- `node --test` on `pocket-*.test.cjs`, `marble-layout`, `tankarena-weapons`, `tanks-hud-stability`, `siege-terrain` and `game-feel-state`: 122/122 pass, including the snapshot payload bound.
- WebKit tests that pass:
  - `pocket-projectile-visibility-browser`
  - `siege-fx-browser`
  - `pocket-burial-browser`
  - `pocket-explosion-waves-browser`, which failed at first because the stars twinkled while paused; fixed.
  - `deluxe-render-regression`
  - `pocket-deck-browser`
  - `pocket-projectile-art-browser`
  - `pocket-drone-browser`
  - `pocket-air-defense-render-browser`
- `tanks-scenery.cjs` and `browser/tankarena-host-geometry.cjs` can't run here: they hard-code a Windows Playwright path (existing issue).

## Not verified

- No physical iPhone or Apple TV. Haptics were not felt on a device; the native route was a stubbed bridge.
- The final soft-smoke explosion in Local Tanks wasn't caught in a final capture (no kill happened in that burst). The capture of the earlier version showed the full sequence.
- The Pocket Siege hit shake, hit-stop and turn ring weren't caught in a still capture; they're covered by code review only.
- Marble Bloom co-op mode, the Local Tanks CTF and co-op modes, and results screens were not captured in this pass (renderer paths are shared).
- No image requests were needed.
