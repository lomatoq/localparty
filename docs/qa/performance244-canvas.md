# Canvas / Bow allocation lane 244

Date: 2026-10-07. Starting source is build 145, saved with SHA-256 at `.localparty-build/perf244/canvas-before/manifest.json`. This lane owns only Party/Tanks/Tabletop host renderers and Bow phone/Mini3D; no game rules, input cadence, CSS, shared scripts or image quality are changed.

Used the [performance-optimization skill](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md): measure a specific cause, isolate a change, compare like workloads, keep or revert, record both successful and discarded attempts. Browser measurements do not establish iPhone/AirPlay performance.

## Selected cause: Bow phone mesh churn

The authored Bow3D mesh depends on pull, recoil and handedness. `now` does not affect its vertices. The original path rebuilt roughly 7,400 vertices, converted all numbers into a new Float32Array and called WebGL `bufferData` on every phone frame, including frames with unchanged inputs. This is mesh/upload allocation, not shader recompilation: shader setup already happens only at creation/context restoration.

Candidate implementation:

- Retain geometry while pull/recoil/hand remain exactly unchanged. Changed inputs preserve all original triangle construction and lighting. Every frame still uses the original clear/draw path; draw frequency, DPR 1.5 cap, antialiasing and shader sources remain unchanged.
- Keep an exact-size typed upload view and 16-float projection view. Changed geometry fills every upload element; allocate GPU storage when size changes and use bufferSubData within that storage otherwise.
- Context restore marks the new GPU buffer dirty. Empty/growing/shrinking generic meshes use exact bounds; projection is recomputed on every render as before.

### Allocation fixture

`scripts/performance244-bow-fixture.cjs` executes frozen-before and candidate modules with the same mocked WebGL API and deterministic 150-frame sequence: settled aim, moving pull, left/right hand, resize and recoil, then actual context-loss/restore entry points and generic shrinking/empty mesh. Every submitted float vertex, draw count and projection matrix is hashed and compared exactly. This is a deterministic API fixture; it is not GPU timing, a real match or physical-device evidence.

| Fixture work | Before | Candidate |
| --- | ---: | ---: |
| Typed views constructed | 306 | 4 |
| Typed bytes allocated | 40,111,272 | 265,744 |
| Generated vertex submissions | 1,121,307 | 346,722 |
| Draw calls | 153 | 153 |
| Uploaded bytes | 40,101,480 | 12,747,564 |

All draw hashes/projections match. Final regression run passes 37 Bow assertions: three mesh/cache/lifecycle cases, one HUD guard case and the existing camera/lifecycle/preview/arrow/static-TV/tracking/hybrid/game rules. Actual native-route touch match, three sequential browser CPU pairs and exact Chrome/WebKit WebGL pixel comparison now pass as below. Physical camera/iPhone/cast acceptance remains separate.

## Other source candidates inspected, not implemented

- Party `fitPlayerName`, Tanks name truncation and Air Hockey name truncation repeat stable text metrics. A correct cache must key actual font/fit/width/name and invalidate loaded fonts; Party's live round-camera fitting can legitimately change the font. Label collision placement remains dynamic and must not be cached blindly. No CPU win is yet measured, so this lane has not added caches.
- Air Hockey mallet/puck material gradients are rebuilt per entity/frame, while rink sheen is already cached. Sprite caching risks changing subpixel antialiasing/soft shadows. A gradient-creation count alone does not establish a paint bottleneck. No material pixels or sprite density were changed.

## Attempt ledger

| Attempt | Measured outcome | Decision |
| --- | --- | --- |
| Bow retained stable mesh + typed/GPU storage | Exact deterministic draw output; typed allocation 40.11MB to .266MB across 150 authored frames | Keep: actual touch-game task CPU median 1.071s to .685s; exact pixels unchanged |
| CSS-hidden Bow display gate | Actual managed touch display is none; invisible GL draws fall 180/181 to zero per 6s. CPU neutral/noisy; no GPU timer | Keep as explicit unseen-rendering lifecycle fix, with recoil/input and visible restoration intact; no CPU speed claim |
| Bow HUD semantic write guards | Gate-only to gate+HUD task CPU .411s to .193s; layout count407 to6 in two actual-game trios | Keep: both independent runs improve and real score/arrows/draw/locale/hand/pause remain live |
| Party/Tanks/Air Hockey metric/material caches | Source candidates only, no isolated CPU baseline | Not implemented |

