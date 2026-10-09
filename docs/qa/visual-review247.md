# Independent visual review 247 — bounded review frozen

Baseline: integrated `main` `87dd64f`. Production source is read-only in this lane. This report does not carry acceptance forward from round 246. Skills used for review: `mobile-native` and `animate`; browser captures do not establish physical iPhone, keyboard, haptic, GPU or active-casting performance.

## Popup prototype: viewport pseudo-backdrop rejected

Reviewed 34 original screenshots individually using `view_image` from `output/playwright/performance247/popup-backdrop/`. The first experimental candidate is route-intercepted fixture source, not a production change. It preserves the shared material/geometry but is **not suitable to ship**: WebKit renders the background sharply through and above Rooms, Bots, game detail and profile. `backdrop-filter: blur(8px)` in computed styles and `report.ok: true` do not establish rendered blur. The worker also rejected this candidate before this independent review.

The current baseline visibly blurs the same underlying header, Host Pick, discovery logo, Play/search and catalogue. Those elements remain present in these captures; the worker's before/after geometry assertions are separate automated evidence. Rooms uses centered lavender explanatory text, the own-room expander shares the player row and Connected's right inset, the native lone Back is centered, and the controller Back shares the Players/Rankings row. Visible CTA halos and Back rims are not clipped in the reviewed settled Rooms frames. The profile material looks dense at 93%, as specified; the reviewed foreground input, paired photo actions and Save/Back grouping remain readable. No real keyboard capture was provided.

In Chromium, the experimental Rooms backdrop does blur at mid/settled. Its arrive frame shows overlapping sharp/soft lettering while the fixed-radius blur plane fades in. This is not evidence that WebKit or native casting works, and it does not supersede the WebKit rejection.

### Exact viewed screenshot IDs

Every ID below is one PNG; no other images or WebM frames are implicitly included in this review.

| Surface/case | Current baseline IDs | Experimental IDs | Observation |
| --- | --- | --- | --- |
| WebKit controller Rooms | `webkit-current-controller-rooms-arrive`, `-mid`, `-settled`, `-exit` (same full prefix) | `webkit-viewport-backdrop-controller-rooms-arrive`, `-mid`, `-settled`, `-exit` | Current blur is visible; experimental background stays sharp during all three sampled opening states. |
| Chromium controller Rooms | `chromium-current-controller-rooms-arrive`, `-mid`, `-settled`, `-exit` | `chromium-viewport-backdrop-controller-rooms-arrive`, `-mid`, `-settled`, `-exit` | Both soften the settled background; experimental arrival shows a sharp/soft blend. |
| WebKit controller profile | `webkit-current-controller-profile-arrive`, `-mid`, `-settled`, `-exit` | `webkit-viewport-backdrop-controller-profile-arrive`, `-mid`, `-settled`, `-exit` | Current background is softened; experimental logo/header/catalogue text remains sharp. |
| WebKit native Bots | `webkit-current-native-bots-mid`, `-settled` | `webkit-viewport-backdrop-native-bots-mid`, `-settled` | Current description is centered/lavender with actual blur; experimental header, Host Pick and catalogue remain sharp. |
| WebKit native game detail | `webkit-current-native-rules-mid`, `-settled` | `webkit-viewport-backdrop-native-rules-mid`, `-settled` | Current underlying art softens and traveled art resolves by settled; experimental underlying logo/text stays sharp. |
| WebKit native Rooms | `webkit-current-native-rooms-settled` | `webkit-viewport-backdrop-native-rooms-settled` | Current lone Back is centered and blur visible; experimental background sharp. |

Suffix notation in this table always expands the immediately preceding full case prefix, preserving exact screenshot IDs. Each filename ends in `.png`.

### Timing and evidence limits

The harness schedules arrive after 50 ms, mid after a further 70 ms, settled after a further 650 ms, and exit after 65 ms from the close helper. `page.screenshot` itself adds time and can cross a phase boundary. These labels are sampled states, not exact presentation timestamps or an all-frame filmstrip review. Existing JSON rAF samples record attributes/filter/opacity, but not the screenshot start/end time or panel transform. WebM files were not played in this lane.

