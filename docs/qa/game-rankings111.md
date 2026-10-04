# Game rankings111 · final bounded pass

Implemented in `public/rankings-theme.css/js`; shared shell include/routes are narrow integration points. No game-folder edits in this111 patch. Claude engine files and existing shared Flourishes remain intact.

Approved controller ranking palette is carried into genuine authored ranks: shaded bright places, nearby cups, secondary points, opaque row bases, individual rounded native cards with real gaps, avatar badges outside the photo mask. Jenga turn queue and poker seats are excluded. Sorted score lists without explicit places remain unnumbered; no sort/score/tie rules are changed.

Phone results always use the same place / identity / right-score columns. Long numeric values fit their reserved right rail using actual Kardia metrics. Visible names wrap to two lines; complete names remain in DOM and accessible title. The real native route (app + controller bridge + persistent tabs) confirms filters hidden and the first result row below the header at320/393/402. Catalogue branding used `display:grid!important`, overriding the HTML hidden state; an explicit match-state selector now wins.

Kart rows are compact, consistently rounded and aligned; RACERS title/subtitle use approved20/14px roles. Crane rows reserve leading-zero rank/cup rails and have8px gaps. TankArena groups points/HP/target tightly so four rows fit720. TV podium places are bright with a dark contour; points use actual KardiaFitRunner400 at.84 opacity, in a darker tone of each plinth. A minimal has-tail spacing reduction keeps all16 plinths inside true720/1080 fitScreen without changing their authored heights.

## Evidence and limits

- `games/final-live/report.json`:36/36 actual normal-clock gameplay states; broad sweep spans historical revisions.
- `games/finish/report.json`:35 actual engine finishes using a12× QA server clock and real permitted controls; no scores/results injected. Chaos actual finish remains uncovered. This does not validate real-time physics.
- `games/current-cards/report.json`: current actual Crane/Kart/TankArena4-player TV720/1080 + phones320/393/402.
- `games/current-crew16/report.json`: actual16-player Crane top and accessible end-of-list.
- `games/podium-approved/report.json`: actual bright Push podium.
- `games/native-shared-final/report.json`: latest actual native Push finish with bridge/tabs; first-row top203px on320 while header ends64px; filters display:none.
- `stress-fixtures/report.json`: final current-source labelled renderer stress tests, author places1/2/2/4 and10–16;0/1000/seven+nine-digit values; Cyrillic identity; TV16 true stage1280×720 and1920×1080. Last plinth bottoms692.7/1038.0px. Current checks PASS.
- Max-scroll320 tail capture intentionally retains a partial preceding row. For a clean whole first row use `shared-320-place13-anchored-fixture.png`;402 tail shows places10–16 fully. Neither is falsely described as initial scroll position.
- Fixtures are not real engine outcomes; this agent did not validate a physical phone, AirPlay4K or install a build. Root owns full test/build/device evidence.

Final CSS SHA256: `e1267b82b6e9964a90af309dc08751b2d93d40f883d1a0f0082f4b993652810a`. JS: `a356e88242d0400ef86747b429df687651df4cb03e6bb1736b2960db6b07dc7d`. Native shared screenshot was captured before the subsequent TV-only has-tail CSS change; that change does not affect phone rules. Final fixture hashes include the darker wall sources.

## Catalogue inventory

| Game | Native ranked surface / preserved context | Actual live | Actual finish |
|---|---|---|---|
| push | tanks (author place) | Yes | Yes, historical batch |
| shrink | tanks (author place) | Yes | Yes, historical batch |
| knives | tanks (author place) | Yes | Yes, historical batch |
| bomb | tanks (author place) | Yes | Yes, historical batch |
| western | tanks (author place) | Yes | Yes, historical batch |
| tanks | tanks (author place) | Yes | Yes, historical batch |
| tankarena | arsenal (author place) | Yes | Yes, historical batch |
| chaos | No additional ordinal DOM leaderboard; authored Canvas/game status is preserved | Yes | Uncovered |
| kart | kart (author place) | Yes | Yes, historical batch |
| monster | No additional ordinal DOM leaderboard; authored Canvas/game status is preserved | Yes | Yes, historical batch |
| spy | No additional ordinal DOM leaderboard; authored Canvas/game status is preserved | Yes | Yes, historical batch |
| millionaire | author (no invented place) | Yes | Yes, historical batch |
| sinyakquiz | classic (author place) | Yes | Yes, historical batch |
| warsaw | classic (author place) | Yes | Yes, historical batch |
| crocodile | classic (author place) | Yes | Yes, historical batch |
| jenga | Turn queue is not a ranked leaderboard | Yes | Yes, historical batch |
| crane | crane (author place) | Yes | Yes, historical batch |
| naval | classic (author place) | Yes | Yes, historical batch |
| drawguess | classic (author place) | Yes | Yes, historical batch |
| western_duel | classic (author place) | Yes | Yes, historical batch |
| taprace | No additional ordinal DOM leaderboard; authored Canvas/game status is preserved | Yes | Yes, historical batch |
| punchmeter | No additional ordinal DOM leaderboard; authored Canvas/game status is preserved | Yes | Yes, historical batch |
| flappy | No additional ordinal DOM leaderboard; authored Canvas/game status is preserved | Yes | Yes, historical batch |
| hungry | No additional ordinal DOM leaderboard; authored Canvas/game status is preserved | Yes | Yes, historical batch |
| snakelines | No additional ordinal DOM leaderboard; authored Canvas/game status is preserved | Yes | Yes, historical batch |
| carryball | No additional ordinal DOM leaderboard; authored Canvas/game status is preserved | Yes | Yes, historical batch |
| marble_bloom | author (no invented place) | Yes | Yes, historical batch |
| pocket_siege | author (no invented place) | Yes | Yes, historical batch |
| bow_club | No additional ordinal DOM leaderboard; authored Canvas/game status is preserved | Yes | Yes, historical batch |
| poker | Poker seats/chip status are not ordinal standings | Yes | Yes, historical batch |
| airhockey | No additional ordinal DOM leaderboard; authored Canvas/game status is preserved | Yes | Yes, historical batch |
| mines | No additional ordinal DOM leaderboard; authored Canvas/game status is preserved | Yes | Yes, historical batch |
| curling | author (no invented place) | Yes | Yes, historical batch |
| bowling | author (no invented place) | Yes | Yes, historical batch |
| swarm_gate | author (no invented place) | Yes | Yes, historical batch |
| peek_shoot | author (no invented place) | Yes | Yes, historical batch |

Independent final review: rankings_polish accepted the bounded e126/a356 package (SHIP), including both clean TV16 viewports, explicitfour-person1/2/2/4, shared320 anchored first row and current native cards.86 originals reviewed; final source remains frozen.
