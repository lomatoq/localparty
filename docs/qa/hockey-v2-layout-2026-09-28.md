# Hockey V2 production layout

Implemented Astra direction A from `art-direction-v2/README.md` in tabletop public `arena.css` and `app.js`.

- Removed side boxes. Last-touch names now sit in a lightweight 44px rail under the two lower corners; rail and rink have exactly the same width.
- Team slots remain fixed left/right, including when only one team has touched the puck. Rail is hidden for two players; individual names are hidden until actual contact.
- Kept canvas content at 5:3; the measured shared HUD inset controls safe top spacing.
- Player names use the shared body font (Onest), upright weight 550, with compact dark backplates. Long names truncate by measured glyph width rather than horizontally compressing text.
- No physics changes in this iteration.

## Verified

Real WebKit + ephemeral production server + real joined phone and bots, normal clock rate:

| Scenario | Results |
|---|---|
| 2 players, TV 1280×720 and 1920×1080 | Rail hidden; screenshots visually inspected |
| 4 players, TV 1280×720 and 1920×1080 | Rail shown after contact; screenshots visually inspected |
| Both scenarios, phone 320×568, 375×667, 393×852 | No horizontal overflow |
| Runtime | No page errors |
| Geometry, 720p | Content ratio 1.666703; rink/rail width 733.328px; rail bottom 563.594 in 592px iframe |
| Geometry, 1080p | Content ratio 1.666689; rink/rail width 1193.328px; rail bottom 859.594 in 888px iframe |

Screenshots: `.localparty-build/hockey-v2-{two,four}/airhockey-tv-{1280,1920}.png`, plus `airhockey-{320,375,393}.png`.

`tests/hockey-last-hitter.test.cjs` and `tests/tabletop.test.cjs` pass (3 test entries), including initial empty hit state, actual versus separating contact, independent teams, state copy isolation and reset, plus 2/4/6/8-player simulation. Syntax and scoped diff whitespace checks pass.

Reusable real-browser regression: `PARTY_PLAYWRIGHT=<playwright module> QA_HOCKEY_PLAYERS=4 node tests/hockey-layout.browser.cjs`; repeat with `QA_HOCKEY_PLAYERS=2`. This script launches its own temporary server and checks geometry, player-count gating, phone overflow and runtime errors.

## Header regression added after typography review

`tests/hockey-layout.browser.cjs` now checks production TV header at 1280/1920: uppercase italic secondary phase, larger game title, loaded Anybody/Onest/Oxanium font faces, 64 CSS px wing height, at least 8 CSS px top/bottom space, group centering within 1 CSS px and no text overflow beyond 1px fractional WebKit rounding. It writes `header-report.json` alongside screenshots. TV zoom is measured and accounted for, rather than confusing 96 physical pixels at 1920 with the 64 CSS px layout contract.

Independent narrow-controller follow-up found and fixed Mines primary action clipping: scoped portrait height≤500px rule reduces gaps, coordinate to40px and buttons to52px. Real WebKit320×568: primary action bottom345.688px inside414px iframe, target52px, no horizontal overflow. Screenshot `.localparty-build/font-size-audit-final/mines-320.png`.
