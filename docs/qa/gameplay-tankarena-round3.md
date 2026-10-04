# Tank Arsenal — per-game UI/gameplay audit,30September2026

Production owner: `tankarena_ui`. Local production edits are limited to `games/tankarena/public/app.js` and `style.css`; existing neighbour work was saved in `.localparty-build/design-round3/tankarena/source-before/`. No menus, matchmaking, mechanics, weapons, servers, shared styles or native build were edited by this owner.

## Defects and resulting decisions

1. The1280×720 TV rail showed three of four participants. Compact80px score rows now show all four while preserving readable identities and explicit Points values. The field and rail share their top and bottom edges. The field remains5:3, preserving circular tanks and projectile geometry.
2. Full `#board` replacement on every health packet prevented reading the end of a16-player roster. Rows are keyed by player identity and updated in place. Rank changes preserve the scroll offset, or retain the reached bottom. Native scroll anchoring is disabled for this list. Only edges with additional rows fade; no scrollbar is painted.
3. Names on the field were forced to CAPS and squeezed to fit a fixed160world-pixel slot. They now use literal upright KardiaFit at a14CSS-pixel floor. Ellipses shorten long names without distorting letters. Nearby identities use separate collision-managed label regions and quiet colour-matched leader lines.
4. Health badges could collide in dense16-player play. Each name and its health readout now occupy one collision-managed region; health stays attached to identity and inside the field. Low health remains red and the HPbar remains meaningful.
5. Points were an unexplained plain zero under the identity. The rail explicitly pairs Points with FatRunner900italic numerals. Phone Health and Points use the same heavier metric face; names stay Fit and weapon copy stays readable. Existing semantic colour and art remain intact.
6. The phone shield/buff card touched the personal HUD. It now has12px separation, with16px side insets matching the control composition.320×568and393×852 retain the joystick, Fire and approved session footer.
7. Death disabled Fire but left movement apparently available. Real respawn now dims/disables both movement and shooting, resets held movement/fire state, and shows the existing English countdown. Controls return on respawn.

## Actual verification

`scripts/capture-tankarena-round3.cjs` starts an isolated managed launcher and uses actual pointer movement, aiming and Fire. There are no injected game states, scores, weapons or outcomes. Two browser humans use long Latin/Cyrillic names;4/16-player layouts add2/14real built-in test controllers.

- `accepted/report.json`:30fresh screenshots,16geometry/state guards, no browser errors, unchanged owner/shared source hashes during capture. Actual projectile damage, kill→100points, victim respawn, pause/resume and same-player reload were verified. TV1280×720and1920×1080, phone320×568and393×852, complete16-player roster and reachedlastrow were checked.
- `visual-review.json`: separate numbered observation and imageSHA for every accepted frame. All30were manually viewed through11contact sheets, plus native720field review. Actual compact Pause320has no painted scrollbar after the root common fix.
- `final/report.json`: earlier normal90second authoritative match finished naturally, with real kill/100point outcome. This is timing/outcome evidence; its earlier active-field screenshots are superseded by `accepted`. One TVresult image was rejected because it captured a still-entering winner portrait.
- `results-settled/report.json`:4additional real results captured after entry animations, with explicit `TEST_FAST=1` two-second clock. Both tied winners, long names, rank/score hierarchy, fireworks and phone/footer boundaries were manually viewed at both TV/phone sizes. This verifies settled composition, not90second timing.
- `tests/tankarena-weapons.test.cjs`: all4existing collision/projectile/powerup checks pass. Seven weapon rules and game mechanics were preserved.

Reports and screenshots live under `.localparty-build/design-round3/tankarena/`. Earlier failed probes are retained and explained in the review ledger, including native scroll anchoring and the pre-fix shared score tracker. Haptic handling and physical-device rendering are not claimed from browser screenshots.

## Common feedback handoff

Root owns common effects. Actual Tank Arsenal kill testing exposed both a wrong score selector (`#score` did not exist) and the missing `tankarena:'score'` projection key. The correct personal score is `#combatScore`; TV values use `.arsenal-score`. Root fixed that shared source. `pulse-accepted/report.json` passed22freshscreens/8guards: actual kill→100points, class changes on `combatScore` only, no identity pulse. Every frame was manually viewed on9contact sheets and recorded separately in the ledger. Its exact shared hash scope predates root’s later visible-target/impactPlayer mapping; Tank production remained unchanged. A later targeted numeric proof covers that final mapping separately.
