# Shared motion observer — 2026-10-05

Source scope: `public/motion.js` only. Existing dirty work preserved. No CSS, animation durations, effects, masks, blur, art or gameplay changed.

The value/status observer previously queried all matching descendants of every class/open/hidden mutation target. A shell body class toggle therefore rescanned every counter. Nested text nodes inside a counter were also missed because scanning started at the nested span rather than its matching ancestor.

The observer now queues matching text ancestors, inspects newly inserted subtrees and checks only the element whose class changed. It still compares settled text once before paint. Removed nodes are ignored. Existing CSS pulse and reduced-motion behavior remain intact.

## Reproduced baseline and results

`tests/browser/perf-motion133.cjs` uses 300 counters to expose the work without timing claims:

- Before: unrelated body class scanned 300 counters; nested score changed visibly to 1 but remembered value stayed 0 and no feedback pulse ran.
- After, WebKit and Chrome: zero counter subtree scans for unrelated class changes; nested update remembered 1 and emitted existing pulse.
- Newly inserted counters initialized; transient text returning to its original value did not pulse; reduced motion updated remembered text without pulse; zero page errors.

Evidence: `output/playwright/perf-motion133-before/report.json`, `output/playwright/perf-motion133-webkit/report.json`, `output/playwright/perf-motion133-chromium/report.json`.

Real native shell route checks: existing `tests/browser/shell-motion130.cjs` passed in WebKit and Chrome at 393×852 and 320×568, using real controller bridge and persistent tabs, with only Swift snapshot transport mocked. Dialog close/reopen maintained live opacity; toast reversal settled correctly; details rapid toggles resolved; legacy overlays completed exits; reduced motion closed synchronously. Source hashes remained stable through both runs. Evidence and captures: `output/playwright/perf-motion133-shell-webkit/` and `output/playwright/perf-motion133-shell-chromium/`.

## Visual observations and limits

Viewed `perf-motion133-shell-webkit/native-host-393-initial.png`: logo, hero art, title, search, categories and card artwork are present; gradient/blur backing is retained. Viewed `perf-motion133-shell-webkit/host-320-expanded.png`: host language control, statistics and diagnostics remain readable with original typography and purple surfaces. This second image is scrolled below the disclosure, so it is not visual evidence of its expanded content; its reversal is covered by browser assertions only.

No full-screen catalogue review or physical iPhone/AirPlay claim. Runs overlapped independent browser verification, so only deterministic operation counts are reported, no frame-time speedup. Existing pulse restart still uses one offsetWidth read on actual visible value changes; this pass removes unrelated scanning without changing feedback appearance.

## Follow-up: remaining TV return spike

Read-only source diagnosis followed by Chrome CPU and return-only rendering traces. No change made to `public/tv-motion-20261005.js`: the observed trace did not justify altering the authored choreography. Host Pick is shown on these returns, so the hidden hero entrance is not their cause.

Evidence: `output/playwright/perf-motion133-tv-profile/cpu.json`; `output/playwright/perf-motion133-tv-trace/{trace.json,cpu.json,report.json}`. Repro harness: `scripts/perf-motion133-trace.cjs` (same underlying real launcher scenario as qa-perf132, with return-only tracing and curtain state marks).

Chrome return trace findings (instrumented observations, not a cross-browser benchmark):

- Opening callback in tv-motion: about 0.3ms; no Layout tasks inside the marked opening phase.
- `tv.js` railBounds runs repeatedly during smooth fresh-rail scrolling. A revealing call takes 16.8ms, containing a 16.7ms UpdateLayoutTree over 858 elements. Opening calls are around 3ms each and coincide with repeated style updates.
- Opening phase totals: 55 UpdateLayoutTree events / 74ms, 697 Paint events / 21.2ms; no single opening frame exceeds 50ms in this Chrome run.
- Largest return task is 112ms while doors are closed, including a 75ms outgoing Hungry iframe draw. This is distinct from the prior WebKit opening spike.

Suggested source-local follow-up for tv.js owner: compare each fresh fade CSS property and arrow disabled state before assigning. Preserve smooth scrolling, masks and actual fit geometry. Existing same-value assignments are repeated during scrolling even though edge fades usually remain unchanged. Source ownership respected; recommendation sent to root. WebKit's earlier 90–125ms opening spikes remain unresolved by this Chrome trace; no unsupported fix or hero change applied.

## Rail guard verification after root fix

Root added same-value guards in tv.js. `tests/browser/perf-motion133-rail.cjs` passes WebKit and Chrome in both TV display-only and interactive catalog modes using the real LocalPartyCatalog implementation with a constrained rail fixture:

- Start: left fade 0px, right fade 22px; previous disabled / next enabled.
- Interior: both fades 22px; both arrows enabled.
- End: left fade 22px, right fade 0px; previous enabled / next disabled.
- Returning to start restores both initial edge states.
- Moving between two interior positions produces zero observed style/disabled mutations.
- Eight additional same-position scroll notifications produce zero observed style/disabled mutations.

Evidence: `output/playwright/perf-motion133-rail/report.json`. All four contexts passed and both browser processes closed. This is correctness and mutation-count evidence; no timing or visual-gallery claim.

## Interrupted detail-art choreography