The current WebKit Rooms exit PNG shows an absent foreground panel with remaining background softness; the Chromium exit PNG still shows the sheet title at the bottom while the background softens. Both are intermediate captures. The report samples finish with cleanup: for controller Rooms, active-to-removed spans approximately 207 ms in WebKit and 183 ms in Chromium. This does not prove a prolonged post-exit blur delay, nor synchronized presentation on every frame. The next candidate needs exact click and screenshot start/end timestamps plus panel-transform and veil/blur/shade samples before such a claim.

The native checker diagnostic is useful only with a valid sharp probe. Its Chromium native sharp-energy value is anomalously below the blurred value, so that ratio cannot be used as a blur acceptance metric. WebKit controller diagnostic attenuation (current ≈0.16, experimental ≈0.62) supports the visible WebKit failure; it is not a device/GPU benchmark.

Frozen capture report hashes: app-ux JS `48e142115740a2e9f29f075b23a496f56987f106404b50f268bd7c0a7301cba0`; CSS `4c81a3777d26b991a1ef8a4eddfea3e2421008e9e21d8f17c8e22e638d0ca8ae`; native host JS `2da337922c816df902fa51876531ad4d3dbe99af20363e8a61944ba39cc6592f`. Reports are `webkit-report.json` and `chromium-report.json` in the artifact directory. Their success status validates the stated harness assertions, not pixel blur correctness.

The read-only reconstruction from those same current base bytes and `scripts/popup-backdrop246-fixture.cjs` produces experimental JS `fd822cb04bb27b35395dd8c63551d11840dbfdce8d7284018ab5813735ef7c21` and CSS `c51db7f0dc08cd913a489f656a919c88068839df94328b3e9073413af7b03ced`; the fixture hash is `fac17e29f019c6b1432e8d14da60341684d5cb5b85acc63917939e46741b738a`. These hashes were reconstructed during review, rather than recorded as effective bytes by the original capture driver.

The popup owner confirmed that the old driver has no exact presented clock or post-cleanup PNG. The next driver will record event/performance time, screenshot start/end, panel transform/opacity and veil blur/shade, and will capture post-cleanup separately.

## Popup prototypes: actual DOM planes also rejected

Independently reviewed 12 original PNGs in `output/playwright/performance247/actual-firstlevel/`:

- `webkit-{current,actual-veil,actual-bodyveil}-controller-rooms-settled.png` and the same three variant IDs for `controller-profile-settled.png` (six originals).
- `webkit-current-controller-{rooms,profile}-{arrive,exit,post-cleanup}.png` (six originals).

Both actual-plane variants are **rejected**. Header, tabs and Pocket Strike lettering remain sharp above and through Rooms, and behind the profile photo/actions. The current source softens those same pixels. This independently confirms the owner's rejection of both placements. The strong checker is valid in this new run: sharp energy 124.787, current ratio 0.00475, both actual-plane ratios 0.55715. It agrees with the actual images; it does not measure device cost.

The new driver records trusted click time and screenshot start/end poses. Current Rooms arrival spans +81 to +242 ms; the image shows a partially raised sheet over softened retained content. Current profile arrival spans +101 to +254 ms; foreground remains readable while the underlying logo/header softens. These intervals bound capture work, not the exact presentation instant of each PNG.

The current exit pictures show an absent foreground sheet with some remaining softness, but both exposures cross cleanup: Rooms starts +79 ms and ends +218 ms from the close click; profile starts +74 ms and ends +248 ms. They cannot prove that blur persists after cleanup. Separate post-cleanup pictures are sharp with underlying controls retained. Their capture bounds are Rooms +442 to +546 ms and profile +478 to +591 ms, with `open=false`, `active=false`, `present=false` and no branch-blur markers. No prolonged post-cleanup blur delay is established by this evidence. All-frame synchronization remains unreviewed.

Effective candidate hashes from `actual-firstlevel/webkit-report.json`: actual-veil JS `3b3579bb5b871b7ae2dc67588e64b9ab488268114061289081a7e5544bea56ba`; actual-bodyveil JS `6809e082a2e87eeee6350f6c142a249944afefac8a04beb0062166e0bbc34e1a`; shared candidate CSS `86dbc302ce299608d879c6817b388329a4c14e79af027138871ecdf96e9fcd09`. Current hashes are the baseline hashes above. This run is WebKit/controller only; the WebM files were not played here.

