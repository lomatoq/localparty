# Push Pit sumo artwork — round 5

Scope: Push-only replacement artwork/helper. Group06 owns Party integration and actual gameplay/input verification. Other mascot renderers, Western/Duel, physics, names and ghost timing are unchanged by this asset work.

Root independently opened the native candidate and approved its overhead direction before promotion. The production atlas contains four rounded human sumo wrestlers viewed from above, black topknots, two natural arms, fully covering lime/plum/coral/cyan mawashi. No backdrop, floor or contact shadow is baked into the PNG. All cells have at least 54 native pixels of alpha gutter. Crown rather than face is visible; canonical facing is UP.

Generation used built-in `image_gen`, `transparent_background: true`. Original: `/Users/hlebhlyaba/.codex/generated_images/01a100eb-2b5c-7533-b152-96f37575dd91/exec-2a1d363a-2fdb-4c2a-a4df-b29642401fe5.png`. Production PNG is a byte-for-byte copy, 1254×1254 RGBA, alpha range 0–255. No programmatic background removal, recoloring or alpha editing. Exact prompt/provenance: `public/assets/gameplay/generated/push-sumo-v1-prompts.json`.

Initial generation, measurement and helper were staged under `output/imagegen/push-sumo-round5/` while the full catalog capture was running. Product assets were promoted only after root released the source freeze.

The actual WebKit fixture decoded the original RGBA atlas and rendered every variant at 44, 80 and 240 px through the actual helper with native aspect ratio. Original: `output/imagegen/push-sumo-round5/probe-44-80-240.png`; structured result `probe-report.json`: `errors: []`, `ready: true`. The image was personally opened: belt colors, head/topknots and fists remain readable; no clipped limbs, floor halo or torso holes. This fixture is art verification, not a claim of gameplay acceptance. Browser/server closed and slot 2 released.

Actual helper preflight exercised 48 combinations: three sizes × four colors × four rotations, finite draw coordinates, one complete-sprite draw, native dimensions bounded by diameter. No bitmap transformation was used for the probe: canvas sampled native atlas frames directly.

Integration API: `window.PushSumoArt.draw(ctx,{x:0,y:0,radius:p.radius,color:p.color,rotation})`; returns null while unavailable and `{ready:true,variant,nativeFrame,width,height,rotation,bounds}` after successful decode. `.ready` and `.metadata` allow actual-render gating. Caller retains existing alpha/squash and separate top-down contact shadow. Color maps deterministically to authored belt hue; no runtime repainting. Facing angle 0 points UP; directional rotation can be `atan2(vy,vx)+π/2` and retain last direction below low-velocity threshold. Strictly Push-only integration preserves other game art.

Frozen SHA-256:

| File | Hash |
|---|---|
| `push-sumo-v1.png` | `f10adb6abcaf46a53fc63afb2353d64a5f08e37cebdf8b4c393d85387fdfc07c` |
| `push-sumo-v1.json` | `3a34dee31c2644d9b64afc0cd51f15b1339d0a61dda1ba6f415a3f7a024f7003` |
| `push-sumo-art-v1.js` | `8fcaab03f7556e38a74940b1522083fcb4ec0a880b30fbfae92a169a50902e42` |
| `push-sumo-v1-prompts.json` | `389a77460c0e765231c948f3fd85f556de3bf884d68ee526efb8c348d4f004c8` |

Actual normal-clock Push gameplay, controller motion/release and ghost proof are owned by Group06 and remain a separate acceptance step.
