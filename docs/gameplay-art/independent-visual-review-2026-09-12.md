# Independent visual review — 2026-09-12

## Evidence and limits

Fresh isolated Edge run of `tests/game-art-browser.cjs` completed all 26 games: host 1920×1080, phone 402×874, one real browser player plus one bot. I opened and inspected all 26 full-size host screenshots and all 52 full-size phone screenshots (waiting and active state). Each flow exercised readiness, autostart, pause, rules modal, resume and exit, with no page errors or phone horizontal overflow. This is a visual/flow review of those recorded states, **not** a claim that every game stage, animation frame, full match, sensor or high-player-count layout was observed.

Evidence naming: `tests/art-host-game-{id}.png`, `tests/art-phone-game-{id}.png`, `tests/art-phone-wait-{id}.png`.

## First-pass defects sent for correction

- P1 Crane: repeated city at different scales, sharp rectangular seams and two moons. New mast footing/cab improved structure but backdrop assembly failed.
- P1 Kart: black horizontal strips inside game box; scene did not fill its container.
- P2 Push/Shrink: result header incorrectly said РОЛИ.
- P2 Monster: decorative blob inserted into functional hidden-drawing notice, duplicating existing emoji and displacing text.
- P2 Tap Race: name overlapped runner at start; description falsely said all 16 tracks with two players.
- P2 Flappy: plain bright tube body disagreed with shaded cap; bright active flap button remained after elimination.
- P2 Tank Arsenal: duplicated game title in arena; large rules-to-score sidebar gap.

## All-game matrix

W = mobile waiting inspected. M = mobile active/specific captured stage inspected. H = host captured stage inspected. All rows have W/M/H coverage; descriptions below explicitly limit the stage.

| ID | Captured host / phone stage | Assessment and remaining scope |
|---|---|---|
| push | Round result / result | Readable arena material and player; wrong result HUD sent to root. Active collision burst not captured. |
| shrink | Round result / result | Same improvement; wrong result HUD sent to root. Contraction and late-round radius not visually observed. |
| knives | Running / throw control | Bevelled sectors, hub, distinct colored robots and knife readable; no clipping. Actual hit/miss burst not captured. |
| bomb | Running / joystick | Raised obstacles, bomb ownership ring and fuse clear; control fits. Explosion not captured. |
| western | Fake cue, eliminated bot / fire | Cue dominant, character identities readable. Scene now has saloon and depth bands; high-player overlap not observed. |
| tanks | Running / move-fire | Tanks and walls readable; no field clipping. Projectile/impact pass requires separate action capture. |
| tankarena | Running / joystick-fire | Pickup crate recognizable. Duplicated title and sparse sidebar spacing sent for correction. |
| chaos | Calibration / joystick-action | Target, cursor, progress readable. Only calibration of 15 trials inspected; later trials remain outside this capture. |
| kart | Running / steering-gas | Road geometry and scenery readable; box letterboxing rejected. Skid action not captured in this run. |
| monster | Drawing hidden / drawing tool | Host does not leak secret drawing; mobile palette/canvas fit. Notice decoration rejected. Joined reveal not captured. |
| spy | Secret-role deal / hold-to-reveal | Host correctly hides roles; phone secret interaction fits. Voting/results not captured. |
| millionaire | Question / answers | Long question and four answers fit. Ladder intentionally tall; final reward state not captured. |
| sinyakquiz | Question / answers | Question and choices clear; tall sidebar leaves substantial empty area. Correct/wrong response state not captured. |
| warsaw | Question / answers | Same readable composition; tall sidebar imbalance remains aesthetic issue rather than clipping. |
| crocodile | Acting / secret word | Secret is private; actions and word fit. Tall host score column visually heavier than central prompt. |
| jenga | First move / block selector | Real 3D wood tower, visible seams and shadow; controls fit. Extraction/collapse not captured. |
| crane | First move / left-right-drop | New crane grounding/cab stronger; double city was unacceptable and sent to root. Multistorey/collapse not captured here. |
| naval | Running, miss / target grid | Two public grids and left controls fit without scroll; shot feed present; no hidden ship leakage. Hit/sunk not captured. |
| drawguess | Drawing / drawing tools | Blank canvas intentional; tool area fits. Stroke/reveal not captured. |
| western_duel | Wait cue / fire | Two cowboys readable; large dark bands above/below scene sent to combat owner. Actual shot/death not captured. |
| taprace | Running / tap | Runner leg art visible; start name overlap and false 16-track copy rejected. Finish not captured. |
| punchmeter | Awaiting first hit / permission and fallback | Turn, attempt and permission button now explicit; bag grounded in gym. Physical iPhone motion permission/sensor not exercised. |
| flappy | Running / eliminated | Cloud/ground reference clear; tube body mismatch and still-bright eliminated control rejected. |
| hungry | Running / joystick | Food icons distinct; small player silhouette requires name/ring to identify. Actual eating burst seen only as transient ring in still. |
| snakelines | Running / joystick | Trails clearly separated from faint grid; endpoint readable. Death/gap mechanics not captured. |
| carryball | Running / joystick-pass | Pitch and goals readable; ball high contrast, players small. Goal and possession effects not captured. |

