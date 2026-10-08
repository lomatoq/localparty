# Performance 244: Sports runtime

Date: 2026-10-07. Lane: Sports renderer and FX lifecycle. This lane does not build/install the app or validate a physical iPhone/receiver. Native acceptance belongs to the root lane.

## Constraints and method

Read `AGENTS.md`, the current design/UI contracts and `performance243-game-audit.md`. Applied [Addy Osmani's performance-optimization skill](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md): isolate one cause, compare repeated equivalent workloads, keep only meaningful gains and preserve an attempt ledger. No DPR, antialiasing, shadow, glow, blur, artwork, camera, authoritative scoring or protocol reduction is allowed.

Frozen baseline: `.localparty-build/perf244/sports-before/`. Twenty own Sports JS files were copied before changes. `manifest.json` records their SHA256 and the shared CSS at freeze. Vendor/asset files remain unchanged. The profiling harness also records current shared CSS hashes for every sample; only comparable styles qualify for before/after CPU analysis.

`scripts/performance244-sports.cjs` starts a real isolated worker, connects the real TV and a 393px phone with the native controller bridge/persistent-tab hooks, and uses the existing real bot controllers. No scores, kills, stones or renderer state are invented. Test-only response hooks count score events, popup/effect frame CPU, material creation/disposal/invalidations, main versus inset passes, programs and actual buffer/target sizes. Chrome CDP task/style/layout counters are desktop main-thread evidence, not GPU time or native cast responsiveness.

Configured receiver dimensions are not assumed to equal actual backing dimensions. Each sample records CSS viewport/DPR, Canvas client/backing sizes, render quality, antialiasing, maximum texture/renderbuffer sizes, shadow targets and Curling inset target. In particular a headless software fallback is reported as such and cannot establish hardware 4K performance.

## Attempt ledger

| Candidate | Baseline / observation | Change | Outcome |
| --- | --- | --- | --- |
| G1: score-popup layout batching | Actual Peek16/12s: 722 shots, 103 scores, 13 concurrent labels; 6205 popup rect reads; updateEffects total 1347 ms, p95 4.3 ms. | Candidate caches unscaled boxes with resize/font invalidation and batches reads before writes; same rounded scale/placement. | Retained after three pairs: local frame-preparation CPU median −21.3%; exact reference geometry; whole-TV CPU neutral (−0.5%), FPS unchanged. |
| G8: sprite/material lifecycle | Existing particle/Swarm pools and texture caches retained. Individual legacy feedback sprites allocate/dispose materials; compatible frame maps set `needsUpdate`. Actual Peek16/12s: 3831 SpriteMaterials, 163581 Colors, 3387 needsUpdate calls; zero GL program creation/compileShader calls after warmup. | None yet. | Allocations are real; sustained shader recompilation is not observed. |
| G9: Curling second pass | Source inspection: 512×512, four samples in hardware; 320×320, zero samples in existing software mode. Rolling inset every eligible frame; settled every sixth. These are configured values, not a measured Curling allocation/GPU result in this lane. | None. | Explicitly deferred. Intentional readable target view; no removal, quality change or GPU win claimed. |

G1 is retained on repeatable local frame-preparation CPU improvement and original placement equivalence. Final cross-engine/dense/4K regression coverage passed. G8 remains allocation discovery; G9 GPU timing and optimization are explicitly deferred and no shader speedup is claimed. Production source is frozen after the four final cases.

Initial real baseline: `output/playwright/performance244/sports/baseline-peek-16/report.json`. Full-quality 1920×1080 backing (DPR1); 720 main renders/12s. TV task CPU 8.378 s, style 2.391 s, layout 0.493 s. This TV process includes existing bot-controller documents; the separate updateEffects timer isolates the game hot path. Both actual TV/phone playing screenshots were freshly viewed. Roster/pause/resize retained the actual match instance, with no page errors.

## Accepted G1 result

Three sequential 12-second pairs used identical shared CSS hashes. Before/after raw reports and summary are under `output/playwright/performance244/sports/g1-paired/`. The actual game emitted 87–106 score rewards per sample with 12–14 concurrent labels.

| Metric | Before median | After median | Interpretation |
| --- | ---: | ---: | --- |
| updateEffects CPU / 12s | 903.1 ms | 710.5 ms | −21.3%; all three pairs improve |
| updateEffects mean / drawn frame | 2.509 ms | 1.974 ms | Before range 2.406–2.707, after 1.947–1.978; no overlap |
| updateEffects p95 | 5.8 ms | 5.1 ms | −12.1% local preparation tail |
| updateEffects CPU / actual reward | 9.816 ms | 7.618 ms | −22.4%; includes particle feedback, not only text |
| Layout CPU | 0.364 s | 0.327 s | −10.2%; all pairs improve |
| Whole TV task CPU | 6.671 s | 6.636 s | −0.5%; neutral, not a claimed speedup |
| Whole TV style CPU | 2.017 s | 1.941 s | −3.8%; small / mixed |
| Score-label rectangle reads | 2799 | 104 | Diagnostic −96.3%; acceptance rests on timing + semantics |

Paired runs all drew about 360 frames/12s (30fps), versus 720/12s in the initial exploratory sample. The reason for that environment shift is not established, so initial 60fps numbers are not mixed into the paired comparison. No FPS increase or physical-iPhone/cast improvement is claimed.

A separate same-frame oracle runs the frozen original placement code on the candidate's real score-label frames. Chromium initially sampled **1653 placements with exactly 0px position error**, identical opacity and serialized transform, and retained the match/roster through pause/resize. Final WebKit/Swarm and Chromium/4K cases added 3676 placements; maximum error across all comparisons is 0.00011px. This oracle intentionally adds reference work and is excluded from performance results. Fresh candidate TV/phone images from `g1-paired/after-3` and every final case were viewed: authored hit sprites, light/particle feedback, labels, ranking rows, gradient mobile controls and Pause/Lobby remain. Different runs contain different real game events; screenshots are not a pixel-equivalence oracle.

## Final actual-runtime regression coverage

All four sequential checks passed, with zero page errors, actual match/roster retained through pause, viewport resize and resume. Every TV/phone playing capture and the hidden-case resumed TV capture were freshly viewed. Artifacts: `output/playwright/performance244/sports/final/`; each case contains `report.json`, `run.log` and screenshots; `summary.json` records the completed set.

| Case | Actual sample | Reference / invariant |
| --- | --- | --- |
| WebKit Swarm16 | Full-quality 1920×1080, 30 actual rewards | 858 placements; max error 0.00011px; same opacity/transform |
| Chromium Peek8 | CSS 1920×1080, DPR2, **actual 3840×2160 backing**; 42 rewards | 2818 placements; exactly 0px; same opacity/transform |
| Chromium Peek1 | One real player, no fabricated shots/rewards | Zero popup, scene and HUD geometry reads in the timed no-label path |
| Chromium Peek16 hidden/resume | Real worker and bots continue while only the host presentation frame receives the production native hide signal | Zero hidden renders; authoritative time/score advance; 27 renders after resume; same match instance |

The 4K case retained antialiasing with four samples, 24-bit depth, 2048×2048 allocated shadow target, 38 tracked textures / three geometries / seven programs. Resize to CSS 1280×720 at DPR2 produced the expected actual 2560×1440 backing. WebKit Swarm retained four-sample AA, 24-bit depth / 8-bit stencil, 2048×2048 shadow target, 103 tracked textures / 50 geometries / 23 programs. Counts are actual Three object/resource counts, not measured driver VRAM bytes. No pixel ratio, framebuffer, shadow, glow, art, material or effect-count quality policy was lowered.

Peek samples created zero GL programs or shader compiles after warmup. Swarm created three programs / six shader compiles during its sample (20 programs at setup, 23 at end); their cause is not isolated, and this is not reported as a shader optimization or proof of sustained recompilation. GPU timer queries were not run. G9 Curling timing remains explicitly unmeasured/deferred.

## Hidden allocation discovery — remaining work

The controlled Chromium Peek16 case injected the exact production `native-shell/visibility.js` at document start, then sent hide/resume to the real host iframe only. Bots and worker remained visible/running. In 800 ms, renderer calls stayed at zero while authoritative time advanced 0.783 s, event serial advanced 47 and aggregate score increased 70. However, 48 presentation shot events still created 232 SpriteMaterials and 464 Colors, taking 19.4 ms in `Stage.effect` preparation; retained FX rose from 82 to the existing 120 cap. Resume rendered 27 frames and retained the instance. The measured event preparation excludes HUD/LocalPartyFeel work.

This is browser component evidence, not proof of actual hidden UIView cost, physical iPhone responsiveness or cast improvement. No hidden-event guard or material pooling change is shipped in this lane. A future candidate can consume event IDs while omitting new invisible transient presentation effects, with actual hidden/resume/reference tests and authoritative snapshots untouched. It needs a separate baseline/after acceptance; the current release freezes the verified G1 candidate rather than introducing an unmeasured lifecycle/material change.

The production diff versus the frozen244 source is limited to popup read batching/cache and its existing resize/font invalidation. Rules, protocol, CSS, shared native visibility, DPR/AA/shadow settings and other families are unchanged by this lane.

## Reproduction

Working runtime: `PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`. Chrome uses the installed `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; WebKit uses the existing Playwright browser cache. No runtime/browser installation was needed.

The initial baseline command was:

```sh
PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright \
GAME=peek_shoot QA_ROSTER=16 QA_SECONDS=12 \
PERF_SOURCE_DIR=.localparty-build/perf244/sports-before \
QA_OUTPUT=output/playwright/performance244/sports/baseline-peek-16 \
node scripts/performance244-sports.cjs
```

The same-frame oracle used `QA_POPUP_COMPARE=1 QA_SECONDS=6` without `PERF_SOURCE_DIR`, output `g1-reference-chromium`. The three pairs sequentially used the baseline source directory for `g1-paired/before-{1,2,3}` and current source for `g1-paired/after-{1,2,3}`, each 12 seconds / Peek16. Logs: `output-sports244-baseline.log`, `output-sports244-reference.log`, `output-sports244-pairs.log`. Local server execution requires the environment's approved network permission; an isolated-server bind restriction would not be an application defect.

The final sequential runner was `python3 .localparty-build/perf244/run-final.py` (exit 0, `SPORTS_FINAL_PASS`). It invoked the same harness with `QA_SECONDS=6` and, respectively: `QA_ENGINE=webkit GAME=swarm_gate QA_ROSTER=16 QA_POPUP_COMPARE=1`; `GAME=peek_shoot QA_ROSTER=8 QA_DPR=2 QA_POPUP_COMPARE=1`; `GAME=peek_shoot QA_ROSTER=1`; `GAME=peek_shoot QA_ROSTER=16 QA_NATIVE_VISIBILITY=1`. No browser/server jobs remain from this lane.
