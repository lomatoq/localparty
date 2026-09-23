# Mobile UI and localization audit — 19 September 2026

## Confirmed issues and repairs

1. Shared controller header had conflicting overrides of 88–106 px before the safe area. It is now 64 px plus the safe area; the timer extends to the viewport top, its text stays below the status bar, and the mascot sits at the header's bottom edge. Text-mode timer labels use a smaller font than numeric time.
2. The pause/lobby dock overrode its gradient with a solid background. Shared web/native controller styles now retain a transparent-to-opaque fade and raised buttons, with safe-area spacing.
3. Naval's private fleet was clipped below the firing grid on narrow phones. It now occupies a compact separate area beside the target selector. All 36 firing cells and the private fleet fit at 320 and 393 px.
4. Shared dialog entrance animations could restart while the native host sheet closed. Closing now completes before the closing class is removed; native sheet animation rules have one owner. Frame samples check that a faded sheet never reappears.
5. The server-status dot could shrink under long connection text. Its dimensions and flex basis are fixed; the header has a short status and the detailed notice has a dedicated icon, readable copy and a stronger dashed border.
6. Native snapshots dropped readiness/bot fields, and the native command allowlist omitted `force-start`. Both are repaired. Active-game actions stay pinned and preserve their DOM/focus during presence updates.
7. Returning from the host menu exposed a readiness race: cached server state overwrote the iframe's reconnecting state, accepting an early tap that the server rejected. Readiness now follows the current iframe handshake, recovery disables it synchronously, and debounced resume events re-announce their current status.
8. Pocket Siege kept weapon tiles disabled after a turn change with unchanged inventory. Their enabled state now updates every turn.
9. Bow Club automatically opened a system camera prompt during game changes. Human players now explicitly choose camera or touch controls; bots use touch without permission prompts.
10. Localization stress exposed a motion observer processing detached text nodes. Detached nodes are now ignored.

## Verification evidence

- Full regression suite before the final content dictionaries: 207 tests passed, plus standalone party/spy engine checks.
- Native-shell, fresh-lobby and TV contracts: 73 passed.
- All 33 controllers in isolated WebKit: 66 viewport captures (320/393 px), no reported horizontal overflow, clipped button labels or JavaScript errors. Real game start is now mandatory before capture.
- Real iOS simulator: all 33 controller/pause screens captured. The stricter test identified the host-return readiness failure in Push; the other 32 passed. The dedicated post-fix WebKit test passed immediate gating, repeated resume and one-tap start. A final simulator rerun is required for that repair.
- Pause and rules dialogs: 393×852, 320×700 and 667×375; layout assertions passed. Reloads in Push and Tap Race retained player identity.
- Native personal-language synchronization: changing the host's language changed their own embedded controller; explicit room override generated a revision; a later personal English choice was retained.
- Eight-player synthetic results rendering in desktop WebKit: active fireworks median 17 ms, p95 18 ms, maximum 30 ms, no frames above 50 ms in that sample. Return to lobby median 17 ms, p95 18 ms, maximum 20 ms. The drain sample contained one 209 ms outlier; this is not proof of zero stalls.

## Artifacts

- `.localparty-build/compact-shell-all33/report.json`: 33-game, 66-viewport layout run.
- `.localparty-build/simulator-compact-ui/`: real simulator captures and the readiness regression evidence.
- `.localparty-build/compact-shell-en-final/`: English Push/Tanks/Naval recheck.
- `.localparty-build/host-panel-audit/`: host transition frame samples and connection-notice screenshot.
- `.localparty-build/pause-results-audit/report.json`: pause layouts, reconnect transitions and result-rendering samples.

## Limits

These are isolated local browser and simulator tests, not an eight-physical-phone Wi-Fi/AirPlay test. Simulator interactions use an opt-in Debug-only driver in the app's own WKWebViews; screenshots are captured from the real simulator. The driver is excluded from physical-device builds. This report does not claim a measured three- or four-fold speedup, or complete absence of bugs. Final translation coverage and final simulator recheck are recorded below when complete.

