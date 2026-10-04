# Arcade / Chaos / Kart — user rejection revision

Status: local source ready and frozen for shared capture; fresh visual acceptance pending root browser grant.

Owned IDs: taprace, punchmeter, flappy, hungry, snakelines, carryball, chaos, kart. Western and Mine Together belong to other owners.



The earlier acceptance above belongs to its captured source and is superseded by the user's new composition direction. Local files are revised; no new visual pass is claimed yet. Shared header remains screen-top attached with a rounded bottom; local data groups no longer introduce dash trims.

| Before | After | Why |
|---|---|---|
| Tap track starts at world126 with only24px below; independent outer light/dash bars. | Same570px lane region centered at75/75, outer bars removed; actual header clearance and close timing row. | Center the actual racing content without changing runner/track proportions. |
| Uniform arcade worlds can extend beneath the header; Hungry's remaining-height centering omits half of its top reserve. | Punch/Flappy/Hungry/Snake center uniformly below actual headerbottom+16; camera uses the midpoint of the remaining region. Carry Ball retains full-frame uniform fit behind the cap with measured exclusions for names only. | Keep active world objects visible and center the available field; preserve the explicitly requested full-height Carry Ball field. |
| Kart field+rail stretches to viewport height; cap/standings begin at top. | Stable centered whole track frame, height based only on viewport/track ratio; short rail is intrinsic cap+rows and centered as a complete group. Long rosters scroll inside the bounded frame. Cap follows actual rail bounds, measured height reserves its internal slot. | Center the entire composition without a header measurement feedback loop. |
| Kart Place/Lap labels inherit small bold sans and20px glyph limits. | Kardia Fit15–18px labels and actual existing24px stat glyph pseudos. | Clear hierarchy and readable artwork while preserving values and controls. |
| Chaos mission repeats shared calibration title in a tall decorated panel pinned above its arena. | Compact instruction/progress row, no duplicate title or dash trim, centered together with the unchanged uniform1000×600 world. | Keep the task and actual field together; do not reposition targets to disguise intrinsic gameplay space. |
| Arcade instrument readouts have decorative perimeter dashes. | Existing semantic body/rim and game-object artwork carry identity. | Remove arbitrary decoration while preserving readable stats and earned feedback. |

Syntax checks passed for arcade and all Chaos inline scripts. Fresh real TV 1280/1920 and native-route phone402/320 evidence remains pending shared-source freeze and a root-granted browser slot. No gameplay rules, controller packets, held/released input logic, motion permission, native footer or game-object proportions were changed.

Snake Lines also removes decorative outer dash bars, retaining its functional grid and the actual rectangular world boundary. Three packet/barrier checks pass.

## Named correction batch: continuous Kart ground / Flappy sky

Root authorized these two findings only after the first complete catalog capture. Opened both original TV sizes for each target: `catalog/kart-tv-live-1280.png`, `catalog/kart-tv-live-1920.png`, `catalog/flappy-tv-live-1280.png`, `catalog/flappy-tv-live-1920.png` under `output/playwright/composition-round2-2026-10-03`.

| Before | After in source | Verification status |
|---|---|---|
| Kart centered track occupies y60–660 at1280 and y118–962 at1920; plain purple/brown strips surround it. | A separate noninteractive backing canvas continues the existing ground gradient, seeded grain and tree grove into viewport margins, using the unchanged track canvas world origin and scale. | Source syntax and two barrier tests pass; new root confirmation images pending. |
| Flappy sky stops at world y110/157, leaving a full-width purple band beside the cap. | Cached decorative sky covers the full backing with the same image cover transform and tint as the existing world sky. World clipping, hills, pipes, players and camera remain unchanged. Gradient fallback also extends into margins. | Source syntax and controller packet test pass; new root confirmation images pending. |

No browser was launched for this correction. Four local files are frozen for the root's second complete catalog capture: arcade `app.js`, Kart `host.html`, `host.js`, and `styles.css`. No additional polish or shared-source edits were made.

