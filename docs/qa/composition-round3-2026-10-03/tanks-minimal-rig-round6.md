# Local Tanks — separate matte parts and procedural tracks

Root approved native staged hull-v1/turret-v2 after opening originals. Integration is Local Tanks only. No build/install/version change: the latest human requires the all36 plus main-menu gallery review before a build.

| Before | After | Why |
| --- | --- | --- |
| One older rendered tank asset includes detailed tread/body treatment | Separate approved matte hull and turret atlases, four lime/plum/coral/cyan palettes | Keeps the new strict topdown art independent of track motion. Native measured aspects.693/.82 are preserved without stretching. |
| Tracks baked into artwork | Two canvas rounded rectangles with a repeating8×12 minimal-band CanvasPattern | No unnecessary texture PNG; independent side phases show actual rolling and turning. |
| Track animation could drift from render time | Forward displacement plus signed angular travel from authoritative snapshots | Equivalent integrated forward/angular velocity without requiring server timestamps or a wall clock. Identical stopped snapshots freeze; paused geometry recovery and reduced motion skip phase changes. |
| Artwork pivot could change barrel endpoint | Uniform turret scale from actual measured pivot→tip distance, with separate relative-angle transform | Tip reaches existing radius+13 projectile origin exactly. Simulation supplies one angle, so relative turret angle remains0. No invented aim or gameplay changes. |

Generated hull optical width differs from the intended.8 reference. The track layout deliberately uses the agreed nominal reference width2.8r, centers±.46 referencewidth, width.18 referencewidth, length.88 hullheight. That preserves totalfootprint3.08r×3.5r near the prior3.1r×3.5r, keeps tracks overlapping the narrower native hull and avoids either stretching art or shrinking the tank. Turret pivot/actual cannon-tip metadata compensate unequal cell padding. Actors/hitboxes/speeds/turn/firing/recoil/controls/world projection/cap exclusion and rounded U recess are unchanged. No mascot image returns. No shared PartyArt, Arsenal, Pocket Siege or321-item catalog edits.

Runtime files: host.html loads local tank-rig.js; host.js observes snapshots and draws the new rig before its established asset fallback. Approved copied atlases and derived metadata live under games/tanks/public/assets/tank-rig-v1. Original generated binaries remain exact copies of staging hull-v1/turret-v2. Root added these three assets to canonical provenance watching.

Meaningful tests:13 passed across tanks-rig-motion, tanks-boundary-shape and tank-visible-playfield. Motion suite proves all8 existing player-color hue families map to approved palettes; forward/reverse travel; opposite-phase idle turning and angle wrap; stopped/paused/reduced/respawn freeze; equal travel at varied snapshot cadence; human/bot/boss uniform footprint and exact physical muzzle. Reverse travel is unit evidence, not a claimed live reverse control. Existing authoritative bounds tests retain human/bot cap pressure, auth/stale/reconnect, recovery and paused snapshot checks. JS syntax passes.

Final actual normal-clock proof: `output/playwright/composition-round3-2026-10-03/tanks-minimal-rig-confirm/report.json`, finished2026-10-03T15:13:57.109Z, changedFiles[], errors[],2 TV compositionScreens,108 actor/rig samples. Real browser controller plus4 real built-in bots provide all4 palettes without injected simulation state. Original TV1280×720,TV1920×1080 and full1200×1020 production-rig44/80/240 preview opened individually. The preview executes the actual local production Canvas rig using copied approved assets; its display samples do not enter the live simulation.

Actual Forward/Fire release passed. During Forward movement both phase deltas agree; idle steering produces opposite side travel. Paused1280/1920 resizing preserves every track phase before/after, even while a queued authoritative angle update arrives. Cap bounds settle before movement resumes; actual nonhost/invalid/stale packets are rejected; actual TV reload preserves world geometry. Existing static wall stops the driven human before direct cap contact; direct cap-pressure remains authoritative-test evidence. No hidden actor-envelope sample. HUD recess and names/health are visible at both sizes. No phone screenshot/physical-device validation claimed.

One correction batch preserved honestly: initial `tanks-minimal-rig-final` passed motion/geometry but palette classifier mapped cyan to plum and yellow to coral, so only3 live palettes appeared. Its fixture preview also used720 viewport height and cropped the240 row. Corrected only hue-family mapping plus an8-original-colors test, and the preview viewport height to1020. Initial raw evidence remains unchanged. Final confirmation above has all4 actual palettes and all12 preview cells.

Frozen SHA256:

```
games/tanks/public/host.js 4b992ace2079b129454a58993fd9a42731046e1d2c6250aa14708b2bd5d22c6e
games/tanks/public/host.html 6b851818999ad59a6193d4bf526df7831eaf5e6994ee244be39012b68f2a7b02
games/tanks/public/tank-rig.js 520ad6304e52d11ea65da84d7b54c6d88d2ad6fe5200f3e59a07c10143fbba88
games/tanks/public/assets/tank-rig-v1/manifest.json 8b9f79b0bd901e907c9d8af822ba89549785619240a9c7e3db8f41b7c74370c9
games/tanks/public/assets/tank-rig-v1/hull-atlas-v1.png 8b3d312a7b295674e06be7b990b4c103b787bf7d8ed449cce267cf7c67f499e6
games/tanks/public/assets/tank-rig-v1/turret-atlas-v2.png 5fedd30b67c6c9ff1a34dd811fa7278e0de109ddd8681cee505ff8618fbd4046
tests/tanks-rig-motion.test.cjs c0a149da0ab8441b3ef5956c278e7a410f13cdb1f6f0814d6d3ecca5013e1bc0
tests/tanks-boundary-shape.test.cjs 00b2cbd2d10ad120a17893175e8f08070d190c28aeecf33648a696f3415cda29
games/tanks/server.js dcc0052dcd357d0cc8bb693d719bce9c6f55d640ddec148a6baebea78bfcf16f (unchanged)
```

Browser/server closed; slot2 released. No further product edits planned. Root final gallery approval remains a separate human step before build.
