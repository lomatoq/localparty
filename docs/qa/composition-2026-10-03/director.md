# Assessment A — composition direction for all 36 games

2026-10-03. Design only; runtime source remains untouched. The new human rejection supersedes earlier composition verdicts. This document does not approve an implementation.

## Evidence and spatial thesis

I individually reopened all 36 original 1920×1080 TV images in `output/playwright/ui-rework-2026-10-02/final-catalog-1734/*-tv-live-1920.png` for this assessment. Findings below come from those images, with targeted source reads to distinguish presentation from game mechanics. Other agents' detector reports were not used as evidence. The governing sources are AGENTS.md, design-contract-2026.md, ui-regression-rules.md, the October 2 design rules, and Impeccable layout/craft-floor guidance.

The recurrent failure is four unrelated islands: a task pill at upper left, title/actor and timer at viewport center, another metric plate at upper right, and a roster beginning on an unrelated baseline. Removing overlaps does not make these belong together. A game needs one information anchor and one obvious play or content region. The leading task must be identified by position and scale before decoration is added.

Four families below replace that fragmentation. They share spacing and hierarchy, not identical silhouettes or materials. A surface should visibly belong to the game's material: studio satin, ice, felt, timber, asphalt, masonry or equipment enamel. Existing art, wordmarks, font roles, controller proportions, footer, input, privacy and physics are protected. Every one of the 36 must have a visible, intentional material decision; invisible theme attributes are not a result. Depth and ornament should clarify attachment, never create another headline or frame around an already framed unit.

Game identity remains the game wordmark/name. Current actor is a separate supporting line, never a replacement game title. Published state, clock, scoring and tied places remain authoritative. This is a layout exercise, not permission to rename state or invent rounds.

## Coordinate language and reusable families

All coordinates are **logical 1280×720**; 1920 scales by 1.5. They are design targets, not permission to crop a world. Outer scene gutters stay 12. Actual field, rail and content rectangles must be published by their owner. Shared HUD attaches to those rectangles instead of guessing from viewport center. Related items use 4–8 spacing; sibling groups 16–24. The header and its metadata are one surface, not a header plus a separate wing.

### A — centered live scoreboard (13 games)

One opaque authored curved dock centered on the **actual field center**, usually `x = field.cx − 280`, `y = 12`, width ≤560, target height 80–96, hard ceiling 104 including the metric row. Title/clock or team score share a top row; supporting progress/leader/points share a compact lower row. Do not retain the old independent right wing or left task pill. Optional current actor is a quiet row within that same dock. Team score takes precedence over personal leader statistics.

The world remains continuous with complete uniform projection and 12 top/bottom receiver gutters. A 104-pixel header is **not** an automatic 104-pixel field exclusion. First use a genuine nonplaying apron if one exists; otherwise the owner must demonstrate top-path visibility and deliberate header placement in actual play. Neither a transparent ghost notch nor a new full-width opaque slab is a solution. Never change coordinates, hitboxes, camera aspect or hide moving targets merely to satisfy this template. If a particular field cannot tolerate the proposed dock, return that named game's measured alternative for director review.

Actor-local labels stay with their actors; comparison rosters have a deliberate common baseline. For 2/4 players, a bottom strip is centered on the field and is one horizontal unit, with no outer frame enclosing already framed rows. Dense rosters may use a measured peripheral drawer/rail without changing the scoreboard's center. No unrelated list floating halfway down each side.

### B — centered content group (7 games)

The cap, prompt/performer/canvas, and supporting roster form **one composition**, vertically balanced in `x24..1256, y80..684`. Typical complete group height 480–560; center its bounds around y360, rather than pinning its first child to the top and leaving half the screen empty. A long question or revealed drawing can grow within these limits.

Use a roster column 260–304 wide, a 24 gap, and the remaining width for the primary content. The integrated straight task header is aligned to the **actual content/copy column**, target height 56–64. Its bottom is 12–24 above the local prompt/art group. It uses a compact tonal band/keyline or rounded16 surface, never the legacy edge-notch silhouette. Roster top aligns with the start of that local group; it is supporting information, not a second giant headline. The header sits directly at the top of the actual task inside this centered composition, instead of floating at viewport y0 or across a large empty gap. Do not wrap the entire cluster in another glass rectangle. Shared anchor protocol: an actual `data-tv-hud-anchor` content rectangle and a `data-tv-hud-cluster` overall rectangle.

