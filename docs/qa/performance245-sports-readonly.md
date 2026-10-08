# Sports / TV rendering triage after build 146

2026-10-07. This is a **source audit and prepared test-only experiment**, not a measured optimization. The root lane owns the physical iPhone/receiver trace. Browser workloads were held while the UI lane used the shared CPU window; zero Bowling browser profiles were run in this lane. Sports production remains identical to build 146.

Method: the previously read [Addy Osmani performance workflow](https://github.com/addyosmani/agent-skills/blob/main/skills/performance-optimization/SKILL.md): preserve the baseline, isolate a cause, repeat comparable workloads, retain only meaningful gains with visual/behavioral equivalence. No DPR, AA, shadow, art, blur, glow or animation-cadence reduction.

## What source inspection establishes

- Hardware Sports uses the 60 Hz threshold in `games/sports_siege/public/host.js:506`; there is no authored 30 FPS Bowling cap. External frame diagnostics report rAF cadence, rather than GPU duration or actual presented frames.
- Bowling has one main `renderer.render` per eligible frame, one directional 2048² PCF-soft shadow map, fixed light count and an environment PMREM generated at initialization. Mirrored balls/pins are meshes in that main pass, not a second full-scene render target.
- Neighbour pins, particles, blobs and multiple decorations are already instanced; static alley geometry is already merged by material. Main ten opaque pins remain separate meshes sharing geometry/material.
- Previously measured hidden SpriteMaterial churn concerned Peek shot events. It does not establish the cause of Bowling's physical 26–28 FPS. Bowling texture/banner caches and impact-light continuity must remain.
- The external WKWebView is a dedicated surface; URL/boot/reload identity controls its load. Source inspection does not show an automatic reload on every published ServerModel field. Its `isOpaque=false` with black backing is a low-confidence compositor candidate, requiring native measurement and transparency/curtain parity before any change.
- The normal TV menu does not continuously render the podium WebGL shader: `tv-show.js` starts CelebrationFX only for a visible podium and stops it otherwise. Current `tv-discovery.css:88,134` does continuously animate a registered angle inside conic gradients for Play/selected-card rims.
- The premium TV header authors two masked backdrop passes (blur12/saturate and blur4); the later premium tag selector re-enables blur10 after the earlier `perf.css` rule. Actual computed styles and paint damage must be measured before attributing cost or changing any approved material.
- Ambient props have opacity zero during browsing/choice while their transform drift animations remain authored running; they become display:none with a hidden lobby. This is a candidate for invisible compositor work, not proof of expensive paint. Roster gold glints already use tiny transform/opacity layers with hidden/inert/lobby gates.

## Narrow candidates and acceptance

| Candidate | Preserve | Evidence needed before production |
| --- | --- | --- |
| Reuse Bowling shadow map only with identical visible caster/light state | Same 2048² target, depth, AA, PCF, all moving player/ambient balls, pins, pinsetter, ghosts and shadows | Actual unchanged-caster fraction and shadow submissions; repeated per-phase CPU/GPU timing; exact cached versus forced-redraw pixels; resize/font/pause/hide/context invalidation |
| Instance ten opaque main pins | Same geometry, material, poses, shadow behavior, camera and mirror draw order | Real draw-call/submission reduction and timing; preserve pose handles used by extras/feel; separate transparent mirrors; tumbling/reset/ghost/pinsetter pixel oracle |
| Rasterize menu conic field once and rotate it inside unchanged ring mask | Same palette, phase, 12s cadence, mask, thickness and shape | Computed animation and repaint-area baseline, exact multi-phase screenshots, browser timing and physical menu/cast result |
| External-only opaque WK compositing | Same black page and all curtain/loading/pause transparency pixels | Native trace evidence of blend/composition cost and physical before/after; no source change currently |

The rotating conic field needs a square covering the rectangle's diagonal and the same centre; rotating a 100% rectangular child would expose corners and change the approved effect.

## Prepared experiment, not run

Frozen baseline: `.localparty-build/perf245/bowling-before/manifest.json`, twenty Sports JS files. Current host SHA256 remains `7ab73abff43801eb3879406eba154566b2bc920cb55d7d2290b97d28a60ba0a0`; all twenty frozen/current hashes match. Shared CSS hashes are recorded separately because the root/UI lanes are still working.

`scripts/performance245-bowling.cjs` reuses the real worker, TV, native-bridge phone and actual existing bots from the Sports244 harness. Its additional `performance245-bowling-probe.js` is served only through Playwright response interception; no production debug gate or renderer edit is installed. Static `node --check` passes for both files; runtime behavior remains unverified.

The probe records actual backing/AA/shadow sizes, scene resource counts, stage-specific object-update/render-submission CPU, main/shadow submissions, unchanged caster signatures and optional timer-query results. Synchronous renderer timings are **CPU submission timing**, never labelled GPU time. Timer queries are reported only when the runtime extension is available and non-disjoint.

The injected shadow candidate conservatively compares visible caster world/instance poses, layer/visibility, geometry versions/morph/bounds/groups, material/alpha/displacement textures and UV state, light/target/shadow camera/settings. Custom shadow hooks, depth/distance materials, skinning and other shadow-map types disable caching. Resize, font completion, native hide/resume and context restore invalidate it. It may prove too costly or find too few unchanged frames; that is a reason to reject it, not to remove animations.

The separate oracle forces an original shadow redraw on the same actual scene frame without advancing authoritative state, animation clock or poses, then compares full main RGBA pixels exactly. Oracle work must never enter accepted timing samples. Sparse/dense/max rosters, Chrome/WebKit, dynamic phases, reflections, font, resize, pause/resume, hidden/resume and fresh visual review are still pending.

No speedup, pixel parity, Bowling GPU improvement or physical receiver acceptance is claimed. Per root's release priority, this experiment stays test-only until a separate measurement slot; build147 keeps the verified build146 Sports source.
