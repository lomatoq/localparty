# Current graphics revision — 12 September 2026

The older blanket visual sign-off is superseded by the independent review in `../gameplay-art/independent-visual-review-2026-09-12.md`. Passing a launch test or calling an atlas does not establish visual quality.

## Implemented corrections

- Crane: one full-container city backdrop, generated structural cab/footing/counterweight/foundation, flush facade sections, outline placement guide. Timestamped rendering interpolation; faster trolley response, gravity and turn recovery.
- Party games: buffered position/angle interpolation, bevelled sector wheel, robot launchers, cached arena materials and actual-event feedback.
- Kart: cached stadium/road/runoff/curbs/trees/lights and bounded skids; game box fits world aspect without internal letterboxing.
- Local Tanks: projectile velocity/lifetime now actually reaches renderer, authoritative impact events, terrain and wall material.
- Local Tanks follow-up: seamless perimeter ring, cached high-resolution sci-fi wall panels with lime grid lighting, bounded fading tread marks. Actual movement generated 48 marks in the browser check; game lifecycle passed and screenshot inspected.
- Tank Arsenal: projectile/rocket trails and hit sparks, pickups/floor zones, compact sidebar and correctly fitted arena.
- Western Duel: layered town/mesa scenery and full-stage background coverage.
- Six new games: distinct opaque game surfaces, HD trails, corrected Punch effect location, readable runner labels, appropriately muted eliminated Flappy control. Tap instructions describe the actual runner count.
- Naval: bounded effect at the real public shot cell; target uses player ID, including duplicate-name cases. Starting a new match clears stale last shot.
- Shared HUD: generic reveal no longer mislabeled as roles. Hidden Monster drawing notice no longer gains unrelated decoration.
- Shared canvas backing size now invalidates when logical dimensions change, even without a DOM resize; regression test covers square-to-wide scenes.
- Flappy wing corrected by horizontal mirroring, with a shoulder pivot inheriting body pitch; three real animation poses inspected.
- Quiz topics, Crocodile, Drawguess and Millionaire now have bounded actual-event reveal/success/final feedback; dedicated real-event browser checks passed.
- Kart phone: relative touch steering with independent gas pointer, capture outside the pad, smooth center return, handedness swap, and a full-height steering touch area.
- Kart barriers: road edge constrains the car and removes outward velocity while preserving tangential motion; no offroad teleport. Cached neon borders and actual-impact sparks. Entire-track containment test, real network lap (31.34 s), and controller-driven collision passed; screenshot inspected.
- Crane/Jenga: bounded placement/ground-contact dust and impact feedback driven by actual events; pause freezes the effects.

## Recorded verification

- Independent fresh review: 26 host screenshots + 52 mobile waiting/active screenshots, all opened individually. Launch/readiness/pause/rules/resume/exit passed all 26; focused recaptures followed fixes.
- Main test suite: 68 tests passed; additional Party/Tanks/Spy/Millionaire checks passed.
- Crane: two physical placements, three misses, host/phone results; pendulum timestep/damping/release tests passed. Sampled CPU draw median 0.3 ms, p95 0.5 ms on this host. This does not measure GPU presentation or phone performance.
- Naval: browser observer confirmed effect insertion from a real shot; 16 public fields fit without scrolling.
- Arcade: event deduplication, expiry, pause clock and bounded burst tests passed. Populated Hungry/Snake run with 16 players completed without browser errors.
- All six new games: phone final screens captured; replay/pause/rules/exit passed. Kart additionally passed simultaneous two-touch input and authoritative movement checks.

The independent matrix identifies observed stages and remaining evidence limits. Desktop headless frame callback cadence is not a physical iPhone FPS measurement. Physical Safari motion permission/sensor delivery is not validated by browser emulation.

## Latest focused checks
- Featured catalog selection excludes Fresh and table sections, so a popular game moved outside the main grid cannot remove its large first card. Isolated browser regression passed Fresh/table popularity at 1920, 390 and 360 px, with larger featured CTA and no mobile overflow.
- Articulated robot sprint: 24 actual phone taps move the human runner above the sprint threshold and advance its gait. Carry Ball right/left input flips the complete rig; both directions captured and inspected. Focused browser test passed twice.
- Ranking/profile spacing and long-content scrolling checked at desktop/mobile sizes; six arcade reports now use per-mode statistics. Arsenal lingering trails and all 26 HD previews verified separately.

- Latest complete suite rerun: 70/70 passed plus Party/Tanks/Shrink/Spy/Millionaire supplemental checks. Push rim danger and actual elimination flash captured before/moment/fade; root independently inspected all three frames.
