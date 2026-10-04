# Controller tab recovery — build 90

The native bottom Controller tab previously had three indefinite or discarded paths: a tap before server readiness was dropped; a loading WKWebView deferred navigation until `didFinish`; destination preparation waited for fonts and two animation frames without a native deadline. Reduce Motion also returned before making the destination WKWebView visible.

The bounded Swift fix retains an early Controller request, allows selection during document loading, makes the incoming surface visible before readiness in both motion modes, and commits preparation exactly once using a 650 ms native deadline. The normal readiness callback still commits earlier when WebKit is ready. The existing adjoining-page animation and persistent controller document remain.

Files: `ios/LocalParty/LocalPartyApp.swift`, `tests/native-tabs-rapid-audit.cjs`. No ServerModel, CSS, font MIME, native font diagnostics, or gameplay input changes.

Validation on 28 September 2026:

- Simulator build succeeds, including the Debug-only audit driver (`SWIFT_ACTIVE_COMPILATION_CONDITIONS=DEBUG`). The project Debug configuration does not define that symbol automatically.
- Existing native transition source checks: 3/3 pass.
- Actual iPhone 18 Pro simulator: 15 native selections in three rapid bursts, 12 sampled animation states. Both WKWebViews retain alpha 1; each settled result has pending=false, one visible surface, zero translations, and no outgoing snapshot.
- A deliberately suspended controller `requestAnimationFrame` still opens Controller in 1186 ms including the 650 ms readiness deadline, animation and audit polling. Subsequent Host selection succeeds.
- The simulator driver calls the same `selectTab` method as UIKit bottom buttons. It is compiled only for opt-in Debug simulator builds. This does not claim a physical-device tap test; that remains a post-install build 90 check.

Build log: `.localparty-build/native90-simulator-build.log`.