All mobile waiting states are consistent in spacing, title fitting, emoji clearance, rules placement and ready-button alignment at 402×874. This does not establish expanded-rules behavior at narrower heights. New controls are present in all six new games; screenshots do not prove physical device sensor delivery.

## Second-pass recheck after fixes

Repeated flow capture for 15 changed games; every flow passed. Independently reopened latest full-size Kart, Crane, Monster, Tank Arsenal, Western Duel, Tap Race, Flappy, and Flappy eliminated-phone screenshots.

Confirmed closed: Kart black letterbox strips; Crane duplicate city/seams/two moons; Monster notice decoration; Arsenal duplicated arena title and large rules gap; Tap Race start-name overlap; Flappy tube-body material mismatch and active-looking eliminated button.

Remaining P2 sent to root: Western Duel retains a ~120px empty dark band below its scene (top band contains cue, so has a purpose); Tank Arsenal has ~26px dark side strips between field and rounded box. Crane single backdrop now works, though bottom gradient hides most central skyline; this is an art-direction tradeoff, not a rendering seam. Broad scope still not demonstrated by this audit: all15 Chaos trials, all26 endgames, 16-player sprite overlap, sustained action/effect sequences and physical Safari accelerometer. These must not be represented as independently visually approved from these screenshots.

## Third pass: terminal-stage coverage (2026-09-13)

Independently opened full-size terminal host and phone screenshots for all 20 legacy games: push, shrink, knives, bomb, western, monster, spy, tanks, tankarena, kart, chaos, millionaire, sinyakquiz, warsaw, crocodile, jenga, crane, naval, drawguess, western_duel. Evidence: tests/audit-results-{host,phone}-{id}.png, except Crane physical-attempt results in tests/art-crane-results{-phone}-new.png. Also independently opened all six tests/arcade-final-{id}.png host result captures. All 26 host terminal layouts and 20 legacy phone terminal layouts fit without clipped primary actions or unreadable result headings.

This supersedes second-pass terminal coverage gaps. It does not imply every way of winning/losing was played. Several harnesses use accelerated test clocks; Chaos terminal capture uses debug round completion, so does not verify all 15 actual trials. Monster used submitted strokes and assembled drawing reveal; Millionaire completed three timed questions. Arcade phone terminal screens were not independently opened in this pass (the Arcade agent reports its own checks).

Closed in third-pass images: Western Duel lower empty band and Tank Arsenal side strips. Root subsequently reports Kart and Tanks terminal controls disabled and repeat checks passed; those closures are owner-verified rather than independently re-opened here. Crane terminal capture predates the single-backdrop fix and retains the old duplicate city; its UI/disabled controls fit, but use the newer active scene for backdrop assessment, not that stale terminal image.

Remaining review details sent to root: common mode results use untranslated ROUND WINS/SURVIVED/FALSE labels; Knives shows a secondary 6 ROUND WINS beside a primary score of 3 (check statistic meaning); Naval no-shot terminal feed still says the first salvo is ahead; Monster terminal phone roster retains a pencil status for the other participant although assembled reveal is complete. These are P2 semantic/polish findings, not newly observed clipping failures. Arcade host result cards have consistent spacing and readable score rows; no fresh P1 found in these 26 terminal host captures.

Still not established by screenshots: physical iPhone Safari motion permission and sensor delivery; sustained per-device frame pacing; every projectile/impact/goal/collapse animation; 16-player collision-label density. Use runtime measurements and actual event tests for those claims.

## Impact FX follow-up (2026-09-13)

