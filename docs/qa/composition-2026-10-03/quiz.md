# Quiz family composition — 2026-10-03

Status: implemented; bounded browser inspection completed on the previous shared cap. Latest user rejection supersedes that cap: the new integrated task header, local anchor reservation and final 720p earned-score roster correction await coordinator capture. Physical-device validation is not claimed.

Scope: presentation in `games/quiz/public` (Sinyak: Party Quiz, Warsaw Discoveries) and `games/millionaire/public`. Preserve engine, question banks, scoring, private state, player input, existing logos, Kardia roles, ranking ties, English first, and approved fading footer.

## Observed baseline

Opened actual `output/playwright/ui-rework-2026-10-02/final-catalog-1734` captures: all three `tv-gameplay.png` and `phone-live-402.png` images. The TV question/answers and roster are pinned near the top, leaving approximately 400 px of unused lower space at 1080p. Detached upper-right metrics compete with the central cap. Warsaw phone has a large red stage backing that encloses the complete task without meaningful material or hierarchy.

## Proposed bounds and reading path

| Game | TV structure | Phone structure | Quiet visible material |
| --- | --- | --- | --- |
| Sinyak: Party Quiz | Content-sized roster (about 26%) and question/2×2 answers (about 74%) form one centered group. Question leads; response count supports; roster is secondary. | Personal points, question, status, all four answers form one flow in the real iframe height. | Dark satin studio answer tiles with a narrow light-catching rim; no outer question panel. |
| Warsaw Discoveries | Same semantic family and centered composition. Long English question is balanced across its real width, with four complete answers. | Remove the arbitrary red enclosing backing; question and four answer tiles sit directly over the continuous shared wall. | Desaturated violet mineral/plaster tiles, with a quiet amber map-line engraving at the edge. |
| Millionaire | Money ladder and centered question/2×2 answers form one group; actor and countdown remain in shared cap. Ladder progresses within a bounded roster region. | Money/turn context, category, question, timer bar and all four answers remain one task flow. | Smoked violet console tiles with restrained brass inset highlights and authored progress rails. |

Shared HUD proposal from `shared_hud`: add `data-tv-hud-anchor` to the question/task column and `data-tv-hud-cluster` to the complete roster/task group. The parent measures those boxes and positions a single opaque curved content cap immediately above the task. Publish `--party-hud-left`, `--party-hud-width`, `--party-hud-bottom`; retain old measured safe inset variables for other families. Reserve authored cap space in the composition without a measurement/padding feedback loop.

At 1280×720 reduce row heights and gaps while keeping answer targets at least 64 px on TV and 44 px on phones. At 1920×1080 do not top-pin the group or stretch a ranking panel into a vacant tower. At 402×874 and 320×568 reserve the actual shared header/footer and accommodate long question/options without clipped copy or hidden answer D.

## Verification plan

After approval and implementation, request one of the root's three available browser-QA slots. Capture actual active questions for all three games at TV 1280/1920 and phone 402/320, with long English question/options and reveal wherever changed. Open every accepting PNG. Record question/answer bounds, materials visibly painted, complete answer access, shared cap grouping, and each screenshot's composition observation. Browser evidence does not establish physical-device acceptance.


## Implementation and verification result

The root approved the content-cap protocol and materials. Production edits are limited to quiz `screen.css`/`screen.js` and Millionaire `host.html`/`tv-layout.css`/`mq-polish.css`; no engine, scoring, private state, input, question bank, font asset, or logo change was made in this lane. Existing dirty files were preserved. Both TV families mark the total group and task anchor, reserve `calc(var(--party-hud-height,104px) + 16px)`, center the whole composition, and compress rows at 720p. Satin studio tiles, mineral tiles with amber etching, and smoked console tiles with brass inset lines visibly paint actual answers. Sinyak and Warsaw questions stay directly on the wall on phones.

Focused checks: 12/12 quiz and pacing tests passed; quiz and capture-script syntax checks passed. Impeccable found an existing 5px answer edge (already overridden to 1px in managed gameplay) and existing Millionaire progress-width motion; neither is a new material rule.

