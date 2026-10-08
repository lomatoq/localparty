# Bowling motion correction — polish123

Focused correction after installed build122. Product files: `games/sports_siege/public/scene-bowling.js`, `bowling-extras.js`, and one stage-gating correction in `bowling-feel.js`. No source edits to deck/alley artwork, physics, match rules, controls, HUD, Curling or menu. No build, install or commit.

## Verified audit before implementation

Used Improve Animations/AUDIT.md for the read-only cause review, then Animate/Emil Design Engineering for the requested execution. Scope: frequent game-state transitions; purpose is spatial continuity, readable outcome and machine feedback. Existing native Three.js spring/smooth curves retained; no animation dependency added.

| Severity | Original location | Reproduced cause | Correction |
| --- | --- | --- | --- |
| High | scene-bowling.js474–501 + bowling-extras.js406–419 | Two camera directors: scene spring returns toward aim while extras independently blends that finished camera toward deck. Early next shot drops this blend over an internally distant camera. | One camera goal and speed-bounded spring; no post-spring reset transform. |
| High | scene-bowling.js355–364 + extras382–390 | Authoritative new rack becomes visibly suspended at aim0, before old pins have been swept. Separate lift curves compete. | Shared lift curve: fresh rack concealed inside housing during sweep, then descends; survivors retain their lifted pose. |
| Medium | scene-bowling.js391–396 + extras394–404 | Sweep stroke ends in.42s and deadwood abruptly vanishes after1s. | Readable.82s stroke, deadwood rolls with bar and drops below pit before removal; rack settles by1.65s. |
| Medium | scene-bowling.js487/495 + bowling-feel.js130 | Large three-quarter impact move, score-time dolly and stage-gated gutter sag interrupt a readable scatter/reset view. | Smaller lane-axis impact camera, no score-time dolly, gutter sag finishes by time rather than a phase cut; brief replay beat also covers partial-rack impacts. |

Baseline: real launcher/two393×852 WebKit controllers; ordinary swipes/range inputs, no injected scores/state/physics. Four rolls9/0/1/9 covered partial rack, gutter, second balls and spare. All-throw trace1746frames reproduced3.253m travel in28ms immediately after an early next shot; maximum wall-sampled speed127.99m/s. First detailed throw alone had1.75m/17ms and2.78° view turn. Build122 originals and fresh baseline originals were opened directly.

## Result and confirmation

Camera stays on the deck through scatter/sweep/set-down, then smoothly returns. If a bowler releases during reset/fly-back, the camera continues from its current pose toward the deck as the ball arrives; it does not retreat to the approach and immediately chase the ball. Input remains immediate. Decorative sweep/table/ghosts stop on live rolling; authoritative pins/ball continue to supply live poses and scores.

One final confirmation batch, sequential normal/reduced1280×720 WebKit matches. Each4 real rolls10/0/1/10 (strike, gutter, second ball, double),19 originals; both reports pass with zero page/console errors and zero missed capture states. Normal2398frames: maximum normal-frame camera displacement.476m, maximum view turn.274°. Reduced2347frames: camera displacement and rotation exactly0. All fresh-rack concealment, finite-pose and no-deadwood-over-live-roll checks pass. Early next-shot camera Z remained approximately−.60 during the first.3s instead of jumping outward.

Original scatter, strike result, sweep mid/clear, descending rack, rack set, return and final idle were individually viewed. `output/playwright/polish123-bowling/viewed-originals.json` lists23 opened originals. Sweep now visibly moves in front of the deadwood; the fresh rack descends after the deck clears. Scatter reads from authoritative fallen-pin poses, not extra fabricated knockdowns.

`node --test tests/bowling-physics-regression.test.js tests/sports-siege.test.js`:42/42 pass (real survivor retention, gutter0, stable settling, score invariance across render rates,300/150 scoring and matching pin profile). These ran before the final early-release camera-only branch; all final edited modules passed syntax checks. Physics/match hashes stayed identical. No additional pool/geometry added; aim draw calls remain98. Browser renderer CPU p95 was3ms baseline,2ms normal/reduced confirmation; CPU measurements exclude GPU completion.

Evidence: `output/playwright/polish123-bowling/{baseline,confirm,confirm-reduced}/report*.json`, original PNGs, `motion-analysis.json`, `tests.json`, and before/final hashes. Per-frame reports include stage/token/age, camera/goal, pin positions/quaternions, table, sweep and ghosts. Capture stalls above50ms are counted separately (66 baseline,27 normal,20 reduced); normal-frame metrics use elapsed frame time. Other2D harnesses may have run; no concurrent3D browser during confirmation. FPS differences are not claimed as product gains.

Limits: latest targeted confirmation is720p;1080p, physical iPhone/AirPlay, GPU frame completion, mid-reset reconnect/pause and zero-wait release before the sweep starts were not newly validated. Native sensor handling is unchanged. No full match to results was repeated; prior build122 evidence plus unchanged physics/match source cover rules, while this batch deliberately targets transition cadence.

## Final hashes

- `games/sports_siege/public/scene-bowling.js`: `809153153db5c4865ccdf642b00d118b7434fddedbb5500c55943ef727b4e9b8`
- `games/sports_siege/public/bowling-extras.js`: `a71a29161cb80fcb456041e2cacaf85104437e059bdc76fc086f9262faf0e113`
- `games/sports_siege/public/bowling-deck.js`: `5f0a4f104ef821f679d93832f5283603c11efd69f6eadf8cb5906309fe233cab`
- `games/sports_siege/public/bowling-feel.js`: `06c734f157c145b4294d24057440d8c9fc34734ac7a43f9951106cc24042dd08`
- `games/sports_siege/bowling.js`: `b15cb59f6923401997c86690c67dbdcb4cf029a721f0ec3665079bf4a1980de0`
- `games/sports_siege/match.js`: `cd962aa59e6c7c66c18a4957ba4e77b3f514aad8f007ca06743deeb75d222f47`

Final hash snapshot rechecked after both captures; no source drift.
