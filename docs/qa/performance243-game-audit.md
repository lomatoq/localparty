# Performance 243: game renderer audit

Date: 2026-10-07. Read-only production-source audit. The only artifact written by this lane is this report. No game source, CSS, rules, protocol, input cadence, build, device or browser profile was changed/run.

## Scope and evidence limits

Read `AGENTS.md`, `docs/qa/ui-regression-rules.md`, `docs/qa/design-contract-2026.md`, `docs/qa/interaction-contract.md` and `docs/qa/performance242.md`. The approved Kardia typography, artwork, rounded controls, HUD hierarchy, score/name visibility, TV notch, gradients, glow, blur and Pause/Lobby design are constraints. This report proposes computation/lifecycle changes that retain their output; it does not authorize removing visual effects or reducing rendering quality.

Used the existing specialist measurement workflow documented in Performance 242: identify a source hot path, isolate one change, retain behavior, and compare the same scenario sequentially. No Impeccable optimization workflow was used. Findings below are **static candidates**, not measured bottlenecks or speed claims. Browser CPU counters, GPU load, AirPlay encoding, thermal state and physical-phone responsiveness are different evidence.

Catalog membership is the live `require('./lib/catalog')` result: **36 games / 20 runtime families**. `lib/catalog.js:3-5` merges the released catalog with sports extensions without duplicates; `server.js:249` selects `games/<game.engine || id>`. Own `.js`, `.mjs` and inline scripts were inspected; vendor Three.js/OpenCV/socket libraries and generated bundles were excluded. Shared `public/game-art.js` and clock/lifecycle hooks were included where games use them.

Other lanes were editing Kart during this audit. Initial unguarded controller HUD writes and loaded-forest geometry reads were rechecked and found changed before this report was written. They are explicitly separated from remaining candidates below. File:line references describe the observed working-tree source, not an immutable released build. No new runtime acceptance is implied.

Priority means investigation order: P1 = investigate before broad game optimizations; P2 = targeted next candidate; P3 = monitor/verify only. It does not assign an unmeasured milliseconds cost.

## Complete catalog-to-renderer mapping

