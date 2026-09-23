# Build 26 — effect timelines, camera lifecycle, match information

## Gameplay

- PVO has 10 interceptor launches per player per match; no refill on reconnect or turn changes.
- Explosion animation uses the original executable's 20ms ticks. Earth Mover terrain removal follows the expanding draw front; visual erasure trails independently. Both authored stages persist in host snapshots and survive pause/reconnect.
- Added missing GLUE/RUBBER material coating deposits, preserved authored zero damage radius, and rendered original TRACER text for its authored display time.
- Full effect-path audit: 2812 non-trigger nodes, 321 weapons / 963 actual shots. WebKit event replay and all 410 animated projectile profiles / 1869 frames passed. See `pocket-effects-deep-audit.md` for explicit fidelity limits, not an assertion of identical original physics.

## Bow camera

- Rear capture is acquired once, not reopened while a previous rear stream is active.
- Preview is visible before video playback; decoded frames must advance within a bounded timeout. Failure returns to an actionable setup/error state rather than leaving an endless black preview.
- Startup ownership prevents obsolete camera requests from unlocking or stopping newer requests.
- Complete browser-ESM parsing is tested, alongside camera lifecycle and OpenCV tracking tests. These tests do not establish that the user's physical-device camera problem is fully resolved; it requires checking the installed build on that phone.

## Approved interface direction

- Superdesign Now Playing draft: `2905c9b0-3c60-4413-bf03-8413d075e539`. Sculpted violet deck, primary Controller, compact scrolled capsule. Matching Host Pick and active game merge; a different next selection remains separate.
- Superdesign TV information draft: `7ea08055-edee-4813-a384-76fb81a80f51`. TURN / LIVE / PROMPT / MISSION information layouts retain the original V-shaped curved center notch, with readable information on its wings. No separate duplicate bar for games owning their HUD.
- Public-state adapters cover the 36-game catalog; no secret words, answers, roles, or hole cards are forwarded. Timers retain their clock domain, and the host bridge sends normalized information rather than full game snapshots.

## Verification status

Core, lifecycle and focused browser tests are recorded during the build task. Final iOS product verification compares actual bundled camera, timeline, renderer, native shell and TV files against source bytes. Installation and physical-device results are reported separately, not inferred from compilation.

Performance caveat: persistent waves add host snapshot data. A 321-shot sweep peaked at 377 simultaneous waves (Spinner); the synthetic 1024-wave cap costs about 345KB per host snapshot. Desktop WebKit raster timings are not an iPhone/AirPlay performance guarantee.

## Final product

Release 0.11.1 (26), iphoneos27.0 compiled successfully. Product verification passed for all 36 catalog entries and 34 byte-compared critical files. Installed on the connected iPhone 17 Pro. No physical camera/receiver playtest is claimed.

Final UI regressions include all 36 metadata fallbacks and four HUD families at 1280×720 / 1920×1080, live-score secondary timer, secret signal suppression, English phase/objective and rounded wind. Real Pocket/Bow/Curling/quiz host frames were inspected for duplicate headers. Both quiz engines show all four answers with long questions at both resolutions after removing obsolete inner header spacing. Native deck threshold tests preserve exact scroll position across repeated 100/125/130/115px crossings at 320/390px; matching Host Pick merges without duplicate Controller actions.
