# Performance and curtain regression — 2026-10-05

Integrated browser pass. This report distinguishes synthetic/browser evidence from physical iPhone/AirPlay acceptance.

## Reported failures

- Build125: first game sometimes lacks curtain; Curling launch shows a vertical split then a stuck curtain while the background remains animated.
- Game exit transitions, podium return, catalog and phone controller feel slow.
- Curling continuous shaking fails to sweep; team identity needs a coloured tab.
- TV Our People row backings should be two-thirds as tall without moving avatars.
- Startup should dissolve/scale out gently, not cut; avoid visible gradient banding.

## Changes retained from Claude in build125

The installed build125 contains the app UX lane (`app-ux-20261005.*`: sheet drag, artwork handoff, empty/loading states, vote/join feedback), shared game panels (`game-ui-polish-20261004.css`, shared counter/entrance effects), and TV motion (`tv-motion-20261005.*`: scene doors, logo handoff, pause/overlay/header/roster/podium entrances). Previous Pocket Siege and Swarm Gate art work is also retained. Resource hashes were checked against the packaged125 product, not inferred from filenames.

## Corrections

- First-active-state and startup-not-ready transitions now use the same curtain gate. Curtain stacks above startup. Independent legacy fade timers are cancelled before the curtain owns the overlay. Pause/resume cannot reset an in-flight scene transition.
- Static diagonal panel geometry replaces nested skew/counter-skew clipping. The full masked/blurred/WebGL scene no longer gets rescaled underneath moving doors. Static full coverage is painted before committing the incoming layout; opening waits for painted destination frames. Curtains, logo handoff and individual entrances remain.
- Shared soft-scroll masks update relevant regions, not every region for every unrelated mutation. Reads are batched before writes. Descendant content/class/layout changes still invalidate their ancestor region; dynamic new lists are discovered.
- Control readability measures before changing fonts; icons no longer rescan the full document for numeric-only score/timer updates. Repeated identical dock styles no longer trigger geometry reads.
- Sports 3D scenes precompile shaders asynchronously before first render. Hidden waiting scenes do not repeatedly draw. Scene sizing responds to viewport/density/phase/fonts rather than every score snapshot. No material, mesh, resolution or physics reductions.
- Curling shake detection recognises repeated acceleration-vector reversals, not only separated magnitude pulses. Team identity has a coral/turquoise tab. Our People backing height reduced by one third; content/avatar positions retained.
- Startup logo scales down while dissolving into a bounded pre-blurred logo copy. Static low-opacity grain softens banding. No animated full-screen blur.

## Evidence collected

- 91 sports, motion, bowling/curling physics regression tests pass.
- `curtain132.cjs`: 72 launch/stop transitions across36 games plus first launch before startup completion and direct connection to active Curling. No page exceptions. This checks transition lifecycle, not all gameplay performance.
- Native bridge fixture and browser Curling controllers at393px: continuous alternating shaking sends sweep; stale sensors release it. Team tab screenshot reviewed. Synthetic samples do not validate physical gesture feel.
- Shared shell animation tests WebKit and Chrome at393/320, plus Host settings regression pass: interrupted close/reopen, folding, toast/overlay disappearance, reduced motion, soft masks and opaque settings backing.
- Curling launch/exit and startup filmstrips visually reviewed. Diagonal edges and cleared transitions confirmed.
- CPU profile identified first-use shader linking, repeated geometry reads and icon scans. Before/after browser frame samples are in `output/playwright/perf132/`. No universal speedup or physical-device frame-rate claim.

## Integrated agent work and final measurements

- Game lane: cached Canvas bounds (Hungry 19 to 1, Snake 17 to 1, Flappy/Carry 3 to 1 reads per frame), exact 8 pixel comparisons passed. Retired Deluxe renderers release retained state and effect pools; late callbacks cannot restart them.
- UI motion lane: unrelated body class changes now scan 0 of 300 fixture counters instead of all300; nested score changes still animate. WebKit/Chrome shell lifecycle checks pass.
- Phone lane: interrupted pointer capture, close during drag, and negative rubber-band release fixed. Chrome/WebKit, normal/reduced motion: 20 captures, no exceptions. Synthetic native bridge is not physical touch validation.
- Catalog gameplay sampling covers all36 games across `all-games` and `all-games-rest`. First run stopped on a harness player-count mismatch for Marble; the second run caps bots to each game's maximum and completes the remainder. A cold Spy outlier was repeated separately. Each game's measured gameplay p95 was at most25ms on the completed/repeated samples.
- Final WebKit lifecycle rerun: all72 launch/stop transitions pass, plus cold active Curling and startup-not-ready first launch (`final-curtains/report.json`). No page exceptions.
- Isolated final integrated WebKit run: Hungry, Naval, Draw, Curling and Pocket Siege gameplay p95 18–21ms, maximum 19–38ms; no page exceptions. Phone catalog p95 22ms, scrolled19ms. These are short instrumented desktop-browser samples, not device FPS guarantees.
- IMPORTANT: menu preparation still produces individual 408–457ms frames while the curtain is closed (`revealing`). Some first opening frames remain90–125ms. Paused preparation keeps the largest work behind opaque doors, but does not eliminate it. This remains an optimization target; no all-lag-fixed or tenfold-speedup claim.
- Removed an unused layout read from `openDoors` after the timed run; the raw timing report is explicitly before that final one-line cleanup.
- Fresh representative review: `output/playwright/perf132/review/index.html`. Curling return/menu composition reviewed in the final integrated capture. Agent fixture captures reviewed within each lane.

## Final lifecycle follow-up

- Arcade retirement leak reproduced: closed pages could reconnect and retain frame/interval/sensor work. Explicit pagehide cleanup now closes the socket, cancels RAF/retry/input/join timers and removes sensor callbacks. Persisted pageshow resumes once. Late sensor-permission completion is rejected by lifecycle epoch. Real WebSocket reconnect preserves player identity and authoritative input. Eight pixel comparisons still pass; simulated persisted events verify the contract, not browser bfcache eligibility.
- TV railBounds now writes only changed edge-fade and arrow states. Chrome/WebKit, display and interactive rails: start/middle/end fades and arrow states pass; interior scrolling and eight repeated notifications cause zero redundant mutations.
- Final integrated return131 test: two Pocket Siege returns leave zero retired frames; pause/resume recovers renderer; 20 identical snapshots cause zero catalog mutations; Host Pick reachable after scroll. No page exceptions.
- Final isolated WebKit follow-up after rail/lifecycle fixes (`final-guards/report.json`): Hungry gameplay p95 18ms/max19ms; return still has 427ms closed/revealing and125ms opening frames. The additional guards remove proven redundant work but do not resolve the remaining raster/compositing spike.
- Final source hashes: `.localparty-build/perf132/source-final.json`.

## Remaining validation

- Eliminate remaining menu preparation / first-opening spikes with rendering traces before claiming uniformly smooth transitions.
- Physical iPhone + receiver gameplay, continuous shake sweep and performance validation.
- No new build, installation or push was performed for this integration pass.