Actor and task remain distinct: game title → clock/progress → current actor → actual prompt/art. The actor's name should not be repeated at three sizes. Monster text and animal belong side by side within one 900–1040-wide group, with 24–40 internal gap, not opposite ends of the screen. Question and answers are adjacent; ornament and status cannot separate them. Drawguess canvas remains the dominant region and retains its native drawing aspect.

### C — continuous task-and-roster rail (11 games)

Final root coordination assigns Push, Shrink, Knives and Bomb to this family because their owners retain intrinsic comparison rails. Use one real rail as the title/task anchor; the opposite wing shares its row baseline and material, never acquires another title/clock. The complete circular world remains unchanged.

Use the game's **existing** rail side and width; do not invent a rail in Poker or the fullfield games. Typical right rail `x1040..1268`, left rail `x12..272`, with a 16–24 separation from the field. Actual owner measurements override these illustrative coordinates. Title, timer, actor/task, supporting metrics and roster form one contiguous column. Cap width equals rail inner width, target height 104–136; 170 is a ceiling for truly necessary metadata, not a default empty allocation. Roster follows by 8–12. No cap extends across the track/actors, no floating viewport-center notch remains, and no arbitrary 60-pixel hole precedes the first row.

Cap and roster may be grouped through alignment and a continuous material wash rather than an enclosing hard card. **Jenga explicitly keeps the human-requested single floating warm coral-to-violet gradient fading to transparency: no hard outer rim/card/shadow is introduced.** Its cap still belongs to the same right-side alignment as task/selection/force/Crew. All numeric and ranking axes remain stable.

Naval's left bridge and right board array are one horizontally balanced workspace. Board array is centered in its remaining rectangle; name sits 8 above its own board. Do not pin the lower pair to y708 while its title floats high above. Mine Together's cap, instructions and roster share its left-column axis; the game board and setup Start receive at least 24 separation from the measured cap edge. Safe space is local, not a blanket field shrink.

### D — game-owned sports masthead (5 games)

Keep the authored game HUD and suppress shared duplicate chrome. World/camera/hit mapping stays owned by the game. Left masthead contains wordmark, actual phase and one quiet line; right score/clock unit shares its top/bottom baseline, material and typography. Logical top12, height64–80; no huge detached pills. These are a coherent pair of ends of one scoreboard system, not two generic panels. The clear world between them stays available. Add a measured target-visibility policy where necessary.

Bow's calibration markers and their exact camera positions are protected. Curling's authentic rink, joined broom, crowd and ice team drawer remain; this redesign does not resurrect rejected capsule grids. Dense sports readouts appear as the appropriate game-owned drawer, not a permanent wall covering the action. Mobile action ordering and primary controls remain protected.

## All-36 pattern and placement matrix