Source SHA256: arcade app `d71cc82d3e5078ce91fe4bc806aa5ca4bff4269b5ea25ac8c273dd240e08e0b6`; Kart host HTML `956c03a6d1989759207bd50e745fb00cecd25f09417b5f661ed37344b886a66d`; Kart host JS `7ec9447a6a301e54e70b8aafde40fd15c203c92beab4959d62103de7e5e73753`; Kart styles `e39987e0a2e7ec77011811b9119bc9a504d4fe2a5703f235721a462e25f82782`.

## Named correction: Tap Race list backing

The enclosing blue-gray strip belongs to `games/arcade/public/style.css:209`, the active Tap Race `.score-panel`. Its authored fill, visible rim, shadow and backdrop blur are removed. Transparent 1px border retains the exact previous box geometry; padding, grid placement, dimensions and all four individual `.runner-row` card surfaces remain unchanged. Its existing `::before` remains suppressed. Only this local stylesheet changed; SHA256 `82b6d6699a3eff05bdba464371b593d27271843971c96d338c6c5c9f6c8bf120`. The global theme owner was notified that its Tap Race host `.score-panel` mapping also repaints a fill and must be removed in the shared batch. Fresh global confirmation remains pending; no browser launched.

## Named correction: four-driver Kart fit and final Tap rim

Opened root's new actual 1280 originals in `final-catalog-city-host-100823`: Kart's fourth card was clipped/faded inside the 600px frame, and Tap's transparent list wrapper retained a shared passive-card outline.

Kart changes only `games/kart/static/styles.css`. The main wrapper becomes transparent; the rail replaces the hard charcoal rectangle with an alpha road navy/teal gradient fading at its top and bottom. Individual card paint is preserved. A CSS child-count condition limits compact row padding, minimum height, avatars, and name/meta sizes to crews of 1–4. Crews of 5+ keep the existing row sizes and scroller. The actual track frame/world remains unchanged. Frozen SHA256 `2014e68657ddf418ab45a7ae1126e99db3cd220d4f3574d44b3a3cc225f466b3`.

Tap changes only active `.score-panel` in `games/arcade/public/style.css`: remove the inherited `hp-info-card` outline explicitly and suppress both wrapper pseudos. Existing transparent border geometry, spacing, positions and individual cards remain unchanged. Frozen SHA256 `48761c7dff95bc510f730edb820feab43e457fa28f93e03e04a6c73807ae762d`.

Source frozen; focused actual 720/1080 capture awaits the root's coordinated browser slot. No acceptance claim is made from source alone.

Focused confirmation is now complete in `output/playwright/composition-round2-2026-10-03/kart-tap-local-fit-confirm/report.json`; opened all four final TV originals. One bounded correction after the first local proof widened the compact Kart speed column from fixed70px to78–104px, resolving the 1080 three-digit speed clipping. Final Kart stylesheet hash `9944514e4e545b9af1694b294c5cc593464d949f98139eb27cccb125a90a6b4e`; Tap hash remains `48761c7dff95bc510f730edb820feab43e457fa28f93e03e04a6c73807ae762d`.

The actual four-driver proof contains complete card, long-name, score and portrait bounds. At720, fourth card bottom632.75 and score624.56 are inside rail bottom648.75. At1080, fourth card bottom873.27 and score862.27 are inside rail bottom889.27. Card opacity1 and masknone; road/scenery backing shows between individual cards. Tap wrapper computed background transparent/noimage, outline style none, shadow none, both pseudos none at both sizes. Four focused assertions pass; browser errors empty and all source hashes unchanged during capture. Shared title stylesheet remained `d7caa8359033306217afe2703dd56e065e99d36c5fdfcec6c15f7ee58d5cb649`. Summary stored in `kart-tap-local-fit-freeze.json`. Larger-roster scrolling is preserved by the CSS child-count condition; no fresh 16-driver browser claim is made. Slot3 released and root notified. The full-catalog gate remains the root's fresh global capture.

