# Invitation / podium polish — 2026-09-18

Base: `326a5c47077bcff074d49972420b7466674bada3`.
Marker in both card roots: `desktop-card-20260918.2`.

Runtime changes are confined to public/index.html, public/tv.html,
public/motion.css and public/tv-show.css. Server, native code, game logic, app.js,
profile persistence, dependency pins and existing TV presentation state are unchanged.

Local checks completed before publication:
- 72 focused Node tests (68 previous + 4 invitation-specific): PASS.
- 5 existing synthetic show-resource verifier tests: PASS.
- 85 existing TV Show browser checks: PASS in the explicit --in-memory mode
  (actual CSS, mocked native/transport, no real fonts/art).
- In-memory visual inspection with actual checkout CSS and a test QR PNG:
  matching PC/TV card surface, title, address and QR computed style properties;
  658px three-player group; 1080px main tier for 16 players. Local font/art files
  were absent, so these previews use font fallback and are not asset validation.

The new browser suite is wired into .github/workflows/ios-show-validation.yml.
It checks source-card parity, QR aspect/centering/clipping at 720p/1080p/4K/4:3,
repeated opening, compact podium spacing, 1/2/3/7/16 player layouts, guest-only
return hint and actual app.js localStorage/autojoin after reloading the same
origin. WebSocket/API/native are mocked; screenshots load actual repository fonts
and artwork when available. Final remote CI results are recorded after inspection.

Six-digit code is not implemented. The user made it optional. No online rendezvous
service, LAN scanner, fake code or new credential-bearing URL was added. The new
hint explains the existing saved-profile path; it is NOT a new room-discovery feature.

References for the browser behavior discussed in the handoff:
- Apple: https://support.apple.com/guide/iphone/iphea86e5236/ios
- Storage origin boundary: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

Physical iOS/AirPlay, actual QR scans and Safari background/rejoin still need the
local checks in CLAUDE_INVITE_POLISH.md. Existing TV Show limitations and dev-only
sharp advisory remain as documented; this update does not fix that advisory.
