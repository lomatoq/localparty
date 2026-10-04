# Gameplay visual audit — design round2

Fresh actual screens cover all36 catalog entries at393×852 and320×568, plus TV1280×720. Party/arcade name corrections and Crane layouts also cover720/1080 normal/max rosters.35 actual finishes were reached; all35 show TV CelebrationFX. Chaos completed6real levels and reached7, but its final remains uncovered and walkthrough PNGs are preparation. Millionaire active four-choice answering now has fresh320/393 evidence.

The first mobile helper run used a wrong viewport context. Those phone images are rejected. `normal-mobile`, focused final captures, and `results-mobile/results-retry` use a true mobile context. Every accepted image path is in [the manifest](../../.localparty-build/design-round2/gameplay/report.json). The gallery may display the36 entries, but must retain each state description.

Results use the real engine with a12× server QA clock and allowed host actions; Monster includes a real pointer-drawn stroke and Done/Confirm, Crane includes actual Drop presses. They verify result integration and layout, not real-time physics. No fabricated finish state or scores were injected. Concurrent shared changes are recorded in the underlying source reports; the final focused captures have no observed source changes.

## Applied corrections and restrained proposals

References below are official publisher/developer sources. Their text and gallery metadata were examined; third-party screenshot pixels were not measured. Each proposal is our adaptation to the actual HeyPals screenshot, not a claim that another game uses precisely this layout.

### Readable field names without squeezing — applied

Before: small or horizontally compressed names merged over clustered players, especially at16.

Applied: keep at least14 CSS pixels, fit long names with ellipsis, place names after sprites, avoid nearby labels and use restrained leader lines only when displaced. Physics and scores are unchanged.

