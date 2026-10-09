# Popup performance246

2026-10-09. Baseline `db5e4f4`, branch `heypals/ux-polish`. This lane changes only `public/app-ux-20261005.js` and `public/game-ui-system.js`; the shared CSS, popup durations, blur radius, artwork and button styling are unchanged.

## Outcome

Removed redundant hidden-control measurements, repeated input-overlay writes and duplicate observer traversal from the shared popup path. Matched browser runs confirm those operations decrease, the existing profile/background geometry stays intact, and sampled dialogs clean up their blur markers after closing. They **do not establish a general input-to-visible improvement or physical iPhone/TV performance acceptance**. The normal 560ms sheet entrance remains intentional motion, not a delay removed by this patch.

Applied `mobile-native` and `animate` skills after reading their `SKILL.md` files. Read the repository design contract, UI regression rules, round245 integration/performance reports and shared-shell audit. Kept expensive preparation separate from motion and preserved interruption, reduced-motion behavior, the 93% matte material and real background blur. No build/install or device profiling was performed by this lane.

## Causal changes

- On mobile, control readability work ignores controls inside closed dialogs/hidden phases and controls without rendered rectangles before walking their label text and reading styles. An opening/hidden mutation queues them again when visible.
- Shared role classes, primary font-weight declarations and input glyph-overlay text/style are written only when they differ. Hidden fields defer glyph metrics until their visible resize/focus update; their input value and placeholder text still synchronize.
- An inserted subtree is enhanced once per mutation batch, even when its wrapper and children each have insertion records. Scroll fade observers collect unique changed nodes and determine affected scroll owners once per batch.

This addresses unnecessary CPU/style work. It does not change blur quality, hide the catalogue below a popup, remove Host Pick or spotlight artwork, shorten animations, remove art flight, or cut CTA effect cadence.

## Measurement method

`scripts/popup-performance246.cjs` intercepts tracked public HTML/JS/CSS from the frozen baseline; the candidate substitutes only this lane's four owned shared files. This prevents concurrent `app.js`, `host.js`, TV and native work from contaminating the comparison. The current script recreates that source snapshot from `QA_BEFORE_REF` (default `db5e4f4`) when necessary. Static assets and catalogue data are shared by the pair.

Viewport393×852, touch/mobile browser context. Native host and controller bridge/state/room updates are labelled fixtures. Chromium uses installed Chrome; WebKit uses the bundled Playwright browser. This is not a WKWebView, active receiver or physical keyboard measurement.

- Actual visible openers use trusted touch taps. Every hidden opener is recorded as `programmaticOpener:true`; those rows are diagnostics, not real UX acceptance.
- Pointer/click timestamps plus rAF viewport/rectangle/opacity sampling identify the first visual candidate frame. This samples browser rendering state; it is not a presented-device-pixel measurement.
- Settled time waits for finite subtree animations. Close cleanup requires both the dialog/profile to be gone and the shared background blur markers to be removed.
- Chromium CDP records accumulated task/script/layout/style work for each open+close. WebKit CPU fields are `null` because those counters are unavailable.
- Instrumentation counts computed-style calls, hidden calls and input-ink writes in both variants. Equal probe overhead exists in both; these are diagnostic counters.

One before/candidate pair per engine was run in the assigned measurement slots. Warm repetitions are exploratory, not a robust independent statistical benchmark. All106 recorded cycles completed with zero page errors:64 trusted-tap cycles and42 programmatic diagnostic cycles.

| Report directory under `output/playwright/performance246/popups` | Chromium | WebKit | Trusted paths |
| --- | ---: | ---: | --- |
| Root reports |32 cycles,16 trusted |32 cycles,16 trusted | Native Rooms, native game detail, native Bots, web game rules |
| `actual-targets` |18 cycles,12 trusted |12 cycles,8 trusted | Existing profile edit (`#editFromCatalog`), rankings (`#showStats`) |
| `actual-controller` | Not newly run |12 cycles,12 trusted | Native controller existing profile, players/audio (`#roomToggle`), rankings |

