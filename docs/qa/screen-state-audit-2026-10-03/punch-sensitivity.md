# Punch Meter motion sensitivity

Latest explicit user request: reduce punch-motion sensitivity5–10 times. Root selected5. Catalog id is `punchmeter`, engine `arcade`; this is the force sensor game, not a renamed interface.

## Actual pipeline and bounded correction

`games/arcade/public/app.js` obtains finite linear acceleration, or subtracts an adaptive gravity estimate when only accelerationIncludingGravity is available. After explicit readiness,700ms minimum preparation and350ms stillness, it tracks the acceleration-vector magnitude peak. Release below3m/s², profile trigger and1800ms cooldown gate one attempt. Profiles remain soft(trigger16/full52), normal(12/40), sharp(9/32).

Before: `power=clamp((peak-trigger*.5)/(full-trigger*.5),0,1)`.

After: `power=clamp((peak-trigger*.5)/(5*(full-trigger*.5)),0,1)`.

The calibrated gain is divided by5 BEFORE saturation. Dividing already-clamped power would permanently cap motion scores at280; this correction permits larger signals to reach1. Server conversion remains `round(100+900*power)` with a1000 per-hit maximum, three attempts, authoritative turn/cooldown checks, and unchanged bag impulse. The constant100 base score means total scores themselves are not divided by5.

Touch press/release sine timing, its meter, bots, sensor permission flow, profile trigger thresholds, readiness, gravity fallback, physics, all layouts and all other modes remain unchanged. Only the motion expression and its comment changed in production.

## Fresh deterministic evidence

`node tests/punch-sensitivity.cjs` runs the actual production motion listener with deterministic platform events, sends emitted inputs into the actual Arcade simulation, and verifies independent fixed scores. Fresh results are adjacent in `punch-sensitivity-results.json`.

| Soft-profile peak(m/s²) | Emitted power | Server points |
| --- | --- | --- |
|10|No attempt|No attempt|
|17|0.040909|137|
|30|0.1|190|
|52|0.2|280|
|80|0.327273|395|
|118|0.5|550|
|228|1|1000|
|400|1|1000|

All three sensitivity profiles yield0.2 at their former full-strength calibration. Synthetic saturation peaks228/176/142 respectively reach1000 and stronger samples stay capped. These are numerical test samples, not instructions or measured phone calibration. Nonfinite readings are rejected, strength stays monotonic. Existing normalized touch/bot input sequences still finish all three attempts with totals3000/1650.

`node tests/punch-motion-check.cjs` passes HTTP/unsupported/denied access, null-data/no-stream status, explicit readiness, stillness arming, impulse, weak-wave rejection, gravity fallback, off-turn suppression and stalled-stream retry. Its stale fixture initially failed before any production change: missing arcadeCopy/update/state mocks and outdated connected-copy/automatic-arm expectations. A reusable platform fixture now executes the real listener and current explicit readiness flow. It passed both before and after the gain correction.

`node tests/arcade-report-metrics.cjs` passes all six mode metric checks. `node --check games/arcade/public/app.js` passes. Existing `tests/arcade-simulation.cjs` already fails the Flappy vy<0 assertion during its current3-second countdown; this unrelated baseline is reported to root/shared_hud and is not hidden as a passed full regression.

## Provenance and limits

Production app baseline SHA256 `626c7e8db674c9871fd4a5d5bd4ac64d4607fc0ff4080860f19927dfba95961e`; Punch-only freeze `28f66d6920c925df991893a5ae3a01b443bc6c7a202d69d20962403df756ac5e`. Subsequent Flappy/Hungry work in the same app is independently owned; preserve the isolated motion expression.

Unchanged hashes: simulation `8a99d754d1147303ea6eb49230a0fa3660d703fc1728ddbd71d8afb6640779b0`; style `48761c7dff95bc510f730edb820feab43e457fa28f93e03e04a6c73807ae762d`; bot `33f66a63b59b80b134c2f3f8ba26b5a1cf45d4bb8e8824477388d5f69b8fe419`.

No browser, build or installation was performed for this numerical change. Physical-device sensor response and touch feel remain unverified. Root owns fresh combined-source catalog capture and any later assembly.

## Full-suite integration regression update

Root's641-test integration run found one additional stale expectation in `tests/game-quality-regressions.test.cjs`: peak52 still expected power1 after the intentionally softer gain. Only that test changed. It now exercises the actual production handler through the same platform fixture, checks denied permission/no listener, unarmed no attempt and explicit readiness/stillness arming, then asserts peak52→power0.2/server280 and a fivefold raw peak260→power1/server1000. This guards the requested gain reduction AND prevents a permanent20% power ceiling.

`node --test tests/game-quality-regressions.test.cjs` passes6/6, including the untouched Flappy/Hockey/Bow/Swarm checks. Test-file freeze SHA256 `57140c0c145e02edd82fb9502a5a49b041f3dde782911af012da4651a94553b0`. No production changed during this integration correction; root owns the full-suite rerun.
