# Ice & Nerves: arena art and game feel pass (2026-10-04)

The owner said Curling's animations and arena art were still "average". The goal was premium console party-game quality, with seven requirements:
- modelled props instead of boxes;
- stable lighting;
- no camera jump cuts;
- a coherent far background;
- ice markings centred on the real sheet geometry;
- the 60 fps budget kept;
- reduced motion respected.

The server stays authoritative. Everything here is presentation only.

## Critique of the 2026-10-03 state (`.localparty-build/curling-art-feel/before/`)
1. **Ice:** the ice was a flat, uniform pale-grey slab that read as vinyl. It had no depth, no painted logos, and nothing built up during an end.
2. **Markings:** the markings looked like stickers on top of the ice. The hog line was a faint hairline.
3. **Sheet edges:** they were RGB neon strips (pink and violet) that read as gaming lights, not an arena.
4. **Rink-side:** the only dasher dressing was a dark band with tiny repeated ribbons. There was no glass, hacks, benches, racks or pylons. Stands were the only environment.
5. **Far background:** the end wall was a flat plum box with a primitive graphic, and the roof was never seen or built.
6. **Aim:** the aim view was static. The stone sat dead, and nothing anticipated the release.
7. **Release:** the stone in hand vanished for about 0.1 s before the thrown stone appeared.
8. **Slide:** the camera was tight on the stone over empty ice. There was no speed cue, and the handle spin was unreadable.
9. **Sweep:** the broom handle crossed the stone, and the frost dots were tiny. There was no stroke rhythm.
10. **Contact:** there was no punch: no hit-stop, no shake, no spin-off.
11. **House:** no live "who is shot" indicator. The measure shot was diagonal rather than top-down.
12. **Score:** the celebration was the same for 1 point and for 4.
13. **Camera:** it used first-order lerps that whip at the start of long moves. Since Codex's measure guard landed, it could also snap about 1 m in a single frame during measure transitions (measured below).

## What changed
### New modules (render-only)
- **`curling-arena.js` (static props, merged per material):**
  - Every piece is modelled from rounded sections, bevelled slabs and tubes. Materials are gunmetal, chrome, vinyl, polished HDPE, rubber and diffuser.
  - **Dasher boards:** a rounded section with a bull-nosed cap and a rubber kick strip.
  - **Sponsor faces:** HeyPals, ICE & NERVES and team-mark panels, all in canvas.
  - **Glass:** rounded stanchions with chrome clamps and finials, a round top rail, and env-reflective glass with soft diagonal reflection streaks.
  - **Roof:** triangular tube trusses with par-can spots and lit lenses, plus bevelled lamp housings.
  - **Far end:** a bevelled jumbotron showing the event logo and both team marks, acoustic slats, and team light columns.
  - **Walkway:** LED score pylons at the house corners with a lit crown, a bezel and a breathing edge glow.
  - **Benches and racks:** vinyl team benches on aluminium tube frames. Broom racks hold four team brooms each, with a carbon handle, chrome ferrule, padded head and brush face.
  - **Hacks:** molded rubber hacks on chrome plates, with a painted hack line.
- **`curling-ice.js`:**
  - **Clear top-coat shader:** cool subsurface haze with cloudy depth, a bluer tint towards the boards, and a grazing-angle sheen. It also adds view-dependent pebble glints with a footprint fade.
  - **Under-ice paint:** the event logo and HeyPals marks are painted under the frost. Their canvas spans exactly the sheet bounds.
  - **Scratch map** (192×768): running-band scuffs and swept polish build up during an end and fade out ("resurface") when a new end starts.
- **`curling-feel.js`:**
  - **Camera shots:** a low chase behind the stone with lag, with the house visible ahead. A crane rises as the stone nears the house. The measure is near top-down with a slow drift. The aim view breathes slightly.
  - **Contact:** trauma shake and an FOV push. Interpolation holds for 50–120 ms on contact (hit-stop). Struck stones spin off with a decaying spin and wobble.
  - **Release:** a launch ring and frost puff.
  - **Spin ring:** curved arrows under the moving stone show its turn direction.
  - **Sweep:** speed streaks, and frost bursts on every broom-stroke reversal.
  - **House drama:** a live shot-stone halo and a dashed distance ring around the button. A sparkle fires when shot changes hands.
  - **End fireworks:** low fireworks inside the house shot, scaled by the end's points.

### Hooks in existing files
- **`scene-curling.js`:**
  - Imports and constructs the three modules.
  - Hit-stop time scale on interpolation.
  - The stone in hand stays visible until the thrown stone is drawn, and does a slow slider rock while aiming.
  - Broom handles point out to the sides, clear of the stone.
  - Cool LED line on the sheet edges.
  - A static back rim light and glossier granite, so stones catch rim highlights.
  - The old glass, rail and box hacks are removed (the arena replaces them).
  - Crowd cheer length scales with points; the contact ring is softer.
  - **Camera:**
    - It is now a critically damped spring with an eased rate, so moves ease in and out with no overshoot.
    - Speed is capped at 11 m/s for position and 16 m/s for the look point.
    - Long relocations, such as the house back to the next delivery, glide more slowly.
  - **Codex's `keepMeasureVisible` guard:** kept, and its HUD-safe goal is unchanged. It now pre-corrects the spring target (dry run) and glides out at ≤7 m/s in transit instead of snapping. Logged in `docs/agents/game-polish-lanes.md`.
