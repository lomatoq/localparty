# Popup render investigation 249 — 2026-10-09

**No production change accepted.** The isolated opaque-Host candidate preserves
the fresh 393px WebKit fixture, but additional active GPU/raster work was not
established. The Chrome LayerTree attempt did not observe usable current surfaces.
No FPS, physical iPhone, casting, or full-matrix acceptance follows from this audit.

Frozen baseline: `8bbad774542a14aad4796f3c262d956adf32006f`. All candidate source,
harnesses, raw reports and originals remain ignored under
`.localparty-build/opaque-host249/`. Production JS/CSS remains unchanged by this lane.

## Source finding and candidate boundary

- `public/app-ux-20261005.js:66–89` marks disjoint background branches around the
  latest foreground dialog/profile. Native main traversal preserves sticky decks.
  A marked ancestor and its descendant do not both receive this branch blur.
- `public/app-ux-20261005.css:691–698` retains progressive `blur(8px)`, 180ms
  ease-out; shared backdrops own shade. Matte material remains alpha .93 at
  737/753. Existing background-animation parking remains unchanged.
- Native-controller Rooms resolves to its own `blur(22px) saturate(1.15)` from
  the ID-specific selector at 436–438. Native menu Rooms and profile resolve to
  own-backdrop none at 487. The actual WebKit probe confirms this cascade.
- Persistent native Host uses `host.show()` in `native-shell/tabs.js:24`, hence
  the modal-only reset does not remove its own blur22. Final
  `background-scene.css:515–520` makes that tab opaque `#211c2d`, full viewport,
  without a mask or rounded corners. Ordinary web-tab entrances are excluded.

The ignored candidate changes only Host's own backdrop-filter to none when the
persistent hidden native dock is present and Host is nonmodal. It changes no
color, opacity, geometry, shared blur8, visible popup blur, effect, or motion.
An opaque fill may hide the result, but removing backdrop-filter also changes
containing-block/backdrop-root semantics. Correctness and actual renderer evidence
are therefore separate gates; matching pixels alone does not establish savings.

Candidate SHA-256:
`b69bb21ab06c32b274cb15dc2405006a01b3aefa86fd025486d8269d1d63a969`.
Fulfilled candidate app-UX CSS:
`73f0275fdc7d92aa3ffea103c4d94306c67956082fe32cad10d2e22681a71867`.
Both probes freeze baseline HTML/JS/CSS through route interception; five relevant
source hashes are recorded in each report. Native transport/state is a synthetic
fixture, not an actual cast. Menu and controller follow their distinct real script
configurations; controller uses both controller-bridge and native tabs.

## Preserved fixture failures and fresh WebKit gate

1. `output/webkit/attempt01-csp-report.json` preserves the first rejected inline
   Rooms-script fixture. The corrected harness loads its allowed self URL; CSP
   was not altered.
2. `output/webkit/report.json` and its 12 originals preserve the 550ms fixture
   failure. Rooms was still in a 560ms entrance: y differed by 0.080627px and its
   recorded translate explained the difference. Later screenshot exposures were
   settled and all five RGBA pairs matched. The correction waits relevant finite
   animation completion plus two rAF; no tolerance was relaxed.
3. Fresh `output/webkit-settled/report.json`: **14 rows, 12 original PNGs, five
   full-viewport RGBA pairs byte-exact, exact geometry, zero failures/page errors**.
   Harness SHA-256:
   `105588fd9208de106182fade3c20b2993b79e22789e79c28b9df0201d70599ab`.

Coverage is 393×852, English, cast-disabled state: top/scrolled Host, actual Rooms
opener over mounted Host, interrupted close/reopen, cleanup, controller Rooms and
existing profile, plus two negative Games→Rooms ownership rows. Underlying Host
remains mounted and visibly blurred under Rooms; cleanup restores it. Relevant
finite animations are complete at settled probes. Both the agent and root
independently viewed all 12 fresh originals. Root confirmed proper blur/shade/.93
material and centered Back for Rooms/reversal, and retained softened catalogue/
hero with accessible Save under the actual controller Rooms/profile foregrounds.
This is browser correctness evidence, not physical/cast/performance acceptance.

Host→Rooms marks 20 branches; only four pass viewport/ancestor-visibility checks.
Hidden catalogue branches, closed panels, hidden dock and native stack layers
explain the other 16. Occlusion is not accounted for by that check. Neither 20 nor
four establishes actual render passes, surfaces, allocation, or memory cost.

## Bounded Chrome LayerTree attempt — no performance evidence

`output/chromium-layers/report.json` contains six states and six original PNGs for
Host→Rooms→cleanup in baseline/candidate. Browser/server were closed before slot
handoff. Harness SHA-256:
`767941b918a4ed8af4c5324e7664311952147fea9aedfc86bf4e448772e854e7`.

Baseline received one initial tree with four roots, no paint events, and every
backend-node/layer mapping was unavailable at capture. Candidate received no tree
events. These are not valid current Host surfaces: **no culling conclusion, no
extra-pass proof, and no 4→0 gain claim**. No timing or full matrix was run.

Both the agent and root viewed all six originals offline. Host and cleanup are byte-exact. Rooms
background is visibly softened and foreground readable in both, but strict RGBA
differs at 8,374 pixels/11,068 channels, maximum channel delta four. Host geometry,
branch/foreground ownership and finite completion match. This layer harness did
not freeze infinite-animation phase like the WebKit correctness harness; that is
a possible, unverified cause. The failure remains in `offline-comparison.json`.
No tolerance or acceptance gate was weakened. Root rejected promotion this round.

## Limits and next proof required

No new blur/cache architecture is accepted. The previous constant-radius opacity
overlay failed actual desktop WebKit blur pixels and remains rejected. Merging
native main branches risks the known sticky-deck stacking regression. A future
renderer probe requires a working layer/paint observability control before any
matched action-window cost comparison. Actual iPhone WK and standalone/separate-TV
measurements remain independent gates; this desktop result says nothing about
their FPS or renderer culling behavior.

Primary guidance: [WebKit Layers](https://webkit.org/web-inspector/layers-tab/),
[WebKit backdrop rendering](https://webkit.org/blog/3632/introducing-backdrop-filters/),
and the [Filter Effects Level 2 editor's draft](https://drafts.csswg.org/filter-effects-2/).
The draft's opaque-background and containing-block semantics are not an engine
performance guarantee.
