# Social games composition — 2026-10-03

Status: latest Monster TV numeric/material/alignment correction independently inspected and closed; Monster phone useful-canvas correction confirmed through actual native-controller bootstrap and real drawing/submit. Root final all36 source gate remains separate. Shared HUD owns parent chrome; this lane owns game presentation. Earlier plans/captures below are historical and superseded by the newest evidence sections.

## Evidence and family contract

Reviewed original 1920×1080 TV gameplay captures individually under `output/playwright/ui-rework-2026-10-02/final-catalog-1734/` for Monster, Spy, Charades (`crocodile`) and Draw & Guess. These show the composition defects directly and are baseline evidence, not current approval.

Family thesis: a public gameplay unit has one meaningful focal region. Compact status belongs immediately above the region it describes, not in a distant screen corner. For social games, the primary identity, role/action and supporting copy share a column. A player roster is secondary and lies close to that column; artwork expresses the current player/game and does not create a competing distant anchor. Existing Kardia, art, passive-card edge lines, tied places, private content, footer, input and drawing mechanics remain unchanged.

Shared HUD proposal from `/root/shared_hud`: parent measures `[data-tv-hud-anchor]` in child; unified content cap is centered over that actual box and constrained to its width. `[data-tv-hud-cluster]` identifies the compact game unit so the cap can sit immediately above it. New geometry variables are provided by shared HUD; the game never sets parent offsets or injects parent chrome.

## Pass the Monster

Baseline: a faint full-screen backing remains even though the game panel is declared transparent. Text sits at far left, while the monster occupies the far-right edge; the blank interval reads as missing content. Parts floats at the viewport corner.

Thesis: active artist/action → ordered queue → privacy instruction is one text column; the supplied monster art sits immediately beside it as a supporting illustration. One close, centered group replaces the two remote anchors. No additional backing.

Proposed group: 1120–1320 px total at 1920, 960–1100 px at 1280; text approximately 62%, art 34%, 24–32 px gap. Artwork max 340–390 px wide at 1920 and 260–300 px at 1280; visual silhouette vertically centered on text, without adding a new decorative surface. Text content height stays intrinsic, with 12 px title/name, 24 px name/queue, 24 px queue/instruction rhythm. Total cluster centered in usable stage below actual cap. Cap aligns text-column center and shows real timer/parts through shared HUD. Mark text column anchor and game panel cluster. Queue preserves order, player identity and active/done state.

Extremes: longer names may wrap within text column; 16 queue entries wrap while keeping privacy instruction adjacent. Reveal retains its original stitched artwork, credit semantics and controls.

## Spy

Baseline: roster is thin and at the extreme left; pair spans nearly the full screen, with a large interior void and lower detached question hint. Phase/answering information appears high in the opposite corner.

Thesis: roster + asking→answering pair + question cue form one centered question scene. Pair leads; roster supports role recognition. Cap attaches above the pair.

Proposed group: 1160–1320 px total at 1920, 1000–1120 px at 1280, with 260–300 / 220–250 px roster and a 24–32 px shared interval. Roster height is intrinsic for four players and vertically centered beside the entire pair+cue unit; larger rosters use existing density behavior without hiding names. Pair art 132–160 px at 1920 / 110–128 px at 1280, names 24–30 px / 22–26 px, row width capped 760–880 px. The role, art and name spacing is 8–12 px; question cue follows at 24 px. Pair columns use equal width with a compact arrow track, so long names do not push the pair apart. Mark `.turn-card` anchor and `#playView` cluster. No public display of secret role/location.

## Charades

Baseline: tiny roster at left and enormous actor art at right have unrelated height and weak proximity. Turn, points and leader occupy a remote corner while actor turn copy is below the art.

Thesis: actor art → name → public instruction → turn progress is a meaningful central column; roster belongs next to this column with equal visual weight to its information value. The actor remains dominant through identity and content, not excessive image size. Cap attaches above the actor column.

Proposed group: 1080–1240 px total at 1920 / 940–1080 px at 1280, with 300–340 / 280–310 px roster, 32 px gap and a 660–800 px actor/copy column. Actor art 150–190 px at 1920 / 120–150 px at 1280. Name 30–36 px / 26–30 px; instruction constrained to 44ch. Main column has 12/16/24 px internal rhythm. Roster is vertically centered on the full actor/name/instruction/turn unit. Mark `.stage` anchor and `.screen-workspace` cluster. Public stage remains free of the secret word and actor controls. Existing turn metrics remain real and move through shared HUD rather than duplicated locally.