| Runtime family | Catalog IDs (36 total) | Renderer path and sizing/lifecycle evidence | Coverage conclusion |
| --- | --- | --- | --- |
| `party` (5) | `push`, `shrink`, `knives`, `bomb`, `western` | Canvas TV `games/party/public/host.js:544-553`; `PartyArt.beginFrame` at 547 uses DPR≤2 and a 5M-pixel cap (`public/game-art.js:36-46`). World/floor/wheel/Western caches at host 195, 204-225, 320-335. Controller input release at `controller.js:32`. | Cached static art retained; continuous TV rAF, live label metrics/geometry remain candidates. Western is a distinct scene within the same loop. |
| `arcade` (6) | `taprace`, `punchmeter`, `flappy`, `hungry`, `snakelines`, `carryball` | Canvas host `games/arcade/public/app.js:225-227,434-444`; DPR≤2 / 5M-pixel cap, cached environment `249-251,360-368`. Controller charge rAF at 115. Explicit pagehide/pageshow teardown/restart at 473-474. | Good retirement lifecycle and background cache; hidden retained-view behavior still needs native evidence. Per-frame player labels and dynamic gradients are measured candidates, not cache failures. |
| `tanks` (1) | `tanks` | Canvas `games/tanks/public/host.js:128-140,328-354`; DPR≤2 / 5M cap at 131; cached terrain/walls at 148-154,194-200. | Continuous TV draws plus repeated rect/label placement work; preserve responsive authoritative playfield reporting. |
| `tankarena` (1) | `tankarena` | Canvas `games/tankarena/public/app.js:11-18,39`; `PartyArt.beginFrame` applies the shared 5M cap; tinted tank sprite cache 42-45 and ground cache 50-60. | Static art already cached. No render-local visibility/pause stop in the host frame; input release is separate at 37. |
| `chaos` (1) | `chaos` | DOM + Canvas inline `games/chaos/static/host.html:142,249-256`; DPR≤2 resize-only buffer sizing. Independent cursor-comet loop 283-284. | Paused gameplay loop skips simulation but still schedules; comet loop writes geometry/ghost transforms even while paused/hidden. Host owns gameplay simulation, so blanket rAF suspension is unsafe. |
| `kart` (1) | `kart` | Canvas `games/kart/static/host.js:283-290`; DPR≤2, conditional backing resize, track/ground/scenery caches. Driver metrics at 265-267. Controller at `controller.js:106-128`. | Existing cache/identity work retained. Concurrent HUD/forest fixes observed; remaining label/sizing/lifecycle candidates documented separately. |
| `monster` (1) | `monster` | DOM host + event-driven drawing `games/monster/public/host.js:65-95,98-107`; turn timer at 121. Phone drawing `play.js:83,106-111`. | No permanent game render loop found. Roster DOM rebuilding and unchanged timer writes are lower-priority state paths. |
| `spy` (1) | `spy` | DOM host `games/spy/public/host.js:16-39`; timer at 52, phone timer `player.js:67`. | No permanent Canvas/WebGL renderer found. State-driven roster replacement/timer work should be counted before optimization. |
| `millionaire` (1) | `millionaire` | DOM + finite count-up `games/millionaire/public/host.js:12-19,34`; event overlay `screen.js:18-28` at DPR≤1.5. | Event feedback stops when particles/rings end and refuses new hidden bursts. Timer/count-up mutation volume is a measured P3 candidate. |
| `quiz` (2) | `sinyakquiz`, `warsaw` | Shared DOM `games/quiz/public/app.js:3-21`; finite event overlay `screen.js:18-28` at DPR≤1.5. | One shared implementation covers both topics; no continuous background Canvas scene found. |
| `crocodile` (1) | `crocodile` | DOM `games/crocodile/public/app.js:2-6`; finite event overlay `screen.js:18-28` at DPR≤1.5. | State/timer driven; no continuous background scene found. |
| `jenga` (1) | `jenga` | Three.js TV + phone `games/jenga/public/renderer3d.js:3-4,45-46`; DPR≤1.8 host /1.5 phone; VSM shadows 2048²/1024². | Both surfaces render continuously; paused dt is zero but scene/shadows/rect/timer work continues. |
| `crane` (1) | `crane` | Canvas TV `games/crane/public/client.js:83-88`; `PartyArt.beginFrame` / 5M cap; ranking-key cache 48,63 and 150ms timer 64. | Continuous full-scene draw and static wash recreation; correct keyed rankings already exist. |
| `naval` (1) | `naval` | DOM `games/naval/public/app.js:3-8`; shot-triggered Web Animations `broadcast.js:14-31`, bounded effect retention at 31. | No permanent Canvas/WebGL renderer found. 100ms timer and state DOM changes are lower-priority candidates. |
| `drawguess` (1) | `drawguess` | Event-driven ink Canvas `games/drawguess/public/app.js:6-10`; DPR≤1.5 finite event overlay `screen.js:20-30`. | Ink rAF coalesces requested redraws; no continuous ink loop found. Preserve pointer/network sampling semantics. |
| `western_duel` (1) | `western_duel` | Canvas TV + phone `games/western_duel/public/app.js:35-40`; DPR≤2, size conditional; desert/blur caches 45-60. | Same continuous actor loop on both surfaces, name truncation every frame; authored anticipation blur already cached. |
| `arcade_deluxe` (2) | `marble_bloom`, `pocket_siege` | Shared Canvas `games/arcade_deluxe/public/render.js:35-48,270-282`; DPR≤1.5; results ends rAF, destroy on host pagehide at `host.js:62`; background/path/terrain/sphere caches 28,76-84,109-110. | Full redraw in waiting/paused states is a top candidate. Dynamic terrain and map transitions are intentional invalidation paths. |
| `bow_club` (1) | `bow_club` | TV Three.js `games/bow_club/public/src/range-scene.mjs:6-10,28-37`, DPR≤1.5 and dirty-only 3D drawing; TV overlay rAF `tv.js:25-31`. Phone own Mini3D + overlay `phone.js:112-119`, DPR≤1.5/2. | TV 3D already avoids settled redraws; phone rebuild/upload and static overlay work are candidates. Camera/worker stops on hide/pagehide. |
| `tabletop` (3) | `poker`, `airhockey`, `mines` | DOM Poker/Mines; Canvas Air Hockey `games/tabletop/public/app.js:79-96,118-146` at fixed 1000×600 backing. Finite hit sprite rAF `fx.js:12`. | Air Hockey alone owns persistent frame draws; materials/name metrics recreated per frame. Do not treat Poker/Mines as Canvas workloads. |
| `sports_siege` (4) | `curling`, `bowling`, `swarm_gate`, `peek_shoot` | Shared Three.js `games/sports_siege/public/host.js:121-148,468-497`; DPR≤2, software fallback, shader warmup, hidden/waiting GPU skip. Curling/Bowling own scene classes; Swarm/Peek use shared pools/sprites. | Strong pools/cache/warmup safeguards; dense score popups, uncapped backing area, effect sprite/material churn and conditional Curling inset pass need isolated measurements. |

