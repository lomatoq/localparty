# Shared UI implementation — 2026-09-27

`public/game-ui-system.css` is the shared source of typography, spacing, state colours and result-row layout. Load it **after** legacy CSS in the app shell and managed game frame. `public/game-ui-system.js` enables the `hp-ui` opt-in and classifies existing waiting, pause, statistics and podium nodes; its observer only visits newly inserted subtrees, not every game snapshot. It does not handle pointer input, network messages or scores.

The old all-descendants `font-weight:800; font-style:italic; text-transform:uppercase!important` rule is disabled only under this opt-in. Display headings and major actions use Exo 2 with real italic; explanatory copy and names use Manrope with upright lower weights. Both local variable font packages include their Google Fonts OFL licence. Approved entry/catalog geometry is not replaced.

## Component contract

- `.hp-match-results`: parent-owned result overlay with bounded header and scrollable list. Its bottom inset reserves the existing action dock. The authoritative result adapter owns visibility and semantic outcome.
- `.hp-result-header`: heading plus outcome explanation.
- `.hp-result-list`, `.hp-result-row`: all supplied players, rank/name/score columns. `.is-self` identifies the current player, `.is-winner` is supplied by game semantics; CSS does not infer winners.
- `.hp-result-rank`, `.hp-result-name`, `.hp-result-score`: fixed/flexible/content-width columns. Names preserve case and wrap naturally.
- `HeyPalsUI.renderResults(container, entries, {selfId,label})`: optional DOM builder. Uses supplied order and explicit `rank`, never calculates a tie-break. Uses textContent and marks names as non-translatable. Do not use a score-only table to replace cooperative/team outcomes.
- Existing `.screen-podium` gets `.hp-results` and bounded phone rows. This does not restore players omitted by an old game renderer; authoritative parent results must supply the full list.
- `.hp-pause`: purple/pink surface with restrained blur. `.hp-waiting`: consistent title contrast and instruction hierarchy.

## Verification performed

`scripts/check-game-ui-system.cjs` runs WebKit using actual legacy game CSS and the new layer. Four viewports (320×568,375×667,393×852,1280×720), sixteen rows, long Cyrillic/Belarusian names: no horizontal page overflow; list scrolls, stays inside overlay; names compute to Manrope, normal style, no uppercase transformation. The screenshot `design/shared-results-implemented.png` is a labelled-by-context component fixture, not evidence of a completed game. Final integration still requires real phone/TV captures and gameplay checks; this component test does not validate game state or balance.

## Actual integration follow-up

The fixture now loads every stylesheet from the real app shell as well as managed-game CSS. This catches the inherited generic `header` background/flex conflict found by the first real integration capture; the shared result header explicitly resets those unrelated legacy properties.

- `scripts/check-shared-results-integration.cjs`, `AUDIT_GAMES=taprace QA_PLAYER_COUNT=2`: real launcher/two browser participants, real taps, authoritative final64/0; TEST_FAST shortens rounds. Phone320×568/375×667 and settled TV1280×720 captures visually inspected: correct ranks1/2, full mixed-case names, visible controls, no white header strip. The TV capture now awaits finite podium Web Animations before taking the frame. Paths: `.localparty-build/shared-results-reviewed/taprace-phone-320.png`, `taprace-phone-375.png`, `taprace-tv-720.png`.
- `scripts/capture-knives-ui-review.cjs`: normal-speed launcher/two browser participants. Actual phone320×568/375×667/667×375 captures visually inspected; count above square button in portrait, separate left counter/stats in landscape, footer not overlapped. Paths: `.localparty-build/knives-current/knives-playing-{320,375,667}.png`.
- HUD with all real shell styles: measured group centre difference0px both for lone1:15 and1:15 plus2/3. No TV arena offset changed.

The subsequent16-player Tap Race run is also visually reviewed in `.localparty-build/shared-results-16-reviewed`: final61/0; phone320 list scrolls to its last participant; TV1280×720 includes all16 names. Its assertions report clippedNames0 and footer bottom703.016px within720px. This exposed and fixed the legacy `polish.css #tvPodiumMain .podium-name{max-height:42px}` and cramped footer spacing. Only the podium with a tail at≤760px receives smaller internal gaps.

## Essential controls and TV readouts

`scripts/check-controller-footer.cjs` runs real Local Tanks/Tank Arsenal at393×852. Before the compositor fix, Tank Arsenal's footer was absent from the screenshot despite correct DOM bounds780–852, opacity1, visible state and a finished fill-both transform entrance animation. The shared phone footer now uses a stable compositor layer without its entrance animation. Both actual captures in `.localparty-build/footer-inspection` visibly show Pause/In lobby; their dimensions are unchanged and no footer animations remain. This incident demonstrates why layout metrics alone do not constitute visual acceptance.

The same real harness with `AUDIT_GAMES=airhockey QA_OUTPUT=.localparty-build/hud-wings-reviewed` verified the stacked TV HUD wing: full `Time left1:57` and leader name; existing64px rail retained, both readouts22px tall, no horizontal text clipping. Gameplay canvas labels are a separate renderer and still abbreviate long names in this sample; this is not claimed fixed by the shared HUD changes.

These checks do not substitute for all36game transitions or physical-device input/audio verification.
