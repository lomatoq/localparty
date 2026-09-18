# iPhone regression hotfix validation — 2026-09-18

Base: `835027d7d3e6e83bcb95613afe76157ef0875647`.
Hotfix revision: `ios-recovery-20260918.1`.

## Executed here

- 31 Node tests/contracts: passed. This includes the original 23 checks and 8 additional
  source-level lifecycle/layout/authorization contracts. These are not Swift SDK tests.
- 11 Python product-validator unit tests: passed using synthetic bundles. Positive and
  negative cases cover missing/empty/duplicate/incomplete catalogs, stale shell bytes,
  invalid schema, missing engines, external-scene metadata and the SDK version.
- 41 Chromium DOM checks: passed. In-memory HTML/JS, 30 synthetic game records, mocked
  native bridge, and a REDUCED shared-CSS cascade from the inspected base commit.
  Widths: 320, 360, 375, 390, 430, 600, 768, 1024 CSS px. Includes enlarged text,
  acknowledgment/retry, temporary empty snapshots, dialogs and six JS-document restarts.
- Negative control with the original shell: 10 of 21 checks fail as expected. Readiness
  is sent only once, startup shows zero games/no results, the update has no explicit
  acknowledgment, and 320–600px fixtures have 13px row overlaps.
- JavaScript syntax, bash syntax, Info.plist parse: passed.
- Swift frontend PARSE only: passed for legacy and forced-modern conditional branches.
  No UIKit/WebKit modules were type-checked or linked here.

## Explicitly not executed here

Full repo checkout/dependency installation/full npm suite; real shared-CSS/font/art
visual QA; WKURLSchemeHandler/CSP/WebKit integration; Xcode SDK compilation/linking;
simulator application launch; signed device installation; physical AirPlay, sensors,
haptics, audio/latency; real application process cold starts; a real built .app verifier.

The local test environment could not clone the repository or navigate Chromium to
localhost. Files were read through GitHub and the previous source-only artifact; browser
checks used a documented in-memory harness, NOT altered browser/network security policy.
The repository's actual shared CSS remains the required next local test (`--fixture`
omitted) and hardware checks in IOS_HOTFIX.md are mandatory before merging the draft PR.

No dependency versions, game logic, player data, signing identity or server permissions
were changed by this hotfix. iOS/master remain untouched; update is for the existing
work branch. No assertion that AirPlay now works on a physical receiver is made here.
