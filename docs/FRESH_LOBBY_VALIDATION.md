# Desktop Fresh lobby + tactile UI validation — 2026-09-18

Base `a75af9352faa816f534df5d9b38ca46b5a403c8b`.
UI marker `desktop-fresh-20260918.1`; native recovery remains unchanged.

## Executed

- 48 Node tests: original 31 native/hotfix tests plus 17 new catalog/asset/filter/
  route/security/press contracts. PASS.
- 11 existing product-validator unit tests on synthetic .app bundles: PASS.
- 41 legacy native DOM checks, updated to load the shared catalog and find cards
  inside groups. PASS with the documented reduced CSS fixture.
- 76 dedicated Fresh/TV/press DOM checks. PASS with reduced legacy CSS, exact new
  CSS/JS/HTML, synthetic records for the real 30 game IDs, mocked native messages,
  WebSocket protocol and iframe navigation/postMessage spies.
- Phone geometries 320/360/375/390/430/600/768/1024 px: nonoverlapping flow, no
  horizontal page overflow, scrollable Fresh. Stable card identity/rail position
  after votes, filtering/search, modal selection, haptic REQUESTS, pressure/release,
  cancel/swipe/disabled/joystick/keyboard/background/reduced motion.
- TV geometries 1280x720, 1920x1080, 3840x2160, 1024x768: logical 720px stage and
  complete first Fresh row. All 30 cards, display-only semantics, QR/roster DOM,
  selection, existing iframe URL, same-instance no reload, sports HUD, pause/return.
- JS syntax checks pass. Screenshots were inspected as GEOMETRY fixtures only:
  real artwork/fonts are absent, not generated substitutes for the approved assets.

## Not verified here

Full repository clone, npm installation/full original suite, complete original CSS
cascade/font/asset visual fidelity, custom partyapp scheme/CSP/WKWebView integration,
real HTTP/WSS/cookies/game servers, complete Xcode compilation, signed installation,
physical AirPlay/audio/latency/sensors/haptics. Mock haptic requests are not proof of
physical feedback. In-memory iframe spies are not end-to-end transport validation.

The environment cannot resolve GitHub from the shell and blocks browser navigation
with ERR_BLOCKED_BY_ADMINISTRATOR. No browser/network/security policy was disabled.
Source was read through the connected GitHub tool and prior supplied source artifacts.
Tests have an explicit in-memory mode rather than pretending a hosted run succeeded.
Claude must perform the full-checkout and real-device checks in CLAUDE_FRESH_LOBBY.md.

## Preservation

This update changes web presentation and tests/docs only. Swift, external scene
registration, ServerModel, networking/auth, physics, dependencies, signing and user
data are not changed. Existing tv-layout.js is unchanged. Original ios/master remain
untouched; the work goes into the existing draft work branch/PR.

The shared render helper is exported from the already-served tv.js to avoid adding
new server routes. Native HTML loads it before host.js, and its transport entrypoint
is guarded by #tvStage. Existing game pages already load motion.js/motion.css; no
new gameplay event senders are added. Actual native haptics remain opt-out in Swift.