## Draw & Guess

Baseline: sidebar begins beside the artist heading, 129 px above actual drawing canvas. Canvas dominates correctly, but its adjacent public information uses the wrong vertical reference.

Thesis: actual drawing surface is the primary field. Artist/instruction belongs directly above that surface. Guesses/standings begin at the canvas top and form its adjacent rail. This aligns task information with the meaningful rectangle rather than with the generic “Drawing” heading.

Proposed structure: shared workspace grid has header row spanning only the canvas column, then field row with sidebar and actual canvas aligned at its top. 300–360 / 260–300 px rail at 1920 / 1280, 24–32 px gap; canvas retains available width and aspect/render semantics. Sidebar is content-height and never starts at header height. Transfer only public artist/status elements into a presentation header wrapper if needed; preserve canvas node, its 800×600 bitmap, event listeners and state. Mark `#canvas` anchor and `.screen-workspace` cluster. Cap follows actual canvas horizontal center and sits above the local artist/instruction group, with reserved height from shared HUD. Reveal/finish maintain their existing phase behavior.

## Verification planned

One batch after implementation: real gameplay at 1280×720 and 1920×1080 for all four, relevant transition/reveal and long-name/high-roster states. Open originals individually; judge attachment, proximity, task priority, balance and shared cap relationship. Geometry records supplement images. Phones are unchanged; no phone claim unless source scope expands. QA processes require root grant; none started at plan stage.

## Implementation evidence

All four use the approved content-cap markers and intrinsic cluster cap slot (`--party-hud-height`, default 88 px, plus 16 px). Monster reuses its existing illustration pseudo as an intrinsic grid item, with no new asset. Charades and Spy group their public roster and task column. Draw & Guess moves only public artist/status nodes into a host-only grid header; the canvas node, bitmap size and listeners are preserved. The existing black dotted canvas is retained. Materials from the sports lead map are applied to existing public surfaces, with approved short centered card edge lines retained.

Source syntax and whitespace checks passed. One mechanical Impeccable scan found only incumbent Inter fallback and legacy answer-border branches; these do not apply to the new composition. Browser and physical-device evidence are still pending.

## Fresh capture and visual audit

Capture batch `social-pass1` used the real launcher, a browser player and three actual built-in test bots at normal clock. The system sandbox initially prevented loopback listening (`EPERM`); the same authorized local QA ran successfully with escalation. No artificial state, scores or results were injected. Every original was opened separately: eight TV originals at 1280/1920 plus eight phone originals at 402/320. Pass1 revealed wide task separation, cramped Charades roster identity, DrawGuess 720p roster overflow and shared TURN-value clipping.

One named correction batch, **compact attachment and public roster readability**, reduced the Monster/Spy/Charades group widths, widened Charades/DrawGuess identity rails, made Charades rows intrinsic, compacted DrawGuess 720p public guesses and repaired material-rule specificity while retaining approved centered edge lines. Shared HUD fixed the TURN ratio. One confirmation batch (`social-confirm`) followed. All eight original TV screenshots were opened separately. Confirmation source hashes report `changedFiles: []`, no browser page errors and no uncovered game states. Engines were not edited by this lane.

