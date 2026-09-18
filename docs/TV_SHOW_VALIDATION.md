# TV Show — final validation record (2026-09-18)

UI marker: `tv-show-20260918.1`.
Tested runtime/source commit: `6de718a5cb5aaabb5870859e75b8a53265a58063`.
Base presentation: `9682653f653517276fe439cd7264fb1fd1f0e77d`.

## Actual final GitHub Actions run: SUCCESS

https://github.com/lomatoq/localparty/actions/runs/35296678199

Run #5 completed all steps successfully on Ubuntu / Node 22. All files were
checked out from the tested commit; dependency installation used the existing
lockfile. The final workflow is read-only and does not push source changes.
The subsequent validation-document commit does NOT change this tested runtime.

Executed and inspected:

- 68 focused Node tests/contracts: original 48 plus 20 TVDirector/state/security
  tests. PASS. The broad suite below overlaps some contracts; counts are not a
  count of unique independent user journeys.
- 11 existing synthetic iOS product-validator tests: PASS.
- 5 synthetic show-resource validator tests: PASS. Stale/missing source, styles,
  staging and product files are rejected; the verifier compares all 16 listed files.
- 36 REAL local HTTP/WebSocket/worker checks: PASS. These started the actual server
  and bowling/push game workers, joined controllers, authenticated the display,
  checked large PNG QR dimensions, focus/no-launch, pause/resume/stop, persisted
  preferences and unchanged scores, and denied guest/display/wrong-token commands.
  This is real Node transport, not physical iOS or a complete game on an iPhone.
- 41 native startup/catalog/layout browser checks: PASS with full checked-out CSS,
  in-memory HTML, synthetic game records and mocked native bridge. No real assets.
- 76 Fresh/input/display checks: PASS with full checked-out CSS, intercepted file
  routes, placeholder artwork, mocked native/WebSocket/iframe behavior. Production
  CSP remained intact; no unsafe-eval or browser security exceptions were added.
- 85 TV Show/admin/controller/photo checks: PASS with actual checked-out CSS,
  fonts and artwork loaded through intercepted local-file routes. Native messages,
  WebSockets and iframe transport were mocked. This is NOT WKWebView/device proof.
- Entire existing `npm test`: PASS — 156 tests, 0 failures, 0 skips, followed by
  six existing integration summaries (party, tanks, shrink, spy, millionaire and
  16-player tanks). The workflow propagates failures through tee with pipefail.
- Runtime source bytes for 18 files (16 show-validator entries plus the two Swift
  files) were compared to the tested CI source snapshot and matched exactly.

Artifact: `ios-show-review`, ID 10527794625, from the run above.
Downloaded artifact SHA-256:
`047f177257ac1201abd252c4c23fd9f36a9bcf61401beefebba63ccb9aea7cf9`.
Artifacts expire after five days; this record and test sources remain in Git.

## Bugs uncovered and corrected while validating

The full stylesheet cascade exposed a REAL existing TV geometry conflict:
`.company` retained desktop `grid-area: 2/3`, creating an implicit third column
and second row in a two-column TV lobby. This halved the visible catalog area.
The final runtime commit explicitly pins TV browse/sidebar grid coordinates and
one flexible row. The full first-Fresh-row checks now pass at 720p, 1080p, 4K and
4:3, without changing phone or game-iframe layout.

The native pressure fixture was initially outside the viewport, and subsequent
wait_for_function polling conflicted with the page's strict CSP. The test now
uses a visible control and locator polling, preserving the actual compression
assertion. No production CSP was weakened.

The old motion-only contract predated the requested haptic/pointer presentation.
It now allows ONLY scoped haptic/prepare messages and passive visual observation,
while retaining prohibitions on gameplay networking, synthetic clicks, pointer
capture and input cancellation. An embedded-network test now aliases the runner's
REAL LAN address as en0 only inside its isolated child process; the production
native interface filter and network authorization were not changed for CI.

## Visual/interaction coverage

Screenshots inspected: three- and sixteen-player podium, admin hub, controller
bottom dock and photo picker. Names, points and results are synthetic test data.
The podium shots with effects off demonstrate layout, not a physical GPU effect.

Tests cover 1/2/3/7/16 seats, 720p/1080p/4K/4:3, medal/crown geometry, bounded
spark pool and stopping effects, central QR, selected ordinal/scroll-to-row,
startup progress/readiness, transitions and Reduce Motion. Admin widths 320–768,
controller widths 320–430 use real app.js joined/state/resize handlers, not a
manually forced CSS class. Photo picker and form sizing were checked at 320–430.

## Remaining actual Mac/iPhone acceptance

Xcode/iOS SDK typechecking/linking, signed installation and actual .app validation;
SceneAccessory/AirPlay receiver/audio/latency; physical UIKit haptics, sensor access,
camera and library system pickers; WebGL2 shader compilation/performance on the
user's iPhone. Local Swift frontend PARSE passed but does not replace SDK compilation.
These steps are mandatory in `CLAUDE_TV_SHOW.md`. Keep the already-working Team,
Bundle Identifier, local scene/build fixes and profile/statistics data.

The podium is a layered UI composition with optional original WebGL2 procedural
shading and bounded Canvas firework particles. No direct Metal renderer or new
fireworks dependency is claimed. No added audio. Cycles stop on hide/off/Reduce Motion.

## Dependency audit (not concealed by a green test run)

The run recorded one existing HIGH development-tool advisory for `sharp` <0.35.4
(GHSA-f88m-g3jw-g9cj and GHSA-rgj7-g3m4-5g8c are grouped under one package entry).
The checked-in sharp is a dev dependency excluded by the existing iOS bundler.
No dependencies or lockfile were changed in this regression-focused update.
A green functional suite is NOT a clean vulnerability audit. Review/update the
artwork tooling separately with its image tests; do not force-upgrade the mobile
runtime or claim that this advisory was fixed here.

## Preservation and security

Only the existing loopback bearer-authenticated manage API can change TV show
state. Guest/display WebSockets stay unprivileged. Live unpaused gameplay cannot
be hidden by the admin QR/podium. Match rank/wins and company points are distinct;
ties retain their rank, and unknown placement is not guessed from raw scores.

ExternalDisplay.swift, NodeBridge, Info.plist, native scene registration, dependency
pins, signing and real user data were not changed. Small Codable/state/whitelist
and prepared haptic changes are required in the two documented Swift files.
No font files, real player data, private keys or provisioning profiles are part
of the downloadable patch archive. PR stays draft until device verification.
