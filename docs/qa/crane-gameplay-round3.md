# Night Shift / Crane — gameplay round3

The load now stays visibly suspended and the house sways through real compliant physical joints. Scene and Crew panels share their top/bottom bounds; selected rows, rank, names and points remain inside the panel. The existing authored city/crane/floor art and remote controls are retained. Production source is frozen.

## Evidence

Normal-clock two-controller runs at1280×720 and1920×1080 each reached18 actual floors and then an actual edge miss. No pose, score or outcome was injected. [Manifest](../../.localparty-build/design-round2/gameplay/crane-review.json).

| Measurement | Original direct capture | Final720 | Final1080 |
|---|---:|---:|---:|
| Load X range after20–30s idle, world px | 0.28 | 54.26 | 45.93 |
| Actual placed floors | 6 | 18 | 18 |
| Top X range in highest tower samples, world px | 0.00 (6 floors) | 76.34 (18) | 79.72 (18) |
| Browser errors / owned source changes | 0 / 0 | 0 / 0 | 0 / 0 |

[Before video: isolated baseline reproduction](../../.localparty-build/design-round2/gameplay/crane-before-reproduction.webm) · [After720 video](../../.localparty-build/design-round2/gameplay/crane-after720.webm) · [After1080 video](../../.localparty-build/design-round2/gameplay/crane-after1080.webm). The before video is a fresh run of the exact backed-up game engine/renderer/styles inside an isolated worker, with two import/font paths adapted; it is not a historical recording. The original direct before screenshots/measurements remain in [crane-before/report.json](../../.localparty-build/design-round2/gameplay/crane-before/report.json).

[Suspended load](../../.localparty-build/design-round2/gameplay/crane-accepted720/crane-tv-idle.png) · [Actual drop18](../../.localparty-build/design-round2/gameplay/crane-accepted720/crane-tv-drop-18.png) · [Landing18](../../.localparty-build/design-round2/gameplay/crane-accepted720/crane-tv-landing-18.png) · [Physical tower sway1080](../../.localparty-build/design-round2/gameplay/crane-accepted1080/crane-tv-stack-sway.png) · [Real edge fall](../../.localparty-build/design-round2/gameplay/crane-accepted1080/crane-tv-edge-fall.png) · [Life-loss feedback](../../.localparty-build/design-round2/gameplay/crane-accepted1080/crane-tv-miss.png). These final images were manually inspected; old letterbox-fade iterations are rejected.

[Four players720](../../.localparty-build/design-round2/gameplay/crane-accepted4-720/crane-tv-gameplay.png) · [Four1080](../../.localparty-build/design-round2/gameplay/crane-accepted4-1080/crane-tv-gameplay.png) · [Sixteen720](../../.localparty-build/design-round2/gameplay/crane-accepted-max720/crane-tv-gameplay.png) · [Last complete row720](../../.localparty-build/design-round2/gameplay/crane-accepted-max720/crane-tv-roster-end.png) · [Sixteen1080](../../.localparty-build/design-round2/gameplay/crane-accepted-max1080/crane-tv-gameplay.png) · [Last row1080](../../.localparty-build/design-round2/gameplay/crane-accepted-max1080/crane-tv-roster-end.png). All manually inspected. [Phone393](../../.localparty-build/design-round2/gameplay/crane-accepted720/crane-phone-idle.png) and [Phone320](../../.localparty-build/design-round2/gameplay/crane-accepted720/crane-phone-final-320.png) keep directions/Drop above the shared footer.

## Mechanical and visual choices

The physical rope ends at the rotated bridle apex. Cable, hook and floor attachment use that same endpoint; hook angle and attachment interpolate. Release velocity is the derivative of the actual suspended pose. Bounded authoritative wind sustains the pendulum rather than resetting its angle at each turn. Height increases wind by 2.5% per floor, capped at20. The existing ±0.52rad load limit is retained.

Well-supported landings (at least70% overlap) receive real compliant Rapier revolute seams. Height-dependent motor targets move physical bodies/colliders. Edge placements remain ordinary unbonded collision bodies. A real seam deflection above0.25rad releases the structure. This intentionally changes house mechanics: good overlaps are compliant structural seams; weak overlaps are not glued. Timing matters because sideways suspended momentum is conserved on release. The landing ghost is a ballistic estimate and omits linear drag; it is an aid rather than a landing guarantee. The rejected force-only wind implementation collapsed around floor6; it is not shipped.

The actual rig fits below the measured scene HUD. The foundation is visible at low height; as the real tower grows, the camera follows the crest and lower floors leave the view deliberately. The skyline fades across the entire scene towards stars after floor4. Matching scene/list panel bounds, inset dividers and fixed rank/avatar/name/score columns. One Fit player identity above the Fat Runner action. Centered Building Rules and Crew, clear POINTS column. The list alone scrolls at16 players. Bounded180ms row fade replaces crossing FLIP translations, so names do not animate through each other.

The original [Tower Bloxx designer postmortem](https://www.gamedeveloper.com/design/postmortem-digital-chocolate-s-i-tower-bloxx-i-) describes timed placement, sustained wind, greater height-driven sway and poor edge landings. These are adapted principles, not copied art. [Rapier’s official joint documentation](https://rapier.rs/docs/user_guides/javascript/joints/) supplies the coincident-anchor and PD motor model. The model moves actual colliders; no disconnected visual tower wiggle is drawn.

## Validation and limits

- Suspension tests:3 pass; structure tests:2 pass, including18 actual physical drops, connected seam endpoints, bounded sway, unbonded weak edge and seam break. Legacy pendulum and15-square-floor tests pass.
- The16-socket integration test passes identity, trusted host, stale turn, real timed placements, scores,3 misses and results. Its old blind immediate drops were replaced with waiting on public safe release timing; assertions were not weakened.
- [15 actual-capture assertions](../../.localparty-build/design-round2/gameplay/crane-layout-validation.json) check equal panel bounds, all row columns/roles, entire last row reachability,44px touch minimum, eighteen real landings, sustained idle/tower sway, cable continuity, rig below HUD, physics frozen while paused and same identity after reload.
- Deep18-floor gameplay is2-player;4/16 sessions cover actual live layout and long names. All captured errors are0. The physical iPhone/native runtime has not been installed or played in this task. Play-feel tuning remains a deliberate mechanical change for product review.
