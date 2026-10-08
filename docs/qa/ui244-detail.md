# Local Rules and Host Pick artwork transition — UI244

Current status: Rules/flight source frozen after final browser validation. Fresh screenshots and recordings reviewed by this lane; parent second review requested. No native build or install is made by this lane.

## Reproduced before changing source

Actual native host HTML, with the native visibility and persistent-tabs scripts injected, in Chrome and Playwright WebKit at 393×852. Cached catalog: all 36 games, no TV, native room not ready and preparation in progress.

- All 36 Rules buttons were disabled in each browser. The first Rules button could not open its local description.
- The art-flight popover was a body sibling and was marked as modal background. Its computed filter reached `blur(8px)`. Intermediate screenshots show soft artwork that is replaced abruptly by sharp detail art.
- The native main element was also filtered, giving its sticky contents a different stacking context. Root owns the fix that filters the existing direct branches instead, preserving global paint order.

Before evidence: `output/playwright/ui244-detail/before/report.json`, intermediate PNGs, and real-time WebM recordings. These are browser/native-bridge fixtures, not physical iPhone/AirPlay measurements.

## Changes and reasons

| Before | Change | Why |
| --- | --- | --- |
| Room preparation disabled Rules along with Start. | Shared `LocalPartyCatalog` keeps only `.lp-card-open` enabled; starting and settings retain their existing guards. | Cached descriptions can be read locally even before the TV or room is ready. |
| The flying art was accidentally treated as background. | Its manual popover belongs to `gameDetail`, while retaining top-layer painting. | The dialog owns its foreground effects and cannot inherit the unrelated root-background blur. |
| Soft art suddenly became sharp at the handoff. | An explicit 8px→0 art blur follows the flight clock, then the coincident clone and detail image crossfade on paired upfront WAAPI opacity effects. | Latest user correction asks for softness in motion that resolves gradually at arrival. |
| The endpoint assumed bottom inset zero and could land 28px above the approved art. | Compute the destination from the actual fixed-dialog layout offset, including its negative bottom inset. | The replacement image occupies the same position and size, avoiding a geometry snap. |
| The newly assigned detail image could still be decoding. | Begin with the already decoded tapped texture and its natural dimensions. | The first foreground frame does not depend on a new cache/decode completion. |
| Rapid close/reopen could restart a clone or lose its live position. | Reuse the same clone on reopening; retarget from its live pose and current blur. | Interruption retains continuity rather than restarting from the original card. |

The target texture is decoded before its opacity effects start. If decode trails the normal arrival phase, the already painted clone stays opaque, then a100ms crossfade begins after readiness; neither picture disappears early. The existing sheet spring and duration remain the motion clock. The subtle established overshoot provides the settled bounce; there is no additional permanent pulse or new motion library. Root blur and approved circular Host Pick artwork remain in place. Reduced motion skips the artwork flight.

## Validation

- Static catalog/motion tests: 5/5 pass.
- Baseline: 18 reproducible assertion failures across Chrome/WebKit; no runtime errors.
- Shared catalog/readiness/background pass: 16 scenarios, 0 failures, 0 runtime errors (`after/report.json`). All 36 descriptions actually opened per engine while no TV, native ready false, catalogReady false and working true. Every Start/settings control stays guarded; local reading sends no native `select` command while busy.
- Final motion pass after replacing rAF-dependent handoff: 10 scenarios, 0 failures, 0 runtime errors (`after-motion/report.json`). Chrome/WebKit both record paired fractional alphas summing to 1 (WebKit cold: 0.396825 + 0.603175); the clone remains foreground-owned and explicit blur decreases from 8px to 0.
- The final destination matches the actual object-fit artwork position within 1.5px. Both fast close at65ms and close/reopen at65ms leave no stale clone or hidden source.
- Reduced motion skips art flight. Nearby and programmatically opened Host Panel retain the underlying main branch geometry; the native main remains unfiltered. The technical Host Panel button is intentionally hidden by native tabs and was not restored.
- 24 final motion images and 12 static images visually reviewed in engine contact sheets; intermediate WebKit warm image also enlarged. Static images preceded the final opacity-only refinement; Rules/material/background geometry are unchanged. New Host Pick availability bounce/fade changes belong to the parent lane and are recaptured there.
- Final source hashes and exact reviewed paths: `output/playwright/ui244-detail/visual-review.json`.
- Gallery: `http://127.0.0.1:17810/ui244-detail/index.html`.
- Reproduce: `NODE_PATH=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/browser/ui244-detail.cjs`; use `QA_MOTION_ONLY=1` for the focused flight pass. The test starts an ephemeral localhost static server; sandbox `listen EPERM` requires the approved local-server escalation rather than a product change.
- Physical iPhone, AirPlay frame pacing and actual TV output: outside this browser lane; no claim of device acceptance.
