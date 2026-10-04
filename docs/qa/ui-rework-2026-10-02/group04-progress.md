# Group04 — six Arcade interfaces, fresh-session rework

Status: implementation and director bounded corrections applied; final real gameplay/2/16 evidence captured; independent owned visual corrections accepted; final canonical freeze/action review pending. No global approval. No build, commit, publish, reset or game-rule edits.

## Ownership and preserved behavior

Focused files: `games/arcade/public/app.js`, `style.css`, `index.html`, `arcade-juice.js`, `snake-polish.js`. Root recorded claims before edits. The existing dirty Claude tree was read and preserved. `server.js`, `simulation.js`, score/physics/input protocol, articulated runner, bag pose, particles, squash, trails, event feedback and all raw/derivative assets are retained. Root/group01 owns the shared mascot helper; this group calls `PartyArt.mascotSource` for TV identities and preserves real avatar first.

Actual Impeccable, mobile-native, Emil design and Playwright skill files read. Context loader completed once against `games/arcade/public/app.js`; stale rankings-only PRODUCT scope explicitly superseded by the current user brief. Layout/adapt/craft-floor read, craft floor read immediately before edits. Playwright prerequisite npx passed; repository real-engine WebKit capture harness used, not a new test framework. Impeccable detector run once against all five changed files; verified findings recorded below.

## Before / after changes

| Game / surface | Before | After | Why |
| --- | --- | --- | --- |
| Tap Race TV | Narrow contained track, unrelated full-width oversized roster, thin compensated sprites, emoji identities | Responsive score-driven full viewport lane composition, correct single runner aspect compensation, compact matching full-width roster with actual brand mascot/photo identity, larger finish stripe | Use the useful TV width while preserving articulated runner proportions and score-based progression |
| Punch Meter TV | Actor text hidden behind notch plus repeated attempt at the bottom | Single central authored bag, source duplicate actor/attempt removed; root owns notch title/state | Give one clear actor/attempt source and preserve bag/effects |
| Flappy TV | Rounded outer rim, purple side gutters, procedural hills and bright floor stripe | Authored existing sky and seamless far hills, uninterrupted background across viewport, no decorative rim or stripe; all bird/pipe/effects retained | World fills the display rather than sitting in a frame |
| Hungry TV | Double ornamental border and generic tile treatment | Approved existing floor center cropped to exclude props; continuous authored material and gradual nonplayable shading outside physical bounds, no ornamental rim | Keep food/blobs unobstructed; distinguish decorative walls from play |
| Snake Lines TV | Multiple rounded rim lines | Full viewport backing and continuous full-stage grid with gradual nonplayable margin shading, no ornamental rim; trails/heads remain uniform world projection | Keep actual collision rectangle and readable lines |
| Carry Ball TV | Purple margins around pitch | Actual authored grass sample and stadium edges outside authoritative bounds, uniform entire field/goal/ball projection | Field fills the scene without clipping physical bounds or stretching circles |
| All six phones | One unstructured flex list; repeated long state sentences | DOM readout group with actual mode cutout, compact short state, bold tabular values, concise help; separate controls as endpoint | State always precedes action; authored mode identity remains recognizable |
| Flappy phone out | Huge gray disabled square | Compact disabled endpoint and clear next-round sentence | The useful out state leads instead of a useless giant control |
| All phones native platform | Zoom-disabled viewport | viewport-fit=cover, accessible zoom, controls-only selection prevention, focus outline, touch feedback retained | Keep mobile safe areas and native touch behavior without changing parent gradients |

## Fresh evidence

- `output/playwright/ui-rework-2026-10-02/group04-fresh/before/`: all six actual TV1920×1080 originals and iPhone17 402×874 (DPR3 PNG1206×2622). Normal clock, real browser player and built-in bots. Carry Ball joined/readied a second actual browser controller. Completed 2026-10-02T11:29:04Z, no browser errors.
- `.../after/`: same six pairs, first implementation. Completed 2026-10-02T11:42:14Z, no browser errors. Carry Ball additional authoritative goal screenshots and 320px phone goal captured by real joystick. This is round1 evidence, predates the bounded correction below.
- `.../source-before/`: exact incumbent presentation snapshots saved before edits. Capture report contains source SHA256 start/end and actual phase timestamps.
- Fresh originals all six TV + phone were opened individually and inspected. Agent observations are not user or independent approval.
- Original gallery/comments and old final-games baseline were not overwritten.

