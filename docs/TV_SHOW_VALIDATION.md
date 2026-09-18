# TV Show — validation record (2026-09-18)

Base presentation: 9682653f. Native recovery and AirPlay scene implementation are
preserved. New marker: tv-show-20260918.1.

## Executed locally before publication

- 48 existing Node source/contracts: PASS.
- 20 new TVDirector unit/contracts: PASS (real pure state/controller module).
- 11 existing synthetic iOS product tests: PASS.
- 5 additional synthetic show-resource verifier tests: PASS (missing/stale staging
  and product resources are rejected, all16 exact file hashes compared).
- 85 new Chromium UI checks: PASS with FULL actual checked-out CSS and exact new
  JS/HTML. This run used in-memory HTML, no real artwork/fonts, mocked native bridge,
  mocked WebSocket and iframe URL/message spies. It is not real networking or iOS.
- Checks include first-connection readiness/progress, central QR, podium 1/2/3/7/16
  seats at720p/1080p/4K/4:3, medal/crown/rank geometry, bounded effects and stop,
  catalogue focus, transitions, Reduce Motion, admin widths320–768, controller dock
  widths320–430 WITH actual app.js mocked joined-state lifecycle, and photo layout.
- The controller test originally forced a CSS class without a joined player; the
  real app correctly removed that class on resize. The test now uses the actual
  joined/state handlers instead of masking the lifecycle. It passes.
- Visual screenshots reviewed: three- and sixteen-player podiums, admin hub,
  controller dock, photo picker. Synthetic names/results are explicitly test data.
- JavaScript/Bash syntax and Swift frontend PARSE of changed Swift files: PASS.
  This is NOT Swift iOS SDK type-check/link validation.

## Full-checkout CI

The new GitHub workflow installs pinned project dependencies, runs HTTP/WebSocket/
worker integration, full checkout UI checks with real local assets, and npm test.
Its final run URL/SHA/results will be recorded after the run is inspected. A workflow
existing in the repository does not, by itself, prove that its tests succeeded.

## Explicit remaining hardware/local build checks

Xcode/iOS SDK compilation and signed installation; actual SceneAccessory/AirPlay
receiver rendering and audio/latency; true physical UIKit haptics; native permission/
motion; camera/photo library system pickers; actual WebGL2 shader compilation and
performance on the user's iPhone. Run CLAUDE_TV_SHOW.md and verify the .app contents.

The podium is a layered UI composition, with optional WebGL2 procedural shading and
Canvas firework particles. It does NOT introduce a direct Metal renderer or assert
that an undocumented Metal path is present. No external fireworks package was added.
Researched references: WebKit WebGPU support, UIKit impact prepare(), and
crashmax-dev/fireworks-js (official source). The implementation uses original bounded
particles/shading and the project's existing style rather than importing a runtime.

## Safety and preservation

Only the existing local bearer-authenticated manage API can change TV presentation.
TV/display and guest sockets remain unprivileged. Live unpaused games cannot be
covered by an admin QR/podium. Match board uses recorded per-game ranks and wins;
company ranking uses the existing points/wins ordering, preserving ties. There is
no fabricated ranking from raw cross-game scores. TV browsing writes no profiles.

No dependency upgrades, account credentials, provisioning profiles, private certs,
fonts, real player data, Apple developer access or App Store deployment are included.
ExternalDisplay/NodeBridge/Info.plist and native scene registration are unchanged.