- **`curling-extras.js`:**
  - The LED ribbon moved onto the dasher top band.
  - Sparks can be delayed (used for fireworks).
  - The celebration scales with points: confetti 55–100%, sparkle ring, LED flash duration, and a call to `feel.celebrate`.
  - The chase beams dim while in the crane view, so they don't wash out the house.
- **`games/sports_siege/server.js`:** three static-map lines, one per new module.

## Owner-specific checks
- **Lighting stability:**
  - No lights are added or removed per stage. The only new light is a static directional rim light, created at load.
  - Beams and pylon glows are meshes whose intensity is eased.
  - Every material is created up front, so there are no shader-variant pops between stages.
- **No jump cuts:**
  - A camera-continuity probe in `scripts/capture-curling-art-feel.cjs` counts frames shorter than 30 ms where the camera moved more than 0.6 m or turned more than 8°.
  - Final run: **0 such frames across about 17.5k frames** in all segments.
  - The largest single steps (1.1 m) all fell on 0.1 s stall frames. That equals the 11 m/s cap.
  - The run before the guard fix measured a 1.07 m step in 17 ms during the measure reveal (`camdebug/report.json`, earlier `after` trace).
  - No cross-fades or wipes were needed: every change is a continuous eased move.
- **Far background:** the jumbotron, slats, team columns, trusses with spots and the lamp housings are visible in the chase frames (`after/02-slide`, `03-sweep`) and the probe close-ups (`after-probes/07x-p1`, `07x-p4`).
- **Markings centred and aligned:**
  - All sheet markings use the server constants: house (0, −9, r 2.6), hog line z = 0, sheet edges.
  - The ice top coat, logo plane and scratch map use exactly the ice box bounds.
  - An inverted z-mapping that put the logo and scratches at the wrong end of the sheet was found during the pass and fixed (iter1 → iter2).
  - In `after/05-measure-tv-1080`, the tee line and centre line cross exactly at the button, and the scratch trails run along the real stone paths (`iter2/05a`).

## Performance (headless WebKit, TV 1280×720; machine shared with other agents)
| Window | Before: frame avg / CPU cost avg / draw calls | After (final run) |
|---|---|---|
| Aim idle | 16.92 ms / 6.38 ms / 109 | 16.67 ms / 6.95 ms / 123 |
| Rolling, takeout | 18.32 ms / 6.52 ms / 140 | 16.67 ms / 7.93 ms / 158 |
| Rolling, draw | 16.67 ms / 5.84 ms / 174 | 16.67 ms / 7.88 ms / 180 |

The new modules cost about 0.6–1.5 ms of CPU per frame. A module-toggle probe during a roll measured all three new modules off at 6.94 ms against 7.96 ms with everything on. The game still holds 60 fps.

Earlier runs while the machine was overloaded (load average above 100) showed 20–36 ms frames. Those numbers reflect the machine, not the game, and are discarded.

Bounds:
- 28 streaks.
- Sparks and confetti use the existing pools; fireworks go through the spark cap.
- One scratch canvas, uploaded at most about every third frame while dirty.
- Everything is tracked and disposed with the scene.

Reduced motion: no hit-stop, shake, FOV push, drift, chase or crane, streaks, bursts, spin ring, fireworks or confetti. Glints are static and the stone in hand is still (`after/09b-reduced-roll`).

## Verification
- `node --test tests/curling-physics.test.js`: 14/14 pass.
- **Final run:** `QA_OUTPUT=.localparty-build/curling-art-feel/after node scripts/capture-curling-art-feel.cjs`
  - PASS, 35 screens.
  - Real launcher, two phone controllers, real swipes and sweeps, 3 ends; end scores were 1, 2 and 1.
  - No page errors and no TV console errors.
- **Probe run:** `QA_PROBE_PROPS=1 QA_PROBE_CELEBRATE=1` → `after-probes/` (33 screens).
  - The QA script temporarily steers the camera for prop close-ups, and triggers a 3-point celebration through `extras.effect`. No engine state is touched.
  - This run stopped at the reduced-motion throw. The probes used up that turn's timer, so it is a script timing issue, not a game issue.
- **Montage:** `.localparty-build/curling-art-feel/montage-before-after.png` (before vs after: aim, slide, release, sweep, contact, measure, score, next end).
- **Images viewed:**
  - before: 01-aim-1080, 02-slide, 03-sweep-1080, 04-contact, 05-measure-1080, 05a, 06-score, 07-next-end-1080.
  - iter1: aim-1080, slide, sweep-1080, contact.
  - iter2: aim, slide-late, contact-1080, measure-1080, score, crowded-aim, sweep-1080, next-end, reduced-roll, result.
  - iter3: release, slide, settle-1080, aim-1080, sweep, contact, after-contact, score-1080, measure, reduced-roll.
  - iter5 and after: prop close-ups p1–p4, sweep-1080, slide-late, 3pt probe.
  - after-probes: 3pt celebration, pylon/rack/jumbotron close-up, measure-1080.
  - after: reduced-roll, montage.

## Not verified
- A real TV GPU, the 4K frame (written to disk but not inspected), and the software renderer (`low`) path. On `low`, glints and streaks are off but the arena is still built.
- Audio is unchanged.
- Hit-stop and shake are proven by diagnostics (`feel.spinOff` > 0 after contact) and by code. They are motion effects, so no still image shows them.
- Not every frame in the after folders was viewed; only the ones listed above.
- The 2-point end in the real run was not captured at the moment of scoring. The scaled celebration was checked with the 3-point probe.