### Independent WebKit blur capability control

After the alternative rejection, the popup owner removed all HeyPals source and tested minimal full-viewport stripes. This reviewer viewed all eight originals in `capability-headless/` and `capability-headed/`, each containing `webkit-sharp.png`, `webkit-branch-filter.png`, `webkit-body-static.png`, `webkit-dialog-backdrop.png`.

Both headed and headless `filter: blur(8px)` controls flatten the stripes into gray. Both static body backdrop and native dialog backdrop preserve sharp stripe edges while dimming them. The valid checker ratios agree: branch filter 0.0000213; both backdrop paths 0.733333. Thus this failure reproduces outside HeyPals CSS/ancestors and cannot be attributed only to an app cascade defect. It establishes a capability limitation in this WebKit engine/capture path, not actual WKWebView behavior on an iPhone. The experimental path remains rejected at the current browser artifact gate; a real WKWebView pixel test would be required before replacing the working branch-filter fallback. No cost/performance claim follows from this control.

## Native first entrance: finite-only experiment not promoted

The owner decoded all eight baseline/finite-v1 videos into 2,110 original 25 fps frames. This reviewer did **not** inspect all 2,110 frames or approve every transition. The manifest is `output/playwright/performance247/phone/finite-pairs/original-frames/manifest.json`; source frames below use exact original video PTS ticks, not interpolated frames. Video PTS has no explicit anchor to click/performance time in this run, so JSON rAF timings and recorded pixels must remain separate evidence.

The finite-v1 source changes the first hold to finite, non-pseudo dialog effects, resumes after two rAF opportunities, and skips resumed dialogs. Production host SHA is `2da337922c816df902fa51876531ad4d3dbe99af20363e8a61944ba39cc6592f`; isolated finite-v1 SHA is `01791c7a687d62768b7f8f6d76d1c491e286217d56747c1190f2c7a533a85c16`. Root rejected this experiment for promotion. A subsequent candidate must receive its own lifecycle and pixel review.

Original reading-aid contacts viewed: WebKit finite-1 `contact-00050.jpg`, `-00090`, `-00170`, `-00210`; WebKit baseline-1 `contact-00050`, `-00090`; WebKit finite-2 `contact-00050`, `-00090`; WebKit baseline-2 `contact-00050`, `-00090` (ten contact sheets). Each is in the matching video subdirectory of `original-frames/`. The earlier 5 fps aid with index-derived labels is excluded from acceptance references because its labels do not preserve original PTS alignment.

Fourteen original PNGs viewed individually:

| Video subdirectory | Exact frame IDs | Observed limit |
| --- | --- | --- |
| `webkit-finite-1` | `frame-00068`, `-00069`, `-00070`, `-00071` | At PTS 2.76 the background is blurred with no sheet; at 2.80 the sheet is nearly in its final pose. No intermediate panel pose is visible in this recorded pair. |
| `webkit-baseline-1` | `frame-00124`, `-00126`, `-00128` | Warm opening shows intermediate panel positions and blurred traveling art across PTS 4.96–5.12. |
| `webkit-finite-1` | `frame-00122`, `-00123`, `-00126` | Warm opening changes from blur-only at 4.88 to a nearly final sheet at 4.92, with traveled art still blurred before resolving. |
| `webkit-baseline-2` | `frame-00113`, `-00114` | Warm opening retains lower/intermediate panel poses at PTS 4.52/4.56. |
| `webkit-finite-2` | `frame-00123`, `-00124` | Warm opening changes from blur-only at 4.92 to a nearly final sheet at 4.96. |

Suffix notation expands the preceding `frame-` prefix; each filename ends in `.png`. Cold openings also jump between recorded poses in baseline-2 and finite-2 contacts. Thus the cold jump is not attributed to the candidate: recorder omissions and long rAF gaps remain possible in both. The paired warm frames, however, do not support approving smoother first-entry motion for finite-v1. This finding was reported to the phone owner and root.

The reviewed contacts retain the home/header/Host Pick/search/discovery under the blur and show restored source art after close. Those sampled pixels support content retention, not all-frame blur/flight continuity. JSON reports independently record retention, cleanup and reversal timing. WebKit reversal first-visible time improves from 1,513–1,562 ms to 355–356 ms in the controlled fixture; cold timings are variable (baseline 679/764 ms versus finite 499/885 ms). These are browser-fixture results, not native or casting acceptance.

