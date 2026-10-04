# Game polish · arcade lane · 2026-10-02

Scope: `games/arcade/` only (taprace, punchmeter, flappy, hungry, snakelines, carryball). This pass changes rendering and feedback only: rules, scoring, network protocol and simulation are untouched. No images were generated and no image requests were filed, because procedural canvas art covered every case.

## Files

| File | Change |
| --- | --- |
| `games/arcade/public/arcade-juice.js` (new) | Presentation layer `window.ArcadeJuice`. On the TV: event detection from consecutive snapshots, field shake driven by decaying trauma, pops, rings, confetti, round and goal banners, cached arena textures, ambient life and the flappy countdown. On the phone: press physics, ripple, haptic tiers, live stats, team chip and the tap-race track. |
| `games/arcade/public/app.js` | Small hooks: `observe/shake/ambient/front/environment/countdown/init`, a neon trail pass in `paintTrails`, food bob and blob squash in hungry, flappy names through `drawClusterLabels` (dead birds excluded), the old snake round text kept only as a fallback, phone `press/release/phone/cue`. `feel()` now uses `globalThis.LocalPartyFeel`; this makes `tests/arcade-feedback.cjs` pass again (it failed with `window is not defined`). |
| `games/arcade/public/style.css` | Appended block: press and ripple, `#arcadeStats` grid, team chip, tap track, taller TAP button for taprace, reduced-motion variants, and help hidden on joystick modes when the screen is 620 px tall or less. |
| `games/arcade/public/host.html`, `index.html` | Load `arcade-juice.js` before `app.js`. Every hook is optional-chained, so app.js still works without it. |

## Per game

- **Tap Race**: each lane fills with a gradient in the player's colour from the start up to the runner. Dust puffs in the player's colour appear while the runner is fast. A gold crown bobs above the leader and is corrected for the stretched aspect. The finish line glows with a pulse once the leader passes 70%. On the phone: Place / Points / Speed stats (taps per second, measured locally), a track with every player's dot (your own dot is larger and has a ring), and a taller TAP button with press physics.
- **Punch Meter**: a spotlight cone, a light pool on the floor and drifting dust motes. A server-confirmed hit is tiered by score (below 420, below 750, 750 and above): shake 0.22 / 0.48 / 0.85, one to three shockwave rings, floor dust, and a short warm flash on the top tier only. On the phone the button stays pressed while held, and the release haptic scales with power.
- **Flappy**: a dusk sky (house plum, violet and pink with a gold sun), stars and two parallax hill layers. The ground stripes scroll in simulation time at the pipes' speed (190 px/s). Bird shadows sit on the ground. A puff appears on each server-confirmed flap, and a feather burst plus shake on death. The countdown is a Kardia numeral with a lime progress ring. Name labels no longer stack on top of each other at spawn. On the phone: Place / Points / Status (Flying/Out).
- **Hungry Arena**: a tiled floor with a spotlight and vignette, drifting motes, soft blob shadows and food bob. Eating squashes the blob. Eating a player shows "CHOMP!" (clamped inside the field) with confetti and shake. On the phone: Place / Points / Time.
- **Snake Lines**: trails are now neon tubes (glow, 6 px core, bright filament). The lethal width and the data are unchanged. Heads get a pulsing halo, a light sweep crosses the grid, and a crash gives a burst plus shake. The round result is a banner ("ROUND n · X wins" or "Draw") with confetti. It replaces the plain Russian canvas text, which showed in Russian even on the English UI. On the phone: Round / Wins / Status, and a glow on the stats when you win a round.
- **Carry Ball**: a grass texture with mowing stripes, corner stadium light and a vignette. Each player has a team-coloured ring under them, the ball holder gets a pulsing ring, and a fast free ball leaves a trail. A goal shows a "1 : 0" banner with the scorer (or "Team goal"), confetti from the goal mouth and shake. The shared "GOAL!" DOM label from game-feel is left alone and not duplicated. On the phone: a team chip (Lime/Violet) and Score (yours : theirs) / Time stats with glyphs. Previously the phone had no glyph labels. When your team scores, the stats get a burst and haptic.
- **All phones**: the status line no longer repeats the timer and score next to the stats; it shows a short cue instead (for example "Score for your team"). This also removes the "1 points" grammar slip. Labels use `hp-stat-label`. Glyphs confirmed: ranking, trophy, rocket, shield, clock and crown. All text is localised through `PartyI18n.language`.

Motion rules: 70 ms press-in, 240 ms strong ease-out release, transform and opacity only, and reduced motion removes shake, confetti, ripple and movement. Particles are capped (160 confetti, 120 puffs, 10 pops). Juice uses the shared game clock, so it freezes on pause, and shake returns zero while paused.

three.js was not used. The 2D canvas layers gave the depth and life within the existing 60 fps path, without adding WebGL setup or disposal.

## Evidence

The capture script `qa-arcade.cjs` is in the session scratchpad. It starts a real server, launches the game with three bots and one real phone, force-starts it and drives real taps. Event frames are captured when the TV snapshot shows the event.

- `.localparty-build/game-polish-arcade/before/`: baseline, TV 1280×720 and phone 393×852.
- `after1/`, `after2/`: TV 1280×720 and 1920×1080, phone 393×852, punch hold and release, events (snake round banner, goal banner, CHOMP, flappy death).
- `after3/`: phone 320×568 for all six games (everything fits above Pause/Lobby, no horizontal overflow), events again after the pop and banner fixes, and the native route at 402×874 (`QA_NATIVE=1`, with controller-bridge.js and tabs.js).

Fixes made after viewing captures:
- CHOMP was clipped at the field edge; pops are now clamped inside the field.
- The goal banner sat on top of players in the centre; banners moved to the upper field and were made smaller.
- The tap-race track dots used a broken width calculation; they now move on transform-based rails.

## Tests

- Pass: `tests/arcade-feedback.cjs` (it was failing before this pass), `node --test tests/arcade-controller-payload.test.js tests/arcade-traffic.test.js` (2/2), `tests/arcade-report-metrics.cjs`, `node --test tests/game-quality-regressions.test.cjs` (6/6), `tests/arcade-scoreboard-browser.cjs`.
- Already failing, not caused by this pass (simulation untouched; same result on the pre-change copy):
  - `tests/arcade-simulation.cjs` flappy: `assert(g.players[0].vy<0)`. The 3 s flappy countdown blocks input.
  - `tests/punch-motion-check.cjs`: `update is not defined`.
- Not runnable: `tests/arcade-layout.cjs` and `tests/arcade-browser.cjs` hard-code a Windows Playwright path.

## Not verified

- No physical iPhone, Apple TV or AirPlay.
- The real haptic feel was not checked; LocalPartyFeel and the bridge path were exercised in code only.
- Hold-to-punch was tested with the button only; the motion-sensor punch was not tested.
- The flappy feather burst and the carryball team celebration on the phone were not individually inspected frame by frame.
- Russian-language captures were not taken.
- Banners can briefly (up to 1.9 s) cover field name labels that sit under them.
- Results and finished screens were not re-captured; this pass did not touch them.
