# Pocket Strike — alley extras and pinsetter beat (2026-10-02)

Owner request: the bowling TV field should feel more premium and alive, with more inside the
alley, richer effects and better moments. Top priority: the pin-deck end must work like a real
alley (pit, sweep bar, pinsetter).

## Files
- NEW `games/sports_siege/public/bowling-extras.js`: all new presentation code (`BowlingExtras`, `createBowlingExtras(scene)`).
- `games/sports_siege/public/scene-bowling.js`: 5 hook lines only (import, create in a try/catch, `extras.update(A,stage,age,t,dt)` at the end of `update`, `extras.event(e,s)` at the top of `event`, `extras.dispose()` in `dispose`).
- `games/sports_siege/server.js`: one static-map entry, `'/bowling-extras.js'`.
- NEW `scripts/capture-bowling-extras.cjs`: frame-sequence capture (derived from `capture-bowling-upgrade.cjs`), `QA_AB=1` runs an extras on/off GPU check.
- Not touched: rules, physics, match, protocol, host.js, style.css, controls, spectator code.

## Pit, sweep and pinsetter (presentation only, timed from the authoritative stage clock)
- **Pit:** lit violet lip at the lane end, a black well, and a dim lit curtain behind it, so the end of the lane reads as an opening.
- **Deadwood:** the last reveal pose of every knocked pin is kept. When the next turn starts, those pins follow the scene's real sweep bar back and are raked over the deck edge into the pit, where they drop out of sight. They no longer vanish while the bar is still raised.
- **Second ball:** at the end of the reveal the pinsetter table comes down out of the masking unit onto the standing pins (the same `standing()` test as bowling.js) and lifts them while the bar guards the deck. After the sweep it sets them back down and rises again.
- **New frame:** the table sets a fresh rack of 10 and rises back. Which case applies is mirrored from `frameComplete`/`freshRack` on the roll event.
- **Reset camera:** from reveal age 1.1 s to aim age about 2.3 s, a low camera under the masking unit, blended in and out, shows the bar, the table, the pit and the new rack. The scene's slower set-down for the visible pins runs over 0.5–1.3 s instead of 0.42–1.02 s.
- The sweep bar now draws after the lane reflections. Before, ball and pin reflections showed through it.

## Alley life and effects
- Neon strips on both cappings. When idle they show a slow wave. While the ball rolls, a comet in the ball's colour follows it, with pulses running ahead to the pins. A gutter ball turns them blue and they drain. A strike runs a rainbow chase, and a spare runs a lime/teal one.
- A soft ball trail on the lane in the bowler's colour, plus small sparkles shed while rolling.
- Light cones from the masking unit onto the deck. They flare on impact and change colour on a strike or spare, and are hidden in the close reveal and reset views.
- A marquee bulb row along the bottom edge of lane 8's mask, with a chase that runs faster while rolling and in rainbow on a strike.
- Lane display: once the camera is back on the aim view, the lane-8 mask briefly becomes a score screen (STRIKE!/SPARE!/GUTTER/MISS/N PINS, bowler name, running total, EN/RU). It fades out at once when the next ball is released.
- Impact: a spark-burst sprite, a shockwave ring, coloured sparkles and a soft deck flare.
- Strike and spare: staggered firework bursts (gold, violet, lime) with sparkles above the deck, plus the light show.
- Ambient: disco reflections drift over the neighbouring lanes (never lane 8), with two slow haze beams over the side lanes.
- Ball return: a glowing ring on the hood mouth pulses, with a sparkle pop when the ball comes out.
- **Reduced motion:** no reset-camera move, no flying particles or fireworks, no travelling waves. Static glows and the pinsetter and sweep animation remain.
- All pools are preallocated and bounded (largest is 56 sparkles). Everything is removed and disposed in `dispose()`.

## Considered and not used
- `assets/lane-wood.png` as lane albedo: the generated image has baked light glare (top-left and right edge) and about 22 wide boards instead of 39. It would look like a fixed hotspot on the lane, so the procedural maple stays.
- A jumbotron above the pins: on the fitted aim camera there is no free space above the masking unit (the HUD header sits there), so the lane-8 mask doubles as the score screen.
- Fans bouncing: the spectators belong to group10/group02.

## Verification
Playwright WebKit, actual launcher, two phone controllers, real swipes, no state injection.
Captures are in `.localparty-build/bowling-extras/`:
- `after/a-*`, `b-*`, `c-*`, `d-*` (`-tv-720`): four throws, each with aim, roll, impact, reveal, pit, sweep down, sweeping deadwood into the pit, pinsetter setting, rising, and aim again. The four cases are a strike → fresh rack, 4 pins → second-ball lift, gutter → fresh rack, and 7 pins → lift.
- `after/a-*-tv-1080`: the same sequence at 1920×1080.
- `after/{aim,roll,impact,strike,settle,reset,return,gutter,roll-hook,spare,result}-tv-{720,1080}.png`: the standard capture-bowling-upgrade run (strikes and a spare included).
- `reduced/*-reduced.png`: reduced motion.
- `before/`: the state before this work.

Every image used for a decision was viewed. Fixes made after the first viewing round:
- Lane display showing over the reveal view and through the mask: it now appears only on the aim view and is opaque.
- Deck glows and fireworks washing out the reveal: lowered.
- Deadwood stopping at the deck edge: it is now raked into the pit.
- The display lingering into the next roll: it fades on release.
- Lifted-pin reflections and the bar showing reflections: hidden or drawn over.
- Pinsetter rods poking above the mask: shortened.

These were confirmed on re-capture.

Tests: `node --test tests/bowling-physics-regression.test.js` gave 11/11 pass.

Performance (headless WebKit, machine shared with other agents): the extras add 13 draw calls (59 → 72) and CPU p50 is 1 ms / p95 2 ms per frame. In the A/B with the extras hidden or shown, fps stayed within noise (44–50 both ways). Headless fps is not a TV measurement.

## Not verified
- A real TV or GPU frame rate, and 60 fps on the target device.
- The tenth-frame bonus-ball rack paths (strike or spare in the last frame), which were not reached in the captured runs.
- The Russian-language lane display: the text is drawn, but it was not captured with the RU UI.
- Reconnect in the middle of the sweep.
- The pin-deck reset camera holds for about 2 s at the start of each aim. Players see the aim view again from about 2.3 s, so the ball-return arc is now off-screen during that window. That is the trade-off for a readable machine beat.
