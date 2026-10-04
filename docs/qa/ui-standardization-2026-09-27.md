# UI standardization checkpoint

The user's latest choices are implemented as semantic shared roles, not a blanket style on all elements.

- Game/mode/state and large action titles: Anybody Italic, uppercase. Descriptions/rules/hints: lighter Anybody Italic 400 in sentence case. Player identities: upright Onest. Numeric values: Oxanium.
- Passive information cards: fine contour, restrained pearlescent fill, centered short soft lines at top and bottom. Interactive surfaces are excluded.
- Icon/label buttons: separate decorative icon element, 20 px box, 10 px gap. Icon-only gameplay pads retain their own sizing. Mobile text floor is 14 px.
- Session footer: transparent-to-shell gradient; existing rounded buttons preserved. Space remains reserved so the footer cannot cover essential controls. Lobby uses a real SVG arrow and a short label.
- Western statistics: equal padded cards, 12 px inset, label above number, natural word wrapping. Feedback switches between instructional, event and numeric typography.
- Chaos: joystick/button group centered in the available controller viewport. Accuracy and Action remain functional hold buttons, with lighter treatment.
- Pocket Siege: compact 320 px layout puts direction and power side by side; weapon, movement and Fire remain visible without scrolling. Actual aim and fire were exercised.

## Evidence

- Real WebKit 320/375 Western event/reaction captures: `.localparty-build/feedback-role-qa/`.
- Eight real button-icon captures across Chaos, Crane, Tanks and Swarm: `.localparty-build/button-icons-final/`.
- Real Pocket Siege interaction/geometry: `.localparty-build/pocket-compact-320/` and associated final checks.
- Sixteen browser-player Tap Race results: `.localparty-build/copy-final-results/report.json`; phone320/375 and TV720, long names, scrolling, pause and replay clearing passed.
- Completed evidence is reconciled in `.localparty-build/final-current-320/captures/states-report.json`: 36 games, with subsequent affected-screen captures and original revision/failure history retained. Final visible button checks report no small labels, clipped labels or controls outside the viewport. Detailed scope: `docs/qa/final-current-320-review-2026-09-28.md`.

This checkpoint does not claim physical-device calibration, complete original Pocket Tanks parity, or missing real Chaos final states have been verified. Those remain separately tracked.

Final verification: 449 unit tests and six integration scenario groups passed; unsigned iOS simulator build and both product verifiers passed. Shared statistical divider offsets for Push/Shrink/Bomb are 0 px. The original Chaos initial-layout failure passed its repeated matrix scenario after explicit button sizing.
