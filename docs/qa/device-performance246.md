# Physical device evidence — round246

2026-10-09. Physical iPhone17Pro, installed HeyPals0.11.7(147), verified through CoreDevice app inventory and the new launch entry. This is baseline evidence before the round246 source changes are installed.

## Standalone phone

The user confirmed the phone was unlocked, connected by cable, and HeyPals was open without casting. The user then completed repeated Rooms/game/profile openings and room-name expansion. Current device logs were copied to `.localparty-build/performance246/device/147-phone-actions.log`.

- Idle menu samples at10:25–10:28UTC: approximately59.6–60fps, p95frame gap17ms, nominal thermal state.
- Action window10:28:47UTC:54.4fps, p95gap27ms, maximum182ms,10gaps over50ms and3over100ms.
- Rooms window10:28:57UTC:42.3fps, p95gap73ms, maximum154ms,33gaps over50ms and15over100ms. Stage `nearbyDialog`, native menu visible, nominal thermal state.
- Subsequent10:29:07UTC window:56.6fps, maximum102ms. Idle then returns to about59.6fps.

These are ten-second requestAnimationFrame aggregates. They are not input-to-visible timings, GPU presentation timings, or the worst instantaneous opening rate. The user's report of a much stronger short stall is compatible with them;42.3fps must never be presented as the complete severity of that opening.

## Instruments limitation

CoreDevice process inventory and app-data copy succeed. Instruments lists the same iPhone as offline. The requested30-second TimeProfiler all-process recording ended with `Timed out waiting for device to boot: iPhone(27.0)`, before recording a usable trace. No CPU hotspot claim is derived from that failed recording.

## Outstanding comparison

The user has been asked to connect the separate HeyPals MacBook/TV scene. A matched current cast workload and after-install comparison are still pending. Historical October8TV samples are not a matched round246 result. Source/UI browser checks, UIKit simulator checks, SDK compilation, installation and physical casting remain separate evidence.

## Blur research and candidate gate

The official [Chrome blur investigation](https://developer.chrome.com/blog/animated-blur/) describes crossfading cached, already-blurred textures, and warns that simply adding multiple promoted blurred layers can increase GPU work. Its2017 implementation advice is a hypothesis to validate on current WebKit, not proof of an iPhone fix. The [animation guide](https://web.dev/articles/animations-guide) recommends measuring the rendering path and preferring opacity/transform for compositing. [WebKit's backdrop-filter explanation](https://webkit.org/blog/3632/introducing-backdrop-filters/) notes the additional rendering passes.

The user explicitly requires progressive blur in both directions. An instant-blur diagnostic is therefore ineligible for production even if it reduces work. Any retained replacement must preserve the blurred/dimmed background,93% popup material, visible underlying controls, interrupted transitions and reduced-transparency behavior; its first/last frames and actual iPhone behavior require separate review.