| Game | Family / primary | Direct original finding | Concrete placement decision and material direction |
|---|---|---|---|
| Push | C / arena action | Title/time, right stats and paired side lists make separate islands around a strong circle. | One measured intrinsic-rail cap with game/time/round/alive; opposite comparison rows deliberately share its lateral baseline. Quiet arena enamel, no extra enclosing panel. |
| Shrink | C / shrinking arena | Fragmented title and metrics compete with warning-room composition. | One intrinsic-rail cap; actual round/alive grouped and opposite comparison wing shares the row baseline. Keep complete warning room and local actor feedback. Arena enamel with a restrained danger accent only in actual danger. |
| Knives | C / rotating wheel and local throws | Opposite-corner metadata and title do not share the wheel's center. | One measured intrinsic-rail cap; actor ammo stays attached to actor, opposite standings share the rail baseline. Top actor requires actual visibility proof. Brushed equipment edge/material, never another glowing blade badge. |
| Bomb | C / carrier and arena | Side roster islands and floating stats weaken the carrier's hierarchy. | Unified intrinsic-rail round/alive/clock cap; full circle and carrier cues lead. Comparison data adopts a shared side/bottom baseline. Matte arena material with actual carrier accent. |
| Western | A / WAIT–DRAW cue and cowboys | Floating title, tall right stats and separate large instruction form multiple competing headlines. | One cap for title/round/clock/alive. Central cue remains primary; quiet guidance sits directly beside/below it. Full cowboy silhouettes retained. Warm saloon enamel, not an extra scenic frame. |
| Local Tanks (`tanks`) | A / team flag score and world | 0:0 floats beneath an unbacked title; clock/alive/points occupy a separate giant right plate. | One centered scoreboard: title + **0:0 primary**, time/alive supporting. Remove separate wing. Preserve complete CTF world and photos/mascots. Field-equipment enamel with team accents. |
| Tankarena | C / combat field | Title curve, green stats plate, IN ARENA heading and roster read as four stacked systems. | Flush-right continuous rail cap: game/time, actual points/kills/alive, then roster 8–12 below. Full-width HP within each row. Complete uniform green world/quiet apron stays; dark equipment rail material ties it to the field. |
| Marble Bloom | A / authored chain and shot | Floating Level and right Points/Queued, plus a bottom strip weighted to the left. | Unified game/level/points/queued cap; bottom roster centered on actual chain field. Preserve whole authored path and matching ammo symbols. Polished toy-game enamel, chain colors reserved for mechanics. |
| Pocket Siege | A / aim, trajectory and terrain | Aim/Fire upper-left, actor/time center, turns/wind/points right, ammo and roster are separate anchors. | One turn-aware cap containing game identity, actor/clock, wind/turn; weapon information attaches to the same top baseline as a quiet annex. Field/trajectory stay dominant. Weapon arsenal material on existing instruments, no new art over trajectories. |
| Tap Race | A / lanes and finish | Title lacks a backing while right plate dominates; bottom strip nests another frame around cards. | Backed centered game/time/leader scoreboard; lane identity tags remain anchored to lanes. One comparison strip without outer nested frame. Race timing-console material and restrained lane accents. |
| Punch Meter | A / suspended bag and punch feedback | Good central bag, but title/attempt float on chain and metadata is an unrelated right box. | One compact centered cap with game/attempt/time/points; bag is primary below. Preserve whole bag/chain/effects. Gym-equipment enamel, score feedback owns the bright accent. |
| Flappy | A / birds, gaps and pipes | Floating title/time and giant right plate sit over the active sky. | One backed compact cap with actual time/alive/leader, no invented rounds. Actual top flying path must remain readable. Sky-compatible timing-console material, not another landscape card. |
| Hungry Arena | A / mouths and food | Title/time and right plate create visual imbalance above a full field. | One centered cap for game/time/alive; player score remains actor-local. Retain uniform world projection and no hiding mouths under HUD. Quiet arena equipment surface; food colors remain focal. |
| Snake Lines | A / lines and heads | Detached time/title and right round/leader plate dominate the opening field. | One centered game/time/round cap; actor names follow heads. Field remains complete. Cool circuit-console material aligned to the authored grid, no random extra grid decoration. |
| Carry Ball | A / ball possession and team score | Team 0:0 is separated from clock/leader at top right. | Team score/time/game form one centered scoreboard, leader info secondary or unnecessary duplication removed by owner semantics. Complete pitch/players retained. Stadium scoreboard material. |
| One Cursor Chaos | A / actual shared cursor task | Calibration pill, progress/title and timer are three independent corners; bottom status unrelated. | Calibration/task name and progress/time share a compact scoreboard; current instruction and outcome sit adjacent to the task target region. Preserve target coordinates and shared cursor mapping. Precision-console material, no huge decorative crosshair. |
| Kart | C / course | Metric plate intrudes into track/rail seam, floating title and RACE pill are disconnected from standings. | **Right measured rail cap**, title/game clock/lap metadata and race phase within the same rail width as standings. Remove centered title and detached top-left pill. Existing full course unchanged. Asphalt/metal rail material with one quiet authored race detail. |
| Two at Sunset (`western_duel`) | C / central signal and duelists | Huge upper-right plate crosses field/rail boundary; translucent center actor notch competes with DRAW. | **Right measured rail cap** game identity, actual duel number/time/actor context, then future queue and standings contiguous. Central signal remains dominant; actor names belong at duelists. Warm saloon equipment material. No ghost notch over sky. |
| Pass the Monster | B / hidden-part task and mascot | Extra large frame, actor replaces title, instruction and animal lie opposite sides with a vast gap. | One centered text/animal group, 24–40 internal gap, no giant outer frame; cap over that group's content axis. Queue directly beneath task text; explanation quiet nearby. Stitch/toy material on existing queue only, preserve mascot and hidden drawings. |
| Spy | B / asking→answering exchange | Header names asking player while right plate repeats answering, roster begins on unrelated vertical axis. | Exchange, its participant names and roster form one centered group. Cap says game, clock/round, separate actor context. Roster aligns exchange start; help directly beneath exchange, not another footer headline. Quiet dossier/console material, privacy unchanged. |
| Charades (`crocodile`) | B / actual performer | Three top islands, floating performer center and roster in a separate low card. | Game/turn/time cap above performer; actor/name appears once with performer. Roster and performer form centered two-column group. This-turn outcomes stay near performer. Stage/satin material, cooperative hearts retained. |
| Drawguess | B / drawing canvas | Top actor repeated in header and local headline; guesses and artists form a disconnected stack. | Canvas dominates one centered content group; game/turn/time cap above canvas axis, artist supporting line once. Guesses+roster share adjacent support rail start. Drawing-tool material on rail/utilities, never frame inside canvas. |
| Party Quiz (`sinyakquiz`) | B / question then answers | Question and roster are top-heavy under three independent header blocks, leaving a blank lower half. | Whole roster+question/answers group centered vertically; cap on question-column axis; question→answers 16–24 gap, supporting answer count quiet and nonduplicated. Dark satin studio answers with narrow sheen. No outer question card. |
| Warsaw Discoveries | B / question then answers | Same detached/top-heavy grouping, with unrelated large reddish roster material. | Same B coordinates, centered roster+question group. Desaturated violet mineral/plaster with subtle amber map etching; strong red reserved for actual wrong answer. Question remains primary. |
| Millionaire | B / question and prize progression | Actor/time cap floats; left ladder and question feel separate and duplicated turns occur. | One balanced ladder+question group; game cap on content axis, actor supporting. Actual level/next prize stay attached to active player's progress. Smoked violet show console with restrained brass inset. |
| Careful, Jenga! | C / actual support/task and tower | Actor header over tower, detached Blocks/Stability top-right, task/force/selection/Crew below it. | Right cap game/time/actor + Blocks/Stability feeds directly into task/selected/force/Crew alignment. Keep **single soft warm gradient**, no enclosing hard card. Preserve tower/table projection and accepted full-width phone selection/preview. |
| Crane | C / suspended block and stack | Actor notch floats over crane, right metrics duplicate local block/attempt context above Crew. | Continuous right cap game/time/actor/floors/lives, local placement task and Crew contiguous. Actual block remains center of field. Construction equipment enamel, no new panel over crane/footing. |
| Quick Battleships (`naval`) | C / public board array | Boards are floor-pinned while header floats above; bridge begins on a separate baseline. | Left bridge cap absorbs title/time/alive/score. Center entire board/name array in remaining field rectangle, names 8 above boards; reduce unrelated vertical spacing rather than crop lower boards. Naval console/ocean material. |
| Poker | A / table, seats and community cards | Actor/time cap separated from right Hand/Pot/Bet plate; pot/actor repeated on table. | One centered compact table scoreboard containing game/hand/actor/time; choose one authoritative Pot/Bet presentation associated with table, not duplicate headline. No invented side rail. Preserve table/card/seat geometry. Felt/casino console material. |
| Air Hockey | A / rink and puck | Team score floats on translucent notch; timer sits unrelated at top right. | One compact centered game/team-score/time scoreboard; last-touch information remains attached to corresponding rink end. Preserve whole rink and dynamic name avoidance. Ice/arcade scoreboard material, no newly framed rink. |
| Mine Together | C / grid and shared opening | Left notch and metric plate almost touch grid start and setup action; rules/roster are separate groups. | One measured left cap + compact rules + roster column; grid/setup Start has genuine 24 local inset from cap edge. Keep complete grid and full tile readability. Existing mineral/equipment material, no another enclosing grid frame. |
| Bow Club | D / targets and camera calibration | Actual world coherent; title/one-line game state is a weak independent top anchor. | Compact game-owned masthead groups logo/time/game detail; scores align bottom between exact protected calibration markers. Preserve marker positions and targets. Range-scoreboard material, avoid another central shared notch. |
| Curling | D / stone, house and team result | Authored arena is strong; masthead and metric end can read as disconnected generic plates. | Keep one authored sports scoreboard pair with common baseline/ice material. End/stone/time/team score hierarchy deliberate; roster/dense ice drawer game-owned. Preserve crowd/broom/whole rink; no new shared cap. |
| Bowling | D / ball, pins and frame result | Good lane axis; top boxes use unrelated generic materials above authored alley signage. | Common compact game-owned scoreboard material and baseline; frame/throw clock grouped, phase beside wordmark. Keep lane camera/pinsetter and exact controls. Alley enamel/wood identity, not another lane backdrop frame. |
| Swarm Gate | D / enemies→gate defense | Vivid blue brick plane competes with enemies; turrets appear thin/warped, bright horizontal stripe has no readable game role, gate/wall joins expose holes. | Keep exact enemy/turret/gate world coordinates. Quiet desaturated stone ground, clear grounded wall/gate seam with decorative underlay only, preserve real open/damaged states. Remove the decorative `glowBox(90,.08,.07,...)` stripe if owner confirms no mechanical role (source places it in staticScene). Preserve native turret aspect/pivot through rotation; no nonuniform stretch. Scoreboards share game-owned baseline/material; popup must clear active HUD. |
| Shooting Gallery (`peek_shoot`) | D / actual targets behind cover | Coherent flat cover/world now, but two heavy top plates and transient center notice compete with targets. | Compact paired mastheads with common material/height; weapon notice is a short secondary HUD event, not a new center-stage pill obscuring targets. Preserve all covers/target hit coordinates, flat camera and full characters. Field-console material, effects remain authoritative. |

