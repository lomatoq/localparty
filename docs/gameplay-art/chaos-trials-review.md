# One Cursor Chaos visual review

All 15 real trial setup/update renderers were opened at 1920×1080 with one phone and one bot. Each full screenshot was inspected; `tests/chaos-trials-contact.png` is the overview. Individual evidence: `tests/chaos-trial-01.png` through `15.png`. Machine bounds/results: `tests/chaos-trials-review.json`.

## Corrected defects

- Objective HUD covered bottom playfield targets (Collector exit, Laser switch 3, falling gates). Moved it below the collision space without changing arena dimensions.
- Battery slot text lacked internal padding/alignment. Centered and padded slot/base labels.
- Rotating arms and lasers faded to transparent despite having full-length collision. Their material now remains visible throughout the dangerous length.
- Damage shake replaced the arena scale transform, shrinking the field during hits. Independent translate animation preserves scale. Explicit before/during hit width/height assertion passed; `tests/chaos-hit-scale.png`.

## Coverage

1. Calibration: click target/cursor distinct.
2. Trace: route visible against quiet grid.
3. Battery: pickup/slot distinguishable; corrected label.
4. Collector: pickups and exit unobstructed after HUD move.
5. Maze: walls/checkpoints bounded and distinct.
6. Moving Gates: obstacle bands and opening readable.
7. Tower Heist: turret/core/projectiles readable.
8. Conveyor: direction chevrons and pickups visible.
9. Flight: captured moving obstacle bands after entry.
10. Free Fall: captured moving bands; lower area unobstructed.
11. Orbital Grinder: full dangerous arms visible.
12. Laser Room: full beams and three targets readable.
13. Magnetic Field: magnets/pickups distinct.
14. Role Shuffle: target and progress remain separated.
15. Final Boss: initial shields/core/projectiles readable.

All 15 passed target bounds, document overflow and HUD-outside-field assertions; no page errors. This is debug advancement through real renderers, not human completion of every puzzle. Boss phase 2, every later timed arrangement, physical Safari and long-session network conditions remain outside this bounded visual review. Physics was not changed.