## Bounded critique and correction

Round1 original inspection found three named defects, fixed together: baked Tap track lane separators conflicted with responsive/dense lane count (now samples only unobstructed track material); Flappy sky stopped at sidewalls (authored sky now continuous full viewport, seamless hills extend beneath it); Flappy out control remained huge gray square (now64px quiet disabled endpoint). Root separately corrects shared live generic GAME/objectives and Punch notch game title. No further self-polish loop planned; independent art director reviewing the packet and final evidence will be handed back.

## Verification

PASS `tests/arcade-scoreboard-browser.cjs`: real WebKit DOM row identity survives score updates/reordering and names remain safe text. JS syntax checks pass for app/juice/snake files. Existing capture two-player Carry Ball + actual goal is meaningful engine evidence, not a synthetic score/state.

Final interaction harness saved separately under `.../group04-real-shots.cjs`, copied from existing capture harness with exact actual-button/joystick actions and authoritative before/after readings. Planned final packet: taps, permission fallback, charge/release score, flying/out, joystick drag/release/out, second controller/pass/goal plus2/16 bounds where allowed.

Browser resource contention was resolved through a ROOT slot. All captures run sequentially in one browser at a time; no foreign server was stopped.

## Limitations and remaining work

- Corrected source freeze: `group04-fresh/source-final.json`; all five owned sources and shared HUD/helper hashes equal before/after final capture. Only unrelated party host edits changed during that first final run.
- 2/16 bounds complete for all six; all six finish/result states captured with clock12; normal-clock Flappy new-live transition confirmation queued. Independent final director acceptance pending. Do not mark any row finally accepted until review returns.
- Browser/native bridge emulation verifies the shown layout route. Real iPhone touch, motion sensor, safe-area chrome, AirPlay and hardware remain unverified by this packet.


## Final bounded director correction

Independent director reviewed all12 first-after originals and requested exactly one additional batch: eliminate Snake OUT joystick and steering guidance, remove hard Hungry/Snake/Carry backdrop seams while preserving physical1200×720, and retain prior Tap/Flappy corrections. Applied all named owned changes; root made shared arcade notch/action transparency. No art/physics/rules/assets replaced. Final true flying Flappy is `final/flappy-tv-flying.png` and `final/flappy-phone-flying.png`; first `live` sample is explicitly countdown and must not be selected as flying.

## Normal-clock final action evidence

`group04-fresh/final/report.json`, finished2026-10-02T11:56:11.711Z, zero pageerrors. Actual UI inputs and named authoritative state stored before each interaction screenshot:

| Game | Real action and observed result |
| --- | --- |
| Tap Race |12 primary taps; score0→152, progress152.41 |
| Punch Meter | Actual Allow Motion button: permission granted without physical sensor data; actual hold660ms/release scored834 |
| Flappy |9 real flap taps; alive and44 points at4.33s, then real elimination54 points; alive/out originals |
| Hungry | Actual joystick press/drag/release; position100,100→158.48,247.99, mass20→26; knob reset |
| Snake Lines | Actual joystick press/drag/release; angle0→1.193, position287.83,100→342.19,199.48; alive then realOUT; compact spectator original |
| Carry Ball | Two actual browser controllers joined/readied; real joystick movement and engine1:0 goal. Carry-two separate proof below |

`group04-fresh/carry-two/report.json`: two actual controllers, no bots; Alexandra actual PASS during authoritative possession changes ball owner to null, vx−409.765/vy311.472; actual joystick then Alexandra goal gives0:1. Morgan SecondPlayer is a separately joined/readied browser controller. Originals contain passing trail, current team/score and goal. No handcrafted state or score injection.