## Human-requested full-height Kart wash

The user explicitly requested that the rail wash itself span the entire screen height. The earlier intrinsic-rail wash was superseded: `games/kart/static/styles.css` now makes the rail transparent and paints the same road/scene palette with a fixed viewport `body::after` layer outside the centered card cluster. Its left edge starts fully transparent and blends horizontally toward teal/navy; it has no border, shadow or pointer handling. Existing full-scene ground remains beneath it. All card and world geometry is preserved. Final stylesheet SHA256 `f2e29ea54820fd24b4066a50e84ffdf2f8738c796cc518f8291cb788420e334a`.

One focused actual four-driver confirmation completed in `output/playwright/composition-round2-2026-10-03/kart-fullheight-wash-confirm/report.json`. Both final TV originals were opened. Computed pseudo paint is fixed top0/bottom0/right0, height720/1080 and width300/420 at1280/1920. Complete card, name, metadata and portrait rectangles exactly match the previous accepted focused proof at each size. All four cards remain whole; full-height wash and unchanged geometry assertions pass. Browser errors and changed source files are empty. `kart-fullheight-wash-freeze.json` records the paint and fit proof. Slot2 was released to root; no further source changes.

## Latest human Kart correction: stronger wash, inset cap, continuous grove

The latest actual screenshot requested stronger bottom/background coverage, a right-edge inset for the cap, and removal of horizontal scenery cuts. Earlier wash acceptance is superseded by this bounded revision. Only Kart `host.js` and `styles.css` changed. The uniform world-fit algorithm and controller/input rules remain unchanged; adding a16px grid gutter retains rail/card widths and keeps cap+rail off the right screen edge. The full-height road-colored wash now reaches72–95% alpha toward the right, with a soft transparent left edge.

The scenery defect came from three inconsistent painters: the track drew a grove, the stage apron drew only ground grain, and the fullscreen backing skipped the entire world. One world-anchored `paintTrees` helper with edge overscan now paints all three surfaces using the same coordinates, colors and track/pit exclusions. Partial tree silhouettes continue through former stage edges rather than being clipped or repeated as separate apron strips.

Focused TV-only confirmation: `output/playwright/composition-round2-2026-10-03/kart-final-tv-confirm/report.json`. Opened both actual1280/1920 originals. Fullscene rectangles are0,0–1280,720 and0,0–1920,1080. The wash measures fullheight720/1080. Actual cap right1264/1904 proves16px inset. All four card/name/score/portrait dimensions and vertical positions match the previous four-driver proof, shifted only16px left. Fourth-card bottoms632.75/873.27 remain inside rail648.75/889.27. No hard horizontal apron cut remains in either opened original. Paint/inset/retained-size/whole-four assertions pass. Browser errors and changed files are empty. No mobile screenshots were captured. Slot2 released; source frozen.

Final hashes: host JS `09b412658382ff143060f1a24c8c882ca840157df3e21d2c28df0dd4bef1255f`; Kart styles `9379a77a0c9c34199d32af45f14b5e4c10a0c16938fb8e4021350b01974faaad`; expected shared header/Naval CSS `e5aea0087b1ce8b0c3b0baae800ad54b30e2bf8641a1c595dfa1bd13f537cba7`. Final paint/fit assertion summary: `kart-final-tv-freeze.json`.

## Remaining vertical seam and Tap Race apron

The prior visual check missed Kart's vertical backdrop step at the stage's right edge. Root/director identified it in the fresh global original. The fullscreen wash was behind the stage's stacking context: the canvas erased the first softly transparent32px, and the wash abruptly resumed at the canvas boundary. Only Kart styles changed: mainzauto, stagez1, fullheightwashz2, information railz3. One uninterrupted wash now crosses the stage boundary above its backing paint and below cards. Colors, course, cap/card layout, widths, heights, and16px right gap are unchanged. Frozen styles SHA256 `721c08fd9fa54d7ae14cc010f2f552dc575e6f9d7914030bbfde23e86bdd4547`; host JS remains `09b412658382ff143060f1a24c8c882ca840157df3e21d2c28df0dd4bef1255f`.

