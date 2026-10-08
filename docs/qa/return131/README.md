# Pocket Siege return / Host settings — 2026-10-05

## Changes
- Catalog update signature skips identical UI snapshots; differential properties and source-label caching avoid rewriting translated labels on focus changes.
- Removed the per-focus 540ms filter animation. Existing selection outline remains.
- Reproduced WebKit smooth-scroll failure under CSS zoom: requested offset ~1462px stayed at 0. Focus scrolling now updates offsets over 180ms with interruption and reduced-motion support. Verified the selected Bow Club card is inside the visible 4K viewport (scroll offset 1461px).
- TV remote Up at the first catalog row returns to the selected Host Pick; Down returns to the first game. The command does not change selection or launch a match and retains active/busy validation.
- Pocket/Marble renderer stops its frame loop on results, wakes on the next non-result state or resize, and removes its resize listener on teardown.
- Retired hidden bot controller frames are removed synchronously on stop; expected-instance check rejects queued old launches. Before the fix, WebKit retained two game controller documents 500ms after the second return; after the fix both cycles have zero game documents (27ms and 196ms observed final WebKit cleanup).
- Host Panel background now spans the viewport with an opaque dark base. Header and native dock have reserved space. Only inner scroll content fades.

## Evidence
- `tests/tv-director.test.cjs` and `tests/motion-system.test.js`: 26 passing assertions/tests.
- `tests/browser/tv-return131.cjs`: actual Pocket Siege worker, two bot players, two starts into playing, injected renderer results state (not a full match completion), two stops, zero retained game documents, Host Pick return without changing selected game, 1080p and 4K captures.
- Isolated baseline catalog probe: 20 identical updates generated 1500 mutations; corrected version generates 0. One focus update generates 4 mutations. This is DOM workload evidence, not a measured physical AirPlay FPS gain.
- `tests/browser/host-settings131.cjs`: actual native route with controller bridge + persistent tabs and simulated Swift snapshot transport; 320×568 and 393×852, top and bottom captures, full opaque background, heading clearance, real Up button emits the Host Pick command.
- Gallery: `output/playwright/return131/index.html`; engine-specific reports and source hashes alongside it.
- Visually reviewed WebKit Host settings top/bottom, Host Pick return, and 4K catalog.

## Limits
Physical iPhone/AirPlay and a complete manually played Pocket Siege match remain unverified. No new build or phone installation in this pass. Final acceptance uses WebKit; Chrome reached lifecycle/catalog checks but screenshots timed out at 4K and on the separate phone run. No Chrome capture acceptance is claimed. The earlier broad shell-motion130 harness stopped on a toast mid-animation timing assertion; its partial `return131/phone` captures are not acceptance evidence. The focused settings checks cover the affected surface instead.