### Narrow resumed-only v3: ownership patch approved with motion limits

Fresh runtime v3 host SHA is `650c436657fb0eba7f1b995db4ca6017c7dbcf2d46876380473a3cfd0b6186a9`. Its source diff preserves the original first-entry all-running subtree, 1 ms hold and three rAF callbacks. A resumed show skips the hold/rewind. Its ownership record releases only captured effects still in the current dialog animation set and ignores stale callbacks. It does not make rAF a proof of presentation.

Viewed all 16 paired PNGs in `output/playwright/performance247/phone/resume-pairs/`: `{webkit,chromium}-{baseline,resume_only}-{before-firsttap,cold,warm,reversal}.png`. The pre-tap frames show actual decoded Host Pick art, search and discovery before interaction. The six final panels per engine preserve geometry, dense violet material, actual softened underlying controls, centered lavender description, game art, rounded Controls/How To Win and unclipped Play/Controller/Back. No visible endpoint regression was found in these pairs. Recurring energy/dot phase differs between captures; exact whole-scene pixel equality is not claimed.

The owner records trusted touchscreen first opening; rapid close/reopen uses programmatic buttons with actual callback times. V3 WebKit reversal events occur at open 0, close 132 ms, reopen 219 ms; Chromium at open 0, close 113.8 ms, reopen 200.3 ms. The reports mark cleanup and native-ACK cases passed. Independently read final WebKit reversal sample: `resumed=true`, art decoded/opacity1, flight0, no paused finite own clock, and live CTA energy running. The additional `resume-hidden` WebKit run is lifecycle-only, not a paired motion/timing acceptance.

Single-pair rAF first-visible results are WebKit baseline→v3 cold 632→571 ms, warm 641→522 ms; Chromium cold 131→114 ms, warm 115→113 ms. For reversal, the original `first` field can include a pre-close frame and is not the reopen metric. Independently read derived files use the last actual open event plus the first intersecting `resumed=true` sample: WebKit reopen delay 479→393 ms, Chromium 70.3→47.5 ms; settled after reopen is WebKit 649→393 ms and Chromium 236.6→221.2 ms. This supports the narrow browser reversal change, not a reliable cold-opening gain or smoothness. Click/rAF↔video PTS anchoring remains unavailable.

The owner decoded four v3/baseline movies into 1,257 original frames. During thumbnail review this reviewer misread a contact-grid timing. A current tile correspondence check resolved the mapping; all specific timing conclusions from the earlier contact reading were discarded. Root requested a clean unique decode, now frozen at `resume-pairs/original-subsets-v3-verified-1791550236692703000/manifest.json`. It records original WebM hashes, exact ffmpeg commands with input seek plus `-copyts`, encoder-verified video PTS, PNG hashes and lossless tile mapping. There are 12 subsets/320 original PNGs, without resampling or an invented click-clock anchor.

This reviewer opened 16 **direct originals** from that fresh unique directory:

| Video/subset directory | Exact viewed PNG IDs |
| --- | --- |
| `webkit-resume_only-1/cold` | `frame-00071`, `frame-00073` |
| `webkit-resume_only-1/warm` | `frame-00135`, `frame-00137`, `frame-00139`, `frame-00145` |
| `webkit-resume_only-1/reversal` | `frame-00224`, `frame-00225` |
| `webkit-baseline-1/reversal` | `frame-00205`, `frame-00207` |
| `chromium-resume_only-1/cold` | `frame-00044`, `frame-00046` |
| `chromium-resume_only-1/warm` | `frame-00094`, `frame-00096` |
| `chromium-resume_only-1/reversal` | `frame-00142`, `frame-00144` |

Each ID ends in `.png`. Two lossless fresh reading aids were also opened: `webkit-{baseline,resume_only}-1/cold/contact-00065.png`. The earlier v3 reading-aid contacts are excluded from the final gate.

Cold/warm direct frames show intermediate panel poses, softened retained underlying controls and blurred traveling art resolving in the foreground. Chromium reversal also records an intermediate panel/flight followed by a nearly final panel. In WebKit reversal, direct PTS8.96 (`224`) is a sharp home frame and PTS9.00 (`225`) a nearly final sharp-art sheet; baseline PTS8.20 (`205`) and 8.28 (`207`) have intermediate resumed poses. **Every-frame reversal smoothness is not approved.** Recorder omission/rAF gaps remain possible, and these PTS must not be interpreted as click-relative delays.

