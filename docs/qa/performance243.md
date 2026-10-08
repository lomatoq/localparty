# Performance 243 — current work and evidence

Date: 2026-10-07. Baseline production build: 144. Production JS source frozen for build145; this lane does not build or install the app. Root owns native lifecycle, the physical device, source freeze and the release number.

## Method and constraints

Read `AGENTS.md`, `docs/qa/design-contract-2026.md`, `docs/qa/ui-regression-rules.md` and the preceding `performance242.md`. Used the specialist measurement workflow already researched there: isolate the actual workload, freeze before source, measure, fix the cause, then run the same workload and behavior checks. No Impeccable optimization workflow was used. [Performance optimization workflow](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md), [profiling workflow](https://github.com/MengTo/Skills/blob/main/agent-skills/codex/performance-profiling/SKILL.md).

Keep all approved artwork, glow, blur, .93 popup material, animation curves/duration, input cadence, score/game rules and backing density. No resolution, DPR, AA, shadows or effect quality was reduced. Browser CPU/layout/DOM counters are separate from native WKWebView, GPU, thermal and AirPlay acceptance. A 4K browser viewport is not a physical 4K output measurement.

Frozen before source is `.localparty-build/perf243/source-before/`; isolated browser artifacts are `output/playwright/performance243/`. Runs are sequential so two browser profiles do not compete for the same desktop CPU. Chromium uses the installed Chrome executable; WebKit uses the existing Playwright WebKit 2336 runtime.

## Measured Kart and shared-stage changes

`scripts/performance243-kart.cjs` starts a real embedded worker, two actual players, TV at 3840×2160 and a 393×852 DPR3 phone. It joins actual game sockets, drives both real server karts for twelve seconds and records frames, geometry reads, DOM mutations and CDP CPU deltas. No match state is fabricated for these measurements.

Three sequential before/after pairs are under `pairs/{before,after}-{1,2,3}/report.json`. Pair 1 tests the core fixes; pairs 2/3 also include the name metric cache and sibling geometry invalidation. The following numbers are medians across these paired runs:

| Work in twelve seconds | Before | After |
| --- | ---: | ---: |
| TV shell rectangle reads | 1671 | 17 |
| Game rectangle reads | 1438 | 6 |
| Game DOM mutation records | 3633 | 302 |
| Controller DOM mutation records | 1695 | 64 |
| Phone tab task CPU, seconds | .585 | .327 |
| Phone tab style CPU, seconds | .118 | .024 |
| Phone tab layout count | 252 | 38 |
| TV tab task CPU, seconds | 1.372 | 1.338 |
| TV tab script CPU, seconds | .393 | .286 |

The phone tab's measured task CPU falls about 44%; style CPU about 80%. TV total task CPU is only about 2.5% lower at the median and one optimized pair is slower. Do not describe this as an overall TV speedup or an FPS gain. Desktop frame p95 is already 16.7–16.8ms in both versions. CDP counters cover each tab including its game iframe, not GPU or encoding. Rectangle-read counters are instrumentation, not proof each read forced a layout.

Causes and fixes:

- `public/bridge.js`: normal clock text rewrites caused `party-tv-layout` messages on every snapshot, even when geometry stayed unchanged. Observe actual anchor/container/sibling sizes and real element structure changes. Keep window resize and stage geometry messages; observe siblings because text can move an anchor inside a fixed-height parent without resizing that parent. Unobserve retired nodes.
- `public/rankings-theme.js`: unrelated world/timer mutations caused full ranking decoration scans; unconditional decorative class writes added more observer work. Only relevant ranking mutations schedule the adapter; decorative classes/styles write on actual changes. Engine score, rank order, names and identity remain authoritative.
- Kart TV: guard leaderboard/winner classes, cache the loaded forest background before reading the moving race canvas rectangle, cache driver name truncation/metrics by authored name and font, and retain authored ranks when the shared adapter decorates their digits. Fallback procedural scenery keeps its world-origin calculation. Font loading and player departures invalidate/retire name caches.
- Kart phone: stable HUD text/disabled/aria fields no longer rewrite each 50ms snapshot. Finished state releases genuinely held controls once. The safety input heartbeat stays unchanged.

The real-worker harness passes row identity and rank reordering, literal-name escaping, advancing clock, pause/resume, receiver resize, unchanged buffers, no hidden shell canvases and zero page errors. Broader geometry and input validation is recorded below when complete.

## Host Pick scroll morph

`syncStick` wrote the animated `--host-run` on the document root. Each frame inherited a changed custom property through the complete catalog, restyling all cards while the active deck changed height. Scope animated run/choice offsets to the sticky tools and choice strip, edge feather to its two backing nodes and CTA clearance to the choice strip. Keep the rarely changing global header inset for dialogs/toasts. The same geometry reads, 240ms curve, occupied slot, hysteresis, cancellation and offset follow-up remain.

Two repeat pairs from `scripts/performance243-host-stack.cjs`, twelve real scroll threshold crossings over approximately 4.3 seconds:

| Browser CPU / frames | Before 1 / 2 | After 1 / 2 |
| --- | ---: | ---: |
| Task CPU seconds | 3.261 / 3.287 | 1.302 / 1.316 |
| Style CPU seconds | 2.682 / 2.690 | .816 / .834 |
| Frame p95 ms | 33.4 / 33.4 | 16.8 / 16.7 |

About 60% lower task CPU and 69% lower style CPU in this specific desktop renderer fixture. The optimized trace samples more animation frames, so its geometry count is higher; fewer dropped frames is the intended result. This is not physical-phone acceptance. The first pairs use actual native host DOM/CSS with an emulated bridge; additional lifecycle checks use the production persistent tabs/visibility injections.

The full existing strict `tests/host-panel-browser.cjs` passes without weakening assertions: 320/393 widths, class response 16–21ms, visible motion 31–35ms, settling 264–267ms, fixed 8px sticky search gap, flow-slot/catalogue movement .03125px, interrupted reversal, popup close/reopen, no-pick pinning, server unavailable and controller-only navigation for an existing active game. Raw report and fresh captures: `host-panel/`. The active medallion CSS is owned and reviewed by root.

## Native hidden work and fresh-active startup

Root captured actual build144 retained WKWebView evidence in `.localparty-build/performance242/device144-cast243.log`: the menu is `nativeVisible=false` yet `document.visibility=visible`, its rAF remains about 59–60Hz with seven running CSS animations while the visible controller and external Curling scene run. This establishes a native hidden-lifecycle defect; browser `document.hidden` is insufficient. Root owns the document-start native visual scheduler and physical retest, separately documented by root.

This lane adds the native-hidden flag to Spotlight's auto-cycle predicate and to both TV idle catalog timers; hide/resume events also synchronize the Spotlight progress. The network/state and authoritative game loop remain alive.

Fresh startup with an already active match exposed a separate bug: the suggestion deck was constructed, but initialization refused to advance during active play; after returning to the lobby the nonempty deck prevented another initialization. Set visibility independent of whether a slide exists, and initialize the first slide when the lobby is available. The very first slide and initial PLAY label are painted immediately before reveal; subsequent manual/automatic slides retain 650ms easing and PLAY↔STARTING keeps its crossfade.

Chromium and WebKit targeted checks pass: fresh-active startup hides the suggestion, return to lobby restores decoded logo/First Play/player metadata/visible PLAY, native hide holds progress and stops auto-cycle, and resume advances to the next slide. Fresh captures in `host-stack/native-{chromium,webkit}/` were visually reviewed. Both expanded and compact active medallions remain visible. The extra headless WebKit helper with persistent-tab/visibility injections records irregular frame p95 around 262–275ms; it is behavioral evidence only and does **not** establish smooth native performance. The strict geometry/timing contract and desktop paired profile above are separate runs.

## Shared Deluxe renderer geometry cache

Pocket Siege and Marble Bloom read the same canvas rectangle every renderer frame. Cache logical `clientWidth/clientHeight`, invalidate through ResizeObserver/window resize/DPR change and disconnect the observer on destroy. Pointer-to-world mapping keeps the live visual rectangle. An initial prototype cached `getBoundingClientRect`, which included the temporary scene-arrival scale and produced a 1915/1918px buffer. The final logical-size cache fixes this: actual before and final-after 4K receiver backings are both **1920×1080**, with unchanged DPR cap. Resize to 1280×720 gives the actual logical game buffer 1280×656. No pixel-density reduction was used.

`scripts/performance243-family.cjs` uses actual worker, TV, native controller bridge/tabs and real bot controllers. Six-second before/final-after samples:

| Runtime | Canvas rectangle reads before / after | Task CPU seconds before / after | Frame p95 ms before / after |
| --- | ---: | ---: | ---: |
| Pocket Siege | 384 / 23 | 1.964 / 1.984 | 16.7 / 16.7 |
| Marble Bloom | 365 / 4 | 1.040 / 1.078 | 16.7 / 16.8 |

Geometry-read work falls, but no overall task CPU gain is established by these single, nondeterministic bot pairs. Do not claim faster gameplay from this table. Both games pass full-size backing, invalidation/resize, pause/resume, unchanged match instance and zero page errors. Final TV and native phone captures `family/{pocket,marble}-after/{tv,phone}-playing.png` were visually reviewed; layout, artwork, controls and material remain intact.

## Catalog-wide source audit and remaining measured gates

Read-only audit covers all **36 games / 20 runtime families** in `performance243-game-audit.md`. It lists eleven specific investigation targets and existing caches, shader warm-up and instancing safeguards. Those source candidates are not measured bottlenecks and are not all implemented. No uncapped `devicePixelRatio` use was found in own renderers; DPR caps alone do not guarantee a small total buffer, so real external backing dimensions/GPU must be measured before any pixel-budget decision.

Current validation checklist (updated as each run finishes):

- Kart three real Chrome4K/phone paired workloads: PASS.
- Full strict Host Pick browser contract: PASS.
- Host Pick initial-active → lobby, complete initial/returned PLAY label and native hide/resume: PASS Chromium/WebKit.
- Shared bridge clock guard, fixed-parent sibling wrap, anchor insertion/removal and resize: PASS Chromium/WebKit. One hundred fixed-size clock rewrites cause zero redundant layout messages; real wrapping/structure geometry still notifies.
- Four-family, nine-receiver-size real TV geometry/instance/pause coverage: individually PASS. Bowling, Tank Arena and Kart pass all sizes in the combined run; Warsaw passes all nine in the targeted run with no page errors. The combined suite still exits FAIL on the new Warsaw4K paint comparison; no all-suite PASS claim. Root accepts the individual-family coverage for this release and has stopped further unrelated fixture investigation.
- Deluxe invalidated canvas geometry cache, real Pocket Siege/Marble Bloom workload and resize: PASS.
- Shared ranking semantic stress fixture: PASS. Existing ties/order/zero/large scores, last-row reachability, TV16 and live rank mutation assertions retained; only output path became configurable. Raw report in `ranking/`.
- Kart physics tests: 12 unit assertions PASS. Real-lap runner initially blocked by sandbox `listen EPERM`; approved unsandboxed rerun PASS, one full actual-physics lap 30.83s with zero offroad frames. No lap assertions changed.
- Kart actual native-route input regression: PASS Chromium/WebKit. Real worker + real TV + production controller bridge/tabs. Chromium multi-touch left+gas, actual touch cancellation, simultaneous opposite steering holds, WebKit actual pointer hold/release and keyboard gas all work. Explicit finished-renderer fixture retires all held controls and a repeated identical ended snapshot sends no duplicate releases. Idle safety input heartbeat remains active; same actual match instance survives. This fixture is labelled as renderer-only and does not fabricate an engine finish.

### Existing TV fixture contract updates

The original `tv-layout-browser.cjs` required a purple RGB pixel sampled from `.tv-info-center`, which is now only the primary-content box. It fails identically with frozen-before bridge/ranking JS: Tank Arena1280×720 RGB63/75/87 versus optimized62/75/87, both outside legacy47/39/66. The actual material is `.tv-info-glass` and is intentionally game-tinted. The updated test retains every receiver/roster/instance/aspect/viewport assertion, requires game-owned HUDs to suppress duplicate shell headers, and checks actual glass paint with live versus temporarily hidden iframe. Visibility is restored in `finally`. It waits for finite HUD entrance animation before sampling. Isolated Warsaw passes all nine sizes, but the combined sequence still produces a4K mismatch (live78/68/77, hidden84/61/73). The cause of this new screenshot invariant's sequence sensitivity is unresolved; do not say finite-entrance waiting fully resolved it or call the full suite passing. No paint tolerance was relaxed and no product material was changed to satisfy the test. Original fixed-purple and exact full-frame pause failures are confirmed baseline issues; the new Warsaw paint mismatch is not yet classified as a baseline/source regression.

The original exact full-iframe pause assertion also fails identically before/after: portrait Tank Arena iframe y555/h810 and pause y627/h738, with the same bottom. `tv-information.css` deliberately reserves HUD space above the shared pause overlay. The current test requires the remaining full width/bottom to be covered, no uncovered area beyond the visible HUD, shared HUD above pause, and full-iframe coverage for game-owned HUDs. These are test-contract repairs only; no product CSS or overlay geometry changed in this lane. Raw baseline failures and final run logs are in `logs/`.

Fresh reviewed screenshots and measured scenarios are grouped in `output/playwright/performance243/index.html`; referenced artifact existence was checked. A 36-game source audit is not a 36-game runtime/visual acceptance.

Final browser work is stopped and production JS remains frozen. Build145/product/signature/native simulator evidence belongs to root. Physical installation was still blocked by CoreDevice device unavailability at handoff, so no physical iPhone+4K after-performance acceptance is claimed here.

## Commands

```sh
export NODE_PATH=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules
QA_ENGINE=chromium PERF_SOURCE_DIR=.localparty-build/perf243/source-before QA_OUTPUT=output/playwright/performance243/pairs/before-2 REPORT=output/playwright/performance243/pairs/before-2/report.json node scripts/performance243-kart.cjs
QA_ENGINE=chromium QA_OUTPUT=output/playwright/performance243/pairs/after-2 REPORT=output/playwright/performance243/pairs/after-2/report.json node scripts/performance243-kart.cjs
PERF_SOURCE_DIR=.localparty-build/perf243/source-before QA_OUTPUT=output/playwright/performance243/host-stack/before-2 node scripts/performance243-host-stack.cjs
QA_OUTPUT=output/playwright/performance243/host-stack/after-2 node scripts/performance243-host-stack.cjs
AUDIT_OUTPUT=output/playwright/performance243/host-panel node tests/host-panel-browser.cjs
QA_ENGINE=webkit QA_OUTPUT=output/playwright/performance243/host-stack/native-webkit node scripts/performance243-host-stack.cjs
QA_ENGINE=chromium QA_OUTPUT=output/playwright/performance243/host-stack/native-chromium node scripts/performance243-host-stack.cjs
node tests/browser/performance243-bridge.cjs
GAME=pocket_siege QA_OUTPUT=output/playwright/performance243/family/pocket-after node scripts/performance243-family.cjs
GAME=marble_bloom QA_OUTPUT=output/playwright/performance243/family/marble-after node scripts/performance243-family.cjs
AUDIT_OUTPUT=output/playwright/performance243/ranking node tests/rankings-theme-browser.cjs
PARTY_LAYOUT_GAMES_ONLY=1 PARTY_LAYOUT_SHOTS=output/playwright/performance243/tv-layout node tests/tv-layout-browser.cjs
PARTY_LAYOUT_GAMES_ONLY=1 PARTY_LAYOUT_GAME_IDS=warsaw PARTY_LAYOUT_SHOTS=output/playwright/performance243/tv-layout node tests/tv-layout-browser.cjs
node --test tests/kart-handling.test.cjs tests/kart-barrier.test.js tests/kart-lap.test.js
node tests/browser/performance243-kart-input.cjs
```

Pending acceptance remains physical iPhone plus actual separate 4K receiver during the same actions, with thermal state and actual external telemetry. Browser counts, simulator lifecycle and successful install are distinct evidence; none should be described as that physical acceptance.
