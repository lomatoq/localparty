# Shared popup material and Rooms review — 2026-10-07

The latest user decision is 93% opacity / 7% transparency for all outer popup surfaces. Inner grouping cards retain their separate quieter tint. Rooms uses the existing `share` pack icon, not a cloud, inside a 44px circle with a 14px glyph.

## Changes

- Shared actual-background blur and dimming for dialogs, profile editing, bot popovers and pause overlays. Foreground/ancestor exclusions keep the active popup sharp; nested popups blur the preceding panel. Blur and shade close on the same clock.
- Shared 93% dark-violet material also overrides legacy confirm, Host Panel, game-detail and update surfaces.
- Brighter Back borders, centered standalone Back actions, preserved paired-action grouping.
- Rooms Nearby and By Code share the material. Own-room expansion aligns with player count and the Connected right edge. Code cells center digits; auto-advance, backspace and paste retain their handlers. The visible-area keyboard layout keeps the code form and Back reachable.
- All game settings use italic labels/values, dark-violet capsules and full-width rows for long options. Rules summaries use the same capsule treatment.
- Initial profile form spans its full panel; compact in-game catalogue rows no longer clip logos or actions.

## Evidence

Gallery: `output/playwright/popups241/index.html`, 178 current images with cache-busted references.

- Host: 56 screen/popup states in WebKit and Chrome, including nested bots and confirmations. `output/playwright/popups240/host/report.json`.
- All 21 games exposing host settings: 42 WebKit captures, default and longest option values. `output/playwright/popups240/host/settingsallgame/report.json`.
- Browser and embedded controllers: 64 captures across WebKit and Chrome. Includes profile, rules, populated players/rankings, active catalogue, pause, Join QR, confirmations and updates. `output/playwright/popups240/controller/report.json`.
- Rooms: WebKit/Chrome at 320px and 393px, Nearby/By Code, rename acknowledgement, provider contract, code editing and reduced visible viewport. `tests/browser/rooms235.cjs` and `tests/browser/rooms235-shell.cjs`; images in `rooms238` and `rooms239`.

These are real frontend routes driven through browser fixtures. Native bridge/tab state and roster/history are fixture data. They do not validate physical iPhone keyboard, UIKit navigation, haptics, AirPlay rendering or device performance. Internet room connection still needs a deployed service; no real public room code is fabricated.
