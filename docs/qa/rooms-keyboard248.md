# Rooms disclosure and keyboard248

2026-10-09. Baseline main `16ae1124d4cb30bb5e00d2e1d03973950e0e970a`, native Rooms SHA `44342ac1f2db9455a1e08b746f92bb4dc8a1115931581046fbbadfac98954064`. This lane applies the mobile-native skill and repository UI contract. It does not change the accepted247 host entrance helper, material/93% opacity, blur, authored spacing, effect quality or native keyboard policy. Browser fixture evidence remains separate from physical iPhone/casting acceptance.

## Baseline source and real flows

Rooms builds its sheet, tabs, code inputs and editor once. Discovery patches retained rows; opening Nearby, switching By Code and toggling rename do not construct the editor again. The trusted disclosure tap synchronously focuses the existing input, preserving iOS's keyboard activation opportunity. Shared `input-viewport.js` then fits the input-and-Save group on the next rendering opportunity and after280ms; actual viewport events also schedule it.

The first source audit noted that the grid disclosure transition belongs to `.nearby-rename`, above the input-group marker, so the shared transition-end listener does not specifically reconcile that ancestor. That observation alone is not a reproduced defect and no transition/focus change is approved on that basis.

Frozen102 public JS/CSS/HTML files and hashes are in `.localparty-build/perf248/rooms-before/manifest.json`; both sides of any candidate comparison use that same source/CSS baseline even after root's separate scrollbar patch. Assets retain their existing paths. Initial isolated native-host DOM flows inject the actual visibility/tabs scripts, use a fixture Swift bridge/catalog/discovery payload and trust actual room taps. The keyboard is an EventTarget visualViewport overlay fixture, not iOS's software keyboard.

| Initial diagnostic | Chromium393×852 / keyboard426px | WebKit320×568 / keyboard250px |
| --- | --- | --- |
| Native disclosure handler |1ms|2ms|
| New elements on opening/expand/tab switch |0|0|
|16 changing discovery updates while editing |0.6ms callback|No CPU-duration claim|
| Draft, row and focused input retained |PASS|PASS|
| Native rename request and ACK flow |PASS|PASS|
|65ms expand/collapse/reopen |PASS|PASS|
| Six digits and backward deletion |PASS|PASS|
| Settled input/Save above fixture keyboard |PASS|PASS|
| Close/reopen cleanup and underlying UI retained |PASS|PASS|

Those callback/read counters are diagnostic instrumentation, not presented frame rates or a paired performance improvement. Nearby first-open callback differs between engines/geometry (24ms Chromium,2ms WebKit); it includes modal setup/style work and creates zero elements. These figures do not explain a physical one-second stall as repeated editor DOM construction. Fresh initial Nearby/rename/By Code screenshots in `output/playwright/performance248/rooms/{baseline,baseline-short}` were opened. Nearby field and Save are visible and retain the existing bloom/material. Independent review found that the initial By Code viewport-only check missed a clipping ancestor: in the WebKit320×568 fixture, Connect’s lower half sits outside the scrollable form, under the footer. Back is visible in that exact original capture. The initial PASS is not full-action visibility acceptance; the stronger oracle now checks those real ancestors.

## Isolated candidate: live editor metadata reflow

A more specific hypothesis is being tested: while a draft is focused, discovery can change the own-room name or game/phase label above the field. Wrapped labels can move the field and Save under the list's clipping boundary without changing the input's own48px size. Shared keyboard reconciliation currently observes focus/viewport and ancestor visibility attributes, not that text reflow.

Ignored candidate `.localparty-build/perf248/rooms-candidate/nearby-rooms.js`, SHA `4e20dec7bf72659e54f7a8710c20ef48693905bce503244cc6e02524c318659b`, returns a changed flag from existing guarded `roomText` writes. Only when the focused, expanded own editor's name/game actually changed, it queues the existing `PartyInputViewport.ensureVisible` after the retained-row update. It keeps the current focus, caret/draft, DOM order, model ACK handling, styles and animation curves. No unchanged/count-only snapshot queues keyboard work.

The stronger oracle grew a valid room title/game label while preserving the focused draft and caret[4,9], checked every real clipping ancestor and captured that state. Both matched baselines passed. Consequently this metadata candidate is rejected: no reproducible defect justifies adding more keyboard scheduling. Nearby production remains its baseline SHA44342ac1. Both baseline and helper-only runs kept the draft/caret/focus, created zero elements, and100 identical updates scheduled zero public keyboard fits.

## Additional reproduced By Code clipping

The original `baseline-short/webkit-bycode-keyboard.png` visibly clips Connect despite its rectangle being above the synthetic keyboard boundary. The data-hp-input-group is the scrollable code form itself, but shared `fit()` begins with its parent, skipping that scrollport. Its oversized-group fallback also fits only the field and can omit the action. This is a concrete visual source investigation, not a measured physical-input latency cause.

