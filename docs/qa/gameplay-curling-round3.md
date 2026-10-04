# curling gameplay audit · round3

Status: accepted-targeted-production.

The controller and scoreboard hierarchy fit. The initial camera z22 sat outside the imported hall near wall atz15.3, so the old aim/earlyrolling white wall hid the field. Following coordinator approval, a one-line environment configuration opens only the near entrance (white/glass/steel triangles in the entrance region). Floor, far wall and side architecture remain. The camera now shows the stone-release path and house before the swipe and tracks the actual stone during rolling. No mechanics, controller layout or shared TV styles were changed in this final repair.

Actual swipe/sweep/settledstone: 8 fresh production images were individually viewed at native resolution, including the initial aim field at both TV sizes, early rolling and settled stone. The capture loaded production host.js directly, without preview overrides or state/score injection. All 6 guards passed; no page errors and no monitored source changes occurred. TV1280×720/1920×1080 and phone320×568/393×852 have explicit bounds/font/input checks. Actual Pause/Resume freezes the game; reload retains identity and score. Mainmenus/matchmaking/footer designs were not changed in this game scope.

Evidence: `.localparty-build/design-round3/curling/entrance-production-final/report.json` and `.localparty-build/design-round3/curling/entrance-production-final/visual-review.json`. The latter is the per-image SHA ledger. Production host.js SHA256: `18c5227e6589b112b44f93aa4dad32c7c22fa4d32e51f822f627da63b74e3e31`.

Latest root shared brick background and compact104px HUD were included in source hashes. Earlier4/16 snapshots are history; this targeted final review does not claim every supported roster or physical device was played. No new Arcade gameplay visuals were started after the finish instruction.

The earlier `curling/frozen` camera captures are rejected and superseded. `camera-opening-preview` remains labeled as a rendering prototype; only `entrance-production-final` approves the fixed production field. The separately accepted normal-clock team-result screenshots predate this field-only repair and do not claim to verify its camera. This repair was made after the installed build99; it must be included in the next local build. The current task did not create or install another build.
