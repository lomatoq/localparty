# HeyPals 0.11.7 — build 122

Built on 2026-10-04 from the complete current source snapshot, including Claude’s uncommitted updates to the TV home, bowling, curling, and Pocket Siege. Existing concurrent work was preserved.

## Validation

- General suite: 700/700; iOS product tests: 15/15; TV show product tests: 5/5.
- Xcode build, both product validators, and deep strict code-signature verification passed.
- Main app and embedded App Clip report build 122, marketing version 0.11.7.
- 2,242 frozen source files unchanged through build and installation; 5,462 bundled runtime files match staging and current runtime sources.
- 50 fresh WebKit screenshots captured and all original images opened for review. TV home: 4; bowling: 20; curling: 12; Pocket Siege: 14.
- Bowling capture completed a three-frame two-player match. Curling checked four deliveries, sweep, and collision; it intentionally stopped before the complete match. Pocket Siege checked arsenal, shot, impact, next turn, pause/resume, and reload.
- Physical iPhone installation over the previous app and application launch succeeded. Motion feel, camera tracking, and sustained gameplay were not physically exercised during this build turn.

## Review and product

Gallery: `output/playwright/integration122-review/index.html` — locally served at http://127.0.0.1:17809/integration122-review/index.html.

Built app: `.localparty-build/DeviceAppClip105/Build/Products/Debug-iphoneos/LocalParty.app`.

Structured proof: `docs/qa/integration122-product-proof.json`.

Review scope is the changed screens, not a fresh full-catalog audit. Existing Pocket Siege world-edge name clipping and the pause-screen top strip remain outside this integration-only build scope.
