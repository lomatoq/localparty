# iPhone hotfix — AirPlay, mobile card layout, cold-start catalog

Revision: `ios-recovery-20260918.1`.
Base: `835027d7d3e6e83bcb95613afe76157ef0875647` on `codex/ios-unified-host-20260917`.

## Claude Code: immediate task on the user's Mac

The user already installed the app. Preserve their existing signing Team, Bundle ID,
profiles and statistics. Do not uninstall it, delete Application Support, clear player
storage, reset the repository, force-push or create a second application with a new ID.
There may be local fixes from the previous build that have NOT been pushed to GitHub.
Inspect `git status`/HEAD, protect those changes, then merge/cherry-pick this hotfix into
that working copy. Do not replace the entire working tree with the old archive.

For this regression pass, freeze dependencies. Do not combine a broad Node/Express/
Rapier/WABT migration with the three bug fixes. This document takes precedence over
older latest-version tasks in CLAUDE_BUILD.md until the regressions pass on hardware.

1. Confirm the actual iPhone iOS version and the installed app's Bundle ID. Select full
   Xcode with iOS 27 SDK and Swift 6.4+ for this hotfix. Do not update macOS or pay for
   anything without approval. The iOS 17–26 legacy external-display delegate remains.
2. Read `docs/IOS_HOTFIX_VALIDATION.md`. Run:
   ```sh
   node --test tests/native-shell.test.cjs
   python3 tests/test_ios_product.py
   bash scripts/build-ios-local.sh --simulator --offline
   ```
   Here `--offline` skips the latest-release audit; `npm ci` still needs network/cache.
   The script now checks staging and the actual .app, not just the source tree.
3. With Playwright available in the local Python environment, run the DOM tests using
   the REAL shared CSS in the repository (omit `--fixture`):
   ```sh
   python3 tests/native-shell-browser.py
   ```
   This is still an in-memory DOM + mocked native bridge check, not an iOS test.
   Inspect the native menu in the simulator and on the phone with the real fonts/art.
4. Build/install over the existing app, supplying its actual identifiers:
   ```sh
   bash scripts/build-ios-local.sh --offline --device "$DEVICE_UDID" \
     --team "$TEAM_ID" --bundle "$EXISTING_BUNDLE_ID"
   ```
   Build script version is 0.11.1 (15). Panel diagnostics must show BOTH
   `UI: ios-recovery-20260918.1` and `Native: ios-recovery-20260918.1`.
   Verify those values in the running app rather than opening a different older icon.
5. Correct real SDK/compiler/runtime errors without removing the registration, the
   delivery acknowledgment or the security/foreground checks. If a source file differs
   locally, retain the local fixes and apply this change semantically.

## What this patch changes

### AirPlay

Starting in iOS 27, UIKit requires explicit scene-accessory registration for custom
noninteractive external content. The old delegate alone no longer opts the app in.
The new persistent `PartySurfaceController` owns the entire phone menu/controller UI
and registers `UISceneAccessory.externalNonInteractive(sceneConfiguration:)` using
`PartyExternalDisplaySceneDelegate`. It retains the returned registration and enables
it. The existing separate `/tv` renderer/server/authentication are not replaced with
mirroring, and the delegate remains the older-OS path. Phone + external scenes are
advertised in Info.plist. No new third-party AirPlay library is added.

The host panel now distinguishes an attached native scene, gameplay display sockets,
an available accessory, and a build missing the new SDK. "Проверить экран" can request
registration/reload even when the external-scene count is still zero. It does not claim
that selecting a TV in Control Centre itself proves custom rendering is working.

### Catalog loading

Previously the single JS `ready` message was discarded while scenePhase was inactive,
and `didFinish` did not set menuReady. There was also no explicit JS acknowledgment:
optional chaining could silently do nothing and still mark a payload delivered.

Now readiness is accepted from the trusted menu while inactive (actions still require
foreground), startup waits until a model exists, `didFinish` provides a second path,
JS retries readiness, and the native sender caches only acknowledged snapshots.
Model changes are observed independently of representable redraws. Delivery is
serialized, retries are bounded, and late results from old documents are discarded.

The shipped native catalog is loaded as a fallback. Transient empty server snapshots
do not erase it; launch stays disabled until the authoritative server catalog is back.
Loading and missing-bundle errors are NOT represented as "0 игр" / a failed search.
This does not recreate a missing game engine or resume a terminated match.

### Cards

The native grid used 300px rows while shared glass.css imposed a 325px minimum card
height. The recorded mobile cascade produces 13px overlaps after its 12px gap.
Card image and text now participate in normal layout, grid rows size to content,
and native-only selectors contain their geometry. Shared visual CSS and original art
remain unchanged. Header columns/rows and small-screen wrapping are scoped too.

### Product verification

`scripts/verify-ios-product.py` fails on a missing/empty/duplicate/incomplete catalog,
missing game directories, stale shell files, a missing external scene or an old-SDK
product. It compares bundled shell bytes with the checkout. It is run after preparation
and before installation. A passed synthetic validator test is not an actual .app build.

## Hardware acceptance — do not skip

- Ten cold starts (force-close/open) without deleting data. Menu shows the actual full
  catalog each time; no stuck loader; own profile and statistics survive.
- Start AirPlay with app open, and also start AirPlay BEFORE opening the app. In both
  cases the TV shows the dedicated /tv scene, while the phone can show a different
  menu/panel/controller. Just seeing the phone mirrored does not pass.
- Disconnect/reconnect five times. No duplicate windows, repeated external sessions,
  accumulating renderers, or stuck display socket count.
- Open Control Centre during loading, return, switch menu/controller during a match,
  background/foreground the app. Existing pause/reconnect/input release must remain.
- Check real cards at the phone's actual size with long titles, search/filter changes,
  safe areas and large text. No card/row overlaps or horizontal page overflow.

Provide the installed commit, actual SDK/iOS versions, .app verification JSON, screenshots
of DIFFERENT phone/TV content, and results of each hardware scenario. Physical AirPlay
latency/audio, guest HTTPS and Safari haptics are not claimed fixed by this patch.

## Official references checked 2026-09-18

- Apple, Transitioning to the UIKit scene-based life cycle — iOS 27 opt-in change:
  https://developer.apple.com/documentation/uikit/transitioning-to-the-uikit-scene-based-life-cycle
- Apple, Presenting content on a connected display — registration ownership/lifecycle:
  https://developer.apple.com/documentation/uikit/presenting-content-on-a-connected-display
- Apple, registerSceneAccessory(_:):
  https://developer.apple.com/documentation/uikit/uiviewcontroller/registersceneaccessory(_:)

The iPhone's exact OS and the locally built commit were not supplied; the three symptoms
are reported by the user. Code-level causes/reproductions above are not a claim of having
inspected that phone or the user's unpushed local build changes.
