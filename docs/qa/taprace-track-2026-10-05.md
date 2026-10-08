# Tap Race track — 2026-10-05

Scope: `games/arcade/public/app.js`, only `paintTapArena`. Impeccable layout/craft-floor and Emil cohesion guidance applied on the actual existing TV view. No gameplay, runner scale/position, trails, camera, shared HUD, scorecards, controller, other mode, build or gallery edit.

## Before / after

| Issue | Before | After |
| --- | --- | --- |
| Track material | Narrow scenery slice stretched vertically into a noisy violet surface | Quiet teal rubber lanes, each with a restrained vertical material gradient |
| Side edges | Dark rectangular strips and safety lines end at different coordinates | One complete rounded running-deck contour with a soft offset shadow |
| Start | Runners stand beside a thin unlabelled stripe | Recessed bays with player-colour rims, retaining the actual x=185 start |
| Finish | Checker strip sits beyond the actual completed runner position | Checker centre at x=1085 = the unchanged progress=2000 position, with a short run-off apron |

## Fresh originals, individually viewed

Both sizes used the existing `output/playwright/polish123-hud/capture.cjs`, `AUDIT_GAMES=taprace`, `QA_GAME_ONLY=1`, actual normal-clock launch/readiness, two loaded browser humans and two built-in bots. Fonts and runner assets loaded. Each before/after original was opened individually. These captures prove the four-player initial/running composition, not physical TV/AirPlay, end-of-race/results, or the maximum player count.

- [Before 720](../../output/playwright/taprace-field-2026-10-05/before-720/taprace-tv-playing.png)
- [Before 1080](../../output/playwright/taprace-field-2026-10-05/before-1080/taprace-tv-playing.png)
- [After 720](../../output/playwright/taprace-field-2026-10-05/after-720/taprace-tv-playing.png)
- [After 1080](../../output/playwright/taprace-field-2026-10-05/after-1080/taprace-tv-playing.png)

On both final originals, the outer track has complete rounded corners; the start bays and finish/run-off are inside the same contour. Standing and moving runners remain readable. No captured field/header/name/scorecard clipping or overlap. Existing motion-trail rectangles are unchanged.

## Verification and qualifications

`node --check games/arcade/public/app.js` passes. No new tests for this reversible background-only canvas change. Restoring the exact saved pre-edit function in memory reproduces the full initial file hash, proving all source outside `paintTapArena` is unchanged.

Capture errors and HTTP response errors are empty on both final runs. Final720 reports drift only in unrelated `games/drawguess/public/screen.css`; the Tap Race renderer is stable at both capture boundaries. Final1080 has no source drift. Both final manifests retain WebSocket errors after the gameplay screenshot, during the harness's explicit game-stop/teardown. These logs are preserved and are not labelled a clean-console run. Before720 also had an initialization WebSocket console error.

Browser/server capture processes closed. Exact times, manifests, SHA256s and source stability are in [source packet](taprace-track-2026-10-05-source.json).

Product freeze SHA256: `4f1f8a0fa237152f1c3749ce7e298867d297de41c7ff9ef45fc84ddbb7cae743`.
