# Pocket Siege art + feel pass · 2026-10-04

Owner request: make Pocket Siege look and feel far more premium and fun, and fix the mixed style. The 10-03 pass added cartoon explosion sprites on top of a flat pixel field. The world art had to be lifted so everything reads as one style.

Follow-up owner items in the same session:
- Air-defense hits and misses must visibly explode instead of cutting off.
- More lively touches.

This pass is presentation only. Simulation, terrain geometry, protocol, weapons, balance and the weapon payload are unchanged.

## Critique of the starting state (`before-720/`, viewed)

1. **Terrain:** flat saturated `#049c05` bands with a 2 px stair-stepped silhouette. It read as a paint-bucket fill and clashed with the painterly explosion sprites, which was the main style break.
2. **Sky:** the top 40% was a black void with sparse 1 px square stars. The ridges were flat purple bands, there were no clouds or haze, and the moon was a dim decal.
3. **Tanks:** grey hulls with team colour only on a gradient dome, and the barrel was a 4 px white line. There was no outline, so tanks didn't read as hero objects on TV.
4. **Aim and turns:** the aim preview was a row of thin team-coloured dots with no power information. The turn cue was a single ring, and nothing marked the final round.
5. **Weapons:** every weapon had the same grey exhaust and the same fireball. A nuke had no special moment, and dirt weapons made fireballs.
6. **Impacts:** debris was green squares. Craters had no heat afterlife, a hit tank didn't react beyond a white flash, and there was no wind cue anywhere in the world.
7. **Air defense** (owner): an interception drew only a 3–12 px ring. An interceptor that missed or hit terrain simply disappeared, and so did its trail.

## Changes

### New `games/arcade_deluxe/public/pocket-world.js` (world art, TV renderer only)

**Sky.** Built once and cached:
- A deep indigo → violet → rose horizon gradient.
- Soft nebula washes and a dust band.
- About 300 static stars, plus 26 twinkling stars with tiny cross flares.
- A painted moon with craters and a halo.

Drawn per frame:
- Three parallax ridge silhouettes with atmospheric perspective. Each has pine and round-tree props, a faint moonlit rim, and the middle ridge carries a distant keep with lit windows.
- A horizon haze band.
- Two decks of painterly clouds, built from soft brush dabs with a dark belly and a moonlit crown.

**In-world wind cue.** Cloud drift and up to 18 faint wind streaks follow the authoritative `s.wind`. The shown wind is eased so nothing jumps between turns.

**Terrain art.** A full-size painted soil texture is built once per round from each column's original-ground origin:
- A turf cap with blade texture and roots.
- Six wavy soil strata (loam, ochre, clay, plum, deep), with sediment lines that follow the contour.
- Depth darkening and about 250 embedded stones.

Soil columns are filled with this texture as a pattern, so a rebake costs no more than the old banded fill. Deposited material segments keep their authored gradients. Strata are frozen per round, so deposits and craters never shift them. An early build was keyed on origin and seamed after a Dirtball; that was found in captures and fixed.

**Surface dressing.** Baked into the same terrain texture, so buried-tank occlusion still uses one texture. It applies only to ground that has never been cut:
- An anti-aliased turf lip that hides the 2 px column steps.
- Grass tufts, small flowers and pebbles.

Crater walls show the strata. The old pixel grass rim in `pocket-juice.js` was removed.

**Crater embers.** A grounded blast leaves a hot rim glow masked to the remaining soil. It cools from yellow-orange to deep red over 2.6–4.2 s, with at most 10 at once.

### New `games/arcade_deluxe/public/pocket-tank.js` (toy tank hero)

**Body:**
- An ink-outlined, team-coloured hull with a lit top, a fender band and rivets.
- A rounded tread pill with five wheels whose spokes roll with distance travelled, plus moving links.
- A glossy turret dome.
- An outlined metal barrel with a team-colour band and a muzzle cap.
- Drawn 12% larger than the hitbox, pivoting on the tread line.

**Geometry is unchanged.** The barrel uses `Geo.gunPose`, so the drawn muzzle is where the shot spawns. The turret is angle-independent and covers the pivot, which the existing turret-layer test checks.

