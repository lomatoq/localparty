# Claude Code — TV Show / admin hub / controller polish

**This is the current instruction. It supersedes the earlier Fresh, hotfix and
latest-version tasks. Apply on top of the user's WORKING iPhone installation.**

Repository: `lomatoq/localparty`.
Work branch: `codex/ios-unified-host-20260917` (draft PR #1).
Base UI: `9682653f`; UI marker: `tv-show-20260918.1`.

## Already implemented

1. Admin hub: large centered TV QR invitation; manual last-match podium OR company
   ranking; close presentation; catalogue previous/next/ordinal selection; show the
   focused game's real settings; pause/resume. QR/podium cannot cover a live unpaused
   round. Navigation never starts a game or changes scores. Focus uses the original
   catalog ordinals, not a carousel's temporary visual index, and scrolls the actual
   TV row, accounting for the transformed logical viewport.
2. Native short haptic feedback on hub buttons, preparing a retained UIKit generator.
   Existing haptics preference remains authoritative. Game haptics remain separate.
3. The native controller's Menu button has its OWN bottom dock and a reserved game
   viewport. It is no longer prepended to the crowded header. Resize/rotation,
   keyboard and foreground changes recalculate usable height. Profile remains intact.
4. Photo UI: circular preview, separate camera/library, processing/error states,
   stable dimensions and same-file retry. Existing 192px crop and server image-size
   checks remain. An accessible profile edit button is present in the guest catalog.
5. TV first connection: about 2.4s preparation screen, styled progress and staged
   bento entrance. It waits for actual display authentication and a nonempty catalog;
   slow connection must say waiting, not false 100%. A running match/reconnect must
   not acquire a new long loading gate. UI animation does NOT delay game simulation.
6. Podium: #1 center/highest, #2 left/#3 right, remaining places alternate sides.
   Above seven players a compact second tier retains everybody (up to 16) legibly.
   Photos/initials, gold/silver/bronze rims, crown and glow; ties keep equal rank/height.
   Unknown places display “—”, never a guessed ordering from incomparable raw scores.
   Manual company ranking and current match results are different data sources.
7. Auto podium is an EXPLICIT opt-in, persisted preference. It shows only the final
   results for the matching game instance. Dismiss stays dismissed; new rounds reset
   it. Test matches are labelled and do not add real scores. Special game result UI
   still exists underneath so controls/readiness are not removed.
8. Optional WebGL2 procedural shaded background and a bounded Canvas firework effect.
   Not direct native Metal, not a new dependency. Cap 30fps, shader target <=960px,
   spark pool <=280, finite firework burst window; stop on hide/foreground loss/off/
   reduced motion. CSS fallback remains when WebGL2 is unavailable. No added audio.
9. Animated game switch, pause and resume, with bounded visual covers; game iframe
   instances, sockets and actual readiness remain untouched. Decorative press/release
   handles hold/cancel/scroll/keyboard. Continuous gameplay buttons/canvas/joystick/
   range input are excluded; no pointer interception or duplicate game actions.

## Important integration changes

This time there ARE small native/schema + server changes, not only static CSS:
- Server adds `tv` snapshots via `lib/tv-director.js` and allows only authenticated
  `/api/manage` TV commands. Guest/display WebSockets receive NO admin permission.
- `ServerModel.ServerState` has optional `tv: PartyTVPresentation?`.
- `LocalPartyApp.swift` declares the Codable/Equatable presentation structs in an
  ALREADY COMPILED file, extends the existing shell-only command whitelist and adds
  a short UIKit prepare handler. Preserve all locally fixed AirPlay/scene code.
- ExternalDisplay.swift, NodeBridge, scene accessory registration, Info.plist and
  Xcode target membership are intentionally unchanged. DO NOT restore old Swift
  files wholesale over the user's working local version: merge the small changes.

## Apply / build / verify

1. Inspect git status, branch and HEAD. Preserve unpushed changes, the actual Team,
   installed Bundle ID and stats. Fetch the work branch and integrate its latest
   commit into the existing working copy, with a safety commit or separate worktree.
   No reset --hard, forced push, uninstall or new application identity.
2. Keep working dependencies / lockfile / SDK. Do not repeat the broad upgrade task.
   Read `docs/TV_SHOW_VALIDATION.md`, then run:
   ```sh
   node --test tests/native-shell.test.cjs tests/fresh-lobby.test.cjs tests/tv-director.test.cjs
   python3 tests/test_ios_product.py
   python3 tests/test_show_product.py
   node tests/tv-show-integration.cjs
   python3 tests/native-shell-browser.py
   python3 tests/fresh-lobby-browser.py
   python3 tests/tv-show-browser.py
   npm test
   ```
   Browser tests require Python Playwright + Chromium. Full checkout runs use real
   CSS/assets; `--fixture`/`--in-memory` are labelled DOM-only fallbacks, not hardware.
   Build failures must be fixed, not papered over by removing validation or features.
3. Confirm the current actual installed version/build. Keep APP_VERSION and select
   a higher BUILD_NUMBER. The script no longer hardcodes build15 over a newer app.
   ```sh
   APP_VERSION="$EXISTING_VERSION" BUILD_NUMBER="$NEXT_BUILD" \
     bash scripts/build-ios-local.sh --offline --device "$DEVICE_UDID" \
       --team "$TEAM_ID" --bundle "$EXISTING_BUNDLE_ID"
   ```
   --offline skips release polling, not npm installation. Preserve local script fixes.
4. Check STAGING and the built .app with BOTH validators:
   ```sh
   python3 scripts/verify-ios-product.py --app "$APP"
   python3 scripts/verify-show-product.py --app "$APP"
   ```
   The new validator compares exactly 16 presentation/server/photo/controller files
   with the checkout. A stale tv-show.js, server.js or bridge must fail the build.
5. Runtime diagnostics: panel shows `Show: tv-show-20260918.1`; TV exposes
   `LocalPartyTVShow.diagnostics()` with renderer/readiness/effect status. Existing
   `Menu: desktop-fresh-20260918.1` and native hotfix revision remain intentionally.
   Validate the native state contains `tv`; if absent, merge the Codable change.

## Hardware acceptance (not replaceable by BUILD SUCCEEDED)

- Same app/profile after upgrade. Five cold starts: full catalogue, correct AirPlay
  second scene. Pair receiver before and after app launch; disconnect/reconnect.
- Initial loader and top-down bento appearance only at initial connection, no endless
  progress/black screen. Slow/no server communicates actual loading/error status.
- Large centered QR scans on two real phones; closing it leaves lobby/pause intact.
- Admin arrows and ordinal input reach first/last/Fresh/non-Fresh rows, never launch.
  Overlay is blocked during live unpaused match. Pause/control action is available.
- Podium with 1,2,3,7,16 players, long names, missing photos and tied ranks. Compare
  manual match result with the real final game result, and company totals separately.
  Auto on/off, close/reopen, next round and different-game instance do not reuse wrong
  winners. Manual and automatic board animations enter/leave correctly.
- Real menu/button haptics, preference off, long hold/release/cancel and fast taps.
  Decorative web feedback cannot distort fire buttons, analog joystick or drawing.
- Admin controller dock at the actual phone width, orientation and keyboard opening.
  All game inputs remain visible and reachable; no duplicate Menu in header.
- New photo choose/camera/rechoose/remove/fail/retry and name field, no layout jump.
- One sports game and one ordinary game from selection through actual final results:
  readiness → game → pause/resume → podium → lobby; no duplicate HUD or iframe reloads.
- Verify WebGL2 shader compilation and actual frame behaviour on iPhone, effect-off
  and Reduce Motion. Do not call the web shader a directly integrated Metal renderer.

Deliver installed SHA/build, actual screenshots, test results, and explicitly name
untested hardware steps. Commit fixes to the work branch; do NOT merge ios/master
or publish to App Store without a separate request.
