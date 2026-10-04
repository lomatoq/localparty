# HeyPals independent art direction and acceptance queue — 2026-10-02

Status: **rebuild selected compositions; fixes required; no global visual approval**.
Role: independent read-only product reviewer. Only this report is authored by the reviewer. Product code remains owned by the implementation groups. This is an evidence-led assignment report, not a completed Impeccable critique/detector run or a final finish verdict.

## Authority and evidence

- Current user feedback: `user-comments.md` and the latest user-supplied Spy and Tanks screenshots (`codex-clipboard-3cd01e7b-bb4a-434d-82f6-b6f6117278bb.png`, `codex-clipboard-be63de1a-04c4-40c2-a85d-06229ead84d0.png`). These outrank earlier completion reports.
- Fresh inspected supplied captures: `output/playwright/ui-rework-2026-10-02/notch-gap/` Spy, Tanks, Chaos and Push Pit TV/phone live. These are evidence for those capture bytes, not for subsequent worker edits.
- All 36 TV and 36 phone `*-live-*` images in `final-games/` inspected in six labelled contact sheets. **Baseline only:** these precede later notch and worker changes; they cannot approve the current branch. Small contact-sheet observations are queue signals; exact finish decisions require original-size fresh captures.
- Read actual installed Impeccable SKILL, craft floor, finish-reviewer definition, AGENTS.md and current layout sources. `impeccable context` ran successfully. PRODUCT.md's old rankings-only scope is stale; current user scope governs. No PRODUCT.md/design-contract edits or invented approval records.
- Browser captures are not physical iPhone/AirPlay validation. No motion quality, contrast ratio or touch-behavior claim is inferred from still images.

## Shared visual direction

**Thesis:** friends look at the TV for the game and at the phone for the next action. Give the game the stage; place a small, readable layer of useful state around it. The action area is the phone's endpoint.

**Own world:** existing HeyPals violet/lime, curved notch, approved Kardia roles, actual game logos and dimensional authored artwork. Raster characters remain actual characters; do not replace them with emoji, plain disks, procedural faces, debug bounds or colored collider shapes. Geometric gameplay fields and mechanics may remain geometric where that is their subject.

**First viewport:** one identifiable focal game scene on TV; current state directly above the main control on phone. Names, status and values have distinct roles. A row is a shared alignment grid, not four unrelated text blocks. Keep dark purple scene visible under compact fading wings; no full-width opaque slab created to pay for notch clearance.

**Form:** four intentional families, not a universal panel template:

1. Full-bleed action worlds: terrain/art continues to edges. A compact common HUD floats above it; the useful play region respects measured notch clearance. Do not shrink the entire scene into an iframe inset to solve HUD collisions.
2. Circular arenas: use the vertical space for a large circle; compact score wings use otherwise unused side space without crushing the circle. Authored characters, name readability and score hierarchy remain coherent.
3. Conversation/question games: a compact player rail on the left and a dominant turn/question/drawing scene to the right. Avoid giant empty roster surfaces and nested same-size cards. Spy becomes an unboxed exchange with actual identity artwork and a useful prompt.
4. Own-HUD sports/construction scenes: one game-specific bar, no second common bar. The board, lane or stage carries the world; scores are compact, aligned and visibly secondary to play.

## Non-negotiable layout contract

