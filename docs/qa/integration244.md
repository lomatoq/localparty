# Integration244 — 2026-10-07

## Shared UI changes

- Native modal background coordination filters the existing branches of `main`, preserving the sticky Host Pick/search/slider paint order instead of trapping them beneath the header backing. Background motion pauses in place; closing the sheet does not rebuild these surfaces.
- The shared-art flight remains intentionally blurred while travelling, then crossfades to the decoded detail image. Rapid close/reopen retargets its current pose. Cached Rules remain readable for all36 games without TV/server readiness; launch guards remain.
- Native Host Pick retains two painted button faces and crossfades their alpha with the panel rim/right glow. Both availability directions use270ms easing and a small spring scale; unchanged snapshots retain the same face node. Generic CTA wake is skipped for this one action, avoiding a second ring/reflow. The external halo is no longer clipped by button overflow. Other CTA wake behavior is unchanged.
- Narrow Bow320 portrait touch layout moves Draw44px up without shrinking its224×126 field or72px action. The approved Pause/Lobby footer is unchanged.
- TV Pause covers the complete `play` area rather than leaving a second64px header offset. The waiting-screen offset and sculpted game HUD remain unchanged.

## Verification scope

`tests/browser/host-pick-availability244.cjs` passes Chrome/WebKit availability, genuine rapid reversal before the fade finishes, retained face identity after100 unchanged updates, unchanged panel/button layout, reduced motion and hidden-native lifecycle. Reversal is sampled within one browser frame: Chromium alpha .476093→.476093; WebKit .820566→.805687 during7ms of update work. Earlier wall-clock/RPC probes were unsuitable for continuity because they could arrive after the animation finished; the final test keeps the strict.03 same-frame tolerance. Root opened final enabled/disabled/reversal images.

Popup detail, Bow320 and TV Pause lanes have actual worker/native-route browser evidence and viewed images in their separate reports. Root also viewed their final material/flight,320/393 Draw, Pocket/Marble/Air Hockey and Sports16-player states. See the [combined gallery](../../output/playwright/performance244/index.html).

## Measured performance changes

- Bow: mesh/storage task CPU median−36% in initial matched pairs; HUD guards−53% in separate final trios. These percentages must not be added. Hidden touch-bow rendering stops; its isolated CPU result is neutral.
- Pocket Siege: three fresh live pairs improve TV task CPU20–29% and phone fixture task CPU19–27%. Stable Pocket/Marble pause paints0 identical frames, with preserved pixels/resume. Marble live CPU is mixed; no throughput gain claimed. The neutral name cache was reverted.
- Sports: effect/text preparation median−21.3%; whole-TV CPU neutral/FPS unchanged. Exact text positions remain. Hidden Sports material allocation is measured but deferred; no GPU/quality reduction claimed.
- Six UI families retain unchanged authored labels/profiles and timer values. Naval's two matched real missed-shot waves reduce task CPU about47%, removing2304 crew/title nodes per wave; randomized hit/sunk CPU is excluded. Public grid, gameplay/cooldown/input cadence and rank order remain.

Individual reports retain before/after data, source manifests, images, deferred work and browser/native limits. This is not an all-game physical performance acceptance or a5–10× speed claim.

## Source / product gate

Production source is frozen in `.localparty-build/integration146/source-sha256.json`. Release146 is built, verified and installed on the physical iPhone; after-cast measurement remains pending. The latest physical log still contains build145 telemetry and no contemporary dedicated TV scene. Physical keyboard, receiver connection reliability, curtain smoothness and iPhone/GPU/cast performance require the new installed product.

An existing Pocket draft-pool test expects321 rows while both frozen before and after contain320 draftable weapons plus the already-included pebble; the source/count behavior is unchanged and that separate test was not weakened. Bow's unchanged landscape/camera-stage fixture limitations are documented in its report. The iPhone app itself is portrait-only.

## Final regression pass

