# Group02 — generated human spectator assets

Five separate transparent human cutouts were generated with the built-in image_gen tool and `transparent_background=true`. Exact prompts and original tool paths are in `group02-spectator-art-prompts.json`; URLs, alpha measurements, SHA hashes, visible bounds, estimated hip anchors and seat data are in `group02-spectator-art-manifest.json`. The generated alpha was copied unchanged. No existing asset was overwritten.

The project assets in `public/assets/spectators-20261002/` are:

- `spectator-01-coral.png`: curly-haired woman with a compact cheering gesture.
- `spectator-02-teal.png`: man with both hands resting on his knees.
- `spectator-03-violet.png`: silver-haired woman with glasses, clapping.
- `spectator-04-lime.png`: young man giving a thumbs up.
- `spectator-05-lavender.png`: bearded man waving.

All five are 1254 × 1254 RGBA with genuine alpha from 0 to 255. Each original was critically inspected: head, hands, hips, knees and shoes are complete; no chair or background is baked in. Matte palettes, outline weight, restrained folds and the slightly elevated three-quarter front view align. The director confirmed the coral original as the style reference; scene approval remains separate.

The square texture contains a narrower human silhouette: the visible aspect at alpha ≥ 32 ranges from 0.461 to 0.578. Preserve the square plane, then scale uniformly from hip to sole to fit the actual chair height. Do not squeeze the texture to a 0.6 × 1 plane or anchor it at the image centre. Hip UV values are visually estimated; owner 10 must tune them against actual chair and camera originals. Sparse pixels with very low alpha remain from generation; runtime alpha testing can suppress faint fringes without rewriting the assets.

All five face the camera in a three-quarter front pose, with knees projecting toward camera-right. Billboards should rotate only around the vertical axis at the hip. Static chairs face the rink, so owner 10 must inspect chair and sprite alignment throughout the camera track. The asset reference `public/assets/spectators-20261002/reference.html` uses unchanged originals at 96, 64 and 32 pixels. Outfit and gesture masses remain distinct at the larger scales; facial detail is not claimed for distant 32-pixel spectators. No live game capture was performed in this art scope.

One repeated chair asset was authored with owner 10's agreement: `games/sports_siege/public/spectator-seat.js`. It has a rounded violet shell, inset back padding and cushion, four dark round legs, support posts and a brace. Local front is +Z; the origin is the floor and the cushion surface is 0.32. Actual width is 0.512, below the 0.61 row pitch. It uses 10 meshes, 6 shared geometries and 4 matte materials; resource ownership and disposal support prototype cloning. Runtime geometry checks confirmed floor grounding, cushion height, row clearance, cloning and idempotent disposal. No build was run.

Group 02 changed only new assets, reference/provenance files and the standalone chair module. No host, scene, server, gameplay or physics file was edited. Group 10 owns renderer integration and actual camera, seat and crowd evidence; root owns user acceptance.
