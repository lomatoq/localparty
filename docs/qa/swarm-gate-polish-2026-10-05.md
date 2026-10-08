# Swarm Gate ("Don't bite the gate!") — visual and game-feel pass, 2026-10-05

Owner: Claude swarm agent. Render-only. No rules, scoring, balance or controller changes.

## Evidence
- Before/after montage (1080, five real states): `.localparty-build/swarm-gate-polish/montage-before-after-1080.png`
- Before: `.localparty-build/swarm-gate-polish/before/` (2 phones + 2 bots) and `before-gate/` (2 phones, swarm left to reach the gate). Dense baseline: `before-dense16/`.
- After: `after/`, `after-gate/`, `after-reduced/` (prefers-reduced-motion), `after-dense16/` (2 phones + 14 bots).
- Iterations: `iter1` … `iter6-dense16`. Each run has a `report.json` with per-capture state, `__ssSwarmDiag` geometry, perf samples, console and page errors.
- Harness: `scripts/capture-swarm-gate-polish.cjs`. It uses the real launcher and server. Two WebKit phones join, press Ready and hold FIRE through the real controller, and their aim follows live bugs through a test-only aim hook. Optional built-in bots. Nothing is injected (no state, hits or scores). Env: `QA_BOTS`, `QA_QUICK`, `QA_REDUCED`, `QA_GATE_WAIT`, `QA_CHEW_MS`, `QA_HOST_FILE` (baseline override).

## Critique of the before state (captures viewed)
1. **Composition and scale.** The camera used a fixed span, which left a dead floor band of about 165 px at 1080 under the wall. The field covered only the middle 56% of the width. Bugs were about 40 px and the wall about 180 px, so the battlefield between the HUD and the turrets was cramped.
2. **Turrets.** Each turret was one flat sprite tinted in a single colour, with no shading contrast. The wall clipped the lower part of every circular plate (the wall was in front in depth), which broke the "platform fully visible" rule. Gate towers covered the inner turrets. Player number tags sat on the wall without names.
3. **Shots.** The projectile was about 10 px with a faint trail and a small star muzzle. There was no recoil and no barrel reaction.
4. **Deaths.** Kills were small and read as puffs. Several overlapping `+10` labels dominated the moment. The killed bug disappeared up to 0.18 s before its shell arrived (the server drops it at once).
5. **Gate damage.** The only cue was the HUD percentage. Bugs at the gate turned into a mass of blue ghosts, with no cracks, splinters, thumps or danger cue.
6. **Waves.** Wave start and wave clear were text notices only. Between waves, barrels pointed down into the wall.
7. **Ambient.** The scene was static.

## Changes
New modules, each with one static-map line in `games/sports_siege/server.js`:
- `swarm-fx.js` is the router and framing code. It fits the band from the spawn line (z = −28) to the wall foot between the bottom of the HUD capsule and the top of the roster, measured from the DOM. That is about 24% closer than before at 16:9, with a minimum width so the ±18 field always fits. It re-checks every 0.9 s (fonts and roster changes). Errors are contained, so host feedback can never be lost.
- `swarm-turrets.js` builds a modelled 3D cannon per player:
  - Parts: stone octagonal plinth with a brass-bolted collar, a player-colour LED ring, a gunmetal turntable, a painted dome, cheeks, a gun shield, a scope and an antenna.
  - Barrel: steel barrel with a brass cooling sleeve, rails and muzzle brake.
  - Shading: a toon ramp plus inverted-hull outlines to match the painted bugs, and a contact shadow.
  - Placement: the yaw axis sits on the server anchor and the barrel is level with the aim plane, so the barrel, muzzle and projectile lie exactly on the authoritative ray (`muzzleRayError` is 0.0 px in diag). The group is lifted toward the orthographic camera along its view axis, which keeps the identical screen position but renders the turret in front of the wall. The host flat sprites are hidden; their group and pivot stay for diagnostics.
  - Behaviour: recoil kick and spring at 8 shots/s, brass casings, heat glow on the steel only, and an overheat lock with a red LED blink (≤ 2 Hz) and steam. Pop-in on join.
  - Name tags: a number chip plus the name, at a constant on-screen size. With 9–16 crews the cannons are smaller (0.9 instead of 1.2) and the tags are 24 px.
- `swarm-impacts.js` holds pooled tracers, the muzzle flash and glow, hit spark stars and sparks, and miss dust. A kill adds a flash, a staged painted fireball (explosion-1 to explosion-4), a spark star, debris shards in the bug's own colours, embers, lingering smoke, and a goo splat that fades on the ground. Tanks and the boss also get a ground shock ring; the boss adds chained secondary blasts and a heavier camera punch. Pulse adds a ground ring and a dust ring.
  - The killed bug is held visible until the shell lands, which fixes before-state item 4.
  - Everything is bounded: sprite and plane pools steal their oldest member, and instanced particle caps are 260, 240, 48 and 60.
  - Dense crews skip casings and halve debris.
