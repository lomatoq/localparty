# Performance250: native interface and targeted UI fixes

2026-10-10. Baseline `main` at `3fadadffa345218f6d5816864b9eb0db780289b5`.

## Coordination boundary

The user is arranging a separate game architecture rewrite. This round owns the launcher, native interface and narrow presentation fixes only. Do not modify game engines, catalog membership or the new cross-game architecture. `drawguess`, `jenga`, `crane` and `chaos` are explicitly excluded from optimization for now; the friend will handle their removal. This is not an instruction to remove their source or catalog entries here.

Preserve artwork, game resolution, FPS targets, AA, shader quality, popup blur, 93% panel material, visible background controls and approved easing. No visible scrollbars. Browser, native operation benchmarks and physical phone/cast acceptance are separate evidence.

## Implemented scope

- Running-game Host Pick: preserve the compact panel's 48px left art/disc, including a narrow arrangement that keeps its title readable.
- Rooms: use the existing icon pack's pen for the own-room name editor. Match its circle diameter to Connected height and retain the player-row alignment and right inset.
- Native publication: merge already-deferred model-change publications while preserving explicit actions, retry/coalescing flags, navigation resync and recovery. A naive Boolean queue changed rejected-ACK retry behavior and was rejected.
- Popup exits: ordinary floating dialogs shrink to 96% and fade; mobile bottom sheets travel down and fade in 180ms. Back, completed outside taps and Escape share the close lifecycle. Accepted user dismissals send one native haptic request; automatic state changes stay silent. Interrupted reversal retains the live pose; parked/reduced-motion cleanup commits the requested final state.

Measurement workflow used the external [performance-optimization skill](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md); mobile-native and animate skills guided the bounded interaction changes. UI art and quality remain preserved.

## Physical evidence so far

The fresh device copy succeeded. It contains 33 build151 phone samples across three historical launches on October9, with no TV-surface sample in those sessions. The two lowest recorded ten-second samples are 40.2fps and 49.3fps at nominal thermal state. Most other samples are near60fps. These are unlabelled journal windows, not matched action workloads or a casting comparison. They do not establish a particular bottleneck or a before/after improvement.

After the user opened HeyPals without casting, the fresh October10 journal contains20 phone-only catalogue samples between11:01:02 and11:04:12UTC:59.4–59.9fps, p95≈17ms, maximum frame gap77ms, no gap over100ms, nominal thermal state and Low Power off. Individual windows contain1–2 gaps over50ms. These are build151 observations before this round's changes, without action labels; they are not a matched popup benchmark or evidence of a casting improvement.

Instruments listed the iPhone online, but the actual30-second all-processes Time Profiler attempt failed before recording: exit13, `Waiting for device to boot` followed by `Timed out waiting for device to boot`. No usable CPU trace was captured. Raw journal, device inventory and profiler attempt are ignored under `.localparty-build/performance250/device/`.

After installing152, a second30-second Time Profiler request produced a partial trace. Its exported table of contents records1.340044 seconds and `Device disconnected`, with the installed app PID54146 and its WebKit processes present. This proves recording started, but is too short and unlabelled to validate popup latency or casting. The partial trace, original log and exported TOC are retained as `build152-no-cast.trace`, `build152-profiler.log` and `build152-no-cast-toc.xml` in the same ignored device directory; no successful full30-second workload is claimed.

## Accepted presentation fixes

- Rooms own-room editor uses the existing `pen.svg`,22px inside a48×48px lime circle. Circle diameter equals Connected height; player-row centre and right inset deltas are0. Only `rooms-inline172.css` changes; Rooms JavaScript/native transport remains unchanged. WebKit host/controller at320/402px covers closed/editor/synthetic keyboard:12 captures,120 checks. Chromium402 covers host/controller closed/editor:4 captures,46 checks. Zero captured errors/failures. Root independently viewed all16 accepted originals, including the uncut Save glow and keyboard-adjusted input/Save/Back. These desktop native-route fixtures are not UIKit/software-keyboard or phone-performance acceptance. [Rooms gallery](../../output/playwright/performance250/rooms/index.html).
- Running-game Host Pick compact art/disc retains48×48px instead of shrinking to32×32px. A narrow320px arrangement puts the title above the existing Controller control so enlarging art does not truncate the title. Full layout and TV64px selector remain untouched. Root independently viewed16 final Chromium/WebKit originals: full/compact/actual More-expanded at320/402, plus paused/results compact controls in WebKit. Actual expanded class assertions use observed More coordinates. The existing expanded320 title ellipsis remains; it is not claimed as repaired. The first art-only candidate was rejected for compact-title truncation and retained in the evidence ledger. This is a layout fix, not a measured speedup.

