# Curling seating correction — 2026-10-04

Only `games/sports_siege/public/spectator-crowd.js` changed. Existing uncommitted arena and scene changes are retained.

| Before | After | Why |
| --- | --- | --- |
| Chairs aim at world point (0, 30), down the rink | Both stands face directly inward using slot.side | Rows now face the active sheet. |
| Camera-facing cutout centered inside its chair | Camera-facing cutout sits ahead of chair horizontal view extent + 0.018 m | Its own cushion/back cannot cut through the silhouette; depth testing with other rows and barrier remains active. |
| Fixed inward cutout trial became narrow at distant gameplay angles | Retain camera-facing illustration and original grounded hip/foot anchors | Faces remain readable without changing camera behavior. |

Baseline inspected: `output/playwright/integration122-review/curling/01-aim-tv-1080.png` and `03-sweep-tv-720.png`.

Final evidence: `output/playwright/polish123-curling/`. Six originals individually inspected: aim and real swipe/sweep at 720/1080, plus left and right audience detail views at 1080. Detail views temporarily redirect the camera in the capture harness only, then restore it; no engine snapshot or score injection. Chairs face the sheet, audience remains legible, and no own-chair strips through bodies appear. Nearer rows and barrier occlusion remains natural. Ice and active play are retained.

Runtime geometry assertions passed: 480 seats, 129 people, 5 loaded variants; chair direction error 0.004996 (backrest lean), minimum plane/chair horizontal clearance 0.017999 m, footGapMax 0. Source syntax passed and Impeccable detector returned []. No new GPU resources or meshes were introduced; fixed chair orientation computed once, existing person matrix update retained.

All six image hashes verified. All four source hashes match capture-start and after-stop; details in `independent-review.json`.

The capture process was intentionally interrupted at parent direction to avoid overlap with heavy parallel captures, after all six required screenshots were saved, during viewport restoration. The original `report.json` retains failed status; `independent-review.json` separately records passed visual/geometry review. An earlier run failed before images with environmental WebGL context loss. Neither failure is presented as a successful complete harness run. Texture upload warning already exists in the prior Curling baseline; shutdown WebSocket warning followed cancellation.

Spectator source SHA256: `0539e173d97607ce29152f60b5c1a09436b22e96e73df0d0a297eba0d1d28645`.

Limits: no physical-TV GPU/fps claim, no complete all-camera/celebration acceptance. No physics, input, scene-curling.js, arena, camera, build, install or commit changes. Browser and local capture server closed.
