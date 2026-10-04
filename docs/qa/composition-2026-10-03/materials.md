# Visible materials and attached motifs — 36-game plan, 2026-10-03

Status: root authorized implementation after family plans. This is a paint/composition contract, not fresh acceptance. Previous global composition/theme approval was explicitly rejected. No material key or invisible selector counts as completion.

## Evidence and responsibility

Baseline: `output/playwright/ui-rework-2026-10-02/final-catalog-1734/`, exposed by gallery17807. Material lead opened all ten whole TV/phone originals for the five sports games and the actual Swarm turret, wall and gate assets. Other family owners individually opened their game originals; their exact observations and selectors are in arena.md, construction.md, arcade.md, social.md, quiz.md and tabletop.md. This is coordinated evidence, not a claim that the lead independently viewed all 72 baseline originals.

Shared HUD owner paints the actual existing `.tv-info-dock` in `.gamebar.tv-information`, keyed by `body[data-tv-game]`. Modes are centered-scoreboard, rail-cap, content-cap, game-owned. Local owners paint the nominated existing rail/task/control backing or canvas material; they do not inject parent CSS. Sports game-owned mastheads remain local. Main menu, logos, buttons, input rules, effects, native fading header/footer and supplied props remain unchanged.

## Paint contract

- `--game-panel-fill`: full opaque material base/wash, visibly different per identity. It is a CSS background value, not an opacity token.
- `--game-panel-rim`: material edge color, applied to the one actual outer contour.
- `--game-panel-ink: #f6f2ff`; `--game-panel-muted: #d1cadb` on dark materials. Verify both against the brightest actual paint at 4.5:1 minimum; large text 3:1 is not permission to make descriptions faint.
- `--game-panel-motif`: one repeatable CSS/SVG edge motif, not a new box and not a generic glow. Grain/sheens remain quiet in the body; recognisable stitching, lane marks, bracket, circuit or ring detail is confined to the existing perimeter.
- 28/22/18 px role radii and existing curved cap contour remain shared geometry. No different radius guesses per game. No nested outlines around each metric.
- Actual `.current`, `.turn`, `.selected`, disabled and held states keep their semantic marker/feedback. Do not make the whole material disappear on an active row. No inherited text recoloring across buttons/canvas labels.
- At 320 px one meaningful edge/motif still reads; decoration shrinks/hides only before it collides with ink. No decorative image covers a name, timer, slider, gesture caption, joystick or focus ring.
- Existing unboxed task copy remains unboxed. Use the already visible cap/rail surface; do not add an empty container solely to show material. A finished game has at least one visible material-bearing gameplay information surface, with actual screenshot evidence, not a lobby-only `.result-card`.
- Legacy `game-ui-themes` selector heuristics and 3% color changes cannot serve as acceptance. New declared semantic panel paint takes precedence; shared and local owners must avoid duplicate paint/competing pseudo-elements.

## 36-game matrix

Each top/base pair is a concrete starting paint; owners can balance it against the actual field with one bounded confirmation. T = real TV information plane; P = existing phone information/control outer backing, when boxed. Interactive button/pad faces are excluded. The shared visible cap receives the matching identity even where the local task remains unboxed.