## Accepted native work reduction

Root promoted the exact two-bit observation coalescer after20/20 Foundation state/recovery cases and4/4 actual macOS WK document-end/didFinish delivery checks. It merges same-turn model notifications while retaining explicit publication, Rooms navigation resync and the existing ACK/error republish flag. It changes no game engine or bridge protocol.

Eight balanced ABBA blocks for actual2/3/5-notification source bursts saved0.029/0.091/0.122ms of complete source-operation time on Mac; the single-notification control was within noise. WK transport and native metadata are mocked in those CPU timings; the separate real-WK experiment checks delivery ordering only. This modest repeated-work reduction does not prove improved iPhone/cast FPS or explain second-long popup stalls. [Exact diagnostics and boundaries](native-observation250.md).

## Acceptance

The bounded presentation and publication changes passed their source/runtime gates. This is not a claim that all popups, games or casting transitions are fixed.

- Popup close lifecycle: WebKit at393/320/960px and Chromium at393px passed120 runtime cases, with zero page errors and unchanged source hashes across the final lanes. Back, stationary outside taps, Escape, method-dialog cancellation, drag protection, programmatic close, rapid reopen and hidden/reduced-motion cleanup are covered. Trusted dismissals request exactly one native haptic; automatic cleanup remains silent. Root inspected all48 original WebKit PNGs plus genuine intermediate game-sheet and floating-confirmation video frames. The recording is25fps and cannot establish physical device smoothness. Join and empty Catalog are exit-only presentation fixtures. [Exact matrix, interrupted-motion oracle and limitations](popupmotion250.md).
- `npm test`:748/748 passed; zero failed/skipped/cancelled. Party/Tanks/Spy/Millionaire integration checks also passed. The first sandbox run could not bind localhost (`EPERM`); a permitted rerun completed successfully. Logs: `.localparty-build/performance250/regression-sandbox.log` and `regression.log`.
- Product-verifier unit suites:22 passed in `.localparty-build/performance250/product-unit.log`. Staged iOS and presentation product verifiers passed after `npm run ios:prepare` (62 and21 exact resource comparisons).
- Release152 (`0.11.7`, `com.localparty.launcher`) built successfully for the physical iPhone using iOS27.0 SDK. All nine production source hashes matched the frozen source snapshot before and after the build; all eight changed public resources, including Rooms CSS and Updates JS, matched the actual signed `.app` bytes. The two actual-product verifiers passed62/21 resource comparisons. System signature verification passed; the restricted first attempt could not validate the trust store (`CSSMERR_TP_NOT_TRUSTED`), and a permitted system check succeeded.
- Installed over build151 without uninstalling or deleting app data. `devicectl` launched the installed app (PID54146); fresh device inventory confirms HeyPals `0.11.7(152)`. Logs/product hashes: `.localparty-build/performance250/build152-*.json`, `build152.log`, `build152-codesign.log`. Binary SHA256: `464ff76ff9ff17fbbad5fdacbfd96b8f87ddb50fe8c7e9d69c84d46e7a6f7042`.

Physical iPhone popup responsiveness, real software-keyboard behavior and separate external TV/Mac casting remain open. Build151 journal observations above do not validate the new popup exits or source-operation coalescer. Game engines, catalog membership and renderer quality were not changed.

The review gallery is served locally at `http://127.0.0.1:17810/performance250/index.html`. Publication uses an exact indexed tree on top of the fresh main baseline, with a non-forced expected-head update; raw publication receipts remain ignored under `.localparty-build/performance250/`.
