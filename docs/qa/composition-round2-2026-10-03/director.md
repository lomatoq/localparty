# Design direction — renewed composition brief

The human brief in `user-brief.md` supersedes the previous composition/material acceptance. This is a design handoff, not approval of the forthcoming implementation. Product source remains read-only for this reviewer.

## What changes visibly

The incumbent whole originals were reviewed previously across all 36 games. For this reset, Local Tanks, Western, Bomb Tag, Jenga, Crane and Naval 1280 originals were reopened from `output/playwright/composition-2026-10-03/accepted-catalog`. They confirm the specific problem: angled caps and small ornament do not establish a coherent composition; a top-pinned short roster remains disconnected from its centered world; multiple dark backings obscure the intended construction material.

| Before | After | Why |
| --- | --- | --- |
| Wide sloping cap, corner brackets and stitch lines | Screen-attached rectangle with square top corners and rounded bottom corners; no ornament | A stable edge and clear text groups make the header readable without competing with the field. |
| Title violet regardless of game; counters crowded at one end | Game-related title ink, evenly distributed fact groups, equal exterior padding | The game has its own identity and each value has enough room to be read. |
| Short cap/roster stack at the upper edge of a centered circular world | Center the complete intrinsic cap/roster group against the actual field | Placement balances the whole composition rather than merely avoiding overlap. |
| Content leaderboard aligned to heading | Leaderboard aligns to the actual task/answer/canvas group | Participants and the task read as one unit. |
| Jenga textured stain; Crane multiple dark surfaces | Jenga one soft warm gradient; Crane one navy/teal wash over a full-width minimalist city | The requested material remains visible without an additional enclosing card. |
| Floating corner pencils, blocks or flags | Remove automatic decorative assets; retain actual world art | An empty corner alone does not justify an illustration. |

## Shared shape and typography specification

All dimensions below are logical TV pixels at the 1280×720 design scale. Scale uniformly at 1920×1080. Existing approved font families, italic numeric faces, game art and controller footer remain unchanged.

**A — field header.** Attach directly to the top edge, centered horizontally. Rectangle: top corners 0, bottom corners 22. Width 600; allow 640 for four real fact groups, with maximum 60% of the viewport. Use 24 horizontal padding and **16 total vertical padding: 8 top / 8 bottom**. Minimum height 88; actor context may increase it to 104–108. Do not force a smaller height by clipping numeric ink. Title 24 with line-height 1.1; primary timer/score 30 with line-height 1.32 and 2 px extra ink clearance. Supporting fact labels 12; values 26 with line-height 1.32. Identity/title region about 42% of the inner width; remaining facts use equal columns and a 20 px group gap. Center each label/value group vertically as a unit. Equal empty space at left and right is visible in the whole image. Actor 14 body text is a separate supporting line, never a substitute for the game title. No clip-path, taper, dash, stitching, bracket, divider flourish or decorative pseudo-element. A very quiet continuous edge/light is sufficient.

**B — task composition.** Plain rounded rectangle, radius 16, aligned to the actual task column. Target 64–80 high when content fits safely. Header → 12 gap → task. The complete task/answer/canvas column and participant board form one centered composition. Participant board top/bottom follows the real content, not the game heading. For the quizzes, this includes the question and answers; for Drawguess it follows the drawing canvas and current message area. Header metrics use the same safe ink rules as A. Avoid enlarging a cap to fill the entire cluster width when its content only belongs to one column.

**C — rail composition.** Plain complete rounded rectangle, radius 16, same x/width as its roster/content. Cap and local content use a 12 px separation and form **one vertically centered intrinsic group** relative to their corresponding field. Center the entire group, not just its title. Never inflate an empty rail to full height to simulate centering. When a dense roster exceeds the available height, center the bounded group and scroll only the roster region. Naval is the explicit exception to intrinsic short sizing: its whole sidebar spans the combined board stack height, including the real board labels. Avoid centering independently measured children and producing circular layout dependencies.

**Construction exceptions.** Jenga retains no hard outer card, border, contour or texture: one clean warm coral/honey wash fades fully transparent around its perimeter. Crane likewise uses only one attractive blue-green wash; the shared cap background is transparent and adds no stacked dark backing. Contents still align and use the common type/spacing hierarchy.

**D — game-owned sports header.** Preserve the useful existing rounded sports group and actual logo/phase/score. Correct internal facts/guidance hierarchy, remove meaningless ornaments and nested fills. Bowling's adjacent lane spacing is symmetric; Bow facts are distinct from its quiet instruction. No generic cap is injected over this composition.

Full-field scenes use their available height without new top/bottom letterbox bars. Functional grids, aiming guides, trajectory paths and game boundary marks are retained. Do not stretch circles or change world/physics coordinates to satisfy a UI rectangle.

## Material direction across all 36

Material is expressed through fill, restrained shading and readable ink on an existing meaningful surface. It is not a repeated line motif. Use one outer surface; skip its nested descendants and protected state/control surfaces. These hues are implementation starting points, subject to actual screenshot contrast. Large text needs at least 3:1; body/labels at least 4.5:1. Lime remains the shared action/active accent. Preserve the exact interactive state meanings and existing input contrast.

