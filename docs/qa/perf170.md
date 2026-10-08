# Performance pass 170 — measured waste, not a whole-app speed claim

## Findings and fixes

### Offscreen CTA animation cascade regression

The visibility observer correctly assigned `--hp-cta-play: paused`, but the more specific `animation: ... infinite !important` shorthand reset `animation-play-state` to `running`. On a 393×852 native catalogue, **37** moving-gradient animations ran, including all **36 offscreen** Start buttons.

The winning play-state rule now preserves the existing moving contour and bloom on visible priority actions and pauses offscreen/background actions. Opening a modal pauses catalogue actions while allowing its own visible priorities to animate.

Controlled Chromium 5-second idle measurements, same page before/after only the play-state override:

| Metric | Broken cascade | Correct visibility gate |
|---|---:|---:|
| Running CTA contours | 37 | 1 |
| Main-thread task time | 1.1143 s | 0.2853 s |
| Style recalculation time | 0.5325 s | 0.0889 s |
| Layout time | 0 | 0 |

This is a measured **74% reduction in browser main-thread task time** for this idle catalogue, not an iPhone FPS or whole-app 4× claim. Raw data: `.localparty-build/perf170/energy-before-after.json`.

### Snapshot-induced DOM/observer churn

An unchanged host state replaced Start's text and SVG, the player counter children, hidden flags, disabled flags, and many translated labels. This woke icon conversion, readability checks, localization and soft-scroll mask measurement twice per update.

- Cache authored labels in a WeakMap so localization/icon replacement remains authoritative.
- Preserve counter nodes when counts are unchanged; invalidate when players/minimum change.
- Avoid redundant hidden/disabled/ARIA attribute writes.
- Decorate only changed icon subtrees; measure icon colours before applying classes.
- Ignore unchanged observed attributes in control readability; clicking an unrelated area no longer queues every control in the document.
- Preserve display connection/disconnection transitions and real state changes.

Thirty equivalent unchanged state deliveries at 100 ms intervals; three paired Chromium runs:

| Observer/animation callback CPU | Before | After |
|---|---:|---:|
| Run 1 | 230.5 ms | 13.8 ms |
| Run 2 | 162.6 ms | 12.8 ms |
| Run 3 | 167.0 ms | 17.1 ms |
| Median | 167.0 ms | 13.8 ms |

Median measured callback CPU fell **92%**. Synchronous `LocalPartyHost.update` CPU remained approximately 15–19 ms total for thirty deliveries. Callback measurements include style/layout work forced by those callbacks. The visibility-cascade fix landed during the paired runs; pair 1 retained its old shared stylesheet, pairs 2–3 used the new shared stylesheet on both sides. Source interception swaps only the three optimized JS modules per pair.

Reproduce: `node scripts/perf170-host-observers.cjs`; use `PERF_SOURCE_DIR` with the prior `host.js`, `icons.js`, `game-ui-system.js` to compare without altering working files. Raw paired results and baseline source snapshots: `.localparty-build/perf170/`.

## Correctness and visual evidence

- `tests/host-panel-browser.cjs` passed, including active-game restart protection and 320/393 px sticky-card geometry checks.
- `tests/browser/perf170-host-idle.cjs` passed in Chromium and WebKit: fifteen repeated updates preserve the same Start SVG and count nodes, zero Start child mutations; offscreen contours pause; background energy pauses under Host Panel; external-display connection/disconnection state remains correct.
- Fresh 393 px catalogue and Host Panel captures reviewed in `output/playwright/perf170/`. These are browser fixtures, not device screenshots.

## Physical evidence still open

Build 133 diagnostics copied without altering the running app: `.localparty-build/perf170/device133.log`.
Native host catalogue intervals were sustained around 42–48 FPS / p95 30–36 ms under `thermal=serious`, with an event maximum of 365 ms. Controller/idle intervals later returned to ~60 FPS. These logs precede this fix and remain evidence of a real problem, not acceptance. The copied log includes older TV samples from build 132, with no contemporary TV samples alongside the newer build 133 phone intervals. These are not a paired AirPlay measurement. Build 135 needs fresh contemporary external-display and phone telemetry. No physical improvement is asserted here.

## Skills used

- https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md
- https://github.com/MengTo/Skills/blob/main/agent-skills/codex/performance-profiling/SKILL.md
- https://github.com/MengTo/Skills/blob/main/agent-skills/codex/performance-profiling/references/time-profiler.md

Measurement → identify → isolated change → repeat → regression guard. Existing art, blur radius, glow, gameplay and animation timing remain intact in this optimizer lane.

## TV catalogue animation visibility (follow-up for build 136)

Three paired Chrome measurements at the actual external-display viewport, 3840×2160, paused only offscreen decorative catalogue animations. Median main-thread TaskDuration over five seconds decreased from 0.307 s to 0.252 s (18%); style duration from 0.154 s to 0.118 s (23%). These are browser CPU measurements, not physical AirPlay FPS or GPU measurements. Raw pairs: `.localparty-build/perf170/tv4k-repeat.json`.

`public/tv-art-visibility.js` uses IntersectionObserver to pause clipped/offscreen catalogue symbols while preserving their animation phase. It also pauses them when the document is hidden. It does not change visible effects, game rendering, artwork, or blur. The new asset is registered in the server static allowlist and included only by TV HTML.

Focused regression (`scripts/perf170-tv-visibility.cjs`) passed: 36 symbols, 5 initially intersecting and 31 paused; a scrolled-out animated symbol held its phase at 416.60 ms during a 200 ms wait and resumed to 683.27 ms after scrolling back. A non-rendered lobby paused all symbols. Raw result: `.localparty-build/perf170/tv-visibility-proof.json`. Initial test caught and corrected a missing server asset allowlist entry before final handoff. Native/AirPlay validation remains separate.