## Source boundaries and owner handoff

Shared HUD owns mode selection and removal of independent wings, not game engines. `public/tv-information.css` currently makes the through-field center backing translucent and positions Tankarena's separate stats wing; these are shared attachment concerns. Owners publish actual rail/content rectangles and implement local group placement. Social content-anchor protocol should avoid guessed viewport offsets. Sports already owns `.ss-host-top` and its score units; retain suppression of shared HUD.

Naval source has repeated height/centering overrides in `games/naval/public/screen.css`: its new grouping must replace the relevant managed-TV layout coherently, not add a third conflicting override. Swarm source confirms the decorative horizontal `glowBox` in `staticScene()`, the two flat wall sprites and independent gate sprite, and billboard turret aspect/pivots; any adjustment remains rendering/presentation only. Repeating brick color values are presently much brighter than the supposed quiet masonry comment. No physics inference is made from a screenshot.

## Review gate after owners implement

One fresh original TV and full phone pair for **every game**, English actual room, current frozen source. Then one bounded named correction batch and one confirmation of affected originals. A screenshot with nonoverlapping boxes can still fail: squint-test dominant task, shared anchor, proportion of unused space, alignment of title to actual region, coherent materials, believable camera/grounding and actor visibility are first-class criteria.

Required alternate evidence: A actual top-moving targets/players plus meaningful score change; B short/long prompt, turn/reveal and privacy; C 4/max roster, tail rows, selected/held state and field edge; D real sweep/roll/shot, full targets, score event and dense drawer. All original views and actual action proof are recorded separately. Automatic checks prove guardrails, browser images/actions prove the captured surface, and physical device/TV behavior remains unverified unless directly tested. Baseline 1734 images are design evidence only, not current implementation acceptance.