- **Geometry is not paint.** Measure safe information bounds once in the parent; keep world backdrop full-bleed. The central notch clearance does not justify an opaque 174px-high full-width strip or shrinking a fixed-aspect world until purple side gutters grow. Root owns common geometry; workers own where actual interactive content lives within it.
- **No double reservation.** When parent geometry reserves an inset, the child does not add it again. Children need a clear semantic distinction between backdrop viewport and safe content rectangle, rather than one inset used for both.
- **Use width intentionally.** Source a new composition for the bad games. Preserve world coordinates/physics and uniform scale. Never stretch rendered circles, sprites or colliders to occupy width. If a fixed-aspect game necessarily letterboxes, author useful surrounding ground/HUD rather than adding unrelated violet strips.
- **Compact HUD.** Common wings show useful measured values in one aligned row; hide generic GAME / redundant objective / duplicated timer when the game already communicates it. Main value uses bold italic action/numeric role; names retain body role and complete accessible identity. No giant player-count card; a count is one small metric.
- **Phone order:** shared header → current task/turn → game stats/status → primary control(s) → approved Pause/Lobby. No score, speed, accuracy or action-state blocks under a joystick/primary button. Brief control labels may sit inside controls; preserve help through a separate accessible route rather than a second reading zone under the hand.
- **Phone sizing:** one symmetric inset and one main width across stats, action group and supporting controls. Match each control group's icon/title/help baselines. Two large controls have shared row tracks so multiline text cannot displace one icon. Avoid dead vertical space that disconnects state from controls.
- **Icons/art:** ship visible actual approved assets. Missing glyph squares, emoji as icon fallback, empty placeholders and tiny buried rasters fail. Use same stroke/material family for utility controls; do not sprinkle decorative icons to compensate for weak hierarchy.
- **Roster:** placement → avatar/name → score. Tight wrapped identity, separated metadata; score remains readable at right. Match item spacing, round all four corners, keep overflow inside the list. Show 2/4/16 applicable players without shrinking names to illegibility.
- **Chrome:** preserve approved Pause/Lobby and fading mobile top/bottom underlays, including native route with both bridge and tabs. Preserve existing behavior and translations. No fresh decorative frame around a joystick.
- **Actual design delta:** a badly reviewed screen must visibly change its content hierarchy, spatial composition or authored art. A font/spacing/CSS change alone is insufficient if its before/after topology is the rejected one.

## Prioritized exact fixes

| Priority | Owner | Evidence and visible defect | Exact implementation target | Acceptance |
|---|---|---|---|---|
| P1 | Root shared geometry | Fresh Spy/Tanks/Push/Chaos all show opaque dark band through y≈174; Tanks terrain x≈155–1766 with edge at bottom | `public/tv.js:fitScreen`, `public/tv.css` fullscreen frame; distinguish full viewport ground from safe content. Reduce empty common copy while preserving notch. | Purple/terrain scene reaches edges, no slab below wing fade; useful content clears notch; bottom/side geometry intentional at 1920 and scaled receiver. |
| P1 rebuild | Group 06 social | User Spy screenshot and fresh Spy are materially the same composition: two giant boxed identities lower-middle, tall right roster, upper blank zone | `games/spy/public/host.html`, `host.js`, `spy-layout.css` turn/roster structure; don't retain min-height person cards or full-height roster | Unboxed authored identity exchange + prompt, compact left rail, complete turn roles; apparent new composition at a glance. Phone role/turn appears before action, never leaked onto TV. |
| P1 | Group 02 tanks | Fresh Tanks phone icon/title/help baselines differ: HOLD/DRIVE wraps, FIRE doesn't; flag count repeated separately and in huge mode card | `games/tanks/public/controller.*`, shared stat presentation; use common icon/title/help tracks and consolidate same-kind values | Equal action width, equal icon and title baseline, bold readable stat values, distinct useful mode info before action. |
| P1 | Group 05 chaos | Fresh phone Accuracy/Action are below joystick; their values are missing-square glyphs | `games/chaos/static/controller.html` DOM/reported state values and utility assets | Useful state above joystick, no missing squares, real relevant icons, brief shared instruction, optional action remains clearly reachable. |
| P1 | Group 05 chaos | Fresh TV play region x≈310–1610 (1300px wide), tiny low progress panel, level details form a second header | `games/chaos/static/host.html` arena sizing/HUD structure | One compact level/title/progress group, nearly full-width authored arena, enough clearance and full game mechanics retained. |
| P1 | Group 01 party assets | Fresh Push shows metal plain disks, not the requested expressive authored characters | Party actor renderer/asset wiring shared by arena family | Actual authored mascot sprites visible in play, colored identity readable; no collider annotations or procedural face substitutions. |
| P1 | Groups 07/08/09 | Baseline quiz has huge empty scoreboard, Jenga thin top content, Naval narrow bridge/inset boards | Family composition and roster grids, not only fonts | Scene/question dominates, useful compact roster geometry, no empty panels standing in for information. |
| P2 | Groups 03/04/10 | Baseline Marble/Pocket/Arcade/Sports show inconsistent board/frame extents or duplicate top/bottom game metrics | Full-scene fitting, own-HUD policy, control width/alignment | Largest useful board/scene with uniform geometry, useful one-pass readable state, no accidental new frame. |

### Source causes identified before implementation

