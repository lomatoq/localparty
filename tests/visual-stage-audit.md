# Independent visual UI audit — 2026-09-12

## Root integration follow-up
- Naval fleet sizing now uses the smaller available card dimension; actual two-fleet result geometry and sixteen-fleet broadcast checked again (`naval-final-geometry.cjs`, `naval-broadcast-check.cjs`). No field extends outside its card. Controls use 16px gaps and a content-height console.
- Drawguess final progress is clamped to the number of turns (2/2, not 3/2).
- Chaos/Crane outer lobby panels have 28px corners.
- Six new arcade modes validated separately in `ARCADE-VALIDATION.md`; mobile geometry now covers 26 games.
- Full existing test suite: 68/68 passed, followed by party/tanks/shrink/spy/millionaire integration passes. The obsolete Crane test expected 54px slabs; it now checks the actual 110px square block dimensions and real contacts. Lobby identity test includes the explicit testBot flag.
- Bot count controls tested with 3 real companion controllers, launch/pause/exit and decrement to zero. No test matches persisted.

## Coverage
All 20 existing games: desktop lobbies at 1920×1080 and 3430×1300, phones at 402×760/874; readiness/start/pause/rules/resume/exit passed. All 20 host lobby and phone gameplay screenshots visually inspected. Loading sampled on every animation frame on host and phone: 20/20, zero visible frames without managed class, game-polish stylesheet, or loaded fonts. Early/ready screenshots and audit-loading-flash.json retained.

Final states reached and visually inspected on host + phone for all 15 distinct game families: push (shared with shrink/knives/bomb/western), tankarena, tanks, chaos, kart, monster, spy, millionaire, warsaw (shared quiz with sinyakquiz), crocodile, jenga, crane, naval, drawguess, western_duel. Tests use actual server/host transitions. Long timers use isolated test-only game clock acceleration; Chaos uses its existing debug startRound/completeRound callbacks with countdown respected. This is UI lifecycle coverage, not exhaustive gameplay mechanics or every player-count combination.

## Fixed findings
- Kart canvas bottom clipping: old #gameCanvas top:15.094% survived stage changes; top:0 corrected it. Whole track/cars now visible in final and lobby.
- Quiz/Crocodile/Drawguess sidebar overflow: compact settings plus flexible standings corrected bottom clipping.
- Root decorative artwork over buttons/arena: moved below iframe UI.
- Large active title covering fields: phase-aware compact title/reserve implemented by spacing agent.
- Monster reveal title collision: fresh audit-results-host-monster.png confirms separate title and reveal card.
- Crane mobile control labels: fit inside buttons after root fix.
- Chaos #lobbyStage.lp-start-card and Crane .host-shell>aside.lp-start-card had gradient but radius:0; root added radius28.
- Naval start arrow alone on second line: now one line in fresh final screenshot.
- Chaos phone retained final boss instructions/controls after results: this audit updated server to send/persist result message, controller releases input and presents level/score summary; new assignment restores controls.
- Jenga phone retained block picker/joystick after finished: this audit hides #controls and replaces stale turn notice with replay explanation.

## Findings requiring final root disposition
1. **Naval broadcast grid overlap** — latest audit-results-host-naval.png: .miniOcean inside two .oceanCard wrappers exceeds card width, first grid overlaps second and right grid clips. Likely square field sizing constrained by height rather than available width. Root notified with screenshot.
2. Drawguess final progress is 3 / 2 after two drawings (host and phone screenshots). Clamp server progress to total. Root notified.
3. Phone results in several games retain host-only replay flow. Geometry fits; improving mobile replay is separate behavior scope. No claim that phone can start another round everywhere.

## Final-state observations
- Push: seven natural TEST_FAST rounds; win card/actions fit.
- Tankarena: actual timer finish; board/replay fit.
- Tanks: coop timer finish with accelerated game clock; large three-line result fits, controls on phone still have contextual outcome text.
- Jenga: actual time finish; tower/result/replay fit; phone controls now hidden.
- Kart: actual race timeout; centered winner label, whole track, replay/standings fit.
- Chaos: all 15 level completion transitions; host awards/result fit, phone result controls fixed.
- Spy: actual duel timeout; host/phone victory text fits.
- Crocodile: six host end/next turns; podium and settings fit.
- Drawguess: two host end + automatic next drawing transitions; podium fits, progress bug above.
- Western Duel: three actual timed duels; arena/result/sidebar fit.
- Warsaw: five host reveal/next questions; podium/settings fit.
- Millionaire: three timed questions; final ranking fits.
- Monster: two real drawn strokes and confirmed submissions; reveal fits after spacing fix.
- Crane: three actual misplaced drops; result/replay fit.
- Naval: actual host finish; remaining grid sizing issue above.

Artifacts: tests/audit-results-{host,phone}-{id}.png; tests/audit-flash-{early,ready}-{id}.png; tests/layout-host-{id}.png; tests/ux-phone-game-{id}.png. Reusable scripts: audit-results.cjs, audit-results-more.cjs, audit-results-final-eight.cjs, audit-loading-flash.cjs, audit-controller-finals-recheck.cjs. All servers isolated and ephemeral; live 59435 untouched.
