# Integration 118: panels and Pocket Siege review

2026-10-04. Independent review B; no product source edits or commit by reviewer. Root applied the one confirmed Pocket correction. Evidence: `output/playwright/integration118-panels-pocket/`.

## Outcome

No remaining blocking defect found in the reviewed panel material or Pocket renderer. The shared stylesheet loads once, last after themes, on the actual proxied game-frame path; the shell routes also include it. Rules change paint properties, preserve ranking-list owners, and exclude authored pressed/disabled/selected states where they add key material. Snapshot, simulation and weapon protocol are outside the new world/tank/juice modules.

One presentation defect was reproduced and corrected by root: `PocketJuice.clear()` reset its clock but retained `lastNuke`. A nuclear blast at clock 40 followed by clear and another blast at clock 0 produced `firstNuke:true, secondNuke:false, lastNuke:40`. Root added `lastNuke=null` and an explicit regression. The amended browser test passes with both full and reduced motion. The initial suspected missing `drawMoments` hook was withdrawn: `drawCallouts` calls it before its empty-pool return.

## Fresh evidence

| Check | Result | Artifact |
|---|---|---|
| Actual 36-game live phone 393×852 / TV 1280×720 A/B | 0 box/overflow deltas, 0 browser errors, stylesheet sentinel enabled in measured frames | `panels-valid36-summary.json` |
| Native bridge + tabs, 320×568 | Crane, Poker, Swarm Gate: 0 deltas/errors; disabled Crane controls retain their appearance | `panels-native320/report-320x568-native.json` |
| Full renderer + production WebSocket/Connection | Seven weapon families, 493 snapshots painted; no hydration, duplicate-event, finite-state or renderer errors | `pocket-full-renderer/report.json` |
| Pocket bounded pools, pause, reduced motion, merging and immutable state | Pass before and after narrow root fix | `pocket-juice.log`, `pocket-juice-fixed.log` |
| Reference import, compact snapshot, projectile art | 9 tests pass | `pocket-static.log` |
| Fixed-renderer authoritative nuclear shot | 1280×720; no browser errors; fresh impact/carve/turn originals opened | `pocket-fresh-effects/report.json` |

The valid catalog union is 34 games in `panels-all36/` plus `swarm_gate` and `peek_shoot` in `panels-supplement/`. Two accidentally requested invalid fixture IDs (`droneflight`, `stack`) remain in the first raw report with click timeouts; they are excluded from the valid36 summary and are not app failures.

All 36 actual TV **after** originals were opened and visually inspected, including the two supplement originals. Phone originals inspected: Bomb, Crane, Poker at 393; Swarm Gate and Peek Shoot at 393; Crane, Poker and Swarm Gate with native scripts at 320. Pocket effect originals inspected: impact, carve and next turn. The panels remain readable, authored per-game colors/active rows remain visible, and transparent list owners are retained. Spy was captured while assigning roles, not in later gameplay; its known name/avatar lower-edge overlap is reproduced, predates this material pass, and has 0 A/B geometry delta. No visual acceptance is claimed for unobserved phases.

## Bounded detector

Impeccable context ran on the new stylesheet. `impeccable-panels-only.json`: **0 findings** in `public/game-ui-polish-20261004.css`.

`impeccable-injected-frame.json`: **16 findings** on the actual server-injected Peek Shoot controller markup, saved with fetched CSS in `panels-supplement/peek_shoot-frame1-injected.html`. No new-panel blocking defect was confirmed. Context checks: the dark glow is the meaningful aim reticle; flush padding on the throw/aim surfaces allows the full touch field; active/winner stripes carry game state; the gradient ranking digits are an established semantic treatment; host/result selectors and the TV grid are included CSS but not the captured controller surface. The width transition is the pre-existing charge/progress fill, not new layout animation. Large shadows and muted background raster are incumbent material choices, not changes in the reviewed file.

An earlier bounded static scan of the three shell HTML files yielded 168 generic findings (`impeccable-detector.json`); it is diagnostic, not a whole-product verdict. Examples of false positives: static pale fallback colors reported against runtime violet text, asset URL resolution when scanning local shell files, and established ranking-gradient digits. That scan does not prove all 168 warnings harmless; the current injected-frame scan and fresh images are the relevant evidence for this review.

## Source freshness and limits

Full SHA-256 manifests are `source-start.sha256` and `source-end.sha256`. Panel CSS stayed `cd35003adef39a07c35f147f8f89e604248ff24458bb7d2b368e09f0dbcf2ef2`; renderer stayed `6dc76c82f1fb0ffbe8e416d601dc41c6a205175cdf12ca9da2125c1ae71b1386`; tank/world and all three shell HTML files stayed unchanged. Root changed server.js for the independent asset URL fix during review (`58143fb1…` → `761e9ad2…`) and Pocket juice for the confirmed reset (`1029e2d7…` → `0e538dcf35d5b10a402bf618e1227d73415de701b1c8dd1752afa224d897a0a3`). The native supplement and effect capture use the corrected sources.

The seven-family transport browser loaded juice before the reset fix; tracked renderer/core sources stayed stable in that test. The amended juice regression and fresh shot capture independently verify corrected juice afterward. Transport sample IDs: `3_shot`, `dirt_mover`, `magic_wall`, `napalm`, `hail_storm`, `pin_cushion`, `nuke`. This is accelerated normal-physics replay, not a live room or all-321-weapon coverage.

Earlier `.localparty-build` reports/captures were read as historical diagnostics, not current acceptance. At initial inspection the panel report still contained RESULTS/MONTAGE/TESTS placeholders and the Pocket 2026-10-04 report named by the lane was absent. The fresh evidence above closes this review's verification independently. First sandboxed browser attempt failed `listen EPERM`; authorized localhost retry passed. No physical iPhone, all-phase/results, native-host, 1920×888 shot sequence, or build/install validation is claimed here.
