# HeyPals 0.11.7 (118) — integration review

2026-10-04. User explicitly authorized reviewing and completing latest Claude improvements, building a new version, and committing/pushing all accumulated changes to the repository. Current branch: heypals/ux-polish.

## Included work

Accumulated TV/controller UI, artwork, game fixes, App Clip/native host, session recovery, avatars and hands-free Motion from earlier accepted passes are preserved. Latest Claude pass adds Bowling alley/feel, Curling arena/ice/feel, Pocket world/toy-tank/effects, and a shared paint-only panel material. See lane notes for ownership history.

## Integration corrections

- Shared launcher /assets URLs in game HTML retain their real root path; game-owned files still use the game prefix. Six sports controller assets previously returned404; fresh reduced Bowling confirms all200 and no browser errors. A focused transformation regression passes.
- Pocket nuke presentation cooldown resets with the round clock. Full/reduced browser regression and fresh effect originals confirm the fix.
- Curling measurement camera protects scoring stone bodies against real header/roster bounds after camera interpolation. Final confirmation evidence is recorded in integration118-sports-review.md.
- Reduced-motion Bowling capture no longer waits for a deliberately disabled slow-camera beat; the same branch was independently exercised in the review fixture.
- Prototype resource inventory regenerated; build metadata advances both app and App Clip to118. Whitespace corrections have no behavior effect. Generated screenshots, build products and Xcode caches stay local through .gitignore.

## Verification

- Full suite:679 tests pass; post-suite Party/Spy integrations pass (`.localparty-build/build118-all-tests-final.log`). Initial run only failed stale inventory; history retained.
- Sports physics/stress:26 pass. Real Bowling and Curling throw flows, pause/reload/reduced motion checked by independent sports reviewer; exact coverage and baseline GPU warning are in its report.
- All36 fresh TV panel originals opened; live phone/TV A/B has0geometry/overflow changes and0browser errors. Native bridge/tabs320 checks cover3games. Detailed independent evidence: integration118-panels-pocket-review.md.
- Pocket seven-family renderer replay:493 painted snapshots,9static tests, and full/reduced effects regression pass. No claim of all321weapon coverage.
- iPhone Debug build118 succeeds. Product/show resource validators pass. Strict deep signing verification passes with system trust access; sandbox-only check initially could not access certificate trust.
- Frozen source and bundled runtime comparison:2,225source files;1,725runtime resources; no drift/mismatch. Both bundle versions0.11.7(118). Proof: integration118-product-proof.json.

## Limits

This pass does not prove physical iPhone motion feel or physical TV performance. Known Spy assigning-roles name/avatar overlap predates the paint-only pass and was not redesigned here. Curling emits an incumbent WebGL texture warning in some captures; it also appears in the pre-change baseline, with no new page error or visible missing texture in this pass. Historical reports and invalid fixture rows are preserved and separated from current evidence. No TestFlight upload or production deployment is part of this request.

## Installation

CoreDevice installation succeeded over the existing app. Installed-app inventory returned an empty list; device version readback is not confirmed. The installed product itself was verified as0.11.7(118) before installation. Automatic launch failed because iPhone was locked, so launch/gameplay is not confirmed; open HeyPals manually. Sanitized evidence: integration118-install-provenance.json.
