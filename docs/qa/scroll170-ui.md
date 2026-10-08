# UI pass 170

## Shared behavior changes

- Native host and controller hero illustrations enter once after decode. No reverse scroll timeline on the hero; returning to the top cannot restart the entrance.
- The native sticky genre strip no longer scales itself using a view timeline. Sticky geometry reads are batched before CSS variable writes, and unchanged values are not rewritten.
- Expanding the browser QR hint does not increase the underlying hero art height. QR body height/opacity use one interruptible easing (340ms open / 260ms close), and the feathered text mask clamps its stops when nearly closed.
- Native catalogue descriptions use each card's own palette mixed with white, retaining italic hierarchy. Browser controller colors are unchanged.
- Reduced Host Pick/hero gap; the hero's base surface extends horizontally across the viewport without a huge box-shadow.
- Bottom Back centers when it is the only visible footer action; paired actions remain in their row. Direct dialog children do not change the dialog layout mode.
- Shared guarded outside-tap dismisses modal dialogs and profile through the existing animated close path. Drag/scroll and touches within content do not dismiss; nested dialogs close only the top modal. Confirmation cancellation returns an empty value.
- JS-managed dialogs retain transition:none after open is removed, preventing the legacy overlay/display transition from showing the backdrop again for200ms.

## Evidence

- `scroll170-popups.cjs`:24 browser states, zero errors, centered solitary Back assertion.
- `scroll170-qr.cjs`:9 web-controller open/interrupt/reverse cases, zero errors. Real-time videos, not animation seeking.
- `scroll170-menu.cjs`: palette-dependent descriptions verified; standard host/controller screenshots captured.
- `scroll170-scroll.cjs`:36 assets loaded; Chromium fast-scroll hero residual1.47px vs prior12.94px. Geometry measure only, not physical FPS.
- Outside-tap agent:10 Chromium/WebKit cases; closed modal overlay ghost frames13→0 in controlled baseline.
- Chromium visibly blurs backdrop. Playwright WebKit fails even a minimal isolated blur fixture; physical user confirmed controller blur works. Do not add a full-scroll-height filter fallback because of this renderer limitation.

Gallery: `output/playwright/scroll170/index.html`. Device/AirPlay validation remains separate. Optimization agent continues real state-change investigation beyond idle snapshot savings.

## Follow-up build 136

- Bots content/top-layer/position now prepare before the shared entrance animation. Both engines recorded intermediate opening and closing opacity (8–10 frames), with valid geometry at animation start. Videos: `output/playwright/perf171/bots-motion/`.
- Profile parallax no longer writes a root CSS variable each frame: localized and suspended while covered. Controlled 700 ms repeated opening: task 542.4→81.5 ms, style 440.1→29.0 ms; this is a browser subpath measurement.
- TV catalogue decorative animations pause outside the clipped viewport and resume at the same phase. Real-server resource loading and visibility tested. Three paired 4K runs: median task −18%, style −23%.
- Release 0.11.7 (136) compiled; both product verifiers passed. Installation/physical AirPlay acceptance tracked separately. Build 135 install attempt failed with CoreDevice connection interrupted; no successful installation claimed.
