# Native popup entrance247

2026-10-09. Source baseline `87dd64fa783c3092061ac5a77074839e2fbfb185` (build148 contains this baseline). This lane applies mobile-native and animate to the existing native web shell. Desktop browser timing, fixture native acknowledgements and decoded browser videos remain separate from physical iPhone/cast acceptance.

## Isolated clock diagnosis

The native `holdEntranceUntilPainted` helper pauses and rewinds every running animation in the dialog subtree, including button energy, backdrop and a live resumed motion; it then waits three rAF callbacks. Under loaded desktop WebKit those rendering opportunities can take hundreds of milliseconds. The shared sheet entrance itself is560ms. The helper's old comment claiming that rAF proves a presented GPU frame was incorrect.

The finite-only experiment changes only that helper: skip a resumed dialog, select the dialog's own finite non-pseudo effects, retain the1ms initial pose, then resume after two rendering opportunities. Shared backdrop/child/flight clocks, durations, easing, images, material, blur, haptics and deck/search/Spotlight nodes are unchanged. The shared flight still follows the actual sheet entrance, carries the already-decoded source art, stays blurred in flight and reveals the detail texture at handoff.

Two repeated pairs in each engine use the same frozen92 publicJS/CSS/HTML files and393×852 mobile/touch/DPR3 native DOM. The fixture delivers real catalog/native bridge model shapes. Timing starts at the actual captured Host Pick click; “first” requires viewport-intersecting sheet geometry with positive opacity. “Settled” additionally requires decoded/revealed art, no flight clone and completed finite effects. These are sampled browser geometry/animation clocks, not physical presented frames or device FPS. The65ms close→65ms reopen schedule uses programmatic button clicks; actual callback delivery under WebKit load is variable.

| Engine/state | Baseline click→first ms | Finite v1 click→first ms | Baseline→finite v1 settled ms |
| --- | --- | --- | --- |
| WebKit cold |679 /764|499 /885|1065 /1030 →794 /1206|
| WebKit warm |661 /464|420 /444|1137 /987 →711 /703|
| WebKit early close/reopen |1513 /1562|355 /356|1938 /1986 →412 /651|
| Chromium cold |116 /132|99 /99|653 /670 →637 /637|
| Chromium warm |98 /115|82 /99|636 /652 →620 /635|
| Chromium early close/reopen |115 /114|98 /98|448 /448 →421 /421|

The cold WebKit result is variable; no reliable cold-opening speedup is claimed. Avoiding the reset of a resumed entrance has the clearest measured benefit. Chromium repeated pairs also pass rapid close during a pending entrance and native launch acknowledgement while UIKit-hidden: obsolete detail closes immediately, no hidden dialog style reads/WAAPI creations, no stale panel on resume.

## Rejected idle preparation experiment

A separate ignored candidate prepared the selected game's closed detail content/settings schema and decoded its art in a controlled idle queue. Actual open still updated current settings/model, focus and commands. Preparation emitted no native command and kept underlying real nodes visible. Prepared-only WebKit cold first-visible689 /732ms overlapped baseline702 /758ms; warm525 /598ms overlapped baseline633 /521ms. This did not reliably resolve first-visible delay and is not eligible for production. No preparation-only, no-hold or combined experiment is retained.

## Accepted resumed-only ownership fix

Independent original-frame review found a cold jump in both baseline and finite v1; it cannot attribute that cold behavior to the candidate. Warm baseline footage contains more intermediate panel/blurred-flight frames than finite v1 in the inspected recordings. Faster first geometry does not replace visible motion. Finite-only v1/v2 and idle preparation are rejected for production.

The narrower v3 `resume_only` candidate preserves the first-entry helper's original all-running subtree capture,1ms pose and three rAF callbacks exactly. It changes a resumed show: it does not rewind or hold the shared live reversal. A WeakMap generation/owned-effect record prevents callbacks from an earlier show restarting a later one. If a resumed show inherits a child energy effect paused by that old hold, it releases only captured effects that are still in the dialog's current animation set and remain paused. Canceled sheet/flight objects are excluded; the newly-created resume WAAPI/backdrop are not in the owned list and remain untouched.