`two/`: all other five minimum2 rosters, actual Latin long name and Cyrillic bot names. `dense16/`: all firstfive maximum16 rosters. `carry-dense16/`: Carry maximum16. Dense Carry first attempt in dense16 failed only because the capture harness defaulted an explicitly empty extra-player setting to a17th join; the failed report remains preserved, capture-only harness corrected, separate carry-dense16 succeeds. No game source changed.

## Detector findings in context

`impeccable-final.json`: three static findings. Hidden cue image has no initial src because real mode chooses its source at runtime; every final original visibly contains the valid mode cutout and no broken image box (false positive). Existing inline green action glow is retained gameplay press feedback; not introduced decoration. Existing inline repeating gradient belongs to the racetrack meter/progress treatment (verified inherited sports UI). Detector exit2 denotes findings, not a green-pass claim; no automatic scan substituted for visual review.


## Additional state evidence and remaining bounded check

`finish-clock12/` completed2026-10-02T12:04:39.638Z: all six actual engine finish/results originals, zero pageerrors. This uses the repository QA clock12 and is explicitly time-accelerated, not normal-speed input evidence. Hungry actual parent-controller reload reconnects the same id and preserves score; natural eaten/returning state also captured. Snake actual new round captured. Shared result podium letter-avatar identity remains a root/shared concern, not modified by this group.

`restart-rejoin-clock12/` completed2026-10-02T12:07:13.777Z: Hungry rejoin waited1000ms for the parent native transition and is clear, with same authoritative id+score, plus natural returning state. Flappy new instance was verified, but `flappy-*-restarted.png` caught TV intro/previous phone results transition and is **transitional, not accepted as new-live proof**. No duplicate capture is planned for completed pairs/states. Root queued one tiny normal-clock Flappy finish→actualrelaunch→new-live confirmation, waiting for the shared browser slot. The bounded proof now waits TV transition hidden, old phone results hidden, embedded countdown zero, action enabled and own player alive, then records distinct instance ids and authoritative state immediately before screenshots.

All five owned source hashes in `source-final.json` still match disk; no production source changed after the final critique batch. Relevant shared hashes were stable in the main final capture; later runs contain a few concurrent unrelated game edits, recorded per report. Independent final acceptance remains pending.


## Independent owner visual acceptance

Art director independently opened all12 first-after originals and the final corrected live/interaction originals. Final message confirms backdrop seams, transparent title area, compact Flappy/SnakeOUT, all task/stats above primary action, and Punch off-turn without a giant inactive action. Sensor feedback directly after Allow Motion is contextual permission feedback above the primary Hold→Release, with no required hierarchy correction. No second cosmetic batch requested. This is **owner correction acceptance pending canonical source freeze/report action acceptance**, not a global release/device approval. Carry player passing/goal acceptance uses carry-two evidence; main final1:0 is a bot goal and is not counted as playerPASS proof.


## Explicit resumed scope: two critical phone passes, every game

Previous bounded-stop acceptance does not approve this new batch. Both passes below actually inspect full original phone PNGs, with independent visual judgment; this is a manual review, not a new Impeccable critique command. All paths are beneath `output/playwright/ui-rework-2026-10-02/group04-fresh/`. Current owned source freeze is `source-two-pass.json`; older freezes remain historical. Fresh native402 proof and independent Director review remain pending ROOT browser slot. No browser started during HOLD.

