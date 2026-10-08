# In-game phone panels: unify pass (2026-10-05)

Owner: Claude panels lane. Scope: the phone controllers of all 36 games (inside the game iframe), the in-game header readout (`#hudTimer`), and shared micro-interactions. Not touched: Pause/Lobby (approved), `#waitingRules` / lobby / catalog (app lane), TV files and `public/tv-information.css` (tv lane / Codex), game rules, engine JS, per-game CSS files.

## Files

- `public/game-ui-polish-20261004.css`: new section `2026-10-05 · Panels unify` at the end of the file. Earlier rules are unchanged.
- `public/game-ui-system.js`: two new modules at the end, `HeyPalsValueTick` and `HeyPalsPanelEntrance`. Existing modules are unchanged.
- NEW `scripts/qa-panels-unify.cjs`: real launch → waiting / play (2.6s, 6.2s) / results (`QA_RESULTS=1` runs the server with `TEST_FAST=1`), plus a geometry and typography inventory of the controller frame. Inventory fields: painted-surface gutters, button heights and radii, label face, size, case and tracking.
- NEW `scripts/qa-contact-sheet.py`: PIL contact sheets.

## Inventory: inconsistencies found (before captures, 393×852 and 320×568, 36 games)

1. **Stat labels had five styles for one job.** WINS / BOMB were caps at 13px (Party family). Tank Arena had "Health / Weapon / Points" in sentence-case italic. Arcade had "Place / Points / Speed" at 12px. Kart had PLACE / LAP at 16.5px. Crane had BLOCKS / ATTEMPTS in tracked italic at 1.56px. Western had "Wins / Best / False starts" at 14px. Mines had TILE / POINTS in italic. Tanks had "Health" and "kills / deaths" in sentence case.
2. **Content gutters varied.** 26 games keep painted content 16px from the phone edge. The outliers were Chaos, Crane and Pocket Siege at 10px, Marble Bloom at 20px, and Bow Club at 20px. Mines was 22px (its primary is capped at 350px). Draw & Guess was 22px for the tools and secret but 10px for the canvas, so one screen mixed both. Charades was 24px (a 12px main plus a 12px transparent stage).
3. **Radii drifted off the family** (contract: 28 / 22 / 18 / capsule). Arcade stat groups were 16px, the Tanks status card 24px and the Pocket Siege range wells 14px. The hand-swap utility is a capsule in Swarm Gate and Peek & Shoot, but used 11px in Kart and 8px in Tanks.
4. **Header readout.** The timer's 20px lilac `text-shadow` was clipped by the value's `overflow:hidden` box, which drew a visible square tile behind the digits (Kart 9:55, Monster 1:23, Bomb 1:10 and others). The secondary line used three faces: "ROUND 1 / 7" was Fat Runner 900, "5 Laps" and "0 Floors" were Fit Runner 400, and "Turn" was a third.
5. **Eyebrows above state titles** (TURN 1/10, DRAWING 1/4, HEAD, YOUR SECRET ROLE) used three faces, sizes from 10px to 12px, and 1.3–1.7px tracking.
6. **Motion gaps.** When a controller went live, the content hard-swapped in (only a 0.65→1 opacity on `main`). A changing value (place, score, OUT/SAFE) gave no feedback except the small glyph bump. The segmented selectors (Swipe/Motion, Tank/Drone/AA) snapped.

Recorded for other lanes, not changed here:
- In the in-game header (shell, app lane), the room-count chip (green "4") draws a ~28px circle while the Rankings chip beside it draws a ~40px circle. Both are 40×44 hit boxes, but they look like mismatched sizes in every game.
- Bot names are server-generated in Russian ("Бот 1") even in an English session.
- Text-state header values (CHECK ROLE, WAVE 1/6, ROUND 1/10) are shrunk by `value-fit.js` to about 11px, while numerals are 23–25px. A dedicated text-state style for that slot would read better; the value-fit logic belongs to the shell.

## What changed

