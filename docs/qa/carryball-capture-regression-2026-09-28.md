# Carry Ball capture timeout investigation

The first 36-game UI sweep in `.localparty-build/ui-system-final/captures/states-report.json` completed 35 games and failed Carry Ball at the 10-second wait for a non-zero controller iframe rectangle. Its waiting-screen alignment and locale checks passed. The browser reported no page errors.

That report predates failure-state diagnostics: it contains no parent phase, session state, computed iframe styles or failure screenshot. Consequently, it cannot establish whether the original failure was a delayed start, a hidden frame, or another transient condition. No production defect is claimed fixed from this evidence.

Two subsequent real-server runs passed without changing production code, game phases, or the original timeout:

- Carry Ball alone: `.localparty-build/carryball-regression/captures/states-report.json`.
- Hungry → Snake Lines → Carry Ball: `.localparty-build/carryball-sequence/captures/states-report.json`.

Both exercised normal ready/start, controller dimensions, pause and reconnect. These retries establish non-reproduction, not proof that the original failure cannot recur.

The capture harness now records authoritative `failureState`, phone `failureDOM` (phase/session, font status, frame and waiting/ready element visibility and rectangles), and a failure screenshot. It also emits missing-translation and residual-text summaries when a runtime failure occurs, without treating missing captures as successes.

A further full sweep is justified by the subsequent production typography/layout revision and uses `.localparty-build/approved-type-final/captures`. Its outcome is recorded separately; the original failed report remains unchanged.

The subsequent 36-game sweep also passed Carry Ball, with all 36 game rows successful and empty browser-error, missing-translation and residual-text arrays. Its captures/report were archived to `.localparty-build/approved-type-prefreeze-archive-20260927-225945` because shared UI assets were intentionally edited during the run. This is functional evidence, not a consistent final visual revision.
