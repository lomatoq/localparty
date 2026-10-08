# Performance 242: repeated state work and popup background animation

Date: 2026-10-07. Production JS lane: `native-shell/host.js`, `tv.js`, `tv-discovery.js`, `game-spotlight.js`, `app.js`, `button-progress.js`. Shared popup CSS and device telemetry were coordinated with the root/UI lane. No game protocol, input, launch, score, or rules changes.

## Method and limits

Applied the measurement workflow from [Addy Osmani's performance-optimization skill](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md) and [MengTo's performance-profiling skill](https://github.com/MengTo/Skills/blob/main/agent-skills/codex/performance-profiling/SKILL.md): identify the actual hot path, isolate a change, retain behavior, repeat the same scenario. These are specialist references; no Impeccable optimization workflow was used.

`scripts/performance242.cjs` starts an isolated real embedded worker and loads three real routes in one browser: native host at 393×852, embedded controller at 393×852, and TV at 3840×2160. Native bridge and persistent-tab hooks are fixtures; browser measurements do not validate iPhone, AirPlay encoding, television receivers, thermal limits, or haptics. Chrome CDP reports main-thread task/style/layout CPU; it does not report GPU cost. Desktop frame numbers are diagnostic, not device acceptance.

Three sequential before/after pairs use the current CSS in both conditions and intercept the six JS files with their frozen pre-change copies for “before.” The final shared CSS animation pause gate was added only after these pairs. No parallel browser profiles were started by this lane during the pairs. Other host work and machine load may affect absolute CPU figures, so raw reports and limits are retained.

Before JS snapshots: `.localparty-build/perf242/source-before/`. Paired raw reports: `output/playwright/performance242/paired/{before,after}-{1,2,3}/report.json`. Median summary: `output/playwright/performance242/paired/summary.json`.

## Measured changes

| Scenario / surface | Before median | After median | Interpretation |
| --- | ---: | ---: | --- |
| 30 identical snapshots / TV mutations | 510 | 30 | Repeated attribute/text/style writes removed. |
| 30 identical snapshots / TV rect reads | 60 | 0 | Discovery placement and roster fit no longer run for unchanged state. |
| 30 identical snapshots / TV layouts | 30 | 0 | No layout on unchanged TV snapshots. |
| 30 identical snapshots / TV style CPU | 0.274 s | 0.185 s | 33% less style CPU in this browser scenario. |
| Open bots, add four, remove three / host mutations | 495 | 326 | Selection art/title and translated authored labels retained. |
| Same bot actions / host layouts | 60 | 23 | Bot popover reads batched and native selection no longer reflows on every snapshot. |
| Same bot actions / host style CPU | 0.300 s | 0.207 s | 31% less style CPU. |
| Same bot actions / controller mutations | 3522 | 984 | Vote progress and rank lead visibility now write only on change. |
| Same bot actions / controller task CPU | 0.360 s | 0.385 s | **No demonstrated CPU improvement** despite fewer mutations; do not claim an overall multiplier. |
| Same bot actions / TV mutations | 388 | 129 | Same semantic labels and layout inputs retained. |
| Same bot actions / TV layouts | 59 | 41 | Remaining genuine roster/layout changes preserved. |
| Same bot actions / TV style CPU | 0.258 s | 0.212 s | 18% less style CPU. |
| Bot +/- synchronous click handler | 4.6 ms | 0.3 ms | Handler only; this is not total popup latency or app speed. |

The native selected-title bug was concrete: Curling's authored Russian title differed from its localized English DOM title, so every room snapshot reassigned the art, restarted the entrance, and forced `offsetWidth`. Selection now uses an authored identity key, leaving localization in charge of visible text. Actual selection changes retain their entrance.

Bot popover positioning reads anchor/viewport/panel geometry before writes, coalesces updates into one frame, and retains synchronous placement before the entrance starts. Resize/scroll/reanchor and close cancellation remain supported.

TV labels retain the authored value separately from translated DOM. Roster fit caches semantic inputs, while ResizeObserver, window resize and font readiness still handle real geometry changes. Spotlight lamp positioning responds to size, visibility and inserted light layers rather than every metadata/text mutation.

## Blur and background animation

A native bots popover filters real background branches with `blur(8px)` and exact `.93` material. The visible main catalog branch was about 393×5944 CSS pixels; filtering a long animated branch is substantial paint area. Seven CSS background animations were still running under the popup. No blur or approved glow was removed to obtain measurements.

A reversible browser experiment paused only existing background CSSAnimation objects, preserving their phase and resuming them after each 5-second sample. Three pairs: running median task CPU 0.414 s → paused 0.223 s (46% less); style CPU 0.113 s → 0.056 s (50% less). Foreground popup effects stayed running; actual blur and material stayed unchanged. Raw experiment: `output/playwright/performance242/modal-pause-experiment/report.json`.

The root lane then added `animation-play-state:paused!important` to the actual background branches/descendants/pseudo-elements. This retains the CSS phase instead of deleting animations. The production-gate harness separately asserts actual paused background effects, unchanged phase, a running foreground effect, retained blur/material and resumption after close. Its first WebKit run exposed both an instrumentation `Error.stack` assumption (now repaired) and possible gate specificity conflicts with legacy `!important` animation rules. The root lane strengthened the selector to beat existing CTA specificity. `scripts/performance242-modal-gate.cjs` then passed in WebKit and Chrome: 89 displayed background animation objects retain phase for 1.7 seconds, popup CTA remains running, and existing effects resume after close (55 WebKit / 53 Chrome). WebKit retains clock-only objects on the display:none legacy H1 and hidden catalogState; these have no client rectangles and do not paint. Final gate raw report/images: `output/playwright/performance242/modal-gate/`. The experimental 46% figure is not a physical-device speed claim; corrected CSS shipped in build 143 and the final threshold-response JS patch shipped in build 144.

## Return-to-lobby defect

Returning from an expanded active game left the native header veil 420–422px high instead of its lobby 178–180px. Logo, meta and suggestion title all had opacity 1; hiding only `.native-stack-backing` and `.native-stack-blur` restored the image, proving the veil was stale.

The stack measurement read the sticky tools' position using the previous inherited `--host-run` offset, then wrote the new offset. A position-only change does not notify ResizeObserver. The fix schedules exactly one follow-up geometry frame when head/run/choice offsets change; unchanged room snapshots do not get a loop. A separate compaction timing fix commits only actual threshold crossings in the scroll event with the same read/change/read FLIP sequence; continuous stack measurements remain coalesced. It preserves the 8/24px hysteresis, 240ms easing, occupied slot and cancellation behavior. Both WebKit and Chrome returned to the original lobby veil height. Fresh verified images: `output/playwright/performance242/return/{webkit,chromium}-returned.png`. Diagnostic isolation script: `scripts/performance242-return.cjs`.

## Runtime checks

- `tests/browser/performance242-stability.cjs`: PASS Chromium and WebKit. Twelve translated Curling roster updates retain the same title/art with zero restart mutations. Actual three-player partial voting does not launch a game; ten duplicate snapshots keep pressed/count/total and same button; withdrawal returns to zero. Bot popover bounds/blur cleanup checked. Same selected active game's action explicitly emits only `controller`, never a launch/restart command in both engines.
- `tests/browser/popup171-bots-motion.cjs`: PASS Chromium and WebKit. Open/close contain intermediate opacity, geometry is final before entrance, and closing removes the actual top-layer popover.
- `node --test tests/ballot-network.test.js tests/game-ballot.test.js`: PASS 3 tests.
- `tests/performance141.cjs` Kart: PASS real two-player worker/WebKit TV/controller session. Preserves row identity, reorders ranks, treats names as text, advances the clock, pauses/resumes, resizes the scene; zero page errors and zero hidden shell canvases. The 12-second run recorded TV shell stable mutations 12, phone shell 83. Raw report `output/playwright/performance242/kart.json`; desktop frames do not validate AirPlay.
- Syntax checks: PASS all six production JS files and four new harnesses.
- Actual production gate single-host: PASS WebKit and Chrome, phase/foreground/blur/material/resume checked without 4K profiling load.
- Six paired profiles: PASS all retained `blur(8px)`, `.93`, no active blur after close, zero page errors.
- Existing `tests/host-panel-browser.cjs`: technical `#openHost` entry was intentionally hidden by prior approved UI; fixture now invokes its retained modal hook. Active-match navigation/no-restart assertions are preserved. Strict motion gate initially failed at 61–64ms versus 55ms. A final minimal host fix commits the existing threshold-change FLIP in the scroll event, retaining RAF batching for continuous stack geometry. Full existing test now **PASS**, with no weakened assertions: 393px class 18–21ms, visible motion 33–74ms, settle 270–287ms; 320px class 18–20ms, visible motion 33–69ms, settle 266–293ms. Scroll event→logical mode mutation is 0ms; flow-slot variation/catalogue jump 0.03125px; interrupted reversal, close/reopen, pinning, narrow layouts and active-game controller-only command pass. Fresh report/captures `output/playwright/performance242/host-panel/`.

All 11 strict Host Panel captures were visually reviewed. Active top/scrolled states retain the lime Controller action and centered icon/label group. The 320/393/402/430px sticky states preserve Host Pick art, circular Play, visible search icon, soft lower header fade and stable card spacing; the three no-pick states do not leave an empty Host Pick slot. The panel retains centered copy, rounded controls and centered Back. `server-unavailable-320.png` captures a viewport resize during the one-time entrance, so its partially entering art is not evidence of the settled layout; the settled narrow sticky captures were checked separately. Modal-gate bots and returned-lobby screenshots were also reviewed. No visual quality reduction was used for performance.

## Commands

Use the app's bundled Playwright runtime:

```sh
export NODE_PATH=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules
PERF_FAST=1 PERF_SOURCE_DIR=.localparty-build/perf242/source-before QA_OUTPUT=output/playwright/performance242/paired/before-1 node scripts/performance242.cjs
PERF_FAST=1 QA_OUTPUT=output/playwright/performance242/paired/after-1 node scripts/performance242.cjs
# Repeat sequentially for 2 and 3.
PERF_FAST=1 PERF_MODAL_GATE=1 QA_OUTPUT=output/playwright/performance242/modal-pause-experiment node scripts/performance242.cjs
QA_ENGINE=webkit PERF_FAST=1 PERF_PRODUCTION_MODAL_GATE=1 QA_OUTPUT=output/playwright/performance242/final-webkit node scripts/performance242.cjs
node tests/browser/performance242-stability.cjs
AUDIT_OUTPUT=output/playwright/performance242/host-panel node tests/host-panel-browser.cjs
node scripts/performance242-return.cjs
node scripts/performance242-modal-gate.cjs
REPORT=output/playwright/performance242/kart.json node tests/performance141.cjs
node --test tests/ballot-network.test.js tests/game-ballot.test.js
```

Local listening/browser process permissions must allow the harness. `listen EPERM` in the restricted runner is not an application failure.

## Hardware and remaining evidence

Root installed build 141 as the pre-performance device baseline. Its phone+AirPlay-to-Mac telemetry included around 2.4fps with thermal serious, but this overlapped failed Instruments attach attempts and is not a clean speed comparison. Root's later build 143 passive sample contains 22 phone windows, median 58.35fps and median window p95 19ms, with thermal fair→serious; it contains no dedicated TV samples and is not casting acceptance. Build 144 was built, product hashes/signature checked, installed, launched and its device version confirmed by root. The performance JS, strengthened modal pause CSS and final host compaction patch are included. Receiver-ready confirmation and a clean active phone+TV comparison remain pending. This lane does not claim to have fixed physical-device cast performance; device logs and product hashes are managed by root. All browser profiling jobs from this lane have ended.

Swift retains both menu and controller WKWebViews. Only the controller currently receives explicit native-hide/resume signals; several UI paths depend on `document.hidden`. Actual hidden-view WebKit visibility and animation state need simulator/passive native telemetry verification before adding lifecycle behavior. Existing input release must remain intact. The Kart run also exposed remaining game-local repeated ranking class writes (about 3500 mutations / 12 seconds and 1426 rect reads) and unchanged controller HUD text writes. These were recorded for a separate isolated game-render pass; no frozen 143 gameplay code was changed in response to a single run. Root added narrow visibility/animation/nativeVisible tags to the existing 10-second telemetry; no arbitrary JS device evaluation API or extra per-frame bridge work was added.