[Actual HeyPals screenshot](../../.localparty-build/design-round2/gameplay/party-accepted-16-720/push-tv-gameplay.png) · [Before](../../.localparty-build/design-round2/gameplay/party-before-16-720/push-tv-gameplay.png). Reference: [Moving Out 2 — lead designer on scalable UI, readable fonts and visual shapes](https://news.xbox.com/en-us/2023/06/02/moving-out-2-accessibility/). Read the lead designer’s primary article: UI scaling, alternative fonts, visual shapes as well as colour, reduced motion. Official screenshot links are supplied there; pixel-for-pixel comparison was not performed.

### A full touch field and a one-line hand capsule — applied

The translated RIGHT HAND label broke into fragments and enlarged the HUD; at320 the mini-field also inherited a landscape-only right inset of164px.

Applied: one-line110×48 hand capsule, bounded68px gradient HUD and portrait mini-field with12px matching side margins and20px clearance. Keep the existing drawing action and art.

[Actual HeyPals screenshot](../../.localparty-build/design-round2/gameplay/bow-final/bow_club-phone-gameplay-320.png) · [Before](../../.localparty-build/design-round2/gameplay/before/bow_club-phone-gameplay-320.png). Reference: [Moving Out 2 — lead designer on scalable UI, readable fonts and visual shapes](https://news.xbox.com/en-us/2023/06/02/moving-out-2-accessibility/). Read the lead designer’s primary article: UI scaling, alternative fonts, visual shapes as well as colour, reduced motion. Official screenshot links are supplied there; pixel-for-pixel comparison was not performed.

### Separate clustered arcade player identities — applied

Actual goal and moving clusters confirmed overlapping name plates in CarryBall/Hungry.

Applied14CSSpx natural ellipsis and stable name placement after sprites, avoiding labels/player bodies/ball with thin leader lines only when displaced. Four/max16 samples and a real CarryBall goal were recaptured at720/1080; physics/input/scores unchanged.

[Actual HeyPals screenshot](../../.localparty-build/design-round2/gameplay/arcade-after-1080/carryball-tv-goal.png) · [Before](../../.localparty-build/design-round2/gameplay/normal-mobile/carryball-tv-gameplay.png). Reference: [Overcooked! All You Can Eat — official Team17 gallery and accessibility overview](https://www.team17.com/games/overcooked-all-you-can-eat). Read the publisher page and its official gallery descriptions; the page documents scalable UI and colourblind options. Recommendations below are our adaptations, not copied layouts.

### Keep the current objective visible on a short phone — applied

The goal card visible at393 disappears in the320 compact controller. Actions fit, but the player loses the current task.

Applied visible16px objective title and14px instruction at320 while collapsing secondary details. Joystick160 and actions66 retain their hit areas. Level1 controller geometry was recaptured; six actual completed levels and level7 progression are recorded separately, with preparation PNGs labelled honestly.

[Actual HeyPals screenshot](../../.localparty-build/design-round2/gameplay/chaos-objective-accepted/chaos-phone-gameplay-320.png) · [Before](../../.localparty-build/design-round2/gameplay/normal-mobile/chaos-phone-gameplay-320.png). Reference: [Super Mario Party Jamboree — Nintendo official minigame overview and gallery](https://www.nintendo.com/en-gb/Games/Nintendo-Switch-games/Super-Mario-Party-Jamboree-2591147.html). Read the official game overview and named minigame media/gallery entries. Used as a party-game presentation reference, without claiming a measured rendering of its screenshots.

### Readable TV roster names in existing Marble/Pocket cards — applied

The lower player-card names are much smaller than surrounding interface text despite available horizontal space.

Applied16px Fit names with natural ellipsis in the existing Marble Bloom and Pocket Siege cards. Actual normal/max3 Marble and max6 Pocket captures at720/1080 verify bounds. Board/terrain/art and score roles retained. These precede the new dedicated Marble review.

[Actual HeyPals screenshot](../../.localparty-build/design-round2/gameplay/in-game-max-final-720/marble_bloom-tv-gameplay.png) · [Before](../../.localparty-build/design-round2/gameplay/normal-mobile/marble_bloom-tv-gameplay.png). Reference: [Moving Out 2 — lead designer on scalable UI, readable fonts and visual shapes](https://news.xbox.com/en-us/2023/06/02/moving-out-2-accessibility/). Read the lead designer’s primary article: UI scaling, alternative fonts, visual shapes as well as colour, reduced motion. Official screenshot links are supplied there; pixel-for-pixel comparison was not performed.

### A balanced four-board TV arrangement — applied

At four players the TV uses three small boards across and one below, with substantial unused panel space.

Applied four fleets2×2 and sixteen fleets4×4, equal scene/console top-bottom bounds, readable16px fleet identities and isolated bounded standings scrolling. The320 target board now keeps its entire sixth row above Pause/Lobby;36px cells remain usable.

[Actual HeyPals screenshot](../../.localparty-build/design-round2/gameplay/naval-final-720/naval-tv-gameplay.png) · [Before](../../.localparty-build/design-round2/gameplay/normal-mobile/naval-tv-gameplay.png). Reference: [Super Mario Party Jamboree — Nintendo official minigame overview and gallery](https://www.nintendo.com/en-gb/Games/Nintendo-Switch-games/Super-Mario-Party-Jamboree-2591147.html). Read the official game overview and named minigame media/gallery entries. Used as a party-game presentation reference, without claiming a measured rendering of its screenshots.

### The same short celebration after every actual finish — applied

Existing TV CelebrationFX was active in all35 reached finishes. Shared mobile results previously had no particles.

Root applied a short shared mobile celebration behind the result rows, keyed once per new result, with cleanup and reduced-motion support. Confirmed in actual Monster/Crane outcomes; the result list stays readable.

[Actual HeyPals screenshot](../../.localparty-build/design-round2/gameplay/results-retry/monster-phone-fireworks.png). Reference: [Super Mario Party Jamboree — Nintendo official minigame overview and gallery](https://www.nintendo.com/en-gb/Games/Nintendo-Switch-games/Super-Mario-Party-Jamboree-2591147.html). Read the official game overview and named minigame media/gallery entries. Used as a party-game presentation reference, without claiming a measured rendering of its screenshots.

### A grounded tower below the scene HUD — applied

The tower/table sat too high and the scene HUD crowded the playable silhouette. A first larger-table iteration still cut the base straight at the bottom and was rejected.

Applied a TV-only camera fit and a separate bounded HUD above the field. The full table/base is visible during actual selected blockb27 pull; normal/max16 and720/1080 are checked. Phone camera, real block poses and Rapier physics retained.

[Actual HeyPals screenshot](../../.localparty-build/design-round2/gameplay/jenga-pull-final-720/jenga-tv-pull-held.png) · [Before](../../.localparty-build/design-round2/gameplay/in-game-after-720/jenga-tv-gameplay.png). Reference: [Moving Out 2 — lead designer on scalable UI, readable fonts and visual shapes](https://news.xbox.com/en-us/2023/06/02/moving-out-2-accessibility/). Read the lead designer’s primary article: UI scaling, alternative fonts, visual shapes as well as colour, reduced motion. Official screenshot links are supplied there; pixel-for-pixel comparison was not performed.

### A connected swinging load and a living physical tower — applied

The original load sway decayed to0.28worldpx by20–30s, the rotated bridle and cable disagreed, and the scene/Crew panels had different bounds with rank/score spill.

Applied sustained authoritative pendulum wind, exact shared rope/bridle endpoint and inherited release momentum. Well-supported floors use compliant real Rapier seams; weak edges remain unbonded and excessive deflection breaks the structure. Two actual normal-clock runs reached18floors before a real miss. Fit names, Fat Runner actions/counts, centered Rules/Crew and equal panel bounds complete the readable hierarchy.

[Actual HeyPals screenshot](../../.localparty-build/design-round2/gameplay/crane-accepted1080/crane-tv-stack-sway.png) · [Before](../../.localparty-build/design-round2/gameplay/crane-before/crane-tv-stack-sway.png). Reference: [Tower Bloxx postmortem — original Sumea designer](https://www.gamedeveloper.com/design/postmortem-digital-chocolate-s-i-tower-bloxx-i-). Read the primary designer account: wind-driven floors, increasing sway with height, timed drops and weak near-edge landings. Adapted physical principles to our existing carriage controls/authored art; no copied assets. Rapier official joint documentation was also read.

## Coverage by game

| Game | Actual state and observation | Final |
|---|---|---|
| push | [actual gameplay](../../.localparty-build/design-round2/gameplay/final-normal-720/push-tv-gameplay.png). Readable 14px field names with ellipsis and collision-aware placement applied. Joystick, scores and footer fit both phones. | Actual result + TV FX |
| shrink | [actual gameplay](../../.localparty-build/design-round2/gameplay/final-normal-720/shrink-tv-gameplay.png). Same name correction; arena rim remains distinct. No controller clipping in the captured first round. | Actual result + TV FX |
| knives | [actual gameplay](../../.localparty-build/design-round2/gameplay/final-normal-720/knives-tv-gameplay.png). Names and remaining-knife counts are placed after sprites; normal and 16-player layouts stay separate. Throw action fits both phones. | Actual result + TV FX |
| bomb | [actual gameplay](../../.localparty-build/design-round2/gameplay/final-normal-720/bomb-tv-gameplay.png). Names avoid other labels and the holder’s bomb. Holder indication and controller remain readable. | Actual result + TV FX |
| western | [actual gameplay](../../.localparty-build/design-round2/gameplay/final-normal-720/western-tv-gameplay.png). Long field names now truncate naturally instead of being squashed. Fire action and false-start status fit both phones. | Actual result + TV FX |
| tanks | [actual gameplay](../../.localparty-build/design-round2/gameplay/final-normal-720/tanks-tv-gameplay.png). CTF controller fits both sizes. English FLAG status was fixed by root and confirmed fresh. Tiny field names remain a proposal for that separate engine. | Actual result + TV FX |
| tankarena | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/tankarena-tv-gameplay.png). Joystick, gun type and Fire fit320. Vehicle labels on TV are small at clustered starts; roster is clearer. | Actual result + TV FX |
| chaos | [level1 objective and controller; deeper walkthrough images are preparation](../../.localparty-build/design-round2/gameplay/chaos-objective-accepted/chaos-tv-gameplay.png). The320 goal card is now visible with the objective prioritized over secondary text, preserving joystick/actions. Real pointer cooperation completed6 levels and reached7. Seven walkthrough PNGs were captured during preparation and do not verify active levels2–7; final remains uncovered. | Uncovered |
| kart | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/kart-tv-gameplay.png). Throttle/steering/speed and footer fit. Vehicles and labels are tiny at the start cluster; improve identity cues conservatively. | Actual result + TV FX |
| monster | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/monster-tv-gameplay.png). Actual drawing view and palette fit. Final reached via actual canvas stroke, Done and confirm; cooperative tied podium and phone result checked. | Actual result + TV FX |
| spy | [actual questioning/answering](../../.localparty-build/design-round2/gameplay/spy-ask-answer-final/spy-tv-gameplay.png). Fresh actual2-player question turns show Ask and Answer plus Role in English after root dictionary fixes. Both393 states and Ask320 visually checked. A bot advanced during Answer320 resize; that next-turn image is not claimed as Answer320. | Actual result + TV FX |
| millionaire | [active answering, four choices](../../.localparty-build/design-round2/gameplay/millionaire-active-question/millionaire-tv-gameplay.png). Fresh actual active answering captured at320/393 with four enabled choices and real progress2/5, in addition to earlier answer reveal and final. All four active choices fit with44px minimum touch height. | Actual result + TV FX |
| sinyakquiz | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/sinyakquiz-tv-gameplay.png). Question and all four long answer choices fit320. TV question/roster hierarchy is clear. | Actual result + TV FX |
| warsaw | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/warsaw-tv-gameplay.png). Quiz question and choices fit. Two-line TV question remains legible; no layout replacement proposed. | Actual result + TV FX |
| crocodile | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/crocodile-tv-gameplay.png). Actual actor secret and Guessed/Skip fit. TV preserves hidden secret; actor name is legible. | Actual result + TV FX |
| jenga | [actual gameplay](../../.localparty-build/design-round2/gameplay/in-game-max-final-720/jenga-tv-gameplay.png). Actual pull-held blockb27 offset1.21/1.28 at720/1080 verifies selected interaction. TV camera and HUD fit the tower and complete table below the UI. Physics/pose unchanged;4/16-player bounds checked. | Actual result + TV FX |
| crane | [actual gameplay](../../.localparty-build/design-round2/gameplay/crane-accepted4-720/crane-tv-gameplay.png). Real sustained pendulum wind, connected bridle and compliant physical floor seams now verified by two normal-clock18-floor runs plus edge miss. Equal scene/Crew bounds, centered Rules/role hierarchy and all16 roster rows reachable. Pause/reload preserved. See dedicated round3 report. | Actual result + TV FX |
| naval | [actual gameplay](../../.localparty-build/design-round2/gameplay/in-game-max-final-720/naval-tv-gameplay.png). Applied four-fleet2×2 and sixteen-fleet4×4 TV views, equal console/field bottoms and bounded score-list scrolling. At320 all36 targeting cells are now fully above the footer; cells36px and compact reload/own-fleet preserve playability. | Actual result + TV FX |
| drawguess | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/drawguess-tv-gameplay.png). Drawing canvas, colours, clear and guess sidebar fit. Russian bot guess is player-generated content, not UI translation evidence. | Actual result + TV FX |
| western_duel | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/western_duel-tv-gameplay.png). Shoot remains large at320; compact layout hides the queue. TV duelist names are small; candidate for natural fitting in its engine. | Actual result + TV FX |
| taprace | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/taprace-tv-gameplay.png). Tap target and counter fit. Authored race scene and lane identity preserved; result hierarchy verified. | Actual result + TV FX |
| punchmeter | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/punchmeter-tv-gameplay.png). Hold/release and Allow Motion fit both phones. Device motion was not physically verified. | Actual result + TV FX |
| flappy | [actual gameplay](../../.localparty-build/design-round2/gameplay/final-normal-720/flappy-tv-gameplay.png). Fresh recapture after countdown shows real flying scene, pipes and scores. Earlier countdown capture is retained only as supplemental evidence. | Actual result + TV FX |
| hungry | [actual gameplay](../../.localparty-build/design-round2/gameplay/arcade-after-720/hungry-tv-gameplay.png). Applied readable natural ellipsis and stable collision-aware name/mass labels. Four/max16 moving samples at720/1080 show no label-label overlap; joystick/timer preserved. | Actual result + TV FX |
| snakelines | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/snakelines-tv-gameplay.png). Joystick and turn controls fit. Captured separated labels are readable; no immediate visual rewrite needed. | Actual result + TV FX |
| carryball | [actual gameplay](../../.localparty-build/design-round2/gameplay/arcade-after-720/carryball-tv-gameplay.png). Applied readable14CSSpx stable name labels with leader lines when displaced, avoiding labels/player bodies/ball. Real goal1:0 and moving four/max16 clusters checked at720/1080. Joystick/Pass unchanged. | Actual result + TV FX |
| marble_bloom | [actual gameplay](../../.localparty-build/design-round2/gameplay/in-game-max-final-720/marble_bloom-tv-gameplay.png). Aim/current/next ball/swap/fire fit320. Scoped TV player names grew to16px Fit in existing cards; normal/max3 before subsequent dedicated-agent refinements remain historical evidence. | Actual result + TV FX |
| pocket_siege | [actual gameplay](../../.localparty-build/design-round2/gameplay/in-game-max-final-720/pocket_siege-tv-gameplay.png). Angle/power/weapon/fire fit320. Scoped TV names grew to16px Fit in existing cards, normal/max6 checked; authored terrain and controls retained. | Actual result + TV FX |
| bow_club | [actual gameplay](../../.localparty-build/design-round2/gameplay/bow-final/bow_club-tv-gameplay.png). Real touch mode captured. Fixed broken hand-label wrapping and short-portrait half-width mini-field; field and HUD now have separate bounds. Camera/physical AR not verified. | Actual result + TV FX |
| poker | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/poker-tv-gameplay.png). Cards, Fold/Call/Raise and wager input fit320. Actual betting UI retained; no tabletop/art rewrite proposed. | Actual result + TV FX |
| airhockey | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/airhockey-tv-gameplay.png). Joystick and score fit both sizes. TV puck/strikers are distinct; names truncate naturally. | Actual result + TV FX |
| mines | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/mines-tv-gameplay.png). Coordinates, four directions and Open fit320. TV cell marks readable at capture resolution; tiny avatar labels are secondary to board state. | Actual result + TV FX |
| curling | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/curling-tv-gameplay.png). Actual throwing controller, spin/position sliders and Sweep fit320. Long player name wraps without covering the status card. | Actual result + TV FX |
| bowling | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/bowling-tv-gameplay.png). Swipe area and both sliders fit320. Authored lane/pins and lower name cards remain readable. | Actual result + TV FX |
| swarm_gate | [actual gameplay](../../.localparty-build/design-round2/gameplay/final-normal-720/swarm_gate-tv-gameplay.png). Fresh recapture shows wave1 combat, enemies and projectile feedback; preparation-only image is supplemental. Aim/Fire/Pulse fit320. | Actual result + TV FX |
| peek_shoot | [actual gameplay](../../.localparty-build/design-round2/gameplay/normal-mobile/peek_shoot-tv-gameplay.png). Aim/Fire/streak action fit320. TV instructions, characters and score cards readable; preserve existing authored art. | Actual result + TV FX |