## Actual game workload and paired measurements

`scripts/performance244-bow.cjs` starts the real embedded launcher and Bow worker, actual 1920×1080 TV, two socket-connected players and a 393×852 DPR 3 phone with the production controller bridge/tabs injected through the native route. It enters touch mode through its real button, waits for warm-up, profiles six seconds of settled aim, then holds Draw 700ms, releases a real arrow, switches hand, resizes to320×568 and pauses/resumes the unchanged match. No authoritative match state is fabricated and no camera permission/tracking fixture is used. Runs are sequential; root granted an exclusive browser profile slot.

| Six-second phone tab CPU | Before1 /2 /3 | After1 /2 /3 |
| --- | --- | --- |
| Task seconds |1.071 /1.137 /1.063 |.658 /.685 /.785 |
| Script seconds |.574 /.600 /.574 |.195 /.197 /.219 |
| Layout seconds |.082 /.096 /.083 |.092 /.097 /.115 |
| Style seconds |.173 /.180 /.170 |.172 /.177 /.229 |

Median task CPU drops36%, script66%; all after tasks remain below all before tasks, beyond observed variance. Style/layout CPU is not improved and after 3 has higher incidental work there. Do not claim a whole-app multiplier or an FPS gain: all six samples already render360 frames/360 draws and p95≈16.7–16.8ms. Settled typed allocations95.63MB and GPU uploads95.61MB fall to zero after warm-up. Actual pull/recoil still upload every changed mesh (65–66 uploads through the draw/release sequence). Backing stays590×963; at 320 wide 480×537, same DPR cap. Zero page errors; authoritative shot accepted, score25/arrows9, same match instance through hand/resize/pause.

**Additional finding:** the approved shared rule `public/game-polish.css:781` hides the Bow3D canvas in managed touch mode while the phone still invokes its renderer. The measurements above are the real touch route and show savings in previously invisible mesh work; they are not measured camera-mode gains. The final semantic hidden-canvas gate was measured separately below and is not included in the original mesh-cache numbers.

`tests/browser/bow-mesh-pixels244.cjs` compares real WebGL framebuffer pixels from frozen-before/current Bow modules at320×568,393×780,780×393, right/left hand, pull0/.48/1 and recoil. All five states in both Chrome and WebKit have **zero changed channel values** and real nonempty bow artwork. Real WEBGL_lose_context loss/restoration completes without GL error. That fixture is intentionally separate from the actual touch match; it validates visible 3D output rather than camera acquisition.

Fresh actual after 3 TV, phone 393 Draw/release/hand and phone 320 captures were inspected with view_image. The 393 field/readouts/buttons/footer and TV markers/targets/scores remain intact. A 320 native baseline layout issue remains: Draw's lower edge meets the footer fade. Frozen-before3 screenshot shows the same issue, so this render-only lane did not change CSS to hide it. Root was notified; no claim of complete 320 UI acceptance. WebGL before/after artwork screenshot was also viewed.

## Separate candidate: declared hidden touch Bow

Root approved investigation after the initial cache was measured independently. Cache-only source is separately frozen at `.localparty-build/perf244/canvas-cache-before-gate/`.

The phone samples the canvas's actual declared `display` on mode/geometry changes, so a standalone layout that shows its bow continues rendering. The Mini3D frame keeps the exact recoil decay step while hidden, then skips mesh build/GL work. Visible camera entry and context restoration retain the normal draw path. There is no per-frame style read and the reticle, tracking, server input, draw/shot confirmation and HUD remain live.

New hidden/recoil/resume/context-restore regression passes. Existing camera lifecycle extraction fixture was extended to load the actual new display helper and assert camera entry restores it; all prior race/cancellation assertions are retained.

