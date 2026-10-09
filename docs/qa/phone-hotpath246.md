# Native phone hot paths246

2026-10-09. Source baseline is `db5e4f4` (build147). This lane uses the mobile-native skill's touch/viewport/hardware boundary and a freeze → isolate → repeat → retain measurement workflow. Desktop browser figures are accumulated CPU work, not physical iPhone/cast response or presented FPS.

## Retained host state reconciliation

`public/native-shell/host.js` no longer reassigns the same active title/image, button disabled state, readiness attributes or active catalogue label on every native snapshot. Authored aria/title strings are cached separately from translated DOM values; an attribute removed by a state transition is reinstated. The shared catalogue owns its normal label: when its returned array changes, the native active-game override is deliberately invalidated and applied again.

The persistent native host WKWebView acknowledges and processes authoritative model/launch/bot/rematch state while UIKit has hidden it. Its DOM retains the last painted controls instead of reconciling every hidden gameplay snapshot beside the TV renderer. A native resume synchronously reconciles the latest model; it does not replace/hide the existing deck/search. Empty boot snapshots continue through the first real catalogue to prewarm its36 cards before the first native reveal. The245 `stack-backed` guard is preserved.

Two isolated Chromium pairs route exactly the same frozen shared sources; only host.js differs. Each workload delivers100 snapshots, yielding between deliveries rather than packing all writes into one callback.

| Workload | Baseline Task ms | Candidate Task ms | Additional evidence |
| --- | --- | --- | --- |
|100 identical visible snapshots|260 /242|105 /117|1100 DOM mutations,1900 observer callbacks →0 /0; no layouts|
|100 visible progress changes|244 /251|232 /227|1024 mutations →227; actual progress reaches Round99|
|100 identical native-hidden snapshots|255 /247|27 /19|0 candidate DOM mutations, observers, style/layout work|
|100 actual hidden progress changes|271 /257|34 /16|0 candidate DOM/style/layout; latest Hidden round99 rendered synchronously on resume|

The measured synchronous candidate resume handler was1.5 /1.9ms in Chromium. This is JS reconciliation time, not when the user sees a presented physical frame. All before/candidate geometry and translated titles/readiness match exactly. WebKit passes the same state/geometry/translation/waiting→results→waiting behavior; its CPU fields are unavailable and are not represented as zero cost.

The final source hardening was rechecked in both engines (`phone/recheck`). Chromium identical visible work was227→122ms; hidden changing progress265→18ms, with the same zero no-op mutations/observers and synchronous latest-state resume1.3ms. Actual visible progress CPU was224→241ms in that pair despite1024→227 mutations, so the changing-state CPU gain from the earlier two pairs is not a reliable speedup claim. The final oracle compares actual aria/title after waiting→results→the same waiting state and after locale changes; removed readiness labels are restored. Empty boot→first real catalogue also passes the full36-card prewarm oracle in both engines.

The first guard-only diagnostic failed the harness's strict75% no-op mutation reduction requirement (1100→400). The remaining400 were the native active catalogue text and choiceStart authored-vs-translated aria-label churn. Targeted guards brought them to zero without changing the assertion. Diagnostic reports remain in `output/playwright/performance246/phone/diagnostic`; the first broader raw report is kept separately from final results.

Fresh WebKit candidate waiting Host Pick and Host Panel PNGs were opened and inspected. Game art medallion, lime Controller, readiness count, search icon, Fresh card logos, material and centred Back remain. These are fixture native bridge states, not a device capture.

## Retained Rooms/dots and hidden launch lifecycle

`nearby-rooms.js` now schedules one visible scroll-fade bounds update per frame, guards identical mask attributes, and skips closed-sheet bounds reads. It keeps the245 room nodes, edited input and icon SVGs. The held-drag Spotlight dot path only changes `aria-current` when the selected dot changes; gesture physics, effects and light-layer crossfades are unchanged.

Both Chromium and WebKit run the actual native DOM with fixture Swift messages and discovery data. For100 changed discovery payloads in one callback:

| Workload | Baseline | Candidate |
| --- | --- | --- |
| Rooms closed |99 bounds reads /198 mask writes|0 /0|
| Rooms open |101 bounds reads /200 writes|2 /0|
| Chromium Rooms closed Task |301ms|13ms|
| Chromium Rooms open Task / layouts |363ms /100|11ms /1|
|100 held subthreshold same-game pointer moves |400 dot aria writes|0|

This is a batching/forced-style diagnostic, not user latency or device FPS. Chromium and WebKit exact input/Save rectangles match baseline after a393×500 simulated keyboard resize. The room field keeps focus and its draft through discovery updates; Save dispatches the actual native rename command. Fresh Nearby, expanded rename/keyboard and held-drag captures were inspected; blur/material, inset controls, soft bottom fade, logos and gesture composition remain.

