# Build126 — 2026-10-05

User requested a new build after the perf134/card-metadata review. Signed Debug iphoneos build, including App Clip, succeeded. Both products are 0.11.7 (126), existing bundle identifiers retained.

- Full suite:713 passing plus party/tanks/spy/millionaire integration scenarios.
- Product validator tests:16 iOS +6 show passing.
- Initial suite found outdated extraction/mocks in countdown and Punch fixture following the arcade lifecycle optimization. Updated only test extraction boundary and lifecycle context; focused10 and full713 pass. No gameplay changed during this build turn.
- Built product iOS/show validators pass;1751 runtime source files match the product exactly.
- Deep strict signature verification passes.
- Latest browser/visual evidence:docs/qa/perf134/README.md and output/playwright/perf134/index.html;72 catalog transitions previously passed. No repeat physical-device performance claim.
- Logs, resource hashes and preserved app ZIP:.localparty-build/build126/.
- Build only; no installation, launch, TestFlight upload or Git push performed in this turn.
