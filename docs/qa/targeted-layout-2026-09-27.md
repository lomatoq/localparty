# Targeted layout verification — 2026-09-27

Production layout changes for review IDs 312, 303, 442, 443.

- Punch phone: compact spacing, readable label/value hierarchy, normal-weight instruction copy, responsive stat values and scroll fallback for short screens. Existing sensor/hold controls unchanged.
- Tap Race TV: track fills the available horizontal arena space (1232px at 1280px TV, previously about 680px). Runners counter-scale horizontally to preserve sprite proportions. Long canvas name labels abbreviate instead of squeezing every character into unreadable width; full names remain in the score rail.
- Swarm phone: mode attribute now activates the existing per-game palette and scoped layout. Fire is a compact thumb target beside the aim area, pulse directly below. Left/right hand mechanism untouched.
- Swarm TV: gate health moves to the top-right HUD, clear of all turrets; orthographic camera framing goes from 32 to 30 world units vertically, still respecting the 42-unit horizontal minimum. Physics, input, damage, turret world positions and gameplay rules unchanged.

Real WebKit screenshots: `.localparty-build/ui-targeted/`. Three phone sizes (320×568, 375×667, 393×852) and two TV sizes (1280×720, 1920×1080), across all three games = 15 captures. All nine phone DOM checks reported no horizontal overflow; no page runtime errors. Visually inspected Punch320/375, TapRace1280, Swarm320/393/1280/1920. Gate card and heading bounds do not intersect. Scripts pass syntax and diff whitespace checks. These are playing-state layout checks, not a claim that every game state/physical device has been validated.

Root full-matrix Punch width=0 / scrollWidth=32 report is not reproduced in visible playing controllers here (all three widths are positive). A hidden/transition iframe must be excluded or awaited before applying its overflow assertion.