| Game | Pass 1: complete header/task/status/gaps/type/composition | Pass 2: real control and state originals | Concrete response / remaining evidence |
| --- | --- | --- | --- |
| Tap Race | `final/taprace-phone-live-402.png`: recognizable runner, short finish task, three legible stats plus race progress before a large TAP surface. Header gap is generous but control remains in thumb reach; do not add another panel. | `final/taprace-phone-tapping.png`: points156 and6/s follow actual12 taps. No text or useful state below primary. Inspect held interruption, pause and reconnect afresh. | Retain active composition. Existing reset clears held value but leaves ArcadeJuice pressed class; now call existing release hook on blur/offline/pagehide. Same correction protects all six. |
| Punch Meter | `final/punchmeter-phone-charge.png`: Your punch → attempts/best/total → instruction → optional permission → charge action. Instruction and primary fit; charge fill is visible. | Permission and released originals: permission granted is explicitly waiting for sensor, not actual hardware validation; released834 off-turn hides primary. Permission feedback directly follows its permission control and precedes Hold→Release, so retain that relationship. | Preserve permission/arming/sensitivity logic and charged effect. Correct interrupted pressed-class reset and stale connection availability; fresh permission/charge/released plus pause/rejoin requested. |
| Flappy | `final/flappy-phone-flying.png`: recognizable bird, Fly task, Place/Points/Flying precede large FLAP. `final/flappy-phone-live-402.png` is a countdown and falsely says Flying beside Waiting for start; giant disabled button dominates. | `final/flappy-phone-out.png`: clear Out stats and next-flight hint, but Flight over still has a bright outlined button shape. Previous `restart-rejoin-clock12/flappy-phone-restarted.png` is transitional and explicitly unaccepted. | Countdown now says Starting inN, stat Ready, next-control instruction, and no inactive controls. OUT removes false action entirely. Fresh normal-clock finish→distinct new instance with hidden old results/TV transition and alive enabled controller remains required. |
| Hungry | `final/hungry-phone-live-402.png`: actual blob, Eat and grow, place/points/time, concise two-line steering task, large usable joystick. Font/gaps are readable; preserve active stick size and effects. | Steering original shows held knob; `restart-rejoin-clock12/hungry-phone-returning.png` says Back in1s yet instructs steering and retains ~230px disabled stick. Rejoined original is a real reload with same identity/score. | Returning now hides disabled controls and explains eaten→return. Restore active controls automatically from authoritative state. Fresh return/rejoin/pause proof pending. |
| Snake Lines | `final/snakelines-phone-live-402.png`: full snake art, task, round/wins/status and help above actual turn joystick. Turn hint belongs within control. | `final/snakelines-phone-steering.png` shows held input; `final/snakelines-phone-out.png` correctly removes control and names next round. Existing new-round engine original remains valid historical evidence. | Keep useful alive/OUT compositions. Countdown stat now Ready rather than Alive; shared interrupted-release/connection corrections apply. Fresh pause/rejoin and alive/OUT originals pending. |
| Carryball | `carry-two/carryball-phone-pass.png`: ball art/team/score/time precede joystick and Pass; action fits above footer, but generic Score task does not distinguish possession. | Two-human PASS original plus authoritative owner→null moving ball prove a real pass; `carry-two/carryball-phone-goal.png` proves score change after actual joystick. Before acquisition, PASS appears enabled despite no owned ball. | Task now distinguishes loose ball, self, teammate and opponent. Explain available next action above controls; PASS enabled only with authoritative possession and quiet otherwise. Fresh second real controller possession/PASS/goal plus pause/rejoin required. |

Focused batch modifies only owned app/style/juice presentation and input-release feedback. Existing server physics, collision geometry, art, all particles/celebrations, sensor permission/arming, shared header/footer and TV scene remain intact. New freeze supersedes only owned source hashes. Browser automation is browser evidence, not physical iPhone/sensor validation. Questions skipped: current explicit user scope supplies the direction and authorizes this focused correction batch.

New-batch source syntax PASS (`app.js`, `arcade-juice.js`), capture harness syntax PASS. Focused Impeccable scan returned three known findings: hidden cue has no initialsrc until authoritative mode assigns real atlas image (not a rendered broken box); preserved existing neon touch glow and striped Punch charge/juice decoration belong to existing authored effects. No unrelated cosmetic rewrite. New harness `group04-two-pass.cjs` prepared, not run during HOLD: minimum2 players on firstfive, exactlytwo real Carry controllers, actual held focus-loss input, parent Pause/Resume buttons, parent reload preserving playerid, fresh natural Hungry return if observed within105s, Flappy normal-clock results→newdistinct16player flight. Restart auto-click preparation now uses actual Playwright pointer clicks, since DOM button.click does not invoke this game's pointerdown input. This corrects capture automation only.


