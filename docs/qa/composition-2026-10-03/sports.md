# Sports, archery and shooters — composition/material batch, 2026-10-03

Status: root approved implementation. No fresh-browser acceptance yet; maximum three QA browsers and root slot grant apply.

## Actual inspected baseline

Opened all five `*-tv-gameplay.png` and all five `*-phone-gameplay.png` originals for bow_club, curling, bowling, swarm_gate and peek_shoot from final-catalog-1734. Also opened current Swarm coral turret, long left wall and closed gate source rasters. Existing Curling/Bowling phone task → position/spin → swipe/power grouping is retained, as are Fire/ability above aiming, whole white-flag guidance and fading Pause/Lobby.

| Game | Primary path / current problem | Composition and visible material |
|---|---|---|
| Bow Club | Targets and four tracking markers lead. The logo/time float on bright sky, while the score row is detached; phone has useful aim→draw flow but little archery identity on its readout. | One compact timber/range heading at one top anchor, existing score row centered and related to playfield, restrained target-ring/fletching edge. Keep all AR marker bitmap positions, board/camera mapping and Draw behavior exact. Existing phone readout receives the same authored timber/enamel, not a box around the aim canvas. |
| Curling | Full rink/stone leads; remote left logo/phase and right team/end/turn metrics currently remain separate surfaces. Phone station is coherent. | One grouped local match masthead: logo/phase and real teams/end/time on one readable contour. Existing sliding score drawer material echoes frosted rink equipment. Preserve phone station topology, swipe/power and sweep/offturn availability; add recognisable quiet frost/house-ring seam to the station outer panel only. |
| Bowling | Full lane/ball/pins leads; detached phase and frame/time corners fragment information. Phone station is coherent. | Same local masthead family, with frame/throw clock next to phase and concise state copy. Walnut lane-equipment material, short brass lane ticks. Score drawer keeps actual tied places and frame detail. Phone launch station keeps full controls; material is on outer backing, not sliders/buttons. |
| Swarm Gate | Current bright repeating cyan bricks dominate tiny enemies/turrets. Wall/gate have discontinuous pillars/fringes and horizontal white lines. Actual turret bitmap aspect is correct, but orthographic projection squeezes every sprite. | Quiet flat courtyard behind actual attack lanes, connected long wall halves and central gate in the same cartoon plum stone/brass family. Correct projection span/aspect, preserve actual world/aim positions, measured sprite pivot and 16 color textures. One compact defence masthead groups wave/on-field/swarm/gate health; no detached oversized gate box. Names/points remain readable in score drawer. |
| Peek Shooter | Flat meadow/covers/characters form a coherent orthographic scene; two detached HUD cards remain generic violet. Phone actual actions/aim already work. | Preserve meadow/cover/target coordinates and all effects. One timber-gallery masthead groups task, real time and streak; leaf/crate-edge detail only. Same material on existing phone status and score drawer; white flag stays whole, Fire/MG order and actual states unchanged. |

## Exact Swarm source diagnosis and safe correction

`host.js` constructs `OrthographicCamera`, looking from `[0,30,22]` to `[0,0,-8]`. `resize()` computes left/right from `height * width/height`, then top=`height/2+6`, bottom=`-height/2`. The actual vertical extent is `height+6`; horizontal extent still derives from `height`. At the usual height30 this forces sprite Y to 30/36 of its intended screen aspect. `flatAsset` already uses `THREE.Sprite`, so rotating turret planes onto the ground or regenerating 16 correct color textures would misdiagnose the defect.

Keep the current vertical framing/center and compute horizontal span from the same complete vertical extent. For Swarm, totalHeight=baseHeight+6, centerY=3, top=centerY+totalHeight/2, bottom=centerY-totalHeight/2, left/right=±totalHeight*aspect/2. This preserves visible vertical world and makes projection units equal. Existing engine positions, aim mapping, collision, projectile events and turret pivots remain unchanged. If field balance needs a narrower framing, change both extents together after the actual capture; never non-uniformly scale sprites.

Replace only current decorative floor construction (CanvasTexture eight-row cyan bricks) with quiet desaturated lavender/sand courtyard paint and sparse low-contrast ground seams. Do not introduce obstacles, numbered lanes or false targeting geometry. Gate/wall use correct source proportions and grounding alpha bounds, connected endpoints, no illuminated white strip. Existing gate damage/repair semantics remain visible. Sprite silhouettes must remain in front of the courtyard and repair feedback remains readable.

Current wall texture ratio is about6.875 while assigned world ratio44.475/5=8.895; gate ratioabout1.695 while assigned7.2/5.2=1.385. Preserve native silhouette ratios through measured alpha bounds rather than forcing both assets into unrelated rectangles. New replacement raster assets require built-in Imagegen true transparency, exact prompt/provenance and project-local copies; no chroma-key/programmatic cutout. Current 16 individually authored turret texture colors remain.

## Owned implementation and exclusions

Own local presentation in games/bow_club/public and games/sports_siege/public: host.html/js, style.css, sports-controls.css and explicit existing-surface preserve markers. Shared parent cap/application remains shared_hud. CSS tokens follow materials.md/json. Mark locally authored material surfaces `data-hp-theme-preserve` to stop the old heuristic adapter's !important backgrounds from replacing the new paint. No new decorative containers, button redesign, input handlers, engine/physics, translations, native/menu/source-version changes.

## Bounded verification

After the source batch, one detector run over changed UI targets; existing focused mechanics tests are used only to check preserved behavior. After root slot grant capture actual 1280/1920 TVs and402/320 phones through real launcher/bridge, with authoritative phases: sports own aim/nonzero held/release, rolling/pins/count/final-end, same-team sweep/energy and observer; Swarm attack/repair, real heat/pulse, 4/16 turrets; gallery friendly/streak/manual MG and observer; Bow touch and camera permission fallback. No fake image-only mockup accepts gameplay.

