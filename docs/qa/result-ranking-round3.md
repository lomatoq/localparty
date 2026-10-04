# Match result ranking audit · round3

The shared all-first defect is fixed. Fresh normal managed finishes on the frozen implementation show Crane3 collective winners with different personal scores446/442/299 at places1/2/3, TapRace16 actual pointer-controlled players with291…18 points at places1…16, and Curling2 genuine team totals1/0 at places1/2. Phone320/393 and TV1280×720/1920×1080 were captured. All48 final ranking images were manually viewed, including28 clearly marked renderer contract fixtures.

## Factual cause

`games/crane/server.js` correctly reports collective `won:true` once the tower reaches eight floors. The previous `TVDirector.matchRows` converted every missing place with `won:true` to `rank:1`. `rankResultRows` then accepted those integers without comparing scores, so the phone and TV inherited all-first places. `ProfileStore.record` did not synthesize1 and could persist a different order. The backed-up old function reproduces1/1 from the actual594/592 result; this replay is identified as a counterfactual contract check, not a before gameplay screenshot.

## Final behaviour

- `won` remains the engine outcome and continues to count a collective win in profile statistics. It does not automatically mean first individual place.
- `ranking.kind="score"` derives places from personal score, descending by default. Explicit stale places are repaired. Equal scores use competition places1/1/3; zero ties are legitimate shared first places. Negative values retain their meaning.
- `ranking.kind="teams"` derives places from finite, consistent `teamScore` values. Team count determines place: eight people on each of two teams occupy team places1/2, not1/9. Different personal contributions remain in `score`. A tied team total gives a genuine shared team place.
- The backward-compatible `outcome` policy preserves legitimate engine winners and coherent explicit engine places, including survival/race/tiebreaker results. It then sorts unranked players by points. A repeated place with different comparison values is rejected.
- Missing or inconsistent team metadata falls back to personal outcomes; no team total is fabricated. `direction="asc"` is available for an explicit lower-is-better contract. Current Kart already converts race order to descending points; no existing timer metric was reinterpreted.
- Phone first-place gold cup and highlight follow numeric `rank===1`, matching TV. Shared victory flags are preserved independently. Every shared result row displays an existing cup plus a real digit for places1–3, clear digits for4+, and a soft internal separator between place and literal identity. Company tops reuse the same place component with the existing medal pack. Points have opacity.84 while place digits retain full opacity.
- Both TV capture and stored events keep sanitized ranking/team metadata, so cold restart retains the same ranking. Literal profile names and secrets protection remain intact.

## Scope and ownership

Ranking-agent production: `lib/result-ranking.js`, `lib/tv-director.js`, `lib/profile-store.js`, `public/match-results.js`, `public/game-ui-system.js/css`, `public/tv-show.js`, ranking-only functions in `public/app.js`, two result-label pairs in `public/i18n-shell.js`; metadata-only producer edits in `games/tanks/server.js`, `games/arcade_deluxe/core/tanks.cjs`, `games/sports_siege/match.js`, `games/arcade/server.js`. Root added Crane/Bow/tabletop metadata; quiz owner added Quiz/Crocodile metadata. Existing dirty mechanics/UI work was preserved. `public/tv.js` and `tv-information.css` were not changed by the ranking agent.

## Validation

- 135 meaningful tests pass: ranking, shared result/director/profile contracts, earned Bow draw/shoot coop and team results, actual Quiz captain submissions and Crocodile guessed/skip producer results, explicit Pocket negative-contribution and Curling/Swarm contract fixtures, plus existing corresponding engine suites. `unit-tests.log` contains the run.
- `source-audit-36.json` covers all36 catalog IDs with exact producer path, SHA256, scoring reason and mode exception. The universal adapter tests cover distinct/tied/zero scores and2/16 rows. Sixteen-row fixtures do not imply that an engine supports16 participants.
- Browser `contracts-final/report.json` passes36 phone/TV renderer adapter assertions, plus28 explicitly labeled contract images for personal coop, outcome, race points, genuine teams,16 personal places and16 members of two teams. Reduced Motion isolates stable numeric ranks;16-row cases include first and last scroll positions. The corrected template hides catalog filters and uses the launcher’s measured TV zoom. The earlier `contracts/` shots are rejected in `acceptance.json`, not final gallery evidence. These are isolated static shell fixtures, not real finishes.
- `real-crane-frozen/report.json` is a normal-clock actual managed3-human result. Eleven real pointer drops built eight floors and exhausted three lives; all6 native results/company-top images were viewed. No TEST_FAST, clock override or result injection.
- `real-taprace-frozen/report.json` is a normal45-second actual16-controller match. Different real pointer tap counts earned291/273/255/237/218/200/182/164/146/127/109/91/73/55/36/18 points. All10 result and company-top images were viewed, including first/last phone scroll positions.
- `real-curling-team-final/report.json` is a genuine normal-clock1-end game (8 actual swipe throws);2-team results1/0 and all4 native images were viewed. Clock rate1 does not preload the QA clock shim. Personal `score` is retained in server/profile data; phone and TV present `teamScore` under Team score/team points.
- The company ranking still uses the established profile award totals40 for a win and10 for participation. Thus Crane’s collective40/40/40 is a genuine aggregate tie even when personal construction points differ; TapRace’s company top is40 vs15 tied10 totals. Shared company display now matches TV competition places and does not invent a personal win.
- Native320 company modal contains full names without ellipsis/clipping; a long single surname may wrap3lines with its last character on the next line. This remaining cosmetic refinement is recorded and was not changed after the root production freeze.393 is clean.


