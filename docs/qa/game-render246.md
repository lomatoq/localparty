# Sports rendering / presentation lane 246

2026-10-09. Investigation frozen when the user replaced the task with commit/merge/branch cleanup. **No Sports runtime optimization was accepted or applied.** Production Sports source remains the build147 baseline. The unaccepted HUD experiment is held only in ignored `.localparty-build/perf246/sports-hud/`; it is not part of the committed runtime. The root lane owns actual iPhone/no-cast/cast profiling; these desktop numbers do not establish device acceptance.

Read AGENTS, design/UI regression contracts, current visual audit and performance244 Sports/Canvas/Deluxe plus performance245 Sports triage. Applied [Addy Osmani's performance-optimization skill](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md): freeze, measure, isolate one cause, repeat and keep/revert. No Impeccable optimizer, frame-rate cap, resolution/AA/shadow reduction or art/material change.

## Baseline and cause

Twenty Sports JS files frozen at HEAD `db5e4f4a2163e772bf42e95d6cb7be4e048276f7`, `.localparty-build/perf246/sports-before/manifest.json`. `scripts/performance246-sports.cjs` reuses the actual isolated worker, TV, connected native-route phone (both controller-bridge and tabs scripts) and existing authoritative bots. Test-only response injection measures `paintUI`, mutations and Chrome task/style/layout counters. It does not add a production diagnostic gate.

Sports `paintUI` rewrites nearly every unchanged field on each snapshot: 16 player identities/counts/frames, fixed title/mode/phase, overlay/scoreboard/ARIA, and absent-avatar attributes. A 100-call replay of the same actual snapshot creates 19,500 mutations, including 7,400 replaced text children. The candidate retains authored text plus locale/child identity, guards other fields, and keeps the normal event, resize, state/input and FX paths. Dense Curling does not toggle its final scoreboard role from group to list and back on each call.

## Initial isolated measurements, not final acceptance

Actual full-quality Bowling16 at 1920×1080 backing/DPR1; six seconds live. No forced frame cadence, no physical receiver claim. Shared CSS hashes and unchanged geometry/resource settings are recorded with each report. GPU timer queries were not requested; CPU submission/task timings are not GPU durations.

| Sample | TV task / s | Style / s | Layouts | Main frames | 100 unchanged mutations | Replay / ms |
|---|---:|---:|---:|---:|---:|---:|
| Before1 | 2.557 | .599 | 1037 | 336 | 19500 | 25.4 |
| HUD1 | 2.367 | .522 | 977 | 359 | 0 | 3.3 |
| Before2 | 2.823 | .677 | 1100 | 360 | 19500 | 22.1 |

The first whole-TV delta is −7.4%, but one after sample is insufficient to establish repeated throughput gain. The isolated replay shows elimination of unchanged DOM work; it is not physical input latency. `paintUI` totals include actual event preparation and therefore are not pure HUD-only CPU counters. A first-use ball/material shader appeared in all three actual rolling/reset workloads (one program/two compile calls); it is recorded, not hidden.

## Correctness / visual evidence so far

HUD1's same-module oracle uses frozen `paintUI` and frozen score-drawer functions. Twenty-seven UI-only presentation cases pass: real state, changed score/name/number/connection/frames/energy/heat/deadline/team/gun/lock, sparse4→dense16, spectator, waiting/results and reset returns, across EN→RU→EN. Final fields, DOM classes/attributes/styles and geometry match. These controlled snapshot variations are explicitly not fabricated authoritative gameplay or physical device states. The actual match also retains its instance, roster and normal pause→resize→resume, with zero page errors.

Fresh before1 TV and HUD1 TV/phone captures were viewed. Bowling pinsetter/camera, authored alley/materials, 16 TV rows, logo/HUD and phone gesture/score/handed controls/Pause-Lobby remain in their prior composition. The harness captures the actual post-roll pinsetter/reset phase; these are not screenshots claiming the entire match is reviewed. All raw artifacts: `output/playwright/performance246/sports/`.

## Attempt ledger / deferred work

- Stable Sports HUD: unaccepted candidate only; repeated final timing, other Sports modes and WebKit remain unrun. Browser slot released for root's no-cast iPhone trace after Before2. No further browser activity occurred before the user's task replacement.
- Next run strengthens the UI oracle to inspect all player-card descendants (including percentage bars and translation guards), drawer heading/team descendants and result rows, as well as the previously compared fields. The original HUD1 run passed the earlier selector set; this expanded gate is pending, not retrospectively claimed as passed.
- Shadow caching / opaque pin instancing: untouched, still unmeasured. Dynamic Bowling caster/ambient state makes a blanket cache unsafe; no new shadow/GPU win claimed.
- Unused `Color` and cloned/normalized beam direction in `updateEffects`: identified source-only allocation candidate, untouched pending isolated measurement/pixel oracle.
- Sports paused scene still animates ambient geometry; a blanket render park changes visible output. No pause-cadence/art reduction applied.
- Sports `controls.js` has residual unchanged snapshot DOM writes, including real bot controllers. No input, AI, sensor, protocol or controller change made in this lane.

Phone UI popup lag, TV menu/top position, casting reconnect/curtain and physical iPhone performance belong to the parallel lanes/root acceptance, not to a claim from these game measurements.

## Handoff

Retained reviewable files: this report and `scripts/performance246-sports.cjs`, a diagnostic harness with response-only instrumentation. Its default run measures the unchanged runtime; it does not assert zero mutations. The pending acceptance-test wrapper was removed because that assertion fails on the unchanged runtime. Harness and ignored candidate syntax checks pass.

Baseline diagnostic example, using the installed Playwright dependency:

```sh
PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright GAME=bowling QA_ROSTER=16 QA_SECONDS=6 QA_OUTPUT=output/playwright/performance246/sports/baseline node scripts/performance246-sports.cjs
```

`QA_UI_ORACLE=1` enables the controlled presentation comparison. `QA_REQUIRE_STABLE=1` is an opt-in candidate acceptance assertion, not a passing baseline test. The expanded oracle selector set and final normalized-style candidate were syntax checked only; neither was run before the freeze. No build, installation, commit or push was performed by this lane.