Ignored helper candidate `.localparty-build/perf248/rooms-candidate/input-viewport.js`, SHA `12e19cf5569d1f1575cda19df8736dcdd86f0eab345f5f1d01f25e0ad42738b1`, adds the group’s own scrollport to the existing ancestor walk. For a long group, it uses the focused field plus action as its fitting bounds, retaining up to6px padding or reducing that padding just enough when the pair fits. It does not move focus, change the caret/digits/draft, reconstruct any element, or edit CSS/material/easing. The isolated paired clipping oracle passed in both engines. Root approved only this helper; it is now the production SHA12e19. Nearby remains SHA44342. Current-production profile-edit/Nearby/By Code regression also passed in both engines. Physical iOS keyboard acceptance is separate.

## Matched clipping gate and review

Fresh runs in `output/playwright/performance248/rooms/reflow-baseline` and `reflow-keyboard` use the same frozen102 files,320×568 layout and250px overlay (318px visible). Only the helper changes in the candidate. Both baselines reproduce the Connect clipping; both helper runs pass all recorded checks, including rename ACK,65ms disclosure interruption, close/reopen cleanup and retained visible underlay.

| Whole-action geometry | Baseline, both engines | Helper Chromium | Helper WebKit |
| --- | --- | --- | --- |
| Code scrollport |114.5–234px|same|same|
| Six cells |145.5–199.5px|116.5–170.5px|117.5–171.5px|
| Connect |209.5–257.5px, clipped|180.5–228.5px, visible|181.5–229.5px, visible|
| Back |242–290px, visible|same|same|
| Rename field+Save |156.28–204.28px Chrome;156.61–204.61px WK|same|same|

The existing disclosure callbacks remained about1–2ms and created zero elements; there is no latency/FPS improvement claim from these instrumentation counters. The helper walks one additional element (the group), with the additional rectangle reads required only for a clipped/oversized fitting case. Paired baseline/candidate fixtures do not establish physical keyboard or casting performance.

Independent reviewer opened the four matched By Code originals and four helper rename/metadata originals. It confirmed the entire Connect and Back are visible, six cells/rings align, material/fade remain, and the Nearby editor retains draft/caret/focus. Bounded source/pixel gate approved for helper12e19 only; no broad screen or all-frame approval was transferred. The metadata candidate is excluded.

## Native boundary and pending work

Read-only native audit: `LocalPartyApp.swift` `publishRooms()` rebuilds public metadata and invokes the JS update on both menu/controller; its source has no per-view Rooms-payload cache. The JavaScript no-op guard does not prove absence of native serialization/bridge cost. `rename-room` saves UserDefaults and sends an asynchronous renamed acknowledgement before republishing. No Swift change or physical ACK latency measurement was made by this lane.

No physical keyboard, haptics, full casting workload or broad popup-performance acceptance is claimed. Root owns device profiling/build/commit/push. The browser slot has been explicitly released to root and the Sports lane after all browser/server processes closed. Only the confirmed shared-helper fix is promoted; metadata/prewarm/entrance changes are excluded.

## Final production controller regression

Checked-in `tests/browser/keyboard248.cjs`, frozen SHA `4d818a05f44378e251de89a13c9009d07dded173b8c77c0c2d5e18270d10d7d7`, runs the actual `/play` app through an ephemeral server with both actual native controller bridge and persistent tabs. It checks one deliberately short320×568 viewport with250px synthetic visualViewport overlay, DPR1. It serves current production, including root’s shared scrollbar stylesheet, and records its source hashes. No candidate interception or lower-quality effects are used.

Both Chromium and WebKit final runs completed four states with zero failures/errors and exit0. Original images and reports are in `output/playwright/performance248/rooms/production-final/{chromium,webkit}`. Assertions in lines14–21 cover retained Nearby input identity/focus/caret[4,9] before/after discovery, actual native rename request, rapid disclosure final closure, six digits/last-digit focus, a trusted touchscreen tap80% down the Connect button and its real submit-status callback, retained digits/deletion,55ms close/reopen, cleanup of modal markers, profile draft/input identity/focus/caret[3,8], and keyboard geometry restoration. Full ancestor clipping bounds cover field+Save/Connect and Back; catalogue search is also sampled. This is meaningful shared-helper regression coverage, not proof of an online service.

The report records geometry/source hashes and empty failures, while `check()` records false predicates. Successful caret/status checks were not individually logged as raw scalar values. `production-final/assertion-manifest.json` explicitly links the unchanged executed harness and its line map to completed zero-failure runs; it records test/source/report/PNG hashes and original file-write UTCs. Those timestamps are artifact completion times, not input/presentation clocks.

Owner opened all eight fresh production originals. Independent reviewer also opened those exact eight originals and found no clipping/geometry/material regression: full Connect/Save/Back fit, fields and selected drafts remain, and blur/fade/rings are preserved. It requested explicit assertion provenance, which the frozen test and manifest supply; no raw-state dump or physical-device claim is substituted.

Run each engine explicitly, for example `QA_ENGINE=webkit PARTY_PLAYWRIGHT=<bundled-playwright> node tests/browser/keyboard248.cjs`, then the matching Chromium command. These checks are separate from the default npm suite. Source/diff check passes. Remaining acceptance is the actual iPhone keyboard/casting workload under root’s build150 review.
