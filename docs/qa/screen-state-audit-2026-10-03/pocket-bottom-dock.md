# Pocket Tanks / Pocket Siege — lower TV composition

User scope: move the player list and current weapon down into the unused lower ground. Catalog ID `pocket_siege`, engine `arcade_deluxe`, maximum 6 players. Changes own only `games/arcade_deluxe/public/host.js` and `style.css`. No build/install or frozen-gallery17807 edits.

Impeccable layout/craft-floor and Emil design engineering guided the grouping and material. Baseline was captured and opened before editing; the field, HUD cutout, game graphics, identities and gameplay rules were preserved.

| Before | After | Why |
|---|---|---|
| Current weapon isolated at upper left; crew at upper right below HUD | Existing authoritative weapon/crew DOM reparented into one bottom dock | Related battle information has one spatial anchor; free lower ground is used |
| Six crew cards in the right-side grid | Three columns/two rows at 720p; six columns/one row at 1080p | Names and scores retain useful widths without occupying the sky |
| Weapon shares generic violet material | Compact olive/gunmetal instrument, lime weapon name, restrained shaded surface | Weapon is visually distinct and fits the tank/terrain palette |
| Gameplay panels mounted during preparation | Bottom dock explicitly hidden outside playing/loadout; common waiting shell still hides gameplay iframe/HUD | Preparation remains clean and does not leak the lower panels |

Actual rendered evidence is under `output/playwright/pocket-bottom-dock-2026-10-03/`. Each session uses the real embedded engine, normal clock, one actual controller and built-in test bots; no state or scores injected. Each isolated browser/server closed. No phone PNGs were captured. The gameplay worker reported its provisional `pocket-runtime.cjs` fix frozen before the final matrix; baseline and final gameplay revisions are not treated as identical. The generic capture hash inventory watches CSS/JS/MJS/HTML and does not include `.cjs`; the runtime freeze is owner-attested rather than an automatic start/end hash assertion.

## Per-original visual inspection

| Original | Observation |
|---|---|
| `before-2/pocket_siege-tv-live-1280.png` | Weapon at upper left and two-player list at upper right; ground lower region unused |
| `before-2/pocket_siege-tv-live-1920.png` | Same separated grouping; full-height field preserved |
| `after-2/pocket_siege-tv-live-1280.png` | Centered lower group, weapon then two crew cards; tank names and aim arc remain above |
| `after-2/pocket_siege-tv-live-1920.png` | Weapon scales as a distinct instrument; lower group retains space at sides and below |
| `after-4/pocket_siege-tv-live-1280.png` | Four crew cards in one row beside weapon, all scores visible; no tank/name overlap |
| `after-4/pocket_siege-tv-live-1920.png` | Four-card row centered with weapon; field and parent HUD unchanged |
| `after-6/pocket_siege-tv-live-1280.png` | Six cards in three columns/two rows; weapon aligned to group middle; all tank labels visible above dock |
| `after-6/pocket_siege-tv-live-1920.png` | Six crew cards fit one row; weapon at left, all scores/cards wholly onscreen |
| `after-6/pocket_siege-tv-matchmaking.png` | Preparation shell has logo/art/readiness; gameplay weapon, dock and cap are absent |

All six final gameplay originals and the waiting original were personally opened. Long name uses the established visual ellipsis while full identity stays in DOM/title; no identity text is modified. Existing avatar image nodes and profile source lookup are unchanged, preserving the common circular-photo treatment; these particular sessions use no-photo mascot identities, so they do not independently validate a uploaded-photo device scenario.

Every final `after-2/4/6/report.json` has `errors: []`, `changedFiles: []`. Actual field canvas is still `(0,0,1920,1080)` at 1080p, with no offscreen controls or page overflow. Six-player roster at 1080p is x392,y950,w1496,h90 (bottom1040); at 720p x390,y550,w780,h150 (bottom700). The checked states are initial real aim/preparation; arbitrary future crater/camera states and physical devices are not asserted here.

Verification: host JS syntax passed. The required Impeccable detector ran once; only two existing legacy warnings appeared (`Arial` line32; old bounce easing line171), neither in the new dock. No gameplay tests were added for this reversible DOM/CSS composition.

Final local freeze:

- host.js: `327e5685c9caf1352e0b520a8f905e48939df203e69f581ffb3b70160898f1ba`
- style.css: `792274be07a7e13be5c818345a05029a943c36312c52eeec7cce436e6e1d4dfb`
- Runtime owner-attested freeze during final matrix: `games/arcade_deluxe/core/pocket-runtime.cjs` `f3900dc8de8de0202b7e5ea6dfae625f6b46ee88bc02c26fa813ade00a31cf12`. The separate gameplay owner may fix a further material-fraction bug afterward; this historical layout capture retains its actual hash.

Exact per-session start/end renderer/presentation hashes: `pocket-bottom-dock-source.json`. Art Director independently opened all eight before/final TV originals and found no named blocker in these initial aim states; terrain/death/flight/damage extremes remain the separate gameplay owner's proof.
