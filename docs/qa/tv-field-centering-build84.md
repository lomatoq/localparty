# TV field centering — build84

Shared bridge token `--party-field-inset-top` measures the bottom of the actual center notch relative to the iframe. Party5 canvases and AirHockey use the remaining viewport as their centered region. Knives' previous +28worldpx correction was removed because the shared region now accounts for the notch. Hockey supplementary LastTouch captions are outside the rink geometry;68px equal gaps retain space for them. The upper-left phase label uses18–20px, overriding the old16px shared role.

Files: public/bridge.js; public/tv-information.css; games/party/public/host.css; games/party/public/host.js; games/tabletop/public/arena.css. No game physics/rules changes.

Real checks and visual inspection:
- field-center-final720/captures: Push, Knives, AirHockey PASS. Western was interrupted by a separate phone waiting-card horizontal-overflow assertion; earlier field-center-720 Western720 screenshot was visually checked after geometry change (before phase-label enlargement).
- field-center-final1080/captures: all4(Push,Knives,Western,AirHockey) scenarios PASS. Canvas usable-region gaps0/0; Hockey68.0016/68.0016px, difference<0.0001px. All4screens visually inspected, no character/caption cropping.
- Raw report asset hashes differ only in public/polish.css, changed by concurrent phone/profile work. This is not a stable-all-assets claim; no report rewritten to manufacture one.

Scope limit: new token is shared, but layout application is Party5 and Hockey. Arcade score-rail compositions, sidebars, native result panels and own-HUD3Dgames were not blanket-shifted or claimed verified. Wider single-canvas families need separate measured integration.