**Life:**
- An idle bob of ±0.6 px.
- A hit knockback: a damped squash plus a shove away from the blast.
- The existing hit flash.
- Soot and smoke wisps once a tank has taken ≥40 damage this round, with sparks at ≥90.
- A crown over the unique points leader.
- A bouncing outlined chevron and a team-coloured ground glow on the active tank.

### `pocket-juice.js` (extended)

**Weapon-family personalities:**
- Per-family exhaust smoke and spark colours: shell, seeker, cluster/spread/chain, fire, dirt, drill, roller, bounce, jump, rail, lightning.
- A hot head glow under each shell.
- A blast light tinted by family.

**Specific blasts:**
- **Dirt weapons** make an earthy splash with no fireball or scorch.
- **Fire** throws rising embers.
- **Rail/lightning** throw cyan sparks.
- **Cluster splits** pop in the weapon colour.

**Nuke moment** (radius ≥90 or `nuke`, once per 3 s salvo):
- A short additive screen flash: 0.3 s, never drawn on a paused frame.
- A flattened ground shock ring.
- A mushroom cloud: a narrow stem rising into a wide cap, with a fire glow underneath.

**Air defense** (owner item 1):
- **`intercept`:** a full aerial explosion (light, flash, fireball, smoke, shock ring, 18 sparks), a second "payload cook-off" pop 0.13 s later, an `INTERCEPTED!` callout in the defender's colour and a camera kick. Then 12 hot metal fragments fall with smoke trails, glow, bounce on the real terrain profile and rest.
- **`air-defense-expire`:** on the ground it is a small ground blast with soil chunks; in the air (target lost or out of time) it is a self-destruct pop with falling fragments. Off-screen expiries are skipped.
- **Interceptor smoke trail:** soft puffs are now laid along the missile path, fed from `render.js` with seeker colours. They linger and fade instead of vanishing with the missile.

**Lively touches** (owner item 2):
- **`CLOSE CALL!`:** a tank just outside a blast that receives no hit within 0.3 s flinches (a half-amplitude knock). The callout appears at most once per 0.6 s.
- **Ricochet:** `bounce` events give a spark spray and a light.
- **Big-hit celebration:** when an attacker's hit reaches ≥50, their tank cheers with a hop and glow, and a confetti fountain in the team colour and party colours pops out.
- **Wind-blown debris:** soil chunks drift with the wind in flight. Grass and leaf bits flutter and ride the wind after ground blasts.
- **Dizzy stars:** after a hit of ≥35, three cartoon stars orbit the struck tank's turret for 1.6 s. They are static under reduced motion.
- **Night ambience:** 16 dim fireflies pulse and drift just above the grass. A rare shooting star crosses the upper sky, only during the aim stage, so it is never read as a shell. Both are dimmer than any shell.
- **Pool for confetti and leaves:** they have their own pool of 70, so a nuke's debris can't evict them.

**Turn choreography:**
- A 6.5% push-in on the newly active tank (0.4 s in, 0.6 s hold, 0.75 s out). It is released early if that tank fires.
- The aim arc becomes sized dots shading from the team colour to a power-hot tip (yellow → red by power), with a marching highlight.
- Barrel aim is smoothed (`render.js` pose loop).

**Round moment:** a `FINAL ROUND` banner at the first turn of the last round, and `LAST SHOT!` on the last turn. It is a slanted ink ribbon with team-colour rules and FatRunner type, screen-centred below the HUD notch.

**Paused frames.**
- Soft sprites are created and warmed when a particle spawns, not on first draw.
- The full-screen nuke flash is not drawn on a paused frame. WebKit's first composite of that additive rect differed by 1 LSB from later ones, which broke `pocket-explosion-waves-browser` pause identity; the cause was found by bisection.

### `render.js` (hook lines only)
- Imports.
- Terrain fill uses the world pattern, and the deep fill colour matches the strata.
- `world.dress` after `bakeSurface`.
- Embers after terrain.
- `drawToyTank` replaces the hull and barrel strokes.
- Leader computation and aim smoothing in the pose loop.
- `juice.drawAim`.
- Weapon and context passed to `juice.trail`.
- Interceptor trail.
- Sky call (the old pixel stars are no longer drawn).
- Focus transform.

Codex polish123 (`pocket-world.js` prevailing weather with integrated cloud and streak displacement; `render.js` toy drone) and Codex's integration119 camera (`pocket-camera.js`, `pocketFrame`, offscreen cues) and integration118's juice clear-reset were preserved; this pass builds on them.

