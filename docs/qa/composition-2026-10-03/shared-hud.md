# Shared TV HUD composition — 2026-10-03

Status: root-approved shared source is frozen after the latest explicit Monster and Naval revisions. Fresh Monster and normal Naval originals have been inspected; Naval long-leader confirmation is accepted; root all36 acceptance remains separate evidence.

## Evidence

Originals in `output/playwright/ui-rework-2026-10-02/final-catalog-1734`: Tanks, Two at Sunset, Spy, Mine Together, Tap Race, Kart at 1920×1080.

- Tanks: team score floats over field while time/alive/points form unrelated right surface.
- Duel: ghost notch over sky and independent wide upper-right metrics cut across scene/rail boundary.
- Spy: timer/actor at viewport top is detached from questioning pair and useful left roster.
- Mines: title and metrics near rail, but two contours and stale reserve can cover local Start state.
- Tap Race: title/time lack solid contrast surface; right counters dominate unused top region.
- Kart: title/clock over scene while telemetry crosses rail boundary; wide dark gaps remain.

Current source splits `.tv-info-left`, `.tv-info-center`, `.tv-info-right` across independent grid columns. `tv-hud-through-field` deliberately makes the notch translucent, producing ghost contours. The bridge measures current painted surfaces and publishes legacy safe boundaries; retain actual measurement rather than guessed padding.

## Reusable modes

| Mode | Structure | Placement | Priority |
| --- | --- | --- | --- |
| centered-scoreboard | One opaque curved top cap containing game title, primary time/score, phase and secondary metrics | Centered on actual field; top edge attached | Live field first; compact grouped status |
| rail-cap | One opaque curved cap containing title, primary and metrics, continuous with useful rail | Exact measured rail horizontal contour; no cross-field readouts | Rail task/turn/roster is one group |
| content-cap | One compact opaque curved cap connected immediately above actual prompt/art/answer/canvas column | Centered to authored content anchor within compact unit, vertically coupled to its top | Active prompt/task first; status attached |
| game-owned | Existing game-owned HUD and art direction | Local game owns its masthead | Shared parent only records geometry/ownership |

The curve remains the approved shape, fully backed and readable. Separate wing cards disappear in these modes; status groups use the same outer contour. Kardia, violet/lime, authored game materials, native/mobile/footer flows remain established constraints.

## Approved geometry protocol

Family owners nominate mode and mark presentation DOM only:

- `data-tv-hud-rail`: actual rail bounds for rail-cap.
- `data-tv-hud-anchor`: actual field/content column horizontal anchor.
- `data-tv-hud-cluster`: compact content group including a static intrinsic cap slot; content-cap sits at cluster top, within scene rather than at global viewport top.
- Rail/cluster reserves `padding-top:calc(var(--party-hud-height,104px) + 16px)`. The published height is local iframe CSS pixels; avoid padding derived from the cap bottom.

The parent reads actual iframe rectangles using existing receiver-to-stage scaling. The bridge keeps `--party-stage-inset-top`, `--party-native-inset-top`, `--party-wing-inset-top`, `--party-field-inset-top` published from full final surface bounds for centered mode. These global insets are zero for active content/rail modes, which reserve their own intrinsic slot. Additional local-coordinate `--party-hud-left`, `--party-hud-width`, `--party-hud-height`, `--party-hud-bottom` and `--party-rail-hud-bottom` allow selective reserves and are not world transforms.

`window.PARTY_HUD_EXCLUSIONS` contains `{left,top,right,bottom,width,height,kind:"match",mode}` in local iframe CSS pixels. `party-stage-resize` announces changed geometry. Parent and bridge notify cap position changes independently of ResizeObserver size notifications.

Uniform game world/input scaling stays intact. Child layouts consume measured exclusion bounds for labels/rail content without moving authoritative objects or input mapping. Any vertical coupling must avoid circular feedback: static authored cluster bounds determine cap position; cap measurement determines reserve once, never chase its own shifted content.

## Family feedback so far

Art director agrees four families and actual field/content centering. Arena proposes Tanks/Western centered-scoreboard, circular field games and Arsenal rail-cap. Social proposes content-cap inside scene: Monster text column in text/art cluster, Spy questioning pair alongside roster, Charades actor/copy column, DrawGuess actual canvas column with sidebar aligned to canvas top.

## Verification handoff

Root owns fresh all36 host/phone originals and final composition review. Shared unit checks can cover pure layout metadata and normalization, but legacy tests asserting an invariant 104px height and ghost-notch geometry need intentional update once final modes are approved. No browser process is launched without a granted slot. Green bounds checks alone cannot accept grouping.

## Final all36 ownership

