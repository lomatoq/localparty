# Android browser sports Motion — 2026-10-04

## Confirmed code cause and bounded correction

Bowling/Curling's browser adapter previously refused every motion sample without a complete alpha/beta/gamma orientation event newer than 250 ms. Punch Meter consumes acceleration/gravity without that prerequisite. An actual controller/engine baseline reproduced zero throws and fallback to Swipe in both sports when valid acceleration arrived without orientation. This establishes a concrete software defect matching the reported symptom; the user's physical Android/browser/protocol combination remains unconfirmed.

`public/sports-motion.js` now accepts usable browser acceleration (including partial nullable axes), gravity-derived acceleration, nullable compass heading, and independent/slower orientation streams. Gravity/relative attitude plus available gyro preserve the captured TV frame; small quiet gyro bias is learned for repeatability. Actual sensor gaps still cancel partial impulses. Motion permission remains required; optional orientation permission no longer vetoes a permitted accelerometer. Insecure HTTP or an absent API never claim readiness. Native sample normalization, FreeMotionThrow/ShakeSweep, physics and scenes remain unchanged.

`games/sports_siege/public/controls.js` adds the HTTPS/Swipe explanation and diagnostic attitude-basis label. No holding/release requirement was introduced.

The [W3C orientation-event specification](https://www.w3.org/TR/orientation-event/) describes independently delivered motion/orientation data, nullable sensor fields and secure-context restrictions. [MDN DeviceMotionEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent) documents the browser motion event interface. Missing compass heading therefore cannot be treated as missing acceleration.

## Frozen products

| File | SHA-256 |
|---|---|
| public/sports-motion.js | f3ffe88dc448cef2a67a7809122122917039f8f03c93e76060875b8d79dea9f0 |
| games/sports_siege/public/controls.js | 5017da5c05ea40efce2c2b83163be391c7957ac2a8042119367d75e88170993f |

Both final browser reports record matching start/end product hashes. No build, install, commit or device mutation was performed by this lane.

## Repeatable checks

All commands run from `/Users/hlebhlyaba/HeyPals/localparty`.

```sh
node --test tests/sports-motion.test.cjs tests/free-motion-throw.test.cjs tests/android-sports-motion.test.cjs
node tests/punch-motion-check.cjs
node --check public/sports-motion.js
node --check games/sports_siege/public/controls.js
git diff --check -- public/sports-motion.js games/sports_siege/public/controls.js tests/sports-motion.test.cjs tests/android-sports-motion.test.cjs tests/browser/android-sports-motion.cjs tests/browser/sports-motion-controls.cjs
```

Results: 34 focused tests passed; all ten Punch controller checks passed; syntax and scoped diff checks passed. New adapter→FreeMotionThrow tests cover acceleration-only, partial axes, gravity-only, upright gravity, absent orientation, nullable alpha, 650 ms orientation, motion/orientation permission distinction, insecure/missing API, late permission resolution, interrupted impulse, other-player gate, idle/bump rejection and twelve straight repeated throws under quiet gyro bias. Existing native coordinate/grip/aim/spin and no-hold tests remain passing.

Final actual Chromium/controller/server matrix:

```sh
QA_CHROMIUM=/Users/hlebhlyaba/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell \
QA_OUTPUT=output/playwright/android-sports-motion-2026-10-04/final-qualified \
PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright \
node tests/browser/android-sports-motion.cjs
```

[Final report](../../output/playwright/android-sports-motion-2026-10-04/final-qualified/report.json): `ok:true`, `errors:[]`, `drift:[]`; 12 cases. Acceleration-only, partial axes, gravity-only, null alpha and slow orientation each sent exactly one bounded, valid, current-token throw in both Bowling (402 px) and Curling (320 px). Every stopped stream returned honestly to Swipe. Actual non-localhost insecure HTTP (`localparty.test` mapped locally by Chromium, no certificate issuance) stayed Swipe with HTTPS explanation and zero throws. All 32 full controller originals were opened and reviewed. Normal engine clock and actual transport were used; sensor events are synthetic.

Native transport regression:

```sh
QA_NATIVE_ONLY=1 QA_MODES=bowling,curling QA_WIDTHS=402 \
QA_OUTPUT=output/playwright/android-sports-motion-2026-10-04/native-confirmation \
PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright \
node tests/browser/sports-motion-controls.cjs
```

[Native report](../../output/playwright/android-sports-motion-2026-10-04/native-confirmation/report.json): `status:passed`, `errors:[]`, `sourceDrift:[]`. Both native-bridge fixtures threw automatically once; pause, resize and orientation cancel incomplete attempts; Curling shake/stale release remains covered. All 11 originals were opened. Native vectors are synthetic; this is not physical iPhone evidence.

[Before report](../../output/playwright/android-sports-motion-2026-10-04/before/report.json) retains the original acceleration-without-orientation failure, both games, zero throws, no drift. An intermediate `final/` attempt timed out while awaiting Bowling gravity-only arming; no product cause was established. A narrowed `gravity-diagnostic/` run passed on the identical product hashes. The final helper explicitly waits for the real throw gate and settles controller disconnects; the complete `final-qualified/` run then passed. The intermediate attempt is retained and excluded from acceptance.

## Visual and physical limits

Ready states preserve the accepted controller hierarchy and footer. Existing transient throw-feedback toast overlaps explanatory watch/sweep copy in some immediate post-throw captures; the 320 px Curling Swipe stone is partly below its panel edge. These are existing presentation issues outside this sensor-only change, not a claim of new UI polish.

No physical Android or iPhone sensor validation occurred. Actual Android browser name, permissions and HTTP/HTTPS route still need device confirmation. With no orientation and no gravity, the first frame is device-relative: the phone's top edge must initially point toward the TV; arbitrary initial tilt/heading cannot be inferred from linear acceleration alone. Missing gyro cannot measure wrist spin. Relative gyro attitude can still drift over longer real sessions despite the passing twelve-throw bias regression. Hardware verification should cover initial grip/TV calibration, repeated gentle/hard throws, intentional lateral aim/spin, gravity-only posture, background/reconnect, and denied permission. The historic build119 physical symptom must not be reported as physically closed from this synthetic evidence.