Two bounded real-browser passes used the actual launcher, WebKit, normal engine clock, built-in test bots and actual phone answer taps. English was forced; no question, result or score was injected. Capture roots: `output/playwright/composition-2026-10-03/quiz-first` and `quiz-confirm`; each contains `report.json` with source hashes, exact real states and capture times. The first pass changed shared `public/bridge.js`/`public/tv.js` during execution and is diagnostic evidence. The confirmation pass recorded no source-hash drift across its tracked file set; this is evidence for that interval, not a global freeze of other owners' work.

All 36 first-pass PNGs and all 48 confirmation PNGs were opened individually. The first pass found shared QUESTION/1/10 truncation, awkward 720p long-name wrapping, and Sinyak's remaining purple enclosing phone panel. One correction batch removed that panel and improved compact roster widths; the shared HUD owner separately fixed the complete QUESTION/1/10 readout. The confirmation images visibly contain the full readout at both TV sizes.

| Active phone in confirmation | Actual question | Minimum answer height at 320×568 | Bottom of answer D in real 414px iframe | Offscreen controls |
| --- | --- | --- | --- | --- |
| Millionaire | On which day must the calendar officially smell of luxury: Igor's birthday? | 54.55px | 406px | 0 |
| Sinyak: Party Quiz | Where did the VPSH page live before Telegram became the center of the universe? | 63.75px | 406px | 0 |
| Warsaw Discoveries | What is the style of the sculptures on the Palace of Culture's facade? | 63.75px | 406px | 0 |

Acceptance limits: the Millionaire 1280 active capture catches the existing question entrance opacity, but its same question is fully settled in reveal and in the 1920 active capture. Three-second quiz reveals can advance during the multi-size capture: Warsaw's `tv-reveal-1920.png` is visibly the next real question, so it is not counted as a 1920 reveal; the following reveal capture supplies that state. Immediate `locked` screenshots in simultaneous-answer quizzes already show reveal because all eligible players answered; they are retained as transition evidence. The 720p Warsaw reveal with a four-digit earned score exposed a remaining long-name width issue. A final presentation-only fix gives the name the full top row and places stats/points below; this last fix requires coordinator 1280 reveal capture before claiming final acceptance of that roster. No further polish loop was run.

## Confirmation image observations

Every file below was opened at its original path. These are agent observations, not transferred user approval. Table entries describing the compact roster refer to its captured revision; the final correction above supersedes the quiz 720p roster only.