## Constraints
- **Weapon payload:** `Buffer.byteLength(JSON.stringify(WEAPONS))` = **399,982** bytes, unchanged and under 400,000. No weapon, simulation or terrain file was edited.
- **Paused frames:**
  - Every new animation runs on the juice/world dt clock, which is 0 while paused: twinkle, clouds, streaks, bob, crown, chevron, embers, banner, focus, near-miss resolution and confetti.
  - The nuke screen flash is skipped on dt=0 frames.
  - `pocket-juice-browser` and `pocket-explosion-waves-browser` pause-identity checks pass.
- **Reduced motion:** no camera push, kick, bob, hop, cheer, confetti, leaves, wind streaks, cloud drift, twinkle, banner pop or slide, or knockback, and fewer sparks and fragments. Captures are in `final-reduced-720/` and `moments-reduced-720/`.
- **Bounded pools:**
  - Parts 260, debris 160, confetti/leaves 70, puffs 240, callouts 6, scorches 24, embers 10, near-miss candidates 8.
  - Damage-wear map ≤16.
  - Soft-sprite cache ≤24.
- **Hit-stop timing fix (`render.js`):** `siegeBeat` set the 60 ms hit-stop from `performance.now()`, while `frame(now)` compares against its own clock. Under a synthetic or lagging clock, every frame after a heavy hit was skipped. `pocket-full-renderer-browser` failed this way on `run_n_gun`: a self-hit's −30 glyph and its callout were never painted. The hit-stop now uses the frame timebase (`this.last`). In real rAF the duration is unchanged.

## Performance

WebKit headless on the development Mac, run alone with no screenshots (`NOSNAP=1`). The scenario is Big Shot then Mega Nuke, rAF-driven. `Renderer.frame` and `setState` were timed inside the page (1 ms timer resolution).

| | rAF median | rAF p95 | rAF max | frame median | frame p95 | frame p99 | frame max | setState max |
|---|---|---|---|---|---|---|---|---|
| 1280×720 | 17 ms | 21 ms | 92 ms | 1 ms | 1 ms | 2 ms | 9 ms | 2 ms |
| 1920×1080 | 17 ms | 18 ms | 37 ms | 1 ms | 1 ms | 2 ms | 6 ms | 2 ms |
| 720 reduced motion | 17 ms | 18 ms | 64 ms | 1 ms | 1 ms | 2 ms | 5 ms | 1 ms |

There were no rAF gaps over 100 ms in any run.

**Perf bug found and fixed in this pass.** The first version filled soil columns with a `createPattern` of the painted art. In WebKit that re-rasterised the 1280×850 art on every terrain rebake, costing about 1 s per rebake. The cost happened outside JS timing, so in-page frame cost didn't show it; `gap-probe.cjs` measured 26 gaps of 0.9–1.3 s in 300 frames.

Soil now draws as a plain column mask, then the round's art is composited once with `source-in`, and deposited materials are drawn on top. The same probe now shows 0 gaps. This matters because terrain rebakes every frame while soil is falling.

Earlier capture-run rAF maxima of about 2 s came from screenshot calls running alongside other browser processes. Frame and setState costs stayed small in those runs too.

This is desktop headless evidence, not an Apple TV measurement.

## Captures (all viewed)
Location: `.localparty-build/pocket-siege-art-2026-10-04/`.

**Harnesses:**
- `capture.cjs`: the real `Tanks` simulation at 20 Hz into the production Renderer. It supports `LATE=1` (late frames), `NOSNAP=1` (perf only), `PROBE=1` and `REDUCED=1`.
- `aa-capture.cjs`: the real simulation, where the defender launches AA once `status().canLaunch` allows it.
- `moments.cjs`: scripted presentation events on a real snapshot, for close call, big hit and confetti, ricochet, final round and battered state.

**Folders:**
- `before-720/`: the baseline.
- `it1-720` … `it4-720`, `it4-weapons`: iterations.
  - Iteration 1 found the repeating nuke flash, bead-like clouds, wire-like ridge rims and small tanks.
  - Iteration 2 found the flash still too strong and the stones too dense.
  - Iteration 3 found weak embers and a shapeless mushroom cloud.
  - Iteration 4 found a strata seam after a Dirtball (fixed).