- `npm test`:732/732, followed by Party/Spy integration checks, all pass. The initial broad run exposed eager catalogue observer construction, absent saved-result event history, an old player fixture missing the new `coins:0` field and a stale generated file inventory. Catalogue observers now begin with the first actual UI; missing event history supplies no coin awards. The player equality assertion remains strict, and the inventory was regenerated. Focused repair tests35/35; the complete suite was then repeated.
- `tests/host-panel-browser.cjs`:passes its unchanged active-game restart guard and55ms class response limit. At393/320px, class response17–21ms, visible morph33–38ms, settled266–268ms; flow slot/catalogue variation0.03125px. No simultaneous profiling/build workload.
- Native visibility passes Chromium/WebKit:hidden rAF/CSS/WAAPI phases remain parked, network timers continue, pending callbacks resume once. Slow-renderer curtain test passes both engines, readiness→reveal221/223ms, including return to lobby.
- Actual TV layout:Bowling/Tank/Kart/Warsaw × nine receiver sizes, match-preserving resize/pause, no page errors. The material pixel probe now waits for compositor pause completion and retains the current lip colour so a new urgent countdown transition cannot change it between opposite backing captures. The5-value pixel tolerance stays unchanged. Negative control deliberately makes the HUD transparent and still fails, black[6,5,4] versus white[254,253,252]. This is test-only phase isolation; production material is unchanged.
- Final popup rerun after lazy catalogue initialization:16 Chrome/WebKit scenarios,0 failures/errors; all36 cached Rules opened per engine. Root viewed the fresh36-state contact sheet, plus WebKit Nearby/Host Panel/settled game artwork individually. Physical keyboard and cast performance are separate.
- Product verifier regression tests:16 iOS +6 show tests pass. Staged resource verifiers pass after `ios:prepare`, with all36 games synchronized.

The final source freeze includes the two regression repairs (`public/tv.js`, `lib/tv-director.js`). Their hashes were refreshed before preparation. Build146 uses Release (`Swift -O`, native physics `-O2`); installation is confirmed below; new physical cast telemetry is still pending.


## Device product146

Release build succeeded; deep/strict code signature passes with system certificate access. Both product verifiers pass. All471 source hashes are retained;457 bundled production files byte-match,12 native/asset-manifest sources are compiled by Xcode and2 game tests intentionally excluded. No source drift, stale or missing production files.

CoreDevice install succeeded and installed-app inventory confirms `com.localparty.launcher`,0.11.7(146). Launch was rejected by iOS because the physical device is locked (FBSOpenApplicationErrorDomain7 / CoreDevice10002); this is not a crash or permission-review rejection. An asynchronous request asks the user to unlock/open HeyPals and reconnect the dedicated MacBook display. No physical after-cast result is claimed before that happens.


## Compiled native UI146

The actual Debug Simulator146 product built successfully and both product verifiers pass. Thirteen native audit dispatch/click/read commands pass on its menu and controller WKWebViews; no replacement JS or state fixture was injected. The real catalogue contains all36 games. Existing visible branches blur while Rooms opens, `main` remains unfiltered, and closing clears the branch markers/filter without moving the Host Pick. Six code inputs remain in the By Code panel. Cached Curling Rules opens without a TV.

Root viewed all eight full-size captures: both main screens, Nearby and By Code on both surfaces, host after closing Rooms, and local Rules. They are published in [the compiled-native gallery](../../output/playwright/performance244/native146/index.html). This verifies the compiled native UI; it does not measure physical touch latency, hardware keyboard behavior, AirPlay or GPU performance.

A passive physical lifecycle-log copy after installation still ends with old build145 records, including serious thermal state and degraded phone FPS, with no contemporary TV scene or build146 launch. It provides no after-install performance acceptance.


## Physical reinstall / launch146

On the user’s explicit install request, source freeze was checked again (471files, zero drift); the same verified Release product was reinstalled successfully. CoreDevice inventory again confirms0.11.7(146). The subsequent launch succeeded. The previous Locked rejection is historical; dedicated cast performance and real keyboard interaction remain unvalidated. Evidence: `reinstall.json`, `reinstalled.json`, `relaunch.json` under `.localparty-build/integration146`.


The passive log now confirms a new146 launch and a1920×1080 dedicated `/tv` scene. One menu window reaches60fps on phone and TV; a later window drops to36.1fps on both while thermal is nominal, with occasional100ms+ spikes. This is not a matched before/after or interaction-latency measurement. The test Simulator app was then terminated to remove its local receiver resource contention; any subsequent sample must be recorded separately. The user has been asked to exercise Rooms/room expansion/scroll under cast. Full physical performance acceptance remains open.


## Physical Bowling146 observation

After terminating the test Simulator app, a second copied log contains user-driven Bowling with the dedicated1920×1080 TV active. Phone controller FPS range [58.0, 60.0] over 14 windows; TV game range [26.3, 58.9] over 14 windows. Most steady phone windows approach60fps; TV remains around26–28fps. Thermal is fair in those windows. There is no matched standalone/cast baseline, input-latency trace, popup workload or visual curtain acceptance in this observation. The physical cast now exists and is measured passively, but overall performance acceptance remains open. Raw log: `device-after-simulator-closed.log`; extraction: `device-bowling146.json`.
