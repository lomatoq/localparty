# Gameplay art integration validation

2026-09-12. Tests use isolated ephemeral servers and test participants; production room was not interrupted.

## Coverage

All 26 catalog games completed the Chromium/Edge host + 402×874 phone + bot sequence: join/readiness, start, hidden old lobby, pause, rules, resume, exit. No browser errors in the final relevant runs and no persisted test statistics.

- Canvas sprite success counters proved actual decoded atlas rendering in Tap Race, Punch Meter, Flappy, Hungry, Snake, Carry Ball, Push, Shrink, Knives, Bomb, Western, Local Tanks, Tank Arsenal, Kart, Crane and Western Duel. Primitive fallback alone does not satisfy this proof.
- Initial Knives/Bomb capture was during countdown. The delayed final rerun recorded 149 knife draws and 357 bomb draws; therefore this gap was closed.
- DOM accents initially missed active selectors in seven games. Root corrected them and the second run verified nonzero visible bounds in Warsaw, Sinyak Quiz, Millionaire, Spy, Crocodile, Monster and Drawguess. Naval, Chaos and Jenga already had visible accents. Drawings and Jenga's physical 3D renderer remain intact.
- Latest Kart cached track, Hungry white labels/identity ring, and Carry's single actual ball plus runner/feet sprites were included in final reruns. Hungry and Carry screenshots were visually inspected; Kart was visually inspected as well.

## Bugs caught and resolved during validation

1. Arcade's first snapshot could reach host before host role registration, using the phone projection without `food`; this threw and stopped rendering. Server now skips unclassified clients; renderer handles absent arrays. Final sixteen-player run had no browser errors.
2. Hungry's old dark labels were unreadable on the new sprite/field. Labels changed to white with identity ring and contrasting mass label.
3. DOM accent selectors matched only hidden lobby headings in several engines. Active selectors were added and verified.

## Short rendering cadence sample

Actual 16 joined participants, 3430×1300 headless Chromium host, three seconds after match start, sequential runs:

| Game | Samples | Median frame interval | p95 | Max |
|---|---:|---:|---:|---:|
| Hungry | 718 | 4.2 ms | 4.3 ms | 8.4 ms |
| Snake | 720 | 4.2 ms | 4.3 ms | 8.3 ms |

These are requestAnimationFrame intervals in a headless environment, not GPU render timings, physical-phone FPS or a full 90-second worst-case Snake trail benchmark. Snake's persistent trail cache was present. No claim of universal 240 FPS is made.

## Evidence files

- `game-art-ui-results.json`, `game-art-root-recheck-results.json`: ten DOM games plus corrected selectors and tank sprites.
- `game-art-arcade-results.json`: six arcade games with successful sprite counters.
- `game-art-kart-crane-results.json`, `game-art-party-results.json`, `game-art-final-recheck-results.json`: remaining canvas families and latest fixes.
- `game-art-performance.json`: final sixteen-player sample, empty errors.
- `art-host-game-*.png`, `art-phone-game-*.png`: screenshots from test flows.
- `webkit-taprace-recheck.log`: focused Safari-engine first-load controller hit-testing and pause/rules/resume/exit passed after an earlier root run timed out; no defect reproduced in the focused rerun.

## Final visual and WebKit closure

All 26 games now have fresh waiting, playing and results captures. I inspected the waiting and playing contact sheets, the six Arcade results, all nineteen other game results, and Crane's separately captured results; individual full-size captures were checked for the defects below. Coverage is per game, not inferred solely from a shared engine. Captures cover the tested desktop and phone sizes and representative states, not every possible frame or player count.

Additional defects closed and visually rechecked:

- Carry's original character art contained an extra painted ball. Runner art now leaves one actual world ball.
- Tank Arsenal's waiting player/tank/name overlapped the introduction. The latest waiting capture confirms those actors are hidden during the lobby.
- Color Knives' upper launcher labels overlapped the header badge. A balanced canvas save/restore scales the complete scene to 88%, preserving relative coordinates and collision logic; the fresh playing image shows both labels below the badge and the lower launcher above the pause area. Flow and actual knife atlas draws passed again.
- Crane's regenerated floors now show green/cyan player paint while retaining dark glass and pale cornices. The two-drop image shows stack/ground, suspended load, cable and crane alignment. Host and phone results were independently inspected after the turn-count/text correction.

All six new games passed the final WebKit run (`webkit-final-six.log`), including controller hit-testing, start, pause, rules, resume and exit, with no browser errors or saved test statistics. The harness now uses actual touch taps for phone buttons and timer-based state polling; background WebKit animation-frame polling had caused intermittent test timeouts.

Fresh results evidence: `game-art-final-six.log`, `game-art-legacy-finals.log`, `game-art-tanks-duel-finals.log`, `game-art-other-finals.log`, `game-art-last-finals.log`, `game-art-monster-final.log`, `game-art-mode-finals.log`. The initial combined legacy run timed out before Drawguess; its focused rerun and Millionaire both completed. Images: `art-waiting-host-*.png`, `art-waiting-phone-*.png`, `arcade-final-*.png`, `audit-results-host-*.png`, `audit-results-phone-*.png`, `art-crane-painted-two-drops.png`, `art-crane-results-new.png`, `art-crane-results-phone-new.png`. Contact sheets: `art-waiting-sheet-*`, `art-audit-sheet-*`, `art-final-sheet-*`, `art-legacy-result-sheet-*`, `art-mode-result-sheet-*`.

The observed defects above are closed at the tested sizes. Actual iPhone motion sensor and permission behavior still require physical hardware; browser automation does not substitute for that test. Generated art is six atlases, 48 sprites and 21 semantic masks; successful draw counters and screenshots confirm decoded assets rather than fallback-only rendering.
