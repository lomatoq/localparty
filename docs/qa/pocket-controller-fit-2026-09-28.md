# Pocket Siege short-phone control fit

The visual 320×568 review found the weapon/fuel stack pushed FIRE below the iframe viewport. The previous label-floor test correctly passed text size, but was not evidence that all essential controls were on screen.

The scoped `pocket-deck.css` short-height layout now places angle and power side by side. Only the decorative angle dial is hidden in that layout; the real angle slider, numeric value and power control remain. Weapon choice, both movement controls and FIRE occupy full rows below. Rules, input handlers, weapons and physics are unchanged. Weapon description now has its own `hp-copy` span, separate from the upright inventory count.

Actual browser/server verification:

- `.localparty-build/pocket-final-gradient-320/report.json` and `pocket_siege-320.png`.
- `.localparty-build/pocket-final-gradient-375/report.json` and `pocket_siege-375.png`.
- At320 the controller iframe is414px high. Angle/power targets are44px high, movement targets44px, weapon51.2px; FIRE ends at369.7px and is50.5px high. Footer remains outside the controller, visible and hit-testable.
- Keyboard input changed angle45→46 and a real FIRE click advanced the authoritative game snapshot to `flight`.
- No small button labels, text clipping, horizontal overflow or browser errors in these cases.

The320 screenshot was safely published immediately to the numbered gallery. Its predecessor is retained in `.localparty-build/screen-review/history/2026-09-27T21-36-28Z-pocket-compact`. A final full capture follows the remaining shared UI freeze; this report covers the tested tank/aim module, not a new exhaustive drone/air-defense audit.