| Image | Observation |
| --- | --- |
| `millionaire-phone-gameplay.png` | All four answers visible above approved footer; question and answer cluster centered with distinct material and no enclosing question slab. |
| `millionaire-tv-gameplay.png` | Centered cap/task and full question/answers; 720p roster long name now wraps at the word boundary; cap ratio complete. Existing question entrance opacity is visible in this early capture. |
| `millionaire-tv-gameplay-1920.png` | Centered cap/task and full question/answers; larger typography fills the task without clipping or a vacant outer panel. |
| `millionaire-phone-gameplay-320.png` | All four answers visible above approved footer; three-line question and >=44px targets fit the actual short iframe. |
| `millionaire-phone-locked.png` | Millionaire final-answer card centered and clear of footer. |
| `millionaire-tv-locked.png` | Brass selected answer is distinct; money ladder, actor cap and all answers remain grouped. |
| `millionaire-phone-locked-320.png` | Millionaire final-answer card centered and clear of footer. |
| `millionaire-tv-locked-1920.png` | Brass selected answer is distinct; money ladder, actor cap and all answers remain grouped. |
| `millionaire-phone-reveal.png` | Centered outcome card with real money and actor result; footer clear. |
| `millionaire-tv-reveal.png` | Settled real outcome and explanation remain in the centered task; complete cap ratio. |
| `millionaire-phone-reveal-320.png` | Centered outcome card with real money and actor result; footer clear. |
| `millionaire-tv-reveal-1920.png` | Settled real outcome and explanation remain in the centered task; complete cap ratio. |
| `millionaire-phone-followup-reveal-0.png` | Centered outcome card with real money and actor result; footer clear. |
| `millionaire-tv-followup-reveal-0.png` | Settled real outcome and explanation remain in the centered task; complete cap ratio. |
| `millionaire-phone-followup-reveal-0-320.png` | Centered outcome card with real money and actor result; footer clear. |
| `millionaire-tv-followup-reveal-0-1920.png` | Settled real outcome and explanation remain in the centered task; complete cap ratio. |
| `sinyakquiz-phone-gameplay.png` | All four answers visible above approved footer; question and answer cluster centered with distinct material and no enclosing question slab. |
| `sinyakquiz-tv-gameplay.png` | Centered cap/task and full question/answers; 720p roster long name now wraps at the word boundary; cap ratio complete. |
| `sinyakquiz-tv-gameplay-1920.png` | Centered cap/task and full question/answers; larger typography fills the task without clipping or a vacant outer panel. |
| `sinyakquiz-phone-gameplay-320.png` | All four answers visible above approved footer; three-line question and >=44px targets fit the actual short iframe. |
| `sinyakquiz-phone-locked.png` | Actual answer tap immediately reached reveal; selected/correct outline remains visible, footer clear. |
| `sinyakquiz-tv-locked.png` | Real lock/reveal transition captured; cap title, timer and full ratio remain grouped. Transient score movement/effects are present; not settled-roster acceptance. |
| `sinyakquiz-phone-locked-320.png` | Actual answer tap immediately reached reveal; selected/correct outline remains visible, footer clear. |
| `sinyakquiz-tv-locked-1920.png` | Real lock/reveal transition captured; cap title, timer and full ratio remain grouped. Transient score movement/effects are present; not settled-roster acceptance. |
| `sinyakquiz-phone-reveal.png` | Question, chosen/correct answers and explanation remain readable; source link remains reachable where present. |
| `sinyakquiz-tv-reveal.png` | Settled real outcome and explanation remain in the centered task; complete cap ratio. |
| `sinyakquiz-phone-reveal-320.png` | Question, chosen/correct answers and explanation remain readable; source link remains reachable where present. |
| `sinyakquiz-tv-reveal-1920.png` | Settled real outcome and explanation remain in the centered task; complete cap ratio. |
| `sinyakquiz-phone-followup-reveal-0.png` | Question, chosen/correct answers and explanation remain readable; source link remains reachable where present. |
| `sinyakquiz-tv-followup-reveal-0.png` | Settled real outcome and explanation remain in the centered task; complete cap ratio. |
| `sinyakquiz-phone-followup-reveal-0-320.png` | Question, chosen/correct answers and explanation remain readable; source link remains reachable where present. |
| `sinyakquiz-tv-followup-reveal-0-1920.png` | Settled real outcome and explanation remain in the centered task; complete cap ratio. |
| `warsaw-phone-gameplay.png` | All four answers visible above approved footer; question and answer cluster centered with distinct material and no enclosing question slab. |
| `warsaw-tv-gameplay.png` | Centered cap/task and full question/answers; 720p roster long name now wraps at the word boundary; cap ratio complete. |
| `warsaw-tv-gameplay-1920.png` | Centered cap/task and full question/answers; larger typography fills the task without clipping or a vacant outer panel. |
| `warsaw-phone-gameplay-320.png` | All four answers visible above approved footer; three-line question and >=44px targets fit the actual short iframe. |
| `warsaw-phone-locked.png` | Actual answer tap immediately reached reveal; selected/correct outline remains visible, footer clear. |
| `warsaw-tv-locked.png` | Real lock/reveal transition captured; cap title, timer and full ratio remain grouped. Transient score movement/effects are present; not settled-roster acceptance. |
| `warsaw-phone-locked-320.png` | Actual answer tap immediately reached reveal; selected/correct outline remains visible, footer clear. |
| `warsaw-tv-locked-1920.png` | Real lock/reveal transition captured; cap title, timer and full ratio remain grouped. Transient score movement/effects are present; not settled-roster acceptance. |
| `warsaw-phone-reveal.png` | Question, chosen/correct answers and explanation remain readable; source link remains reachable where present. |
| `warsaw-tv-reveal.png` | Settled real outcome and explanation remain in the centered task; complete cap ratio. Four-digit human score narrows name cell: compact roster defect, fixed after this capture and pending coordinator verification. |
| `warsaw-phone-reveal-320.png` | Question, chosen/correct answers and explanation remain readable; source link remains reachable where present. |
| `warsaw-tv-reveal-1920.png` | Automatic advance occurred during resize: actual next question shown; exclude from reveal acceptance. Full QUESTION 2/10, answers and score remain visible. |
| `warsaw-phone-followup-reveal-0.png` | Question, chosen/correct answers and explanation remain readable; source link remains reachable where present. |
| `warsaw-tv-followup-reveal-0.png` | Settled real outcome and explanation remain in the centered task; complete cap ratio. Four-digit human score narrows name cell: compact roster defect, fixed after this capture and pending coordinator verification. |
| `warsaw-phone-followup-reveal-0-320.png` | Question, chosen/correct answers and explanation remain readable; source link remains reachable where present. |
| `warsaw-tv-followup-reveal-0-1920.png` | Settled real outcome and explanation remain in the centered task; complete cap ratio. |