## Findings and measurement gates

### G1 — P1: Sports score labels read layout after writes within the frame

`games/sports_siege/public/host.js:449-463` reads the scene rectangle even with zero popups. With popups it also reads HUD wings, sets each label's transform, immediately calls its `getBoundingClientRect()`, then writes `left`, `top` and `opacity`. The next popup follows prior writes. `Stage.loop` invokes this at up to 60Hz (`494-495`), so Swarm Gate and Peek & Shoot dense hits multiply style/layout opportunities. Transform affects the measured rectangle; simply moving the read before the write can change collision bounds and approved label placement.

Candidate: retain exact collision rules, cache each label's unscaled dimensions after insertion/font readiness, derive the scaled bounds from its known animation scale, and batch all scene/HUD reads before popup writes. Cache scene/HUD bounds with resize/layout/font invalidation. At zero popups skip popup-only geometry work. Keep every authoritative reward and readable name.

Measure 1/4/16 players, sparse/dense hit bursts and zero-popup play with rect-read counts, layout/style CPU, popup duration/placement, name/HUD overlap and page errors. Compare same inputs at 720p/1080p/4K, then actual cast phone+TV. No forced-layout cost has been measured by this audit.

### G2 — P1: Frame loops frequently freeze time while continuing full rendering

The strongest clear source example is Deluxe `render.js:270-281`: `s.paused` zeros selected animation dt but the code still reads geometry, clears the full backing, draws sky/terrain/entities/notices and requests the next frame; waiting also continues, results alone ends the loop. `destroy()` cancels it (`282`), reached by host pagehide (`host.js:62`). No render-local `document.hidden` or native-visible gate is present.

Related continuous draw paths: Party `host.js:544-553`; Kart `host.js:283-290`; Tanks `host.js:328-354`; Tank Arena `app.js:39`; Crane `client.js:83-88`; Western Duel TV+phone `app.js:35-40`; Jenga TV+phone `renderer3d.js:45-46`; Tabletop Air Hockey `app.js:146`. Some use the paused game clock; that preserves animation time but does not remove paint/GPU work. Arcade has real pagehide/pageshow teardown (`app.js:473-474`), yet an alive hidden WKWebView is not necessarily pagehidden. Sports already skips `renderer.render` for `document.hidden`/waiting (`host.js:494`) but keeps a lightweight rAF alive, and lacks an explicit paused-render skip.

Candidate: render one final stable paused/hidden frame, suspend presentation work, invalidate on meaningful state/geometry/font changes, and restart exactly once on visibility/resume. Preserve pending transitions, frozen animation phase, input release, server snapshots and reconnect. No blanket gameplay simulation stop: Chaos host `host.html:249-251` owns simulation; its independent presentation comet `283-284` can be audited separately.