| Original confirmation image | Separate visual observation |
| --- | --- |
| `monster-tv-gameplay.png` — 1280×720 | Full-screen backing is gone. Real title/timer/parts cap sits over the copy column. Queue and privacy explanation are a clear single text unit, with a much smaller supporting monster; whole unit is centered. The optical gap from short instruction to the silhouette remains approximately 300px, a qualitative review caveat rather than an overlap defect. A normal join notification remains visible in the lower-right corner. |
| `monster-tv-live-1920.png` — 1920×1080 | Name, wrapped queue and privacy instruction form a compact block immediately beside the supplied illustration. Monster scale supports rather than dominates. Cap game name wraps cleanly into two readable lines at the anchor-constrained width. Plum queue material and stitched cap cue remain restrained. |
| `spy-tv-gameplay.png` — 1280×720 | Four identities sit next to the exchange rather than at the screen edge. Pair, arrow, roles and question cue share one column beneath the dossier cap. Roster is secondary and role colors remain meaningful; actual asking/answering roles and no private location are visible. |
| `spy-tv-live-1920.png` — 1920×1080 | Same close dialogue structure with balanced participant art. The larger screen does not stretch the pair across the viewport. Hint belongs beneath the pair; indigo dossier material differentiates inactive roster rows from asking/answering highlights. |
| `crocodile-tv-gameplay.png` — 1280×720 | Green theatre roster has adequate width for the two-line long name and its stats. Performer art is modest and the public actor/name/instruction/turn-stat column is legible. Actual TURN 1/10 fits the shared cap; leader is deliberately ellipsized. No secret word is present on TV. |
| `crocodile-tv-live-1920.png` — 1920×1080 | Troupe and actor column form one centered scene; portrait has appropriate supporting scale and no distant corner turn panel. Row score/tied places are retained. Lacquer material paints the existing outer roster with the approved short edge lines. |
| `drawguess-tv-gameplay.png` — 1280×720 | Guesses begin exactly at the canvas top, with the artist/instruction header above only the drawing column. All four players are visible in the compact rail. Canvas is intact and black dotted incumbent styling is preserved. First long-name metadata sits close to the lower edge of its compact row and is flagged for final gallery judgment. |
| `drawguess-tv-live-1920.png` — 1920×1080 | Full public rail aligns to the meaningful drawing field. Canvas dominates while artist/status remain attached; lavender paper material and fine edge lines stay on existing side panels. All names and score columns fit. |

Phone originals were captured through the actual launcher route, including the shared footer. Monster drawing palette/Done, Spy current action/private role card, Charades actor word/actions, and DrawGuess drawing tools are visible at both 402 and 320. No phone source was edited. This is browser visual evidence, not physical iPhone evidence or proof of real pointer drawing, alternate role, reveal, result or 16-player acceptance. The bounded QA intentionally stops after one correction and one confirmation; the two noted qualitative caveats remain explicit for final reviewer judgment.

Source files: Monster `index.html` + `styles.css`; Spy `host.html` + `spy-layout.css`; Charades `screen.js` + `screen.css`; DrawGuess `screen.js` + `screen.css`. Parent cap and bridge changes remain owned by the shared HUD lane. Local source syntax/diff checks passed; detector baseline warnings remain limited to the old Inter fallback and legacy answer-border branches.

## Latest user rejection — Monster, supersedes earlier visual judgment

The fresh Monster composition was explicitly rejected for its large trapezoid header floating above the text and the remaining approximately 300px optical artwork gap. The earlier bounded pass is not acceptance and does not limit the newly authorized correction.

| Before | After | Why |
| --- | --- | --- |
| Massive clipped trapezoid containing game title, timer, parts and a repeated artist | Shared owner replaces internal content-cap shape with a compact rounded task header; Monster shows only game title, real timer and parts | A task header belongs to the content column and must not compete with it or duplicate the current artist |
| 1000px scene with broad text column and 24px gap | 880px centered unit, 320px illustration column and 12px semantic interval | Moves the actual monster silhouette roughly 80–120px closer at 720p while preserving the whole scene's centered balance |
| Header reserve default 88px plus 16px | Measured shared header height, default 64px, plus 12px | Actual task starts immediately below its header, with no unnecessary floating interval |

No input, private content, bitmap artwork or rules change. Shared straight task-header implementation and local anchor adapters were frozen before the newly granted capture slot. Fresh inspection is recorded below.


## Final task-header contract and new real-state audit

The shared owner now places the straight rounded header at the actual task anchor top and uses its full width. The intrinsic header slot is inside the task anchor; the outer cluster has zero top padding. Monster reserves the measured header height plus 12px; Spy, Charades and DrawGuess reserve it plus 16px. All four declare local actor ownership to prevent a second identity line in the shared header. The visible shared header contains the game title, real timer and actual progress; local standings retain scores. Parent geometry and shape remain exclusively shared-owned.

Monster is an 880px centered grid: 548px text, 12px interval, 320px supplied illustration. Its original art is positioned at the left of its existing pseudo element; no raster is edited. Spy keeps a close 300px roster and 756px dialogue column. Charades keeps a 360px roster and 676px performer column. DrawGuess wraps the original public context and unchanged canvas/stage in an actual drawing-column anchor, with the public rail beginning at the actual canvas top.

