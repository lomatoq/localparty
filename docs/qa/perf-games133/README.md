# Arcade render hot-path and renderer retirement — 2026-10-05

Scope: `games/arcade/public/app.js`, `games/arcade_deluxe/public/render.js` only. Existing user/Claude changes preserved. No quality, asset, physics, resolution, animation, or gameplay edits.

Arcade now measures the canvas rectangle once at the start of each frame and reuses it for HUD exclusion conversion, cluster labels and Hungry body diagnostics. The snapshot refreshes every frame, including viewport changes; canvas transforms are still read at their actual draw point.

Deluxe Renderer retirement now clears both latest snapshots, terrain/background/path canvases, sprite references and PocketJuice pools alongside existing SiegeFX/AirDefense cleanup. Retirement is idempotent, and late state/frame callbacks cannot resurrect rendering. The existing host pagehide handler remains the caller. No visible/paused/results rendering scheduling was changed.

## Verification

`tests/perf-games133-browser.cjs` passed in Chrome. It serves the actual Arcade host page, restores only the prior geometry reads for a comparison variant, and runs deterministic 16-player snapshots at 1280×720 then after resizing to 1920×1080. Exact Canvas PNG equality and Hungry projected body bounds equality pass for both sizes. Actual canvas rectangle reads per rendered frame:

| Game | Before | After |
| --- | ---: | ---: |
| Hungry Arena | 19 | 1 |
| Snake Lines | 17 | 1 |
| Multiplayer Flappy | 3 | 1 |
| Carry Ball | 3 | 1 |

The same test instantiates the actual Deluxe Renderer, retires it twice, sends a late snapshot/frame and a resize, and verifies zero scheduled RAF, released state/canvases/pools, and one audio close. Zero page exceptions.

Existing `tests/pocket-juice-browser.cjs` passed in WebKit with full and reduced motion: bounded effects, pause determinism, callout merging and authoritative snapshot preservation.

Fresh 1080p screenshots of all four standalone host fixtures were opened and visually inspected. These deterministic fixtures omit the launcher shared presentation/PartyArt injection; they establish unchanged Canvas layout for the geometry change, not final launcher UI acceptance. Results and images: `output/playwright/perf-games133/`. This is a call-count improvement and correctness check; it is not an FPS, AirPlay or physical-iPhone claim.

## Follow-up: Arcade retirement reproduced and fixed

The original loaded Arcade controller retained two recurring intervals and one charge RAF after a dispatched pagehide; the host retained one draw RAF. Closing the socket just before pagehide also established a new connection after retirement. Recorded baseline: `output/playwright/perf-games133/lifecycle-before.json`.

Arcade now cancels its reconnect timer, join/input intervals and render/charge RAF on pagehide, closes its socket, removes active motion listeners/watchdogs, and invalidates pending motion permission promises. Existing neutral-input reset still runs before closure. Persisted pageshow restarts one frame loop and one fresh connection; stale socket callbacks cannot update the restored page. Ordinary background visibility behavior and all drawing paths remain unchanged.

Verification after the change:

- `tests/perf-games133-lifecycle-browser.cjs` PASS for host and controller: ordinary reconnect, close/pagehide race, zero retained active sockets/RAFs/intervals after pagehide, one resume after persisted pageshow, duplicate events, final nonpersisted retirement. Deferred sensor permission from the retired page cannot attach a listener; a new explicit permission request after restore works and retires cleanly.
- `tests/perf-games133-reconnect-browser.cjs` PASS against the real standalone Arcade server: same player identity and authoritative progress from live tap input after socket loss and persisted-page resume.
- `tests/perf-games133-browser.cjs` rerun PASS: all eight pixel comparisons and retirement checks remain green after scheduling changes.

The lifecycle test dispatches browser PageTransitionEvents with the persisted flag to exercise the bfcache event contract; it does not claim browser-managed bfcache eligibility or physical Safari validation. The actual network test uses real WebSockets. Instrumented callback counts are not heap-GC measurements. No timing/FPS claim.