## Direct-original fingerprint manifest

All 36 below were individually opened in original detail during this new design pass. Fingerprints bind the observed baseline, not the forthcoming implementation.

| Original filename | SHA256 |
|---|---|
| airhockey-tv-live-1920.png | 8ac4826207585aa4d2a9af3e114ff363ddc05890d43ac441b962f879db010328 |
| bomb-tv-live-1920.png | 8c51c072e856606a699e1c17d7f3814e43663550997bc28c2a935cb9b757db85 |
| bow_club-tv-live-1920.png | 7db8b47069e03d66e21ed7129cf02aef1c401b6e101b0dee568964fa7409ade9 |
| bowling-tv-live-1920.png | fd9ddfc7c2e8c60f2d54c9edf21d75645caa844c36673d482c0846e6a3af7a85 |
| carryball-tv-live-1920.png | f254b88995cdae2a8e1bb0f0309a9170aaed57c2f1b265669744e75380602656 |
| chaos-tv-live-1920.png | 0053204e26a8e74c041b38cce597644d18a03956b80beffe38a2d2549cfdc6a0 |
| crane-tv-live-1920.png | adc91efc91b3a477d960008f8524567e5d5dd6716b9f194f5bc117daeb16e5f2 |
| crocodile-tv-live-1920.png | ad5240c85268e6f818bb048e55c70e428afaf9dfe77cdedb5a7e5afa770e9ed3 |
| curling-tv-live-1920.png | fe42c172b7458de256e2a2cddfbf4ea644a0384aa3141a4babb887f22cd7c9b7 |
| drawguess-tv-live-1920.png | 64d3a043c26c998f955c77fdec50d8fc9640ca0a81f5bd0d3c5e65a398b6a1be |
| flappy-tv-live-1920.png | 070d0c8c08e7f7e8533ad67e4dc702883f654b134d189ba2b4ba978a3453b6e7 |
| hungry-tv-live-1920.png | e446179d93a816e22df8b8ecf3b1e1968fba9d4116734397a7a0417cb4f6db75 |
| jenga-tv-live-1920.png | 5d1b6886385607f6d3f1fb72616d17232c4de5c5b5a0091e550728f03aac5610 |
| kart-tv-live-1920.png | f3c1b872b2cbb5659ab41b71ebddacc655d017bcfa72d909e5b148851fbd2d0e |
| knives-tv-live-1920.png | de26007f9e9ffbd04895d3abe51cb5e0d71ea6303cf0cfce25f80504aec680f4 |
| marble_bloom-tv-live-1920.png | 7700c4f24eaac3b7d916303f8c596b66ac060f88ba6261cb0bdf9e7808b8399b |
| millionaire-tv-live-1920.png | cae92afc10b852f68b19c8fc90f2efea4eac304fd75746e30e5577e99bfd9fc6 |
| mines-tv-live-1920.png | 158817089b5aab16d2b01fe0bdb05837bdea4d711db46194c10166ffc46e1393 |
| monster-tv-live-1920.png | 6764565f80377bfdacc59ec9cee16f3b907c9ecf1758371935c73da1a3fbadcd |
| naval-tv-live-1920.png | acdab20788b31d46119b5960c1794b6688bb04e7a5a4c56c9e64ef3503ac1681 |
| peek_shoot-tv-live-1920.png | 7fd2ae534514c4a32e9c9756cde6279dea5d643f196ad88fbbe7928cef6b3a85 |
| pocket_siege-tv-live-1920.png | 9c605c5839227719971b0de96b98f5de5933c98026ed3032c0aea1155f66a20d |
| poker-tv-live-1920.png | 280578ead82b8784961a181b073948b186a797d07d508f423aaa3eba204610d9 |
| punchmeter-tv-live-1920.png | 631d142ac1180d2f6be2f9e0daa85a89952ad244179a36d9001856b2566be96d |
| push-tv-live-1920.png | 410a5a8f3a432fcce93e008477f90057023d33872cb2b2c6533f9d9f2df25609 |
| shrink-tv-live-1920.png | 1266ce9585cdb9880e6c879c49d8979f19e098acc362ab1079cef8958ccc38ea |
| sinyakquiz-tv-live-1920.png | 5f9c576626a129bb29ea0d9a1eafb01553ea0ac46bf3aa41dcce0faf46304ccc |
| snakelines-tv-live-1920.png | 64ca4258e9ae2d40b867e1ac7187580be11b961311e39a9a369d53d88b00d56f |
| spy-tv-live-1920.png | 9127fa63f1f269620ecd0f759e4e6f14112e219e0b4b704592a564fd314b4ad3 |
| swarm_gate-tv-live-1920.png | f1c930c00727d16a8e8950e6005f8aaf9bf4a1ce2f4f5ea4642fe106256a9195 |
| tankarena-tv-live-1920.png | 8d87a47cf55fc578b1b956064052e3c1d8fb54c3c9b031987c65984c8690f570 |
| tanks-tv-live-1920.png | 6a6bdf478ff9d762cc77c3e8389b1dab063b94473b3c7e08aab709ea2d47fc0e |
| taprace-tv-live-1920.png | 8296f42cca426c81139b198278db25f4c254ecfa0e3eb3181fc6156fb535f22a |
| warsaw-tv-live-1920.png | 4bd85b716c40f287a46b90ba693ec3e768daa3db5c2dfd759855a844c1f64355 |
| western-tv-live-1920.png | faf664d80e050f1a573716df2aaadeaf99e80c3c1c02db5aca027380eef7b217 |
| western_duel-tv-live-1920.png | 8b8cdcc73e08b516733c8a97260e99ba0c6153ce541ce7c687b254eaa433eea5 |