The lifecycle oracle also sends actual launch, consecutive bots-set, rematch and controller-navigation commands around hidden acknowledgements. Detail launch ACK/error bookkeeping now runs before visual parking. With curtain lane's narrow `motion.js` native-hidden close parity, a normal or already-pending detail close completes synchronously while UIKit-hidden; there are zero detail/bot popup `getComputedStyle` calls and zero candidate hidden `Element.animate` creations. The returned-to-lobby event has no current production listeners and does not restart a hidden entrance. Tests use fixture model messages; physical network acknowledgement, keyboard and haptics remain separate.

## Native entrance diagnostic; clock unchanged

The existing host helper pauses every running dialog subtree animation, rewinds it to1ms, then waits three rAF callbacks. In the frozen WebKit Host Panel diagnostic, the recorded effect remained paused until approximately545ms in baseline and468ms with host guards. Computed panel opacity was already1 throughout. Those two values come from different cold paints and are not a paired speedup. They demonstrate that three rAF callbacks cannot be assumed to mean50ms under load.

`phone-entrance246.cjs` compared isolated all-effects/three-rAF, finite-panel/two-rAF and no-hold variants in WebKit. It exercises the actual Host Pick art opener and records cold/warm/close-reopen image readiness, flight, opacity/transform, animation names/time/state and video. Raw `first` initially counted positive open geometry even while the sheet was below the viewport. `webkit-derived-visible.json` retains raw geometry times separately and derives viewport intersection: baseline cold1112ms/warm909ms; finite cold1230ms/warm668ms. No-hold cold first-visible1009ms already near the final pose. Cold baseline settlement was outside that capture window. These isolated single cases do not prove a safe faster entrance, so production keeps the existing hold. The harness now requires viewport intersection and waits for full art reveal/finite effect completion on future runs; that strengthened entrance harness has not been rerun.

No entrance clock, blur, light cadence, shader/DPR, haptic or gesture-physics cuts were retained. Existing first-open lag remains a known follow-up; no physical phone/cast resolution is claimed.

## Reproduction and remaining acceptance

Frozen shared/owned sources: `.localparty-build/perf246/phone-source-before` (92 entries and SHA256 manifest). Isolated candidates: `.localparty-build/perf246/phone-candidate`. Results/captures: `output/playwright/performance246/phone/final`, `recheck`, `lifecycle`, `entrance`. Accepted source copies and source/capture SHA256 manifest: `.localparty-build/perf246/phone-accepted` and `output/playwright/performance246/phone/accepted-manifest.json`.

| Retained source | SHA256 |
| --- | --- |
|`public/native-shell/host.js`|`2da337922c816df902fa51876531ad4d3dbe99af20363e8a61944ba39cc6592f`|
|`public/native-shell/nearby-rooms.js`|`44342ac1f2db9455a1e08b746f92bb4dc8a1115931581046fbbadfac98954064`|
|`public/game-spotlight.js`|`706605c1a89de7e69486534574fd5b58ff59f2e4ef84f35e05de381b1725c886`|
| Shared curtain-owned tested `public/motion.js`|`c12343262bbaf4a251619c28fc9a4b066b4607b7391cd0084c46070393553a81`|

Run browser workloads sequentially in the root-owned measurement slot:

```sh
PARTY_PLAYWRIGHT=/path/to/playwright QA_OUTPUT=output/playwright/performance246/phone/final node scripts/phone-hotpath246.cjs
PARTY_PLAYWRIGHT=/path/to/playwright QA_ENGINE=webkit QA_OUTPUT=output/playwright/performance246/phone/final node scripts/phone-hotpath246.cjs
PARTY_PLAYWRIGHT=/path/to/playwright QA_ENGINE=chromium QA_MOTION_LATEST=1 node scripts/phone-lifecycle246.cjs
PARTY_PLAYWRIGHT=/path/to/playwright QA_ENGINE=webkit QA_MOTION_LATEST=1 node scripts/phone-lifecycle246.cjs
PARTY_PLAYWRIGHT=/path/to/playwright QA_ENGINE=webkit node scripts/phone-entrance246.cjs
```

Final main/lifecycle rechecks and exact paired rename field/Save geometry assertions pass in both engines. All owned production JS and three harnesses pass syntax checks; `git diff --check` is clean. Source work and new benchmarks are frozen after the user replaced optimization with Git integration/cleanup. Root owns physical iPhone standalone/separate-TV profiling and Release packaging. This lane has not measured physical keyboard, haptics, casting FPS, native GPU time or perceived latency and does not declare remaining phone/cast lag resolved.