The initial root comparison used four hidden/programmatic entries: native technical `#openHost`, old web `#edit`, `#companyRoomOpen`, `#allRanks`. The corrected `actual-targets` players entry also used an intentionally hidden `#mobileRoomStrip`; its flag remains true. The final controller test uses the visible `#roomToggle`. No technical Host Panel button was restored to the product.

## Results and limits

For the four trusted root paths, one warm Chromium pair accumulated750.656ms task work before and706.876ms after (5.8% less). Hidden computed-style calls dropped258→230 and input-ink writes2→0. Native Rooms task work236.488→209.508ms was the largest individual decrease. These are a small exploratory sample; they are not a claim that the product is 5.8% faster or that popup latency is solved.

First visual and settled timing did not materially improve: Chromium Rooms remained about95–96ms/612ms, native game detail about130ms/646ms, Bots about45–46ms/212ms warm. The candidate preserves the intended entrance. WebKit changes were mixed/noisy; no engine-wide speedup is claimed.

Corrected visible profile entry reduced hidden style calls124→59 and ink writes6→0 in warm Chromium. Native-controller WebKit reduced125→56 and6→0. Profile first visual remained around46ms in Chromium and64–66ms in the native-controller fixture. Corrected controller players/rankings first visual stayed77/93ms. Candidate close cleanup was about195–212ms in sampled Chromium and186–242ms in WebKit, with no leftover blur markers. No global zero-lag promise follows from these browser results.

Every recorded foreground uses the same computed gradient with all three color stops at alpha0.93. Actual background branches have computed `blur(8px)` and active shared-modal markers; settled screenshots show softened/dimmed backgrounds where the sheet leaves them visible. A separate read-only validation of all106 saved rows checks material alpha, blur, error state and recorded cleanup. The latest harness also asserts the material on future runs.

## Existing profile and the nearly solid screenshot

Corrected profile runs assert this is an existing profile edit (`body.profile-editing`, `#onboarding[role=dialog]`), not initial onboarding. `#home`, catalogue, search, spotlight and Host Pick remain unhidden/displayed with exact before/after rectangles in Chromium and WebKit. For one web sample:

| Underlying node | x,y | width×height CSS px |
| --- | --- | --- |
| Home |15,133 |363×4741.171875 |
| Spotlight |8,135 |377×340 |
| Catalogue |15,562 |363×4050.609375 |
| Search |15,655.625 |363×44.390625 |

The foreground is near-fullscreen and93% opaque, with the shared shaded background behind it. It therefore looks dense violet even though the underlying catalogue has not been hidden or remounted. Pixel appearance alone cannot prove an alpha, so the captured computed material and retained-node assertions accompany it.

The recorded8px filter is applied to a home/lobby branch several thousand CSS pixels tall. That is a **possible raster/GPU investigation target**, not proof that the browser allocates a full-height GPU texture. This lane did not replace it with a bitmap, cut the radius, clip/hide offscreen art or change the blur system. A native layer/raster trace is needed before such a change, including scroll and nested-dialog transitions, cached-frame invalidation and exact visual preservation.

## Fresh screenshots inspected

Opened every root WebKit candidate screenshot and all six corrected WebKit screenshots with `view_image`; also opened Chromium profile. The independent visual lane receives the same final capture roots and checks them separately. Captures are settled browser fixtures, not animation/keyboard/device proof.

