# iPhone build 123 — 2026-10-05

Version 0.11.7 (123), signed Debug iphoneos application with matching App Clip, built from heypals/ux-polish dirty working tree at 40e4939. Opus changes already shared in this working tree; no stale branch merge performed. Retained new Swarm 3D turrets/impacts/ambience, Bowling/Curling, Pocket Siege and shared UI work alongside current Codex menu, controller and generated environment edits.

Evidence in .localparty-build:
- build-device-123.log: BUILD SUCCEEDED; codesign --verify --deep --strict passed with system trust-store access.
- build123-product-proof.json: 5475 packaged files match staged bundle; source freeze has zero drift; app and App Clip both 123.
- verify-ios123.json, verify-show123.json passed.
- General suite: 710/711 initially; only failure stale generated prototype inventory following four new Swarm modules. Inventory regenerated; all 24 focused tests passed including inventory, Swarm scoring and Pocket weather. No gameplay fix needed.
- Native product tests 15 passed; show product tests 5 passed.
- Fresh WebKit real launcher quick run output/playwright/build123-swarm; firing 720 screenshot visually reviewed, Opus 3D cannons plus current wall/gate art and effects visible.
- Packaged application: .localparty-build/releases/HeyPals-0.11.7-123.app.zip.

No installation, physical phone gameplay check, TestFlight upload or Git push was performed in this request.