The deterministic queued-callback oracle passes the original three opportunities/all-effect capture, inherited child-effect release, canceled sheet/flight exclusion, untouched running resume/backdrop and an inert stale/closed callback. Both engines also pass the actual native DOM first/warm entrance, programmatic early close/reopen, final decoded art/flight/source cleanup and native hidden launch ACK. During an actual resumed frame there is no remaining `ux-sheet-in` and no paused finite own sheet/backdrop clock. An additional WebKit lifecycle-only case sends launch/hidden ACK in the same task as the new hold, then drains its old callbacks for150ms: zero hidden `Animation.play`/`Element.animate`, no stale detail/flight after resume. For that additional WebKit lifecycle-only run the harness frame sampler is stopped before the hidden drain, so it does not generate hidden style reads itself.

The v3 pair awaits decoded source-medallion/Spotlight textures and captures the ready underlying screen before first actual tap. Actual close/open clicks are logged: WebKit baseline135/211ms and candidate132/219ms; Chromium122/211ms and candidate114/200ms. The requested65ms timer is not represented as actual delivery time under load. Reopen metrics below begin at that second captured open and require a resumed visible frame; a pre-close first-visible frame is excluded.

| V3 actual reopened-click metric | Baseline | Resumed-only v3 |
| --- | --- | --- |
| WebKit reopen→first resumed visible |479ms|393ms|
| WebKit reopen→settled |649ms|393ms|
| Chromium reopen→first resumed visible |70.3ms|47.5ms|
| Chromium reopen→settled |236.6ms|221.2ms|

These are single paired browser samples supporting the narrower interruption/ownership fix, not a broad latency gain. No finite-v1 speedup is attributed to v3. Cold WebKit632→571ms first geometry/1003→1138ms settled is variable; cold/warm smoothness and physical acceptance are not claimed. The recorded reversal also omits intermediate poses in parts of the candidate sequence; neither sampled rAF geometry nor these25fps recordings prove all-frame reversal smoothness. The candidate is scoped to ownership/clock continuity and cleanup. All16 before/cold/warm/reversal final PNGs were independently reviewed with unchanged material, medallion, geometry, retained underlay, art, CTA and Back. Fresh unique original-frame review approves v3 only for ownership/resumed clocks: it retains sampled cold/warm intermediate sheet poses and blurred art→sharp reveal without new material/layout/retention regression. Recorded WebKit reversal omits intermediate poses; every-frame reversal smoothness remains unapproved. Exact v3 has been promoted to `public/native-shell/host.js`; first-entry timing remains unchanged.

| Source | SHA256 |
| --- | --- |
| Baseline host |`2da337922c816df902fa51876531ad4d3dbe99af20363e8a61944ba39cc6592f`|
| Measured finite v1 |`01791c7a687d62768b7f8f6d76d1c491e286217d56747c1190f2c7a533a85c16`|
| Rejected isolated finite v2, generation + corrected comment |`1d2fdb232db1cfe34f806a08dffa55ce84a12b12500154318a3abc6dc9e6d55d`|
| Narrow resumed-only v3 |`650c436657fb0eba7f1b995db4ca6017c7dbcf2d46876380473a3cfd0b6186a9`|

## Evidence and limits

Ignored frozen sources/candidate generator/harness: `.localparty-build/perf247/phone-source-before`, `phone-candidate`, `prepare-phone-candidates.cjs`, `phone-entrance247.cjs`, `hold-generation247.cjs`, `hold-resume-generation247.cjs`.