- **Stat label role.** One role everywhere: upright Kardia Fit 600, 12px, caps, .04em tracking, label ink `#cdc3de`. Inline glyph+label rows (`.hp-stat-label`) stay on one line. At 320px, ATTEMPTS used to wrap and push its glyph above the word. Stacked card labels (Western, Tank Arena) keep their wrapping. Value colours (SAFE, OUT, lime) are untouched.
- **Eyebrow role.** Upright Kardia Fit 700, 12px, caps, .1em. Authored colours are kept.
- **Radius family.** Arcade groups 16→18, Tanks status card 24→22, Pocket range wells 14→18. The Kart and Tanks hand swap are now capsules.
- **Gutter 16px.** Chaos, Crane, Pocket Siege, Marble Bloom, Bow Club and Draw & Guess now use main padding-inline 16. In Draw & Guess the secret and tools are flush with the canvas. In Charades the main is 12 and the transparent stage 4. The Mines primary is full width. No other layout is changed: no reordering, and no size changes beyond the gutter.
- **Header readout.** The timer has a tight ink shadow (no clipped glow tile). The secondary line uses one face and weight. Its case comes from the game, so "10 Arrows" never ellipsizes.
- **Value tick** (`HeyPalsValueTick`). One 380ms spring on a real change: scale 1→1.16→0.97→1 with the strong ease-out curve, using the independent `scale` property so authored transforms are untouched. It takes a baseline on first sight. It skips values that change more than 3× in 2s (speed, timers), inline elements, values wider than 160px, hidden documents and reduced motion.
- **Panel entrance** (`HeyPalsPanelEntrance`). When the frame's phase goes from waiting or results to countdown or playing, the controller's top-level panels rise 10px and fade in. Each takes 340ms, staggered 45ms apart, with at most 8 blocks. It uses WAAPI `translate` and `opacity` with `fill:backwards` only, so input is never blocked. It does not replay on pause→resume, reveal→playing or in-round re-renders. Under reduced motion there is a 160ms fade only.
- **Selector easing.** Segmented controls ease their fill and colour (180ms) and their transform (150ms). Pressing stays instant, because the rule is `:not(:active)`, which keeps the existing asymmetric press.

## Evidence

All under `.localparty-build/panels-unify-2026-10-05/`:
- `before/` and `after/`: per-game `*-waiting-*`, `*-play1-*`, `*-play2-*` at 393×852 and 320×568, `*-results-393x852`, and `inventory-*.json`.
- `before-metrics/inventory-393x852.json`: painted-gutter baseline.
- `ab/report-320x568.json`: same-state polish-off/on geometry diff for all 36 games. Every geometry delta is listed in the per-game JSON. There are 0 overflow changes.
- Contact sheets: `sheet-*` and `ba-*` (before/after pairs), `sheet-entrance-filmstrip.png` (paused WAAPI frames at 0/60/140/220/400ms), and `sheet-value-tick.png`.

## Verification

- Images viewed by the agent: the before and after play2 contact sheets at 393 and 320 for all 36 games (`after/sheet-play2-*-a|b.png`), plus `ba-stats-393.png`, `ba-gutters-393.png`, `ba-gutters-320.png`, `ba-results-393.png`, the entrance filmstrip and the value tick. Per-game observations:
  - The stat labels now read as one family in Bomb, Push, Shrink, Knives, Western, Tanks, Tank Arena, Kart, Crane, Mines, Tap Race, Punch, Flappy, Hungry, Snake Lines and Carry Ball.
  - Punch ATTEMPTS stays on one line at 320.
  - Chaos, Crane, Pocket Siege, Draw & Guess, Charades, Bow Club, Marble Bloom and Mines now sit on the 16px gutter, and nothing new is clipped at 320.
  - The results screens are unchanged by design.
- The A/B geometry diff at 320 for all 36 games (`ab/report-320x568.json`) shows deltas only on the labels, gutters and Mines width listed above, with 0 overflow changes. The first run found Punch ATTEMPTS wrapping and the Charades override losing to an ID-weighted `:has()` rule. Both are fixed, and the fixes were re-probed.
- Interaction checks:
  - `HeyPalsValueTick` adds `hp-value-tick` on a real value change and leaves an unchanged value alone.
  - `HeyPalsPanelEntrance` fires on the frame's waiting→countdown/playing transition. It was observed in Bomb, Tap Race and Crane through `document.getAnimations()`.
- `npm test`: **713/713 pass** in a quiet run. An earlier run, made while three capture sweeps were also loading the machine, had 20 server/integration timeouts, all in networking and stress tests. They passed in the quiet rerun.
- Browser tests, run with this pass on and then with it removed for a ~3 min window. The original files were restored by byte comparison, and nobody else touched them during the window.
  - `waiting-layout` PASS.
  - `result-celebration.browser` PASS.
  - `input-release-browser` PASS on rerun (11/11). Its tanks reconnect step is flaky, and it failed once in the baseline without this pass as well.
  - `tv-game-layout` ("Chaos uses available stage area") and `tv-notch-layout` (notch left bound) fail **identically on the baseline**. They are TV-side and pre-existing; this pass does not touch TV selectors.
  - `result-celebration-browser.cjs` hardcodes a Windows Playwright path (`C:/Users/nirrt/...`), so it cannot run on this Mac. This is pre-existing.
- Capture note: in the loaded after-sweep, the Punch Meter primary label was captured once at 14px (the readability floor) instead of 24px. Focused rechecks (`recheck/`, and probes at 4s and 6.3s) show 24px in both states. This is a load-timing artefact of the font/readability pass, not this CSS; it is recorded here so nobody reads that frame as a regression.

## Unverified

- Physical iPhone / native WKWebView feel of the entrance and the value tick. The captures are from headless WebKit only.
- Turn-based "my turn" states depend on bot timing. Only the turns that occurred during the sweep were seen.
- Results states for games that do not finish under `TEST_FAST` within 40s (several engines ignore it) were captured mid-play. They are labelled with their phase in `after/inventory-results-393x852.json`.
