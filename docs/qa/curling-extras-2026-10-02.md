# Curling "Ice & Nerves" — arena extras (2026-10-02)

Owner request: make the Curling TV field and moments more premium and alive. All new work lives in
`games/sports_siege/public/curling-extras.js` (class `CurlingExtras`, constructed by `CurlingScene`).

## Files changed
- NEW `games/sports_siege/public/curling-extras.js` — the whole layer.
- `games/sports_siege/public/scene-curling.js` — hook lines only: import, `this.extras = new CurlingExtras(this)`,
  `this.extras?.update(s, dt, positions, active)` after `updateEffects`, `this.extras?.contact(...)` in `contact()`,
  `effect(e, s)` forwards to `this.extras?.effect(e, s)` (host.js already passes `(e, s)`), dispose in `dispose()`.
- `games/sports_siege/server.js` — one static-map entry `'/curling-extras.js':'curling-extras.js'`.
- `docs/agents/game-polish-lanes.md` — lane note.
- Not touched: crowd/spectator code, host.js, style.css, controls.js, physics, rules, protocol.

## What was added (render-only, from snapshots)
- Haze spotlight rig: two volumetric beams (custom additive shader, soft rim, no wash near the lens) from a
  ceiling truss. Between throws they sweep the opposite stands; during the roll they chase the stone (team tint);
  on the last stone they converge on the house; on the end score they light the counted stones in team colour.
- Rink-end LED scoreboard behind the house: team marks, score, END n/N, stone pips (thrown dimmed);
  "ЗАМЕР/MEASURE" during the last-stone reveal; full team-colour "+N" flash on a scoring end.
- Side LED ribbons at the glass base: slow scroll with team marks/score, tinted in the scoring colour.
- Four team banners (coral left, turquoise right) on a bar behind the LED board with CPU cloth motion
  (bigger flutter on a score).
- Ice: lamp reflection streaks computed from the camera (mirror of the ceiling lamps), soft team-tinted speed
  sheen behind the moving stone.
- Sweep frost spray from the broom heads (bounded pool, stretched sparks).
- Contact: hot flash sprite, expanding shock ring, 14–32 stretched sparks (in addition to existing ring/dust/clack).
- Measure: three house-ring pulses (gold, sequential), soft overhead column; score: rings + column in team colour,
  rising light pillars on the stones counted in `endScores`.
- Score celebration: team-colour confetti from both sides of the house (lands and fades on the ice) and a sparkle ring.
- Ambient: drifting low ice mist, dust motes lit by the beams, occasional pebble twinkles around the house between throws.
- All extras are on camera layer 1, so the overhead HOUSE inset (layer 0) stays clean.

Bounds: sparks ≤260 (120 software), confetti ≤150 (70), motes 48 (24), mist 8 (4); one-time geometries/materials
registered with the scene tracker and released on dispose. Reduced motion: beams fixed, no cloth/LED scroll,
no confetti/sparks/mote drift, contact shows flash + ring only; no camera changes anywhere.
Stale-score guard: a score event older than 1.5 s of engine time (TV reload replay) does not celebrate.

## Verification
- `node --test tests/curling-physics.test.js` — 14/14 pass.
- Playwright WebKit, real launcher, two phone controllers with real swipes/sweeps, no state injection:
  `QA_ENDS=3 QA_OUTPUT=.localparty-build/curling-extras/final2 node scripts/capture-curling-upgrade.cjs` — PASS, 31 screens,
  page errors none; the one TV console error (`glTexSubImage2D offset overflows`) is identical in the baseline run.
- Frame time (TV 1280×720): avg 16.6–16.7 ms (60 fps) in aim/roll; rAF CPU cost 5.2–5.9 ms avg vs 4.3–4.7 ms baseline;
  draw calls ~105–121 vs 70–90 baseline.
- One-shot effects probe (real match, effects triggered through the presentation-only `window.__ssCurlingExtras`
  handle; no engine state touched): `.localparty-build/curling-extras/probe2/` — contact sparks, LED "+2" flash, confetti.

Images viewed: before `01-aim`; final2 `01-aim-720`, `02-slide-720`, `03-sweep-1080` (round 1), `04-contact-720`,
`05-measure-1080` (captured at end score), `06-score-720`, `07-next-end-1080`, `09b-reduced-roll-720`, `10-result-720`;
probe2 `p2-contact-sparks-1080`.

Fix round (from viewed captures): beams were invisible in the aim shot (rig moved over the stands, sweep the crowd
between throws, intensity raised), then over-exposed the house/score shots and left hard cone rims on the ice
(added near-camera fade + soft foot, lowered house-mode intensities, spread measure targets); flat lamp-reflection
blocks narrowed into streaks; wall banners were never in frame and moved behind the LED board.

## Not verified
- Real 4K TV beyond the 3840×2160 capture file (not inspected), software-renderer (`low`) path, audio unchanged.
- The live `05-measure` frame landed on the end-score stage in final2; the gold measure pulse was seen in the round-1 capture only.
- Remaining faint beam foot ellipse around a sliding stone in the chase shot (acceptable, subtle).
