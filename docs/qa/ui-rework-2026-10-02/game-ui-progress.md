# Game UI progress — 2026-10-02

Source pass frozen for root final QA. All 36 catalog entries have real engine TV+phone captures across independent batches. This is live-state evidence, not complete phase/roster/hardware certification. Original gallery preserved. WebKit emulation is not physical iPhone validation.

## Exact changed source owned by this agent

The dirty tree also contains concurrent Claude gameplay/art changes. Preserve them; never revert entire files.

| Folder | Files changed by Codex UI |
|---|---|
| games/party | public/index.html, public/controller.css, public/host.js, public/host.css |
| games/western_duel | public/app.js, public/index.html, public/style.css |
| games/arcade | public/app.js, public/index.html, public/style.css |
| games/jenga | public/index.html, public/controller.css, public/style.css |
| games/crane | public/client.js, public/style.css |
| games/kart | static/controller.html, static/styles.css |
| games/naval | public/index.html, public/screen.css |
| games/chaos | static/controller.html, static/host.html |
| games/tabletop | public/index.html, public/arena.css |
| games/quiz | public/screen.js, public/screen.css |
| games/crocodile | public/screen.js, public/screen.css, public/index.html |
| games/millionaire | public/index.html, public/tv-layout.css, public/player.css |
| games/spy | public/index.html, public/spy-layout.css |
| games/monster | public/styles.css |
| games/drawguess | public/screen.css |
| games/tanks | public/index.html, public/controller.css, public/host.css, public/host.js |
| games/tankarena | public/style.css |
| games/arcade_deluxe | public/index.html, public/style.css |
| games/sports_siege | public/index.html, public/style.css, public/host.js |
| games/bow_club | public/phone.html, public/style.css |

QA source: scripts/capture-interface-review.cjs. Added reusable QA_EXTRA_PLAYER_GAMES (default carryball), a separate real browser context joining before launch, ready after loaded frame, bots clamped to game.max, context cleanup, root/body/canvas diagnostics. Harness released to root for final capture.

## Evidence locations

Before every row: output/playwright/game-interface-review/captures/{id}-tv-live-1920.png and {id}-phone-live-402.png. Exact user feedback: user-comments.md.

After every row: output/playwright/{batch}/{id}-tv-live-1920.png and {id}-phone-live-402.png. Batch abbreviations below:

- A = ui-rework-games-party-arcade (11/12 first attempt; Carry Ball originally uncovered).
- B = ui-rework-games-physical (9/9).
- C = ui-rework-games-social-combat-sports (15/15).
- D = ui-rework-games-refinements (8/8; errors0; no offscreen phone controls).
- E = ui-rework-games-final-small (Tanks, Chaos, Carry Ball; 3/3; errors0; no offscreen phone controls).

All first 35 pairs inspected in contact sheets. Individual Push TV / Knives phone / Tanks TV inspected. Refinement individual Knives phone, Swarm phone, Carry Ball phone, Chaos TV, Tanks TV inspected. Root owns stable final 72-shot capture and complete phase-specific review after source freeze.

## All 36 catalog entries