- `public/tv.js` previously used the max of entire gamebar/notch bottoms as `hudHeight`, then moved/resized the whole iframe. The screenshot gap is a consequence of viewport reduction, not a missing margin in Tanks alone.
- `public/bridge.js` independently derives `--party-stage-inset-top`, `--party-native-inset-top`, and `--party-field-inset-top`; game-specific padding can then reserve the same area a second time.
- `games/spy/public/spy-layout.css` had a full-height `.turn-card` centered vertically, `.person` min-height 206px, and `.roster-card` grid-column 2/full-height. Later width/padding overrides retain that rejected topology. Rebuild these pieces together.
- Tanks `host.css` had both a safe fitted rectangle rule and later full-viewport overrides; canvas uniform object-fit of a fixed-aspect bitmap in a shortened iframe necessarily creates side letterboxing. Author the composition instead of accumulating contradictory inset overrides.
- Chaos controller's state blocks occur after the joystick and use values shown as squares in real captures; move the actual content/state roles, not merely their CSS z-index or visual transform.

## 36-game acceptance queue

All rows require fresh actual 1920×1080 TV + standard 402×874 phone screenshots, with real play state and no debug/collider annotations. At least default 4 players; 2 and 16 where catalog/mechanic allows, recording an explicit not-applicable reason otherwise. Zero/large values and long names apply to all visible stats/rosters. Required extra states are listed below. `Baseline` means observation of the earlier final-games images only. **Every row remains pending until fresh original-size inspection.**