- Centered scoreboard (13): tanks, western, marble_bloom, pocket_siege, taprace, punchmeter, flappy, hungry, snakelines, carryball, chaos, poker, airhockey.
- Rail cap (11): push, shrink, knives, bomb, tankarena, kart, western_duel, jenga, crane, naval, mines.
- Content cap (7): monster, spy, crocodile, drawguess, sinyakquiz, warsaw, millionaire.
- Game-owned (5): bow_club, curling, bowling, swarm_gate, peek_shoot.

Actual paint hook is `.tv-info-dock`; `body[data-tv-game]` chooses explicit material profiles and `body[data-tv-hud-mode]` records mode. `gameContext` always shows the game title, `gameTitle` preserves the real primary readout and `.tv-info-actor` shows supporting actor identity separately. Per-game fill/rim/ink/muted profiles come from `materials.json`; edge-only marks distinguish checker timing, stitch, timber and machined instruments.

Syntax checks passed for tv.js/bridge.js/tv-information.js. Existing14 information-unit checks passed; every released game has explicit composition ownership. Mechanical Impeccable scan returned no findings. This is source evidence; combined originals are still required.

## First combined browser batch and common correction

Opened original first-batch Naval 1280/1920 and Sinyak 1280 captures under `output/playwright/composition-2026-10-03/`. Naval exposed an exact CSS bug: percentage padding on the absolute narrow cap resolved against the 1280 logical-pixel parent bar, expanding a 320-pixel rail cap and collapsing text tracks. The corrective batch uses fixed cap-local padding. Quiz and Charades exposed the older `#gamePlayers[data-readout=progress]` horizontal layout, cutting the denominator; the corrective batch explicitly stacks label/value and gives the first real readout an 84-logical-pixel minimum. Supporting words no longer break at individual letters.

At root's explicit instruction, every rail-cap game now has zero shell field gutter. Local authored 16/24-pixel internal gaps remain; the world/rail reaches the receiver envelope without a second exposed shell strip. Latest syntax,14 information checks and mechanical scan pass. Confirmation originals from the lane owners are required before acceptance; the first batch is retained as defect evidence.

## Latest explicit user rejection and approved B/C replacement

The user rejected Monster's fresh floating trapezoid. This supersedes the earlier content-cap shape proposal and its captures. Impeccable and Emil Design Engineering informed the new bounded family correction:

| Before | After | Why |
| --- | --- | --- |
| A receiver-edge taper floating inside the task cluster | Straight integrated task header, 18px soft corners, low tonal fill and quiet lower keyline | Interior task information has different spatial ownership from a screen-edge masthead. |
| Content header positioned at whole-cluster top, leaving a 100–200px gap when roster was taller | Header at actual task-anchor top; intrinsic header reserve inside that task anchor | Title, timer, progress and prompt now share one actual task column. |
| Wide title/time plus duplicated leader/points and supporting actor | Game title left, clock right, real progress adjacent; local actor ownership marker suppresses duplicate identity | The task leads and redundant ranking data stays in its real roster. |
| Narrow tapered rail neck starving third metric | Continuous rounded rail head with 16px cap-local padding; only actual progress/timer needs a wider first readout | Short player identity such as Bot1 remains readable without enlarging the rail. |
| Hard material-backed Jenga cap | Borderless warm radial wash without rim/glint | Preserves the user's explicit Jenga constraint. |

Latest content protocol: `data-tv-hud-anchor` is the actual task-column wrapper including its reserved header space; cap top equals anchor top and width equals actual anchor width, without a universal 560px limit. `data-tv-hud-cluster` remains the whole centered task/roster group but no longer gets the header padding. `data-tv-hud-owns-actor` marks local identity ownership. DrawGuess's original canvas remains inside an authored presentation wrapper, with no padding applied to the input canvas.

B target is 56–64 logical pixels, game heading up to26 logical pixels (20px floor only when its actual anchor is narrow), clock28 and progress18. There is no mask, polygon, taper or edge glint on B. A retains its screen-edge curve. C follows its real rail's rounded contour; Jenga is the warm borderless exception. Metadata, game rules, clocks, scoring, input and native/footer flows are unchanged. Latest14 information checks and syntax pass; fresh images for this user-authorized revision remain the final acceptance evidence.


## Latest Monster numeral clipping, alignment and textile revision

The user rejected cropped numbers, weak material distinction and uneven alignment. The named causes were different clock/progress font sizes and line heights, and a clock line box whose scroll height exceeded its client height at parent zoom1.5. The replacement uses KardiaFatRunner26px/1.32 with 2px vertical and6px horizontal ink padding for both real clock and progress. Clock caption and progress caption occupy equal rows; all shared numeric ancestors have automatic height and visible overflow. Title ink follows the authored material rather than the universal purple. Monster's opaque textile is now #206975→#164D56→#123E45 with cyan#54C5C9 edge and lime#B8ED70 stitching, matching the owner's teal queue treatment.