## Final verification

### Follow-up: native safe areas and return to lobby

The earlier overflow checks missed actual occlusion: the pause layer extended over the top of the session buttons. Fresh native screenshots reproduced it. The layer now uses the measured dock height; tests hit-test each button at its top, centre and bottom. The header content is 52 px plus the native top safe area, the timer uses the original curved silhouette scaled to its bounds, and the session dock has a transparent-top/solid-bottom fade. Native bottom safe-area padding is no longer counted twice. WKWebView root bounce is disabled to keep fixed chrome from moving with elastic scrolling.

Return-to-lobby now clears waiting/pause state and open game rules/room dialogs before exposing the catalog. Its existing paced card animation replays on an actual game-to-lobby transition, not on every room update. Both player and host catalogs use this transition. No generic error/toast suppression was added: the exact centre-screen flash reported by the user was not independently reproduced.

Fresh evidence:

- `.localparty-build/native-safearea-before/tanks-pause.png` and `.localparty-build/native-safearea-after/tanks-pause.png`: inspected before/after screenshots of the overlapping pause controls.
- `.localparty-build/native-all-return/report.json`: all 33 simulator games passed controller overflow/label checks, pause button hit tests, and return-state checks. Gameplay and pause screenshots captured for every game; not every image received a separate manual visual review.
- `.localparty-build/webkit-all-return/report.json`: all 33 games at 320 and 393 px passed, with no reported JavaScript errors.
- `tests/catalog-reveal-browser.cjs`: host/player fast scrolling, reveal spacing, repeat entrance, stable geometry and reduced motion passed.
- `tests/native-resume-ready-browser.cjs`: cold TV startup English, frame-by-frame exit with rules open, and three rapid waiting/game/lobby switches passed.
- `tests/host-panel-browser.cjs`: panel opening/closing regression passed. Forty targeted unit/regression tests passed.
- Native catalog dock bounds stayed 788–874 px in an 874 px viewport at scroll positions 0, 1200 and 3476. This is programmatic scrolling, not proof of physical overscroll gesture behaviour.
- Latest simulator build succeeded. Native TV loading/recovery strings now default to English and honour an explicit Russian room override. External-display native loading was not visually exercised on a physical TV.

No new build was installed on the user's physical phone in this follow-up. Simulator performance is not a physical-device frame-rate benchmark.

- Final full suite: 211/211 passed, including content coverage and Russian/English answer acceptance; additional Spy/Monster coverage checks passed afterwards.
- `.localparty-build/simulator-ui-english-final/report.json`: all 33 actual simulator controllers passed, including Push after host-menu return; no reported controller overflow or clipped button labels. Controller and pause screenshots are retained for each game.
- `.localparty-build/i18n-final-all33/report.json`: all 33 live controllers switched EN → RU → EN; no JavaScript errors or residual untranslated Cyrillic on captured UI surfaces (player names preserved).
- Both 150-question banks, 150 drawing/charades words, Spy locations/roles and Monster prompts covered. DrawGuess accepts both original Russian and translated English answers (300 answer cases).
- Main UI dictionaries are reused by game frames; only seven word/quiz games load content vocabulary, not the 26 action games.
- Personal language persists independently. Room-wide changes require a separate authenticated host action and are applied once per revision; later personal choices remain personal.
- The user's final narrow-screen findings are fixed: the selected-game card stays opaque even when Start is disabled, and the complete LocalParty logo fits beside English navigation. The host test asserts both immediate opacity and actual text boundaries at 320 px; screenshot: `.localparty-build/host-panel-audit/server-unavailable-320.png`.
- Latest simulator build succeeded and includes the final host-card/logo fixes and current translation assets. No new physical-phone installation was performed during this UI pass.
