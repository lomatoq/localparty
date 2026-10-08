# Review 141 — native startup, recent controller polish, TV mutation load

2026-10-06. Existing user/Claude changes preserved. No physical-device installation in this pass.

## Native startup
- `PartyStartupCurtain` in `ios/LocalParty/LocalPartyApp.swift`: two opaque clipped native views, diagonal seam, bundled logo. Core Animation transform/opacity only, no animated blur or WebKit-driven curtain.
- Wait for populated catalog, fonts and visible image decode (bounded). Finish short finite entrances behind cover; continuous decoration does not gate startup. Require 24 stable geometry frames, bounded at two seconds. Recovery deadline 12 seconds prevents permanently trapping a failed page.
- Reveal 700 ms using established .22/1/.36/1 curve. Native bottom dock begins after 333 ms, 650 ms deceleration. Reduced motion uses 180 ms fade. One-shot controller state prevents replay on normal resume/tab changes.
- Initial capture exposed waiting on long decorative animation; corrected before final capture.
- Xcode iPhone Simulator build succeeded. Real UIKit/WKWebView capture on iPhone 17 Simulator: `output/playwright/review141/startup/startup-and-resume.mp4`. Includes Settings/background return. Not physical iPhone/AirPlay validation.

## TV performance
- Measured repeat assignments of unchanged HUD attributes at every information update and field-gutter messages. Replaced with idempotent attribute/visibility setters. No timer cadence, visuals, gameplay or HUD content removed.
- Coalesce follow-focus/roster layout into one RAF; stop scheduled layout while hidden; avoid rewriting unchanged roster margin.
- WebKit 1080p TV + 393px phone, Kart two players, 12-second measurement: before 2107 mutations in TV shell; after 141, of which 12 outside live timer/metric nodes. p95 19 ms, max 35 ms, no >50 ms frames. Timings were already near 60 Hz in this desktop workload; reduction is DOM work, not a claim of 15x FPS or physical AirPlay improvement.
- `tests/performance141.cjs` records mutation targets and tests static shell separately from intentionally live readouts. Original legacy test's <100 total mutations fails because it also counts the race clock; both raw and filtered numbers retained.
- Pocket Siege two launch/result/return cycles pass after changes; zero retained game frames, renderer stops/resumes, Host Pick reachable, 4K focus works. 20 identical catalog snapshots: zero mutations.
- 20 TV information/motion unit tests pass.

## Recent-screen audit
- Fresh captures: browser/native controller routes at 320/393; native Host Pick; Fresh selected/running state; Rooms Chrome/WebKit 320/393/852 including lost-room state.
- Popup timing: 45 player cases + 27 native-host cases; normal opening, dismiss at65ms, reopening during close. Reports contain no page errors / opacity jumps. Native controller bridge+tabs loaded in fixtures; these are not physical device captures.
- Contact sheets visually inspected. Individual popup stills intentionally at350ms, labelled as transition frames. QR supporting text11px/.65; web count backing removed, native capsule retained; real underlying-page blur visible.
- Gallery `output/playwright/review141/index.html`; old galleries are not acceptance evidence for this pass. Gameplay catalogue-wide art and physical hardware remain outside this screen set.
