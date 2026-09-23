# Air-defense allowance

Each participant receives **10 launches per match**. A new match replenishes the allowance; a turn change or reconnection does not. Only server-accepted launches consume a charge. Existing targeting, interception, invalid-action and replay guards remain unchanged.

The controller shows a compact numeric `remaining / 10` indicator, with the remaining count also on the PVO tab. No ten-circle row is used.

Regression coverage: `tests/pocket-air-defense.test.cjs` verifies all ten launches, refusal of an eleventh, no reconnection/turn refill and new-match reset; `tests/pocket-air-defense-network.cjs` repeats spending/replay/reconnection checks over real WebSockets; `tests/pocket-deck-browser.cjs` checks the numeric count and responsive controller layout in WebKit. Earlier build-23 notes describe the historical two-charge allowance, not current gameplay.
