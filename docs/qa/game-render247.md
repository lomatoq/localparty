# Sports rendering lane 247

2026-10-09. Baseline revision `87dd64fa783c3092061ac5a77074839e2fbfb185`. **Root accepted only the camera-ordering change; it is now in production source.** Browser work was serialized by the root lane. These desktop browser timings do not establish actual iPhone with/without a separate TV performance.

Applied [Addy Osmani Performance Optimization](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md): isolate one cause, compare balanced repeated workloads and reject neutral/regressing changes. Read current AGENTS/design/regression contracts. No quality, art, shader style, resolution, AA, shadow, animation cadence, physics or input changes.

## Baseline and separate candidates

Twenty Sports JS files frozen at `.localparty-build/perf247/sports-before/manifest.json`. Shared runtime is `games/sports_siege/public/`, served as Bowling, Curling, Peek and Swarm Gate. There is no `public/sports-games/` directory. Current host SHA256 is `7ab73abff43801eb3879406eba154566b2bc920cb55d7d2290b97d28a60ba0a0`, identical to build147/246's unchanged Sports baseline.

- HUD candidate: ignored `.localparty-build/perf247/sports-hud/`, never accepted in 246. Authored/localized text, attributes and normalized styles avoid unchanged snapshot mutations. It remains separate from camera work. The earlier 19,500→0 mutation result and single timing pair are historical component evidence; they do not establish 247 throughput or device performance.
- Curling camera candidate: ignored `.localparty-build/perf247/curling-directed/`. Queries `CurlingFeel.shot` after the existing FOV/house/live/last-stone preparation, before default fitting. A returned directed shot skips only the fallback that would be overwritten. Null/reduced-motion/default paths retain the original fit. Host source in that candidate is the fresh baseline, not the HUD experiment.

## Reproducible hotspot from source

`CurlingScene.updateCamera` computes a default `fit` before `CurlingFeel.shot` can replace it. Each fit performs three passes, each with 22 binary-search placements and one final bounds evaluation: 69 complete point-projection loops. Chase, crane and last-stone measure choreography can discard that first result, sometimes performing another fit for the chosen shot. This is a concrete duplicate calculation, but its active fraction and CPU cost are still unmeasured in 247.

The candidate does not advance timestamps, interpolation, trauma, camera springs or game state. `CurlingFeel.shot` reads snapshot velocity and current positions; its fit reinitializes the temporary camera. Exact numerical equivalence remains a required runtime gate, not a source-inspection claim.

## Prepared harness and gates

`scripts/performance247-sports.cjs` uses an actual isolated worker, TV socket, phone with both native bridge/tabs scripts, actual existing bots and real Bowling/Curling swipes. Response instrumentation stays test-only. Source and shared-CSS hashes, TV/phone CDP task/style/layout counters, real stage counts, full backing/AA/shadow settings and resource/compile counts are recorded.

Camera instrumentation distinguishes fallback versus directed fits and counts their 69×point-count projections. `QA_CAMERA_ORACLE=1` additionally compares the original camera method in its original module lexical scope against the candidate on actual rendered frames. It restores camera spring/FOV/pose/trauma state between evaluations and checks finite values plus exact poses, quaternions, matrices and projection values. Separate, explicitly controlled camera-only fixtures cover aim/rolling/reveal/end, playing/results/waiting and reduced motion; they are not fabricated authoritative matches. Oracle work is excluded from accepted timing runs, which use `QA_CAMERA_ORACLE=0`.

The expanded HUD oracle inspects every overlay, player-card, team-drawer and result descendant, including percentage styles, literal identity attributes and body roster metadata. Cases include EN→RU→EN, fractional percentages, team/order changes, replaced/returned identity and avatar presence/removal. `QA_RECONNECT=1` separately closes the actual phone sockets by navigation, then restores the same saved profile and checks offline/online styling, literal name, number and match identity through real snapshots.

Planned acceptance: balanced A–B–B–A normal-clock Curling timings for the camera candidate, a separate exact camera oracle and fresh TV/phone visual review. HUD gets its own balanced Bowling/Curling measurements and a different-mode WebKit gate. No combined-candidate timing will be attributed to a single fix. Only meaningful gains beyond baseline variation can be promoted after root coordination.

Prepared harness, candidate module and exact response-injected modules pass syntax checks. The camera runtime gates below have now run. The HUD oracle/reconnect experiments remain prepared and unrun in 247.

## Camera-only result

One lane at a time; actual server worker, 16-player roster (one phone and 15 existing bots), one real controller swipe, normal simulation clock, 2 s warmup and 4 s measured sample. Both engine batches used A–B–B–A with unchanged baseline host/HUD. B differs only in `scene-curling.js` camera ordering. Browser and ephemeral server were closed after every run; the slot was then handed to the curtain lane.

| Engine/run | Camera updates | Camera CPU, total ms | Mean ms/update | Discarded fallback fits | TV Task, s |
|---|---:|---:|---:|---:|---:|
| Chromium A1 | 241 | 36.8 | 0.1527 | 241 | 2.1213 |
| Chromium B1 | 241 | 21.6 | 0.0896 | 0 | 2.1072 |
| Chromium B2 | 241 | 20.8 | 0.0863 | 0 | 2.0839 |
| Chromium A2 | 240 | 35.8 | 0.1492 | 240 | 2.0761 |
| WebKit A1 | 170 | 33 | 0.1941 | 170 | unavailable |
| WebKit B1 | 177 | 33 | 0.1864 | 2 | unavailable |
| WebKit B2 | 175 | 21 | 0.1200 | 2 | unavailable |
| WebKit A2 | 174 | 31 | 0.1782 | 174 | unavailable |