Two sequential cache-only → gate-only → gate+HUD trios use frozen phone+Mini3D source routing (the harness verifies both modules were intercepted). Cache-only still draws180/181times in six seconds with actual `display:none`; gate-only draws/uploads zero, including real draw/release. The cache-only vs gate-only task medians .393s vs .411s are neutral/noisy, so **no CPU improvement is attributed to the gate**. GPU calls are counted but GPU execution time/power were not measured. Root retained the gate as the user's explicit requirement to stop rendering unseen objects, separately from the measured CPU caches.

`tests/browser/bow-hidden-display244.cjs` uses the actual authored hidden CSS, production sampling helper and real WebGL in both Chrome/WebKit. Standalone-visible20frames → managed-hidden40frames → visible hand/pull resume and landscape resize passes: no hidden draw, recoil expires, resumed geometry nonempty, DPR1.5 density retained. Four computed-display reads occur only at layout/mode changes, none per frame. This is a declared-display fixture, not camera permission/tracking/device evidence. Final exact visible pixels and actual WEBGL_lose_context/restoration were rerun in Chrome/WebKit: zero changed channels across all five authored states; no GL errors.

## Third candidate: Bow HUD writes

Root approved a narrow measured investigation because the cache-only real phone profile still records about765layouts per360frames in six seconds. Geometry caching remains excluded until its own cause is demonstrated.

A separate gate-only snapshot is saved at `.localparty-build/perf244/canvas-gate-before-hud/`. The candidate guards actual unchanged tracking/metrics/score/arrows/disabled/hand class/aria fields. It translates authored status text through the existing PartyI18n before comparing, so the old Russian-write → English observer rewrite does not run every frame. The draw percentage still changes immediately, and fresh-aim expiration, connection, pause, hand, language and real score/arrow state remain live. No input or tracking cadence is altered.

The source-based HUD regression passes:100identical frames cause zero HUD writes; changing score/arrow, held draw percent, locale, handedness, connection and expired camera aim all update. Semantic aria labels retain the shared `ui:true` localization treatment, including player-name safeguards.

Final browser trios ran at about30Hz (180/181frames per6s); these are distinct from the earlier60Hz mesh-cache pairs. Do not combine their timings or add their percentages. All variants keep the same current cadence/p95≈33.4ms.

| Six-second phone tab work | Cache-only pair1 /2 | Gate-only pair1 /2 | Gate+HUD pair1 /2 |
| --- | --- | --- | --- |
| Task seconds | .403 /.383 | .363 /.459 | .156 /.231 |
| Script seconds | .123 /.119 | .109 /.128 | .070 /.099 |
| Layout seconds | .053 /.049 | .047 /.061 | .000615 /.000962 |
| Style seconds | .114 /.101 | .095 /.136 | .022 /.035 |
| Layout count |405 /405 |408 /406 |6 /6 |
| Frame mutations |2261 /2272 |2272 /2271 |181 /180 |

Gate→HUD task median .411s→.193s (**−53%**), layout407→6, style .115s→.028s. HUD improvement exceeds observed run variance: both HUD runs are below both gate runs. Residual per-frame reticle/overlay work remains; this lane does not claim the entire app is free of rendering costs.

All six actual game runs plus final actual WebKit native-route touch match preserve a real25-point hit/9arrows, Draw percent, hand,320resize, EN→RU→EN and pause/resume without restarting the match; zero page errors. WebKit records360frames/p95≈18ms with zero hidden GL work; it supplies correctness/visual evidence, not CDP CPU timing. Final Chrome393Draw and TV, WebKit393shot/hand/320 and resumed visible Bow screenshots were viewed. The preexisting320Draw/footer fade overlap remains visible; root owns its UI follow-up.

Raw final reports: `output/playwright/performance244/canvas/variants/summary.json`, six variant subdirectories, `bow-final-webkit/`, `gate-display-{chromium,webkit}/`, `pixels-{chromium,webkit}/`. Source freeze: `.localparty-build/perf244/canvas-after/manifest.json`. Gallery: [Bow244 evidence](http://127.0.0.1:17810/performance244/canvas/index.html). Browser/game fixtures do not establish physical iPhone/AirPlay camera or cast performance; root's native device lane must close that separately.
