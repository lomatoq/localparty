# Build129 — motion, replay and phone polish

2026-10-06. Version0.11.7(129), app and embedded AppClip.

Includes current Claude changes already present in build128, inward Push Pit starting orientation, shared event effects and choice acknowledgement, stable podium/phone results choreography, participant/host rematch, native Swift command allowlist, host masthead and QR expansion backdrop fix, compact mint native replay and theme-tinted status. Shared result replay keeps its approved style.

Verification before assembly:722 tests pass plus party/spy integration scripts; rematch integration passes embedded and desktop (duplicates/stale/phase/auth/auto-ready/identity/result count); real browser replay passes participant on embedded and participant+host on desktop. Chrome/WebKit320/393 replay and phone polish checks pass. All36 launch/stop curtain paths(72 transitions) pass; Pocket Siege return test leaves0 gameframes and identical snapshots cause0 catalogue mutations. Feedback caps/cleanup/quiet-snapshot no-geometry test pass both engines.

See docs/qa/console-motion135/README.md and output/playwright/console-motion135/index.html. Browser captures are not physical iPhone/AirPlay validation. No installation performed. BUILD SUCCEEDED; both staged and product validators pass; deep strict codesign verification passes. Exact product hash comparison:1751/1751 runtime files match frozen source, no drift; app and AppClip129. Archive verified readable: .localparty-build/build129/HeyPals-0.11.7-129.zip.
