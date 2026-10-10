# Performance249: accepted change and measurement limits

2026-10-09. Source baseline `main` at `8bbad774542a14aad4796f3c262d956adf32006f`. This round promotes one native serialization change. Existing scrollbar, keyboard, native artwork-cache, popup material and motion fixes remain in place.

## Accepted native change

`PartyWebStore.publish()` now retains the catalog already decoded with a successful full server state. It avoids a second encode/decode of the same live catalog. Nil/empty state and failed state encoding still use the original bundled/saved/live catalog fallback. Native flags, Rooms publication, QR invalidation, delivery ordering, ACK/error handling and coalescing are unchanged.

The actual current Swift types and publication body passed33 Foundation cases with identical complete payload bytes, dictionaries and sideeffects. Uninstrumented value-builder copies ran eight balanced ABBA blocks per fixture,256 operations per variant. On Mac the36-game menu builder fell2.80022→1.89091ms; the16-player active builder fell3.24274→2.31893ms. All eight live-catalog blocks saved time. The unchanged empty-catalog fallback control stayed within noise. These are serialization-operation measurements, not iPhone FPS, popup-input latency or casting improvement.

The exact accepted full `LocalPartyApp.swift` SHA-256 is `ec863157443935c221ac2fd9cedf4d0252262b8b085faef3743bde5d8180aeb3`. The portable preparer regenerated the exact executed probe `343f448a…` from promoted production without another timing run. See [native-catalog249.md](native-catalog249.md) for source hashes, cases and reproduction.

## Rejected experiments

- Two Sports Color-allocation candidates passed narrow output/pixel parity, but neither established a consistent full-render improvement. Constructor-instrumented timings are allocation diagnostics only. The final raw-vendor cohort produced a small Task change with inconsistent render-loop and effect workload. Game source remains unchanged. See [game-render249.md](game-render249.md).
- Removing own backdrop blur from opaque persistent Host was an isolated hypothesis. Fresh settled WebKit393 correctness passed:12 originals independently viewed, five full-RGBA pairs and geometry exact. The Chrome LayerTree feed was stale/unavailable, and its unfrozen-animation Rooms captures differed. Extra actual raster cost was not proved. The candidate is rejected for production; shared blur/material and all CSS remain unchanged. See [popup-render249.md](popup-render249.md).

No lowered resolution, FPS target, AA, shader/effect quality, artwork, blur radius or altered easing accompanies the accepted change. Experimental source copies and diagnostic captures stay ignored.

## Build and regression evidence

- `npm test`:748/748 passed, zero failed/skipped/cancelled; Party/Tanks/Spy/Millionaire integration checks also passed. Log `.localparty-build/performance249/npm-test.log`.
- Product-verifier unit suites:22 passed in `product-unit-valid.log`. The initial wrong discovery pattern ran zero tests and is preserved in `product-unit.log`; it is not counted as validation.
- Release0.11.7(151), actual connected-iPhone destination: `BUILD SUCCEEDED`; product-content and show-product verification passed. Source/product manifest is `.localparty-build/performance249/build151-source.json`.
- Deep strict code-signature verification passed in the full system trust context. The sandbox-only `CSSMERR_TP_NOT_TRUSTED` result remains in its separate log.
- Build151 installed over150 without uninstalling or deleting user data. Actual device inventory confirms0.11.7/151; `devicectl` successfully launched it. Installation/inventory/launch logs are under `.localparty-build/performance249/device/`.

## Fresh physical-device boundary

The pre-install copy still ended at16:08:48UTC from the earlier session. It contained no fresh150 launch and is not an after sample. The new copied journal contains `launch HeyPals ·0.11.7(151)` at17:27:41UTC and phone catalogue samples through17:28:52UTC, followed by backgrounding at17:29:02UTC.

The first151 ten-second sample includes startup:56fps, maximum201ms frame gap. Later catalogue samples are59.4–60fps, p95≈17ms, maximum21–65ms, nominal thermal state and Low Power off. There are no new TV-surface rows in that151 segment. These observations establish a fresh launch and idle-catalogue sampling only. They do not prove popup interaction smoothness, keyboard correctness on physical hardware, or separate-TV casting; no matched before/after action workload was recorded. The user was asked to perform fresh standalone151 actions, then a separate casting comparison is required.

This round does not claim every game, popup, loading transition or cast case is fixed. Browser, Foundation, compiled-product and physical-device evidence remain distinct.
