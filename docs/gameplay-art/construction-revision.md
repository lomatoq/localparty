# Construction revision

The previous rectangular skyline and generic concrete cube were replaced with generated artwork: `crane-city.webp` plus the `atlas-construction.webp` sheet. Three front-facing windowed facade modules stack inside the exact110×110 physics footprint. Golden mast/boom segments, trolley and hook share the same camera convention. The fourth facade is a roof-only variant and is deliberately not repeated as an ordinary floor.

The city is screen-space; tower/crane use the existing camera. The foundation is270px wide, matching the physical support. Camera easing now depends on elapsed time rather than monitor refresh rate.

The previous hook followed a synthetic sine and dropped with an unrelated5px/s sideways velocity. `games/crane/pendulum.js` now integrates a damped hanging load driven by trolley acceleration. Release velocity is the derivative of the same rope pose, including trolley velocity. At the trolley boundary its actual velocity becomes zero, avoiding an invisible sideways launch. Rope length is fixed150px. The existing Rapier120Hz stack simulation, collision geometry, per-player turn validation and physical collapse remain intact.

Validation:
- `tests/crane-pendulum.cjs`: acceleration lag, damping, fixed rope length, inherited release velocity, timestep consistency.
- `tests/crane-square-stack.cjs`:15 square floors settle with physical contacts.
- `tests/crane.test.js`:16-player identity/turn handling, invalid drop rejection, placed floors, misses and finalreport.
- Visual state captures and all-game screenshot review are maintained by the independent motion QA pass.

Actual two-phone browser validation: tests/crane-art-results.cjs places two floors, deliberately misses three times through normal controls, and captures host/controller results. Screenshot evidence: tests/art-crane-painted-two-drops.png, tests/art-crane-results-new.png, tests/art-crane-results-phone-new.png. Wall tint proof: tests/facade-tint-check.png. Terminal copy now reports actual completed turns and does not instruct players to continue building after the match.

The final camera target is `max(0, 580 - topY)`. The browser test also checks the actual object-fit canvas projection: after two floors the foundation bottom is 764.72 px, above the status panel at 776.81 px; the crane top is 94.56 px, below the canvas top at 65 px. Both the support and upper crane stay visible. Independent all-game visual closure is recorded in `tests/game-art-final-validation.md`.
