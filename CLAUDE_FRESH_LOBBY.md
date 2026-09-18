# Claude Code — desktop lobby / Fresh / tactile UI

UI revision: `desktop-fresh-20260918.1`. Press layer: `tactile-20260918.1`.
Base: `a75af9352faa816f534df5d9b38ca46b5a403c8b`.
Branch: `codex/ios-unified-host-20260917`.

The user confirms the prior iPhone/AirPlay/cold-start hotfix now works.
**Preserve that working installation. This is a UI-only update, not a new iOS port.**

## What is already implemented

- `public/tv.html`, `tv.css`, `tv.js`: the simplified eight-tile TV lobby is replaced
  with the desktop LocalParty visual system, hero, Fresh rail, full catalog,
  game selection preview, QR, avatars/players and rankings. Uses the existing
  `style.css`, `refresh.css`, `glass.css`, `ux.css`, `catalog-previews.css`, `fresh.css`.
- The native menu uses the same catalog renderer, approved artwork paths/palette,
  the desktop's ten Fresh IDs, category filters, search and selected/voted states.
  It preserves the host panel, controller, startup ACK/retry and cached-catalog guards.
- `tv.js` exports `LocalPartyCatalog`, then starts display transport ONLY when
  `#tvStage` exists. This lets the native custom scheme reuse it WITHOUT any new
  static routes, networking, server dependencies or host credentials in the menu.
- TV keeps the existing display handshake, separate game iframe, instance key,
  pause/readiness/HUD flow and `partyTVLayout` scaling. Display cards are articles,
  not fake buttons. Choose games on the iPhone. The idle TV cycles Fresh every 9s
  and browses the lower catalog every 18s, only with no match/selection and no
  reduced-motion preference. Selecting a game stops this and returns to its preview.
- Existing `motion.js`/`motion.css` now add a delegated pressure/release layer.
  These files were ALREADY injected into desktop/guest/game pages by server.js.
  The native menu now loads them too. Canvas, joystick, range sliders, disabled
  controls and display-only TV are excluded. Pointer cancellation, scroll movement,
  keyboard release, blur, native hide, pagehide and reduced motion are handled.
  No synthetic click, pointer capture or preventDefault is introduced.
- Native menu clicks send short haptic requests through the EXISTING validated
  bridge; the native haptics toggle remains authoritative. No Safari hack, no extra
  hit haptic on every gameplay fire button, and no claim of Safari vibration.

## Scope that must remain unchanged

No Swift, Xcode project, Info.plist, ServerModel, ExternalDisplay, NodeBridge,
server.js, network access, physics, catalog JSON, dependencies or lockfile were
changed by this update. `tv-layout.js` is unchanged. Do NOT replace locally fixed
Swift code with older GitHub copies and do NOT reimplement AirPlay.

## Apply on the user's Mac

1. Inspect `git status`, current HEAD and the existing Team / Bundle Identifier.
   Preserve all unpushed fixes from the successful build. Fetch the work branch;
   merge/cherry-pick this UI commit into that working tree. Do not reset --hard,
   force-push, uninstall, wipe profiles/statistics, or create a second app identity.
2. Freeze dependencies and SDK for this pass. Keep the already working toolchain.
   The earlier broad latest-version task is NOT part of this UI update.
3. Run:
   ```sh
   node --test tests/native-shell.test.cjs tests/fresh-lobby.test.cjs
   python3 tests/test_ios_product.py
   python3 tests/native-shell-browser.py
   python3 tests/fresh-lobby-browser.py
   ```
   Python browser tests require Playwright and a browser. `--fixture` is a reduced
   CSS test, NOT a production visual check. `--in-memory` on fresh-lobby-browser.py
   is an explicit DOM-only fallback with mocked iframe navigation/messages.
   Here those fallback checks passed; real checkout CSS, fonts and artwork MUST
   be tested locally, with a real browser/server and WKWebView on the phone.
4. Build/install OVER the existing working app using its actual values:
   ```sh
   bash scripts/build-ios-local.sh --offline --device "$DEVICE_UDID" \
     --team "$TEAM_ID" --bundle "$EXISTING_BUNDLE_ID"
   ```
   Preserve local build-script fixes. `--offline` skips release-version auditing;
   it does not mean dependencies can be installed without cache/network.
   Use the current installed version/build baseline and increase its build number
   locally as needed; do not downgrade a newer build made during the earlier repair.
5. Confirm the staged AND installed `Server/public/` contains exact current copies:
   `tv.html`, `tv.js`, `tv.css`, `motion.js`, `motion.css`,
   `native-shell/index.html`, `native-shell/host.js`, `native-shell/host.css`.
   Run the existing `verify-ios-product.py` checks plus compare hashes of these
   eight files with the source checkout. The old verifier only byte-compares the
   native-shell quartet; a stale tv.js must not pass as this new UI.
6. Runtime markers:
   - Host panel diagnostics includes `Menu: desktop-fresh-20260918.1`.
   - `UI` / `Native: ios-recovery-20260918.1` remain the WORKING native hotfix markers.
     They are intentionally not renamed by a web-only change.
   - TV: `window.LocalPartyCatalog.revision` is `desktop-fresh-20260918.1`.
   - `window.LocalPartyUIFeel.revision` is `tactile-20260918.1`.

## Acceptance on the real iPhone + receiver

Keep separate contents simultaneously: beautiful full TV lobby, iPhone host menu
or controller. Check both cold AirPlay connection orders, reconnect and five app
restarts; all 30 currently catalogued games remain available. Do not claim hardware
success from DOM tests or simulator output.

Inspect actual screenshots at the user's phone width and the TV resolution. Fresh
must have real covers, not test placeholders; first TV cards must fit completely,
phone cards must not overlap, long titles/large text must remain readable, QR must
scan. Check filters including Fresh + search, normal/table sections, selected game
preview/settings and votes. Polling must not reset rail position or the pressed card.

Test a Fresh game (bowling/curling) and a non-sports game end-to-end:
selection → readiness → play → pause/resume → results → return to new lobby.
No duplicate HUD, no second server, no reloading the game iframe on every snapshot.

Test button/card press and spring release, nested controls, fast repeated taps,
long hold, swipe off a card, scroll and cancelled touch, leaving for Control Center,
returning from the controller, haptics toggle, keyboard and Reduce Motion.
Controls must keep sending precisely the same game actions. Test actual joystick,
drawing and sensor game so visual feedback cannot disturb continuous gestures.

For final delivery show the installed commit/build, real screenshots and test logs,
and name any untested hardware step. Do not merge the draft PR into ios/master
without a separate request. Do not replace this with another design proposal.
