# Stage allocation investigation 249

2026-10-09. **Both hypotheses rejected for production.** This pass changed no game source, renderer quality, DOM ownership, shaders, physics, input cadence, or assets. It does not establish an iPhone or casting improvement.

## Frozen source and scope

Fresh main: `8bbad774542a14aad4796f3c262d956adf32006f`.

| Source | SHA-256 |
|---|---|
| Production/baseline `games/sports_siege/public/host.js` | `d3c72f68c1287d7e94ddc8401b7e6ab689a8c90b09a31f4bc2faf64c4109cd97` |
| Discarded Color candidate | `400ce72ad0c7918661bee52e78fcc725ee636e19021a8f6922b41fd89c6462a0` |
| Scratch Color candidate | `98b01192fe7ea72db4cd1f48f01179925b7de5ee616f4fb02aba0ec31b053ad9` |
| Final diagnostic driver | `098d3bf1191d823c9268cd2f984146aba3483111a8273cd2e9eb75eb511d3bd1` |
| Final actual-effect oracle | `e52de6aa8602d2a2f13597dc512815879ca647facdeef01c838ae14f71044bee` |
| Extracted baseline `updateEffects` | `54d551662608e93262292509170073f3c2b154f4ba28d84c944c60ac3ef38da2` |

Ignored source copies, driver and manifest are under `.localparty-build/perf249/`. The manifest freezes 43 current CSS files in both arms, including current shared input/scrollbar rules. Allocation candidates were separate: the scratch candidate retains the discarded Color allocation. The rejected 248 HUD guard was never combined with either candidate.

The workload uses the actual sports worker, actual TV connection, one controller and 15 existing bots. Timed presentation remains 1920×1080/DPR 1 with existing antialiasing, shadows, effects and resources. The controller is a 393×852/DPR 3 browser surface with the existing native-controller bridge. This is a browser proxy, not a physical phone or AirPlay/Mac receiver measurement.

## The two bounded hypotheses

1. At baseline host.js line 427, remove only the unused local `color = new THREE.Color(e.color)` in `updateEffects`. Its constructor result is discarded. Actual effect output correctness passed, but the instrumented exploratory timings did not demonstrate a repeatable whole-render gain. It was rejected before proceeding to hypothesis 2.
2. Reuse one Color only at the three `InstancedMesh.setColorAt` calls (baseline lines 378, 436, 440). Three 0.186.0 immediately copies RGB into `instanceColor.array` in `setColorAt`; it does not retain the Color object. The isolated helper resets all RGB components to white before `.set(value)`, preserving constructor fallback for undefined, null, invalid strings and unsupported types. Bot `.setRGB` still overwrites all three components. Actual output correctness passed, but the final raw-vendor render cohort failed the performance acceptance criterion.

No palette cache, material-color sharing, reduced effect count, skipped frames, lowered resolution, changed blur, or physics/input update reduction was used. Production retains its original allocation code.

## Timing instrumentation correction

The first two exploratory ABBA cohorts each included 16 four-second runs: Peek and Swarm, Chrome and WebKit. Their harness instrumented the Color constructor and other allocation/prototype operations. A candidate avoiding constructor calls also avoided the instrumentation cost. These cohorts are **allocation diagnostics only**, not production performance evidence.

Original results remain under `output/playwright/performance249/discarded-color/` and `.../scratch-color/`; their `cohort.json` explicitly rejects use as a performance acceptance metric. The unused-allocation diagnostic showed large constructor-count reductions without a useful overall CPU result. Scratch exploratory Chrome overall Task results were approximately +0.62% for Peek and −0.13% for Swarm. Neither warranted promotion even before correcting the instrumentation confounder. A break-only initial Swarm sample is also excluded from busy-game performance evidence.

The final bounded cohort removed constructor counters, material setters, WebGL prototype hooks, DOM mutation/rectangle wrappers and effect-allocation timing hooks. Identical minimal frame/Stage loop metrics remained in both arms. Per-allocation fields containing zero in these final JSON reports mean **instrumentation unavailable**, not zero allocations.

All four final performance runs returned exact frozen dependency response bytes:

| Actual served vendor | Bytes | SHA-256 |
|---|---:|---|
| `three.core.js` | 1,458,113 | `9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6` |
| `three.module.js` | 662,772 | `9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea` |

Each final report records `vendorInstrumentation: false`, `perAllocationHooks: false`, `vendorPrototypeHooks: false`, and exact served-vendor digests. These are installed dependency bytes, not Git blobs. Published main's package-lock SHA-256 is `ba87dd4e37112fd2eb87860ef2655c0d7023b98397b0554f89f420d166f59c15`, pinning Three 0.186.0. Raw vendor snapshots remain in `.localparty-build/perf249/vendor-before/`.

## Final raw-vendor CPU result

