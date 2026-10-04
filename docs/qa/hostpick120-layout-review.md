# Build120 — Our People and Host Pick isolated layout assessment

Final status: PASS for the requested photo, count and shared material in12 fresh individually reviewed originals. Initial findings and user-directed material revision are retained below as history.

Scope: Impeccable layout assessment only; no product UI edits in this lane. Baseline first, then one final confirmation batch. Actual normal-clock launcher with an actual nonsquare diagnostic image uploaded through the browser controller; native choiceStrip uses its existing public bridge API with a real launcher snapshot and is explicitly labelled simulation. Not physical iPhone/AirPlay evidence.

## Baseline

Eight original PNGs individually opened: TV1280×720/1920×1080 and native393×852/320×568, each with one actual human (insufficient for Local Tanks min2) and two humans (enough). Source before/after equal, page exceptions/resource400+ errors absent. `output/playwright/hostpick120-baseline/report.json` records exact CSS/source hashes and computed geometry.

Confirmed defect: `#players .avatar.has-photo` clips its own overlapping initial badge because overflow is hidden; its actual uploaded image decoded, but data-initial is absent and ::after content is empty. Parent player and players list overflow are visible. Photo ring/crop should belong to the image, while the identity badge must remain outside the photo wrapper crop.

TV Host Pick currently communicates static 2–16 players for either roster. Native pick communicates 1/2 players when insufficient, 2 players when enough. TV material is a low-opacity green gradient/rim; the approved native has a violet/blue main gradient, right lime bloom, rim and separate after material. This is an identity/material mismatch, not an insufficient-space problem.

## Spatial thesis and independent assessment

Operate surface: current host selection leads within the selected-game strip, the player count supports launch readiness, and the roster is a separate secondary group. Keep existing capsule topology and approved material, with tight title/counter grouping and generous gaps between strip, catalogue and roster.

Reading order: game image/title lead, supporting count sits adjacent; the TV static range currently describes limits instead of current readiness. Grouping: TV title and instructions share the strip; phone title/count/action form a clear group. Rhythm: TV strip66px high at720 with24px separation from catalogue title; phone strip67.875px with clear masthead spacing. Structure/density: a narrow selected-game strip is appropriate; no new containers needed. Adaptation: at320 the phone reduces capsule width to288px and wraps the large hero heading; strip identity/count/action stay whole. At1080 TV scales the same groups without collisions. Extremes: long actual human name ellipsizes within roster; uploaded-image corner badge clipping is reproducible. Touch targets: native Start remains above44px, with no clipped action at320; keyboard/focus and physical safe areas are outside the captured test scope.

First after batch: all eight complete originals individually opened. Actual badge A is now whole; image stays a circle, wrapper overflow visible, image clipping retained. TV actual roster count changes 1/2 to2 after the second real browser human joins. Both numbers use KardiaFatRunner17px/900, denominator opacity0.75, slash KardiaFit14px/500. The approved native material now appears on TV with a themed rim; capsule geometry is preserved. No page exceptions/resource400+ errors/source drift or horizontal page overflow.

One narrow regression found: native320 insufficient meta label was cropped after denominator grew. Meta width110.39px versus115.91px content; the last approximately5.5px of players disappears. Native393 and enough states remain whole. Root notified for one final narrow fit fix; final approval is pending that confirmation.

## Bounded confirmation — photo/count PASS; material acceptance reopened

All eight final complete originals individually opened after the single narrow320px spacing fix. Native320 insufficient now shows full `1 / 2 players`; meta width108.90625px, label right195.90625 equals meta right195.90625, no cropped glyphs. Native393 meta115.90625px. The label remains14px under the existing readable-control rule; the gap reduction fits it without shrinking the bold digits or Start target. Enough state shows full `2 players` at both widths. TV720/1080 shows `1 / 2 players` then `2 players`; DOM textContent omits a literal gap before label, but CSS provides visible spacing (6px at720;9px at1080). Visible spacing is confirmed; screen-reader behaviour was not tested.

Photo initial A and full circular badge are visible on bothTV sizes. Actual photo image remains50%/circular; the avatar wrapper is overflow visible. No collisions between photo/name or pick count/instructions; logo/title lead, count supports, roster remains separate. Capsule geometry is retained. The first material revision is recorded in these captures; the user subsequently requested a broader lime fill and icon-side game-colour transition. Material acceptance is therefore reopened pending that explicit steering.

Final capture/source evidence: `output/playwright/hostpick120-confirmation/report.json`;8 PNG SHA hashes verified; all9 scoped product source hashes match before/after/current; no page exceptions or400+ responses; no horizontal page overflow. Baseline/first-after evidence retained separately, including the resolved320 crop. Natural participant-join toast may be entering/exiting in these normal-clock screenshots; that animation is outside this scoped change.

Keyboard/focus, physical safe areas, installed native runtime, alternate locale strings, bots and over-cap rosters are not demonstrated by this screenshot batch. Root owns source review/tests and the mechanical detector; this lane owns the isolated rendered-layout assessment. No further change is needed for photo/count in the tested states. A subsequent explicit user request reopens only the TV material fill; this is not a claim of final visual acceptance for that fill.

## Explicit user steering — final material confirmation PASS

After the user requested broader native-style fill, twelve new full originals were individually opened: the full8-view Local Tanks matrix plus directed One Shot Western TV1280/native393 and Pocket Strike (catalog id bowling) TV1280/native393 pairs. The TV background now has full-height themed colour at the image/title side, a broad lime right half, and vertical shading instead of only a coloured rim. On Western the left fill is warm#ffac43; on Bowling it is violet#b493ff. All three TV/native ::after computed backgroundImage strings are exactly equal within their corresponding theme pairs; see material-comparison.json. Visual comparison also confirms the spread fills the interior and retains legible title/counter.

Photo/count acceptance remains intact in the fresh8-view matrix, including complete native320 insufficient label. All12 final image SHA hashes and all9 scoped before/after/current source hashes verified; source drift, page errors, resource400+ failures and horizontal page overflow absent. Native bridge is simulation; screenshots do not imply physical iPhone/AirPlay acceptance. The directed Bowling fixture has one actual player and is sufficient for that game's min1; the directed pair tests colour/material, not an insufficient roster.

Final gallery: `http://127.0.0.1:17809/hostpick120-material-final/index.html`. Captures: `output/playwright/hostpick120-material-final/`, `hostpick120-material-western/`, `hostpick120-material-bowling/`. Initial rejected material and resolved320px clipping remain preserved separately. No product edits, build or Git operation performed in this lane.
