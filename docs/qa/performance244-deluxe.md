# Performance 244 — Deluxe renderer and HUD

2026-10-07. Production ownership: `games/arcade_deluxe/public/render.js`, `host.js`, `controller.js`, and subsequently authorized `pocket-deck.js`. This lane also owns this report, its gallery, the new harness and two tests. No build/install, shader, art, DPR, effect quality, rules, protocol, haptics or input cadence change.

Read `AGENTS.md`, the design contract and UI regression rules, and the read-only 243 game audit. Applied [Addy Osmani's performance optimization workflow](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md): save before source, isolate candidates, measure identical workloads sequentially, retain only measured wins. No Impeccable performance workflow used.

## Baseline

`scripts/performance244-deluxe.cjs` starts the real embedded launcher and game worker, TV at 3840×2160, real connected phone at 393×852/DPR3 with production native `controller-bridge.js` and `tabs.js` injection, and authoritative bots. These are **desktop browser native-route fixtures**, not actual WKWebView/iPhone/AirPlay. Six seconds playing followed by three seconds paused, then resize/resume. Before source copied into `output/playwright/performance244/deluxe/before-source/` before any edit.

First sequential Chromium baselines:

| Game | Game DOM mutations / 6 s | Phone DOM mutations / 6 s | Name measurements / 6 s | Paused identical full canvas paints / 3 s | Paused task CPU |
|---|---:|---:|---:|---:|---:|
| Pocket Siege, six players | 3472 | 4340 | 4332 | 181 | 0.245 s |
| Marble Bloom co-op, three players | 794 | 684 | 0 | 180 | 0.199 s |

Paused canvas output was byte-identical across the three-second interval in both games. No snapshot/DOM updates during pause: the authoritative worker already freezes simulation/broadcast correctly. The redundant work is client presentation painting. No claim that this is the only physical casting bottleneck.

## Final keep/revert ledger

1. G10 HUD guards: **keep** stable weapon SVG/description children and unchanged HUD text/property/crew style writes. Snapshot rate, input release, haptics and arsenal behavior remain unchanged. Pocket repeated live win below; Marble live CPU is mixed.
2. Stable Pocket deck presentation: **keep** guarded text/ARIA/gauges and retained radar children until their actual visual dependencies change. Final localized fuel/drone/clock/turn copy has one owner instead of intermediate rewrites. Draft controls no longer disable then re-enable every snapshot. Changed input/radar data remain immediate.
3. G4 fitted name-metrics cache: **reverted**. First isolated live comparison was only 0.55% lower task CPU; second was 3.3% higher. Counter reduction alone did not justify complexity. Original fit/truncation loops restored.
4. G2 paused presentation: **keep** parking after interpolation, two warm paints, map crossfade and turn cue settle. Invalidate on new snapshot, geometry, font or known art readiness. Marble versus board-local legacy FX finish their existing fade before parking. Resume excludes time spent parked from the next presentation timestep; destroyed instances cannot restart from late readiness callbacks.
5. Waiting, privately owned PocketJuice image parts and pending projectile PNG decode: **preserve original live painting** so late art cannot freeze as fallback. No blanket simulation suspension or waiting-motion removal.

Phases are frozen separately (`phase1-hud`, `phase2-cache`, `phase3-pause`, `phase4-deck`, `phase5-owner`, `phase6-final`, `phase7-final`) for route-based attribution. Phase 6 removes the name cache; phase 7 adds only the paused-resume timestamp reset. Fresh pairs 2/3 use phase 6, pair 4 and WebKit use phase 7; the last reset does not affect their live sampling windows. Current production equals phase 7 for all four files. Prior geometry/DPR fixes and first-use warmups remain.

## Limits / remaining candidates

- Parent authorized narrow stable-presentation `pocket-deck.js` work after phone residual stayed at 3988 mutations/6 s. Stable deck guards reduce this to 1038, then final-copy ownership to 687 in isolated samples. Repeated original/final measurements below decide acceptance.
- Paused image-part FX retain their prior draw loop until the next state/resume; no quality reduction used to fake an idle win.
- Marble versus/long names/font readiness/loading transitions and pause-resize-resume are covered by the final behavior evidence below.
- Physical iPhone with dedicated external display, thermal state and keyboard remain separate root acceptance.

## First attribution pass (not repeat acceptance)

Each phase routed frozen source files, keeping the real worker, native bridge/tabs and shared styles the same. Output `pocket-hud-1`, `pocket-cache-1`, `pocket-pause-1`, `marble-pause-1`.

| Pocket phase / 6 s live | Game DOM mutations | Name metrics | TV task CPU | Phone task CPU |
|---|---:|---:|---:|---:|
| Before | 3472 | 4332 | 2.114 s | not collected in first run |
| HUD guard only | 708 | 4320 | 1.907 s | 0.334 s |
| HUD + name cache | 708 | 0 | 1.896 s | 0.341 s |
| HUD + cache + paused park | 708 | 0 | 1.865 s | 0.334 s |

HUD first-pair live CPU reduction is about 10%; repeated acceptance follows below. Name cache difference versus HUD-only is just 0.55%, within normal noise. A second matched-cadence comparison was 1.552 → 1.603 s task CPU (+3.3%), phone 0.308 → 0.308 s: **name cache reverted**, no accepted throughput claim.

| Stable server-pause / 3 s | Before identical canvas paints | Parked paints | Before task CPU | After task CPU | Before script CPU | After script CPU |
|---|---:|---:|---:|---:|---:|---:|
| Pocket (cache → cache + park) | 181 | 0 | 0.232 s | 0.095 s | 0.103 s | 0.013 s |
| Marble co-op | 180 | 0 | 0.199 s | 0.079 s | 0.059 s | 0.008 s |

These first runs preserve byte-identical frozen canvas output, parked rAF = 0, Pause/Lobby, existing backing density and pause→resize→resume. Authoritative worker time resumes; actual connected controller aim is accepted; instance unchanged; zero page errors. Some TV chrome CSS animation/style work remains (about 180 style calculations/3 s), so this does not claim zero application work.

No real-phone or cast throughput conclusion from these desktop fixtures.

## Fresh repeated Pocket measurements

The first slot ran around 60 canvas paints/s; later Chromium slots ran around 30 paints/s on this desktop. **That environment cadence change is not credited to this source change.** All three fresh before/final pairs below have about 180–181 live paints per six seconds. No frame-rate cap or rendering-density reduction was added. Absolute CPU rose in the last pair, so each comparison is reported separately.

CPU is Chromium task execution time in seconds over the six-second live window. Browser profiles ran sequentially; real worker/bots, actual connected input and the production native bridge/tabs are used.

| Pair | TV task before → final | TV reduction | Phone task before → final | Phone reduction | Game DOM before → final | Phone DOM before → final |
|---|---:|---:|---:|---:|---:|---:|
| 2 | 1.734 → 1.393 | 19.7% | 0.315 → 0.254 | 19.4% | 3658 → 708 | 4572 → 685 |
| 3 | 1.772 → 1.398 | 21.1% | 0.316 → 0.248 | 21.6% | 3689 → 708 | 4572 → 683 |
| 4 | 3.963 → 2.829 | 28.6% | 0.622 → 0.456 | 26.7% | 3658 → 708 | 4573 → 684 |

Pocket shows a repeated live CPU win for this workload: 20–29% less TV task time and 19–27% less phone task time. Game DOM mutations fall about 81%, phone mutations about 85%, TV layout count from 418–419 to 6. No simulation/network/input work was throttled.

Stable deck isolation used residual phone mutations 3989 → 1038 → 687 and phone task CPU 0.308 → 0.257 → 0.246 s. Those component samples guided implementation; fresh repeated original/final results above provide acceptance.

## Marble live measurements — mixed, no accepted throughput gain

| Pair | TV task before → final | Phone task before → final | Game DOM before → final | Phone DOM before → final |
|---|---:|---:|---:|---:|
| 2 | 0.797 → 0.637 | 0.214 → 0.217 | 836 → 472 | 708 → 590 |
| 3 | 0.737 → 1.124 | 0.191 → 0.298 | 835 → 485 | 708 → 590 |
| 4 | 1.155 → 1.256 | 0.292 → 0.284 | 831 → 482 | 708 → 590 |

Marble DOM writes reduce consistently, but live CPU is neutral/mixed and one pair is materially slower. **No claim that Marble live throughput improved.** Shared behavior-preserving HUD guards remain for Pocket's repeated win. Marble's consistent acceptance is settled pause below; further live renderer investigation remains separate work.

## Repeated settled pauses

| Game / pair | Full game canvas paints before → final, 3 s | Task CPU before → final | Reduction |
|---|---:|---:|---:|
| Pocket 2 | 90 → 0 | 0.174 → 0.054 | 69.3% |
| Pocket 3 | 90 → 0 | 0.171 → 0.059 | 65.7% |
| Pocket 4 | 91 → 0 | 0.212 → 0.074 | 65.0% |
| Marble 2 | 90 → 0 | 0.121 → 0.055 | 54.5% |
| Marble 3 | 90 → 0 | 0.109 → 0.052 | 51.8% |
| Marble 4 | 90 → 0 | 0.163 → 0.058 | 64.6% |

All final pauses retain byte-identical game canvas output with `raf=0`, zero clears and no game DOM mutations. Shared TV chrome can still animate/style: this is not zero application work. Resize/font/art readiness restarts presentation when needed. Resume advances authoritative worker time in the same instance; actual Pocket angle/power 53°/61 and Marble aim (903,233) are accepted. Every real match report has zero page errors.

## Behavior verification

Passed sequentially using desktop WebKit:

- `tests/performance244-deluxe-lifecycle.cjs`: explicitly labeled renderer fixtures; waiting motion remains live, exact paused pixels, paused resize/font/art invalidation, 650 ms turn cue, map crossfade, conservative private-art readiness, late real garden/machinery image completion, resumed timestep and destroy cleanup. Versus board-local FX finish their prior fade before parking.
- `tests/performance244-pocket-presentation.cjs`: saved/final paired fixtures; 22 English/Russian aim, blocked movement, enemy turn, flight, radar, piloting, pause, used drone, loadout, lobby and results states preserve final labels, controls and accessibility. Stable description/radar children stay mounted; changed radar data update immediately.
- `tests/deluxe-render-regression.cjs`: aspect ratio, aim mapping, smooth tank pose/settled position, map crossfade lifecycle and bounded snapshot retention.
- `tests/pocket-deck-browser.cjs`: manual modules, 320/390/393 layouts and managed route, gauge layering, live radar, sequenced enemy-turn air defense, pause/disconnect/charge guards, held movement and drone release.

Actual-worker `pocket-webkit-final/report.json` also passes pause/resize/resume/input: retained exact paused pixels, zero clears/rAF, same match instance, actual phone input reaches the worker, no page errors. WebKit CPU counters are unavailable and intentionally null. Its wrapper iframe stayed 1920×984 after changing the outer viewport to 1280×720; geometry/backing density match the actual iframe, not a falsely assumed 1280×720 interior. This is a desktop native-route fixture, not actual iPhone/WKWebView/AirPlay.

**Existing gate remains open:** `tests/pocket-loadout-browser.cjs` stops at `320 !== 321`. Static proof: runtime catalog contains 321 weapons; saved and final `renderArsenal()` are byte-identical and exclude the already included `pebble` from the draft picker, yielding 320 draft rows. Test expectation was not changed or masked. Later loadout-transition assertions did not execute in this run. No weapon/rules/catalog change belongs to this lane.

## Visual inspection and practical limits

Viewed baseline playing images, candidate playing images, all eight final pair-4 playing/paused images, all four actual-worker WebKit final images, and an original TV paused image. [Gallery](../../output/playwright/performance244/deluxe/index.html) and `final-manifest.json` distinguish live desktop fixtures from controlled fixtures and physical evidence.

- Pocket TV retains terrain/star/cloud art, curved HUD, trajectory, six readable crew cards and selected weapon. Phone retains Single Shot art/description, tank/drone/AA tabs, direction/power gauges, Fire and separate Pause/Lobby.
- Marble TV retains textured garden, chain symbols/colors, aim paths, three shooter identities, HUD and crew cards. Phone retains current/next preview, aim marker, Swap/Fire and separate Pause/Lobby.
- Phone pause in both engines visibly blurs surrounding chrome and retains readable purple copy, rounded rules/resume/language controls and green CTA glow.
- **Residual shared TV pause visual issue:** a hard dark horizontal strip beneath the top header is present before and after this lane. WebKit also faintly shows underlying game's paused text. These TV pause screens are not declared fully visually clean; parent owns shared TV composition. Retained game canvas output is exact.

Physical iPhone external-display/AirPlay connection, thermal state, launch curtain, popup/keyboard latency, all other games and dense private image-FX paused throughput remain separate acceptance. No 5× speed or perfect casting promise follows from these desktop measurements.

## Source freeze

Current production byte-equals `phase7-final` (SHA-256):

| File | SHA-256 |
|---|---|
| `render.js` | `af172ac9331bd9ff084681035137aa782b9e8847e9e4b187a10ab5192ea30a81` |
| `host.js` | `9a5e73cc37bcbf48e8c7e29da7ab103af7024a205d6e863d9f4c67448e0fe1fd` |
| `controller.js` | `dc29697b162f748e655b4c5bbbeb30ef935079c0d9aa02f8c1fcce3be9a5d214` |
| `pocket-deck.js` | `56865059e940677f2a9b23187445ecc3aa645417c8052f28852a00ba51aaabd0` |

Browser slot released after the final behavior chain. Documentation and final image inspection completed without starting another browser. No build/install performed by this lane.


Integration follow-up: the old shared TV Pause strip in these phase7 captures was fixed separately in `public/tv-information.css`. See [the fresh actual-worker TV244 Pause evidence](tv244-pause.md) and [integration244](integration244.md); the four Deluxe renderer files remain unchanged.