## New two-pass correction confirmation (normal clock)

Proof packet: `group04-fresh/two-pass-proof.json`. Owned six-file freeze `source-two-pass.json` matches disk; no physics edits. `controller-view.js` now sends only Carry ball.owner: browser exposed that phone projection omitted it, making the new possession gate always disabled. Corrected this presentation data contract before acceptance. Existing packet stability unit test PASS; direct Carry invariant check PASS: owner changes reach phone, ball position/velocity changes remain suppressed, only owner is sent. All owned temporary browsers/servers closed.

| Game | Fresh preferred phone original | Actual named state/input proof |
| --- | --- | --- |
| Tap Race | `two-pass-native/taprace-phone-tapping.png` | Actual12 taps score17→162; held and focus loss clear pressed class and reset knob; actual Pause/Resume; real reload preservesid. |
| Punch Meter | `two-pass-native/punchmeter-phone-charge.png` | Permission granted/waiting for sensor (no hardware claim), actual hold/release867; held focus-loss cancels charge; actual Pause/Resume and sameid reload. |
| Flappy | `two-pass-confirmation/flappy-phone-restarted-live.png` | Normal first match finishes, real Stop→Launch→Ready after exact new parentinstance, two actual primary pointer flaps. Oldinstance61a847c1bf74804c→newef3419440f8167b7; authoritative16 players, alive own bird, countdown0, enabled FLAP, TVtransition/oldphonerankresults hidden. Earlier named flying files during state staging already show OUT: unaccepted as live proof. Held focus-loss not sampled in Flappy because it had already fallen during staging; primary down/up actually exercised on restart. |
| Hungry | `two-pass-native/hungry-phone-steering.png` | Actual joystick mass23→29, released center; real Pause/Resume and sameid reload; actual pursuit of larger blob results in natural returning. `hungry-phone-returning.png` clearly explains eaten→return and removes unusable stick. |
| Snake Lines | `two-pass-native/snakelines-phone-steering.png` | Actual joystick turn0.932→1.193 and pathmovement; released center; trueOUT has no falsecontrol; real Pause/Resume and sameid reload. |
| Carryball | `two-pass-confirmation/carryball-phone-possession.png` | Exactlytwo real browser controllers, nobots; actual acquisition enables PASS; real primary press owner2d3684a0b43097f9→null, ballvx−471.2/vy207.1; actual joystick goal[0,0]→[0,1], phone ownscore1:0. Held release, Pause/Resume and sameid reload succeed. Looseball and ownedball tasks now match availability. |

Fresh original owner inspection found corrections visible and full action hierarchy intact. No self visual approval: Director/root receive full originals and exact authoritative samples. `two-pass-native` firstfour pause images caught entrance opacity and are state proof only; `two-pass-confirmation` pause originals wait450ms and show fully readable shared pause. Root shared TV/header/bridge work and concurrent sports changes are recorded by per-run hashes; these captures do not claim the later whole-catalog canonical visual freeze. First-run failures and fixture retry failures remain in their original reports (no overwrite): early Flappy TV state sampled before ready; missing Carry owner; same-game restart Ready race against stale parentinstance; retained15bots caused17thcontroller capacity. Bounded capture-only readiness/fixture corrections resolved the gaps.

## Independent director follow-up

Director independently viewed16 latest original images and exact action JSON: actual Carry possession→PASS→goal and Flappy distinct-instance live16 restart corroborated; Hungry returning and Snake OUT correctly remove inactive sticks. The review identified Punch's retained Allow Motion label after permission was granted. The existing flow now labels Requesting access, then Waiting for sensor while disabled, and retains Reconnect motion sensor after the existing no-data watchdog or denial. Unsupported/HTTP labels Sensor unavailable and keeps the touch fallback. No sensor data or permission timing/thresholds were changed. Direct source logic checks passed granted-without-samples, watchdog retry, denial and unsupported/HTTP branches; these are not hardware evidence.