**Prerequisite:** measure actual visibility/nativeVisible tags and rAF/canvas activity in retained menu/controller WKWebViews with and without AirPlay. Browser document visibility does not prove native view visibility. Pair pause/resume, hidden-tab, lobby return, disconnect/reconnect and resize; check no timer jumps, extra loop instances or held inputs. Do not change protocol heartbeat/input cadence to achieve presentation savings.

### G3 — P1 measurement, no default quality reduction: DPR caps do not cap total render area

Existing area caps are valuable: `public/game-art.js:39-45` and Arcade `app.js:226-227` / Tanks `host.js:131-133` bound main backing stores to about 5M pixels. They should be reused where semantics match, not removed.

Other families cap only DPR: Sports `host.js:125,480`, Kart `host.js:284-286`, Western Duel `app.js:35`, Deluxe `render.js:270`, Jenga `renderer3d.js:3,45`, Bow Club `range-scene.mjs:6,28` and `mini3d.mjs:32`. In Sports hardware mode there is no area/max-dimension policy; software alone narrows to 640px (`host.js:480`). Illustrative arithmetic, **not an observed device allocation**: a 3840×2160 CSS viewport at DPR2 is 33,177,600 backing pixels, about 126.6 MiB for one 4-byte color plane before depth/AA/temporary buffers. At DPR1.5 it is 18,662,400 pixels, about 71.2 MiB. Actual WK viewport/DPR and memory storage may differ.

Measure actual CSS/backing sizes, `MAX_RENDERBUFFER_SIZE`, main-pass GPU time, shadow/render-target sizes, thermal state and receiver output at 1080p and 4K first. Keep the approved sharp artwork/fonts/effects. Consider a pixel budget only after a demonstrated GPU/memory constraint, with new physical-TV comparison and visual acceptance; this report recommends no reduction to DPR, AA, shadow quality, inset or glow.

### G4 — P2: Stable text metrics are recalculated each moving frame

Kart `host.js:265-267`, Party `host.js:115,170,271-272`, Arcade `app.js:130-131,156-157,295`, Tanks `host.js:289-290`, Western Duel `app.js:39`, Deluxe `render.js:150,249-250,265` and Air Hockey `tabletop/public/app.js:123-124` repeatedly truncate unchanged names with a measure-per-character loop and then measure again. Positioning must change with actors; their text/font/layout constraints generally change less often.

Candidate: cache the rendered string and width by authored name, font, fit/width limit and language; invalidate on font readiness/viewport/roster changes. Leave dynamic collision placement and full accessible names intact. Bound the cache to live roster/layout variants. Measure max roster, long Cyrillic/Latin names, multiple languages and clustered actors. Do not replace names with numbers or shrink fonts to eliminate work.

Tanks additionally tests many label candidates against all live tanks, existing labels, bases and HUD rectangles (`host.js:281-296`). Measure that placement cost separately before changing its scoring/search; a faster cache of text metrics does not establish that placement is cheap or expensive.

### G5 — P2: Remaining frame geometry reads should become invalidated inputs

Tanks reads the canvas in `beginTankFrame` (`host.js:131`), again in `publishTankBounds` (`119-125`) and in names (`282`), alongside frame style assignment at 130. Geometry reporting is throttled after calculation, so unchanged frames still calculate/serialize exclusions. Preserve the live authoritative responsive HUD insets and retry behavior.

Kart keeps per-frame `clientWidth/clientHeight` for main/scenery sizes (`host.js:163-164,284`); the loaded forest rect-read path was concurrently removed (see below). Deluxe reads the canvas every frame (`render.js:270`), while its Pocket safe-edge reads are already time-cached at 250ms (`230-236`). Jenga reads the Canvas rect each frame (`renderer3d.js:45`) although `setSize` is conditional. Party reads canvas/parent notch during name/view fitting (`host.js:114,137,152`); Crane does so at `client.js:84`.

Candidate: one cached viewport/geometry structure invalidated by ResizeObserver, actual parent-notch/layout changes, stage resize, fonts and pixel density changes. Reuse the same geometry during a frame. Measure rect-read counts and real layout CPU before deciding which path matters. Cache invalidation is part of correctness: orientation, dense roster, shutter/menu transition, native safe areas and iframe scale must still work.