Results: `output/playwright/performance247/phone/prewarm-pairs/webkit-report.json` and `finite-pairs/{webkit,chromium}-report.json`. Original-speed videos contain the complete cold, warm and interrupted sequence; all2110 original25fps frames from the eight finite-pair videos are decoded in `finite-pairs/original-frames`, with source video hashes, exact videoPTS and contact-sheet paths in `manifest.json`. V1 has no explicit performance.now-to-videoPTS anchor: original-frame timestamps and sampled rAF elapsed times must not be equated. No all-frame visual approval is inferred from settled PNGs.

First finite WebKit sampled contact sheets were opened: the underlying Host Pick/search/Fresh art remain visibly present, the moving art resolves from blur, and source art returns after close. The narrowed v3 lifecycle/settled pixels and bounded independent original-frame gate pass for ownership/resumed clocks. The earlier full V3 contacts are excluded from motion acceptance after a contact-row/time reading inconsistency. Fresh paired subsets were decoded into a new empty directory: `resume-pairs/original-subsets-v3-verified-1791550236692703000/manifest.json` (320 original PNGs, four movies, cold/warm/reversal). Each manifest entry records the WebM SHA, full ffmpeg command, original encoder-logPTS, PNG SHA and lossless contact-cell mapping. No performance.now/video anchor is invented; independent review uses this unique manifest. The old5fps reading aid is excluded from acceptance because resampling changes its displayed frame positions; use the original-frame manifest timestamps.

Room rename expansion remains a separate unresolved path: the grid-track animation, trusted synchronous focus/keyboard viewport reconciliation and per-frame soft-scroll-mask observation interact. No focus/easing, Rooms CSS or keyboard behavior was changed on the basis of source inspection. No iPhone keyboard/cast success is claimed. V3 evidence is in `phone/resume-pairs` and `resume-hidden`; `*-derived-reopen.json` retains the correct event-relative reopen metrics. No DPR, shader quality, light cadence, blur or UI effect cut was made.

## Production freeze and regression

Production `public/native-shell/host.js` is exactly the approved v3 SHA650c436657fb0eba7f1b995db4ca6017c7dbcf2d46876380473a3cfd0b6186a9. The change is limited to the helper; Rooms, Spotlight, CSS, focus, DPR, images and effect cadence are unchanged.

`node --test tests/native-host-entrance.test.js` passes3/3 against the production private helper: original three rendering opportunities/all-effects capture, resumed live clock with surviving owned child release, and inert older/closed callbacks. `tests/browser/native-entrance247.cjs` is a compact current-production native-DOM correctness regression with trusted initial tap, programmatic rapid reversal and native-hidden authoritative launch ACK; no timing performance claim. Its WebKit and Chromium current-production runs both pass with the same host SHA: trusted first tap/decoded art/retained underlay, rapid close→reopen live clock and cleanup, and a hidden launch ACK during the old hold with zero hidden play/WAAPI/detail style reads and no revived popup. Reports and inspected settled images are in `output/playwright/performance247/phone/production/{webkit,chromium}-report.json` and `*-detail.png`. These production screenshots retain violet material, decoded art, centered description, green Play, animated priority Controller border and visible blurred underlying Host Pick/discovery.

Reproduce the compact regression from the repository root with `PARTY_PLAYWRIGHT=/path/to/playwright QA_ENGINE=webkit QA_OUTPUT=output/playwright/native-entrance247 node tests/browser/native-entrance247.cjs`, then `QA_ENGINE=chromium` (this harness uses the installed Google Chrome binary). It starts its own local fixture server. No browser or benchmark process remains running at this handoff.

Source freeze files: `public/native-shell/host.js` SHA650c436657fb0eba7f1b995db4ca6017c7dbcf2d46876380473a3cfd0b6186a9; `tests/native-host-entrance.test.js` SHA9b4bd56110fbafe1f8478fd820edb892632614793f36fcdad975d7e8a909169e; `tests/browser/native-entrance247.cjs` SHA33d92e72d22f36f29b2f0a0c008b0ef2c52ea63352f11a0fc96e168e917683c1. No commit, push, build or device action was performed by this lane.