New batch: `output/playwright/composition-2026-10-03/social-task-header/`. Captured at normal clock through the real `/tv` launcher and `/play` controller, with a browser player and three real built-in bots. No private/state/score injection. Every image listed below was opened separately. Screenshot-adjacent phase, style and readout evidence is in `report.json`.

| Original image | Separate qualitative judgment |
| --- | --- |
| `monster-tv-gameplay.png` — 1280×720 | Straight 56px-high header spans actual copy x200–748 at y193; no trapezoid, taper or duplicate actor. Copy reserves 68px, giving a 12px structural header-to-task interval. Artwork moved approximately 116px left compared with the rejected view. Rightmost queue-to-visible-art gap is approximately 93px, so the desired approximately 60px optical gap is not fully met at this size. The privacy second line ends earlier and has a wider interval. Whole group remains centered; no broad holding panel. |
| `monster-tv-live-1920.png` — 1920×1080 | Actual copy remains 548px wide, x520–1068. Two-line game title increases measured header height to 93.31px; real timer and Parts still fit. Art sits beside the compact copy, with approximately 50px visible gap. Caption, name and queue share one axis; artist is displayed once. |
| `spy-tv-gameplay.png` — 1280×720 | Straight 56px header follows the actual exchange column x424–1180. Roster is attached by a 24px interval; roles, two portraits/names, arrow and question cue form one scene. The dossier material stays on existing inactive rows. No public secret role/location. |
| `spy-tv-live-1920.png` — 1920×1080 | Header measures 84px and follows the same 756px task width. Larger viewport does not spread the pair apart. Actual exchange, roster and instruction remain close and vertically balanced. |
| `crocodile-tv-gameplay.png` — 1280×720 | Straight 56px header follows the 676px performer column, x494–1170, with 16px structural gap. Actual TURN 1/10 fits. Theatre-green roster carries the long two-line name and stats; modest actor art and identity/instruction form one column. Secret remains off TV. |
| `crocodile-tv-live-1920.png` — 1920×1080 | Straight 84px header follows the actor column rather than a detached screen corner. Performer appears once, roster and stage remain balanced, tied places/stats retain their current meaning. |
| `drawguess-tv-gameplay.png` — 1280×720 | Straight 56px header follows the actual drawing column. Artist/status sits below it; rail guesses panel and canvas both start at approximately y186. Original black dotted canvas remains the focal surface. All four rows fit; the first long-name metadata remains close to its compact row bottom. |
| `drawguess-tv-live-1920.png` — 1920×1080 | Straight 84px header follows the approximately 1099px drawing column. Rail and canvas both start at approximately y229, so alignment references the canvas rather than the Drawing heading. Actual canvas is visually contained; the complete anchor box includes incumbent stage whitespace and reaches approximately y1086, slightly beyond the viewport, without visible primary canvas clipping in this original. |

Eight controller originals at 402×874 and 320×698 were also opened individually. Monster palette/Done, Spy listener/private civilian card, Charades private actor word/actions, and DrawGuess palette/brush/Clear remain visible with the actual shared footer. These are web `/play` browser captures, not native-shell or physical iPhone evidence. Phone sources were not changed. Normal-clock role/content differences between captures are real; no artificial role was held fixed.

No browser errors were recorded. All four captured phases were `playing`. Capture source drift reports three concurrent sports files (`games/bow_club/public/style.css`, `games/sports_siege/public/sports-controls.css`, `games/sports_siege/public/style.css`) outside this lane; social sources remained stable. Do not describe the whole workspace hash as unchanged. Current gameplay audit does not establish reveal, results, alternate controller roles, real pointer drawing or 16-player acceptance. The new slot was released after the complete batch; no additional capture process remains active in this lane. Monster 1280 optical proximity remains explicitly open for final reviewer judgment.


## New user rejection — numeric ink, Monster color and queue alignment

The user rejected the subsequent Monster crop for clipped digits, insufficient visible color change and alignment. This explicitly authorizes another correction and supersedes the prior task-header visual judgment. Shared HUD owns numeric ink allowance, timer/progress baselines and the visibly teal textile header. Local Monster host presentation now replaces the ragged three-plus-one wrapping queue with two equal columns inside the existing 548px copy width, 8px gaps and equal 52px cells. Names retain full content and may wrap to two 20px lines; icons remain 22px. No controller, private content or artwork change.

