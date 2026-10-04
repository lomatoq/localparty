# Screen review capture method

The gallery is a review inventory, not evidence that every image looks good. Passing a screenshot script only means the requested state was rendered without the specified runtime checks failing. A person must still review composition, hierarchy, clipping, typography and animation timing.

## Why the old gallery was incomplete

- `capture-result-review.cjs` allowed 40 seconds for a match. `TEST_FAST` only affects the party, arcade and tankarena engines; most other engines keep their normal match duration.
- `capture-screen-review.cjs` used only an `end` host action. Quiz `reveal`/`next`, Naval `finish`, Spy voting and automatic multi-stage finals were not exercised.
- Gameplay was photographed about 1.1 seconds after state detection. This can capture a transition or a 3D scene still loading. The normal-speed repeat waits longer and records the phase at capture.
- Each game had only four gallery states (waiting, gameplay, pause, results). Role/private instructions, intermediate reveals, spectator and reconnection were not represented.
- Absence of horizontal overflow and JavaScript errors does not prove good visual hierarchy or a correct safe area. It cannot approve the design.

## Reproducible scripts

Set `PARTY_PLAYWRIGHT` to the installed Playwright module. No new dependencies are needed.

- `node scripts/capture-state-review.cjs`: normal-speed live TV and phone, waiting/game/pause and phone page reload with preserved local storage. Writes `captures/states-report.json`, keeps old filenames and adds numbered reconnection cards. `AUDIT_GAMES` optionally limits the run.
- `node scripts/capture-complete-review.cjs`: real games with minimum supported host settings and applicable host actions, plus a review-only server game clock accelerated 12× by default. Writes `captures/complete-report.json`, results using established filenames, and extra reveal/countdown cards. `QA_CLOCK_RATE=1` disables acceleration; `QA_GAME_TIMEOUT` controls per-game real-time wait. `AUDIT_GAMES` optionally limits the run.
- `scripts/capture-qa-clock.cjs` is a Node preload used only by the capture harness. It replaces the game clock inside QA game workers. It is not imported into the app or production runtime. It does not inject a final state or fabricated score.

Clock-accelerated captures are valid for reviewing the rendered result layout. They are **not** evidence of normal input latency, real-time animation quality, gameplay balance or physics. Minimum host settings are legal product options, recorded per game. Runtime failures and timeouts stay in the report rather than becoming fake result screenshots.

## Specific blockers

- Tanks survival has no global match timer. Stationary human input plus simple bots can remain in a round indefinitely. Capture a real CTF timed match for a reachable final; survival-specific champion layout remains a separate state to verify.
- Chaos Lab simulation is authoritative in the TV browser. Its15 stages restart on failure/timeouts. Accelerating a server clock cannot finish it, and waiting with random bots is not equivalent to completing those objectives. Its final requires actual successful gameplay or a clearly labeled renderer fixture, never an undocumented call to `finish()`.

## Coverage accounting

Count files only after the state has been observed. Keep both phone and TV states separately. Extra cards use a separate namespace, starting at 1000, and should be merged into the gallery without renumbering existing user comments. Reports record generated timestamps; old images should not be presented as new validation. Missing states need a visible reason and remain unapproved.

## Normal-speed pass finding (2026-09-27)

The normal-speed repeat rendered all 36 games in waiting/game/pause and captured 36 phone reload states with no JavaScript exceptions or per-game capture failures. Its final localization assertion failed because Bomb TV registered `Сканируйте QR первым телефоном.` as missing from the dictionary. That is a separate localization finding, not a screenshot failure and not a passed visual audit. See `captures/states-report.json` and `captures/states-missing.json`.

Monster's final uses `capture-monster-review.cjs`: two real browser phone clients draw pointer strokes and use the normal Done/Submit buttons. The final is produced by normal game completion at normal speed. No state or score injection is used.

`node scripts/sync-review-coverage.cjs` reconstructs supplementary cards from actual files and writes `coverage-report.json`. This resolves concurrent capture-manifest writes while retaining existing review card numbers. Run it after capture batches finish and before rebuilding the gallery.


The TV waiting audit later found title-only transition frames in the first pass. `capture-waiting-review.cjs` recaptured all 72 waiting images, asserting hidden startup/scene-transition layers and a visible readiness roster before taking the screenshot. Its `waiting-report.json` contains 36 successful rows.

`capture-shell-review.cjs` captured six real shared-interface overlays, cards 030–035. It uses two human browser clients because bot matches intentionally do not contribute to the company statistics.
