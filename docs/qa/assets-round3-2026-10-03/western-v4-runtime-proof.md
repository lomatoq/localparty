# Western v4 art and runtime proof

This round supersedes v3 for One Shot Western and Two at Sunset only. Tank artwork and gameplay rules are unchanged. Group06 owns Party host integration; this worker owns the v4 atlas/helper and Duel presentation integration.

## Before → after

- The rejected v3 body had a visible shoulder socket/front arm problem. V4 uses four separately authored colors, a continuous quarter-turn torso without a near arm, and matching bare arm/pistol sprites drawn behind the torso. The joint is buried beneath the silhouette.
- A rotated upright body was insufficient for defeat. V4 blends into an authored horizontal closed-eye lying pose; contact bounds keep it on the same ground baseline. Shadows use the actual rig ground anchor rather than an offset below the feet.
- False starts now use an authored startled/soot expression and separate empty hand. Existing burst effects, aim/recoil timing and muzzle hook remain in the engine.
- Duel scenery has a soft right edge behind its UI, with square/unclipped stage edges. The 260 ms DRAW flash uses the same soft background edge, without masking actors, labels or cues.
- Group06 widened the name → reaction/status gap. The real shot screenshot has a readable name and separate 20 ms bubble.

## Generation and provenance

All raster changes used built-in image generation with transparent background. No programmatic background removal, alpha repainting, hue wash, or bitmap cutout processing was used. The atlas files are byte-for-byte copies of selected generated originals. Frame bounds/contact hulls were measured from original alpha; runtime uses native aspect ratio.

- Body original: `/Users/hlebhlyaba/.codex/generated_images/01a100eb-2b5c-7533-b152-96f37575dd91/exec-a2d3162e-734b-476a-a653-474d7adeeae6.png` (1448×1086 RGBA; 4 colors × idle/dead/startled).
- Arm original: `/Users/hlebhlyaba/.codex/generated_images/01a100eb-2b5c-7533-b152-96f37575dd91/exec-6ec660e2-2c46-4098-9dd0-80ed12fa150f.png` (1774×887 RGBA; 4 colors × pistol/empty hand).
- Exact generation/edit prompts and rejected predecessor paths: `public/assets/gameplay/generated/western-mascots-v4-prompts.txt`.
- Native measured frames, alpha padding/contact hulls, pivots and source provenance: `public/assets/gameplay/generated/western-mascots-v4.json`.

## Actual verification

Fresh normal-clock real engine capture: `output/playwright/western-art-2026-10-03/v4-fixed/report.json`. Two actual connected controller players; no state/score injection. TV originals at 1280×720 and 1920×1080. Browser/server closed after capture. No phone PNGs.

The fresh report has `errors: []` and `changedFiles: []`. The v4 helper, metadata and both PNG routes returned 200; native decoded dimensions matched metadata, and both engine renderers reported v4 ready. Four-color 44 px and 240 px rig probes are supplemental actual-helper rendering evidence, distinct from real gameplay screenshots. Their joints, native aspect, mirrored arms, startled state and lying poses were opened and inspected individually.

Opened real originals include both main TV sizes for both games, Western actual shot at 80/900 ms, real early-shot exploded state, Duel DRAW flash and real defeated reveal. The actual Duel DRAW capture spans 4→204 ms within its 260 ms flash. The defeated reveal reports `fall: 1`, `pose: dead`; shadow baseline stays under the horizontal body. Actual Western names/status do not collide. Duel background and flash fade softly behind the right UI rather than presenting a hard rectangle.

Focused verification: `tests/western-mascot-v4.test.cjs` **2/2 passed**, executing the actual helper through 192 combinations (four colors, early/normal, three fall stages, four shot ages and both directions), plus loader failure fallback. `tests/western-duel.test.js` **4/4 passed** for schedule, reaction, nonce and late-join rules.

The initial `v4-first` capture failed with an undefined `early` draw local. It remains preserved and is not accepted evidence. The helper destructuring was repaired before the complete fresh `v4-fixed` run. Syntax checks alone did not establish this fix; actual helper runtime tests and fresh browser shots did.

This evidence covers these two engines and browser TV rendering. It does not claim all-catalog completion or physical device validation.

## Frozen source SHA-256

| Source | SHA-256 |
|---|---|
| v4 body PNG | `4bb1dc5e5916fe84be5017f19fc940d747ded916a42082cda6f87cdc0c594e46` |
| v4 arm PNG | `f9a3cf6b79d115fb90c3cf5a5a0cdbaf6e5d8b2b48e279035550fc5b329c8f30` |
| v4 metadata | `4a73e7034c0ead1926f3cba66024bc0d26508197442f68d677e95a58098da157` |
| v4 helper | `e66a7d93a756084ca73e707c24b322e2d134736707ad70e0ce3279c2adff3013` |
| v4 prompts | `b563ee725844652af46b14a755b84f5f43a7e54897d2f3cf107771a6400adad1` |
| Duel app.js | `2160a1a345bdeb670698b44b3223c7f3d0fec696f73f18e99bd5e98e19619efa` |
| Duel style.css | `022d59126540df34a5156e1d0927a6f093edd3bad30a95f1d45ed99f6c7f2e5a` |
| Party host.js (Group06) | `19a48daa4c7e1aaf060c3190c20aae6d7fd72b66942a9d63a780a820553c4bf8` |
| Party host.html (Group06) | `31894a48b9663a9fceb8cc346a8ceaebf3d3c067753ee2e9a870d448757f7c57` |
| server.js (root) | `e85fb1fb5d4681c15e318e093e1eab09f6796bcc92d9bcb855287f3579b35ef6` |

The fresh capture report includes the complete shared source freeze for independent review.