Crane: client now reacts to authoritative placed/miss counter changes with a short ground/contact ring, expanding dust lobes, colored debris and damped camera recoil. Placement and miss are distinct, perfect placement changes the flash tint. Bounded to eight concurrent bursts; pause clock stops age and recoil. Existing server particles remain. Actual two-placement/three-miss browser test verifies both new paths, not just presence of code. Crane render measurement: 324 frames in 2.5 seconds, 0.30ms median / 0.50ms p95 draw cost in the local headless Edge run (not a physical phone FPS claim).

Jenga: renderer-only contact dust uses 72 reusable sprites; ground crossings of authoritative block poses and actual relocation/settling trigger dust, with subtle damped camera recoil. No physics forces or outcome rules changed. Pause freezes lifetime. Real analog extraction, complete move, blur release and reload browser flow passed with zero page errors. Whole-tower collapse impact has pose-based detection but was not independently forced in that browser run.

Noncombat DOM audit: Naval has actual miss/hit/sunk broadcast-cell FX keyed to shot events. Quiz variants have correct/wrong answer color state and score movement; Crocodile has score movement; Drawguess and Millionaire have phase transitions/podium presentation. These do not yet constitute strong event-specific celebration/error VFX comparable to arcade impacts. Spy and Monster are reveal/drawing experiences, so collision effects are not applicable; their result/reveal polish should be assessed separately. Do not advertise every game's effects as equivalently upgraded by this bounded change.

## Latest cross-agent evidence update

