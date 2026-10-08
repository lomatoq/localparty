# Pocket Strike: art and game-feel pass (2026-10-04)

The owner asked for the alley art and the animations to stop looking "average". Follow-ups asked for the area behind the pins to look premium, for unstable lighting and hard camera cuts to be fixed, and for an off-centre texture to be found. All changes are render-only: the server stays authoritative, and `bowling.js` physics, rules and protocol are untouched.

## Montages (before → after)
- `.localparty-build/bowling-art-feel/montage-before-after-720.png` covers six views: aim, roll, impact, strike reveal, gutter and the lane display.
- `.localparty-build/bowling-art-feel/montage-owner-points-720.png` covers the owner's points: the pinsetter beat, the reveal, the roll end under the masking unit, and a crop of the lane markings.

## Critique of the before state (`before/`, captured from the 2026-10-03 code)
1. **Lane 8 world:** it ended at the masking units. The band above them was a flat violet strip with a dark void in the top corners.
2. **Lacquer:** it did not reflect the environment. The lane read as matte wood with no sheen that moves with the camera.
3. **Neighbour lanes:** they were dead, with static racks and no activity.
4. **Ball return:** a purple half-pipe with a flat black disc. The empty dark gaps between lanes looked unfinished.
5. **Roll camera:** it ended under a cropped, giant lane number "8", and the impact frame was dominated by the sign.
6. **Impact effects:** they were a white blob over the pins and did not read as pin action.
7. **Pin scatter and release:** no clatter sparks, no motion read on spinning pins, and no charge or feedback when the ball was released.
8. **Celebrations:** the STRIKE word sat under the TV shell's event toast and collided with it. The reveal background was a curtain with blurry confetti noise.
9. **Missing beats:** there was no "aww" for a gutter ball and no score pop. Nothing moved between throws apart from the neon wave.
10. **Behind the pins:**
    - Kickbacks were plain boxes.
    - Masking units were flat planes with no frame.
    - The pit curtain was a flat box.
    - The pinsetter table was a box and the sweep bar a slab.
    - The back wall was a flat dark box.
11. **Lighting pops** (found in code, see owner point 2 below).
12. **Off-centre lane arrows** (see owner point 3 below).

## Owner point 1: camera cuts and transitions
**Before.** Every camera move used per-frame exponential lerp. On each goal switch (aim → roll → reveal → aim), the camera's velocity jumped from zero to its maximum in one frame, which reads as a snap. My first pass also added a hard cut to a slow-motion angle on pocket hits; it has been removed.

**After** (`scene-bowling.js`, `bowling-extras.js`):
- **Springs:** the camera position and look target follow critically damped springs (SmoothDamp). Velocity stays continuous through every goal change. Smoothing times are 0.3 s while rolling, 0.42 s in the reveal and 0.5 s in aim.
- **Slow-motion angle:** a pocket hit now moves to the low three-quarter angle through a fast spring "whip" with a 0.2 s smoothing time, not a cut. `04-impact-slowmo` catches it mid-move.
- **Reveal pose:** it is held for the whole reveal window. Before, the aim re-target started at reveal age 1.2 s, while the pin-deck camera was still only partly blended in. The trace caught that fast move leaking through.
- **Return from the pin-deck camera:** the 27 m return to the aim view is now a 1.6 s fly-back. It uses a smootherstep blend (zero velocity at both ends), and its per-frame rate is capped so a frame hitch cannot turn it into a jump. Before, it covered about 27 m in about 0.35 s, peaking near 2.8 m per frame.

**Evidence.** `scripts/capture-bowling-art-feel.cjs` records a per-frame camera trace over a full throw cycle. Results are in `report-tv-*.json` under `cameraTrace`.
- **Final 720 run:** the largest step on a normal frame is 1.68 m during the fly-back, at about 42 m/s peak. Velocity in 100 ms windows ramps up and down with no isolated spike. The remaining irregularities line up with Playwright screenshot stalls; those frames are counted separately as `stalls`.
- **Earlier iteration:** before the reveal-hold fix, the trace showed a 2.8 → 29.5 m/s jump within 100 ms. That jump is gone.

## Owner point 2: behind and above the pins, and the far environment
New `bowling-deck.js` covers this area. Everything is merged per material.
- **Masking units:** bevelled chrome frames on all five, with neon piping inside the frame (pink on lane 8, violet on the others).
- **Soffit:** a ribbed gunmetal soffit with downlight cans. It is open where the pinsetter table drops and along the sweep bar's lift line, and has chrome trims.
- **Kickbacks (lanes 7–9):** padded quilted walls with chrome studs, a pink LED line and chevrons pointing to the pit. Each has a chrome cap rail. Every lane has bevelled end posts with lit violet or pink fins.
- **Pit:** a folded velvet curtain (displaced geometry that catches the pit and rim light) with a chrome rod and finials. The pit side walls are trimmed, and there is a rubber pit nose.
- **Back wall:** lit pilasters exactly in the gaps between the pinsetter housings, a violet LED band, a star field and a "HEYPALS LANES" wordmark. Housings have ribbed machine panels.
- **Sweep bar:** chrome end caps and two lift arms with collars.
- **Pinsetter table** (`bowling-extras.js`): a rounded, bevelled plate with a neon underglow ring and four hydraulic rods with sleeves.

