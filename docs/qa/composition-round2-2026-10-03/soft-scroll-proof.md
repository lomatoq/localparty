# Shared dynamic scroll-edge correction

Status: frozen. Only `public/game-ui-system.js` and `public/game-ui-system.css` changed. The renderer passed9 meaningful checks, with no page errors and equal sourceStart/sourceEnd. All11 final originals were opened individually. Browser and temporary server closed.

| Before | After | Why |
|---|---|---|
| Many rankings/votes/feed/arsenal lists unregistered | Actual content selectors registered | Consistent soft continuation edges |
| Stale edge datasets after shrink or reveal | Resize/content/layout/image/font changes update and unbounded cleanup clears both edges | First and last items stay fully visible |
| Whole dialog mask could fade heading/actions/backing | Actual content children fade; pinned heading/footer/direct action controls remain crisp | No whole-panel masking or layout rewrite |
| Pocket local permanent/important mask overrode shared edges | Scoped shared dynamic mask wins | First top and last bottom fades disappear correctly |

## Renderer proof

- List first row: topfalse/bottomtrue; middle: bothtrue; last: toptrue/bottomfalse.
- Shortened content removes class and resets both edges. New content is registered. Fresh track stays unmasked.
- Popup first/middle/end: contentfade only; header/actions/backing unmasked.
- Legacy weapon mask override verified.
- Actual native host DOM at402 top/middle/end and320 end viewed; ordinary bottom text fades at continuation, final contents fully readable. Native data is explicitly simulated.

Report: `output/playwright/composition-round2-2026-10-03/soft-scroll-confirm/report.json`. Reproducible bounded harness: `output/playwright/composition-round2-2026-10-03/soft-scroll-confirm/check.cjs`.

## Source freeze

- `public/game-ui-system.js` SHA-256 `41a19f3e4bfaf13d35cd67f6ecbfaa43f43a0496835d796029656d800c7d9eba`.
- `public/game-ui-system.css` SHA-256 `0267b72a28c42aa3d9a948741ffd0f028cbdb12957dd8e15f1f7a5e6632f951a`.

## Audited registration coverage (all36, source only)

| Game | Covered local list/content selectors |
|---|---|
| push | `.party-standings-board, .player-list, .hp-result-scroll, .hp-result-list` |
| shrink | `.party-standings-board, .player-list, .hp-result-scroll, .hp-result-list` |
| knives | `.party-standings-board, .player-list, .hp-result-scroll, .hp-result-list` |
| bomb | `.party-standings-board, .player-list, .hp-result-scroll, .hp-result-list` |
| western | `.party-standings-board, .player-list, .hp-result-scroll, .hp-result-list` |
| taprace | `.score-panel, .hp-result-scroll, .hp-result-list` |
| punchmeter | `.score-panel, .hp-result-scroll, .hp-result-list` |
| flappy | `.score-panel, .hp-result-scroll, .hp-result-list` |
| hungry | `.score-panel, .hp-result-scroll, .hp-result-list` |
| snakelines | `.score-panel, .hp-result-scroll, .hp-result-list` |
| carryball | `.score-panel, .hp-result-scroll, .hp-result-list` |
| curling | `#ss-scoreboard, #ss-results, .hp-result-scroll` |
| bowling | `#ss-scoreboard, #ss-results, .hp-result-scroll` |
| swarm_gate | `#ss-scoreboard, #ss-results, .hp-result-scroll` |
| peek_shoot | `#ss-scoreboard, #ss-results, .hp-result-scroll` |
| poker | `#players, .poker-quickrules p, .hp-result-scroll` |
| airhockey | `#players, .poker-quickrules p, .hp-result-scroll` |
| mines | `#players, .poker-quickrules p, .hp-result-scroll` |
| tanks | `#board, #players, .overlay-panel, .lp-duel-sidebar` |
| tankarena | `#board, #players, .overlay-panel, .lp-duel-sidebar` |
| jenga | `#board, #players, .overlay-panel, .lp-duel-sidebar` |
| western_duel | `#board, #players, .overlay-panel, .lp-duel-sidebar` |
| sinyakquiz | `#quizRosterScroll, #board, #explanation, .screen-standings` |
| warsaw | `#quizRosterScroll, #board, #explanation, .screen-standings` |
| monster | `.player-list; dialogs/result lists (queue/canvas artwork intentionally excluded)` |
| spy | `#voteList, #playRoster, .roster-card, .sheet-card` |
| millionaire | `#scoreList, #explanation, #players` |
| chaos | `#players, #board; shared result lists` |
| kart | `.leaderboard, .side-panel` |
| crocodile | `#board, #messages, .screen-standings, .screen-sidebar` |
| drawguess | `#board, #messages, .screen-standings, .screen-sidebar` |
| crane | `#players; whole rail remains unmasked` |
| naval | `#players, #board, .broadcast-feed, .naval-console>details` |
| marble_bloom | `.arsenal-list, .drawer-panel, .score-panel` |
| pocket_siege | `.arsenal-list, .drawer-panel, .score-panel` |
| bow_club | `#board, #players; shared result lists` |

All36 also share Rules/Stats/Catalog/Room/Waiting/Pause content selectors through the injected shared stylesheet/helper. Registration is conditional on actual bounded vertical overflow. This is not a claim that every live modal in all36 was individually driven.

The JSON contains the complete selector inventory and eleven original fingerprints. Final catalog review is a separate evidence gate.
