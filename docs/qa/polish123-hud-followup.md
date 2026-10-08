# Polish123 — final half-transparent numeric wells and Punch hitter

The latest user request supersedes the opaque tile revision. Only each numeric backing color has alpha0.5; the fill remains flat and text opacity stays1. Existing notch shape, tile size, labels and fonts remain unchanged. Shared headers serve31catalog games; Bow Club plus four native Sports Siege modes use the scoped native rule.

Punch Meter's actor has one Punch-only class in `public/tv.js`. It sits outside the notch grid, right aligned12logical pixels below the dock, at most240logical pixels wide. System/body font16px matches player/toast copy. The bubble avoids the centered bag/rope and the lower impact score. Other games keep their existing actor placement.

| Before | After | Why |
|---|---|---|
| Opaque darker numeric wells | Same flat fill with background alpha0.5 | User requested softer backing while keeping digits readable |
| Punch actor in a third notch row | Separate compact anchored bubble below-right | Name no longer crowds the title or central rope |

## Focused checks

-16/16 TV metadata tests pass (including the confirmed untimed Tanks correction); `node --check public/tv.js` and `git diff --check` pass. One detector pass returns zero findings.
- `output/playwright/polish123-hud/alpha-matrix.json` covers all36catalog backing roles in a small computed-CSS fixture: background alpha0.5, background-image:none, element opacity1. This fixture is not actual gameplay evidence.
- Three real managed matches, Millionaire/Mines/AirHockey, captured in `output/playwright/polish123-hud/half-alpha720/`: originals individually opened, matching alpha0.5/opacity1/no gradient; no page errors. All three owned source hashes stable.

## Final real36TV delivery

`output/playwright/polish123-hud/half-alpha-final720/index.html` contains exactly36 original1280×720 PNGs, using the existing `<id>-tv-playing.png` filenames. No opaque-revision frame is included. The normal managed34-game pass finished successfully with no page or HTTP failures. Its console log retains85 socket-close messages across teardown; this is not a claim of a console-clean runtime. A Tanks-only correction replaced its original; final Punch and Swarm originals came from the independent art lane.

The final manifest has per-frame PNG SHA256, referenced raw manifests, applicable source hashes and a declared per-lane freeze. It does not claim an atomic whole-tree freeze. The root-approved round-plinth2pSwarm frame precedes only the final top-HUD rectangle popup-avoidance change; the final dense16 proof confirms that successor. See `docs/qa/polish123-gate-punch/user-correction-proof.json`.

34 actual game captures provide34 visible backed readout style records: all report alpha0.5, background-image:none, element opacity1. Native Swarm computed span styles were not included in its art capture; its current native CSS role passed the36-role computed fixture and final original-image review. Punch has no backed numeric primary in this phase. Native Bow/Curling/Bowling/Peek actual readouts are in the34-pass records.

Punch's final720 idle actor bounds are recorded in its `punchHUD` metadata, with12px clearance below the dock;1080 uses18px. Independently captured1080 idle/real-impact originals were opened in the art lane. This lane also viewed the final720 idle and1080 impact, confirming no central rope/bag/score overlap.

The independent review is `half-alpha-final720/independent-visual-review.json`; the reviewer opened all36 final originals, including replacement Tanks and merged Punch/Swarm, matched current PNG hashes with zero drift and reported no visual blocker. Sampled staticTV720 scope only.

## Separate confirmed Tanks metadata correction

The survival game deliberately sets `timer:0`, while CTF uses240 and coop180. Normalization had converted that explicit untimed state to a running0:00 clock. `public/tv-information.js` now omits the timer only for `status:playing, mode:survival, timer:0`; a stale launcher deadline is also suppressed by this public-state fact. Positive survival clocks, both timed modes (including valid expired zero) and other games retain their timers. A focused metadata case covers those distinctions.

`output/playwright/polish123-hud/tanks-untimed-final720/manifest.json` records the single real recapture, no page/HTTP errors and stable source hashes. The corrected original shows Game phase with round1/10, instead of a false0:00 clock. Only this game was recaptured after that metadata change; the other33 are explicitly unaffected by its branch.

## Consumer source matrix

Shared launcher capsules use `public/tv-information.css` and `public/tv.js`. Native metric tiles use the host-only rules in `public/game-ui-polish-20261004.css`; existing body palette is retained. Field renderer type does not require canvas numeric exceptions. Exact captured-role records and composition are in the final manifest.

| Composition | Games | Backing owner |
|---|---|---|
| centered-scoreboard | tanks, western, marble_bloom, pocket_siege, taprace, punchmeter, flappy, hungry, snakelines, carryball, chaos, poker, airhockey | Shared launcher numeric capsule |
| rail-cap | push, shrink, knives, bomb, tankarena, kart, western_duel, jenga, crane, naval, mines | Shared launcher numeric capsule |
| content-cap | monster, spy, crocodile, drawguess, sinyakquiz, warsaw, millionaire | Shared launcher numeric capsule |
| game-owned | bow_club, curling, bowling, swarm_gate, peek_shoot | Bow fact and four native sports metric roles |

## Final sources


- `public/tv-information.css`: `98b4311edf8f0ebcfe041494736196a7f3c25bac4f0c9f25537b3e5153dc4ee5`
- `public/game-ui-polish-20261004.css`: `1a3a95a7d417445960858b938cdeeb21099e092a832d77bdd8258a0de5ce485e`
- `public/tv-information.js`: `8ccbd2854649dd977be595b020fe7835d2ef65be872f2e89a3f83bba2143a3c5`
- `public/tv.js`: `e06782e2a9dc6060f99bccb9d823b914b06e4cc3960b2503ec7fb2f717944062`
- `tests/tv-information.test.cjs`: `5e4ed98572eae0d377774761dbc000946e52a6d47f989d563a2e74ce7adf8f0c`

All capture browsers/server processes are closed. No build/install/commit by this lane. Physical gameplay and mobile UI are outside the capture scope.