Root authorized removing only duplicated Hungry/Carry Time and Snake Round when the managed parent visibly renders the same actual field. ArcadeJuice now checks the same-game parent HUD, actual matching clock/round value and visibility; standalone, hidden, mismatched or stale parent fields retain the original stats. Remaining stats stay above controls, and the existing column variable follows actual count (Carry's single Score remains centered). Direct invariant checks passed matching/hidden/stale/standalone timer and round cases. No primary action or score field removed.

New owned freeze: `group04-fresh/source-director-followup.json`. Earlier `source-two-pass.json` continues to identify the six valid state/action proof captures, and is historical after these two narrow corrections. New capture-only `group04-director-followup.cjs` prepares a four-game native402 normal-clock proof with actual permission wait→watchdog retry plus settled450ms real Pause/Resume originals. Browser HOLD until coordinator grants a slot. No all-six settled pause visual claim and no canonical shared freeze claim. Group06 independent cross-critique completed separately in `cross-critic-04.md`; no foreign production edits/browser.

### Follow-up original confirmation complete

Granted single sequential slot ended; owned browser/server sessions18426 and61498 completed and cleanup closed both. `director-followup-confirmation/report.json` ran13:15:42.633Z–13:16:36.457Z normal clock, errors[] and changedFiles[]: Punch actual permission click displayed Waiting for sensor disabled while Hold→Release remained enabled; no motion samples arrived and the existing watchdog changed it to enabled Reconnect motion sensor with truthful no-data fallback. This browser did not show a physical OS permission sheet or deliver actual device measurements. Snake parent Round1/5 retained above, controller only Wins/Alive; Carry parent1:58 retained, controller centered single Score. All three actual Pause/Resume controls produced settled450ms readable pause originals.

Hungry with one retained test bot remained waiting30s; explicit failed row retained, no gameplay source fix. Only Hungry retried with two real browser controllers/no bots in unique `director-followup-hungry-two/`:13:17:28.237Z–13:17:38.178Z, errors[] and changedFiles[], parent1:58, controller Place/Points in equal184px columns, actual settled Pause/Resume. Both retries preserve prior failure folders. All four live TV originals, all four settled phone pause originals, and Punch waiting/retry plus Hungry/Snake/Carry live phone originals were individually inspected. Remaining stats/tasks precede controls; full authored scenes and gameplay geometry remain intact. Own source freeze matches disk. Independent director receives this packet; no self approval. Tap/Flappy settled pause originals remain their earlier proof scope and no all-six canonical claim is made.

## Final named guidance correction — frozen

Independent director accepted permission naming, parent stat deduplication and four settled pause originals, then named secondary instructions still competing with task headings. Root authorized only #help and #motionFeedback typography. `style.css:172` now uses existing KardiaFit body, upright40014px/1.4 with existing quiet color/measure. Added the existing data-party-game selector specificity because the first actual Punch check exposed a stronger shared punch-specific italic rule. Status/action/stat fields, handlers, action dimensions, art and effects were not changed.

Final native normal-clock proof `final-guidance-confirmation/report.json`:13:47:13.167Z–13:47:38.945Z; two real browser controllers for each game/no bots; both passed, errors[] and changedFiles[]. All four selected originals individually viewed: Punch402 live, waiting and no-data retry; Hungry320×874 narrow-width analog guidance. Computed helpers and permission feedback are KardiaFit normal40014px with19.6px line height; primary task remains Fat. Punch was truthfully off-turn with Morgan acting and its touch primary withheld, so this does not replace prior own-turn fallback/hold-release proof. Browser permission did not produce physical OS-sheet or sensor measurements.320×874 is narrow-width proof, not a short-phone claim.

`final-guidance-proof.json` indexes the four selected original SHA256 and exact type/permission samples. `source-final-guidance.json` is the final owned six-file freeze and matches disk plus capture start/end. Sessions95583/66000/26641 completed with owned browser/server cleanup. The min2 single-player Punch fixture rejection and first actual italic-cascade rejection remain in their unique failure folders. Final scoped source is frozen; director notified for independent confirmation. No new gameplay action sweep, builds, commits or publication. Root whole-catalog canonical shared freeze remains separate.

## Named Hungry moving-target overlap — 2026-10-02 final scoped correction

Root and director reopened only canonical `new-session-canonical-confirmed/hungry-tv-live-1920.png`, whose Bot3 upper silhouette crossed the right wing backing ending near y95. Actual source inspection confirmed centered uniform projection placed the world above that wing; the sprite has a centered pivot and simulation independently clamps centers to x20..1180/y20..700. Simulation, controller projection, controls, guidance, effects and authored assets remain untouched by this batch.

`app.js` now fits only managed TV Hungry's complete 1200×720 world uniformly below measured `--party-wing-inset-top` +12px. Continuous authored backdrop still fills outer stage edges. The environment cache includes projection values, so a late measured wing update repaints the material consistently. Existing per-frame QA presentation data now records transformed/squashed full mouth bounds separately from the existing physical world clip's visible bounds; it reads visual state and does not move targets.

Fresh normal-clock proof: `output/playwright/ui-rework-2026-10-02/group04-fresh/hungry-wing-confirmation/report.json`. One real browser controller plus actual 3/15 built-in players, actual ready flow and joystick movement to top-right beneath the wing, then bottom edge. Four scenarios (4/16 players ×1280×720 /1920×1080) passed with `errors:[]` and `changedFiles:[]`; eight original screenshots were directly viewed by owner and sent to the independent director. Samples immediately before/after each screenshot preserve actual positions and bounds, not invented fixture positions.

| Players | TV | World top / bottom | Wing bottom | Result |
|---|---|---|---|---|
| 4 | 1280×720 | 76 /708 | 64 | Top mouth clear; whole world bottom fits |
| 4 | 1920×1080 | 108 /1062 | 96 | Top mouth clear; whole world bottom fits |
| 16 | 1280×720 | 76 /708 | 64 | Top mouth clear amid dense actual moving roster |
| 16 | 1920×1080 | 108 /1062 | 96 | Top mouth clear amid dense actual moving roster |

The prior physical-edge body clipping is retained and reported honestly: mass growth can put full body bounds beyond the world edge even though the complete authoritative world fits (e.g. 16p1280 bottom body y713.09, visible edge y708). This is not HUD occlusion and this narrow correction does not change the existing clip or mechanics. Owner inspection found the measured HUD concealment resolved; independent review pending.

Exact eight-original SHA and compact geometry packet: `group04-fresh/hungry-wing-proof.json`. Final owned-source hashes: `group04-fresh/source-final-hungry-wing.json` (`app.js` SHA256 `8cfdc79f532ee2604fb97432419b2d1c14204c59eef1154e538f99dab3700c84`). Only app.js changed since prior guidance freeze. Syntax check passed. The owned browser and ephemeral server closed normally. No build, commit or publication performed.

Independent director confirmation: all eight exact originals and the real joystick/top-bottom report inspected. Named HUD concealment resolved at 4/16 players and 1280/1920; whole world stays uniform and continuous scenery adds no slab. Existing growing-body physical-edge clipping remains an explicit limit, not blanket full-body approval. No further owned correction requested. Owned source frozen at `source-final-hungry-wing.json`; final root canonical capture pending.

## Latest explicit seven-agent critical recheck — source-ready Flappy copy

All24 completed current canonical-final Arcade originals directly reviewed, with per-game composition/control decisions in `group04-final-critical-recheck.md` and exact image/source SHA in `group04-fresh/final-critical-recheck.json`. Found Flappy OUT false next-round promise; root approved only helper-copy fix. Replaced with “Watch the remaining players.” / “Следи за оставшимися игроками.”, preserving Snake's real next-round guidance. Root declined optional Carry disabled PASS border refinement; its production styling remains unchanged. Syntax/copy checks pass. Final source freeze: `group04-fresh/source-final-flappy-copy.json`, app SHA `4b0e36b51f61be7af5b3f8dc9b97e9c5d65bb4475d34842d5e18ec0a55ea086b`. No new browser launched. Final root/reviewer catalogue original confirmation pending; no after-visual approval claimed yet.
