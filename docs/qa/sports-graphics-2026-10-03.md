# Pocket Strike and Ice & Nerves: graphics pass (2026-10-03)

Owner request: make 3D Bowling and Curling look expensive. Fix the known weak spots first, then improve materials, models, lighting and composition. Rendering only: no changes to rules, physics or protocol.

## Files
- `games/sports_siege/public/scene-bowling.js`: lights, lane, pin and ball materials, mirror fade, ball holes, reveal camera, delayed ball return, fog.
- `games/sports_siege/public/bowling-extras.js`: impact glows, trail, deck cones, pit floor, deadwood landing, sweep-bar skin, pinsetter detail, `returnDelay()`.
- `games/sports_siege/public/scene-curling.js`: exposure and lights, ice material, granite, stone bolt and trim, broom head.
- `games/sports_siege/public/curling-extras.js`: lamp streaks, beam floor pools and feet, planar ice reflection.
- `scripts/capture-bowling-extras.cjs`: optional `QA_PERF=1` frame-cost window over a whole throw (roll, reveal, sweep and reset camera).
- Not touched: host.js, spectator-*.js, controls.js, sports-controls.css, style.css, server rules and physics.

## Weak spots fixed
- **Curling ice over-bright:** the ice albedo was near white under ACES and clipped. It is now a cool blue-grey (`#b6cee2`), with exposure at 0.94 instead of 1.02, hemisphere fill at 0.9 instead of 1.15, and the house spot at 30 instead of 46 with a soft edge. The clearcoat is tighter and `envMapIntensity` is lower. Lamp reflection streaks are narrower and at 0.04 instead of 0.085 opacity.
- **Pebble barely visible:** the generated pebble map now also drives a bump map, and the pebble sparkle overlay opacity went from 0.30 to 0.42. In the captures the pebble now reads on both the ice and the house rings.
- **Spotlight ellipse around the moving stone:** the beam floor pools are wider and fainter (at most 0.1, and ×0.3 on the ice while chasing). The beam shader fades over the bottom 42% of its length instead of 22%, and the chase intensity is 0.26 instead of 0.38. No ellipse is visible in `02-slide` or `03-sweep`.
- **Bowling impact flash washing out pins:**
  - The flash light is 4–10 and lasts 0.35 s. Before it was 18–36 for 0.4 s.
  - The impact glow is depth-tested, sits behind the rack and is about half as bright.
  - The spark burst and shock ring are dimmer.
  - The deck cones flare by 0.05 instead of 0.3, and the deck glow by 0.07 instead of 0.16.
  - The ball trail's overlapping quads were adding up to a white smear; their strength went from 0.26 to 0.10.
  - The deck spotlight is narrower (0.8 rad) with a fully soft edge, so there is no hot ellipse on the deck.
- **Knocked pins and the pit:**
  - The reveal camera was above the masking-unit sight line, so the pit was always hidden. It moved to (0.8, 2.75, −0.4) → (0, 0.36, −12.2), which is below the mask edge, so pins can be seen flying to the back and into the pit.
  - A violet pit work light was added.
  - The black pit plane used to sit at y −0.35 and swallowed pins as soon as they dropped below the deck. It is now a lit rubber conveyor mat at the server's pit depth (y −0.79).
  - Swept deadwood lands on the mat instead of vanishing below y −0.95.
- **Ball invisible during the pinsetter camera:** while the pin-deck camera shows the machine, the ball return waits 1.7 s (`extras.returnDelay()`, not under reduced motion and not on the first turn). The ball now rolls out of the hood once the aim view is back. The hood pulse, the pop and the aim guide are shifted to match.

## Further improvements
**Bowling**
- **Lane:** a new roughness map per board, with a glossier oiled zone, satin backends and deck, and grain streaks. Clearcoat 0.85 at roughness 0.09.
- **Lane reflections:** mirrored pins and ball now fade with depth below the lane, using `exp(2.4·y)` in an `onBeforeCompile` patch. Before they were uniform ghost columns.
- **Pins:** a new 256² texture with a softer ivory base, red neck bands with white keylines, a crown mark front and back, and faint belly scuffs. The material is a hard clearcoat at 0.05.
- **Ball:**
  - Pearl iridescence (0.35) under the clearcoat.
  - Real thumb and finger holes on top of the painted ones: a recessed bowl disk and a clearcoated insert-rim torus at the exact UV spots.
- **Sweep bar:** a machined gunmetal face with brushed lines, violet chevrons pointing to the pit, rivets, a pink edge and a chrome top rail.
- **Pinsetter table:** ten chrome spotting cups and side frame beams.
- **Depth haze:** fog now runs from 34 to 120 (before 62 to 130), so the far racks and back wall recede slightly.

