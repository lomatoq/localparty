# Bowling and Motion — build 117

User scope: progressive rightward motion aim drift; make TV bowling scores substantially larger and clearly grouped using UI design guidance.

## Changes

- Native Core Motion uses xArbitraryCorrectedZVertical when available, with the existing arbitrary-frame fallback. This adds long-term yaw correction without choosing magnetic north: https://developer.apple.com/documentation/coremotion/cmattitudereferenceframe/xarbitrarycorrectedzvertical
- Quiet samples learn residual world acceleration and angular-rate bias. Bias adaptation does not recapture the original TV heading. A symmetric 0.07 rad aim neutral zone and 8 degree/second spin neutral zone reject small incidental movements. Throw power sensitivity and turn gating stay as in 116.
- Bowling-only TV scores grow from 26 to 46 px at 720p for 2/4 players. Two-player cards are compact and centered; 8-player scores use 40 px and the 16-player rail uses 36 px. Existing game palette and image handling are retained.

## Evidence

- Focused sports and free-motion tests: 23/23 passed, including twelve consecutive throws with changing grip and simulated sensor offset; deliberate aim and spin retained.
- Full suite: 678 tests passed; subsequent integration checks passed. Log: .localparty-build/build117-all-tests.log.
- Native bridge browser fixture: Bowling and Curling, report motion117/report.json passed, no errors or source drift. These are synthetic sensor traces, not real Core Motion hardware.
- Seven real bowling TV captures: 2/4/8/16 players at 720p and 4/16 at 1080p, plus a two-player score update after real throws. Report bowling-score117-final/report.json passed, no errors or source drift.
- Root and independent read-only reviewer inspected all seven original captures. No score clipping or central play obstruction observed. Actual shown scores are 0 and 3; 100–300 totals, rolling/reveal states and physical-TV appearance were not visually accepted here.
- Impeccable context, layout, typography and craft-floor guidance applied. Mechanical detector found three historical rules overridden in the final TV presentation; none require expanding this narrow pass.
- iOS build 117 succeeded; product/show validators and strict code signing passed. All 1,717 runtime files match current source; all 1,746 frozen source hashes remain unchanged; main and App Clip versions are 117.

## Limit

Uncorrected native yaw is a plausible contributor to the reported drift, not a confirmed physical-device diagnosis. Hardware validation requires a sustained series of user throws after installation. Automated and screenshot checks do not prove that the physical drift is eliminated.
