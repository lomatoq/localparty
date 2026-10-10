# Native graphics251: reuse the QR render context

2026-10-10. Source baseline `main` at `dfe3a83`; `ios/LocalParty/LocalPartyApp.swift` SHA256 `fbbc7e33d32008dd4109161b29682954f6dfbe3cb259d01bf579fd1725c85f5e`. One isolated hypothesis was prepared and measured in the root-authorized exclusive CPU/GPU slot. Production source is unchanged by this lane; root reviews proof and any promotion separately. No game engine, network/game protocol, excluded game, artwork, pixel quality, antialiasing, FPS limit, blur, effect or approved easing was changed.

## Source finding and scope

`PartyWebStore.makeQR()` at `LocalPartyApp.swift:983–987` constructs a default `CIContext()` for each render. The primary LAN QR is already retained while the address is unchanged (`:882`), so ordinary Rooms/game/profile popup opening does not imply a QR render. A Wi-Fi invitation action (`:1155–1173`) can synchronously render both the network QR and the App Clip QR. This is concrete repeated graphics-context work in that action, not an established cause of general popup or cast stalls.

The ignored candidate adds only `private lazy var qrContext = CIContext()` to `PartyWebStore` and changes the render receiver from `CIContext()` to `qrContext`. The context remains lazy, so empty input does not initialize it and app startup receives no new eager work. Each invocation retains its fresh `CIFilter.qrCodeGenerator()`, current UTF-8 message, default correction/context options, six-times transform, original output extent, PNG encoding, base64 prefix and synchronous ordering. No rendered QR, input payload or password cache is added. One context belongs to the existing store lifetime. Context cache/memory behavior on a physical device was not measured.