- `swarm-ambience.js` handles:
  - Atmosphere: spawn-zone darkness, a red horn flare along the spawn line at wave start, and 30 drifting motes.
  - Gate drama: flickering braziers with embers on the gate towers, progressive gate cracks (three levels by real gate %), wood splinters and dust where bugs chew, and damage thumps every ~1.5% of real gate loss (red door flash, a light kick, and a HUD bar knock).
  - Danger cues: a red edge vignette below 55% gate, and the gate bar turns red and pulses below 35%.
  - Wave clear: fireworks over the gate, rising heal pluses, a green door glow and confetti.

`host.js` has six added lines and no other edits, verified by a diff against a copy taken before work started:
- a dynamic `import('./swarm-fx.js')` in the swarm `staticScene`
- `swarmFX?.update` and `swarmFX?.effect`
- a `turretMuzzle` override
- `swarmFX?.frame` in `resize`

The host's own required feedback is untouched and still plays: death pop with scale-up and redden, the 8-frame death sheet, spinning puffs, scorch, kill halo, hit-stop, kick, and score popups that use `awardedScore`.

### Reduced motion
- Disabled: no drift, casings, embers, debris bursts, vignette pulse or camera kicks (the host also gates its kicks), and no blinking.
- Kept: static state cues (cracks, LED colour, steady vignette).

## Checks
- `node --test tests/swarm-score-events.test.cjs`: 16/16 pass.
- `QA_WALL=1 tests/browser/swarm-feedback-browser.cjs`: passes, with real shots, kills, the visible lethal projectile before impact, popups and wall ghosts. One run out of three hit a startup `until` timeout before play; it passed on rerun.
- Real shooting at 720 and 1080 was viewed:
  - kill bursts (`04-kill-720-burst*`, `05-kill-1080-burst*`)
  - bugs at the gate (`06`, `07`)
  - diagonal shots back into the gate (`08`, `09`)
  - full platforms in front of the wall
  - wave horn (`01b`), wave clear and repair (`10`, `11`)
  - 16 crews (`after-dense16/03-firing-1080`)
- Performance in headless WebKit, median / p95 frame time:

  | Run | Before | After |
  |---|---|---|
  | 4 crews, firing | 17 / 20–40 ms | 17 / 24–30 ms |
  | 2 crews | 17 ms median | 17 / 19–22 ms |
  | 16 crews, 14 bot iframes on the same page | 26 / 98 ms | 32–37 / ~105 ms |

  The 16-crew run is dominated by the bot iframes. The overhead there is real but moderate; trims were applied for dense crews.
- Console: no page errors. `PCFSoftShadowMap removed` and `Texture marked for update but no image data` were already present before this work.

## Not verified
- Real TV hardware, the iOS native host (`partyapp://` path and MIME allowlist for the new `.js` modules), or a GPU-accelerated browser at 60 fps with 16 humans. Headless WebKit only.
- Audio: the work is visual only.
- The 4:3 and portrait host layouts (`innerWidth <= 700` keeps the host framing).
- Coordination: the Codex art director lane (turrets-v5/v6 flat art in host.js) is now visually superseded by `swarm-turrets.js`. Their sprites still load but are hidden. The owner or parent should confirm which turret direction to keep.

## Follow-up: wall occlusion (owner decision, 2026-10-05)
- The owner reported that with many players, turrets were painted over the wall. Decision: the wall/parapet/gate render on top of turrets, and rows sort by real depth. This supersedes the "platform fully visible in front of the wall" rule; the rules file has been updated.
- Fix (presentation only): `CAMERA_LIFT=0` in `swarm-turrets.js`. Turrets keep their server world depth (z −9.5, and −15 for the dense back row), which is physically behind the wall (z 0). The wall sprite's depth write therefore occludes them, and the two rows sort by true depth. Back-row name tags now sit above their cannon.
- Server anchors are unchanged. I first checked whether moving turrets *below* the wall could be done in the simulation. A deterministic probe (same seed, same aim policy, 4 crews, 90 s) shows that moving the anchors from z −9.5 to +4 changes hits, kills and scores (kills 69/59/59/65 → 79/69/60/50), so it is not presentation-only and was not applied. Probe: scratchpad `anchor-probe.cjs`.
- Evidence: `.localparty-build/swarm-gate-polish/layout-current-{4,8,12,16}p/` (before; montage `montage-layout-current-4-8-12-16.png`). After: `occlusion-4p/`, `occlusion-16p/`, montage `montage-wall-occlusion-4-16-1080.png`. `muzzleRayError` is 0.0 px for all 4 and all 16 turrets. Median frame time is 17 ms (4 crews) and 31 ms (16 crews with 14 bot iframes on the page).
- Not recaptured after this follow-up: 8 and 12 crews, the 720 frames of the occlusion runs (they were captured but only 1080 was viewed), the gate-pressure run, and reduced motion.
