# UI state capture verification

All 36 catalog games passed real-server waiting → ready/start → gameplay → pause/resume → phone reconnect checks. Browser errors, missing translations and untranslated residual text were empty. Carry Ball passed in both full sweeps, as well as its earlier isolated and three-game sequence retries; its earlier timeout remains unreproduced, not assigned a speculative production fix.

The full capture began at `2026-09-27T21:00:24.627Z`. The harness records start/end dates and SHA-256 hashes of 197 production UI files, plus per-game timestamps. It detected changes to `public/game-ui-system.css` and `games/tankarena/public/style.css` during this pass and correctly refused to label the pass a stable revision.

After the root coordinator confirmed the changed selector scope, Push, Shrink, Knives, Bomb, Punch Meter and Tank Arena were recaptured separately. All six passed; their start/end UI hashes were identical. These six rows and screenshots replace the affected captures. The combined report retains the original `assetsStable: false` and full revision reconciliation instead of rewriting history as a single unchanged run.

Evidence:

- Combined 36-game report: `.localparty-build/approved-type-final/captures/states-report.json`.
- Original full-pass report: `.localparty-build/approved-type-final/full-sweep-before-stats-recapture.json`.
- Stable six-game report: `.localparty-build/approved-type-stats-final/captures/states-report.json`.
- Final reviewed asset hash: `6a20d5b4c4b74733a0e409a390f6e79a745882735eec9fc469a37d8fb0aa73d1`.
- Earlier mixed-revision functional pass preserved in `.localparty-build/approved-type-prefreeze-archive-20260927-225945`.

Publishing ran `promote-state-review.cjs`, `sync-review-coverage.cjs`, and `build-screen-review.cjs` successfully. Replaced evidence is preserved under `.localparty-build/screen-review/history/2026-09-27T21-08-26-511Z`; original file dates are retained, so earlier approvals do not automatically apply to new images.

The gallery has 358 screenshots for 360 slots, including 286 of 288 core game states plus supplementary evidence. The two missing slots are real Chaos final results (phone/TV): an earlier actual scenario reached level 12 of 15 without finishing. Existing final-result images for other games were preserved with their original dates and provenance; this normal-speed state sweep does not claim newly completed matches for all 36 games. Synthetic Chaos final-layout examples remain labelled separately.

Jenga redesign is a subsequent task. Its existing captures are evidence of the version tested here, not approval or verification of forthcoming changes. Screenshot coverage is not a claim that every possible gameplay situation or viewport has been exhaustively tested.