Chromium camera mean fell **41.7%**, from 0.15093 to 0.08797 ms/update; both candidate repeats lie below both baseline repeats. The discarded fit/projection work is removed: about 351,000 fallback projections per 4 s disappear, while the chosen directed fits remain. Chromium samples stayed in rolling throughout, with identical 81 UI snapshots, 240–241 renders, no new program/shader compilation and stable shared CSS hashes. Overall TV Task is **neutral** (2.09874→2.09554 s mean), as is the phone Task (baseline 0.14008/0.13200 vs candidate 0.14778/0.14860 s). This is a small measured camera-component reduction, not a whole-app or cast-speed claim.

WebKit's aggregate camera mean is 17.7% lower, but B1 overlaps the baseline and `performance.now()` is quantized to 1 ms. Those real swipes enter reveal for 2–7 snapshots and trigger different first-use shader/event work; the 4 s WebKit samples therefore do **not** prove a throughput gain. They do prove the obsolete fallback is skipped whenever a directed shot exists, while the two nondirected reveal updates retain it. No WebKit or iPhone speedup is claimed.

Separate candidate correctness runs (excluded from timings) compared the original method in the original scene-module lexical scope to the candidate on **476 Chromium + 305 WebKit actual frames**, plus **48 fixtures per engine** across phase/stage/last-stone/reduced-motion combinations. All 877 comparisons were finite and exactly equal in camera pose/quaternion/FOV/projection/world matrix, spring position/velocity/rate, house-view flag and trauma. Actual pause→1280×720 resize→resume kept the same match and all 16 players. Every successful run had zero page errors and stable CSS hashes. The first WebKit oracle attempt stopped before timing because the diagnostic wait dereferenced an as-yet-null TV snapshot; changing that harness wait to optional access produced a clean repeat.

Full quality is unchanged: 1920×1080 backing, DPR1, antialiasing 4 samples, shadows enabled with authored 2048 maps, and 512×512 inset with 4 samples. No geometry/material/effect/cadence/physics/input setting changes. Baseline source SHA256 is `8b4fd1cbf43966154fbb6ee3f5822cdfee96f55f75b8d51bb1d5eab492349fc3`; the accepted production module is byte-identical to the measured isolated candidate, SHA256 `a14c5029bbdafdf7da5801e97cbddc94f2419a094999d83e01a34fe022c30211`.

Raw reports and fresh TV/phone captures: `output/playwright/performance247/camera/{chromium,webkit}-{a1,b1,b2,a2,oracle}/`. TV and phone captures were visually inspected in both engines. Phone controls retain their authored hierarchy. Camera/arena geometry is retained, but these live captures are **not pixel-identical phase captures**: the unchanged HUD redraw path catches several blank names/logo in Chromium B1, and WebKit A1 baseline catches a black horizontal strip during its reveal/first-use event. Those are logged as separate render/capture findings rather than passing full-scene visual acceptance. The exact camera gate isolates this candidate from them.

Root accepted only this small camera-ordering change as elimination of the proven discarded calculation. Applied only `games/sports_siege/public/scene-curling.js`; this lane did not change production host/HUD. No claim that it resolves menu/popups/casting. HUD and other shader/allocation candidates remain separate and unaccepted.

Saved regression: `tests/browser/curling-camera247.cjs` runs the actual production worker/controllers and exact oracle against `tests/fixtures/curling-camera-87dd64f.cjs`. The saved original method is evaluated in the original scene-module scope, so the camera test does not depend on ignored candidate files or Git-history availability. `QA_ENGINE=webkit` selects the other engine. Oracle timings contain both calculations and must not be used as performance evidence. The saved method is byte-identical to the original used in the successful paired oracle runs. After promotion, syntax checks, candidate/source equality and `git diff --check` pass; a fresh run of this new wrapper is pending the root's final browser slot.

## Other source-only candidates

| Location | Concrete work | Current disposition |
|---|---|---|
| Sports `updateEffects` | Creates an unused `THREE.Color` for every effect/frame; beam direction clone/normalization is also unused except its length | Untouched; lower priority until live allocation/CPU evidence |
| Swarm `updateObjects` | Four target/pivot/projected vectors and repeated canvas `clientWidth`/`clientHeight` reads per participating turret/frame | Untouched; scratch reuse and one size read per frame need exact transform/rotation equivalence and repeated timings |
| Swarm `updateBots` | Allocates one Color per enemy/frame before `setColorAt`, although values are copied into instance data | Untouched; pool/reuse can preserve colors but must show a meaningful gain |
| Curling camera `fit` | Temporary vectors and bounds objects during 69 projection loops | First measure avoiding the discarded fit; do not add pooling complexity to work that can be removed |
| Curling inset | Already hides work at near-zero opacity and disables shadow redraw for the secondary view | No cut proposed; moving stones and authored fades must remain |
| Bowling | Static lane meshes already merged, neighbour pins/particles/blobs instanced; main shadow casters and ambient props move | Shadow caching/pin instancing remain unaccepted, unmeasured 245 proposals |

No render/frame cap, lower DPR, reduced effects or blanket paused-scene parking is proposed. TV menu/popup/casting problems remain separate from these game-specific findings.