Reproduced native game detail close → reopen in WebKit: the reopened sheet resumed but its art clone continued toward the old catalog card (destination y430.5 versus detail art y378). The detail image stayed hidden until that wrong-way return finished.

`public/app-ux-20261005.js` now retargets the same live top-layer clone to the reopened detail artwork. It retains the existing 180ms reversal, starts from the rendered rectangle, and cleans up normally. A close that interrupts an art flight also starts from the actual clone rather than the hidden destination image. Earlier drag lifecycle corrections remain.

`tests/browser/perf-motion133-flight.cjs` passes WebKit and Chrome: same clone retained; visual position changes less than3px at reversal; destination equals restored sheet art; no residual flights or hidden source artwork after settling. Zero page exceptions. Fresh controlled animation-pose captures live in `output/playwright/perf-motion133-flight/`; baseline in `perf-motion133-flight-before/`. Viewed WebKit reversal-start and90ms captures: the image moves from its live cardward position into the rising sheet, whose title, copy, rules and buttons retain original hierarchy and styling. These are actual rendered poses with timelines paused for screenshots, not real-time performance measurements.

## Retained lobby interaction / visual checks

Paired rendering investigation established that recreating the hidden menu layout is a major cost; root owns the retained absolute-position/opacity0/inert implementation. This lane owns `tests/browser/perf-motion133-park.cjs` correctness coverage. The earlier hero hypothesis was withdrawn: launching a game also selects it server-side, so both direct and preselected return routes show Host Pick. Qualitative settle inspection found eight actually visible grid/sidebar targets, not offscreen Fresh cards.

Five real worker routes pass waiting and active phase geometry comparisons against the old hidden display:none treatment: Hungry (centered scoreboard), Naval (rail cap), Monster and Spy (content cap), Curling (game-owned). The old display:none condition is temporarily restored only in the test, then removed. Both play and iframe rectangles stay1920×1080 at0,0. A temporarily focusable catalog card cannot receive focus while inert; hidden menu also has pointer-events:none and opacity0. Each route resizes1920×1080→1280×720 while active, returns with inert cleared, opacity1 and all36 catalog cards.

Viewed every `*-playing-parked.png` / `*-playing-display-none.png` pair in `output/playwright/perf-motion133-park/`: Hungry field/notch, Naval grids/rail, Monster prompt/monster art, Spy role-assignment panel and Curling rink/HUD retain placement and materials. Live simulation advances between shots (especially Curling throw→sweep), so these are visual composition checks, not pixel-identical captures. Viewed Curling return720: Host Pick, card artwork, gradients and roster remain composed correctly.

Harness corrections: backend permits15bots, so roster16 uses one real browser participant plus15bots. The Our People summary row also has class player; participant counting excludes `.tv-more`. The initial raw report stops at the overinclusive roster count assertion, after all five mode checks passed. Corrected roster/reduced-motion tail evidence is recorded separately below.

Final corrected retained-lobby run passes in full on the grid-transition guard source: `output/playwright/perf-motion133-park-final/report.json`. All five mode rows,16 participants and reduced-motion checks pass; the roster bounds end at676.375px on a720px stage. `scripts/qa-perf-phone133.cjs` also passes Chrome/WebKit × normal/reduced after artwork retarget: lost capture, close during drag, fresh drag after reopen, negative rubber-band rebound and rapid close/reopen. Evidence: `output/playwright/perf-phone133/motion-retarget-final/`. These correctness runs are not timing benchmarks.

The park-final description screenshots/styles precede the later user-requested all-card metadata update; use the newer metadata capture set for that visual acceptance.

Final metadata verification: `scripts/perf-motion133-metadata.cjs` and `output/playwright/perf-motion133-metadata/report.json` pass all36cards on TV1920/1280 and native fixture393/320. All card player ranges are numeric-only with existing friends.svg pseudo mask; Tankarena has English Joystick, bullet.svg and7, without visible Players/Weapons words. TV Tank description computes color(srgb .849882 .936627 .694510), opacity.66, italic18px; native description styling intentionally unchanged. TV friend icon computes color(srgb .954196 .996863 .871373), width13.79px; native rgb(203,187,234), width12.64px. Bullet mask widths13.79TV/11.5native. Fresh six screenshots live beside report. Viewed both TV sizes and native393/320: TV composition intact, descriptions tinted and subordinate to artwork. Native393 Tank tag is crowded near favorite star; flagged to root for inspection before visual acceptance. All browser/server processes from these runs closed. These native-fixture captures are browser rendering evidence, not physical-device validation.

Native tag follow-up resolved: two scoped rules in `public/native-shell/host-ui.css` compact Tankarena tag padding and internal gaps only at381–700px phone widths. Fonts, icons, artwork, favorite position, TV and320px rules unchanged. Refreshed metadata harness asserts actual weapon count fits inside tag and tag clears star at all four sizes. Native393 weapon right124.48px, tag right131.48px (7px breathing room), star left145.5px (14px gap); native320 remains weapon142.48/tag155.48/star260px. Fresh393 screenshot viewed: Joystick, bullet and7 fully visible. Report passes and all six screenshots regenerated in the same gallery paths; browser/server closed. CSS SHA256072ff2a4c281ee51fb022664ea60d176189978b210f99f8f22a0ad8e4f925652.