Fresh real TV-only pair: `output/playwright/composition-round2-2026-10-03/kart-seam-tv-confirm/kart-tv-live-1280.png` and `kart-tv-live-1920.png`; both originals opened and sent to director. Computed layer order is1/2/3 with mainauto; fullheightwash remains720/1080. Exact card/name/meta/portrait geometry matches the preceding capture, all four cards remain whole, cap16px inset retained. Errors and source drift are empty; no phone outputs. Assertion summary: `kart-seam-tv-freeze.json`. Slot2 released.

Director found an analogous Tap Race apron: a fullworld diagonal background plane ended abruptly at the canvas's four edges. Only `games/arcade/public/app.js` changes: remove Tap's fullworld base/glows/diagonal apron and leave its outside-deck canvas pixels transparent; generic environment fill/glow is skipped only for Tap Race. The functional purple lane deck, boundaries, checker finish, runners, camera geometry and all five other arcade environments remain unchanged. Syntax and controller packet test pass. Frozen app SHA256 `5df83b3d29d8853218e058cbd81a78a3da430eeb3c0992eb55ad5e8ac267eb5b`. Root's final eight-engine-consumer TV capture is the fresh gate for Tap and the shared arcade dependency.

## Punch Meter fullviewport gym plane

Director's complete boundary scan found Punch Meter's wall/floor plane stopping at world bounds against flat navy margins. The bounded correction extends only Punch's existing decorative gradient/glow/floor material into the viewport. Floor-grid lines continue with the same original world-coordinate segment geometry; bag, ropes, posts, mount, lighting cone and camera/input rules remain unchanged. Other modes retain their paint, including transparent Tap apron. Syntax and controller packet check pass. Final shared arcade app hash `c7fc0e112a09f4dc0742aba60b01072f3c8e7d90a83f25096fd9afbcb5ef22ac`; root notified source frozen and must refresh all six arcade consumers in its eight-game stable TV capture. Fresh actual Punch1280/1920 proof is pending that capture or a root-granted focused slot. No visual acceptance claim from source alone.

## Final stable boundary proof

Root's `final-eight-edge-corrected` TV capture is complete: all eight games reached real playing state, with no browser errors or source drift. Owner opened all six fresh Punch Meter/Tap Race/Kart originals at1280 and1920. Punch Meter's wall and floor continue to the fullviewport edges while bag/ropes/posts retain geometry. Tap Race's decorative diagonal apron is absent while the functional purple lane deck/frame and checker finish remain. Kart's previous stage/rail step is gone; fullheight road wash, whole four-card roster and16px right cap inset are retained. These are bounded owner visual findings, with the director's independent global review separate.

`arcade-final-boundary-proof.json` records the six original paths/hashes, visual findings, real playing states, stable captured source, and matching current owned hashes. No owner browser was started and no phone was recaptured for this final gate. Final arcade app hash remains `c7fc0e112a09f4dc0742aba60b01072f3c8e7d90a83f25096fd9afbcb5ef22ac`; final Kart styles `721c08fd9fa54d7ae14cc010f2f552dc575e6f9d7914030bbfde23e86bdd4547`; Kart host JS `09b412658382ff143060f1a24c8c882ca840157df3e21d2c28df0dd4bef1255f`. Sources remain frozen; no additional edits.

## New human pass: actor visibility, pipe extent, field framing and Kart material

Owned source is frozen for fresh TV confirmation; previous six-frame boundary approval remains historical. Exact source/asset hashes are in `arcade-new-user-pass-source.json`. Chaos now belongs to arena owner and was not edited in this pass.

