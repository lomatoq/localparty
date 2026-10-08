# Performance245 — remaining lag after iPhone build146

2026-10-07. The user still reports lag, despite improvement. This round retains measured UI optimizations; it does not declare physical phone/TV performance accepted.

## Retained changes

- Native Host Pick no longer writes the unchanged `stack-backed` body class every scroll/morph frame. This stops redundant shared input/modal/CTA/localization observers. The compact/expanded animation, layout and thresholds remain unchanged.
- Nearby Rooms keeps its shortcut SVG, row metadata and input nodes. Unchanged payloads no longer rebuild them; real changes patch only the necessary values. An edited room name and its focus survive discovery updates.
- Modal background CSS remains paused until the outgoing foreground actually closes. A separate presence flag owns this pause; the existing active flag still owns the same blur/backdrop fade. A native Host Pick animation shorthand with two ID selectors previously overrode the shared pause, leaving its conic rim running under a modal. The specific pause now wins.

## Comparable browser results

All CPU values below are accumulated work for the indicated workload, not physical response time or FPS. Browser jobs ran sequentially, with no parallel build/profile.

| Workload | Before | Retained candidate | Proof |
| --- | --- | --- | --- |
| 12 real Host Pick compact/expanded crossings, two Chromium pairs | Task1851/1841ms | 758/752ms | Body class mutations210→12; exact Chrome geometry |
| Same scroll workload, style work | 1360/1347ms | 317/311ms | Hidden input style/ink work396→24 |
| 100 unchanged Rooms payloads | Task26.4/29.7ms | 4.7/5.7ms | Shortcut SVG swaps100→0 |
| 100 real one-room count updates | Task789/762ms | 349/367ms | Created elements594→0; input identity/focus preserved |
| 12 actual Host Panel closes, three Chromium pairs | Task1218.5/1218.1/1228.8ms | 1042.1/1012.9/992.0ms | 14.5–19.3% less task work |
| Same closing workload, style work | 801.9/807.0/801.3ms | 614.9/632.8/604.2ms | 21.6–24.6% less style work |

WebKit closing behavior passes all four before/candidate cycles. Three background CSS effects advance while the baseline sheet is closing; zero advance in the retained candidate. Foreground motion stays live; markers clear and background effects resume after closure. WebKit has no Chrome CDP CPU metric, so its report's zero metric fields are unavailable measurements, not zero cost.

The first presence-only experiment failed its strict pause assertion: the native button rim still moved. Its diagnostic is retained under `performance245/close-diagnostic`; production was not changed by that failed run. The subsequent specific native pause passed all three pairs and WebKit.

## Behavior and visual evidence

The UI agent's report is [performance245-ui.md](performance245-ui.md). Its final WebKit run checks all twelve crossings against settled geometry within one CSS pixel. First360ms samples caught unfinished transitions and remain separate diagnostics; they do not establish smooth physical timing.

Root viewed candidate WebKit controller Nearby, native rename in a simulated393×500 keyboard viewport, and compact Host Pick. Grouping, right-hand expander/player-count row, account-sized shortcut, unclipped Save, search icon and game-art medallion are retained. Keyboard resize is browser simulation, not a real keyboard acceptance.

Root also viewed the before/candidate Chromium Host Panel and candidate WebKit Host Panel. Material, blur, typography and positions remain. These are cached native-state fixtures; their disabled presentation warning is fixture state, not a newly introduced screen.

Current scoped regressions all pass:

- Strict `host-panel-browser.cjs`: no accidental active-game restart; unchanged55ms class-response and300ms settle limits. At393/320px, class response17–19ms, first visible motion32–34ms, settled266–268ms; occupied-slot/catalogue variation0.03125px.
- Detail/background test:16 Chrome/WebKit scenarios, zero failures or page errors, all36 local Rules readable per engine. Cold/warm blurred art travel, interrupted close/reopen, retained underlying geometry and reduced motion pass.
- Web/native controller popup test:60 actual-action states, zero errors/failures. Profile, rules, populated rankings/player stats, player/audio sheets, active catalogue, game rules, pause, QR and host exit confirmation retain93% material, branch blur, shade, footer insets and clean marker removal.
- Native visibility and symmetric interrupted Host Pick availability pass Chrome/WebKit. Hidden rAF/CSS/WAAPI phases remain parked, network timers continue, and returning resumes pending work correctly.
- Native-shell/Rooms unit suite:39/39. Only scoped checks were rerun; build146's732-test suite is previous-round evidence, not a new245 full-suite result.

Root additionally viewed the new WebKit native profile, pause and player/audio sheet; web game rules; controller By Code; settled Push Pit detail. Back buttons/fields/actions remain aligned, branch blur is visible and detail artwork is sharp after arrival. The [gallery](../../output/playwright/performance245/index.html) distinguishes the12 root-viewed images from the other automatically captured/checked images.

Production freeze `.localparty-build/integration147/source-sha256.json` includes471 sources. Exactly four runtime files differ from146: the two native guards and shared modal JS/CSS. Staged iOS/show product verifiers pass and all36 games are synchronized. Release147 build/install results are appended after their actual completion.

## Release147 installed

Release build succeeds with Swift `-O` and native physics `-O2`. Deep/strict signature and both completed-product verifiers pass. The actual product is0.11.7(147):471 frozen sources,457 byte-matching bundled production files, zero drift/stale/missing. Evidence is under `.localparty-build/integration147`.

CoreDevice installation succeeds and a subsequent installed-app inventory confirms147. The first immediate filtered inventory was empty while registration finished; the later full inventory contains the exact correct bundle/build. The first launch hit a transient unavailable remote-service XPC connection. After registration/connected-device verification, the subsequent launch succeeds with PID48402. These are resolved installation/tooling observations, not claimed app crashes.

The actual device log confirms147 launch at19:16:31UTC, phone402×874 and nominal thermal. Its observed controller catalogue windows reach59.7/59.9fps; menu windows range50.1–59.6fps. A window still has a213ms maximum frame interval. These are passive rAF observations of different user actions, not presented-frame/input latency or a matched improvement claim. No new dedicated TV scene appears in this147 interval.

A30s Time Profiler attach was attempted but did not record: the app had already entered the background at19:18:17UTC and the recorded launch PID was no longer running. The profiler reports `Cannot find process for provided pid`; a fresh process inventory and lifecycle log confirm that condition. No native trace, GPU time, physical keyboard result or casting acceptance is inferred from the failed attempt. An updated readiness request asks for HeyPals plus the separate MacBook TV surface to remain open.

## Physical evidence and open work

The already installed146 produced a dedicated1920×1080 TV scene. Passive logs show some60fps menu windows but also long frames. Later Bowling TV windows were mostly26–28fps, with the phone near60fps. A later Knives window degraded to18.5fps TV/p9580ms while thermal was serious. These are different user-driven workloads, not matched optimization measurements.

At the start of this round, HeyPals was no longer running, the dedicated TV had disconnected and the device was locked. A launch attempt was rejected by iOS as Locked, not a crash or an approval rejection. A user readiness request remains pending. No new physical trace or after-cast improvement is claimed while that condition persists.

Sports/TV GPU candidates remain test-only in [performance245-sports-readonly.md](performance245-sports-readonly.md). Unmeasured shadow caching, pin instancing, conic rasterization and opaque external WK compositing are excluded from this UI release. Resolution, AA, shadows, artwork, blur and authored effect cadence are preserved.
