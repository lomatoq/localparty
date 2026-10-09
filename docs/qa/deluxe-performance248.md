# Deluxe renderer investigation 248

2026-10-09. Frozen main `16ae1124d4cb30bb5e00d2e1d03973950e0e970a`. Production is unchanged. This lane investigates Arcade Deluxe (Pocket Siege / Marble Bloom), independently of Shared Sports and native Rooms. No resolution, frame-rate, AA, authored effect, timer, gameplay or input/network change is proposed.

Read AGENTS, UI regression/design contracts, the current phone/TV visual audit, [Deluxe244](performance244-deluxe.md), [game audit243](performance243-game-audit.md) and [render246](game-render246.md). Applied [Addy Osmani's measured optimization workflow](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md): freeze source, isolate one cause, compare the same workload, prove correctness, then keep/revert beyond variance. Earlier rejected name-metrics and backdrop-filter candidates are not repeated.

## Narrow source causes

1. `PocketPlasma.step()` projects an immutable imported indexed mask separately for every live source at each fixed 30 Hz step: radius coordinate conversion, floor/clamp, FOG falloff and mask lookup. Its world position, source energy and active field remain dynamic. The isolated candidate caches only exact nonzero `(ox, oy, value)` triples as Float64 values, keyed by mask identity, radius and FOG falloff flag. New mask identities invalidate naturally; the WeakMap does not retain superseded art. Normal `clear()` retains these immutable stamps for replay. The current complete authored data produces 154 variants / 1,700 cells / 40,800 bytes in the oracle.
2. `PocketPlasma.draw()` submits all three 320×256 field canvases stretched to 1280×1024 even when a field is fully empty. Construction, `clear()`, origin reset, and every step with null bounds leave that field canvas cleared. A separate one-line candidate skips only null-bound field submissions; live materials, screen sprites and composite modes remain unchanged. Fewer submissions alone are not a GPU or device performance result.

Source-only alternatives intentionally not pursued: Marble per-frame path-bounds scans might be cacheable but have not been profiled; claimed per-board level path-cache thrash is not an actual current versus workload because authoritative versus boards share one starting level and finish before progressing. Existing paused renderer parking and stable HUD guards remain intact.

## Isolated candidate evidence so far

All candidates and fixtures are ignored under `.localparty-build/perf248/deluxe/`, with a source hash manifest. No production patch is accepted yet.

CPU-only Node VM oracle compares frozen and stamp-cached output at 8,211 states across all 67 authored weapon material definitions and 99 mask frames, including named profiles, low-energy tails, world edges/origin shifts, source cap, clear and re-emission, plus replacement of parsed mask data under the same authored frame name with changed7×6 dimensions/pixels. Imported masks are finite integer nonnegative values and runtime code has no in-place mask writer. The replacement oracle intentionally retains both old/new asset objects:172variants /2,412cells /57,888bytes, under64KiB; `clear()` retains the exact immutable stamp object for replay. Source records, field Float32 `a`/`b` buffers, pixel buffers, field bounds, clocks/zones, and emitted Canvas commands match exactly. This is not rasterized browser imagery, GPU timing, a live room, an iPhone or a cast measurement.

Fixed budget: four waves × 90 field steps, same emission event count, authored commands and320sourcecap; event counts are not source counts (Napalm52commands/event, Smoke Bomb8commands/event). Canvas submission is mocked outside the arithmetic being compared. The mask cache is retained through each workload in both cold initial and later waves.

| Node VM workload | Before → cached, three pairs / ms | Interpretation |
| --- | --- | --- |
| Napalm,1event /52sources | 492→484; 499→487; 488→482 | 1.3–2.4%, insufficient to establish a broad win |
| Napalm,30events /320sourcecap | 1348→1310; 1343→1289; 1331→1296 | 2.6–4.0%, modest and browser confirmation pending |
| Napalm,320events /320sourcecap | 1358→1290; 1331→1285; 1333→1288 | 3.4–5.0%, no device claim |
| Smoke Bomb,1event /8sources | 342→287; 340→288; 342→289 | 15.3–16.1% in this arithmetic workload |
| Smoke Bomb,30events /240sources | 6046→4324; 6026→4354; 6131→4375 | 27.7–28.6% in this arithmetic workload |
| Smoke Bomb,320events /320sourcecap | 7146→4878; 7159→4881; 10499→4902 | First two pairs 31.7–31.8%; third before run is an outlier and excluded from a gain claim |

Dense materials are reachable through authoritative normal physics: seed7, real cannon shot, angle45°/power12, 5.5 seconds yields peak zone counts Napalm52, Smoke Bomb130, Black Forest67, Glue Bomb60 and Burn Barrel48. This source simulation establishes representative reachability, not displayed performance.

## Browser result: performance promotion rejected

The serialized browser slot completed and all browsers/ephemeral servers closed. Actual imported-material Canvas output is byte-identical for all **67 definitions** in Chromium and WebKit, plus five dense profiles, clear/re-emission and fresh parsed-mask replacement. Zero page errors, and before/candidate source hashes are identical before/after each completed run. Both fresh material-oracle originals were viewed by this lane and independently by `visual_review246`. These are a narrow cosmetic subsystem fixture, not an application/gameplay screen.

Only frozen baseline and exact stamp cache were tested; the empty-plane draft was excluded. Timings use the same 90 `PocketPlasma.draw()` calls with 40 emission events, after the material correctness pass has warmed the masks. Three balanced **ABBA** groups compare baseline, cache, cache, baseline. Each number below is the mean of the two matching entries in that group; raw individual values are retained in the JSON. The timed scope includes synchronous Canvas submission but does not measure GPU completion, live worker throughput or physical casting. It does not establish cold first-shot latency.

| Engine / workload | ABBA means before → cache / ms | Decision |
| --- | --- | --- |
| Chromium / Napalm | 1398.40→1396.15; 1407.20→1405.35; 1412.35→1414.90 | Mixed direction, under 0.2%; no useful gain |
| Chromium / Smoke Bomb | 1431.95→1428.35; 1434.70→1428.50; 1433.65→1431.50 | Under 0.5%, within variation; no useful gain |
| WebKit / Napalm | 13→18; 38.5→59; 56→53 | Large drift; no repeatable gain |
| WebKit / Smoke Bomb | 64.5→54.5; 81→80.5; 82→81 | First pair differs, later pairs nearly equal; no stable gain |

The Node VM arithmetic improvement did **not** translate into a repeatable useful browser result under this workload. The stamp cache is **not promoted**, and the production module remains unchanged. No 5×, 10×, entire-game or iPhone improvement follows from these measurements.

Completed artifact roots:

- `output/playwright/performance248/deluxe/chromium-report.json` and `chromium-material-oracle.png`.
- `output/playwright/performance248/deluxe/webkit-report.json` and `webkit-material-oracle.png`.
- Raw scripts/candidates remain ignored under `.localparty-build/perf248/deluxe/`.

## Incomplete and invalid broader gates

The prepared complete-Renderer fixture replays normal authoritative Napalm, Smoke Bomb and Burn Barrel snapshots with a controlled presentation clock/random source. Chromium reported parity at 33 sampled frames, but direct PNG inspection found only the background, with no visible terrain, tanks or material field. This is **not complete-scene acceptance**. WebKit stopped on a strict frame-zero pixel mismatch for Napalm (`pixel710106`); it did not complete its broader gate.

An offline harness defect was identified: overriding `performance.now()` does not override real rAF callback timestamps. Screenshot scrolling/ResizeObserver can schedule an autonomous frame with page-uptime timestamp after manually rendering at 100000+ ms, producing a large negative delta. The ignored harness now suppresses autonomous rAF during manual-clock replay; that repair is **not rerun or accepted**. No production clock/frame logic was changed. The original failed captures/reports are retained as evidence rather than silently replaced.

The browser slot was released to the Rooms lane after these failures and the rejected performance result. The separately prepared live embedded-worker fixture with two real native-route controllers, Fog/fire input, pause/resume and normal presentation clocks was **not run**. Thus no actual-worker, native UI, physical iPhone standalone or separate-TV casting acceptance exists for this candidate. Those remain independent root-owned gates.

A portable numerical draft exercises the actual production module and actual assets against 21 frozen-before canonical field/bounds/pixel stages (Fog/fire/edges, clear/replay and new mask object). It passes for frozen production and the ignored candidate. It remains ignored because no cache patch was accepted; it is not a source-string assertion or benchmark artifact.

## Frozen source hashes

| Source | SHA-256 |
| --- | --- |
| Before PocketPlasma | `50a5c95652b975be1f00cfca989cb9e88de92f6962ce1c719645d8635373bb92` |
| Exact stamp candidate | `1b7592e33f98a5399aedb4f8474284242c6b901ddc43f2f337bcec250d0b441e` |
| Empty-plane candidate | `8c158f10008212d631b393da68e4d7b60d3f89d65b3a796acbed6ab0e4363e83` |

Node syntax checks pass for the two candidate modules and five prepared harnesses, including the offline controlled-clock repair. No production code, build, installation, commit or push was performed by this lane.
