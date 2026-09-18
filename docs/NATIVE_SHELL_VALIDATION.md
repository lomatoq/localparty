# Validation of the unified native host shell

Base: ios @ f54ac52224c319ac6249d6bfad76d329242cb6de. Date: 2026-09-17.

## Executed in this environment

- `node --test tests/native-shell.test.cjs`: 23 passed, 0 failed. Includes native-only JS adapter, input validation, bounded vibration, shared stylesheet contracts, HTML IDs, no innerHTML insertion, source-level native bridge boundaries, version comparison/no-downgrade policy.
- Chromium DOM harness with a mocked native bridge and synthetic ServerState: 14 checks passed. Catalogue, host modal, explicit Wi-Fi command, HTTP warning, destructive-action confirmation, XSS-as-text, game settings, launch gating, confirmed launch, phase actions, statistics reset guard, search focus preservation, controller navigation, no JS exceptions.
- JavaScript syntax checks and `bash -n scripts/build-ios-local.sh`: passed.
- Info.plist parsed with Python plistlib.

The DOM harness evaluated the actual host.js against the actual HTML structure in an isolated page. Shared launcher CSS/fonts/artwork and the actual native custom scheme were NOT available to that harness. This is NOT final visual QA, a WebKit/iOS test, or a complete game-server integration test. Source-contract tests are not proof of runtime Swift authorization behavior.

## Not executed here; required on Mac before merge

Swift/iOS SDK compilation, Xcode signing and installation, actual custom scheme resource loading and WKScriptMessage frame origins, full repository test suite, all-game walkthrough, physical AirPlay and audio latency, CoreMotion sensor readings, physical haptics, denied-permission flow, foreground/background lifecycle, native memory/performance tests, final screenshots using the real shared CSS and fonts.

No IPA or device-certified build is supplied by this branch. `scripts/build-ios-local.sh` prepares an unsigned simulator build or a locally signed device build on the user's Mac. `CLAUDE_BUILD.md` specifies the remaining work.

## Compatibility and security boundaries

No changes to server.js, NetworkAccess, ExternalDisplay.swift, ServerModel.swift, game logic, physics or LAN authorization. Guest port remains HTTP. Native shell admin commands remain inside a shipped main-frame menu WKWebView and are not exposed as a new HTTP route. Game frames have a separately validated, limited native adapter. Existing CSS is reused by reference, not copied or modified.

The new app shell replaces the old native catalogue/room SwiftUI UI. The desktop /host page is not redesigned by this change.

## Upstream checks

Apple: stable Xcode 27 / iOS 27 SDK / Swift 6.4, macOS 26.6+. Node: desktop LTS 24.21.0, Current 26.9.0. Official nodejs-mobile latest: 18.20.4. WABT latest: 1.0.42, while native preparation remains pinned to 1.0.41 pending matched runtime regeneration. npm Three.js latest 0.186.0 matches this repository. Express latest 5.2.1 is a major migration from 4.22.2, not an automatic safe update. Other package latest queries must be completed by the included live registry audit on Mac; not all registry responses were accessible in this environment.

Sources: https://developer.apple.com/xcode/system-requirements ; https://nodejs.org/en/download ; https://api.github.com/repos/nodejs-mobile/nodejs-mobile/releases/latest ; https://api.github.com/repos/WebAssembly/wabt/releases/latest ; https://registry.npmjs.org/three/latest ; https://registry.npmjs.org/express/latest .