| Group | Game | Baseline signal / retained strength | Mandatory visible delta and acceptance target | Extra states |
|---|---|---|---|---|
| 01 party | push | Side scores exist; actors are plain disks; controls have stats above stick | Authored expressive actors in circle; compact score wings and maximum useful circle; wins/state aligned above stick | alive/out, pause, dense scores |
| 01 party | shrink | Plain disks; circle and side wings | Authored actors; visible concentric shrink warning outside arena, no misleading collider ring; stats above stick | before/during shrink, alive/out |
| 01 party | knives | Round color wheel; actors/labels compete; large Throw retained | Remove name leader lines; authored actors; legible side scores; Throw as wide/large as action reference, all status above | throw/empty knives/out, dense players |
| 01 party | bomb | Side scores useful; actors plain rings | Actual authored characters and readable carrier state, field hierarchy; stats above stick | safe/carrier/explosion/out |
| 01 party | western | Authored scene/cowboys present; upper dark area heavier | Balanced scene fitting, no upper slab; useful wins/best/false starts above large Fire | wait/fake/DRAW/false start |
| 02 tanks | tanks | Board narrowed by height; equal control cards contain misaligned content | Full authored ground and useful board scale, base labels outside pads; consolidate stat hierarchy and share icon/title/help baselines | both teams/base capture, death/respawn |
| 02 tanks | tankarena | Scene + right stats; phone stat placement approved | Increase field/roster useful width together without empty gap; keep approved phone stats; no scene squeeze after common HUD change | weapon/health changes, dense roster |
| 03 deluxe | marble_bloom | Raster desert chain world in bounded rectangle | Field/terrain fills useful scene, no extra containing panel; keep circle/marbles uniform; phone shared chain/state above controls | swap/fire/chain clear/game over |
| 03 deluxe | pocket_siege | Large empty dark sky; small bottom strips, dense phone controls | Terrain and tactical view deliberately fill scene, compact turn/wind/weapon state; coherent phone group dimensions and safe Fire | different weapons, wind/turn, projectile |
| 04 arcade | taprace | Small track inside a large void; wide roster below unrelated width | Lane scene grows to useful width, rounded field retains shape; roster matches field width; larger finish target, bold stats above Tap | race/finish, dense lanes |
| 04 arcade | punchmeter | World fills view; bag focal, repeated upper content | Eliminate redundant Punching notch info; coherent full-scene bag/action state; compact spaced bold italic phone stats | permission/charge/release/results |
| 04 arcade | flappy | Scene large but border and floor stripe; phone action narrower than stats | Continuous world with no decorative frame; action matches stats width, readable alive/out and restart state | flying/out/restart |
| 04 arcade | hungry | World fills most view but edge framing | Full background world beneath chrome; stable field, bold italic values above stick; preserve character art | growth/out/rejoin |
| 04 arcade | snakelines | Full-width play with border, very dense upper labels | Full world without ornamental frame, useful lines readable; consistent bold values above stick | alive/out/new round |
| 04 arcade | carryball | Almost full-width pitch, ball/game info split | Field to edges, compact score/time/team above controls, maintain stick + wide Pass coherence | carrying/pass/goal/team |
| 05 mixed | chaos | Tiny progress, 1300px field, phone stats under stick and squares | New shared level/progress header; width grows visibly; all useful phone state above stick, valid icons/values | at least button + grab/trace level |
| 05 mixed | kart | Track largely useful; narrow dense roster; changing phone blocks | Aligned place/name/lap/speed row and fixed phone widths; speed above controls; actual throttle icon | racing/finish/steering/throttle |
| 05 mixed | western_duel | Scene framed with heavier top; right scoreboard | Balance top/bottom field and authored arena, compact aligned roster; phone duel order/state above Shoot | wait/DRAW/false start/dense order |
| 06 social | monster | Huge empty lower panel; static monster art; phone canvas and circles | New widescreen composition around live authored monster; compact part/turn rail; stable round swatches and aligned draw tools | different body part/assemble/drawing |
| 06 social | spy | Rejected two box exchange and tall right rail still present | Structural exchange redesign, actual identity assets, compact left rail; task/secret/status before action; role privacy retained | ask/answer/wait/vote/reveal |
| 06 social | crocodile | Left tall roster; turn card floating mid-right | Tight player rail + clear turn focal scene, player card redesigned; improve phone internal spacing while preserving useful flow | actor/guesser/pass/long word |
| 06 social | drawguess | Drawing scene undersized with right tall roster | Authored large drawing field and compact useful guesses/players composition, coherent phone tool widths | drawing/guessing/guessed/pass |
| 07 quiz | sinyakquiz | Left oversized mostly empty leaderboard; tiny question right | Compact left scoreboard, question higher and dominant; redesign row roles; larger phone Points and coherent top | answering/locked/reveal, long question |
| 07 quiz | warsaw | Same quiz topology; question text wraps into narrow column | Same shared quiz hierarchy with appropriate content measure; bold Points; answer cards consistent | answering/locked/reveal, Cyrillic |
| 07 quiz | millionaire | Left narrow ladder, right question floats high-middle | Ladder/progress genuinely wider with authored progression markers; right question raised/useful; readable phone answer hierarchy | active/eliminated/turn/long answer |
| 08 build | jenga | Tower small; top turn strip thin; right rail sparse; mixed phone controls | New compact turn/score arrangement; tower stage dominant, no huge turn block; phone layer/block/interaction visually unified | select/pull/push/collapse |
| 08 build | crane | Field and top inset blocks; crane base lower but duplicate strips | Crane/base grounded at bottom with authored shadow, coherent compact top + crew hierarchy; phone status/tools recompose | horizontal move/drop/stack/game over |
| 09 tabletop | naval | Narrow bridge and four tiny boards, unreadable bottom log | Wider coherent board/bridge; scoreboard inside container, compact readable live feed; aligned phone grid widths | placement/target/fire/miss/hit/sunk |
| 09 tabletop | poker | Table sits in wide empty scene; phone hierarchy inconsistent | Larger authored table, stable seat/state hierarchy; phone cards/actions compact and aligned, short rules tab useful | fold/call/raise/showdown, dense seats |
| 09 tabletop | airhockey | Rink in central bordered rectangle, excess surrounding space | Rink grows to useful width with uniform puck geometry; score/stick remain coherent | goal/reset/long match |
| 09 tabletop | mines | Board large but mismatched thin side info; plain phone arrows | Authored compact leaderboard/board group, clear gameplay state; coherent useful phone direction + Open controls | safe/mine/cooldown/finish |
| 10 sports | bow_club | TV target world and corner codes; phone map sparse/flat | Authored aim scene/control hierarchy, all state above input; utility content compact and relevant; no invasive new header | draw/release/arrow count/handedness |
| 10 sports | curling | Full authored lane; common extra logo/own HUD; controls dense | Own-HUD only, aligned scorecards, comfortable phone sliders/sweep composition, state above controls | aim/release/sweep/team/end |
| 10 sports | bowling | Full authored lanes; duplicate common/own bar; phone widths mixed | One own-HUD, aligned player cards; coherent position/spin/throw task grouping | aim/release/spin/strike/frame |
| 10 sports | swarm_gate | Full authored wall and creatures, own HUD; phone dense | Full width no extra frame; compact useful top, phone wave/gate/heat state above aim/fire and valid illustrated utility icons | overheat/pulse/wave/damage |
| 10 sports | peek_shoot | Authored gallery and creatures; large own HUD; phone large boxed touchpad | Compact useful own header; gallery fully staged; redesign phone task/aim/Fire grouping with stats above and no redundancy | target/white prohibited/fire/streak |

