# Integration 119: TV timer backing

Date: 2026-10-04. Source changed: `public/tv-information.css`, shared numeric timer/live-value capsule rules. `public/game-ui-system.css` and `.js` were not changed by this lane.

## Result

The numeral sizes remain 26 / 28 / 30 logical px. The timer surface now has a 48 px minimum height, 88 px minimum width in content cards, and 96 px minimum width in rail/center headers. Previously the observed backing was approximately 69×38 px in quizzes, 89×41 px in rails, and 102×37 px in center headers. Flex centering and an 8 px top / 4 px bottom inset align the Kardia numeral ink optically inside the larger surface. The clock-label gap is 4 px. Existing actor/state typography, light Air Hockey material and the transparent Jenga/Night Shift exceptions remain intact.

## Fresh evidence

Actual managed-launcher TV routes, joined browser controller and three bots; no injected game-state or timer-value fixtures. Two fresh final batches cover these nine games at both 1280×720 and 1920×1080:

`millionaire`, `sinyakquiz`, `warsaw`, `spy`, `naval`, `mines`, `tanks`, `flappy`, `airhockey`.

The 18 final originals were individually opened and visually reviewed. No timer clipping or insufficient backing was observed. Both captures retain the existing overall game composition. Spy at 720 is its assigning-roles state, confirming that a textual state does not acquire the numeric capsule. The 1080 capture confirms the live `7:59` timer after the real controller reveals and confirms its role. Flappy originals show its actual start countdown; they do not claim complete gameplay validation.

Artifacts relative to the repository root:

- `output/playwright/timer119/before/<game>-tv.png`: nine baseline originals.
- `output/playwright/timer119/after720/<game>-tv.png`: nine final 720 originals.
- `output/playwright/timer119/after1080/<game>-tv.png`: nine final 1080 originals.
- Each batch has `report-393x852.json`, containing actual timer/readout/dock boxes and font measurements. The name describes the controller viewport; the final TV images are 720 or 1080 as stated above. Final batches report no game errors, browser page errors or outer failure.
- `output/playwright/timer119/ink-centering.json`: bright-lime numeral pixel bounds from the original PNGs, sampled inside the capsule to exclude its rim. Across 13 qualifying samples, absolute vertical ink-center deviation is at most 0.50 physical px at 720 and 1.31 physical px at 1080. Coral urgent clocks and the dark Air Hockey score do not match that color predicate and were visually assessed instead.
- `output/playwright/timer119/impeccable.json`: detector output `[]`.
- `output/playwright/timer119/capture.cjs`: bounded local capture harness, with browser and ephemeral server closed on completion.

## Verification and limits

`node --test tests/tv-information.test.cjs`: 15/15 passed. `git diff --check -- public/tv-information.css`: passed. Impeccable layout/craft guidance was applied; its mechanical detector reported zero findings.

This is browser visual validation of the shared timer component across its three layout families. It is not a claim that all 36 games, all gameplay mechanics, Pause/Lobby transitions, physical iPhone Motion or an AirPlay television were retested in this lane. Build, install, broader catalog acceptance and commit/push remain the root integration lane's work.