## B revision after actual fresh originals and human rejection

The first implementation in `output/playwright/composition-2026-10-03/social-confirm/` and `quiz-confirm/` was independently inspected for all seven B games. The human rejection of Monster is valid. My initial direction retained an edge cap in a floating content setting; that was the wrong silhouette. A wide tapered polygon creates an unsupported trapezoid, wastes its edge area, compresses actor/metrics, and competes with the task. Numerical width/height compliance does not rescue it. Earlier B shape approval is withdrawn.

**Concrete replacement:** straight compact integrated task header, 56–64 logical height, game title26 at the task column's left, clock28 and actual progress18 on a shared right baseline. Rounded16 corners if a backing is necessary; a quiet material band/keyline suffices. No clip-path/taper/upper edge glint. Actor is local supporting context, not a squeezed bottom-right string in the shared shape. Actual header bottom to prompt/art is12–24. Apply this to Monster, Spy, Charades, Drawguess and the three quizzes; A/C edge-attached curved chrome is unaffected.

Monster owner's root-approved refinement is an880-wide centered whole group: copy548 +gap12 +art320. Its header follows **copy548**, not the whole880. It must be judged by visible text-to-art distance and balance, not grid gap alone: short text must not leave a 140-pixel optical gulf to the mascot. The task title is directly12 below the measured header. Existing queue/privacy/task input stays.

