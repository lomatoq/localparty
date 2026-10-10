# Popup close motion 250

Validated candidate only; no phone/casting smoothness or FPS claim.

## Scope

- `public/motion.js` / `public/motion.css`: shared dialog and manual-panel exit lifecycle, interruption, method-dialog/return value, trusted stationary outside dismissal, one native haptic, hidden/reduced cleanup.
- `public/app-ux-20261005.css`: existing mobile sheet selectors use a downward-and-fade endpoint, including Updates; generic floating exit remains .96 scale + 8px + fade. Persistent nonmodal Host is excluded.
- `public/app.js`: profile sheet downward/fade exit, sampled reversible pose, accepted Escape haptic, reduced/hidden cleanup. No identity/profile save behavior changes.
- `public/native-shell/host.js`: only bot prompt outside/Escape registration; no game engine or transport changes.
- `public/updates.js`: remove duplicate dialog-target click dismissal; the shared stationary backdrop path owns it. Buttons and method=dialog remain intact.
- New focused runner `tests/browser/popup-motion250.cjs` and this QA note. Parent publication/build evidence is recorded in `performance250.md`.

Existing 180ms blur crossfade, 93% material and rendered background controls are retained. Exit curves use the existing cubic-bezier(.23,1,.32,1) / existing motion token; runtime libraries unchanged. Close markers/styles are cleaned, stale callback guards preserve rapid reopen, only drag-owned pose is cleared. User Back/outside/Escape haptics occur once; synthetic/programmatic closes and hidden/reduced-motion cleanup stay silent.

## Matrix

| Lane | Result | Notes |
| --- | --- | --- |
| Baseline WebKit 393 | 7 representative rows; known outside-haptic miss | Original six owned sources, current surrounding layout. Rooms outside impact=0; not a harness error. Original mobile exit held opacity=1 until hidden. |
| Candidate WebKit 393 | 26/26 | Native menu, embedded controller, Rules/game/Rooms Nearby + By Code/profile/Host modal/confirm/bots/pause/Updates. |
| Additional WebKit 393 | 4/4 | Stats and Room real launcher handlers; Join guest handler has blank QR, Catalog direct showModal empty fixture. These latter two validate exits only. |
| Candidate Chrome 393 | 30/30 | Includes pointerup + click bot outside, one impact total. |
| Candidate WebKit 320 | 30/30 | Six original open/after-dismiss/closed PNGs. Observed Rooms y=16, h=580; outside coordinate is real top backdrop y=8. |
| Candidate WebKit 960 | 30/30 | Normal dialog surfaces use floating exit; profile remains sheet. |
| Lightweight WebKit 393 video | 5/5 endpoint/haptic checks | Game, Rooms, confirmation, bots, profile; real live Rooms/profile rapid reopen also recorded. No per-frame style/geometry scans or PNG capture. |

Every runtime source SHA256 at start/end/current is equal across all candidate lanes. Full hashes and haptic deltas: `output/playwright/performance250/popupmotion/matrix-summary.json`. No pageerrors. Four `tests/motion-system.test.js` tests, syntax and `git diff --check` pass.

Ordinary exits sample fade and appropriate scale/downward travel before hidden. Methods covered: Back, outside, Escape, programmatic, method=dialog; cancellation returnValue is preserved (`yes` -> `cancel`, outside -> empty). Drag does not dismiss; drag-offset -> close -> rapid reopen preserves sampled pose and clears only its drag-owned offset. Native hidden and reduced-motion preference changed mid-exit commit already-requested closes and clean owners. Persistent Host tab remains nonmodal and closes immediately.

Each trusted Back/outside/Escape row sends exactly one positive native haptic message; programmatic/reversal/hidden/reduced rows send zero. WebKit bot outside recorded pointerdown/pointerup without click; Chrome recorded pointerdown/pointerup/click, still one impact. This checks the bridge messages, not physical motor output.

## Evidence and limitations

Gallery: `output/playwright/performance250/popupmotion/index.html`. Root independently inspected all 30 main WebKit 393 originals, all 12 additional originals, all six WebKit 320 originals, lightweight game frames 51-55 and original floating-confirmation frame 100. PNGs labelled `exit` are **capture after dismiss**, not guaranteed intermediate geometry: screenshot work can finish after the 180ms panel exit. The blur-only state may precede completion of its own 180ms fade.

The rAF probe validates actual intermediate geometry/opacity and records timestamps/events. It adds readback/capture overhead and is not a phone latency benchmark. A separate controlled reversal oracle pauses only owned foreground/backdrop effects for one synchronous state step (no seek), then the new animation runs normally. This prevents compositor-clock advancement from looking like a position reset. The earlier profile ~4.9px delta was not a verified layout jump: diagnostic base top/bottom/height stayed constant, while compositor matrix and rendered rect advanced together.

The lightweight 25fps original video has no per-frame probes. Original frame-0054 (~2.12s in video, approximate) visibly contains a lower/faded native game sheet, and frame-0100 (~3.96s) visibly contains the reduced/faded confirmation. The other Rooms/bot/profile clips can jump from open to offscreen between recorded frames and do **not** prove a smooth intermediate exit. Video-clock alignment to event time is approximate, and this recording cannot certify 60/120fps or active casting smoothness. No timeline was sought for visual acceptance.

Join guest QR and empty Catalog are exit-only presentation fixtures; no populated QR/catalog layout or game/network behavior was exercised. Native menu/controller use actual shipped bridge and persistent-tabs document-start scripts with explicitly local Swift state/Rooms transport fixtures; no physical-device claim follows.

## Preserved attempts

- preparation stall: old settle waited for parked/background finite animation; replaced with bounded foreground-only settle.
- attempt01 WebKit 393: real missing completed bot outside tap; profile cross-clock oracle artifact; pause wrong paint target; Updates fixture loaded from embedded-forbidden /host.
- attempt02 WebKit 393: real Updates exit specificity selected floating endpoint; corrected selector, frozen afterwards.
- attempt03 WebKit 393: no runtime defect; synchronous reversal oracle sampled advancing compositor time. Controlled single-step oracle introduced separately from real-time recording.
- attempt01 lightweight: still had per-frame probes; retained, not used for lightweight claims.
- attempt01 WebKit 320: fixed y20 tap was inside tall Rooms; test now obtains actual outside bounds. No runtime popup shrink.
- attempt01 WebKit 960: background oracle relied on array indices of changing ownership attributes. Final observer holds original node references; direct hidden/display/visibility revalidation passes.

## Reproduce

Run in repository root using the bundled Playwright installation. Every runner uses an own ephemeral local server and closes its context/browser/server in finally, with a 90-second bound. Baseline files are retained in `.localparty-build/popupmotion250/baseline`.

```sh
PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright QA_ENGINE=webkit QA_WIDTH=393 node tests/browser/popup-motion250.cjs
PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright QA_EXTRA_ONLY=1 QA_ENGINE=webkit QA_WIDTH=393 node tests/browser/popup-motion250.cjs
PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright QA_ENGINE=chromium QA_WIDTH=393 node tests/browser/popup-motion250.cjs
PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright QA_ENGINE=webkit QA_WIDTH=320 node tests/browser/popup-motion250.cjs
PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright QA_ENGINE=webkit QA_WIDTH=960 node tests/browser/popup-motion250.cjs
PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright QA_VISUAL_ONLY=1 QA_ENGINE=webkit QA_WIDTH=393 node tests/browser/popup-motion250.cjs
node --test tests/motion-system.test.js
```

Browser/CPU slot released after the final run completed. Physical iPhone without cast, then active external TV/Mac display remain the parent task's separate acceptance gates.