`bowling-alley.js` adds more environment and furniture:
- **Fascia** above the masks: neon "HEYPALS" and "BOWL" / "LANES" / "ARCADE" signs, pin and ball icons, and a warm bulb marquee.
- **Lane reflection:** a blurred, smeared reflection of the lane-8 sign in the lacquer. It is real mirrored geometry drawn through the lane stencil, so it moves with the camera.
- **Ball return:** a sculpted hood (capsule pod, chrome mouth ring, pink belt) on a plinth, with chrome rails and two house balls.
- **Furniture:** a two-tier ball rack, and glossy LED dividers between the lanes.
- **Neighbour lanes 7 and 9:** occasional house balls roll on them, knock a seeded share of the rack over, the deadwood drops away and a fresh rack comes down. This is off under reduced motion.
- **Atmosphere:** dust motes drift in the deck light.

Not done: a ceiling light rig and seating. The ceiling and seating are not visible from any of the game's cameras. The aim camera is fitted to the field, and the follow and reveal cameras look down.

## Lighting stability (pops)
Causes found in code, and the fixes:
- **Deck light cones:** they were hard-cut to 0 at every reveal start and back on at aim. They now ease (`lw.cone`).
- **Marquee chase:** the phase jumped when the rate switched between 4 and 14 at roll start and end. The phase is now integrated over time with an eased rate.
- **Neon comet:** it appeared and vanished on the stage switch. It now uses eased weights, and the gutter drain recovers over about 1 s instead of snapping.
- **Strike colours:** the "party" colours on the bulbs and neon switched on and off. They now fade in over 0.3 s and out over 0.8 s or more.
- **Impact flash light:** it went from 0 to full in one frame. It now has a 40 ms attack, and its strength is scaled down when the camera is close.
- **Lane-8 sign:** it blacked out within 0.25 s when the dark score screen covered it. The screen now uses the sign's colours and stripes, and crossfades over about 0.45 s.
- **Gutter light dip:** this is my own feature. It snapped back at aim; it is now time-based only.

Ruled out:
- Host or spectator lights: `scene-bowling` removes them, and none are added later.
- Exposure changes.
- Shadow camera: it is fixed.

## Owner point 3: off-centre lane texture
The seven target arrows were drawn on boards 5, 10 … 35 of 39. That put the centre arrow at x = +0.113 m and made the set lopsided: −1.579 m on the left against +1.805 m on the right, measured against the physics centre line x = 0. They are now on boards 4, 9 … 34, so the centre arrow is on board 19 (the middle board) at x = 0 and the set is symmetric (±1.692 m). The approach dots also now sit on board centres, mirrored about x = 0.

Checked and already centred: pin spots, rack, gutters (±2.65), deck light, aim fit and guide. The montage crop shows the after state.

## Game feel
New `bowling-feel.js`, plus changes in `scene-bowling.js`:
- **Release charge:** the ball glows in the bowler's colour, with a ring pop and a fan of streaks, all scaled by throw power. Speed streaks peel off the ball's flanks.
- **Clatter:** velocity-change detection on the rendered pin poses spawns spark streaks and plays the existing `hit` sound (at most 5 per throw, rate-limited).
- **Rotation blur:** additive ghosts of the pin silhouette from the previous two poses, only on fast pins.
- **Impact:**
  - The lens punches in by 7.5%.
  - On a pocket hit, slow motion runs at 0.34× for 0.88 s, with the low-angle whip.
  - The octahedron chips are replaced by streak sparks.
  - Billboards are shrunk and dimmed when the camera is close.
- **Celebration tiers:**
  - Words: STRIKE, then DOUBLE, TURKEY and N-BAGGER, with RU translations.
  - Banner size, overshoot and wobble grow with the tier, and so do the camera push, confetti count and fireworks (3, 5, 7, then 9).
  - A turkey or better plays `win` instead of `confirm`.
  - The banner now sits below the TV shell's toast.
- **Gutter "aww":**
  - At the moment of the drop: the `back` sound, a lens pull-back, a camera sag and tilt, and dimmed house lights.
  - On the reveal: a small, deflated blue "GUTTER…" word that droops, placed low over the empty lane.
- **Score pop:** the lane display counts up from the previous total with a "+N", then the panel kicks once.
- **Idle micro-motion:** a handheld drift while lining up, a pulsing launch ring, and a breathing ready glow on the ball.
- **Reduced motion:** no camera moves, slow motion, particles, blur, ambient bowling or light dips. The camera stays on the aim view during the roll, as seen in `after/reduced/*`.

## Files
- **New:**
  - `games/sports_siege/public/bowling-alley.js`
  - `games/sports_siege/public/bowling-feel.js`
  - `games/sports_siege/public/bowling-deck.js`
  - `scripts/capture-bowling-art-feel.cjs`