## Packet required from each implementation group

- Identify exact source files, shared-family impact and any meaningful behavior risk.
- Before/after real screenshots under a unique group-owned output folder. Show the new visual delta for every badly reviewed game, not a single representative screenshot.
- Include original-resolution TV/phone images with capture time and source hashes. Name game, state, player count, language and viewport. A fixture alone cannot verify the embedded native path.
- Automatic checks, inspected browser images and physical-device checks reported separately. Shared-component coverage must name each affected family.
- One batched original-image review with findings, one batch of fixes, then at most one confirmation round. A failed capture requests recapture; it does not earn visual approval.

## Current disposition

Initial evidence demonstrates unresolved composition defects. Spy and affected old-layout games need a visible structural remake; generic typography patches cannot close their row. Root reports the shared geometry correction is now implemented: 12 logical pixel outer gutters and the common HUD overlays the full scene; the bridge publishes full notch bounds for child labels. This is the right implementation direction, still awaiting fresh screenshots. Uniform fixed-aspect worlds may keep blocked surrounding bands provided the authored ground continues and those bands do not masquerade as playable terrain. Fresh worker packets are pending. No row above is marked done on baseline images.

## New Claude brand mascot derivative inspection

Separately inspected all sixteen `public/assets/avatars/atlas-mascots/mascot-01.webp` … `mascot-16.webp` with the new manifest. Complete visible tips/horns/headphones/hands/accessories, no obvious clipping or neighbouring sprite contamination. All frame rectangles lie inside their 256×256 cells; each cutout dimension matches manifest frame/sourceSize. These are the actual dimensional brand mascot family. Asset-level available and visually accepted for integration; final app wiring and screen acceptance remain separate. Stable identity seed and real-photo preservation required. White PartyArt monster blob is not a brand substitute.

Eight self-contained implementation packets prepared under `group-briefs/` for 01, 03, 04, 05, 07, 08, 09 and 10. These are queued proposals, not live/completed workers. Four total runtime slots including root/director limit actual simultaneous execution; no claim of eleven live agents.

## Fresh group 02 Tanks review — first batched packet

Evidence: original `group02-tanks-final/tanks-tv-live-1920.png`, `tanks-tv-held-shot.png` and `tanks-phone-live-402.png` inspected. Report identifies real engine gameplay, browser player + built-in bots, normal clock, no injected state/scores; empty pageerror list and no source drift within capture. This packet demonstrates 4-player browser gameplay, not 2/16-player or physical native validation.

Disposition: **fix** for the scoped Tanks packet.

Resolved visibly: opaque full-width slab and violet sidebars gone; full authored terrain/wall composition fills width; actual dimensional brand pilots visible; larger hulls/cannons preserve apparent uniform geometry; existing safe world bounds and both bases visible. Do not dilute this improvement.

One bounded correction batch sent to group 02:

1. Phone title first baselines: HOLD·/DRIVE uses two lines; FIRE is vertically centered between them. Both icons now align. Keep shared icon row and give titles a common top-aligned reserved two-line slot, with a separate shared help slot.
2. Phone information grouping: standalone personal FLAGS 0, giant FLAG 0:0 / Watch shared screen card, and shared header flags repeat the same category across large spaces. Consolidate into useful compact stat/status before controls, preserving personal/team counts, health bar and mode truth. Do not delete game behavior/info to achieve compactness.
3. RED BASE is to the right of the pad; the explicit user requested above or below. Center outside the pad above/below with hull/name/header clearance. BLUE BASE is already above.

Confirmation is a score of these three fixes and regressions introduced by them, not a new broad hunt. Tankarena pending a separate original packet. No global group 02 or 36-game approval implied.

## Fresh group 06 social review — first batched packet