The fresh quizzes show another related failure: cap at y40–78 while actual question starts y270–335. Move the integrated header to directly precede the actual question by16–24, then center the roster+question/answers group. Styling the answer buttons does not fix a100–200-pixel disconnected header gap.

Required bounded confirmation: one fresh whole original for every affected B game, with Monster visible task/queue/mascot and a long quiz question. Review actual grouping and header ink before any acceptance. No runtime code is changed by this director document.

## Human-directed Monster material and Navy cap revision

The latest Monster straight-header1280/1920 originals remain rejected: generic translucent purple did not become a textile material, queue was ragged3+1, numeric progress was18 versus clock28 and the1920 title wrapped while the header appeared to retain548 physical width. Shared owner must establish actual ancestor glyph clipping and measured coordinate space; source intention does not prove whole numerals.

Monster **visible teal textile**: opaque base#164D56, broad#206975→#123E45 body variation, cyanrim#54C5C9, short limestitch#B8ED70. Title warmmint#E1FFF3, muted labels#B1D7D5. Clock and progress both26logical/1.32 with4vertical padding and one optical baseline; quiet Parts12 alongside0/4. No purple alpha inherited surface. Queue two equal columns,52high/radius16/8gap: inactive#153C43 with#23565E→#12343B, rim#4BA6AF, quiet insetlime35%, ink#E4FFF5/icon#B4E1DC; active lime#C5F268 with darkteal#12343B text/icon. Actor/task mint; privacy mutedteal. Full actual originals at1280/1920 must prove material and whole glyphs.

Separately, the latest explicit Navy user screenshot `codex-clipboard-d44ffab8-7c97-4521-9cf5-45a93e343283.png` requests a **different rounded trapezoid**, not the Monster straight band. The cap attaches to the left rail: top actualrailwidth, bottom92% (about12 inset each side at320), rounded22 corners, gentle8–10degree sidebevel. Target120–128high, title24/clock28, three quiet11labels with24digits on shared baseline. Opaque navy#255166→#102D40→#0C2233 withcyanrim#71B8C8 and quietbrass#C9B98B. Shading follows that surface; no deep empty taper, purple alpha or corner-clipped actor.

The observed Navy roster also has all four stacked cup/digit tracks cut at row bottom. Local bridge heading becomes one compact28-high item8belowcap; CaptainsAndScores is quiet18summary. Minimum64row or a fully measured40inner cup/digit track with6padding, stable16name/13facts and26points axis. Reserve two complete actual feed entries; do not show a half third. Reclaim cap/headline spacing before altering board array; entire1280/1920 left column and unchanged complete board geometry are required fresh evidence.