| Game | Family | Surface and title ink | Composition focus |
| --- | --- | --- | --- |
| Push | C | Cool arena rubber, slate teal; pale mint | Center complete short rail against circular arena. |
| Shrink | C | Blue-green enamel; pale ice | Same complete-group centering; preserve warning world. |
| Color Knives | C | Warm smoked timber; ivory | Compact balanced rail, no decorative blade pattern in cap. |
| Bomb Tag | C | Warm charcoal/coral shade; warm ivory | Center cap plus actual rows, not the header alone. |
| One Shot Western | A | Sunset leather brown; cream/amber title | Remove upper stitch; timer close to title, readable round facts. |
| Local Tanks | A | Olive armour; pale mint title | Redistribute title/score and three facts evenly. |
| Tank Arsenal | C | Blue gunmetal; ice title | Complete logical contour; centered attached compact rail. |
| One Cursor Chaos | A | Muted laboratory blue; ice title | No brackets; title and Time Left read as related. |
| Wi-Fi Kart Party | C | Asphalt charcoal; warm white title | Center useful rail; shared label/icon font on phone. |
| Pass the Monster | B | Existing teal textile shading; pale cream/mint title | No stitches; retain two-column queue and nearby real creature. |
| Spy | B | Quiet midnight dossier blue; pale ice | Enlarge useful content around 1.5× while keeping the complete group centered. |
| Sinyak: Millionaire | B | Smoked console plum, restrained brass shade; ivory | Time Left/Turns centered within the real title/status group. |
| Sinyak Quiz | B | Deep studio plum; lavender-white | Leaderboard height/top follows question plus answers. |
| Warsaw Discoveries | B | Desaturated mineral violet; warm ivory | Same real-content bounds; no unrelated etching or red phone slab. |
| Charades | B | Soft theatre green; cream | Board and task share height/top; actor remains context. |
| Careful, Jenga! | C exception | Single warm coral/honey transparent-edge wash; ivory | Remove remaining hard backing/texture; warm readable phone +/- group. |
| Night Shift / Crane | C exception | Full-width minimalist night city with one navy/teal transparent-edge wash; pale mint | No hard backing; quiet task/crew separators and complete scroll edges. |
| Quick Battleships | C | Navy enamel; pale ice | Rectangle replaces trapezoid; sidebar spans combined board stack. |
| Draw & Guess | B | Quiet lavender paper/workspace shade; white | Board aligns canvas/current-message area rather than Drawing heading. |
| Two at Sunset | C | Sunset brown ledger; cream | Centered compact rail; central duel signal belongs to action field. |
| Tap Race | A | Timing-console graphite; lavender-white | Field rises into available height; no ornamental top stripe. |
| Punch Meter | A | Muted plum vinyl; pale rose-white | Balanced facts above full bag scene, no decorative hash marks. |
| Flappy Sprint | A | Flight blue; pale ice | Full sky, quiet rectangular header. |
| Hungry Mouths | A | Muted warm plum; cream | Whole world, centered clear fact groups. |
| Snake Lines | A | Deep circuit green; pale mint | No decorative brackets; functional grid remains. |
| Carry Ball | A | Stadium slate; warm white | Full field height; top-attached bottom-rounded header. |
| Marble Bloom | A | Botanical teal; warm ivory | Full field height; title/time/facts balanced. |
| Pocket Siege | A | Soft charcoal blue; ivory | Pleasant rounded geometry, clear grouped gauges and input facts. |
| Bow Club | D | Warm target timber; ivory | Real facts separately grouped from quiet guidance. |
| Poker | A | Original purple table and plum header; ivory title/lime accent | Uniform table fit below the real cap; no replacement green oval; quiet fact separators. |
| Air Hockey | A | Ice-blue enamel; pale ice | Full rink height; top-attached bottom-rounded header. |
| Mine Together | C | Slate green; pale mint | Board/rail align; phone controls light green and distinct from backing. |
| Curling | D | Existing ice/pearl blue; dark ice ink on light panels | Preserve approved drawer/crowd; remove nested violet fill/ornament. |
| Bowling | D | Walnut/amber shade; cream | Equal lane gaps; useful phase/score group. |
| Swarm Gate | D | Quiet lavender stone; warm ivory | Preserve coherent generated wall/gate and native-aspect turrets; no corner decoration. |
| Shooting Gallery | D | Meadow timber; cream | Preserve flat camera, grounded covers/characters and clear real ability facts. |

## Fresh-image acceptance gate

Each row needs current whole TV720 and TV1080 originals, plus current native phone402. Record exact paths/SHA and source window. A hash/cascade/geometry test confirms provenance or layout invariance, not aesthetic quality.

The reviewer must judge: (1) first eye landing on title/task; (2) proximity of title/time/facts; (3) balanced side negative space; (4) actual glyph ink and hierarchy; (5) complete rail/task group placement; (6) correspondence with field/content bounds; (7) meaningful single material rather than decorative noise; (8) complete available field without artificial bars. Inspect an extreme roster/long name where the composition depends on it. Functional input/world checks remain with owners; static images do not prove moving-target visibility or physical touch usability.

After the implementation freeze: one independent all-36 image pass, a single concrete correction batch if required, then fresh confirmation of affected surfaces. Previous originals remain evidence of the old design, not approval of this reset. Browser checks and physical-device checks are reported separately; no physical-device acceptance is inferred here.