| Capture stem | Pixel review |
| --- | --- |
| `webkit-native-rooms` | Rounded matte sheet; blurred Host Pick/spotlight visible behind it. Own-room expander stays on the player-count row, names and Connected/Join are readable, single Back is centered. |
| `webkit-native-rules` | Push Pit art resolves sharp after the existing flight; centered lavender goal copy, rounded Controls/How to Win, aligned Play/Controller/Back. Background catalogue controls remain blurred. |
| `webkit-native-bots` | Compact rounded popup; centered heading and hint; readable count/stepper and disabled Start; actual underlying blur. Bots control-row labels retain their intentional alignment. |
| `webkit-native-host` | Diagnostic-only existing hidden opener. Rounded panel, centered explanatory copy/Back and paired utility grid. Cached fixture lacks server presentation controls; this warning is fixture state. |
| `webkit-web-rules` | Centered lavender descriptions, green headings, rounded rule/action groups remain within the sheet. |
| `actual-targets/webkit-web-profile` | Dense near-fullscreen material; avatar/name/language fields and Save/Back readable and unclipped. Captured assertions confirm93% material and unchanged underlying geometry. |
| `actual-targets/webkit-web-players` | Programmatic entry diagnostic. Roster/audio controls sharp, catalog blurred above sheet, centered Back. |
| `actual-targets/webkit-web-rankings` | Rounded intrinsic-height empty-history sheet, centered lavender text/Back, catalogue/Play retained under blur. |
| `actual-controller/webkit-controller-profile` | Real visible fixture opener. Native top/dock reserve retained; profile fields, Save/Back fit. Retained underlying header/spotlight stays blurred. |
| `actual-controller/webkit-controller-players` | Visible player/audio opener; roster/music/effects groups fit, single Back centered, native bottom reserve retained. |
| `actual-controller/webkit-controller-rankings` | Visible rankings opener; rounded empty-history bottom sheet, centered Back, underlying catalogue stays blurred. |

The root also has Chromium versions of its eight cases and corrected web profile/players/rankings. Empty rankings are a no-match-history fixture, not populated medal/coin acceptance. No new clipping or control disappearance was observed in these sampled pixels.

## Validation

- `node --check` passes both changed production files and the harness; `git diff --check` passes this lane's changes.
- Native-shell unit tests pass38/38. A combined normal-sandbox run with Nearby Rooms reached38/39: the Bonjour test timed out waiting for multicast state (`Bonjour state did not arrive`). It ran without escalation, so a sandbox restriction is possible but **not yet established**. Root was notified to repeat it in the permitted integration environment; this report does not label it a production failure or a pass.
- Browser reports all say `ok:true`;106 cycles have no page errors, actual blur and complete close cleanup. Corrected profile geometry assertions pass both engines and native-controller WebKit.
- No new physical iPhone, standalone-versus-cast, receiver resolution, real keyboard, haptic, populated-results or full-catalogue performance evidence. Room code/rename keyboard fixtures, confirmations and broader reduced-motion/reversal coverage remain root integration/previous245 checks, not newly covered here.

Candidate SHA-256: `app-ux-20261005.js` `48e142115740a2e9f29f075b23a496f56987f106404b50f268bd7c0a7301cba0`; `game-ui-system.js` `759b7d5dcb03cd0e955537e252d6b00566dbd5ac7e0a25140ea7aa902b73283a`. Both owned CSS hashes equal baseline; all reports retain their exact source hashes.

Reproduction (run each engine sequentially in the assigned browser slot):

```sh
NODE_PATH=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules QA_CYCLES=1 QA_ENGINE=webkit node scripts/popup-performance246.cjs
NODE_PATH=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules QA_CYCLES=1 QA_ENGINE=chromium node scripts/popup-performance246.cjs
NODE_PATH=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules QA_CYCLES=1 QA_ENGINE=webkit QA_MODE=controller QA_PATHS=profile,players,rankings QA_OUTPUT=output/playwright/performance246/popups/actual-controller node scripts/popup-performance246.cjs
```

Current harness selectors are corrected (`#editFromCatalog`, `#roomToggle`, `#showStats`). Older saved reports honestly retain the programmatic flags from their earlier selectors; a reproduction will not relabel those historical rows.

## Subsequent raster investigation — stopped at task replacement

Root received physical build147 standalone-phone Rooms data:42.3fps, p9573ms, max154ms,33 intervals over50ms and15 over100ms, while idle was approximately59.6fps/p9517ms. These are root-supplied physical aggregate figures, not this lane's measurements; the user reports that the opening itself feels worse than that10-second average. The prior browser work does not close this issue.

Read-only investigation found the shared background rule animates `filter` over180ms, despite its earlier comment recommending opacity/position only. Every background branch moves toward `blur(8px)` during opening and toward its original filter during closing. A visible controller Rooms background includes a4781px-tall lobby branch. A short Chrome trace isolated that radius transition from the accepted JS guards.