Four cleanup originals from the complete v3 decode were opened separately: `original-frames/webkit-resume_only-1/frame-00272.png`, `frame-00273.png` and `original-frames/chromium-resume_only-1/frame-00190.png`, `frame-00191.png`. Their manifest records exact video PTS. These restore the Host Pick source art, search, discovery and catalogue; Chromium transitions from some remaining softness to the sharp home. The lifecycle report separately asserts flight/dialog/branch cleanup, without identifying an exact presented cleanup instant.

The final bounded verdict is **approve the v3 ownership/resumed-clock patch**, preserving the original first-entry algorithm, material, geometry, art and underlying controls. No new visible material/layout/retention regression was found in the reviewed direct originals and before/final pairs. This verdict does not approve smooth cold opening, every-frame reversal/blur synchronization or physical casting. It was sent to root and the phone owner before their final production checks.

After the owner copied the exact approved helper to production (unchanged host SHA `650c436657fb0eba7f1b995db4ca6017c7dbcf2d46876380473a3cfd0b6186a9`), independently viewed `phone/production/webkit-detail.png` and `phone/production/chromium-detail.png`. Both final sheets retain actual blur, violet material, sharp game art, centered lavender description and unclipped rounded CTA/Back grouping. The screenshots are 1179×2556 and were displayed by `view_image` at 945×2048; exact native pixel parity is not claimed. The owner separately reports 3/3 ownership unit checks and both-engine compact production lifecycle checks passing. No new browser or device run was performed by this reviewer.

## TV curtain and readiness: sampled endpoints verified

Fresh strict baseline report `output/playwright/performance247/curtain-baseline-confirm2/report.json` records 14 rows and 36 captures. Earlier failed-oracle baseline folders are diagnostics. The corrected final oracle checks the expected committed scene/path/warmup plus repeated completion of finite entrances, excluding the recurring spotlight clock. This reviewer viewed four baseline-confirm2 originals: `chromium-bowling-launch-opening.png`, `chromium-bowling-launch-settled.png`, `webkit-bowling-launch-opening.png`, `webkit-bowling-launch-settled.png`. Both settled Bowling screens fully show logo, Preparing, phone hint, three bot pills and 0/3 Ready. Opening shots are intermediate, with some entrance content absent as expected.

The isolated WebKit readiness candidate adds asset/compile/first-render/GPU-fence readiness without changing visuals. All 11 PNGs in `output/playwright/performance247/curtain-readiness/` were viewed individually:

- `webkit-cold-menu-opening.png`, `webkit-cold-menu-settled.png`.
- `webkit-curling-launch-{closing,covered,opening,settled}.png`.
- `webkit-curling-return-{closing,covered,opening,settled}.png`.
- `webkit-reduced-return-settled.png`.

Four matched baseline originals were viewed in `curtain-mainrender-baseline/`: `webkit-cold-menu-settled.png`, `webkit-curling-launch-settled.png`, `webkit-curling-return-opening.png`, `webkit-curling-return-settled.png`.

No visible endpoint regression was found in those reviewed pairs. Curling settled shows the complete receiving logo/Preparing/bot roster/Ready count, with the large art's soft fade and no discovery-lamp leak. Cold menu retains the large background characters and soft mask behind Play. The selected return final and true reduced return have the circular game-art backing, full-width Host Pick, complete catalogue and sidebar roster, with no residual curtain seam. These fixtures have no rankings, so they do not validate populated Our Top placement. The candidate and matched baseline settled layouts agree in the inspected originals.

Covered shots have `phaseStable=false`: their capture interval crosses closed→revealing. They show a covered handoff but are not proof that the entire exposure remained in one phase. Opening/closing samples and final JSON assertions also do not establish every-frame smoothness, absence of a native compositor snap or active-casting behavior.