| Before | After | Why |
| --- | --- | --- |
| Content-sized queue cells wrap three plus one | Two equal columns, equal 52px cells, 16px radius and 8px gap | Four real participants share stable row/name axes under the task |
| Plum inactive cards and lavender actor/copy | Opaque teal textile #153C43 with broad #23565E→#12343B paint, cyan rim #4BA6AF and quiet lime inset stitch #B8ED70 at 35%; mint actor/heading #E1FFF3 and muted explanation #B1D7D5 | Existing surfaces now visibly belong to the supplied cyan/lime Monster art |
| Current artist authoritative lime | Lime #C5F268 with dark-teal #12343B ink | Retains the active turn distinction while matching the exact material direction |

Final local source freeze was sent to shared HUD after exact art-director palette coordination. Whitespace/diff checks pass. Shared slot1 will capture the combined header and queue; no separate browser process was started in this lane. These newest local changes are not yet visually confirmed by this lane.


## Independent final Monster TV review

Opened separately the shared-owner `monster-numeric-textile/monster-tv-gameplay.png`, `monster-tv-live-1920.png`, `monster-header-1280.png` and `monster-header-1920.png`. Whole timer and progress ink now share an optical baseline, with supporting labels on their own row; mint title is complete at both sizes. The 1920 title wraps into two balanced complete lines within the honest 548px anchor. Teal body, cyan rim and quiet lime stitching are visible, not a transparency tint over purple. Queue is a stable 2×2 grid; the full active long name fits two lines at1920 inside the equal52px cell. The latest queue right edge gives an approximately40–50px optical interval to the actual mascot, superseding the earlier93px caveat. No remaining named Monster TV correction identified.

## Monster native controller — useful drawing height

Independent reviewer identified unused room below the tools in the actual final-catalog402 original. The drawing canvas used approximately239px actual height and left substantial space before the parent footer. Product edit is limited to `games/monster/public/styles.css`: active draw-state shell fills the available iframe height; the canvas wrapper flexes into the residual height, and the original canvas element fills that surface. Original canvas node, 720×520 bitmap, pointer-to-bitmap coordinate calculation, export/strip, private content, tools and parent footer remain unchanged. CSS changes the displayed aspect; normalized bitmap coordinates stay authoritative.

Initial batch exposed an inherited `game-polish.css` important selector that kept the actual input canvas capped inside a larger frame. Named correction **actual canvas fills its available surface** overrides that incumbent rule with the full draw-view selector; the final run confirms the useful element, not only its wrapper. A partial confirmation stopped at that explicit geometry assertion before any drawing; final completed output is `output/playwright/composition-2026-10-03/monster-native-canvas-final/`.

| Before | After | Why |
| --- | --- | --- |
| Actual402 canvas approximately331×239CSSpx with unused room after tools | Actual canvas368×379.75CSSpx, tools above the unchanged parent footer | Converts blank viewport room into useful drawing input |
| Intrinsic fixed aspect/capped rendered element | Flex residual height and full-width/full-height element, original720×520 bitmap retained | Display can use available room while existing coordinate mapping preserves normalized data |

All seven final originals were opened separately:

| Original | Separate observation |
| --- | --- |
| `monster-native-402-empty.png` | Large actual drawing surface occupies the available room; prompt above, color/brush/Undo/Clear/Done below, footer distinct. |
| `monster-native-402-stroke.png` | Real pointer stroke appears across the useful drawing area; its mapped bitmap bounds agree with the supplied normalized pointer path. |
| `monster-native-320-stroke.png` | All tools and footer fit in320×568. The available iframe is358px high, so actual canvas is286×82.9CSSpx; drawing area consumes its residual room and preserved ink remains visible. Small-screen drawing height is limited by real controls, not claimed equal to402. |
| `monster-native-320-confirm.png` | Actual preview contains the stroke; Send and Keep drawing exist. Incumbent confirmation card requires vertical scrolling to reach its second button fully; actual Back activation succeeded. |
| `monster-native-320-submitted.png` | Real successful submit shows next artist, completed queue mark and authoritative1/4 progress. |
| `monster-tv-after-submit-1280.png` | Teal task header and stable two-column queue persist after a genuine turn change; submitted private drawing is absent from TV. |
| `monster-tv-after-submit-1920.png` | Complete header title and timer/progress persist; long completed name fits its equal cell; art remains close and no private drawing is exposed. |