## Validation and limits

- All35 captured outcome contact sheets were visually inspected. Older `results-mobile` images retain historical dark game-name/MATCHOVER under the previous header fade; use them for outcome/FX evidence. Fresh `results-retry` Monster/Crane images show the corrected bounded header and readable headings.
- Browser errors:0 in accepted reports. Discovered in-game layout defects received fresh scoped captures; this does not approve later game edits automatically.
- `node tests/gameplay-round2-layout.cjs`:16 actual party layouts pass name separation/readable size at4/16 players and1280/1920; Bow hand/HUD/touch-field bounds pass at320/393. [Measurements](../../.localparty-build/design-round2/gameplay/layout-validation.json).
- `node tests/party-visual-clock.cjs`: interpolation, shortest-angle path, pause, phase reset and bounded memory pass. `node --check games/party/public/host.js` passes.
- Party corrections are limited to names/count-label placement in `games/party/public/host.js`; backups are in `gameplay/baseline/`. Physics, scores, authored sprites and controls were retained.
- Bow Club supports a maximum of6 players; its focused capture requests15 bots and the catalog correctly caps the roster at6. Camera and physical AR are outside this desktop visual verification.
- Root fixed Spy Ask/Answer/Role and LocalTanks FLAG dictionary leaks. Fresh actual [Spy Answer393](../../.localparty-build/design-round2/gameplay/spy-ask-answer-final/spy-phone-answering.png), [Ask393](../../.localparty-build/design-round2/gameplay/spy-ask-answer-final/spy-phone-asking.png), [Ask320](../../.localparty-build/design-round2/gameplay/spy-ask-answer-final/spy-phone-asking-320.png) confirm current wording. The reported Answer320 screenshot transitioned to an actual asking turn, so it is named next-turn-320 and excluded from Answer320 coverage. The fresh LocalTanks PNG confirms FLAG.
- Applied round3 changes include Jenga camera/HUD, Naval fleets/console/320 target grid, Arcade clustered identities, Marble/Pocket name roles and Chaos objective visibility. Mechanics were retained in these changes. Crane now intentionally uses compliant physical seams and sustained wind; [dedicated report](crane-gameplay-round3.md), [video/metrics manifest](../../.localparty-build/design-round2/gameplay/crane-review.json) and15 actual-capture assertions document its behavior.
- Millionaire [active393](../../.localparty-build/design-round2/gameplay/millionaire-active-question/millionaire-phone-gameplay.png) and [active320](../../.localparty-build/design-round2/gameplay/millionaire-active-question/millionaire-phone-gameplay-320.png) show four real enabled choices. Chaos [progress report](../../.localparty-build/design-round2/gameplay/chaos-real-levels/report.json) records six completed levels and reached level7; preparation PNGs are not active-level verification.
- Header gradients, approved pause/lobby capsules and Kardia roles remain governed by the regression contract. Subsequent dedicated-agent changes require their own fresh acceptance.