Effective-source manifest: `curtain-readiness/effective-source-manifest.json`. Production sports-siege host SHA `7ab73abff43801eb3879406eba154566b2bc920cb55d7d2290b97d28a60ba0a0`; isolated candidate host `985cc3e63a94e4371754325288cdfc4a260e6eb1c283ab992d46a193accd672e`; readiness helper `fbb680da756c3b035c0cf0cfcefdc7f0e741b7528985efa7350086ef991070cf`. Actually served trace-wrapped host hashes are baseline `9a572d2f66274de14aaeadcce81ef30bf25abecb56c7b311027a65ec22a35491` and candidate `57cd826ee6f11bb211a9172c6b2aa42fa0dbcd4f54225263df4392897071420f`. The same test-only renderer trace wrapper is used; no production source was written in that experiment.

### New neutral readiness: fresh paired endpoint approval

The owner changed the readiness source after that earlier experiment. This section reviews the new bytes independently; it does not transfer the earlier eleven-image approval.

Viewed all 16 original final PNGs across four repeated-run directories:

- `curtain-repeat-wk-{candidate,baseline}/webkit-cold-menu-settled.png` and `webkit-{curling,bowling}-{launch,return}-settled.png` (five per directory, ten total).
- `curtain-repeat-chrome-{candidate,baseline}/chromium-cold-menu-settled.png` and `chromium-bowling-{launch,return}-settled.png` (three per directory, six total).

Also viewed all nine fresh originals in `curtain-stage-smoke/`: `webkit-cold-menu-settled.png` and `webkit-{curling,bowling,swarm_gate,peek_shoot}-{launch,return}-settled.png`. These IDs are exact brace expansions, with no intermediate frames implicitly included.

The new neutral candidate has no visible **endpoint** regression in the matched repeated pairs. Cold menu preserves the large discovery logo, original background characters and their soft lower fade, First Play/player grouping, Play and sidebar. Launch finals show the correct receiving game logo, large scene-specific art with a soft edge fade, Preparing, phone hint, all three bot pills and 0/3 Ready. Return finals retain the circular art backing, full-width selected Host Pick, green circular Play with inset, complete catalogue and sidebar roster. No residual curtain seam or discovery-lamp leak appears in these reviewed finals. All four Stage aliases show the expected game name/art on launch and selected Host Pick on return. Endpoint approval was sent to root and the curtain owner for these exact neutral bytes.

WebKit return images visibly have jagged game-art edges, particularly the selected Curling medallion and catalogue art. This raster-quality limitation also occurs in the previously reviewed baseline/guard evidence; it is recorded without a causal attribution to readiness. The candidate/baseline geometry and masking remain consistent. These fixtures have no populated Our Top, so they do not validate that reported cast placement issue.

All five new reports have `status: passed` and empty errors. Repeated WebKit reports each contain nine rows/18 captures, repeated Chromium each five rows/10 captures, and four-id Stage smoke 17 rows/34 captures. The review above covers their **final** PNGs only. The worker's exact final scene/finite-entrance/initial clock assertions are separate automated evidence; no all-frame or gameplay-wide acceptance follows.

Effective routed hashes are explicitly recorded in each new `report.json`: neutral candidate host `d35be7c7f46bc8ab513de189c1ab73467f3679cac537918fd2e337ee9884d916`; readiness helper `e3b3da9637630b2761ac68d282d9ebfc32784b9ed2c5521d1c78fe98b976180a`; actual served trace-wrapped candidate host `8af6ff1253e35997874f91f3ff9b5e1dce80cbf505b9eaa1cf65e83d91703f73`. Matching baseline routed host is `9a572d2f66274de14aaeadcce81ef30bf25abecb56c7b311027a65ec22a35491`, based on the same production sports-siege host `7ab73abff43801eb3879406eba154566b2bc920cb55d7d2290b97d28a60ba0a0`. At capture time these were isolated routes with no production write. A production source copy requires its own four-id smoke; physical iPhone/casting, native compositor motion and GPU-cost approval remain outside this endpoint review.

### Production readiness endpoint follow-up

After integration and the separate unknown-state guard, viewed all nine fresh PNGs in `curtain-production-stage-smoke/`: `webkit-cold-menu-settled.png` and `webkit-{curling,bowling,swarm_gate,peek_shoot}-{launch,return}-settled.png`. The reviewed endpoints retain the same expected logo/art/Preparing/Ready and selected Host Pick/sidebar/catalogue layout, original soft art masks, circular backing and absence of residual curtain/lamp leak. The earlier WebKit card-art raster limitation remains visible. This is endpoint approval for this production smoke set, without every-frame/native/cast approval. No screenshots from `curtain-unknown-production/` are implicitly reviewed here.