Each opened capture records hierarchy, group attachment, visible material identity, text contrast, full action/footer, alpha edge/seams and world/sprite proportions. Director receives originals and before/after source hashes. One grouped correction then one confirmation is the implementation budget; fresh user evidence takes precedence. Physical-device validation stays separately unverified unless performed.

## Implemented source freeze (before first actual render)

Five existing surface families now use the materials matrix; sports host logo/phase/metrics share one centered top-anchored masthead. Curling contrast drawer remains ice, phone topology/actions remain unchanged. Four v4 images carry exact embedded generation prompts and measured alpha bounds in assets/swarm-v4/manifest.json; RGBA equality against original Imagegen files is true after metadata insertion. Original full-image pixels are retained, no crop/key/cutout. Wall halves and gate use measured native image aspect and visible bottom anchors at the actual floor plane y=-.30. Orthographic horizontal extent now derives from the complete vertical extent; no turret texture changed. Source digest inventory: sports-source-freeze.json.

One mechanical detector invocation found five incumbent legacy rules: old three-pixel header accents, old width transition, old player-card accent pseudoelement (already disabled on TV), and existing Bow Draw pressed-depth shadow. These are historical/overridden or established action feedback; none belong to newly added material recipe. Detector command did not support --report and treated the report path as a missing target; output was reviewed directly. No second detector run, no approval claimed from the tool. Real render and director evidence remain pending slot.

## Final bounded evidence and closure

Sources frozen and slot2/browser/server released. `sports-source-freeze.json` was read back against current files and all14 digests match. `sports-final-evidence.json` includes full final report hashes and exact limits.

| Evidence | Actual output | Result / critical disposition |
|---|---|---|
| First five-game action/world pass | `output/playwright/composition-2026-10-03/sports-first` | Curl40/Bowl28/Peek28/Swarm36/Bow12 originals, errors empty, owned/shared stable; real actions and ten Bow arrow releases. Named generic-display-card paint defect found. |
| First attempted conflict correction | `output/playwright/composition-2026-10-03/sports-confirm` | Same real action/state guards pass; actual screenshot still showed generic nested card, so this was rejected as visual acceptance. Generic :is contains `.panel:has(>#board)`, giving the whole list ID specificity. No claim that a passing bounds test fixed paint. |
| Final exact cascade repair | `output/playwright/composition-2026-10-03/sports-material-final` | Four games16 originals total, true TV1920/1280/native402/320, owned/shared unchanged, no page errors. Computed heading backgroundImage=none and authored score materials independently asserted. Actual original files opened verify one cap and local material visibility. Bow first/confirm files remain source-current. |

The unresolved same named cascade failure required a precise repair to real sports IDs after the first attempted class-only override failed. Final selector uses the real title and gate IDs for the cap and existing scoreboard ID for rows; no new markup/state/mechanics. No further polishing batch is planned.

Personally opened final current Curl TV720+phone402, Bowl TV720+phone320, Peek TV720+phone320, Swarm16 TV720/1080+phone402. Also opened source-current action/world components in first pass: Curl own320, Bowl own402/rolling320, Peek activeMG320, Swarm16 phone320, real gate approach97% and damaged45% originals. Bow TV1280 and both complete native phones opened. These show coherent station hierarchy, full footer, preserved minifield and four TV calibration markers, readable enemy silhouettes, native turret aspect and connected nonfringed wall/gate.

At actual gate0 the app immediately displays shared results, so gate-open live-world visibility is not proven; damaged gate was naturally observed. All four generated assets retain genuine alpha and exact unchanged RGBA pixels with prompt metadata, measured silhouette/aspect and embedded provenance. No fabricated scores/states used. Physical-device, actual camera permission/tracking and App Clip flows are not verified by browser simulation.

## Latest named Bow Touch gap correction (supersedes earlier Bow freeze only)

Root independently identified a~103px deadband between the mini-field and Draw on live402. Exactly `games/bow_club/public/style.css` and `phone.js` changed. The existing touchPad dimensions and normalized pointer mapping remain unchanged. A ResizeObserver presentation variable anchors the existing Draw row20px below the measured pad bottom; camera mode retains its full preview/placement. Overlay drawing now clips only the meadow and targets to the incumbent24px touchPad radius, restoring canvas state before the reticle/charge ring. No input handlers, draw/release rule, TV, marker/target geometry, sports source or sprite assets changed.

First measured proof exposed inherited16px row padding (actual36px gap), corrected within this named batch. The next assertion incorrectly required19–21px during the already-existing held transform; actual held21.54px is within root's16–24 requirement. Only the QA tolerance was corrected, preserving held feedback. Both rejected attempts are retained under bow-gap-final/bow-gap-diagnosis/bow-gap-confirm, not called acceptance.

Final proof: `output/playwright/composition-2026-10-03/bow-gap-final-proof/bow-touch-report.json`. Twelve TV1920/1280/native402/320 originals; idle gaps20px both, held21.54px/21.26px, whole actions in iframe bounds, errors=[], owned source changes during run=[]. Ten real pointer aim/draw/release arrows reached authoritative results. Personally opened all four controller/draw-held402/320 originals: rounded field and button read as one group, footer whole and native gradients retained. Browser/server closed; slot2 released. Actual camera tracking/permission and physical-device proof remain separately unverified.

Latest exact two-file freeze: bow-gap-source-freeze.json. Latest combined15-file sports/assets digest readback: sports-current-source-freeze.json. Earlier sports-source-freeze.json is historical for the prior material batch; its Bow style entry is superseded by this named fix. No more production edits planned; director has exact current originals for independent review.
