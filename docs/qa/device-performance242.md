# Physical-device verification — round242

Device: iPhone17Pro, iOS27.0, bundle `com.localparty.launcher`. Receiver identified by the user as MacBook Pro. The actual external WKWebView reports3840×2160, stage1280×720 atscale3.

## Installed baseline141

The prior installed139 was replaced in place with0.11.7(141), launched and device version confirmed. Build141 contains round241 source; round242 changes were intentionally released only after this baseline build. Product/source hash comparison and both product verifiers passed; unsandboxed code-signature verification passed. No user data was deleted.

Evidence: `.localparty-build/build141.log`, `.localparty-build/performance242/{source141,product141,show141,install141,launch141,installed141}.json`.

## Measurement limits

Application lifecycle aggregates are actual physical-device evidence. Initial phone-only samples reached58–59FPS, then38–45FPS; there were no contemporary TV samples. Later actual4K external samples and phone samples fell to roughly2.4FPS with thermal state serious. This interval overlaps unsuccessful Instruments attempts and uncontrolled user interaction, so it is evidence of the reported severe problem, not a clean before/after comparison or proof that4K alone caused it.

Instruments could not resolve the application PID/name. A systemwide attempt stopped after a device disconnect; it did not produce an accepted performance trace. No further Instruments recording is running. Do not treat the trace directory as a successful benchmark.

Logs after09:26UTC return to roughly49–60 phoneFPS but lack contemporary TV samples; those samples do not establish casting improvement. UI screenshot fixtures and desktop Chromium CPU measurements are separate from physical-phone/AirPlay acceptance.

## Checks for current source

- Native shell contracts:38/38 passed.
- Bonjour integration: sandbox run did not receive the LAN announcement; unsandboxed rerun1/1 passed.
- Product-verifier unit tests:22/22 passed.
- Online signalling example: isolated integration3/3 passed outside sandbox; no internet game was connected.

## Current build

Round242 build142 was built successfully, source freeze hashes and bundled resources matched, both product verifiers and code signature passed. It was installed in place and launched; device info confirms0.11.7(142). Evidence: `.localparty-build/build142.log`, `.localparty-build/performance242/{source142,product142,show142,install142,launch142,installed142}.json`. Clean simultaneous phone/TV sampling is pending reconnection of the external receiver. The current source adds passive visibility/native-surface/running-animation counters to the existing ten-second telemetry message; there is no new arbitrary JavaScript evaluation endpoint and no per-frame bridge traffic.

## Final143 correction

The production pause test caught important CTA rules overriding the first142 pause selector. The background-only gate now wins that cascade. WebKit and Chrome retain the phase of displayed background CSS effects, keep foreground bot CTA motion running, preserve blur8px/material.93 and resume the background after close. Two WebKit legacy animation objects advance on display:none targets with no client rectangles; these are excluded from painting assertions and are documented in the performance report.

Build0.11.7(143) succeeded. Both actual product verifiers, source/public-bundle hashes and code signature passed. In-place installation and launch succeeded; physical device info confirms143. See `.localparty-build/build143.log` and `.localparty-build/performance242/{source143,product143,show143,install143,launch143,installed143}.json`.

A clean contemporaneous phone+external3840×2160 sample remains pending receiver reconnection. No zero-lag, whole-app multiplier or physical casting-performance acceptance is claimed.

## Passive143 phone sample

The log after143 launch through10:00:05UTC contains22 phone aggregates and0 external aggregates. Phone median58.349999999999994FPS, median reported window p9519.0ms, thermal fair progressing to serious. Only menu/main-frame telemetry is present. This does not prove a clean phone-only environment or casting improvement; no dedicated TV scene was reporting in this window. Raw `.localparty-build/performance242/device143-initial.log`; parsed `device143-summary.json`.

## Final144 compaction correction

The complete strict Host Panel browser suite originally exceeded its55ms class-response threshold at61–64ms. The host now commits the existing threshold-crossing read/change/read FLIP in the scroll event; continuous geometry remains coalesced in rAF. Existing thresholds, curve,240ms motion, interruption and flow-slot reservation are preserved. Full unchanged assertions pass: class18–21ms, catalogue movement0.03125px; active-game action emits only controller, no launch/restart.

Build144 succeeded, both actual-product verifiers and code signature passed, frozen source hashes match the built public files. Device installation/launch and version confirmation are recorded separately below. Only host.js changes after143; no game mechanics changed. Clean simultaneous casting measurements still require a live external scene.

In-place install144 and launch succeeded. Device info confirmsHeyPals0.11.7(144). Evidence: `.localparty-build/performance242/{source144,product144,show144,install144,launch144,installed144}.json`, `.localparty-build/build144.log`.