- **Edited:**
  - `games/sports_siege/public/scene-bowling.js`: hooks, camera springs, slow-motion angle, banner tiers and placement, arrow and dot centring, light handles, flash.
  - `games/sports_siege/public/bowling-extras.js`: light director, tiered fireworks, score count-up, close-range impact scaling, pinsetter table, reset-camera fly-back.
  - `games/sports_siege/server.js`: three one-line static-map entries.
- **Not touched:** host.js, the curling files, spectator-*.js, controls.js, the CSS files and bowling.js.

## Performance
Headless WebKit on a shared machine, so these numbers are indicative only. Headless fps tops out at about 50 in every run.

| Window | Draw calls before → after | CPU per frame p50 / p95 before → after | fps before → after |
|---|---|---|---|
| Aim idle, 720 | 76 → 98 | 1 / 2 → 1–2 / 2 ms | 48–51 → 45–52 |
| Whole throw (roll, reveal, reset), 720 | 64 → 92–93 | 1 / 2 → 1 / 2 ms | 45.3 → 47.8–54.6 |

All particle and blur pools are bounded: 64 streaks, 2×10 ghosts, 36 motes and 2 ambient balls. Everything is disposed in `dispose()`.

## Captures
All under `.localparty-build/bowling-art-feel/`:
- `before/` (720), the extras and upgrade scripts on the old code.
- `iter1`–`iter4` and `camtrace*`: iterations.
- `after/`: 720 with 5 frames, including every strike, double, turkey, 4- to 7-bagger, spare and gutter reveal.
- `after/final720/`: 720 with 3 frames, after the last impact tweak.
- `after/hd/`: 1080.
- `after/reduced/`: reduced motion.

Each folder's `report-*.json` carries per-shot probes (banner tier, slow-motion state, feel debug) and the camera trace.

Images viewed to make decisions:
- **before:** aim, roll, impact, strike, gutter, a-1-reveal, a-2-pit, b-4-sweeping, a-7-aim-again, spare, return, c-roll.
- **iter1:** aim, impact, strike, roll, gutter, impact-2, a-7.
- **iter2:** u/aim, u/impact, u/roll, u/gutter, x/c-1-reveal, x/a-impact, x/a-1-reveal, x/d-impact, x/a-7, x/b-5.
- **iter3:**
  - 720: 01, 02, 04, 05, r05, r03, r01, r09, r07, 07, g1.
  - 1080: 01.
- **iter4:** 06, 01, r01, 05.
- **after:**
  - 720: 02, 08, 06, 05, 03, 01, r05.
  - final720: 05, 04.
  - hd: 01, r01.
  - reduced: 05.

## Tests
`node --test tests/bowling-physics-regression.test.js tests/bowling-stress.test.js tests/alpha-catalog.test.js tests/alpha-physics.test.js tests/alpha-network.test.js`: 21/21 pass.

## Not verified
- A real TV GPU and 60 fps on the target device; headless WebKit only.
- The software-renderer (`low`) path.
- The Russian banner and lane-display words.
- Reconnecting in the middle of the slow-motion angle or the fly-back.
- Not every frame in the after folders was viewed, only those listed above.
- Camera smoothness is shown by the trace numbers and the mid-move still. No video was recorded.
- No sound check (no audio output in headless).
- Remaining known weaknesses:
  - The slow-motion close-up is still bright around the ball at the instant of contact.
  - The soffit is barely visible from the game's cameras.
  - There is no ceiling or seating.

## Review fix pass (after the main agent reviewed the montages)
- **Pink smear on the lane:** the sign reflection read as a blurry pink stain over the arrows in the aim and roll views.
  - Its shader now traces each fragment's view ray to the lane (y = 0) and keeps it only where that point is past z −1, reaching full strength at z −5, so only the pin-end part of the lane shows it.
  - It is also less blurred and drawn at about half the previous strength.
  - From the aim camera the reflection would land mid-lane, so it is no longer visible there; the arrows are clean (`after/fix720b/01-aim-idle`, `03-roll`).
- **"GUTTER…" overlapping the pins:** the word is now smaller (0.5 scale) and sits in the strip between the TV toast and the pin heads, so it never covers the rack (`after/fix720b/r01-reveal-0`).
- **Slow-motion close-up overexposed at contact:**
  - The flash light is scaled down much more for close cameras (`near^1.5`, down to 0.1).
  - Glow brightness drops with distance squared.
  - The slow-motion shot drops the burst and glow billboards and the ground ring, and carries the hit with streak sparks and pin blur only (`after/fix720b/05-scatter`).
- **Montages:** both were rebuilt from `after/fix720b/`, except the strike-tier row, which still uses `after/r05`.
- **Viewed in this pass:**
  - fix720: 01, r01, 05, 03, 04.
  - fix720b: 05 and both montages.
- **Not re-run at 1080 after this pass.** The 1080 images in `after/hd/` predate these three fixes.
