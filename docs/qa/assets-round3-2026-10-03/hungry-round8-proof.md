# Hungry Arena: generated color, stable food and full TV backing

Hungry Arena only; normal real engine/browser inputs; TV originals, no phone PNGs/physical device claim

The old sprite tint mask colored only side limbs. New built-in generated1774×887RGBA atlas has8 complete full-body color variants matching the existing8 engine colors. Original PNG copied byte-for-byte, native alpha retained; all8 cell edges have0 alpha≥8 pixels. Bounds use threshold8 and4px crop padding; native aspect preserved. Exact prompt/provenance are adjacent to the asset.

The simulation now gives food monotonic IDs without changing RNG order, spawning, quantity or movement. Animation phase follows ID rather than array index; the actual middle-item eat removed1/add1 and left69objects exactly unchanged. Low2.5world-unit bob remains intentional and pause-aware.

Hungry foreground clips at inverse-projected actual viewport rather than canonical world rectangle. Both local grid overlays continue through measured margins. Camera scale stays uniform, movement remains20..1180/20..700 and collision rules are unchanged. Other arcade modes and Flappy countdown remain intact.

Seven final originals were individually opened. Errors[], sourceChanged[]; all captured relevant source hashes still match. Browser/server closed.

| Original | SHA256 | Direct observation |
|---|---|---|
| hungry-2-live-1280.png | 5141dfe8bd9e482633f9b544fa44771b642b245ca99fdb8324f8f7dfa1d4e7f5 | Lime/cyan centers fully colored, mouths readable at small world scale; floor tile/grid reaches both viewport edges. Join toast still present (unrelated unchanged behavior). |
| hungry-2-live-1920.png | d2f59146dfea13faa826a2f98a9e712380c5d8cbc2fe634ca64576a0f004b5ae | Uniform creature proportions and larger mouths/eyes; full floor backing, no center rectangle seam; cap and numeric roles unchanged. |
| hungry-2-after-eat-1920.png | ca0f980366cfac3192e2a19252a8f63df574bf4a998c2f57c87efda6ee1ad731 | Actual cyan actor grew20→23; eaten donut absent and new pizza exists; other69 identities/positions/kinds unchanged, low existing per-item bob remains continuous. |
| hungry-2-left-edge-1920.png | 85f5f5b5f82c0c7a133ef6905e7bb4813ccafb6836bedd78d1bd552e7d2bbd12 | Actual cyan actor atx20,mass26 complete with shadow; no old world clip; name uses existing avoidance leader line, unchanged by this task. |
| hungry-2-left-edge-1280.png | 4f462fbfad6fa5b2d809afeccc97848dbdc6d0b2fbbd336c6119ea3e50f98757 | Same released boundary actor complete after resize; food/floor remains full frame, existing labels can change avoidance side. |
| hungry-16-live-1280.png | 116ff3d5cd2ef8e8588fe7f067c794ec12cfaec079e480d2213b91ba72a11b30 | All8 body colors visible among16 actors; mouths/body remain colored. Existing brief growth bubbles retained and can sit beside/over name regions. |
| hungry-16-live-1920.png | 741af38244d36c662d9bb29a7f67fd20f833a07dac4d87c543faf0316212bbac | All8 decoded native variants; complete round silhouettes in dense real scene. Bottom-right actor and score are inside actual viewport; existing event rings retained. |

Focused food stability + existing Carry cap tests12/12PASS. Syntax checks pass. The older arcade-simulation.cjs fixture stops at Flappy because it flaps during countdown; this pre-existing fixture mismatch is retained and reported, not weakened.

Only actual current2/16 captured states and left edge atmass26. Not all possible maximum-mass/rim positions or physical hardware. Canonical world bounds/movement unchanged.

Sources and asset metadata: [exact JSON](hungry-round8-proof.json).
