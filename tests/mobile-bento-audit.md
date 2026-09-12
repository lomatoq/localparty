# Mobile and bento audit — 26 games

## Changes
- Removed the separate dark fill/border below the mobile header. The timer overhang still has its30px clearance; the objective shares the continuous game-colored background.
- Collapsed rules sit108px above Ready at874px viewport height. The gap reduces to16px on640px screens. Expanded rules stay full button width, push the title upward, and retain a sticky collapse summary.
- Added `public/value-fit.js`: measured fitting for short HUD/stat values inside their padded parent. Mobile only, strict selectors, no canvas/body-copy mutation. Long values shrink; normal values restore their original size. Observers do not observe their own style changes.
- Removed bento decorative grid/ring pseudo-element which read as inset edge lines, and masked backdrop blur which could leak composited seams. Kept per-game colored gradient and one outer border. Art and preview clip to the card radius.

## Verification
- All26 waiting screens checked at402×874,402×760,320×640: no Ready clipping, rules open/close, expanded width matches Ready, title moves upward.
- All26 active/countdown mobile controllers checked at320 and402px width: numeric leaf text did not exceed its parent bounds. Starts/pause/rules/resume/exit passed. A Chaos readiness race occurred once in the first combined run; rerun of Chaos and remaining18 games passed.
- Value fitting fixture verified9-digit value38px→23.18px inside padded164px HUD; changing back to9 restored38px.
- Desktop bento captures at1920×1080 and3430×1300; inspected featured, wide and small cards. Exact supplied reference reviewed. Latest small-card screenshot has no inset ring/grid strip.
- This is spacing/control validation, not a claim to test every end-state/game mechanic.

## Evidence
- tests/mobile-polish-audit.json
- tests/mobile-polish-wait-*.png (26)
- tests/mobile-values-*.json (26)
- tests/mobile-wide-card-before-*.png (latest after screenshot; legacy suffix from helper)
- tests/value-fit-check.cjs