### G6 — P2: Air Hockey paints immutable material gradients per entity/frame

`games/tabletop/public/app.js:85-94` creates striker metal/enamel/dome and puck rim/face gradients. `frame` at 146 redraws these every frame, with a maximum of eight striker players. The shared field sheen is already created once (`79`). These are authored material pixels, not redundant decorative blobs.

Candidate: cache high-density striker/puck sprites keyed by color, dimensions and material, then draw dynamic transforms; keep trails, collision FX and event glow live. Compare sprite/canvas pixels at real TV sizes and phone backing density before acceptance. Measure creation counts, paint CPU and cache memory; gradients alone do not prove a dominant bottleneck.

### G7 — P2: Bow phone builds and uploads its complete mesh during active frames

`games/bow_club/public/phone.js:118` calls `Bow3D.frame` for every active camera/touch frame. Own `src/mini3d.mjs:49-64` clears/rebuilds all bow vertices with tube/triangle generation, while `32-33` constructs a new Float32Array, uploads the full array via `bufferData(DYNAMIC_DRAW)`, allocates a projection array and draws once. This is CPU/allocation/buffer-upload work, **not per-frame shader compilation**: shader/program setup is in `init()` (`15-19`) and context restore (`13`).

Candidate: retain immutable vertex data, reuse typed storage and projection values, update only pull/recoil geometry, or use equivalent transforms where they preserve the supplied bow shape and hand mirroring. Measure triangle/byte counts, GC, CPU and GPU upload time independently from camera tracking. Camera lifecycle already stops worker/stream on hide/pagehide (`phone.js:54,119`); TV 3D already renders only when dirty (`range-scene.mjs:28-37`), which must remain intact.

### G8 — P2: Sports event sprite/material churn and map updates need tracing

Sports uses preallocated `InstancedMesh` pools for enemies/particles (`host.js:250-259,377,466`) and bounded 120-effect retention (`418`), plus cached asset textures. However event projectiles/trails/muzzle/impacts/halos allocate individual sprite materials (`166-175,384-415`) and dispose them as effects expire (`421`). Texture-frame changes set `material.needsUpdate` (`427,429`). This can cause program lookup/texture-binding/allocation work; it is **not proof of shader recompilation**, because compatible material programs may be reused.

Candidate: pool compatible short-lived sprite records/materials by effect role and retain the exact texture frame, depth/blending and timing. Verify measured GC/material allocation and `renderer.info.programs` growth during sustained 16-player fire and boss/pulse events first. Do not globally share mutable materials across simultaneously different frame/opacities. New asynchronous FX modules/late assets should be included in first-use traces; `compileAsync` at `host.js:146` already warms the initial scene and must stay behind existing presentation transitions.

Existing safeguards: Bowling keeps the impact light in-scene at zero intensity to avoid changing light counts (`scene-bowling.js:90-91`), uses bounded instanced sparks/confetti (`294`) and cached banner textures (`310,318`). Curling caches label textures/material prototypes (`scene-curling.js:380-388`) and uses instanced slats/lamps/dust/glints (`241,252,346,374`). Swarm ambience uses a one-shot pool (`swarm-ambience.js:65`). These gradients/textures are initialization or cache work, not per-frame repaint defects.

### G9 — P2: Curling conditionally draws an additional scene pass

Curling's wide-view house inset uses a 512² render target with 4 samples (software 320²/0) (`scene-curling.js:654-655`). It appears only for wide aspect≥2.2, active eligible stages, and a small/distant house (`675-678`). Rolling renders it every frame; settled eligible frames every sixth (`687-690`). It correctly disables shadow auto-update for that inset pass. Main Stage then renders the normal camera (`host.js:495`).