| ID | Identity and material; top → base; rim | Actual eligible visible surface | Attached ornament / contrast rule |
|---|---|---|---|
| push | Arena rubber; `#30424a → #1c2b32`; `#b0d9ca` | T unified cap + ordered arena rail; P existing movement stats | Molded double seam and short arena-ring arc at rim; keep lime action and player rings distinct. |
| shrink | Tide-polished enamel; `#23444c → #142f38`; `#8fe0dd` | T circular-family cap/rail; P movement stats | A receding concentric edge arc, not a decorative timer; neutral white names. |
| knives | Dojo timber; `#493329 → #2f241d`; `#d8b887` | T cap/ordered rail; P `.knife-count` / existing stat backing | Two engraved timber lines and one blade-slot corner; ammo/HP remain explicit, no steel pattern behind numbers. |
| bomb | Hazard casing; `#493127 → #2d211e`; `#e6ba76` | T cap/ordered rail; P movement/heat stats | Bounded amber caution seam only at outer edge; real bomb heat color stays authoritative. |
| western | Sunset leather; `#4a322b → #2f221e`; `#dfb38d` | T centered match cap; P existing Western stats | Saddlery stitch across one edge; field DRAW/false-signal retains priority. |
| tanks | Armour instrument; `#35403a → #202a25`; `#c6d5b5` | T centered match cap including real team score; P controller status card | Sparse machined bolt corners and engraved instrument line; no camouflage under team/score text. |
| tankarena | Blue gunmetal; `#31404b → #1d2c37`; `#a4d5e6` | T rail cap + actual ordered Arsenal rail; P `#combatStats` | Fine machined vertical seam/vent at perimeter; team color remains marker, not full card wash. |
| chaos | Lab instrument casing; `#2e425a → #1b2c43`; `#92d7ed` | T cap + `.mission` task row; P `.roleBadge` / task backing | Sparse cyan circuit termination and calibration ticks, never beneath hazards/targets. |
| kart | Asphalt pit board; `#3b3549 → #252332`; `#c5c1dc` | T cap + real `.side-panel`; P existing drive status/slider outer group | Narrow checker edge and machined dividers; speed/lap identity order stays intact. |
| monster | Storybook cloth; `#3f304b → #292034`; `#c5a6db` | T cap + existing queue/turn surface; P tool/confirm outer backing | Quiet stitched edge; no restored full-screen backing or ornaments on the drawing surface. |
| spy | Ink-indigo dossier; `#26344a → #182437`; `#87b7d6` | T cap + roster/turn plane; P `#mySecretMini` / existing turn box | Tab-shaped edge engraving, not a secret-location label; public/private copy unchanged. |
| millionaire | Brass quiz console; `#3e3445 → #272130`; `#d6c29b` | T content cap + money ladder; P existing question context | Fine brass inset edge and progress-rail engraving; do not reskin four answer buttons. |
| sinyakquiz | Royal studio satin; `#3e2d54 → #281c39`; `#c6b1ed` | T content cap + roster; P existing question/status backing | Soft satin edge catch and two studio corner bars; correct/wrong answer state remains unchanged. |
| warsaw | Violet mineral/plaster; `#3d3549 → #282333`; `#d9be95` | T content cap + roster; P existing compact question/status, outer red backing removed | Quiet amber map-line corner; no new outer panel around all four answers. |
| crocodile | Theatre green lacquer; `#263d36 → #172d25`; `#a9cfb2` | T content cap + actual roster; P existing secret/role backing | Tiny embossed speech/star edge; public actor scene never exposes secret word. |
| jenga | Warm timber; `#49392b → #30251e`; `#dcb889` | T rail cap + existing borderless warm fading information rail; P selection outer backing | Grain in existing paint, one warm divider; no hard outer rail card or dark texture under Stability. |
| crane | Dusk-blue worksite enamel; `#34434e → #202e3a`; `#e0b76e` | T rail cap + actual task/crew rail; P `.phone-status` / `.phone-meters` | Amber survey seam and two small rivet corners; grounded crane art not decorated. |
| naval | Navy bridge enamel; `#24495a → #153243`; `#9dd7e5` | T cap + `.naval-console`, actual `.miniOcean` water; P existing targeting readout | Restrained radar edge rings/brush seam; hit orange and miss white preserve distinct meaning. |
| drawguess | Paper-lavender artist desk; `#3b354b → #292439`; `#c3bddc` | T content cap + existing public sidebar; P drawing-tools outer backing | Pencil hatch at margin; preserve actual incumbent black dotted canvas, not a white substitute. |
| western_duel | Saloon ledger leather; `#48342b → #2f251f`; `#dab18b` | T match/rail cap + actual tournament wing; P existing next-pair backing | One cream saddle stitch and brass divider; no second heavy queue card. |
| taprace | Violet timing enamel; `#3c354f → #282139`; `#c4b4e4` | T attached cap + compact timing fascia; P `#arcadeStats` | Checker lip and sparse route ticks; remove unrelated floating slabs from field. |
| punchmeter | Smoked plum vinyl; `#4a2d3c → #30202c`; `#dc9daa` | T compact match placard + result plane; P existing result/sense backing | Single outer stitch matching bag/leather; bag swing and input feedback remain dominant. |
| flappy | Frosted flight desk; `#2c4258 → #1d2f42`; `#a4dce7` | T attached cap + score panel; P `#arcadeStats` | Pipe-rim/feather silhouette at edge only; no clouds beneath live text. |
| hungry | Snack-bar docket; `#443442 → #2c2230`; `#d8b5c3` | T attached cap + score panel; P `#arcadeStats` | Embossed cutlery line at perimeter; no added food obstacles or grid pattern behind names. |
| snakelines | Circuit enamel; `#254b47 → #163731`; `#95e2d5` | T attached cap + score panel; P `#arcadeStats` | Two circuit corners and terminal ticks; trail/player colors retain contrast. |
| carryball | Graphite stadium board; `#3b3e48 → #252a33`; `#c7ddd0` | T cap with real team score + score panel; P team/stats backing | Chalk/field-line edge, no new field boundary; team scores belong together. |
| marble_bloom | Botanical glaze/ceramic; `#2a4c4d → #1a3439`; `#dbd5ad` | T cap + centered crew dock; P ammo/aim station outer backing | Etched concentric edge rings and warm ceramic rim; ammo patterns/crosshair remain unobscured. |
| pocket_siege | Charcoal field instrument; `#383748 → #252633`; `#c4bfd8` | T compact cap + existing weapon/crew surfaces; P range/module outer panels | Sparse corner ticks/brushed seam; remove muddy green backing while keeping lime active readouts and private deck. |
| bow_club | Archery timber/range enamel; `#47392d → #2d2922`; `#dfc79a` | T compact local heading + actual score rail; P `.bow-readout` / tracking plane | Target-ring edge arc and fletching notch; four AR markers and canvas remain exact. |
| poker | Emerald velvet/felt; `#235442 → #14382d`; `#dcc99e` | T compact cap + existing actual felt/attached seats; P existing pot/turn readout | Fine weave inside felt, leather/brass table lip retained; no paint on fold/call/raise buttons. |
| airhockey | Cool rink enamel; `#294957 → #19323e`; `#a6e5ee` | T compact cap + rink/last-hitter plane; P existing score/readout | Perforated side lip and cool sheen outside puck path; no changed mallet/puck material. |
| mines | Graphite survey plates; `#39454a → #253137`; `#c3d9cb` | T board/rail cap + actual crew plane; P existing task readout | Survey bracket corner; covered plate/open mineral well remain distinct, no invented prospector mechanic. |
| curling | Frosted rink equipment; `#214957 → #163642`; `#a2e0e7` | T local unified masthead + sliding score drawer; P accepted launch station outer panel | Frost seam and partial house-ring edge, one existing stone cutout retained; gesture captions stay clear. |
| bowling | Walnut lane equipment; `#483b33 → #2f2a29`; `#e2c58f` | T local unified masthead + sliding score drawer; P accepted launch station outer panel | Fine lane-grain wash and short brass lane ticks; no pin art behind score or power. |
| swarm_gate | Plum stone/guard equipment; `#3e3b4b → #292736`; `#dbca9f` | T unified local masthead/gate readout + score drawer; P existing status/task backing | Quiet shield/brass seam at edge; new courtyard, connected wall and gate use same flat authored palette, not cyan brick floor. |
| peek_shoot | Meadow gallery timber; `#4b3a30 → #302921`; `#dfc18f` | T local unified masthead + score drawer; P existing status/task backing | Two horizontal crate-grain lines and tiny meadow leaf at outside edge; white-flag guide stays whole. |

## Actual acceptance evidence required

For every game, record the actual painted selector, role/state/viewport, fill and rim, source hashes, one screenshot observation of recognizable identity, and a separate observation that text/primary action still leads. A successful computed CSS token is insufficient. Observe TV1280/1920; changed phone paint must also be opened through actual shell/bridge at402/320, with full footer and real active/observer/disabled states. Source revision remains fixed through capture. Root grants at most three simultaneous QA browsers. Mechanical checks supplement visual review and actual input checks; physical-device validation remains separate.

Impeccable context was loaded once for this material target. Its older rankings-only PRODUCT.md scope is superseded by the user's explicit current all36 request. Layout/shape guidance informed the plan; craft-floor must be read immediately before production edits. No extra user permission is requested: root's coherence/implementation grant is the existing user-authorized coordination gate.