## Source audit · all36 games

| Game | Producer | Policy / reason |
|---|---|---|
| push | `games/party/server.js` | outcome: finishMatch; round wins / knife points; Western reaction breaks equal round wins |
| shrink | `games/party/server.js` | outcome: finishMatch; round wins / knife points; Western reaction breaks equal round wins |
| knives | `games/party/server.js` | outcome: finishMatch; round wins / knife points; Western reaction breaks equal round wins |
| bomb | `games/party/server.js` | outcome: finishMatch; round wins / knife points; Western reaction breaks equal round wins |
| western | `games/party/server.js` | outcome: finishMatch; round wins / knife points; Western reaction breaks equal round wins |
| tanks | `games/tanks/server.js` | outcome: survival round winner; CTF team flags; coop personal contribution |
| tankarena | `games/tankarena/server.js` | score: highest combat points |
| chaos | `games/chaos/server.js` | score: shared completion score; everyone won |
| kart | `games/kart/server.js` | score: race order already converted to descending place points |
| monster | `games/monster/server.js` | score: drawing participation score with collective won |
| spy | `games/spy/server.js` | outcome: winning role faction score1 vs0 |
| millionaire | `games/millionaire/server.js` | outcome: money level then correct-answer winner tiebreaker |
| sinyakquiz | `games/quiz/engine.js` | score: personal quiz points; explicit teams use shared teamScore |
| warsaw | `games/quiz/engine.js` | score: personal quiz points; explicit teams use shared teamScore |
| crocodile | `games/crocodile/engine.js` | score: personal / team points; two people share coop score |
| jenga | `games/jenga/server.js` | outcome: non-collapsing winners; successful moves plus winner bonus |
| crane | `games/crane/server.js` | score: personal construction contribution; shared win for height>=8 |
| naval | `games/naval/engine.js` | outcome: remaining health decides winner before individual shot score |
| drawguess | `games/drawguess/engine.js` | score: guessing and drawing points |
| western_duel | `games/western_duel/server.js` | score: duel wins; reaction time remains a separate metric |
| taprace | `games/arcade/server.js` | score: distance / sum punches / survival distance / final mass / round wins |
| punchmeter | `games/arcade/server.js` | score: distance / sum punches / survival distance / final mass / round wins |
| flappy | `games/arcade/server.js` | score: distance / sum punches / survival distance / final mass / round wins |
| hungry | `games/arcade/server.js` | score: distance / sum punches / survival distance / final mass / round wins |
| snakelines | `games/arcade/server.js` | score: distance / sum punches / survival distance / final mass / round wins |
| carryball | `games/arcade/server.js` | teams: team goals assigned to player.score at finish; explicit teamScore |
| marble_bloom | `games/arcade_deluxe/core/common.cjs` | outcome: coop personal contributions; versus cleared/last-survivor winner before points |
| pocket_siege | `games/arcade_deluxe/core/tanks.cjs` | score: individual damage points including negatives; explicit teams use summed damage |
| bow_club | `games/bow_club/core/match.cjs` | score: individual arrow points; coop shared won; teams summed arrow points |
| poker | `games/tabletop/server.js` | score: final chips / opened-cell points |
| mines | `games/tabletop/server.js` | score: final chips / opened-cell points |
| airhockey | `games/tabletop/server.js` | teams: team goals converted to identical team point score |
| curling | `games/sports_siege/match.js` | teams: sum of team end scores |
| bowling | `games/sports_siege/match.js` | score: frame points / target points / personal kills with collective gate outcome |
| peek_shoot | `games/sports_siege/match.js` | score: frame points / target points / personal kills with collective gate outcome |
| swarm_gate | `games/sports_siege/match.js` | score: frame points / target points / personal kills with collective gate outcome |

## Evidence and limits

Outputs are under `.localparty-build/design-round3/ranking/`. `production-hashes.json` identifies the frozen shared implementation. `visual-review.json` records the exact manually viewed images and SHA256s.

This audit does not claim36 actual gameplay finishes or physical iPhone/TV testing. The actual browser finishes in this ranking audit are Crane, TapRace and Curling; other modes have source/contract evidence and selected earned engine unit results. No new Arcade gameplay visuals were started after the user requested finishing this round. Previous broader game-audit evidence remains separate.
