# Stage HUD lane 248

2026-10-09. Fresh baseline main `16ae1124d4cb30bb5e00d2e1d03973950e0e970a`. **Full HUD candidate rejected for production this pass.** Its measured browser CPU improvement passed the timing gate, but two source-dependent WebKit pixel differences remained under exact equal-state controls. Production `host.js` remains baseline SHA256 `d3c72f68c1287d7e94ddc8401b7e6ab689a8c90b09a31f4bc2faf64c4109cd97`. All browser/server jobs are closed; no further runs, builds or source promotions in this lane. Browser/CPU slots were serialized with the root's device profiling.

Applied [Addy Osmani Performance Optimization](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md): establish a fresh baseline, isolate, repeat, keep only a measured improvement with correctness gates. AGENTS, UI/regression contracts, current TV audit and 247 ledger were read. The current TV audit contains old dated observations; it does not approve new captures. Browser evidence remains separate from physical phone/casting acceptance.

## Scope and source finding

All four games use `games/sports_siege/public/host.js`: Bowling, Curling, Peek and Swarm Gate. The final 247 camera regression found 23,800 DOM mutations across 100 calls to `paintUI` with the identical actual Curling state (14,100 attributes, 9,700 child-list changes). This is diagnostic historical evidence, not a new 248 baseline.

`paintUI` rewrites title/state/player text, hidden/class/ARIA flags, avatar fallbacks and progress styles on every snapshot. Equal `textContent` assignments replace text nodes and wake the i18n/readability observers. Dense Curling also temporarily changes the scoreboard from its required group role to list and back each snapshot. The Stage layout method already has a layout-key guard; do not add a whole-state early return that would suppress time-dependent progress, real notifications or score effects.

## Isolated candidate

Fresh frozen JS baseline and manifest: `.localparty-build/perf248/sports-before/`. Baseline host SHA256: `d3c72f68c1287d7e94ddc8401b7e6ab689a8c90b09a31f4bc2faf64c4109cd97`.

Candidate `.localparty-build/perf248/sports-hud/` uses field-level idempotent writes. Authored text is keyed by value, locale and text-node identity so i18n's localized DOM can remain mounted. Technical flags/attributes compare actual DOM values; localized title/ARIA author values include locale. Progress styles retain both raw and browser-normalized values, avoiding repeated fractional-percentage assignments. Empty results and absent avatar fallbacks no longer repeat identical removals. Dense Curling's scoreboard is assigned its final role directly.

This is a rebase of the unaccepted 246 HUD experiment onto the fresh 248 baseline, not a claim that its old one-pair timing was sufficient. All Stage initialization, readiness, renderer loop, camera, geometry, effects, physics and input code after the state handler is byte-identical to main. No frame/DPR/AA/shadow/quality reduction, roster virtualization or hidden-player omission is proposed.

## Harness checks

`scripts/performance248-sports.cjs` runs an actual isolated worker, TV, phone with both native controller scripts, existing bots and normal real swipes. Separate balanced A–B–B–A playing samples ran for Bowling/Curling. The unchanged-state replay measures 100 writes with mutation types and cost. Real pause/resize/resume preserves match and roster; real disconnect/reconnect verifies the same saved identity and literal player name.

The exact UI oracle compares all HUD/player/drawer/result descendants, attributes, styles and geometry across EN→RU→EN. Cases include actual state, changed score/name/number/offline, fractional and subsecond progress, power expiry, regroup/order, identity replacement/return, avatar presence/removal, sparse/dense/spectator, waiting/results/return. Controlled UI fixtures are labelled separately from authoritative gameplay.

## Fresh actual-game measurements

Eight Chromium runs in A–B–B–A order per game. Each sample is four seconds of actual-worker play after a normal controller swipe, one human plus fifteen existing bots. Both variants served the same 43-file CSS snapshot from main16ae, including `game-ui-system.css` SHA256 `514b8e5c5b3833d4146ff9ca65d41e2c812f25e1d1673711da0bc529312fa984`. The root's current scrollbar CSS change was not mixed into these comparisons. All measured host hashes are either baseline `d3c72f…` or candidate `df16e8b8b5197099296d399b0dcf71083fbe249e93668943450cf5fc9629157e`.