| Game | Before | Changed / why | After evidence | Remaining / limitation |
|---|---|---|---|---|
| push | Stats below joystick; empty TV sides | Stats actual DOM before joystick; two score wings use side space | A live + pause | Root final shared TV geometry |
| shrink | Low stats; no shrink forecast | Stats above joystick, wings, three thin outside forecast rings | A live | Full shrink timing/physical TV review |
| knives | Scores under Throw; leader lines crowd target | Stats above Throw, wide centered action, standings wings, label lines removed | D live | No remaining layout defect seen |
| bomb | Stats under joystick; standings absent | Stats above joystick and standings wings | A live | Root final shared TV geometry |
| western | Status under Fire; unequal cinema bars | Info above Fire, aligned centered action, equal bars | D live | No remaining layout defect seen |
| tanks | Small field; stats below actions; base text inside base | Stats before controls, matched icon/label/hint rows, canvas fills iframe, text above base | E live CTF | Parent iframe prevents true fullscreen; root owns fix |
| tankarena | Narrow TV field; phone approved | Wider field and ranking wing; retained phone control structure | C live | Parent fit; physical aiming unverified |
| chaos | Small arena; framed pad; bulky title | Unframed pad, authored icons; centered compact task strip; measured title-bottom fit | E live calibration | Fixed 1000×600 aspect remains width-limited; root parent/HUD geometry |
| kart | Telemetry under controls; unstable columns | Telemetry before controls; three stable stat columns; equal controls, existing rocket icon | B live | Sensor steering hardware unverified |
| monster | Stretched large palette; narrow stage | Wider stage/queue; compact toolbar; circular painted26px colors inside clickable44px targets | C live draw | Final target refinement needs root image; art integration separate |
| spy | Private info under next action; contained TV duel | Secret before action; broad conversation stage and readable players; short states centered | C live Ask | Both Ask/Answer and secret-hold physical checks pending |
| millionaire | Timer under choices; narrow ladder; low question | Timer before choices; wide flat ladder; raised question, larger answers | C reveal | Active answer needed; use QA_ACTIVE_QUESTION=1 |
| sinyakquiz | Rankings right; low question; weak phone score | Rankings actual DOM left, task raised, 32px phone points | C live question | Root final shared UI review |
| warsaw | Same quiz hierarchy issue | Same ranking-left/raised question/score treatment | C live question | Root final shared UI review |
| crocodile | Rankings right; stats under actions | Ranking left; task raised; stats before action buttons | C live active word | Guesser/reveal phase review pending |
| jenga | Bulky TV turn; numbered frames; force below joystick | Compact turn, no section numbers/outer frame, force above joystick | B live | Pull/hold/release not rerun this pass; handlers preserved |
| crane | Floating foundation; bulky title/status | Camera anchors foundation at visible bottom; compact title/status and72px actions | B live | Tall completed tower/drop-settle review pending |
| naval | Cramped bridge/feed; outcome below grid | Wide readable bridge/fleets; outcome actual DOM above battle;52px targets | D live | Late game/placement/shooting phase review pending |
| drawguess | Narrow canvas; nested frames; stacked guess action | Broad drawing stage/wing; unframed tools; input +52px button | C live drawing | Guess/reveal phase review pending |
| western_duel | Queue below Fire; unequal bars | Queue/standings before Fire; equal6% bars; compact sidebar | A live duel | Physical TV cue review pending |
| taprace | Busy frame; inconsistent stats/action | Uniform contain field; full race standings; help before action; compact stats | A live | Root parent field fit |
| punchmeter | Nested result frame; weak status | Outer result frame removed; help before action; consistent strong stats | A live | Device motion physical-only |
| flappy | Small framed field/action; info below action | Full iframe field with rectangular clip; large action; help before action | A eliminated state | Active flying and outcome phase review pending |
| hungry | Small field and low readout | Full iframe uniform field; help/stats before joystick | A live | Claude corner-art obstacle appearance; parent fit |
| snakelines | Small framed field and low readout | Uniform full iframe field; info before joystick | A live | Lethal world border retained; parent fit |
| carryball | No capture: minimum real players readiness blocked start; help below controls | Second actual browser harness closes gap; help/stats before joystick/pass; uniform field | E live, 2 actual browsers +3 bots | Goal interaction not exercised; parent fit |
| marble_bloom | Small framed field; ammo under aim | Full iframe field; ammo before aim; readable action row | C live | Versus boards retained; parent full viewport pending |
| pocket_siege | No requested structural change in latest comment | Reviewed existing artillery controls; shared font roles retained | C live active artillery | No structural game edit; hardware/all weapon variants unverified |
| bow_club | Score/calibration under aim | Points/arrows/calibration before touch pad; separated top info/bottom Draw | D live touch mode | Camera/AR and physical tracking unverified |
| poker | Contained table; absent quick rules | Wider uniform table, readable actions, collapsed quick rules | B live | Full betting/hand states pending |
| airhockey | Rink underuses height; help below joystick | Larger uniform5:3 rink; help before joystick | B live | Device joystick/goal phases pending |
| mines | Small scoreboard; dense direction controls | Readable flat rows and28px points; spaced dpad/actions | B live | Loss/reveal phase pending |
| curling | Dense status/info; inconsistent spacing | Info/help before gesture;28px score; consistent settings; compact TV HUD | C live | Swipe/sweep/native release pending |
| bowling | Dense status and bottom info | Info/help before gesture; consistent stats/compact HUD | C live | Throw/spin/frame progression pending |
| swarm_gate | Small scene; narrow fire/ability | Renderer full iframe; help before aim; full-width100px action row | D live | Parent true fullscreen/high-roster wing review |
| peek_shoot | Small scene; cramped action labels | Renderer full iframe; help before aim; full-width fire/ability | D live | Parent true fullscreen/streak/end phase review |

## Render geometry handoff for Claude

