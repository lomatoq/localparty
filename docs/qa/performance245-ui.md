# Performance245: native scroll and Rooms update guards

Two isolated changes were retained in `public/native-shell/host.js` and
`public/native-shell/nearby-rooms.js`. The root agent's frozen before sources are
in `.localparty-build/perf245/source-before/`. All matched runs route the same
frozen shared CSS/JS; only the candidate under test differs.

The previous Addy Osmani performance-optimization workflow was used: freeze,
reproduce, isolate one cause, repeat, then retain only with behavior/visual proof.

## Changes

1. The sticky Host Pick stack now adds `stack-backed` only once. Re-adding an
   already present token still wrote the body class attribute, triggering shared
   input, modal, CTA, localization and layout observers on every scroll/morph
   frame. No sticky layout, height/margin animation, threshold, art, glow or blur
   is changed. The `tools-stuck` toggle is unchanged.
2. Rooms retains the existing shortcut SVG and per-row metadata spans. Authored
   text is guarded through a WeakMap so locale-translated DOM is retained on
   unchanged state. Room name input is updated/dispatched only when its actual
   value changes and never during an owned rename. Count, hue, selection and
   button attributes retain their existing behavior and visual styles.

## Matched Chromium CPU/DOM results

CPU values are milliseconds over the entire indicated workload, with probes in
both variants. They do not establish a physical iPhone or casting speedup.

| Workload | Baseline runs | Candidate runs | Additional evidence |
|---|---:|---:|---|
| Twelve real up/down compaction crossings, TaskDuration | 1851 / 1841 | 758 / 752 | body class records 210 → 12 |
| Same scroll workload, RecalcStyleDuration | 1360 / 1347 | 317 / 311 | input style reads and ink replacement 396 → 24 |
| 100 unchanged Rooms payloads, TaskDuration | 26.4 / 29.7 | 4.7 / 5.7 | SVG added/removed 100 → 0, no candidate observer callbacks |
| 100 real one-room player-count changes, TaskDuration | 789 / 762 | 349 / 367 | element creation 594 → 0; added/removed nodes 1387 → 99 |

Chrome matched scroll geometry was identical in both repetitions: card,
circle/art and search/tools positions for all twelve settled crossings. The
native host source guard was applied only after this repeated causal win.

## Behavior and visual proof

- Native Host/Rooms: Chromium baseline/candidate repetitions; WebKit
  baseline/candidate.
- Shipped real `/play`: WebKit, with actual native visibility,
  controller-bridge and persistent tabs injected at document start. Swift
  discovery and message responses are explicitly fixture data.
- EN/RU titles, metadata and action labels plus row/count/button geometry match
  baseline/candidate exactly in WebKit native and `/play` routes.
- Own-room input identity, focus and edited value survive external room updates.
  Save sends the actual rename command and the native acknowledgement updates
  the title and collapses the editor. Six-cell code entry, host/games native
  navigation and hide/resume retain their behavior.
- Simulated keyboard viewport 393×500: field and Save both remain above the
  viewport's lower inset. This is browser resize proof, not real keyboard proof.
- Eighteen before/candidate screenshots are in
  `output/playwright/performance245/ui/`; the accepted candidate native and
  controller Nearby, By Code and rename views were opened and inspected.

The first WebKit 360 ms timing samples caught unfinished height animations;
their raw diagnostics are preserved as
`webkit-stack-behavior-first-report.json` and are not acceptance evidence.
The final WebKit behavior run uses a strict 3.5 s settled-height deadline at
every one of the same twelve scroll crossings, then checks full expanded and
compact card/circle/tools geometry within one CSS pixel. It passed without
changing production motion or weakening the layout assertions. WebKit frame
timings from this headless run are not promoted to a physical frame-rate claim.

An initial generic `Animation.finished` wait stalled on existing scroll-timeline
animations (duration `auto`, percentage time). The harness now settles fonts
and cold setup by time, observes animations, and uses explicit target geometry
deadlines instead of waiting for all page animations to finish.

## Reproduce and frozen sources

`scripts/performance245-ui.cjs` prepares isolated candidates and serves either
the actual native shell or a spawned embedded server's real `/play` route.
Set `PARTY_PLAYWRIGHT` to the local Playwright package path, then run sequentially:

```sh
QA_LANE=stack node scripts/performance245-ui.cjs
QA_LANE=rooms node scripts/performance245-ui.cjs
QA_LANE=rooms QA_ENGINE=webkit QA_BEHAVIOR=1 node scripts/performance245-ui.cjs
QA_LANE=rooms QA_ROUTE=controller QA_ENGINE=webkit QA_BEHAVIOR=1 node scripts/performance245-ui.cjs
QA_LANE=stack QA_ENGINE=webkit QA_BEHAVIOR=1 node scripts/performance245-ui.cjs
```

Own final source copies and SHA256 hashes:
`output/playwright/performance245/ui/final-source/` and
`final-source-manifest.json`. Shared root source, native app, games, graphics,
audio and build packaging were outside this lane. Physical phone plus external
display profiling remains root-owned and required for the reported remaining
casting lag.
