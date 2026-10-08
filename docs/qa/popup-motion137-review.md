# Popup motion review — 2026-10-06

Checked 99 recorded scenarios: 72 controller cases (six dialogs, profile, returning-player QR help) and 27 host cases (Host Panel, game detail, confirmation). Each surface ran normal dismissal, dismissal during entrance, and reopening during dismissal. WebKit: 393×852 and 320×568. Chrome: 393×852.

Found and fixed backdrop opacity restarting at 1 on interrupted dismissal and 0 on reopening. The backdrop now gets its sampled start opacity through a scoped pseudo-element rule; it cannot inherit the dialog's custom properties. Native popup entry also has explicit fade endpoints. Short host section headings, game-detail rules headings and group hints are centred without changing list/identity alignment.

Final recordings ran without animation seeking and without screenshot calls during transitions. Per-requestAnimationFrame samples and videos are in `output/playwright/popup137-live-player` and `output/playwright/popup137-live-host`. The review page is `output/playwright/popup137-review/index.html`. Earlier screenshot-assisted diagnostics remain separate. Four shared-motion checks also pass.

Scope: browser runtime using native bridge/tab scripts and simulated native transport. Host windows, profile and QR use real buttons; other controller dialogs exercise the real shared dialog lifecycle directly. This does not certify physical iPhone/AirPlay frame rate, game-specific overlays, or every populated dialog layout. Native deployment remains pending.