Native proof: actual `/play` launcher route with repository controller-bridge and tabs loaded through the standard native QA bootstrap. `native-controller`, LocalPartyTabs and the native dock were all present at402×874 and320×568. This is WebKit with native-controller integration, not a physical iPhone.

Real drawing produced4909 ink pixels, with bitmap bounds `[174,150,545,343]`. The complete720×520 bitmap remained byte-identical after402→320 resize and after Done→Keep drawing. Confirmed submit advanced the authoritative engine to1/4 and a different actual artist. No browser errors; four local Monster file hashes were stable. This limited local hash set is not a full workspace/source gate. Diff checks pass. Local presentation source is frozen and QA slot3 was released; no drawing/engine/input/privacy source was edited.


## Bounded confirmation-state correction — supersedes short-card scrolling caveat

Art director independently found the Keep drawing lower rim clipped in the preceding320 confirmation original. Only `games/monster/public/styles.css` changed: for iframe heights at most500px, the existing confirmation card uses12px padding/6px gap,20px heading, original preview displayed120px wide at its unchanged360/260 aspect, full12px explanation, and both actions44px high. Content and confirmation behavior remain intact; no drawing or waiting-state rule changed. Source SHA256 is `76244617804a4ffdd9ff3e6825b881110dba24beb5f2d4554471f32d60fed915`.

Fresh batch `output/playwright/composition-2026-10-03/monster-native-confirm-fit/` uses the same actual native-controller bootstrap and real engine. Opened individually six phone originals:402 empty/stroke/confirmation,320 stroke/confirmation/submitted. Both confirmation originals show complete actions and lower rims above the parent footer. At320, iframe height358px, cardy16–325.66; Send218.66–262.66 and Keep drawing268.66–312.66, each44px. Keep drawing has45.34px remaining before the iframe/footer boundary. At402, actions end493.13 and561.63 inside the664px iframe; its existing larger card remains unchanged.

Real pointer drawing,402 confirmation→Back,402→320 resize,320 confirmation→Back and final confirmed Submit succeeded. Exact original bitmap stayed unchanged through resize and Back; authoritative progress reached1/4 with another artist. No browser errors and no local four-file source drift. These are native integration WebKit captures, not physical-device evidence. Root all36 drift must explicitly account for this latest authorized stylesheet edit. Named confirmation defect is closed in this lane; local source frozen and QA slot1 released.

## Latest full brief — grouping, scale and removal of arbitrary marks

This newly authorized brief supersedes prior approval of short centered card edge lines. Existing local decorative double-edge gradients were removed from Charades and DrawGuess materials; Monster's obsolete dashed canvas pseudo definition was removed. Existing material paint and actual supplied art remain. Shared HUD owns all common header stitch/dash removal; global theme surfaces remain sports-owned.

| Before | Latest implementation | Why |
| --- | --- | --- |
| Spy small 1080px group,110–160px portraits,22–30px participant names | Centered group up to1620px within actual room;360–450px roster,1.5× former roster units,165–240px portraits,33–45px names,30–36px roles and27–33px cue | Dialogue is a visible TV scene while the roster stays attached; whole scene remains vertically balanced |
| Charades intrinsic roster sits lower than the task header | Existing roster stretches to the actual stage/header anchor top and bottom; roster content scrolls if needed | Both columns form one aligned task block |
| DrawGuess sidebar starts at canvas but ends above it | Read-only ResizeObserver also measures original canvas; existing rail starts at the actual canvas top and occupies its full field height, with standings filling residual room and guesses retaining own scroll | Alignment references the drawing rectangle rather than the Drawing heading |

Stable shared contract: keep actual task/column anchors and actor ownership. Intrinsic header reserve is its measured height plus12px. DrawGuess's existing full drawing-column anchor stays unchanged; moving the marker onto the canvas itself would place a header over input. Measured `--drawing-field-height` controls only the public rail, not the canvas or workspace width, preventing a size feedback loop.

Product edits: Monster styles.css; Spy spy-layout.css; Charades screen.css; DrawGuess screen.css and host presentation ResizeObserver in screen.js. Existing phone drawing, original canvas nodes/bitmaps, gestures, private content, standings meaning and input/export protocols remain intact. Local syntax/diff checks pass. Source frozen for root-granted QA; no new browser process started at this stage. Latest layout is not yet visually confirmed.
# Latest user pass — whole groups and usable side rails

