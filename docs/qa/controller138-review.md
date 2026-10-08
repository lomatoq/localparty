# Controller follow-up 138

Source changes after installed build 130; no new device installation yet.

- Profile sheet raised 14 px, retaining safe-area constraints.
- QR: animate a dedicated text viewport rather than clipping the summary and backing; top/bottom gradient masks stay present during folding. Purple quieter arrow. Reversal starts from current height/opacity.
- Host Pick: measured 12 px Start inset at top, right and bottom (11 px right padding plus border); numeric count 14 px and italic caption 11.5 px. Exclude this metadata from the generic 14 px control-label floor.
- Votes: matching 18 px numeric roles, total at 65% opacity; quieter uppercase italic label.
- Mobile game count: violet 15% capsule.
- Fresh: remove snap-back, retain native touch momentum; interruptible 180 ms arrow paging accumulates repeat presses and stops on touch/wheel. This does not amplify native touch movement.
- Fixed the actual compact-catalog override in polish.css: it forced 8/18 px rail padding over the roomier host rule. The rail now provides 44/48 px and a separate vertical feather in its surplus paint gutter; card glow intensity is unchanged. Running catalog card uses a moving light in its border; reduced motion retains a static border.

Checks: Chrome and WebKit paging accumulation/cancellation; profile/QR layout at 320 and 393 px; targeted QR normal/interrupted/reverse transitions. Source syntax and four shared motion checks passed. Physical iPhone swipe/animation feel remains to be checked after a new build.

Review: output/playwright/controller138/index.html. Motion recordings: output/playwright/qr-motion138.
