# Naval and Jenga follow-up · 2026-10-05

## Changes
- Naval: removed28px rounding and clipping from the shared .stage ancestor. Individual fields now use24px rounded water masks and10px cell radii (dense fleets14px/5px), per the subsequent user request. The fields now have complete lower corners.
- Captain rows:64px instead of72px,8px spacing instead of12px, one-line icon metadata using existing health/target/anchor SVGs,14px right padding protecting scores. LIVE centered with its own8px heading-to-feed gap. The whole Captain’s Bridge emblem/title group is centered and lowered6px; Captains and scores uses the supplied KardiaFitRunner. Public shots and scores still come from real server state.
- Jenga latest clarification: only remove the shared amber bottom gradient. Brick backdrop, neutral tint, wooden table and existing sidebar lighting remain exactly as before. Earlier broader sidebar edits were reversed.

## Actual visual checks
- Naval720p4players: four complete field corners; all four compact captain rows fit, score100 comfortably inset; LIVE clear below roster. Icon ratios readable in normal body type.
- Naval1080p4players: same bounded formation, no outer mask clipping; LIVE remains bottom aligned with existing full-height bridge. Large middle negative space is preserved rather than redesigning the panel.
- Naval720p16players: all16field frames fully visible; roster uses its existing internal scroll and soft lower fade; LIVE does not overlap the visible rows.
- Jenga720p+1080p: lower amber glow gone; brick background and intentional warm localized sidebar lighting retained; tower, timer, force and4crew rows remain intact.
- All5runs: no page exceptions or HTTP400+ resources. Browser captures are not physical iPhone/TV validation.
- node --check broadcast.js and scoped git diff --check pass. No gameplay-rule changes, build, installation or push in this task.

Source and original-image hashes: polish124-naval-jenga.json. Independent visual review is recorded by gallery119 in gallery evidence.
