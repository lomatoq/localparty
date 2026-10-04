# Integration 119 — Local Tanks field recess

2026-10-04. Follow-up after the new shared header material. The user referred to driving tanks: visual review of the existing actual Local Tanks, Pocket Siege and Tank Arsenal originals identifies the mismatched geometric recess in **Local Tanks (`tanks`)**. Pocket Siege is a continuous sky/terrain scene; Arsenal has a straight field beside its side rail. Neither has this field recess. Gallery reviewer independently confirmed that scope.

The old `tankBoundaryRecess` / `traceTankBoundary` builder in `games/tanks/public/host.js` traced a flat rounded U from the 600px dock rectangle with a guessed radius. The shared header now paints the SVG 656×114 path beyond that rectangle: concave shoulders and a quadratic bowed lower lip. The old field cutout therefore missed the material contour.

The renderer now measures the actual `.tv-info-glass` painted box independently and projects it from parent receiver coordinates into world coordinates. It maps the same 656×114 contour, including cubic shoulders/corners and quadratic lower lip, into the recess with the existing eight-unit clearance at its lateral/lower bounds. The entry shoulder is cropped analytically to the field's top line using cubic subdivision, avoiding an arbitrary added U or angular stub. Existing outer rim and wall material are retained.

**Collision safety remains unchanged.** `publishTankBounds`, `PARTY_HUD_EXCLUSIONS`, the authoritative protected rectangle, world projection, tank artwork, input and simulation are untouched. The visual builder never shrinks the collision rectangle to the curved path.

## Focused verification

- `node --test tests/tanks-boundary-shape.test.cjs tests/tank-visible-playfield.test.cjs`: **9/9 pass**. Tests execute the actual contour/projection functions, verify four cubic sections, closed finite shape, bowed lip midpoint, top-line re-entry, both TV inverse scales, and immutable collision dock. Existing human/bot protection, resized respawn, auth/stale/reconnect and paused recovery checks remain green.
- Actual managed launcher, real joined phone plus three bots, ready/start gameplay, at 1280×720 and 1920×1080. Fresh full originals opened and visually inspected: matched shoulders and bowed lip, no angular U stub. These are browser captures, not a hardware TV claim.
- At both receiver sizes: painted box in world units `312,0,656,124.59375`; protected collision dock `340,0,600,124.59375`; recess lower bound `132.59375`. Projection scale 1 and 1.5 respectively. Shoulder end is below the 24px field top in both measured states, so the short-header hypothetical branch does not occur.
- Captures/reports: `output/playwright/tanks119-contour/720/` and `/1080/`; each has `tanks-tv-after.png`, original phone captures and `report-393x852.json`. No capture exception; recorded controller page errors are empty. The borrowed A/B harness does not independently record TV page errors, so no all-console-clean claim is made.

Product source final SHA-256:
`games/tanks/public/host.js` — `9dc7b51a03280c180887599c60a586b61b4cd9e6e20b50665d32af0fb18384e6`.

Changed source: `games/tanks/public/host.js`. Focused test updated: `tests/tanks-boundary-shape.test.cjs`. No other game source changed for this follow-up. Root/gallery own the refreshed final packet, build, install and push.
