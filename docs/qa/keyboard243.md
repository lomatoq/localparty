# Keyboard243 — Rooms disclosure and shared field visibility

2026-10-07. Source is ready for the parent’s next phone build; this lane did not build or install a native app.

The shared coordinator now keeps the focused field and its declared confirmation action inside the actual available viewport. It supports both a keyboard overlaying an unchanged layout viewport and a WKWebView whose layout viewport also shrinks. Room rename, six code cells, profile name and catalog search use the same mechanism. Existing popup material (.93), background blur 8px/dimming, typography, green CTA and brighter Back are unchanged.

| Before | After | Why |
|---|---|---|
| Rooms inferred keyboard only from `visualViewport.height < innerHeight -100`; this misses a layout viewport that shrinks with the keyboard. | `input-viewport.js` compares the available viewport with the pre-focus height and follows actual resize/offset events. | Both keyboard behaviors need the same usable bounds without browser or device-name sniffing. |
| Room name got focus while the disclosure was still unfolding; the field or Save could be hidden by the scroll mask. | Focus stays synchronous in the trusted tap. Visibility is reconciled on the next frame and after the disclosure settles, scrolling the field/action group within its real clipping ancestors. | Preserve iOS keyboard activation while keeping the field and checkmark visible together. |
| Code panel could consume its height with “Your online room,” leaving Connect below the keyboard. | During editing, that secondary block and footer utilities free space; the six cells, Connect and Back stay visible. | Confirmation should not require manual scrolling. All secondary controls return after keyboard dismissal. |
| Profile Save/Back could remain below an overlay keyboard. | The profile fits the reduced viewport; fields retain internal scrolling and the submit row remains available. | The name field and confirmation must be reachable at the same time. |
| A Rooms toggle press during the 190 ms closing transition was ignored because the dialog still had `open`. | The toggle also accepts `lp-dialog-closing`, using the existing shared reversal path. | A quick second press must reverse the close immediately. |
| Focus could remain in a collapsing editor or disappearing sheet. | Collapsing/tab switching releases hidden focus. A lightweight observer watches only focused-field ancestors for closing/hidden state. | Dismiss the keyboard with its UI, without observing or repeatedly scanning the live catalog. |

Production files: `public/input-viewport.js`, `public/input-viewport.css`, `public/index.html`, `public/native-shell/index.html`, `public/native-shell/nearby-rooms.js`; two static asset names added to the existing `server.js` allowlist. No shared app-ux, motion, Swift, games or TV source changes were made by this lane. Source hashes are in `output/playwright/keyboard243/visual-review.json`.

## Validation and fresh visual evidence

Gallery: `output/playwright/keyboard243/index.html`, served at http://127.0.0.1:17810/keyboard243/index.html.

- Native controller:32 final states, WebKit + installed Chrome,320 ×740 and393 ×852, both overlay and resizing keyboard models. Actual `/play` application with **controller-bridge.js and tabs.js**. Baseline had 17 violations of the visible viewport boundary; final test has 0 and additionally checks ancestor clipping.
- Native host:24 final states for search and both Rooms workflows, same engines/widths/modes. Actual native-host HTML and tabs injection. Controller bridge is deliberately absent here, matching production: injecting it would incorrectly add `native-controller` to the host page.
- All 56 final browser images were visually inspected through their eight contact sheets. All 32 baseline controller images were also inspected. Fields, confirmation buttons and Back fit; the frosted material and green actions remain consistent.
- Behavioral regression: periodic room updates preserve the draft; rename request/ack works; rapid expand/collapse settles; all six digits advance, deleting an empty cell goes back; background blur clears by 260 ms; reopening 55 ms into close reverses immediately; full-height layout is restored after the keyboard model is removed. No JS errors.
- Actual Simulator 145 WKWebView: current controller tab/Rooms source confirmed; fresh baseline + four source-injection captures inspected. Room editor, six-digit focus advancement, profile and search operate on the real route. Profile material is alpha .93; affected background branches report `blur(8px)`. After profile close, search has no residual blur. After captures use source injected through the existing opt-in DEBUG audit channel, not a newly installed executable.
- `node --test tests/nearby-rooms.test.cjs` passes 6.1 s when run outside filesystem/network sandbox restrictions. The first sandbox run failed awaiting Bonjour discovery; the unrestricted rerun verifies discovery, naming, departure and unsafe-URL rejection.
- Syntax checks for changed JS and both browser harnesses pass.

Reproduce with bundled Node dependencies:

```sh
NODE_PATH=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/browser/keyboard243.cjs
NODE_PATH=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/browser/keyboard243-host.cjs
node --test tests/nearby-rooms.test.cjs
```

`QA_BEFORE=1` records a pre-change browser baseline and does not fail the process for the expected existing violations. It must be run before applying source changes; the delivered baseline was captured before this implementation.

## Limits — do not treat these as device acceptance

A genuine Simulator software keyboard was **not** shown. The Simulator app GUI bundle is absent in this Xcode installation; available simctl commands do not provide trusted tap/keyboard entry. Calling focus through the actual WKWebView audit focuses the field but leaves real `visualViewport.height` 874px. This is a tooling limitation, not evidence that keyboard avoidance works on hardware. Browser keyboard modes model only the viewport geometry and do not show or validate the iOS keyboard itself.

Physical iPhone typing, repeated disclosure taps with AirPlay active, GPU frame pacing and TV interaction remain the parent’s separate device-validation lane. This report does not claim to resolve device/AirPlay lag, certify every other popup, or provide a deployed online Rooms service.
