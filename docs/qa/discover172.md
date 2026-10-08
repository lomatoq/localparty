# Discover, Host Pick and Rooms — 172

## Shared discovery

`game-spotlight.js` and `game-spotlight.css` are shared by native host and web/native controllers. They replace the old headline; the decorative characters remain, softly blurred. A six-game deck prioritizes Bowling, Curling and Pocket Siege, mixes in locally popular and unplayed games, and respects the current group size. Indicators address stable deck positions; left/right swipes and Next change the slide. The progress animation lasts 10 seconds and pauses offscreen, in background documents, under modal/popover, while held, and for keyboard focus. Reduced motion stops automatic cycling and decorative motion.

Play targets the displayed game. Authenticated web players use the lobby-only `spotlight-launch` command; native host retains the existing launch/bot/display recovery path. Server guards prevent unregistered starts, insufficient participants, absent display, simultaneous launches and interrupting an active match. Existing voting remains available.

Time comes from saved completed-match durations, aggregated persistently beyond event retention. Older retained history is migrated; unavailable duration is shown as “PLAY IT AGAIN”, never fabricated hours. Short positive totals use minutes; genuinely unplayed titles show “FIRST PLAY”. Native Codable state includes the same aggregate fields.

First successful controller entry scrolls to the top; state refresh/reconnect/profile saves do not reset user scroll.

## Artwork and CTA

Generated source: `public/assets/ui/spotlight-play172.png`, built-in imagegen, 2026-10-06. Prompt: single rounded right-pointing lime crystal play gem, white highlights, emerald bevel, subtle violet reflection, transparent background, readable at 36px. Runtime WebP is 144×144 RGBA, 5,550 bytes. Existing pack supplies Next/Pause. Existing green edge energy is reused for Play, with bounded opacity/transform wave, glare and tiny bounce; pause policy applies to all decorative motion. No WebGL loop or full-page filter added.

Host Pick art is not clipped to the circle. The static radial disc and inset pale tinted rim remain behind complete artwork. Player count is always pale lime; Start icon/text gap is 4px, centred together.

## Rooms

See `rooms172.md`: shared input styling, reversible inline disclosure, persisted local room name + Bonjour advertisement, native acknowledgement before success. Native and browser mock evidence remain distinct.

## Verification

- Six Node tests: stats/reset/deduplication, concurrent guest discovery launch and guard paths, existing ballot flow.
- Chromium/WebKit 320/393 discovery: fixed-index controls, swipes, modal pause, automatic cycle amid repeated snapshots, reduced motion, active-game hiding; native and web captures.
- Host performance regression: identical host state does not replace icon/counter; only 2 visible main CTAs animate; hidden/covered actions pause (45 eligible).
- Host Pick: six integrated states across 320/393 and Push/Curling/Bowling.
- Rooms: Chromium/WebKit 320/393; save acknowledgement, draft preservation, opening reversal; Swift parse and native Bonjour/name validation.
- Release 137 compiled with final artwork, controller first-join scroll fix and Host Pick captions; both product verifiers passed. No installation or physical AirPlay acceptance claimed.

Gallery: `output/playwright/discover172/index.html`.
