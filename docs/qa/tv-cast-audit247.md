# TV/cast scheduling audit247

2026-10-09. Production-source audit on accepted main87dd64f, followed by the narrowly approved Host Pick CSS pause guard below. No iOS edit, resolution reduction, measured GPU improvement or physical-device acceptance is established by this lane. Root owns the native build and device measurements; the separate popup/game agents own their lanes.

## Current evidence boundary

The fresh physical build147 log `.localparty-build/integration148/147-before.log` reports the phone menu at402×874 around55–58fps, eight running CSS animations, `thermal=serious`, and no fresh TV rows. This is a warm-device standalone snapshot. It does not prove that casting, these eight animations or the app caused the thermal state. Build148 is the root's accepted-source baseline.

The prior246 WebKit matrix proved stable TV sidebar content anchors and decoration lifecycle across720p/1080p/4K/16:10. Its full source-specific acceptance remains in `docs/qa/tv-layout246.md` and `docs/qa/visual-review246.md`. Chromium and actual native receiver rectangles remain separate gates.

## Concrete redundant paths and tests

1. **Room bridge delivery precedes every snapshot guard.** `ios/LocalParty/LocalPartyApp.swift:853–884` calls `publishRooms()` before `menuReady`, payload backpressure and `lastPayload` checks. `publishRooms():922–933` rebuilds the same dictionaries and calls `callAsyncJavaScript` on both persistent WKWebViews even when the room list/destination is unchanged or one view is hidden. The JS rooms module eventually deduplicates by serialized room signature (`public/native-shell/nearby-rooms.js:140–145`), after crossing native→WebKit. Count the two native calls and time argument construction separately while idle, while changing roster/phase and while switching destination. Any future deduplication must invalidate per-document delivery on reload/navigation, retain immediate selected-room/rename updates and deliver retained state when a hidden view returns.

2. **The full native payload is encoded before equality.** `LocalPartyApp.swift:858–880` JSON-encodes state, encodes catalog again and creates sorted full JSON before comparing the string. `objectWillChange` schedules publication (`:719`) and `updateUIView` also invokes it (`:727`); the existing in-flight guard coalesces JS delivery but only after `publishRooms`. Count publication requests, full serialization, changed deliveries and coalesced requests. Do not remove the acknowledgement/retry state machine or assume a900ms unchanged server poll publishes: `ServerModel.swift:157` already guards equal state.

3. **Roster fitting performs write/read iteration.** `public/tv.js:453–462` first unhides all rows, reads card scroll bounds, then hides rows one at a time and rereads `scrollHeight/clientHeight`. A16-player fit can force multiple synchronous layouts during roster, selection or receiver geometry crossings. The fit key includes selected/browse classes even though246 normalized their content capacity. Measure fit invocation count, `Layout` count and total duration across1/16 players and a selected↔browse crossing. Only simplify if the same overflow-chip count and all sidebar cards remain visible in the four ratios.

4. **Parent/child game geometry can cause repeated fit passes.** `tv.js:394–432` writes stage geometry, reads offsets/rectangles, writes iframe size, then reads parent/iframe/child anchors. Scheduling is once per rAF, but identical inline geometry is assigned repeatedly. `public/bridge.js:37` posts `party-tv-layout` on every composition callback; `:46` observes ancestors and each sibling of authored HUD anchors. The child ResizeObserver can be awakened by parent iframe fitting. Measure parent fit runs, child layout messages and `Layout/UpdateLayoutTree` in a steady active game. A dependency loop is a hypothesis until counts are observed; the existing rectangle/signature guards prevent many actual data changes.

5. **Information/show update work has several sources.** The250ms clock (`tv.js:471`) calls `information()`. Every worker `game-ui` message also runs `hud→clock→information` and `show.update` (`:387`); the `party-tv-information` event provides another path (`:447`). Some attributes/styles are guarded, but formatting and metrics allocation still recur. `tv-show.js:159` unconditionally replaces hidden QR hint text and `:224–234` requests a layout rAF even in active games, when `followFocus` immediately returns. Count DOM mutations and JS work during the same worker snapshot, especially `information()` pips/readout and hidden overlay text. Preserve clock-driven countdown freshness and worker-driven score updates.

6. **Broad decoration observers can add work to unrelated DOM changes.** `public/tv-art-visibility.js:34` rescans all catalog art for every subtree child-list batch, including text replacements. `game-logo-renderer.js:47` queues all descendant logos when a watched ancestor class/open attribute changes. Its raster cache avoids drawing identical bitmap keys, but geometry/ancestor-style reads occur before the key check (`:14–31`). Measure callback/queued-logo counts and actual canvas writes separately. Catalog wordmarks already skip canvas replacement, preventing the earlier blank-card regression.