This run uses actual production readiness/helper/HTTP routing, with no readiness candidate source replacement. It **does** retain a test-only host diagnostic wrapper: `runtimeOverrides` for all four aliases records served host `6103e4efdee271d4408ce0835d5ccf3bf27f7fc6082f39e15b634561630a21db`. Underlying production host SHA is `d3c72f68c1287d7e94ddc8401b7e6ab689a8c90b09a31f4bc2faf64c4109cd97`, helper `e3b3da9637630b2761ac68d282d9ebfc32784b9ed2c5521d1c78fe98b976180a`. The report has 17 rows/34 captures, passed status and empty errors; its authoritative first-waiting-state/ready/clock-zero assertions are separate automated evidence. Only the nine final images were independently viewed in this follow-up.

## Host Pick CTA guard: narrow appearance preserved

The TV/layout owner provided a different, narrow experiment after the conic-texture proposal: equal-selector animation-play-state guards for the **native phone Host Pick Play ring**. It keeps the authored conic gradient, mask and halo, and fixes disabled/offscreen scheduling. This is not a fresh TV-wide or shader optimization acceptance.

Reviewed ten originals in `output/playwright/energy247/`:

- `native-guard-chromium/{current,guard}-active-phase108-{detail,scene}.png` (four originals).
- `native-guard-webkit/{current,guard}-active-phase108-detail.png`, `{current,guard}-disabled.png`, `guard-modal-background.png`, `guard-enabled-after-modal.png` (six originals).

The active ring/glyph/rim and circular game-art backing retain their visible appearance. Chromium whole-detail parity report is MAE 0.00648/max 1; its ring-region report is MAE 0.00449/max 1. WebKit's 216×216 ring/halo region is exactly equal (MAE 0/max 0). WebKit whole detail has different game-art edge rasterization (MAE 0.518/max 151); exact whole-panel parity is therefore **not** claimed. Disabled violet material/backing and the restored green state after modal remain present in the inspected images.

The phase108 full scenes freeze a discovery crossfade: Pocket Strike/Who's Popping Up and their First Play/player metadata overlap. These are isolation diagnostics, unsuitable as settled gallery screenshots or discovery-layout approval. `guard-modal-background` is a blur/gating fixture with no actual foreground popup, not proof of real popup UX.

Both report files finish with no errors. Independently read samples reproduce current disabled/offscreen ring time advancing, and guard disabled/offscreen/native-hidden/modal time remaining constant. All enabled-after transitions resume the ring. Reduced motion records no ring animation. These are browser scheduling assertions, not measured GPU or native-cast gains.

Frozen baseline CSS hashes: host-pick art `30f3914f0c8f11c44b8b6775167c98c11e6a89fa0c5b560a41fbfc90fe65e2a7`, app-ux CSS `4c81a3777d26b991a1ef8a4eddfea3e2421008e9e21d8f17c8e22e638d0ca8ae`; host JS is the unchanged baseline above. The exact QA-only appended override is recorded in each `report.json`; production was untouched by that probe. The owner subsequently integrated the approved three-rule guard in production CSS (`6539a49801c0c531c3ec878ab52333ebe044ac8ecd3eac0b6a4caeba53f07d2f`). `accepted-guard-manifest.json` explicitly marks the production-only fixture rerun pending; those integrated bytes are not yet the source of the images reviewed here.

## Pending fresh evidence

- Narrow resumed-dialog/generation phone candidate v3: approved bounded ownership scope above; final production regression checks belong to root. No finite-v1/v2 acceptance transfers to it, and incomplete every-frame/native/casting evidence remains explicit.
- TV-wide energy repaint and populated Our Top/cast placement: no fresh independent 247 pixel/device review yet. The narrow phone CTA guard above does not establish them. Previous 246 menu/cast limits remain separate.
- Physical iPhone standalone versus separate-screen casting: root controls the device/build lane. This reviewer has no fresh physical-device measurement, real keyboard, haptic or display-output evidence.

No general “all UI/performance passed” conclusion is made.