**Curling**
- **Granite:** a 512² multi-size crystal speckle (hornblende, feldspar, rose and mica glints) that also drives a bump map. Polished with clearcoat 0.55 (`MeshPhysicalMaterial`).
- **Stones:** a slimmer, smoother handle tube, a chrome bolt under the handle, and a chrome trim ring at the cap.
- **Brooms:** pill-shaped broom heads instead of boxes.
- **Planar ice reflection:**
  - A third-resolution HalfFloat render target holds only the stones, next stone and brooms (layer 2). It is rendered from the camera mirrored in y=0.
  - The ice and every painted marking sample it projectively, broken up by the pebble bump. The mix is 0.5 × (0.45 + 0.55·fresnel²).
  - All scene lights are enabled on the mirror layer, so both passes share the same programs and nothing recompiles.
  - Between throws the mirror refreshes every third frame.
  - It is skipped on the software renderer.

## Performance
All figures are headless WebKit on a shared machine, so treat them as indicative. Before = `.localparty-build/sports-graphics/before`, after = `.../after`.

| View | Draw calls before → after | CPU per frame before → after | Frame time / fps before → after |
|---|---|---|---|
| Bowling aim idle 720 | 70 → 76 | p50 1 / p95 2 → 1 / 2 ms | 49.9 → 50.2 fps |
| Bowling whole throw (new window) | — → 72 | — → 1 / 2 ms | — → 48.8 fps |
| Curling rolling, takeout | 113 → 140 | avg 5.5 → 5.7 ms | 16.63 → 16.71 ms avg |
| Curling rolling, draw | 121 → 156 | avg 4.6 → 5.8 ms | 16.64 → 16.66 ms avg |
| Curling aim idle | 105 → 109 | avg 5.8 → 5.5 ms | 17.98 → 16.83 ms avg |

The curling reflection pass costs about 27–36 draw calls while a stone moves, and stays at 60 fps (avg 16.7 ms). Headless bowling fps is capped at about 50 in both runs.

## Verification
Playwright WebKit with the real launcher, two phone controllers, real swipes and sweeps, and no state injection.
- `QA_PERF=1 node scripts/capture-bowling-extras.cjs` (720), plus `QA_TV=1920x1080 QA_QUICK=1` and `QA_REDUCED=1 QA_QUICK=1`: all PASS, with no page or console errors apart from the existing 404s.
- `node scripts/capture-bowling-upgrade.cjs`: PASS.
- `node scripts/capture-curling-upgrade.cjs`: 3 ends, PASS, 31 screens, no page errors. The only TV console error is `glTexSubImage2D offset overflows`, which is identical in the baseline.
- `node --test tests/bowling-physics-regression.test.js tests/bowling-stress.test.js tests/curling-physics.test.js`: 26/26.

Images viewed for decisions:
- **Before:** bowling `a-aim`, `a-impact`, `a-1-reveal`, `a-2-pit`, `a-4-sweeping`, `a-5-setting`, `b-impact`, `b-2-pit`, `b-3-sweepdown`, `d-impact`; curling `01-aim`, `02-slide`, `03-sweep`, `06-score`.
- **Iterations:** iter1 `a-aim`, `a-impact`, `a-1-reveal`, `a-2-pit`, `a-4-sweeping`, `a-7-aim-again`. iter3 bowling `a-1-reveal`, `a-impact`, `a-5-setting`. iter2 curling `01-aim`, `02-slide`. iter3 curling `02-slide`, `04-contact-1080`. iter4 curling `03-sweep-1080`, `06-score`, `05a-crowded-aim`.
- **Final:** bowling `b-impact`, `b-1-reveal`, `b-7-aim-again`, `a-1-reveal-1080`, `a-impact-reduced`, and upgrade `gutter`; curling `01-aim-1080`, `02-slide`, `05-measure`, `09b-reduced-roll`.

Fixes made after viewing:
- **Pin sheen:** it read as velvet, so it was removed.
- **Reveal camera:** it was moved back so the pins are less huge.
- **Deck light pools:** the spot cone was narrowed.
- **Stone bolt:** it read as a black hole in a dark environment, so it now has less metalness.
- **Ice colour:** the first value was too grey, so it was made cooler.
- **Reflection:** it was too faint, so the strength was raised and fresnel added.

## Not verified
- A real TV GPU and 60 fps on the target device; headless WebKit only.
- The software renderer (`low`) path. It skips the reflection, but the remaining changes were not captured there.
- Tenth-frame bonus-rack paths and the Russian bowling lane display.
- Curling reflection at 4K: the 2160 capture file was written but not inspected.
- Not every frame of the after folders was viewed; only the files listed above.

## Known trade-offs
- Pins pushed by the sweep bar are hidden behind the bar from any camera under the masking unit, as on a real alley. The pit floor is lit for the reveal view.
- The curling reflection has no height fade. Handle tops reflect at full strength, but this is subtle at 0.5 mix.