All 15 Chaos renderers were checked separately by arcade_polish; see docs/chaos-trials-review.md (owner evidence, not this reviewer's independent trial playthrough). Crane's single-background terminal evidence was regenerated by the later crane-motion/impact browser runs, superseding the stale double-background capture discussed above.

Independently opened all six tests/arcade-final-phone-{taprace,punchmeter,flappy,hungry,snakelines,carryball}.png. Thus terminal screenshot coverage is now 26 host + 26 phone. Layouts fit and controls are visibly disabled. Punch Meter still has a semantic issue at a no-hit timed ending: “all hits completed” alongside “no hits yet, three attempts” and a bright permission request; sent to root for correction.

Independent cowboy shot-frame review (80/1700ms Western, 180/2300ms Western Duel): current enlarged art preserves natural proportions and opponents face each other; names fit. Sent to combat owner: early frame background black strips, Western falling ghost/body drifting away from fixed shadow, Duel fallen pistol within roughly 5px of label. Later backgrounds already fill width. This is a pending-fix review, not approval of the four frames. Exact 1.4x scaling must be supported by renderer dimensions, not inferred from a screenshot.

Correction to cowboy review: combat owner confirmed the early opaque bars implement the user's explicit cinematic narrowing request. They are intentional framing, not a background coverage defect; that finding is withdrawn. Shadow tracking and fallen-pistol/label clearance remain actionable and are being corrected.

## DOM event feedback implemented

Quiz (shared by Warsaw/Sinyak quiz), Crocodile, Drawguess and Millionaire now render short local event feedback: cyan reveal/between ring, green successful-score particles, golden match-end confetti. Triggered by changed phase or increased authoritative score, not repeated snapshots. Maximum 72 particles and three rings; lifetime below one second; pointer-transparent; respects reduced motion and game pause clock. No shared Party code changed.

Ran tests/dom-event-feedback-browser.cjs against real host actions/timed rounds in all four implementations: PASS, no page errors, transparent canvas checked. Correct-answer path separately exercised through Crocodile's actual “guessed” action (tests/dom-correct-feedback-browser.cjs): PASS, increased scores and green burst captured. Full-size screenshots inspected: tests/dom-event-warsaw.png, dom-event-crocodile.png, dom-event-drawguess.png, dom-event-correct.png. First visual pass caught inherited Drawguess canvas background obscuring content; fixed with explicit transparent overlay styles and reran all four. Other games' individual correct-answer branches use the same score-delta logic but were not separately answered correctly in this run.

## Tap Race controller identity recovery

Reproduced a join-rejection path: a managed controller connects before its authenticated profile appears in the child process roster. Previously the client attempted once and never retried, leaving controls without a matching player even though the outer lobby can list that participant. This is a reproduced failure mode, not direct proof of the user's exact live-session timing.

Arcade controller now sends explicit shared identity credentials and retries the handshake every 900ms until acknowledged. Server immediately sends authoritative selfId with the controller state, and repeats selfId in subsequent controller packets; the phone uses that identity instead of depending exclusively on an earlier joined event. No name matching or unauthenticated player substitution.

Tests: tests/arcade-identity-browser.cjs PASS for human+bot and two humans, actual tap progress, socket reconnect and full page reload preserving the same player and two participants. tests/arcade-late-roster-browser.cjs PASS: first join deliberately rejected before roster delivery, then automatically authenticated and joined without reload. Existing live game process was not interrupted by this subagent; relaunch required for its server-side change.

## Fresh full-frame sweep — 2026-09-13

Regenerated all 26 host active, phone active and phone waiting captures with `tests/game-art-browser.cjs`: every readiness/autostart/pause/rules/exit check passed. Independently reopened all 26 **host** full-size images in this sweep. Phone captures were regenerated but not all reopened again; earlier independent phone coverage remains documented above. Evidence for every row is `tests/art-host-game-{id}.png` from this fresh run. A filled game box is not required to stretch to the whole viewport; intentional layout gutters and Western cinematic framing are distinguished from rendering gaps.

| Game / evidence id | Current frame assessment and specific next improvement |
|---|---|
| Push / push | Circular arena undistorted; background fills viewport. Round-result text fits. No fresh clipping defect; separately assess crowded 16-player labels. |
| Last Circle / shrink | Circular arena and background fit; result heading clear. No fresh coverage defect; retain readable boundary contrast at minimum radius. |
| Color Knives / knives | Wheel remains circular; full grid background. Top avatar narrowly clears shared HUD; increase safe clearance for longer labels. Knife sprites remain small at TV distance, an art-scale refinement rather than pixel corruption. |
| Bomb Tag / bomb | **P2: bomb above carrier overlaps the carrier name.** Put name above bomb or alongside it, preserving identity visibility. |
| One Shot Western / western | Town fills width; intentional cinematic bars during focus. Art proportions natural. Updated real-shot/false-shot frames show correctly anchored articulated arm, projectile and burst. |
| Local Tanks / tanks | Field fills rounded frame; projectile and boundary impact visible. No fresh distortion. Bright outer wall competes with tank silhouettes; reduce wall glow if playtesting confirms attention cost. |
| Tank Arsenal / tankarena | **P2: bot at right boundary is visibly clipped, including body/health/name.** Inset rendered world extents or clamp visual anchors while preserving physics. No remaining letterbox. |
| One Cursor Chaos / chaos | Calibration field fits. Large quiet play area is purposeful cursor travel, not a missing background. Other 14 trial evidence remains owner audit in docs/chaos-trials-review.md. |
| Kart / kart | Track and environment fill rounded frame without old dark bands; kart aspect correct. Trees are noticeably repetitive; vary size/spacing as optional art polish. |
| Monster / monster | Contents fit; hidden drawing notice readable. 0/2 badge crosses monster horn visually; reposition illustration or badge slightly. Large unused lower card is optional composition improvement. |
| Spy / spy | **P2: shared header says result/ИТОГ while secret-role distribution is still awaiting confirmation.** Correct phase mapping. Main card fits, no coverage gap. |
| Millionaire / millionaire | Long question and four answers fit; background and cards clean. Tall two-player ladder is mostly empty; compact optional, not broken layout. |
| Sinyak Quiz / sinyakquiz | Question/answers readable, no clipping. Two-player leaderboard unnecessarily stretches almost full height; compact to content for balanced composition. |
| Warsaw / warsaw | Long answers fit, field has no seam. Same stretched leaderboard refinement as Sinyak Quiz. |
| Crocodile / crocodile | Actor card/actions fit, no secret leak. Same overly tall two-player roster refinement. Actual correct-answer burst tested separately. |
| Jenga / jenga | 3D tower correct aspect; complete block stack visible. Turn overlay hides much of table, not tower; slightly lower/shorter overlay could improve ground-contact visibility. Full collapse not independently forced. |
| Crane / crane | Single city fills rounded frame; redesigned crane has proper support/counterweight. **P2: ВРЕМЯ ХОДА caption is orphaned with no value** because timer moved to global HUD; remove it. |
| Naval / naval | Two square grids fill broadcast panel; compact left controls and real miss feed fit. No black strip or distorted cells. Hit/sunk sequences have separate event evidence. |
| Drawguess / drawguess | Drawing canvas fills its intended box; blank canvas is actual no-strokes state. Guess/score panels fit. Compact sparse leaderboard optional. |
| Western Duel / western_duel | Full-width town inside field; intentional focus bars. Latest real-shot80/1800 and early80 frames inspected: arm/burst anchoring, proportions, facing and label clearance correct. |
| Tap Race / taprace | Two real participants have two lanes; labels clear. Stadium fills frame. Track occupies middle third with large stands: deliberate but could enlarge lanes for two-player visibility. Identity recovery separately tested with two humans and human+bot. |
| Punch Meter / punchmeter | Bag/rope correct proportions, current striker and attempt readable. Gym fills box. Physical Safari sensor input remains a device check, not established by screenshot. |
| Flappy / flappy | Sky fills box, pipe bodies/caps match. Bird is small on host; modest increase constrained by collision silhouette is optional polish. Dead human absent from playfield is valid state. |
| Hungry / hungry | Full rounded arena, food/player art readable. Food occasionally crosses player name; draw a subtle name backing or food below reserved label region for readability. |
| Snake Lines / snakelines | Full arena, curved trails smooth in still, no distortion. Small puck heads could use stronger directional indicator without widening collision geometry. |
| Carry Ball / carryball | Full rounded pitch, circular centre and ball undistorted; goals fit edges. Labels clear in this frame. Team tint discs are visually stronger than runner art; soften opacity if readability remains. |

Confirmed actionable findings sent immediately to root: Bomb carrier/name overlap, Arsenal boundary clipping, Spy wrong phase heading, Crane orphan timer caption. Optional aesthetic refinements above are explicitly not claims of functional failure. No blanket approval of all possible dynamic states, input devices, aspect ratios or 16-player density.

Latest cowboy closure: independently opened updated Western0/80/1800, Duel80/1800 and both early80 frames. Former detached falling shadow and pistol/label clearance issues are closed in these images. False-shot burst is at lowered gun, normal shot has raised arm and visible bullet, opponent remains intact on false shot. Duel source uses arm width multiplier1.3 and overall scale cap1.4; screenshots confirm natural proportions rather than proving numeric scale alone. Cinematic bars are intentional and remain excluded from coverage defects.

### Closure: Spy and Crane labels

Fixed Spy shared UI mapping: secret-role distribution and voting are active play, not round results; labels now say Раздача ролей / Голосование, with distribution instruction to look at the phone. A stale play timer is not sent during distribution/voting. Fixed Crane managed host CSS to hide the entire timer HUD item when its timer is already hidden by the shared header; standalone timer remains available.

`tests/audit-spy-crane-labels.cjs` passed real two-participant launch, readiness, pause/rules/exit flows with explicit assertions for Spy label/non-result value and hidden Crane orphan timer container. Independently opened regenerated `art-host-game-spy.png` and `art-host-game-crane.png`; both findings closed. This supersedes the two P2 rows above.

## Statistics modal implementation — 2026-09-13

Rebuilt root profile and company-ranking presentation with scoped #statsDialog styles: generous inner padding, separate rows, rank/avatar/identity/score columns, first-place hierarchy, compact summary tiles, per-game metric cells, subtle internal scrollbar, fixed return action and back-to-ranking control. Unknown metric keys are omitted instead of exposing implementation names. Existing polluted bestPunch values are hidden outside Punch Meter; rounds hidden outside Snake Lines.

Superdesign written-brief draft: 41e20cae-40b3-4d99-bcf7-7651b7633158, saved in resume.json. No source upload. Local functional implementation is public/app.js and scoped additions in public/ux.css.

Tests/stats-dialog-browser.cjs: PASS desktop1280 and mobile390, 2/16 ranking rows, 17-game profile, long names, six-digit scores, internal overflow/no horizontal overflow, back and close actions. Full-size top/profile/bottom screenshots inspected. Fixture data is intentionally synthetic; not a claim of real completed match history.

Arcade reports now use games/arcade/report-metrics.js: Tap Race distance, Punch best impulse score + attempts, Flappy flight seconds derived from score/10, Hungry final mass, Snake round wins + rounds, Carry Ball team goals. No physics changed. Tests/arcade-report-metrics.cjs executes all six simulations and validates mode-specific metrics and actual Punch event. Historical display filters retained.