| Metric, total of two 4s samples | Curling A | Curling B | Bowling A | Bowling B |
| --- | ---: | ---: | ---: | ---: |
| `paintUI` calls | 164 | 164 | 164 | 164 |
| `paintUI` CPU, ms | 292.2 | 185.7 | 223.3 | 171.4 |
| TV CDP TaskDuration, s | 4.2171 | 3.6461 | 3.5099 | 3.0076 |
| TV style recalculation, s | 0.8803 | 0.6888 | 0.8814 | 0.6437 |
| TV layout, s | 0.2554 | 0.2045 | 0.1505 | 0.0970 |
| Live DOM mutations | 47,098 | 1,595 | 36,225 | 535 |

Curling HUD CPU decreased 36.45%, TV task time 13.54%; Bowling HUD CPU decreased 23.24%, TV task time 14.31%. Both B samples improved versus both A samples. Curling ran 82 rolling-state paints each; Bowling ran 79–80 rolling and 2–3 reveal-state paints each, with one real roll notification in all four samples. The difference in reveal count is recorded rather than treated as identical physics.

100 unchanged-state calls produced Curling A 23,800 mutations (27.4/27.6ms) versus B zero (3.9/4.2ms); Bowling A 19,500 (21.8/22.6ms) versus B zero (3.4/6.5ms). Fractional progress, countdown, notification and live state updates still execute. Candidate phone CDP task totals changed only −2.95%/−2.29%; that small difference is not a phone-speed claim.

All Chrome samples retained full 1920×1080 backing, DPR1, AA with four samples, enabled shadows and original render resources. Curling had 240–241 main plus inset renders per sample; Bowling 235–241 main renders, p95 frame interval about16.7–16.8ms. No new shader/program compilation. There is no GPU-time or physical-casting result in this lane.

Raw reports/captures: `output/playwright/performance248/stage-hud/{curling,bowling}-chromium-{A1,B1,B2,A2}/`. Fresh Curling/Bowling playing originals were viewed and retain the game-specific HUD, dense roster, curved notch, logo and scene art. Fresh WK Peek/Swarm playing originals and Bowling phone original were also viewed: all16 roster rows, live score/effect bursts, controller state and paired bottom controls remain visible. This is narrow-scope screenshot inspection, not a new design approval for all these pre-existing screens. Independent reviewer read all eight reports and the first Curling pixel originals.

## Correctness and endpoint gates

The expanded oracle has21 variations ×EN→RU→EN =63 comparisons per game/engine: every selected HUD/player/drawer/result descendant, authoring attributes, inline styles and exact rounded geometry. It includes literal user names, text-node replacement, roster reorder/identity replacement, avatar error/removal/return, timer expiry and subsecond/fractional progress. These are explicit UI-only fixtures after normal real-worker gameplay, not fabricated authoritative match results.

Chrome Curling passed all63 plus real disconnect/reconnect preserving id/name/number, three held-render pixel pairs with zero changed channels, real pause/resize/resume retaining all16 players and the same worker instance, zero page errors and zero unchanged-state writes.

WebKit all four games passed63 semantic/style/geometry comparisons each. Bowling and Peek also passed all three strict pixel pairs, real same-identity reconnect, zero unchanged-state mutations and zero page errors. Peek exercised174 real shots,16 score notifications and live transient effects before the diagnostic freeze. Swarm passed reconnect, zero unchanged-state writes and zero errors; actual-playing pixels still differ. Curling's latest failed pixel run saved its oracle/pixels before report finalization, so do not claim its latest complete report or replay count from that run.

| WebKit endpoint | Actual playing | UI-only waiting | UI-only results |
| --- | --- | --- | --- |
| Curling | zero pixel delta | **strict gate failed**, max43; mean0.00696/channel | zero pixel delta |
| Bowling | zero pixel delta | zero pixel delta | zero pixel delta |
| Peek | zero pixel delta | zero pixel delta | zero pixel delta |
| Swarm | **strict gate failed**, max70; mean0.01699/channel | zero pixel delta | zero pixel delta |