New scope overrides the previous bounded acceptance. Four local CSS files only; accepted native Host Panel and controller behavior stay frozen. Browser slot has not been granted for this candidate yet.

| Game | Spatial change | Required fresh proof |
|---|---|---|
| Monster | Copy/art scene880→1188px bounded by viewport; art320→432, queue52→70, supporting icon/copy/gap dimensions×1.35. Current2×2 aligned queue and intrinsic task-header slot retained. | Open1280/1920 originals; close copy/art proximity, all content bounds and whole queue; confirm existing phone unchanged. |
| Charades | Troupe/performer workspace1060→1431px bounded by viewport; taller713px composition capped atvh−72; performer/supporting copy×1.35. Existing positioned roster uniformly zoomed1.35 so authoritative engine row transforms/order are retained. | Open1280/1920; aligned complete cap/rail, enlarged full character; many-player scroll, scores/ties untouched. |
| Spy | Rail and task share one bounded680px/vh−48 group. Rail header begins at cap top; player list fills remaining height. Duel centers within remaining task height and question anchors its bottom. | Open1280/1920; matching complete edges, larger readable Players, role identities whole, many-player scroll. |
| DrawGuess | Actual canvas-height sidebar retained; width360–440px. Guesses now44% of field height, headings22–28px and guess copy18–22px. Both messages and participants have usable bounded scrolling. | Open1280/1920; top/bottom refer to actual canvas, enlarged Guesses, many-player scrolling; original800×600 bitmap and input untouched. |

Shared task header protocol stays intrinsic `--party-hud-height +12px` inside existing anchor; no reserve derived from cap bottom, no parent HUD edits. Two quiet microasset motifs proposed for root generation: cyan/lime character-tail or theatre-ticket for performance family; indigo dossier-tab or lavender pencil/eraser for covert/drawing family. No generated asset is inserted locally until root resolves the family artwork.

Frozen hashes after named corrections: Monster `670ca30313e1137de60feea3f44d094c4c2f6a7f7cf425fd3a06101dde3d9888`; Spy `91a55f09e0f4355893604c388ecb12e03ba27fd73c0afb7316f088c80ba979a2`; Charades `1757729cb9b3ed58885b4178f7730b1b7bf3b756232972c3ec2556bbdb555e22`; DrawGuess `aa1693e6af7addd80b2720b2eac58c660c576e1f2316815b8ef30d1b2ba6a5e1`.

Fresh normal-clock engine TV checks: `output/playwright/composition-round3-2026-10-03/social-scale-first/report.json` (all four720/1080 pairs) and `social-scale-confirm/report.json` (Monster/Spy/DrawGuess named corrections). All14 originals personally opened; errors empty. No state/score/private content injection; empty black dotted DrawGuess canvas is the actual artist's normal game state. Phones and physical devices were not recaptured in this TV-only scope.

Per-image review: Monster1280/1920 shows enlarged whole cyan creature/copy/2×2 queue and close optical attachment with complete explanations. Charades1280/1920 shows enlarged performer and uniformly scaled troupe rows inside the matching full-height rail, all stage text complete;720 row secondary statistics may ellipsize while complete real names/scores stay accessible. Spy first pair exposed an unused lower rail; confirm1280/1920 fills the complete height with four larger row cards while actual avatar/content sizes stay centered, cap top and final question edges aligned. DrawGuess first1280 exposed native scrollbar chrome; confirm1280/1920 removes that bar and retains dynamic soft fades, guesses substantially larger, entire rail aligned to actual canvas top/bottom. At720 participant continuation scrolls rather than hiding a player;1080 the four real rows fit.

Final Monster queue-name font fix is **source-only pending root frozen-catalog confirmation**: the first inheritance correction still inherited the older16–18px parent shorthand. Adding the actual `main.host-shell` selector to the explicit22–24px queue font defeats that precise override. No additional lane browser run was launched. Existing screenshots therefore prove the enlarged structure but do not yet prove this last queue-name font revision. Root was notified before/after the source edit and given the final hash.

Global drift is qualified: first batch changed tankarena app/style, chaos host HTML and arcade app; confirmation changed only tanks/tankarena servers. Four local presentation sources and shared HUD remained stable within each capture batch. This is scoped live-TV evidence, not a globally frozen all36 acceptance claim. Two browser/server runs are closed; slot2 released.
