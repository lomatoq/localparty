# Explosion timeline evidence and compatibility

Inspected the supplied 2012 PE32 `pockettanks.exe` and decoded weapon archive, not a guessed shader duration.

- `EarthMoverExplosion`: radius140, draw OUT, palette32, erase delay147, terrain erase true.
- `EarthMoverExplosion2`: starts750ms later, radius140, palette48, erase delay72, terrain erase false, throw flag true.
- Parser `0x44d708` stores ERASE_DELAY at definition+0x94. Definition copy at `0x44bae4` puts it at instance+0xcc; initializer copies it to+0x10c.
- Update `0x44bc50` uses the `.02` double at `0x4d7528`: 50 animation steps per second. Draw radius advances by DRAW_DIRECTION at `0x44bfb5`.
- The terrain-erasure flag is definition+0x4c / instance+0x84. It is tested at `0x44bfb8`, in the DRAW branch, before the delayed visual eraser. ERASE_DELAY therefore is neither milliseconds per radius nor a terrain-cut delay.
- Counter comparison at `0x44c376` gates clearing the visual ring array. ERASE_DIRECTION advances that independent eraser at `0x44c399`.
- DOUBLE_UP_FLAG at definition+0x44 / instance+0x7c repeats the circle at centerX+1 (`0x44c051`–`0x44c07a`); it does not double animation speed or lifetime.

The shared UMD `public/explosion-timeline.js` drives both authoritative terrain progress and persistent host wave rendering. Earth Mover grows across its140-unit authored radius in2.8s; its first visual eraser trails by2.94s and second by1.44s. Persistent waves outlive transient particle/event caps, survive late host snapshots, clear on reset, and keep the shot active until their visual tail completes. Controller snapshots omit this host-only data.

## Explicit compatibility limits

This is not a claim of pixel-exact original engine equivalence. The old executable initializes/end-checks integer circle cursors such that the largest physical ring can be R-2; this implementation deliberately retains the full authored radius and the existing integrated2-unit-column tiny-crater mask. Copying that off-by-two rule would erase radius1 fragment craters entirely. Timing discretization is20ms with the current authoritative timestep; the visual tail includes one conservative extra tick. Original optional explosion-size settings are not reproduced. Existing tank-throw/damage equations were not reverse-engineered or changed by this timeline fix; the second Earth Mover wave remains non-erasing as authored.

Regressions: `tests/pocket-explosion-timeline.test.cjs` covers physical progress, separate delayed visual erasure, the750ms second stage, non-erasing stage safety, late host restoration, controller omission, reset and direction combinations.