## Latest explicit shared-header revision

After the confirmation pass, the user rejected the floating trapezoid inside the task. The shared HUD owner is replacing it with a compact inline rounded header at the task-column top: GAME, actual timer, question/turn progress; phase stays secondary and generic Leader/Points leave the visible header because the roster owns those. The root approved a local reservation change: cluster padding is zero, and the actual task anchor owns `padding-top:calc(var(--party-hud-height,64px) + 16px)`. The parent now attaches at the actual task anchor top, spanning the task column. This eliminates the 100px gap that occurred when a shorter question was centered beside a taller roster. Quiz header-to-question spacing is 16px; Millionaire adds its existing 8px inner padding for 24px. All cap observations above are historical evidence for the previous shared revision, not acceptance of the new header. The coordinator's next capture must verify the replacement header together with the final 720p earned-score/name layout.


## Latest whole-pane alignment revision (pending fresh evidence)

The user requested matching top and bottom bounds for each leaderboard and task pane. Both quiz banks and Millionaire now stretch their panes within one content-sized centered grid row. The leaderboard grows within that row; the full task pane remains the shared header anchor. The header reservation stays intrinsic height plus 16px, and question content starts at that reservation without measured-bottom feedback. This avoids independently centered panes while retaining the current answer geometry and factual copy.

| Before | After | Why |
| --- | --- | --- |
| Leaderboard and task selected separate heights and centered independently | Both fill the same grid row with shared top and bottom bounds | Related gameplay information forms one balanced composition |
| Task could center beneath its own top header | Task starts directly after the intrinsic header reservation | Header and question read as one continuous sequence |
| Warsaw diagonal answer etching and Millionaire short brass top line | Quiet existing mineral/violet answer material, without ornamental lines | Remove arbitrary decoration while preserving visible game identity |

Focused quiz behavior checks pass 12/12 after this presentation revision. The capture helper now measures the roster pane alongside the task anchor and waits for Millionaire's existing entrance opacity to settle. No browser was started without the coordinator's QA slot. Earlier PNGs do not verify this latest revision. Fresh 1280/1920 TV and 402/320 phone originals, including earned-score long-name reveal, remain required before acceptance.


## Final catalog outer-list paint correction

Opened `final-catalog-093806/warsaw-tv-live-1280.png` and `millionaire-tv-live-1280.png` at original resolution. Both show an unwanted outer score-list panel behind the individual participant cards. The shared theme adapter explicitly targets `.screen-standings` and `.scoreboard`; its many state exclusions gave the material rules more specificity than earlier local transparent declarations. Narrow local rules now use the real list ID (`.screen-standings:has(#quizRosterScroll)` and `#game>.scoreboard`) to make outer background, border color, outline, shadow and backdrop transparent. Individual row materials, geometry, controls, scores and copy are unchanged. Fresh rendered confirmation is pending the coordinator's slot; these existing images establish the before state only.

## Sinyak waiting diagnosis from existing evidence

The final catalog report timed out after 60 seconds at waiting 0/10. The human was connected and `gameReady:true`; all three connected test bots were `gameReady:false`. The human alone appears in `active.present`, so `checkSession()` correctly withheld automatic start on `botReady`. In test mode launcher force-start accepts one loaded controller, but `Quiz.start()` requires at least two online engine players and returned false. Launcher force-start commits `session.startRequested=true` before its host command, and the command rejection does not reset that flag; the final report shows `startRequested:true` and `startError:null`. This can block later automatic start recovery and is a runtime issue, not a presentation defect. No runtime source was edited.

The server log includes the quiz startup line but no detailed bot socket/console diagnostics. It cannot establish why the bot game controllers never joined. The failure remains recorded and must not count as successful Sinyak gameplay acceptance; a focused normal-clock retry should record bot nested URLs and loading/connection errors, or use two actual browser controllers if bots stall.


