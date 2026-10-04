# Flappy countdown backing — 2026-10-03

The reported black rectangle was reproduced during the genuine pre-play countdown, not waiting. Flappy is the `arcade` engine. Its sky fills the display canvas, but `ArcadeJuice.countdown()` painted a dark 1200×720 world rectangle while the renderer's world clip and camera were active. At 1280×720 the slab began at x148/y130; at 1920×1080 it began at x215/y186. The surrounding sky remained bright.

The bounded change releases the world clip/shake transform before countdown presentation. `drawArcadeCountdown()` paints the same translucent dark tint over the complete canvas in the identity transform, then restores the existing camera for the countdown artwork. `arcade-juice.js` no longer paints a second world rectangle. The fallback numeral receives the same fullscreen dim. Timer, ring, hint, authoritative world dimensions, uniform camera, three-second engine timing and inputs are retained. Shared cap and launcher files were not changed.

## Actual evidence

Harness: `scripts/qa/screen-state-audit-2026-10-03/flappy-countdown.cjs`. Isolated embedded launcher with ephemeral ports/data, two actual browser controllers and real ready-button clicks; no bots, fabricated game state, pause injection, fast clock or live-device changes. Fonts/assets load while waiting; final capture settles 600ms plus two animation frames after playing visibility. Browser/server closed in `finally`.

Before originals: `output/playwright/screen-state-audit-2026-10-03/flappy-countdown-before/flappy-countdown-{1280,1920}.png`. Both opened and the hard rectangular dim boundary confirmed.

Qualified final evidence: `output/playwright/screen-state-audit-2026-10-03/flappy-countdown-final/report.json`, `ok:true`, `errors:[]`, `drift:[]`. All six originals were personally opened:

| Original | Observation |
| --- | --- |
| `flappy-countdown-1280.png` | Uniform sky dim to all four display edges, whole numeral/ring/hint, no slab. |
| `flappy-countdown-1920.png` | Same full-display dim, whole bright countdown artwork, no slab. |
| `flappy-playing-1280.png` | Countdown and dim disappear at countdown0; continuous sky and birds remain. |
| `flappy-playing-1920.png` | Same clean transition, no residual rectangle. |
| `punch-playing-1280.png` | Normal shared renderer bag/scene/cap, countdown0, no countdown paint recorded. |
| `punch-playing-1920.png` | Same no-countdown regression check, whole bag and scene. |

Actual canvas probe recorded `rgba(11, 8, 24, 0.6)` with identity transform and backing rectangle 1280×720 / 1920×1080. Both countdown samples were 2.2 seconds. Existing uniform camera was unchanged: scale0.8200139/x147.9917/y129.59 at720 and scale1.241125/x215.325/y186.39 at1080.

Earlier development captures are retained separately. Two initial attempts corrected helper-only asset-scope/navigation probes. `flappy-countdown-confirmation` had a helper probe incorrectly calling `.includes` on a CanvasGradient and is not qualified evidence. The clean final helper guards string styles, fails on browser errors, and captures after paint settlement.

## Regression checks and freeze

`node --test tests/arcade-countdown.test.cjs`: four PASS. Tests exercise full backing paint at1280 and DPR-sized3840, identity dim transform, camera/context restoration, fallback numeral location, clip-release call ordering and absence of a second slab in countdown artwork. Both production files pass syntax checks and scoped diff whitespace checks. No broad simulation acceptance is claimed; the existing arcade simulation test has an unrelated stale Flappy input assertion during countdown, reported by the Punch owner before this change.

Production fingerprints during the qualified final run:

- `games/arcade/public/app.js`: `9ec1c3f5ec763aff5bc2cefca1bb0e819191007ce6fd67cf4e991d4165893cec`
- `games/arcade/public/arcade-juice.js`: `70922a0bc3d72e3718718e03cad404c6da9f4b727bd21c89ef4d1581f3f29d46`
- `tests/arcade-countdown.test.cjs`: `54b9c62e1567735e2a31c0446f9c644168a5e41c01f2e117f723a712902fc9ea`

Scope of acceptance is the named countdown backing, return to normal Flappy play and a normal Punch playing overlay check. It does not establish physical-device behavior, every arcade feedback banner or later concurrent Hungry changes. No build was assembled.