- Party: Shrink forecast rings at authoritative radius +8/+50/+92, outside arena; static for reduced motion. Knife label leader lines removed; label positions retained. Western equal58-world-pixel cinema masks; Western Duel equal6%-height masks. Rules and simulation coordinates unchanged.
- Arcade: outer clip roundedRect1200×720→rect1200×720. All effects/art hooks retained; object-fit:contain preserves world geometry.
- Crane presentation camera: bottom=842 and worldBottom=817; target bottom/craneZoom−worldBottom instead of safeTop/craneZoom−worldTop. Foundation participates in fit. Rope, physics, effects retained.
- Chaos: original fixed1000×600 ChaosContract.fit; top from measured title bottom+16; one compact centered task strip. Coordinates and normalized input contract untouched.
- Sports: Swarm/Peek camera viewport uses entire iframe; other modes top gap42→24 scaled units. Existing orthographic world fit retained. Dense >8-player side wing retained.
- Tanks: base text y−68 clamped24, font16 Fat; authoritative base position retained. Canvas100vw/100dvh contain.
- Full TV viewport requires root-owned parent iframe geometry: observed iframe innerHeight888 on TV1080 because frame begins below192px masthead. Filling this iframe cannot yield a full1920×1080 uniform world. Root notified. Do not call true fullscreen complete before parent fix and final evidence.

## Verification

- Real launcher/engine, no injected state/scores. Normal clock. Built-in bots plus actual browser controller; Carry Ball has separate second real context.
- Party action test passes inertia/arenas/joins/reconnect/stale actions/stats; Tanks weapon cadences; Shrink timing.
- Target Western/state/payload suites24/24 pass. Arcade traffic initial sandbox listener EPERM; isolated local-server permission rerun1/1 pass (16 controllers receive scores; idle packet bounds).
- Impeccable detector once on five CSS targets: nine legacy findings (base Inter superseded by Kardia, old bounce easings/bar-width transitions, quiz answer identity stripe, sports player stripe). output/playwright/ui-rework-games-detector.txt. None in appended layout blocks. Concurrent effect code and brand identity retained.
- Early batches had concurrent shared edits; root must take stable final all36 captures. No native build, Apple upload, physical-device validation or atlas integration claimed.

## Six representative review images

- output/playwright/ui-rework-games-refinements/knives-phone-live-402.png
- output/playwright/ui-rework-games-refinements/swarm_gate-phone-live-402.png
- output/playwright/ui-rework-games-final-small/carryball-phone-live-402.png
- output/playwright/ui-rework-games-final-small/chaos-tv-live-1920.png
- output/playwright/ui-rework-games-physical/crane-tv-live-1920.png
- output/playwright/ui-rework-games-social-combat-sports/sinyakquiz-tv-live-1920.png

Final source cleanup after individual refinement review: Naval legend moved before grid as well as last-shot feedback; Bow readout background and nested score pill removed. These two visual refinements, and Monster clickable44/painted26 palette, await root stable final screenshots. Game source is now frozen.

## Focused fullscreen-label follow-up after root parent fix

Root made the TV parent iframe cover the full viewport. The earlier parent-height limitation is resolved for Tanks/Hungry in the new evidence; other catalog entries remain subject to root final batch.

Changed **only** games/tanks/public/host.js and games/arcade/public/app.js in this follow-up. No simulation, field size, physics, or Claude artwork/effects changed.

- Tanks: safe label floor comes from measured --party-stage-inset-top / --party-native-inset-top converted through canvas contain scale, letterbox offset, and current context transform. A base whose above-base text would be masked places text below its circle. Tank name placement now avoids base-label rectangles and the same HUD floor. RED BASE no longer sits behind GAME/objective, and nearby player name is separately visible.
- Hungry: existing collision-aware name/mass placer clamps to the measured HUD floor, with continuity invalidated when measured geometry changes. It retains original labels/art/coordinates and all other Arcade mode floors.
- Real isolated normal-clock run: output/playwright/ui-rework-2026-10-02/fullscreen-labels/report.json; Tanks and Hungry live captured, page errors0, changed-during-capture files0. Both final1920×1080 TV images individually viewed. Hungry's12 live samples contain96 name/mass labels, all y>=safeTop (world safeTop112), no HUD-floor violations. Hungry canvas1920×1080. Tanks full16:9 field visually fills TV; both bases, tank names, effects remain visible. Both edited JS syntax checks pass.
- Before: output/playwright/ui-rework-2026-10-02/shared-fields/tanks-tv-live-1920.png and hungry-tv-live-1920.png.
- After: output/playwright/ui-rework-2026-10-02/fullscreen-labels/tanks-tv-live-1920.png and hungry-tv-live-1920.png.

These two game files are frozen again and released for root final QA.

## Group02 source freeze after screenshot rejection

Tanks/Tank Arsenal bounded follow-up completed and real-paired originals inspected. Exact before/change/why/evidence/remaining matrix, real firing/release checks and owned-source list: `group02-progress.md`; frozen SHA256 contents: `group02-source-hashes.json`. Final original paths: `output/playwright/ui-rework-2026-10-02/group02-tanks-approved/` and `group02-tankarena-final-v2/`. Both reports errors[]/changedFiles[]. Commander verdict pending. Root shared central notch can mask a moving hull beneath it; geometry never crops authoritative targets and labels avoid measured HUD. No next-group work started.
