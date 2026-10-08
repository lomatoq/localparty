# Build125 integration — 2026-10-05

Owner confirmed Claude's current work is complete and requested integration of all local changes, review, small finishing fixes and a new build. No source lanes reverted; build includes untracked runtime art/CSS/JS as well as tracked edits.

## Verified before packaging

- `npm test`:712 tests passed plus party/spy integration scenarios.
- Focused director/motion/native-shell/Pocket weather:67 tests passed.
- iOS/show product tests:22 passed after extending exact-byte validation to the new app UX, TV motion and shared game panel assets. Negative tests reject stale new app/TV scripts.
- Full normal-clock real-launcher WebKit gallery:36/36 games,157 screenshots, TV1280×720 and phone393×852. No page exceptions or HTTP400+ resource failures; runtime source hashes unchanged during capture. Main contact sheets for all72 gameplay TV/phone captures visually reviewed, plus original main menu, Pocket Siege and Host Panel.
- App UX harness with real native tabs/controller scripts and a simulated Swift bridge:104 captures across393×852 and320×568; no reported errors. This is browser verification, not physical-device UI acceptance.
- TV motion:normal-clock startup/launch/start/pause/resume/results/stop filmstrips captured, no page errors; logo handoff `ok`, pending false, curtain cleared. Launch/resume/stop filmstrips visually reviewed. Frame timing benchmark intentionally not run alongside heavy capture/build load.
- Return regression:two Pocket Siege launch/stop cycles, renderer stops at results and resumes, retired game frames removed; Host Pick reached without changing selected game;4K Bow Club focus visible;20 identical catalog updates cause0 DOM mutations, focus change4 mutations.
- Native settings regression393/320:full-height opaque backing, no outer mask/hole; original soft inner scroll masking preserved; Up sends Host Pick focus command.

## Integration finishing

The return harness had a fixed400ms wait shorter than the newly introduced scene transition. Replaced it with a bounded5s wait for the actual top scroll position. Both launch/stop cycles and final position now pass; no runtime navigation behavior weakened or redesigned.

Both project build numbers are125, marketing0.11.7. New resource checks ensure Claude's added files cannot silently be omitted or remain stale in a packaged product.

Gallery: `output/playwright/build125-review/index.html`. Detailed source hashes: `all/manifest.json`; logs and signing/install evidence: `.localparty-build/build125/`.

## Limits

Coverage is catalog waiting/playing and representative shared states, not every possible game outcome. Motion sensors, camera tracking and AirPlay smoothness still require physical play; browser passing results do not prove those. Native captures use a labelled bridge simulation. Prior design notes such as the Swarm front-row labels remain separate from release-blocking functional checks.

## Build result

- Xcode App Clip project Debug/iphoneos27.0: BUILD SUCCEEDED.
- Main app and embedded HeyPalsJoin:0.11.7(125), existing bundle identifiers preserved.
- Both product validators pass. All1749 deployable public/games/lib/server/catalog files match the frozen source hashes exactly. The2 integration test files are intentionally excluded by bundle-ios.py.
- Strict deep code signature verification passed using the system certificate store.
- `tests/host-panel-browser.cjs` passed, including `Active game cannot accidentally restart`;320/393 compaction occupies a stable flow slot (0.03125px variation), settles smoothly.
- Waiting TV/phone contact sheets for all36 games also visually reviewed; TV matchmaking remains free of premature sound/header chrome.

- Device install completed successfully over existing `com.localparty.launcher` on the connected iPhone17Pro. Installed-app readback confirms0.11.7(125). Automatic launch was denied because the iPhone is locked (CoreDevice10002 / FBSOpenApplicationErrorDomain7); bounded retry timed out. No app launch or physical gameplay claim. The installed version is verified independently.