Carry Ball keeps its full-frame uniform 1200×720 world. The loaded display host inverse-projects actual `PARTY_HUD_EXCLUSIONS` through `ArcadeCamera`, then submits a finite bounded layout with increasing sequence. Only the current authenticated host's first registration owns the receiver; old/current registration replay cannot reclaim ownership/reset sequence. The canonical simulation recovers the complete 44-unit runner envelope outside the actual centered cap after geometry changes, spawn and movement. Ordinary movement 20..1180/20..700 elsewhere, loose-ball integration, passing and goals are unchanged. Accepted geometry changes reset interpolation to canonical recovered positions. Root added the shared pause allowlist, so resize recovery can complete while paused.

Flappy upper-pipe paint extends through the sky to the viewport top, including small shake overscan; gap/player/collision positions and the uniform camera are unchanged. Snake Lines uses full-frame uniform fit and removes ornamental edge/cross marks; the quiet circuit floor continues to the viewport. Its original lethal walls 10..1190/10..710 and trail rules remain.

Kart individual crew rows use a forest/navy-teal gradient and quiet rim, with `data-hp-theme-preserve` to retain authored paint. Four-row geometry, sixteen-row scroll, full-height wash, course and 16px right gap remain unchanged. Shared HUD owner matches the cap palette.

The central generated Punch gym asset was opened before integration. It covers the complete viewport; its wall/floor replaces the old decorative wall/floor base, avoiding duplicate horizons. Existing bag, rope, mounting hardware, ring posts/ropes and foot shadow retain their geometry. No new local microasset generation: semantic small cap prop proposals were handed to root's central asset pass.

Focused automated evidence: 3 Carry bounds/protocol/ball-invariance tests plus 1 existing phone-projection contract test pass. Sustained human+bot input is tested against both actual TV projections. Syntax checks pass and the bounded layout detector returns no findings. Real loaded-controller joystick proof and fresh TV 1280/1920 originals are prepared, awaiting the coordinator's browser slot and common-source freeze. No physical-device claim or new phone capture is made.

### Bounded live confirmation and final freeze

Opened all eight Kart/Punch/Flappy/Snake TV originals from `output/playwright/composition-round3-2026-10-03/arcade-focused`. Kart has four whole forest/navy-teal cards and a continuous wash. Punch shows the complete authored gym with preserved bag/ring geometry. Flappy's upper pipe reaches the screen top in actual flight. Snake fills the frame without the removed ornamental edge/cross marks.

The first Carry movement assertion exposed a 0.147 CSS px difference between the accepted layout and the current field effect transform. A diagnostic retained the actual canonical/rect samples. The approved correction adds only 2 CSS px of clearance to the actual cap projection; no global strip or weakened assertion. Valid geometry acceptance now immediately publishes the recovered authoritative snapshot, including while the runtime clock is paused.

Opened both final Carry TV originals from `carry-hud-confirm`. Real loaded-controller joystick input approaches the cap and then holds Up at both sizes. All 60 canonical envelope samples clear the actual cap; minimum measured CSS clearance is 1.7263 px. Full-frame camera safeTop remains zero. A temporary paused 1280×900 resize changed the projected cap and delivered the accepted state before resume; physics time remained exactly 6.43333333333332. Final output frames remain TV 1280×720/1920×1080. Errors and capture source drift are empty. Browser/server are closed and slot 1 released.

Final owned source/asset hashes and ten per-image observations are in `arcade-new-user-pass-proof.json`; four focused tests pass. Final app SHA256 is `a21017ce45229ef615bcea28ae86773d84b6699e674c7c210357bd33de3fae52`; server SHA256 is `05d52dfcf1322d6f7b855ea80cd9cc29261570deb14a2cad74fa6c7ad9f1b779`. The first eight originals precede the exclusive Carry guard in the shared Arcade file and remain targeted behavioral evidence. Root must qualify all engine consumers against the final source in the catalog run. No further product changes are pending in this lane. Microprops and final catalog delivery remain central/root-owned.
