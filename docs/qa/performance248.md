# Performance248: retained changes and acceptance boundary

2026-10-09. Starting published main: `16ae1124d4cb30bb5e00d2e1d03973950e0e970a`. This round continues interface and game performance work without reducing rendering resolution, frame cadence, antialiasing, shaders, artwork, blur or motion quality. Timed browser lanes ran separately from SDK/simulator work. The methodology follows [Addy Osmani Performance Optimization](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md): reproduce, isolate, repeat, retain a meaningful result only after correctness checks.

## Retained source changes

- Hide scrollbar chrome in the shared UI and native TV WKWebView while preserving scrolling and access to the last item. This is an explicit user requirement, also recorded in AGENTS.md and the UI regression rules. Ten real route/size/engine cases produced twenty independently inspected originals. Native game details/settings, browser rules and the sixteen-player TV list remained scrollable. Desktop WebKit mobile wheel support is unavailable; that particular endpoint used programmatic scroll reachability instead of claiming a touch gesture.
- Fit a focused field and its action through the input group's own scrollport. At320×568 with a250px simulated keyboard, By Code's Connect previously extended from209.5 to257.5px beyond the form's234px bottom. The helper keeps the whole button visible at180.5–228.5px in Chromium and181.5–229.5px in WebKit. The six cells, Back, material and blur are preserved. This fixes clipping, not a demonstrated physical-device latency cause.
- Share the two unchanged bundled native loading/shutter images. An actual UIKit simulator probe verified complete bitmap/PNG equivalence and stable image identity; repeated file loads fell from eight to one. Mean repeated creation plus layout saved0.316ms at720p and0.374ms at1080p in balanced samples. These are operation costs, not GPU/frame or casting FPS improvements.
- Verify actual iOS product bytes for the shared input helper and Pocket plasma/material resources, in addition to the existing strict runtime-file checks.

Detailed evidence: [scrollbar and visual review](visual-review248.md), [keyboard](rooms-keyboard248.md), [native artwork](native-display248.md), [Stage HUD](stage-hud248.md), [Deluxe/Pocket](deluxe-performance248.md). Raw images and reports remain under `output/playwright/performance248` and `output/playwright/scrollbar248`.

## Rejected or unresolved experiments

- The Pocket plasma mask-coordinate cache passed67 material pixel checks and an isolated arithmetic test, but complete Canvas timings showed no repeatable gain: Chromium differences were below0.5%, WebKit was noisy or slower. It is not in production. Full-renderer fixture failures are retained and are not visual acceptance.
- A Nearby discovery-metadata keyboard rescheduling candidate did not reproduce a failure in the matched baseline. It is not in production; the existing retained editor remains unchanged.
- Stage field-level idempotence reduced measured Curling HUD CPU36.45% and Bowling23.24%, with TV browser task totals about14% lower. Shader/camera/state handling stayed intact, but the strict WebKit image gate failed: Curling waiting max channel difference44, Swarm playing70. Both A→A and B→B controls were exactly stable, and all270 cross-source presentation fields were equal. This does not support a random-noise explanation. The full candidate is rejected this round; production Stage host remains its original SHA256 `d3c72f68c1287d7e94ddc8401b7e6ab689a8c90b09a31f4bc2faf64c4109cd97`. The diagnostic harness and original fixture preserve the investigation; no unaccepted optimization is shipped.

## Physical device evidence

The phone inventory before this round's installation confirms HeyPals0.11.7 build149. Its fresh ten-second action windows include Rooms47.7fps with161ms maximum frame gap and game detail53.8–55.7fps with103–112ms maximum gaps, followed by settled59.6–60fps. Thermal state was nominal in the reported action windows. These passive aggregates have no exact input-to-paint markers and no matching new TV-casting sample; they show the reported lag remains, not a proved cause or a proved improvement from this round.

Simulator/browser acceptance does not replace physical iPhone keyboard, popup motion or separate-output casting review.

## Current-source browser acceptance

`tests/browser/keyboard248.cjs` passed Chromium and WebKit on the actual `/play` route with both native controller bridge and persistent tabs. Each run covered Nearby rename, six-digit By Code, actual profile editing and catalog search at320×568 with250px overlay. Checks include every clipping ancestor, trusted lower80%-of-Connect click and actual response status, preserved digits/final-digit focus, rename caret[4,9], profile caret[3,8], retained draft/input identity, rapid close/reopen and viewport/blur cleanup. All eight final PNG originals were independently inspected. Reports contain zero failures/errors, source hashes and capture manifests; predicate success is represented by the checked test and absent failures, not a separately dumped native caret trace. Exact helper SHA256: `12e19cf5569d1f1575cda19df8736dcdd86f0eab345f5f1d01f25e0ad42738b1`; Nearby remains unchanged `44342ac1f2db9455a1e08b746f92bb4dc8a1115931581046fbbadfac98954064`.

## Release validation and installation

- `npm test`:748/748, zero failed/skipped, plus Party/Spy integration checks passed. Complete log: `.localparty-build/performance248/npm-test.log`.
- Product-validator unit suite:22/22. Prototype inventory check is current; syntax and `git diff --check` passed.
- Release0.11.7 build150: full `xcodebuild` succeeded for the connected iPhone using iphoneos27.0. Both actual-product verifiers and deep/strict code-signature verification passed. Bundle resources match the tested source bytes; rejected Stage and Pocket candidates are absent. Native source hash `6dfdde1ddad58059812d791cac90ec1e740a3ec658fb446dc8f83ada7e33dd29` is retained in `build150-source.json`.
- Installed over149 without uninstalling; subsequent actual device inventory confirms150. The first automatic process launch was denied because the phone was locked. This is not an application crash or a successful launch; the user was asked to unlock/open it and run the separate no-cast keyboard/popup workload.

Fresh150 device motion/keyboard and active separate-TV casting acceptance remain pending. No speedup multiplier, perfect-presentation or complete-popup claim follows from this installation.
