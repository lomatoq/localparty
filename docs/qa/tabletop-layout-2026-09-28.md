# Tabletop layout notes 393 / 403 / 413

- Poker uses the shared bridge `--party-stage-inset-top` to fit and vertically center the table below the notch. Player cards move inward onto the table rim (ellipse radii 40% / 39%). No betting, hidden-card or turn behavior changed.
- Air Hockey hides the duplicate local goals display and bottom individual score list on TV. Team-colored side labels show each team's last real puck hitter only with more than two players; empty before contact, reset for each serve. State addition `lastHitters` updates only on an approaching collision and does not change puck/mallet physics. Long in-arena names abbreviate instead of squeezing arbitrarily small.
- Mines hides the local duplicate title under the notch, uses the same safe inset, and centers the board and supporting side panels in the available stage.

Verification: all three real games captured in WebKit at 320×568 / 375×667 / 393×852 phones and 1280×720 / 1920×1080 TVs (15 files in `.localparty-build/tabletop-targeted`). No page errors, 9 phone checks without horizontal overflow. Visually reviewed all three 1280 TV captures and 1920 Poker. Additional real 2-player hockey capture at both TV sizes confirms the entire last-hitter rail stays hidden even after contacts (`.localparty-build/tabletop-two-player`); 4-player captures show actual bot contacts with matching team colors.

`node --test tests/hockey-last-hitter.test.cjs`: two tests pass for empty initial state, approaching/separating contact, independent teams, immutable public array copy and serve reset. Existing `node tests/tabletop.test.cjs` passes all Poker/Mines/Hockey checks. Syntax and diff-check clean. Not a physical TV/device validation or exhaustive every-player-count visual proof.