## GPU hypotheses requiring a trace

- `public/branding.css:287` leaves a full-receiver hero bitmap with `filter:blur(14px)`. Static blur may cache; the source alone does not establish repeated painting.
- Later `public/tv-home-premium-20261004.css:56–68` restores two wide, softly masked header backdrop planes (`blur(12px)` and `blur(4px)`), overriding earlier no-blur performance rules. Moving content beneath them may invalidate sampling. Preserve the approved soft wall/material before considering an alternative.
- TV CTA/rim energy (`public/tv-discovery.css:88,134`) animates a registered angle consumed by `conic-gradient`. Phone equivalents are `app-ux-20261005.css:492–539` and `host-pick-art172.css:111`. This may repaint the ring each frame; a stationary ring mask with a rotating prepainted conic texture is the isolated experiment below.
- Two ambient premium props become opacity0 in selected/browse states while their drift animation remains alive (`tv-home-premium-20261004.css:34–41`). Actual games hide them with `display:none`. This is a small remaining compositor candidate, not evidence for one-second stalls.
- Receiver CSS zoom is1/1.5/3 at720p/1080p/4K. Logo canvas backing size multiplies zoom by devicePixelRatio, capped only for DPR at3. The game iframe already caps its physical width at1920; menu layers intentionally remain sharp at receiver resolution. Measure actual DPR, layer dimensions and raster area; do not silently lower resolution or shrink art.

## Existing safeguards verified in source

The persistent native visibility scheduler (`public/native-shell/visibility.js`) parks rAF and pauses CSS/WAAPI motion before retained loops start. Native host state reconciliation defers visual DOM rendering when UIKit hides the WKWebView (`host.js:13–16,425`). Shared same-WK Host tab keeps the catalog laid out under its opaque panel deliberately (`tabs.js:17–25`); `aria-hidden` alone does not suppress all rendering. Its CTA/spotlight visibility checks and modal foreground rules already pause much background energy. Do not replace retained content with `display:none` without the return-paint/scroll evidence that led to this design.

ExternalDisplay's SwiftUI view does not evaluate JS on every body update: `PartyTVContent.task(id:)` loads only when URL/boot/reload changes and representable `updateUIView` is empty. Initial scene activation no longer reloads twice; subsequent scene reactivation explicitly reloads (`ExternalDisplay.swift:37–44`). Its WKWebView is nonopaque, which is a compositor hypothesis only. Native loading backdrop/logo decode from disk in their bodies is transient while loading; it is not an established idle cost. TV celebration canvases are already bounded to1280/960 widths,20fps and a finite podium run; no general idle celebration leak was found.

## Ignored isolated energy experiment

The immediate priority became a narrower native pause-guard assertion. `host-pick-art172.css:111` uses a two-ID important animation shorthand, which includes `animation-play-state:running`; the shared variable pause rules have no IDs. The unavailable rule only fades opacity. Native hidden-layer and modal-specific overrides already have stronger precedence.

The ignored `.localparty-build/energy247/native-guard.cjs` proved the cascade defect in both engines using actual `LocalPartyHost.update` state (`native.working=true`), a viewport-clipped action, native-hide/resume, reduced motion and an actual Rules modal open/close. Disabled and offscreen actions requested `--hp-cta-play:paused` while the original pseudo computed `running` and its timeline continued about180ms per180ms sample. The equal-selector candidate paused both cases, held the painted angle and animation timeline, and resumed each enabled transition. The existing native-hidden/modal pause and reduced-motion removal remained intact. No GPU savings or physical-device improvement is claimed.

Final reports: `output/playwright/energy247/native-guard-webkit/report.json` (`ok:true`,24 records including two fixed-phase records) and `native-guard-chromium/report.json` (`ok:true`,22 lifecycle records), both with zero JavaScript errors. Two fixture repairs preceded these final passes: serve the native HTML/CSS route explicitly because the public server intentionally does not expose native-shell routes, and sample after availability transitions/animation readiness rather than treating WebKit's unsettled `CSSAnimation.currentTime` readback as the painted phase. Running assertions use the animation timeline; paused assertions additionally require unchanged registered angle.

The active round Play ring and halo were frozen at108degrees. Their216×216 physical crop is pixel-exact in WebKit (MAE/max0), and differs by at most one channel value in Chromium (MAE0.00449/255,max1). Both crop pairs and scene/detail originals were independently inspected by the reviewer. The entire WebKit strip differs at unrelated left art edge rasterization (baseline jagged, candidate smoother), so exact parity is scoped to the CTA ring/halo. Full-scene captures deliberately freeze motion and contain an overlapping discovery crossfade; they are diagnostic isolation captures, not settled gallery/popup UI acceptance. `output/playwright/energy247/accepted-guard-manifest.json` records sources, cases, screenshots, pixel proof and the accepted production/fixture hashes.