Apple recommends reusing a Core Image context because it retains graphics queues, compiled kernels and buffers. This experiment changes only that lifetime; it does not disable color management, force software rendering or change pixel format/options. [Apple CIContext](https://developer.apple.com/documentation/coreimage/cicontext?language=occ), [Apple Core Image performance guide](https://developer.apple.com/library/archive/documentation/GraphicsImaging/Conceptual/CoreImaging/ci_performance/ci_performance.html).

The workflow follows the external [performance-optimization skill](https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/performance-optimization/SKILL.md): one hypothesis, baseline first, identical correctness gate, matched measurement, preserve failed attempts, reject neutral/regressing results. Existing native TV artwork cache248 and catalog/observation changes249/250 are retained. TV loading blur radius14 and CA curtain movement are unchanged. `ServerModel.image()` has no caller found in the current iOS Swift tree and is not treated as a demonstrated hot path.

## Actual platform proof

The macOS probe uses real Core Image, Core Graphics and ImageIO, with no mocked rendering output or forced CPU context. `prepare.py` extracts the exact production `makeQR`, Wi-Fi encoder and `JoinInvitation` source. Timed baseline/candidate methods preserve the extracted QR settings and differ only in the context receiver/lifetime. macOS lacks UIKit: **both variants use the same actual ImageIO PNG encoder in place of `UIImage(cgImage:).pngData()`**. Consequently these are complete macOS CoreImage→CGImage→ImageIO PNG→base64 operation timings, not an executed UIKit whole-path measurement.

Separate proof classes replace only the image adapter with a capture adapter, outside all timing cohorts. They retain the actual pre-PNG `CGImage` for full sRGB RGBA8 readback and native dimensions/bit depth/alpha/color-space metadata. Both variants' raw CG pixels and PNG/base64 bytes match. Decoded PNG dimensions/pixels also match the pre-encode CG image. Valid input must produce a nonempty image whose dimensions match the unchanged transformed extent; matching empty outputs cannot pass a valid fixture. Empty/invalid inputs and an over-capacity QR must retain the empty result.

Sixteen cases passed: empty text; two LAN addresses; Unicode/newline text; WPA/open/escaped/max-length/hex-password synthetic network payloads; ordinary and Unicode App Clip links; invalid empty/control-character/security network inputs; over-capacity QR; and A→B→Clip→A→empty→C→A plus a new-store render. All data is explicitly synthetic. No device Wi-Fi credentials, invitation payloads, clipboard or network connection were read. Diagnostics retain input byte counts and output signatures, not encoded invitation text.

The first sandbox execution computed valid filter extents but returned nil from default-context CG image rendering for all valid fixtures. The strict gate failed and **zero timed cohorts ran**. Its original `proof251.json.sandbox-attempt`, `run.log.sandbox-attempt` and `source-proof.json.sandbox-attempt` are preserved. The same unchanged binary/source then ran successfully in the full macOS graphics context. No software-renderer or option workaround was used. This is an execution-environment failure, not a baseline/candidate pixel regression or a speed result.

## Matched repeated-operation results

Successful runtime: macOS `Version 27.0.1 (Build 26A434)`. Each shape has eight balanced ABBA/BAAB blocks, sixteen complete operations per batch, 256 operations per variant and excluded matched warmups. LAN has one QR per operation; the actual invitation shape has two. Every block's retained PNG/base64 output digest matched across all four batches.

The measured interval includes a fresh filter, context construction when present in that variant, default-context rendering, real PNG encoding, base64 materialization and the same per-render autorelease boundary in both variants. Output strings remain retained until after the timer. Source setup, pixel readback, decoded-image checks, digest computation and output release are outside the timing interval. Proof-only capture hooks do not exist in timed classes. CPU-side API wall elapsed time includes graphics synchronization; it is not an Instruments exclusive-CPU or GPU trace.

| Complete macOS operation | Baseline mean, ms | Reused-context mean, ms | Paired saved mean, ms | Paired bootstrap95% saved interval, ms | Positive blocks |
| --- | ---: | ---: | ---: | ---: | ---: |
| LAN: one QR | 10.66140 | 1.37933 | 9.28207 | 9.14459–9.41431 | 8/8 |
| Wi-Fi invitation: network + Clip QR | 24.10701 | 5.16696 | 18.94005 | 18.52185–19.40242 | 8/8 |

Raw first calls were baseline103.624ms followed by candidate18.084292ms. Their order, shared framework initialization, filesystem and GPU caches are uncontrolled; both remain in the ledger and support **no cold speed ratio**. Repeated-operation results beat paired variance in this macOS workload. They do not demonstrate an equivalent iPhone improvement, app-wide speed multiplier, popup frame rate, startup transition or active separate-TV casting result.

## Evidence and review status

All executable/candidate/raw evidence is ignored under `.localparty-build/perf251/native-graphics/`: `prepare.py`, `Probe-template.swift`, `NativeGraphics251Probe.swift`, `probe251`, `source-proof.json`, `candidate.diff`, baseline/candidate app copies, `compile.log`, `run.log`, `proof251.json`, `analyze.py`, `summary.json`, plus the preserved sandbox attempt. The corrected accepted source250 is part of this baseline, not changed or remeasured here.

Hashes:

- Candidate application: `319f88612ca469d2a2a74d46a1c721e4776f25d4ba23293b7a6a18e2256bce00`.
- Extracted baseline QR method: `60ef7b5c5805a59dcf125c3887adec9a0f9b776f14f75df44d62ea753f7ee74a`.
- Candidate QR method: `dfbe2a13073b246d6ba3c109f7c836e942af5b764e69ba362aca5a0278b0f2e0`.
- Final executed probe: `91bd8b341f86609e0407ae0659cab3f1f2ab205edf1d0916f9b1efe67d991864`.
- Wi-Fi encoder: `a83936985543a4ba17ffb0bd43f74d9f0202522ea4cbc06e9eeef2817aa340f5`.
- Invitation source: `1c7dc595393ef49d1eb152e18641a739b1ad49e116c6a94f6dd46939bf38e871`.

Root acceptance: independently recalculated all eight blocks per shape from the raw report, checked all16 case flags and verified the executed probe SHA. Promoted exactly the two-line candidate; the current application source matches candidate SHA `319f88612ca469d2a2a74d46a1c721e4776f25d4ba23293b7a6a18e2256bce00`. Native-shell, Wi-Fi encoder, join-invitation and Clip regression tests passed45/45. Release iOS build153 succeeded with the actual UIKit/CoreImage SDK; logs are `.localparty-build/performance251/native-tests.log` and `build153.log`. Compilation is not an executed iOS PNG-output or smoothness comparison. Physical no-cast/active-cast performance and context-cache memory remain unverified. The agent did not edit production code; root performed the exact promotion after review.
