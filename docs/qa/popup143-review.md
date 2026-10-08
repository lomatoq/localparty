# Popup 143 — 2026-10-06

Scope: shared phone shell popup actions and layout. Preserve existing game controls.

- Bottom circular dismissal: rules, standings, roster/audio, invitation, catalog, native host panel/game detail, nearby rooms, update dialog. Small destructive confirmations remain centred with explicit cancel/action.
- Shared 48px footer buttons, compact two-line leading, adaptive 12–15px long action labels. Dynamic dialogs and changed labels now receive fitting too.
- Profile name capsule, centred language value, mobile heading scale; native dock clearance retained.
- Internal keyboard focus, no pink frame. Rounded disclosure focus; no browser outline around the entire profile sheet.
- Fresh visual inspection: rules, empty rankings, roster/audio, profile, QR help, host panel, game detail, reset confirmation, nearby rooms, invite, lobby confirmation. Browser captures only, not physical-device acceptance.
- 45 player transition cases, 27 native-host transition cases, 9 Russian cases, 6 additional invitation/confirmation cases passed without page errors or detected discontinuities at close/reopen. Separate focused confirmation captures overwrite the report for that subset; full run console summaries recorded under /private/tmp/popup143-*-final.log.
- Nearby rooms checked in Chrome/WebKit at 320x568, 393x852, 852x393 including empty state and join dispatch.
- 10 audio/motion unit tests passed.

Gallery: output/playwright/popup143/index.html.

Limits: no new hardware install/AirPlay measurement; technical desktop updater and populated catalog were code-reviewed but not visually re-captured in this pass. QR fixture has no active TV-generated QR. This is not a claim of every game-specific modal audited.