Original captures inspected: `social-final/spy-{tv-live-1920,phone-live-402}.png`, Spy asking/answering phone and asking TV originals; `social-two/spy-tv-live-1920.png` and `spy-phone-asking.png`; `social-sixteen/spy-{tv-live-1920,phone-live-402}.png`; `social-confirm/{crocodile,drawguess}-{tv-live-1920,phone-live-402}.png`; `social-monster-confirm/monster-{tv-live-1920,phone-live-402}.png`. Dense Spy rail scrolls; it is not a simultaneous all-16 roster view.

Scoped composition score: Spy's rejected two-box/tall-right-column topology is **resolved**. Real dimensional mascots, open exchange, useful prompt, compact left rail; phone ask/answer/task/private role occurs before action on viewed 2/4/16-player states. Monster's empty full-height card is **resolved** into open authored art + turn/queue composition; phone swatches are round and tools form a consistent row. Charades compact left scoreboard and focal actor are **resolved** relative to its old oversized surfaces. Drawguess drawing area is **resolved** in size/hierarchy; actual drawing synchronization is still unverified by the blank initial canvas shots.

Disposition: **fix**, plus targeted missing-state capture. One bounded batch sent:

1. Local Charades/Drawguess roster rows still use a white dot and truncated identity rather than an authored avatar/name group. Add stable mascot fallback with real-photo preservation in each local renderer; retain aligned place/cup/right score roles and tight wrapped identity.
2. Capture and inspect an actual phone stroke mirrored onto Drawguess TV, Monster drawn/submitted part, and Spy vote/reveal. The worker explicitly reported no vote capture. These are required-state evidence gaps, not permission to fabricate states.
3. Include inspection evidence for the already captured 320px Spy action states. Preserve successful open composition; do not pad it back into nested cards.

Shared generic GAME/objective redundancy remains root-owned. No physical/native verification is inferred. Group 06 full acceptance waits on the above packet; no new broad hunt after confirmation.

## Fresh Tankarena first original review

Original evidence: `group02-tankarena-final-v2/tankarena-tv-live-1920.png` and `tankarena-phone-live-402.png` inspected. The report/capture is provided by the worker; empty errors/source drift and actual shot/release are reported separately from visual findings.

Resolved: compact four-row right roster with real mascot identities, tight long name, stable right score axis; removed oversized empty roster surface and repeated Battle rules. Phone Health/Weapon/Points ordering and main circle geometry remain visibly preserved.

**P1 regression:** the actual pink Bot 1 tank at approximately x1120–1190/y90–175 is visibly clipped by the central notch's lower-right edge. A label placed beneath the notch does not make the obscured target visible. Root and group 02 received the exact image finding. Preserve full-bleed authored ground while uniformly framing the actual playable world in a safe content region, or otherwise make the target visible under the final HUD geometry; do not reintroduce the rejected opaque 174px slab. This is the first Tankarena original-image review and its named correction, not a new broad pass.

Disposition: **fix**. Improved roster/phone is not approval of target visibility or dense/native states.

## Bounded final confirmation — frozen group 02 and 06 packets

This confirmation scores only the named correction batches above. Product source was read-only for the director. The implementation workers report their source/captures frozen for migration; no new broad review or shared-state edits were performed here.

**Tanks: ship the three scoped fixes.** Independently inspected `group02-tanks-approved/tanks-tv-live-1920.png` and `tanks-phone-live-402.png`. Shared top-aligned title slots now align the first DRIVE/FIRE title lines; health/personal/team/mode information is compact before controls without the redundant outlined status card; RED BASE is centered below its pad and clear of the spawn hull. Full-width authored terrain and brand pilots remain intact. The worker reports actual FIRE hold/release and title-top assertion within 1px. The directory name is not itself an approval. This is a 4-player browser packet, not full-game, 2/16-player or native/device approval.

**Social: ship the scoped composition/identity fixes and requested action evidence.** Independently inspected these original confirmation files under `output/playwright/ui-rework-2026-10-02/`:

- `social-actions/crocodile-tv-identity-ready-1920.png` and `drawguess-tv-identity-ready-1920.png`: white identity dots replaced with actual authored mascots; Charades long name wraps; compact place/cup/identity/right-score rows preserved. Drawguess shows the full tested name within its wider identity axis.
- `social-actions/drawguess-{tv-stroke-1920,phone-stroke-402}.png`: the same diagonal pointer stroke is visibly present on phone and TV, with dominant canvas layout retained. Report `strokeProof` records 0→13234 ink pixels on both authoritative canvases. This closes the blank-canvas evidence gap for that stroke.
- `social-actions/monster-phone-submit-preview-402.png` and `monster-{tv-submitted-1920,phone-submitted-402}.png`: actual drawn part, preview and submission are visible; progress advances 0/4→1/4 and the next participant becomes active. Shared TV correctly keeps the drawing secret. This verifies one submitted part, not final assembled-monster art.
- `social-actions/spy-phone-{asking,answering}-320.png`: compact exchange, role/task before action and controls fit the viewed 320px states. The tested very long identity is still clipped to the available two-line phone width; full identity remains visible on the earlier 402px/TV packet. No further layout hunt is opened in this bounded confirmation.
- **Final Spy identity evidence is `social-spy-actions/`, superseding its earlier `social-actions/spy-phone-vote-402.png` with sunglasses emoji.** Independently inspected `spy-phone-vote-402.png`: actual brand mascots replace vote-option emoji. Inspected `spy-tv-role-reveal-1920.png` and `spy-phone-role-reveal-402.png`: TV shows actual mascot readiness and no private location/role; held phone card reveals the private location/role before Ready. Report actions explicitly record accepted vote confirmation and acknowledged vote.

`social-actions/report.json` (11:21:38–11:22:17 UTC) and `social-spy-actions/report.json` (11:24:16–11:24:36 UTC) report real engine/built-in-bot browser gameplay, `errors: []`, and `changedFiles: []` during each capture. These are automatic/capture evidence, separate from independent image inspection. Source hashes and exact changed-file ownership are in `group02-progress.md` and `group06-progress.md`.

The after-vote files in `social-spy-actions/` are explicitly **shared match results**, not a dedicated Spy reveal screen. The earlier misnamed `social-actions/*-reveal-*` files are superseded for state naming. The TV results screenshot is captured during its entry animation and is not approval of the settled shared results layout. Shared results and generic GAME/objective copy belong to root.

## Migration handoff verdict matrix

| Scope | Director verdict | Confirmed evidence | Open work / next owner |
| --- | --- | --- | --- |
| Group 02 — Tanks | Scoped fixes accepted | Frozen 1920 TV/402 phone, actual FIRE hold/release reported | Broader player-count/native/device coverage remains unverified |
| Group 02 — Tankarena | **Fix, P1** | Compact authored roster and phone stat order accepted | Root/new shared-geometry owner must clear actual moving tank from central notch; exact failing original is `group02-tankarena-final-v2/tankarena-tv-live-1920.png` |
| Group 06 — Spy | Scoped composition/identity/action evidence accepted | Earlier 2/4/16 ask/answer/listen; final 4-player vote + private role-ready capture; 320 action inspection | Settled shared results root-owned; full dense vote/native/device evidence not inferred |
| Group 06 — Monster | Scoped composition and one submitted part accepted | Authored scene, round tools, real preview and 0/4→1/4 submission | Final assembled-monster and other participant/body-part coverage remain unverified |
| Group 06 — Crocodile | Scoped composition/roster fixes accepted | Compact rail/focal actor, authored roster identity, phone privacy/task flow | Other game phases/dense/native/device coverage remain unverified |
| Group 06 — Drawguess | Scoped composition/roster/stroke evidence accepted | Dominant canvas, authored identity, mirrored real stroke | Guessing/guessed/pass and dense/native/device coverage remain unverified |
| Groups 01, 03, 04, 05, 07, 08, 09, 10 | Prepared handoff only in this chat | Eight self-contained briefs under `group-briefs/`; all36 row queue retained above | New chat owns actual dispatch and fresh implementation/capture/review; baseline images do not close these rows |
| Brand mascot cutouts | Asset-level accepted | All16 derivatives/manifest inspected | Every application integration still needs code + actual image proof |

New working chat reported by root: `01a0fc5b-9a58-7b90-a8ae-78420115152d`. This old director does not certify its concurrency or mutate its active-group/state files. Eleven simultaneous agents remain an execution claim requiring actual launch verification by that chat. Old-chat source locks/release are root-owned. No blanket 36-game visual approval, no physical-device approval, and no new shared-geometry approval are issued by this handoff.
