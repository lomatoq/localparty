# Visual scene QA: new alpha games

This is the living visual gate for `bowling`, `curling`, `swarm_gate`,
`peek_shoot`, `taprace`, and `carryball`. The automated matrix lives in
[`tests/browser/game-scene-visual-qa.cjs`](../../tests/browser/game-scene-visual-qa.cjs).
It captures the real launcher and game iframe at 320, 390, 700, 900, 1440,
and 2560 px with both 2 and 16 players.

Run the complete matrix:

```powershell
node tests\browser\game-scene-visual-qa.cjs
```

The screenshots and measured boxes are written to
`test-results/game-scene-visual-qa/`. A run fails on horizontal overflow,
elements outside the iframe, overlapping HUD/announcement/score rails,
missing or stacked player cards, an oversized narrow-screen announcement,
and a two-player rail that is too small for a living-room display.

## Review from 2026-09-14

### Shared shell and HUD

- **Fixed in this pass:** `taprace` and `carryball` had a desktop three-column
  grid below 700 px. At 320 and 390 px the arena remained wider than the iframe
  and the score panel was almost completely offscreen. Narrow hosts now use a
  single arena column and a compact bottom score rail. The 2-player and
  16-player stress captures pass without horizontal overflow.
- **Fixed in this pass:** Sports Siege announcements used the same vertical band
  as the central heading at 900–1440 px. They now start below the heading and
  take a bounded full-content width. The long shooting-gallery notice no longer
  turns into an eight-line circle at 320–390 px.
- **Fixed in this pass:** Sports Siege cards for two players were only 126×66 px
  on a 1440 px display and collapsed to 37×44 px at 320 px. The two-player rail
  is now 160–184 px per card on living-room widths and up to 148 px per card on
  narrow hosts. The dense 16-player layout keeps its compact icon grid.
- The 320 px shell keeps the bright LocalParty mark, timer and 44×44 controls
  inside their own rows; the game title may shorten while its accessible label
  remains complete.

### Bowling

**Projection:** consistent perspective, one axial camera. The lane and pins
remain readable on every measured width.

**Fixed in this pass:** the obstructive pinsetter/seating groups are gone. A
continuous dark back wall, seven smaller repeated wall modules, bounded cyan
and violet light strips, and a centered neon module now read as one pin deck.
Ceiling modules were reduced so they frame the lane instead of becoming broad
cropped slabs. The lane, gutters and pins remain unobstructed.

Evidence: `test-results/game-scene-visual-qa/02p-bowling-1440x900.png` and
`02p-bowling-320x568.png`.

### Curling

**Fixed in this pass:** all divider and roof modules that crossed the axial
camera were removed. The sheet and house are clear at every tested width.
Benches now form two repeated three-module club zones at `x = ±6.7`; lockers
anchor their far ends at `x = ±7.1`. The larger grouped props remain outside
the side rails and no longer read as isolated tiny objects.

Evidence: `test-results/game-scene-visual-qa/02p-curling-1440x900.png` and
`02p-curling-320x568.png`.

### Не грызи ворота

**Fixed in this pass:** heads, rings and bases now use the same strict top-down
projection. The visual rig moved toward the camera so both circular bases sit
fully below and in front of the wall; the projectile origin moved with the
muzzle, preserving trail alignment. Wall cells overlap their transparent trim
and cover the whole viewport without open gaps. The old detached shot line is
absent.

Evidence: `test-results/game-scene-visual-qa/16p-swarm_gate-1440x900.png` and
`16p-swarm_gate-320x568.png`.

### Кто тут вылез?

**Improved:** the gallery now has a coherent booth background, curtains, wood
counter, front-facing covers, and front-facing targets. The reviewed target
sprites no longer show pieces of neighbouring atlas cells.

**Current result:** every target stays in a front projection; covers, tintable
crosshairs and player labels remain readable. Death frames and shot feedback
do not expose neighbouring atlas cells in the reviewed captures.

Evidence: `test-results/game-scene-visual-qa/16p-peek_shoot-390x844.png` and
`02p-peek_shoot-1440x900.png`.

### Neon Sprint

**Projection:** consistent side-on view. Runner feet sit on their lanes and the
trails originate behind the body in the reviewed capture. Two-player badges are
compact and legible.

The former desktop side panel is now the shared centered lower rail. Two players
receive compact readable cards; 3–8 use a centered grid; 9–16 collapse to an
eight-column icon-and-score grid. The arena stays centred at every tested width.

Evidence: `test-results/game-scene-visual-qa/02p-taprace-390x844.png` and
`16p-taprace-1440x900.png`.

### Carry Ball

**Projection:** consistent top-down view; field lines, goals, ball, and player
sprites share one camera. No sprite or goal is clipped in the 2-player captures.

The player list uses the same centered lower rail as Neon Sprint. Sixteen-player
cards collapse to a compact two-row grid, while the in-field labels remain tied
to the moving characters. Spawn separation is checked after the initial motion
settles.

Evidence: `test-results/game-scene-visual-qa/02p-carryball-390x844.png` and
`16p-carryball-390x844.png`.

## Acceptance rule

A new alpha game chooses one camera contract before art is imported: top-down,
front elevation, side-on, perspective 3D, or an explicitly documented
pseudo-3D projection. All interactive sprites, pivots, tile edges, projectile
orientation, and trails must use that contract. A sprite atlas is accepted only
after a real-scene capture proves that no neighbour pixels, transparent tile
seams, detached trails, mismatched bases, or oversized decorative elements are
visible at both 2 and 16 players.
