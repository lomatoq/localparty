# Build127 — 2026-10-06

User requested a new build with Claude's final changes, not repackaging build126. AGENTS and lane handoff confirm Claude finished. Comparing actual build126 ZIP to current source found two changed runtime files: public/app-ux-20261005.css (body-scoped native sheet reserve instead of root :has; enabled scroll-linked animation support block) and public/game-ui-polish-20261004.css (removed unused spring variable). Both included.

Signed Debug iphoneos build with App Clip: BUILD SUCCEEDED; app and clip 0.11.7(127). Existing identifiers preserved. Full suite713 passes plus integration scenarios; product tests16+6 pass; HostPanel WebKit regression passes at393/320 including restart guard and stable compaction. Built iOS/show product validators and strict deep signature pass. All1751 runtime files exactly match current source hashes.

Evidence and archive:.localparty-build/build127/. No new UI redesign, installation, launch, physical-device performance validation, TestFlight upload or push performed. Existing reported design nits in Claude handoff remain outside this build-only request.