- `final-720/`: Big Shot, Mega Nuke and Skipper, with late frames.
- `final-1080/`: 1920×1080.
- `final-reduced-720/`.
- `aa-720/`, `aa2-720/`: interception. `aa2` has the final bigger burst and falling hot fragments.
- `aa-expire-720/`: interceptor lost its target; it self-destructs in the air, and the ground blast crater is shown cooling.
- `final2-720/`, `final2-1080/`, `aa-final-720/`: after the compositing fix, identical look.
- `moments-720/`, `moments2-720/`, `moments3-720/` (final, adds dizzy stars and fireflies): CLOSE CALL, MASSIVE HIT plus cheering tank and confetti, ricochet sparks, FINAL ROUND banner, battered smoke.
- `moments-reduced-720/`.
- `launcher-real/`: real launcher with 2 human browsers (`scripts/capture-pocket-round3.cjs`). TV 720/1080 aim, fired, impact and paused; phones 320/393 for controller, arsenal, drone, AA, fired and other turn; results on TV and phone.
  - The new world reads under the real HUD notch and bottom cards.
  - The phone controllers and the results podium are unchanged; this pass does not touch them.
  - The dark strip above the Pause overlay is also in the 10-03 capture. It belongs to the shared pause shell, not to this pass.

## Tests
- **Weapon payload:** **399,982 bytes**, unchanged.
- **Unit tests:** `node --test tests/pocket-*.test.cjs tests/siege-terrain.test.cjs` gives **108/108 pass**.
- **WebKit browser tests:** run sequentially on the final code, plus a rerun of the terrain-related tests after the compositing fix.
  - **Pass:** air-defense-render, burial, camera, damage-feedback, deck, drone, drone-weather, explosion-waves, juice (full + reduced), material-recovery, materials, projectile-art, projectile-coverage, projectile-visibility, runtime, siege-fx, deluxe-render-regression.
  - **Rerun after the fix:** burial, juice, explosion-waves, materials and material-recovery pass.
- **`pocket-full-renderer-browser`** (321 weapons through the production Connection and the complete renderer):
  - Weapons 1–292 passed with no renderer defects, including `run_n_gun` after the hit-stop fix. That run was then stopped by a 2 h background limit; its report also logged a mid-run `render.js` change by Codex polish123.
  - Weapons 291–321 were run separately and **PASS** (4,982 snapshots).
  - The run took 8–35 s per weapon. About 570 ms per packet is the test's own full-frame `getImageData` readback; render frame cost is about 2.6 ms.
  - The two-part run predates the final compositing fix and the dizzy/firefly/shooting-star touches. The terrain-related browser tests were rerun after the fix.
- **Pre-existing failure, unchanged:** `pocket-loadout-browser` gives `320 !== 321` draft rows; the draft list excludes the free Single Shot. It failed in the 10-03 baseline too.

## Not verified
- No physical Apple TV or iPhone. 60 fps on a device is not measured, and the device GPU cost of the larger sky layers is unknown.
- Air defense was captured for one intercept and one in-air self-destruct. An interceptor hitting terrain directly takes the ground-pop branch; that branch was exercised in code but not captured.
- `CLOSE CALL`, confetti, ricochet, `FINAL ROUND` and battered smoke were captured from scripted presentation events on a real snapshot. They were not captured in a full normal-clock match, apart from the MASSIVE celebration seen in `final-720`. `LAST SHOT!` was not captured.
- Only about 10 of 321 weapons were inspected visually: Big Shot, Mega Nuke, Skipper, Pineapple, Napalm, Dirtball, Laser Strike, Heatseeker, Thor's Hammer and Single Shot. The full-renderer test covers all 321 for paint and integrity only.
- The pre-existing `pocket-loadout-browser` failure (320 vs 321 draft rows) and the shared pause-shell strip are not caused by this pass and were not changed.

## Integration note (Codex, build 118, kept)
Codex integration 118 reviewed the first version of these modules. It fixed `clear()` to reset `lastNuke` with the clock, and replayed 493 snapshots across seven weapon families without errors (`integration118-panels-pocket-review.md`). Integration 119 added `pocket-camera.js` (bounded cinematic framing and offscreen direction cues) in `render.js`; that is kept as is.