After the root approved the two-engine computed/pixel proof, `public/host-pick-art172.css` received only three rules: the equal-selector shared play-state request, explicit disabled/unavailable pause, and reduced-motion pause. Gradient, masks, bloom, geometry, all art and animation duration are untouched. Production SHA-256 is `6539a49801c0c531c3ec878ab52333ebe044ac8ecd3eac0b6a4caeba53f07d2f`.

The compact production-only regression is `tests/browser/host-pick-energy247.cjs`; run separately with `QA_ENGINE=webkit` or `QA_ENGINE=chromium`. It asserts actual pause/resume, retained phase after disabled/offscreen/native/modal holds, motion removal and source/fixture manifests. Syntax and diff checks passed. Its post-patch run awaits another root browser slot; the browser slot was released to the phone lane immediately after the final proof. The tested ignored override is text-identical to the appended production rules.

Files `.localparty-build/energy247/probe.cjs` and `texture-fixture.cjs` are ignored QA fixtures, not production changes. Syntax checks passed; this broader texture experiment remains unrun and parked. It was not promoted to production.

Commands (each engine has its own fresh real server):

```sh
QA_ENGINE=chromium QA_SCOPE=smoke node .localparty-build/energy247/probe.cjs
QA_ENGINE=chromium node .localparty-build/energy247/probe.cjs
QA_ENGINE=webkit node .localparty-build/energy247/probe.cjs
```

The fixture snapshots JS/CSS/HTML route bodies for the run and records source hashes. TV uses real sockets/management and actual menu targets: empty discovery CTA, selected round Play and selected-card purple rim at720p/1080p/4K. Native-shell targets use an explicit bridge/state fixture at402×874,DPR3: discovery Play, Host Pick and the detail violet CTA. This is not native app measurement.

Both variants retain the button/card, existing bloom and fixed rounded ring contour. Current uses the authored angle animation. Candidate draws the same stops once in a diagonal-sized centered square and rotates that texture behind the stationary original mask. A card retains its authored ring parent; a CTA gets an equivalent fixed masked child. Rectangular rotating contours are not acceptable. All other infinite motion freezes at phase0 only to isolate the rim's paint cost. Captures at0/90/180/270degrees, enlarged pixel diffs and full-scene originals accompany the trace. Chrome reports Paint/RasterTask/Layout; WebKit reports pixels and rAF distribution, not compositor/raster timings. Equivalent appearance, reduced-motion/visibility/reload behavior, realistic all-effects performance and physical casting still need validation before adopting any candidate.

## Native cast numeric expectations

The10-second diagnostics already include stage/lobby/sidebar/People/Top rectangles in physical CSS coordinates; no player text is needed. Normalize `logicalY=(physicalY-stageRect.y)/stageScale`. Selected and browse sidebar border boxes intentionally differ; compare **content** anchors and free-space centering, not their border top.

| Receiver | Stage logical size | Scale | Sidebar x,width logical | Join top | People top | Top top sparse/full |
| --- | --- | --- | --- | --- | --- | --- |
|1280×720|1280×720|1|998,258|86|287.59|468.80/526|
|1920×1080|1280×720|1.5|998,258|86|286.93|468.46/526.46|
|3840×2160|1280×720|3|998,258|86|287.60|468.80/526|
|1600×1000|1152×720|1.38889|870,258|85.98|286.97|468.46/526.43|

The sparse People height is roughly130logical pixels, full roster roughly224–225. The full roster retains three names plus+13 and Top ends near714. Browse sidebar logical y84,h630,padding-top2 and selected y60,h654,padding-top26 give the same content top. At1080p/16:10 WebKit fractional border rounding accounts for subpixel-to-one-pixel differences; comparisons need tolerance. At4K selected physical sidebar should be2994,180,774,1962 and full Top y1578,h564; an added native safe-area/inset or root resize error would be visible in these numbers. Actual casting does not inherit browser proof without fresh receiver rows.

The ready Chromium counterpart of the23 WebKit246 captures is `QA_BROWSER=chromium node scripts/capture-tv-layout246.cjs`. It includes source removal, real Curling launch, selected/browse/sparse/full roster, receiver resizes/reconnect, golden coin glints, motion gates and private numeric diagnostic fixture. It remains unrun in247 pending the root's browser slot.
