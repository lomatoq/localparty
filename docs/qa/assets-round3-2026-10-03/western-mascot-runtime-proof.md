# Western mascot / Sunset actual runtime proof

Captured 2026-10-03T13:31:49.563Z → 2026-10-03T13:32:13.404Z. Normal clock, real embedded server, two actual browser controllers per game. No injected game state or scores. No phone PNGs, no physical-device claim. Browser and temporary server closed; slot 2 released.

## Before → After

Initial real Western capture (`../live-first/`), personally opened: human v2 fallback. `../route-diagnosis/report.json` proves shared JS 404 and post-bridge fetch metadata404. Party HTML relative script resolution was correct. Root registered only the exact generated helper JS route; owned helper now uses same-origin parent fetch for shared metadata. Genuine decode/fetch errors still retain human fallback.

Final actual route: helper ready true; JS/PNG/JSON HTTP200, types text/javascript, image/png, application/json. PNG bytes1309336, atlas1774×887; actual player variants coral and turquoise. Four variants additionally rendered via actual loaded helper in clearly labelled supplemental44/240px canvas probes. These probes are not gameplay screenshots.

## Personally opened originals

- western-tv-live-1280.png
- western-tv-live-1920.png
- western-rig-probe-44.png
- western-rig-probe-240.png
- western-actual-shot-80.png
- western-actual-shot-180.png
- western-actual-shot-360.png
- western_duel-tv-live-1280.png
- western_duel-tv-live-1920.png

Four independently authored color bodies and four separate matching arms retain native aspect and transparent padding. At44px each silhouette/hat/face remains legible; at240px idle, aim and mirrored recoil arms stay attached, visible muzzle marker meets barrel tip. At actual shot80/180ms the arm pivots toward the opponent and recoil changes returned muzzle angle, with the shooter upright. At360ms the actual losing opponent rotates under existing fall timing; body/arm remain one attached rig. No coordinate adjustment was needed after live inspection.

Sunset720: rounded left/right stage clipping removed, town/sky fill field; scenery fades softly into ledger while actors/name labels remain opaque. Sunset1080 captured on DRAW: existing260ms screen flash draws a full rectangular canvas fill and temporarily exposes the right field boundary. Background fade itself is working, but this transient flash boundary is a separate pre-existing feedback-layer issue; not marked perfect. No effects code was changed in this scene-only scope.

## Source freeze and verification

report.json errors=[] and changedFiles=[]. Shared helper is explicitly hash-watched. Focused Western Duel tests4/4 pass; helper syntax passes.

- `server.js`: `0b98d8fec6e3f12477049d531916b9958908895caa4eb24b71698cdeafe20078`
- `public/assets/gameplay/generated/western-mascot-rig-v3.js`: `e578f3eb990dffb379a5e7f2d80043521fad871888e4fdc2220899cf8712ce70`
- `public/assets/gameplay/generated/western-mascots-v3.png`: `879ff5484bcb5572b9a1533ad61018dd665b58a44bd8a0f60e4fbba93f9cd810`
- `public/assets/gameplay/generated/western-mascots-v3.json`: `9d3c8df4e51e09c7c62715c949e46ddcad4a98ff1e119d1eabe48ca80c70ace7`
- `games/party/public/host.js`: `f448ad278714f1332fc3c0d84db78e0d56819041cc3d2ea5881632aa3821c1d3`
- `games/party/public/host.html`: `90b71ffb7e9c11c515340c569c3cb4d5e8250966797123315649a21a2dc0a079`
- `games/western_duel/public/app.js`: `65a102a505a950c57d4f0dd7d36e644b2fd33065ac41184df863b741ad1e6d71`
- `games/western_duel/public/style.css`: `022d59126540df34a5156e1d0927a6f093edd3bad30a95f1d45ed99f6c7f2e5a`

Generated atlas provenance and measured alpha hulls: `public/assets/gameplay/generated/western-mascots-v3-prompt.txt`, `western-mascots-v3.json`, and `docs/qa/composition-round2-2026-10-03/western-mascots-scene.md`. Original byte-for-byte atlas retained; no bitmap editing/recoloring. Source faintalpha1–7 edge noise is documented, not falsely reported as perfect-zero alpha edges.

## Sunset flash edge follow-up (supersedes transient-boundary limitation above)

Root authorized the one flash-fill adjustment. Host flash uses the same #fff0cf interior color, screen composite,260ms duration and alpha decay; only its final min(180px,18%field) fades to zero alpha, matching scenery. Phone flash unchanged. No full-canvas mask; actors, names, cue, physics, shot timing and geometry unchanged.

Fresh normal-clock real Duel raw originals in `output/playwright/western-art-2026-10-03/duel-soft-flash/`: `western_duel-tv-live-1280.png`, `western_duel-tv-live-1920.png`, and `western_duel-tv-draw-1920.png`. All three personally opened separately. Actual next Duel DRAW signal measured age6ms before capture and218ms after, inside260msflash. The flash remains visible across the field interior and softly ends at the ledger, with no hard right rectangle. Both actors, name labels and signal remain visible; live720/1080 edges remain soft. Actual controller shot advanced to the next duel rather than injecting a DRAW state.

Fresh report errors=[], changedFiles=[], no phone PNGs. Browser/server closed and slot2released. New app.js freeze: `b6811f1d363caa55560a0ed52854ba9aa99141ae3fd64ba77871e2486e61baf4`. style.css unchanged `022d59126540df34a5156e1d0927a6f093edd3bad30a95f1d45ed99f6c7f2e5a`.