Initial WK exact-geometry failures were CSS/WAAPI motion advancing between synchronous layout reads; all text/attributes/styles were equal. Geometry was made deterministic only after timed gameplay by disabling CSS motion and awaiting paused Web Animations. Pixel comparisons use the same held renderer/snapshot/presentation clock, settled520ms motion-class cleanup, finished finite animations and equal zero-time infinite animations. No geometry or pixel tolerance was widened. Controlled waiting/results are differential parity evidence, not final readability or authoritative-results acceptance.

The latest unresolved Curling difference includes name/score glyphs across x0–1279/y7–399 and a1px boundary at y399 (x0–319 and960–1279); it is not exclusively text. Swarm's x275–366/y30–100 difference is the *Don't Bite the Gate* logo image, not health/status text. Independent reviewer visually found identical displayed names/logo/geometry but has not attributed the raster deltas. Original candidate/reference/difference PNGs remain in the corresponding `*-webkit-correctness/` folders. Earlier pause-only/finish-only captures remain in diagnostic folders; do not use them as accepted endpoints.

## Portable diagnostic and final controls

`tests/fixtures/stage-hud-16ae112.cjs` saves original `paintUI` and drawer source, exactly matched to the frozen baseline. The diagnostic harness uses this fixture without needing ignored copies or old Git objects. The untracked `tests/browser/stage-hud248.cjs` acceptance wrapper was removed because its zero-write assertion would require the rejected, unpromoted candidate. Keep the diagnostic harness/fixture and source hashes as reproducible evidence, not as a passing current-production idempotence regression.

The root requested bounded redraw controls only for Curling waiting and Swarm playing. Exactly two sequential WebKit runs used one-second actual-playing samples, frozen248 JS/CSS and no repeat semantic oracle/reconnect. `QA_UI_PIXEL_CONTROLS=1` and `QA_PIXEL_CONTROL_STATE=controlled-waiting` / `actual-playing` produce B→B and A→A PNG pairs and exact computed font/opacity/transform/background/border/mask/clip/backdrop, image-resource, geometry, fixed-clock and held-render-pass inventories. Controls save evidence before the original strict A/B assertion and do not change the candidate, rendering quality or tolerances.

| Final equal-state control | Curling waiting | Swarm playing |
| --- | ---: | ---: |
| A→A changed channels / max delta | 0 /0 | 0 /0 |
| B→B changed channels / max delta | 0 /0 | 0 /0 |
| A/B changed channels / max delta | 4,198 /44 | 7,694 /70 |
| A/B mean delta per channel | 0.0071715 | 0.0169914 |
| Within-source and cross-source pose differences | 0 | 0 |
| Compared fields per capture | 270 | 270 |
| Fixed clock, ms | 8,122 | 7,699 |
| Held render passes | 266 | 118 |

Both final control reports also retain zero unchanged-state mutations and zero page errors. Within each pair and explicitly across A/B, all recorded fields, font/image resources, computed styles, bounds, animation times/states, state.t, clock and renderer-pass counters are identical. Exact cross-source comparisons are saved as empty `cross-pose-differences.json` arrays. A→A/B→B zero does **not** support a random WebKit raster-noise explanation: the difference is reproducible only across source variants. Retained compositor backing after avoiding repeated DOM invalidation is a possible mechanism, but has not been proven. No rendering-quality or observer/compositor fix was invented to force a match.

Final artifacts: `output/playwright/performance248/stage-hud/curling-webkit-redraw-control/controlled-waiting-{candidate,reference,control-A1,control-A2,control-B1,control-B2}.png` and `swarm_gate-webkit-redraw-control/actual-playing-*`, with `report.json`, `pixels.json` and `cross-pose-differences.json`. Independent reviewer was given the exact originals/inventories; root rejected promotion under the strict pixel gate. The control slot was released immediately after the two jobs closed.

The timing method/result is accepted as diagnostic evidence; the full candidate is **not accepted or installed in production**. Strict thresholds remain unchanged, and no whole-app, phone, casting, GPU or menu/popup improvement is claimed. A future narrower candidate needs fresh measurements and endpoint equivalence; no extra hypothesis or retry was started in this pass.