This is intentional readability, not a discovered defect. Measure draw calls/triangles and GPU cost with inset visible versus comparable camera frames before considering scheduling changes. Preserve live target readability and shot/stone motion; do not remove the inset or shadows for headline frame-rate gains. Existing diagnostics expose calls/triangles/geometries/textures (`scene-curling.js:88`), but extra passes require correctly accumulated counts rather than trusting a last-pass counter.

### G10 — P2/P3: A few unchanged-state DOM paths still lack semantic guards

Deluxe host state rewrites weapon icons via `innerHTML`, tactical text and hidden legacy readouts on every state (`host.js:54`); controller updates numerous stable labels/disabled states and scans all arsenal buttons (`controller.js:77-84`). Arsenal construction is keyed in the update path and should not be called out as an unconditional 321-row rebuild. Monster host recreates player rows every state (`host.js:75-78`), Spy host rebuilds lobby/reveal/playing roster groups (`host.js:18,22,35`), and timer paths in Naval (`app.js:7-8`), Quiz/Crocodile/Millionaire and Crane run more frequently than whole displayed seconds change.

Candidate: retain semantic authored keys and write only changed text/attributes/styles, preserving localization and row identities. Prefer guards to reducing snapshot/input rates. Measure mutation counts/layout/style CPU in identical snapshot and genuine-state scenarios separately; Performance 242 already showed that fewer mutations alone do not establish lower overall task CPU.

### G11 — P3: Sparse event overlays are already bounded; pause can extend their lifetime

Millionaire/Quiz/Crocodile `screen.js:18-28` and Drawguess `screen.js:20-30` only request another frame while event rings/particles remain and refuse new bursts when reduced-motion/hidden. Their paused clock sets dt=0; a paused burst can therefore retain its active rAF until resume. Shared sprites may replace the fallback, so do not infer fallback use from source alone. Measure actual active overlay path and visibility at the pause boundary before adding a lifecycle gate. Preserve the frozen phase on resume.

## Concurrent Kart changes observed, not validated by this lane

- Initially Kart `controller.js` rewrote disabled/aria/HUD text on every 50ms server state and released ended controls repeatedly. Recheck found `kartStatValue`/`kartStatText`, conditional aria and conditional held-input release at current `controller.js:115-128`. The continuing class toggle at 117 and 30Hz input interval at 107 remain; their cost/protocol role must be measured independently. Do not change the safety heartbeat just because it wakes a timer.
- Initially loaded forest backdrop still read the race Canvas rectangle before its cache check. Recheck found a loaded-forest cache fast path `host.js:167-170`; fallback procedural world anchoring still legitimately reads origin at 172. Existing track/ground/row caches were retained. Driver name measurements and loop lifecycle remain G4/G2 candidates.
- Existing `docs/qa/performance242.md` reports a measured Kart worker/WebKit baseline and remaining game-local mutations. That is prior lane evidence, not a run performed by this audit. Current Kart source validation and before/after numbers belong to its active implementation lane.

## Measurement sequence for follow-up work

1. Confirm native visibility and actual main/backing dimensions with existing passive tags/diagnostics for standalone phone versus active AirPlay. Keep physical device/thermal/receiver evidence separate from browser CPU.
2. Run one isolated family/scenario at a time, with frozen before source and the same current approved CSS. Three sequential before/after pairs; no overlapping 4K game/browser profiles. Start with Sports popup batching or Deluxe paused-frame suspension, then cached name metrics.
3. Cover zero/max roster, long names, English/Russian, 720/1080/4K TV as supported, small phone, waiting→playing→pause→resume→results→rematch→lobby, resize/orientation, disconnect/reconnect and hide/resume. Count loops, rect reads, material/texture allocations, mutation/layout/style/task CPU and GPU timing where available. Preserve authoritative scores, timing, input release and camera mapping.
4. Keep any accepted image output pixel-equivalent at representative states; recapture and inspect affected actual states after source changes. Tests are behavior evidence, screenshots are visual evidence, and neither substitutes for the physical cast path.

No source fix or runtime regression check was performed by this lane. The audit establishes complete catalog-family coverage and concrete measurement targets, not complete per-state QA or a resolved AirPlay regression.