Fresh actual gameplay originals and native header closeups were captured and opened at1280 and1920 under `output/playwright/composition-2026-10-03/monster-numeric-textile/`. Loaded-font canvas diagnostics include actualBoundingBox ascent/descent and every clipping ancestor. At1280, clock and progress share baseline233.206875; at1920 both share405.49. Numeric clientHeight and scrollHeight both38 logical pixels; verticalClipRisks are empty at both sizes. The actual visible glyphs in both closeups are complete. This is browser/font evidence, not physical-device validation.

The1920 actual text anchor remains548physical pixels (365logical under1.5zoom), so the full game title wraps onto two lines. The timer and progress remain aligned and fully readable. This is recorded explicitly instead of claiming a single-line heading. Capture source drift was limited to the concurrent Naval owner's local files; Monster and shared presentation sources remained stable.

## Latest explicitly requested Naval rounded trapezoid

The user requested Naval's rail head to be a distinct rounded trapezoid. This is a Naval-only exception to continuous rounded C heads. Its measured width remains the exact real rail, with a broad top, gentle lower bevel of roughly12pixels per side at320width,22pixel corner curves, and no compressed metric neck. Opaque maritime shading is #255166→#102D40→#0C2233 with cyan#71B8C8 rim. Title24, clock28 and three real metric values24 retain safe ink line heights and padding; redundant phase/actor lines are hidden.

The actual normal4-player originals `tabletop/naval-top-confirm/naval-playing-1280.png` and `naval-playing-1920.png` were independently opened. Exact rail widths320/380physical pixels and heights126.45/189.72physical pixels (~126.48logical) contain timer, In game4, Points250 and LeaderBot3 clearly. Local captain rows show complete250/100 scores and side-by-side rank/cup tracks.

The owner's first max16 originals exposed a named common edge case: the Naval numeric ink override also made a long leader identity overflow. The final identity-only rule contains `.tv-stat-value.hp-player-name` with width/max-width100%, min-width0 and ellipsis, while numeric values retain visible ink. Fresh max16 originals after page CSS reload are required for that final correction. No other shared source changes are planned.

Fresh max16 post-fix originals under `tabletop/naval-max16-final/` were independently opened at1280 and1920. Alexandra's long leader identity stays safely ellipsized inside the1280 readout, with no ocean bleed; normal Bot2/250 is complete at1920. Both bottom-of-crew originals were also opened: all16 rows are reachable by DOM-scroll geometry and visible in the authored rail. Parent TV pointer blocking is recorded as a limitation of interactive browser-wheel verification, not presented as a physical TV interaction test. The owner's browser closed and shared source remains frozen.


## Named final-catalog Jenga and Duel corrections

The director/root named two remaining shared presentation defects in final-catalog originals. All four1280/1920 Jenga/Duel images were opened before editing. Jenga's old warm radial was centered at the top edge, so nonzero paint reached the pseudo-element's rectangular top and sides. Its replacement is a contained closest-side ellipse centered50%/50%, with transparent100% perimeter, no border/shadow and no mask; title/status/content placement stays unchanged. Duel's active actor was28logical pixels while the actual game title was19. The game-specific replacement makes title26/action font with authored ink and actor16/body font with muted ink. No actor/rule/status values change.

Only production file changed: `public/tv-information.css`; selectors target `data-tv-game=jenga` and `data-tv-game=western_duel`. Monster/Naval and all other family geometry/material rules remain untouched. Shared CSS SHA256 after this patch is `c303b6187a7462d4802d9ba7387ec8b7279f6389b2677a22cb1084a18aa1aaf2`; tv.js/bridge.js/tv-information.js source fingerprints remain unchanged. Diff whitespace checks pass. Targeted fresh originals remain required before closing these two named defects.


Fresh named-fix originals are now accepted under `construction-shared-final/`: Jenga and Duel1280/1920 TV originals were personally opened. Jenga has no rectangular upper/side backing; its warm wash fades into the existing local gradient. Duel's full game heading is visibly primary, while the actor pair is quiet supporting text; the1280 fire phase and1920 genuine round-result phase both preserve the hierarchy. Browser report errors[], changedFiles[] and no game errors. The cap-adjacent computed typography is26/16logical for Duel, and Jenga's computed paint is a closest-side radial ending transparent100%. The successful helper, catalog and capture-evidence module are included in revisionStart/revisionEnd fingerprints. No product source changed during capture.

Capture settling caveat and repair: initial helper attempts awaited RAF in every TV descendant, including offscreen built-in bot about:srcdoc frames. A bounded diagnostic identified twoRAF in the actual parent and host frame but zero in a bot frame. Partial stalled/diagnostic evidence is retained separately; it is not acceptance evidence. The successful helper waits loaded fonts in all frames,600ms, and then twoRAF in the actual parent/#gameFrame surfaces, excluding offscreen bot frames. Browser closed normally and slot1 was released. Root may now perform its final all36 settled capture.