`scripts/popup-raster246.cjs` ran one actual native-controller Rooms open/close cycle for each of baseline, source-snapshotted current, and an injected `static-blur` CSS diagnostic. Reports, raw traces, LayerTree snapshots and JPEG filmstrip frames are in `output/playwright/performance246/popup-raster`. All three retained alpha0.93, settled8px blur, exact underlying geometry, and complete cleanup; no page errors occurred.

| Chrome trace action window | Current | Static-radius diagnostic |
| --- | ---: | ---: |
| Opening Paint duration/count |21.988ms/95 |17.758ms/93 |
| Opening RasterTask duration |5.609ms |5.275ms |
| Opening accumulated RunTask/max |405.990ms/30.270ms |390.588ms/28.091ms |
| Closing Paint duration |13.496ms |8.336ms |
| Closing accumulated RunTask |168.880ms |135.449ms |

These are one instrumented pair, summed named trace events across threads, **not wall-clock latency or physical GPU timing**. The trace includes equal rAF/computed-style probes and screenshot collection. No general opening-speed claim is supported, and the RasterTask difference is small.

Sampled current lobby blur took about200ms to reach8px. On closing, it finished becoming sharp in the same sampled frame as dialog exit, about200ms after the active flag cleared. Chrome did **not** reproduce blur persisting after the dialog had disappeared. LayerTree shows393×4781 lobby and393×4051 catalogue content bounds already present while idle; these are compositor geometry, not proof of full-size allocated GPU textures or a blur-caused allocation. `LayerTree.layerPainted` supplied no events in this run; paint/raster counts above come from the trace, not that callback.

The80-frame first-run filmstrip quota exhausted before current/static closing, so those traces contain opening/settled filmstrip images but no complete closing image sequence. Baseline contains only a partial closing sequence. The prepared driver raises that quota to240 for a future run; that amended configuration was not executed. Two prior setup failures occurred before Rooms actions: replacing server-injected `/play` HTML with raw `index.html` removed the player role. The successful trace preserves the actual server response. Those setup failures are harness errors, not app regressions.

The user's latest visual constraint explicitly requires blur to **progressively appear and disappear**. The injected static-radius diagnostic visibly jumps and is **ineligible for production**. No shared production CSS was changed or accepted from it.

Prepared, syntax-checked but **unrun/unaccepted** experiments:

- `scripts/popup-backdrop246-fixture.cjs`: route-intercepted source transform selecting one foreground viewport backdrop with constant8px blur and the existing opacity arrival/exit. Includes existing profile-backdrop/popover paths, nested foreground reconciliation and reduced-transparency CSS. It is not loaded by the application.
- `scripts/popup-backdrop-pixels246.cjs`: future Chromium/WebKit actual Rooms/detail/Bots/profile opening/mid/exit captures, underlying geometry/material checks and a small checker-stripe pixel diagnostic to distinguish blur from dimming alone. No resulting screenshots or WebKit pixel acceptance exist yet.
- `scripts/popup-raster246.cjs`: future trace variant support for that viewport-backdrop experiment. Its original baseline comes from the recorded ignored `.localparty-build/popup246/source-before` snapshot; recreate it with the main popup harness before any fresh baseline trace. If that snapshot is absent, the raster driver's fallback uses current sources and must **not** be represented as a historical baseline comparison.

The official [Chrome animated-blur article](https://developer.chrome.com/blog/animated-blur/) describes opacity crossfading cached blur textures; it is older guidance, not evidence that our WebKit pixels or nested dialogs behave correctly. [Web animation guidance](https://web.dev/articles/animations-guide) favors opacity/transform, while [WebKit's backdrop-filter introduction](https://webkit.org/blog/3632/introducing-backdrop-filters/) explains the backdrop filtering mechanism. Those sources informed the experiment only. No huge DOM clone, bitmap cache, clipping, effect removal or native-layer rewrite was implemented.

At the user's task replacement with Git integration, root instructed all production work to freeze. All browser/server processes from this lane are closed. The three prepared experiment scripts pass `node --check`; none is imported by application runtime or the default automated tests, and the source-transform helper is a normal repository file rather than an ignored candidate asset. Only the completed JS observer/input guards remain production changes in this lane. Physical action-window profiling, smooth-blur pixel acceptance, interrupted/nested/reduced-mode proof and candidate device validation remain outstanding.
