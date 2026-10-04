# Game-level screen state and photo audit — 2026-10-03

All 36 real managed TV hosts now hide both their common gameplay cap and their entire mounted engine surface during matchmaking at 1280×720 and 1920×1080. The shared parent fix belongs to shared_hud; no duplicate per-engine waiting gate was added. The original run reproduced common-cap exposure in 31 games and mounted visible frames in all 36. Bow Club and the four Sports Siege games already suppressed their common cap.

The final waiting sweep saved 72 originals, recorded 6,545 animation-frame observations with zero waiting visibility leaks, and reported no browser errors. Its sole source drift was concurrent `public/native-shell/host-ui.css`; TV/game gate sources stayed stable. This is a TV-qualified freeze, not a claim that the entire repository was immutable.

## Changes owned by this lane

- Air Hockey removed the measured-header reservation and hard rink backing. The complete canonical 1000×600 world fits uniformly at full TV height: 1200×720 at x40 and 1800×1080 at x60, both y0. The cap intentionally overlays the rink. Rules, collisions, world dimensions and input code are unchanged.
- Party standings/controller portraits and Arsenal roster portraits now mark uploaded images separately and apply a circular cover mask. Quiz and Millionaire uploaded portrait layouts are also square circles. Native mascot silhouette paths remain unchanged.
- Naval dense fleet photos now remain 26×26 instead of the previous 26×32 ellipse; Poker dense seat photos remain 36×36 instead of 36×42. These overrides are photo-only and preserve mascot geometry.
- shared_hud corrected the shared canvas avatar photo branch; this lane verified Bomb Tag actual loaded upload draws using the real circle clip and circular roster portrait.

The uploaded test image is `spectator-01-coral.png`, a square illustrated fixture sent through the actual file input, JPEG preparation and `/api/avatar/{id}` serving path. It is not a photograph of a person and is not physical-device evidence. Decoded live uploaded avatars are 192×192.

## Evidence and limits

The evidence verifier passes **423 assertions**. It checks the original failing control, all 36 actual waiting states, both TV sizes, saved originals, live upload dimensions/masks, forwarded real canvas circle-clip calls, dense Naval16/Poker8 real player counts, full-height Hockey projection, real joystick movement, pause/host reload/resume, and normal two-human session switching. It does not substitute synthetic state for real gameplay.

Focused live originals were opened for Bomb Tag, Arsenal, Millionaire, Sinyak Quiz and Air Hockey at both TV sizes. All six latest dense Naval/Poker/Hockey originals were opened. Air Hockey and Millionaire pause, paused host iframe reload, and resume pairs were opened. All four Bowling/Curling switch originals were opened. All36 waiting state measurements are complete; this lane visually opened representative waiting originals (Push both sizes, Kart, Naval, Quiz, Millionaire, Bow, Bomb and Air), not every one of the 72 waiting originals. Independent director review covers additional originals.

Two persistent browser humans naturally readied Bowling, stopped it, returned to the lobby, launched Curling and naturally readied it. Both games reached actual `playing`; the reported physical two-human blockage was **not reproduced**. Root owns the wider server/native diagnosis. No native gyro behavior or physical phone behavior was verified by this lane.

**Open visibility finding:** the full-height Air Hockey rink is correct, but the moving puck can pass partly or wholly behind the opaque shared cap. This is real overlay occlusion, not a cropped canvas or changed physics. Root was notified; a shared presentation decision is pending. The projection test passes without claiming this gameplay visibility issue is closed.

Actual phase/rejoin interaction evidence is representative for Hockey and Millionaire. Native phase/render source conditions were inventoried for all 20 engine families; this is not an all36 results/reconnect replay or complete gameplay regression run. No build/install/commit was performed.

## Raw capture packets

| Packet | Coverage | Qualification |
| --- | --- | --- |
| [initial-waiting](../../../output/playwright/screen-state-audit-2026-10-03/initial-waiting/report.json) | All36 waiting, bothTV | Real negative control; 0 errors/drift |
| [initial-gameplay](../../../output/playwright/screen-state-audit-2026-10-03/initial-gameplay/report.json) | Bomb, Arsenal, Hockey before | 0 errors/drift |
| [final-waiting](../../../output/playwright/screen-state-audit-2026-10-03/final-waiting/report.json) | All36 waiting, bothTV | Native-only CSS drift disclosed; 0 errors/leaks |
| [final-gameplay](../../../output/playwright/screen-state-audit-2026-10-03/final-gameplay/report.json) | Five affected live games + two-family phase transitions | 0 errors/drift |
| [final-dense-photo](../../../output/playwright/screen-state-audit-2026-10-03/final-dense-photo/report.json) | Naval16, Poker8, Hockey bothTV | 0 errors/drift; all six originals opened |
| [bowling-curling-two-human](../../../output/playwright/screen-state-audit-2026-10-03/bowling-curling-two-human/report.json) | Two persistent humans normal switch, bothTV | 0 errors/drift; failure not reproduced |

## Catalog waiting coverage

Every row below has real native child phase `waiting`, parent waiting overlay visible, common cap hidden, iframe hidden, both saved final TV originals, and no observed waiting flash.