One bounded Chrome Peek ABBA cohort, four seconds per run, in `output/playwright/performance249/scratch-color-vendor-exact/`. All runs remained actual `playing:shooting`; no errors and frozen CSS hashes matched. SDK builds, other browser profiling and Mac receiver workloads were parked during timing.

| Run | Task (s) | Script (s) | Layout (s) | Style (s) | Full Stage loop total (ms) | Main renders | Shots | Rewards | Sum of live effects at renders |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| A1 | 2.453484 | 0.849458 | 0.105406 | 0.674480 | 449.5 | 241 | 244 | 32 | 20,422 |
| B1 | 2.392622 | 0.841856 | 0.104839 | 0.648627 | 429.5 | 240 | 244 | 28 | 19,263 |
| B2 | 2.417684 | 0.855646 | 0.104488 | 0.680422 | 485.0 | 240 | 244 | 33 | 20,864 |
| A2 | 2.462792 | 0.855803 | 0.105550 | 0.705674 | 458.7 | 241 | 246 | 29 | 20,059 |

Mean Task decreased 2.16% (2.458138 → 2.405153 seconds), but mean full Stage loop **increased 0.69%** (454.1 → 457.25 ms). B1 had fewer rewards and live effects; B2 had more effects and a slower render loop. The Task improvement is too small and incoherent with the actual rendering work to attribute a repeatable full-render win to the candidate. Frame p95 remained approximately 16.7–16.8 ms in this desktop browser workload. GPU time was not measured. **Scratch Color is rejected; no additional repeat series or third hypothesis followed.**

## Actual effect correctness, separate from HUD sanity

The 248 HUD oracle replaces only `paintUI` and cannot prove these allocation changes. The 249 oracle instead invokes extracted **baseline `updateEffects`/`updateBots` versus candidate allocation functions** on the same actual held Stage objects, clock and recorded enemy state.

After live timing, normal pause/resize/resume and resource settling, it stops RAF/presentation snapshots, holds time and animation clocks, and restores identical effect, popup, sprite, particle, instance and bot inputs before A1/A2/B1/B2. It compares exact transforms/matrices, instance RGB and matrix bytes, effect/resource identities, texture/image references, material and buffer version deltas, `smoothBots`, roster/state, DOM commands, GPU buffer upload bytes/order, and full held renders. Version deltas are compared rather than artificially resetting renderer version counters. Held captures are full 1280×720 QA renders after explicit resize; that diagnostic capture size is not a production optimization.

| Correctness artifact directory | Actual held workload | Result |
|---|---|---|
| `discarded-color/peek-webkit-oracle/` | 97 live effects, 9 reward popups, 16 players | Exact outputs/GPU uploads/DOM; A–A, B–B, A–B pixels all 0 changed channels |
| `scratch-color/peek-webkit-oracle/` | 97 live effects, 11 reward popups, 16 players | Exact outputs/GPU uploads/DOM; all three pixel pairs 0 |
| `scratch-color/swarm-webkit-oracle/` | 6 recorded enemies, 120 effects, 10 popups | Exact bots, instance RGB/matrices, effects and GPU/DOM; all three pixel pairs 0; initial break-only timing excluded |
| `scratch-color-vendor-exact/swarm-webkit-sanity/` | 20 recorded enemies at dt 0.016, 55 effects, 13 popups, 16 players | Exact outputs/poses/resources/version deltas/GPU/DOM; all three pixel pairs 0 |

The final Swarm raw-vendor sanity first ran one second of actual wave gameplay: 42 main draws, 19 shots, 15 pulses, 5 rewards, enemies at every render (6–13), and live effect sum 3,730. This supplies busy-state correctness/cadence evidence, **not** a paired performance result. All 40 Color fallback/ColorManagement cases matched RGB and warning strings, including malformed values, both management settings and two working spaces.

An initial scratch Peek oracle failed because test restoration used `Object.assign` and left a newly authored sprite `userData.frame` key in subsequent runs. Its original failure remains in `scratch-color/peek-webkit-oracle-incomplete-restore/`. Exact key-presence restoration fixed the diagnostic and one bounded rerun passed; no product code or pixel tolerance was changed.

Root independently viewed the first actual Peek A1/A2/B1/B2 renders. Final saved Peek and Swarm originals were also inspected: populated scenes, live effects/reward labels, all 16 roster entries, logo/notch and game geometry remained present. These establish narrow candidate parity, not a catalog-wide visual acceptance.

## Handoff

All browsers and ephemeral servers were closed in `finally`; the exclusive slot was released to the actual Host correctness lane. Production host SHA remains `d3c72f68c1287d7e94ddc8401b7e6ab689a8c90b09a31f4bc2faf64c4109cd97`. No accepted game change or candidate-dependent regression wrapper was added. Only this ledger is reviewable source from this pass; experiment scripts/copies and images remain diagnostic artifacts. Phone-alone, physical casting, loading curtain, popup responsiveness and menu rendering are separate acceptance work.