## Latest approved-baseline height and palette pass

Opened all three **current** `qualified-final-tv36-edges/*-tv-live-1280.png` originals before edits. Each task and leaderboard already shared outer pane bounds; the remaining issue was that the full roster determined the row height, leaving substantial empty task space below the answers. The local roster/ladder now uses size containment so the question, options, explanation when present, and intrinsic header reservation determine the centered row height. The existing list flexes and scrolls within that height. Card heights, answer geometry and factual copy are unchanged. This preserves the approved composition while fixing the actual height cause.

| Before | After | Why |
| --- | --- | --- |
| Full roster sets height, with empty space beneath quiz answers | Task plus intrinsic cap sets height; roster list scrolls inside equal pane bounds | Leaderboard height follows the real task block |
| Similar purple materials across both quiz banks | Sinyak rose/plum satin; Warsaw slate-blue mineral; Millionaire warm deep plum | Quiet identity varies by game with light text retained |
| Title-only identity sits on first row with an empty second row | Shared owner removes empty identity row and centers title/approved logo vertically | Fix remains shared and respects actual actor metadata |

Local surfaces and rows retain selected/correct/wrong/active feedback. Outer leaderboard owners stay transparent. No browser was launched without a slot. These edits are source-frozen and still require fresh real-state originals, including long question copy and earned-score reveal, before visual acceptance. Suggested quiet header microassets for later central generation: a studio quiz token for Sinyak, Warsaw skyline/compass seal, and a coin/laurel for Millionaire. No speculative asset placeholders were added.


## Fresh bounded TV confirmation: task-driven height and real logos

Run: `output/playwright/composition-round2-2026-10-03/quiz-height-confirm`, using `scripts/qa/quiz-tv-height-2026-10-03.cjs`. Normal clock, English, two actual browser controllers and three authenticated built-in bots. No injected question, gameplay state or score. Only TV originals were captured; no phone acceptance is inferred from this run. All eight PNGs below were individually opened at original resolution. Report has `errors:[]` and no drift in its 11 explicitly watched owned/common presentation files; this is not a global source-freeze claim.

| Original | Direct visual observation |
| --- | --- |
| `sinyakquiz-tv-gameplay-1280.png` | Two-line actual question and all four complete answers; rose/plum task material; centered contained game logo; roster uses matching pane height with visible scroll continuation. |
| `sinyakquiz-tv-gameplay-1920.png` | Same real question complete at larger type; logo vertically centered; leaderboard and task bounds align, with no large empty task tower. |
| `millionaire-tv-gameplay-1280.png` | Full two-line birthday question and four options; actual final-lock state present, ladder scroll and bottom turn metadata clear; logo and real actor visible. |
| `millionaire-tv-gameplay-1920.png` | Same full question during actual reveal after resize, correct/wrong feedback and explanation intact; matching ladder/task bounds. Not unlocked-question acceptance. |
| `warsaw-tv-gameplay-1280.png` | Complete actual POLIN question and options; slate-blue task and controls clearly differ from Sinyak; centered contained logo; matching roster height. |
| `warsaw-tv-gameplay-1920.png` | Same actual question, broad readable options, full header ratio; roster continuation is visible where it scrolls. |
| `warsaw-tv-long-question-1280.png` | Following actual Human2.0 question, four complete options; real earned four-digit scores and wrapped long human name fit their row. |
| `warsaw-tv-long-question-1920.png` | Following question uses two lines at the wide size and remains complete; earned-score roster matches full task/cap bounds. |

All measured task/roster top and bottom deltas are exactly0px. At1280 the actual task height ranges339.89–373.48px; at1920 it ranges489.23–609.25px across the captured states. List scroll heights exceed their visible height where needed, preserving authored row sizes. Sinyak started successfully with two real controllers, so the previous one-engine-player/bot-loading failure was not repeated. The initial helper fallback raced automatic startup; the helper now treats an already-started engine as the successful actual transition rather than failing that request race. No production correction was needed after this visual pass. Browser and temporary server were closed, and the QA slot was released.

This is bounded real-state composition evidence, not an exhaustive maximum-length question-bank audit or physical-TV validation. The coordinator's final whole-catalog capture remains separate.