| Catalog game | Engine | Original common-cap leak | Final720/1080 |
| --- | --- | --- | --- |
| Push Pit (push) | party | yes | PASS / PASS |
| Последний круг (shrink) | party | yes | PASS / PASS |
| Color Knives (knives) | party | yes | PASS / PASS |
| Bomb Tag (bomb) | party | yes | PASS / PASS |
| One Shot Western (western) | party | yes | PASS / PASS |
| Local Tanks (tanks) | undefined | yes | PASS / PASS |
| Tank Arsenal (tankarena) | undefined | yes | PASS / PASS |
| One Cursor Chaos (chaos) | undefined | yes | PASS / PASS |
| Wi-Fi Kart Party (kart) | undefined | yes | PASS / PASS |
| Монстр по кругу (monster) | undefined | yes | PASS / PASS |
| Шпион (spy) | undefined | yes | PASS / PASS |
| Синяк-миллионер (millionaire) | undefined | yes | PASS / PASS |
| Синяк: квиз-компания (sinyakquiz) | quiz | yes | PASS / PASS |
| Прикольная Варшава (warsaw) | quiz | yes | PASS / PASS |
| Крокодил (crocodile) | undefined | yes | PASS / PASS |
| Тихо, дженга! (jenga) | undefined | yes | PASS / PASS |
| Ночная стройка (crane) | undefined | yes | PASS / PASS |
| Быстрый морской бой (naval) | undefined | yes | PASS / PASS |
| Рисуй — угадай (drawguess) | undefined | yes | PASS / PASS |
| Двое на закате (western_duel) | undefined | yes | PASS / PASS |
| Tap Race (taprace) | arcade | yes | PASS / PASS |
| Punch Meter (punchmeter) | arcade | yes | PASS / PASS |
| Multiplayer Flappy (flappy) | arcade | yes | PASS / PASS |
| Hungry Arena (hungry) | arcade | yes | PASS / PASS |
| Snake Lines (snakelines) | arcade | yes | PASS / PASS |
| Carry Ball (carryball) | arcade | yes | PASS / PASS |
| Marble Bloom (marble_bloom) | arcade_deluxe | yes | PASS / PASS |
| Pocket Siege (pocket_siege) | arcade_deluxe | yes | PASS / PASS |
| Bow Club (bow_club) | bow_club | already hidden | PASS / PASS |
| Poker Night (poker) | tabletop | yes | PASS / PASS |
| Air Hockey (airhockey) | tabletop | yes | PASS / PASS |
| Mine Together (mines) | tabletop | yes | PASS / PASS |
| Лёд и нервы (curling) | sports_siege | already hidden | PASS / PASS |
| Pocket Strike (bowling) | sports_siege | already hidden | PASS / PASS |
| Не грызи ворота! (swarm_gate) | sports_siege | already hidden | PASS / PASS |
| Кто тут вылез? (peek_shoot) | sports_siege | already hidden | PASS / PASS |

## Native engine visibility inventory

The managed wrapper owns waiting suppression; these native render states remain intact. Full source references are in [game-source-inventory.json](game-source-inventory.json) and [game-family-phase-contracts.json](game-family-phase-contracts.json).

| Engine | Native host contract |
| --- | --- |
| party | Lobby overlay for no mode/lobby; persistent canvas and standings; countdown/playing/between/finished are genuine server states. Western earned notification suppresses old between card only while shown. |
| tanks | updateUi toggles lobbyOverlay/resultOverlay/joinBadge by game.status. Persistent canvas receives authoritative snapshots. |
| tankarena | Persistent arena/board. Arsenal event surface hidden unless playing. Actor names omit lobby actors. |
| chaos | managed-start invokes showGame; initial setup/lobby and real results screen are native host states. roundActive and gameClock.paused gate the simulation. |
| kart | Persistent scene/rail. Countdown shown only status=countdown; results ranks derive actual racing results; lobby/countdown/racing/results are native status values. |
| monster | lobbyPanel/gamePanel/revealPanel use exact lobby/playing/reveal checks. Timer ticks only playing. |
| spy | show(state.phase) picks lobby/reveal/playing/voting/result views. Only playing advances turn timer. |
| millionaire | lobby->renderLobby; finished->renderFinish; other question/reveal phases->renderGame. Timer ticks only question. |
| quiz | gameScreenPhase receives actual phase. Setup only host lobby/finished; answer list from real question and phase; shared parent cap uses normalized UI playing/reveal. |
| crocodile | gameScreenPhase; setup lobby/finished; actor actions turn; next between; secret only actual authorized secret payload. |
| jenga | Persistent tower and board. Current turn/phase selects controls; settling/selected block determine native feedback. |
| crane | Persistent scene/crew. joinPanel only lobby/results; actual turnStage selects aiming/landing/feedback. |
| naval | gameScreenPhase; native battle controls/reload meter require actual battle and live player. Board/fleet persist, parent suppresses them during waiting. |
| drawguess | gameScreenPhase; setup only lobby/finished; real artist and phase determine drawing/guess controls. |
| western_duel | Persistent desert/rail; cue derives waiting/countdown/waitingSignal/draw/reveal/results. |
| arcade | Persistent canvas/scoreboard; lobbyStage hidden when native playing; real countdown/finished/player-alive drive cues. |
| arcade_deluxe | Persistent scene. overlay visible outside playing or during real loadout draft; tactical surface only playing outside loadout; results use real result. |
| bow_club | Persistent board/range. Match facts only playing; start only waiting; reset only results; real results drawn from result players. |
| tabletop | Mode section hidden while native waiting; real playing/results render chosen board/rink/table. Mine rail roster stays mounted; parent hides entire waiting frame. |
| sports_siege | ss-overlay hidden only playing; settings/start only waiting; again/results only results. Native gameplay HUD preserved; shared parent cap already suppressed in this family. |

## Tests and source record

- `node scripts/qa/check-screen-state-evidence-2026-10-03.cjs` → PASS423. [Machine result](game-evidence-check.json).
- Shared photo circle/mask and mascot-preservation unit tests were run by shared_hud; they are a separate worker result, not rerun here.
- [Exact 10-file owned SHA256 freeze](game-owned-source-freeze.json). No engine rules/server/simulation file was changed by this audit.
- Latest dense photo CSS changes require affected refresh only; root explicitly confirmed that the unchanged all36 waiting gate sweep remains qualified.
