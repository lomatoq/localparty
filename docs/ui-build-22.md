# UI build 22 — 0.11.1

## Changes

- External-screen catalog: consolidated TV typography (26 px regular titles, 34 px featured titles, 18 px descriptions), explicit 100% WebKit text adjustment, and compact grid below 1180 logical stage pixels. The 1440×900 / 16:10 receiver now uses three columns instead of squeezing four beside the QR sidebar. Phone descriptions remain unchanged at 12 px.
- Native Start: insufficient-player recovery opens a small anchored bot popover. Plus/minus sends the existing authoritative bot command; count and launch readiness wait for both server count and connected bot roster. No automatic bot addition or automatic game launch.
- The popover supports game limits, pending-command protection, timeout/error recovery, outside/Escape dismissal, and launch from the game-detail modal. English translations cover complete messages.
- External-display diagnostics include viewport, screen, logical stage and actual title/description glyph measurements to investigate physical AirPlay differences.

## Verification

- WebKit catalog checks: 960×540, 1280×720, 1440×900, 1680×1050, 1920×1080, 2880×1800 with mobile WebKit / iPhone UA; all 36 cards, actual glyph scale, caption bounds, gradients, hover, and horizontal overflow. Desktop 1280×900 and phone 393×852 also pass.
- Bot-popover browser scenario: authoritative acknowledgement, double taps, limits, errors, dismissal and detail-dialog interaction; narrow 320 px screenshot inspected.
- 53 unit tests passed across native shell, native localization, Pocket Siege drone and fragment-terrain regression tests.
- Release build succeeded, product verifier passed for 36 games, and nine critical bundled UI resources matched the working tree by SHA-256. Version 0.11.1 (22) was installed and launched successfully on the physical iPhone 17 Pro; device app metadata confirmed bundle version 22.
- Physical AirPlay's previously reported microscopic glyphs were not reproduced in browser automation. The layout and typography fixes are verified locally; physical receiver validation remains necessary.

Superdesign visual refinement is separate from these functional fixes and requires review before applying an additional redesign.
