# Polish123 — solid TV numeric backing tiles (superseded alpha revision)

**Historical proof only:** the later user request changed numeric fills to50% transparency. Opaque originals below must not be included in the final delivery; latest proof will be recorded in `polish123-hud-followup.md`.

Only existing numeric backing surfaces changed: `public/tv-information.css:363,376` and the host-only tail of `public/game-ui-polish-20261004.css:138-148`. The launcher header covers31 games;5 native HUDs cover Bow Club and four Sports Siege modes. Every field renderer uses these DOM headers, including canvas/WebGL games, so no canvas exception or renderer edit was needed. Existing unbacked text/status values remain unbacked. Outer notch shading, font/labels, geometry, mobile headers and Pause/Lobby fades remain unchanged.

Applied Impeccable polish/craft-floor and Emil guidance. Numeric wells use an opaque flat game-tinted fill darker than the outer notch. Air Hockey retains dark ink on solid blue darker than its pale rink notch.

| Before | After | Why |
|---|---|---|
| Shared timer radial highlight and transparent base | Opaque72% game base mixed with dark ink | Stable quiet darker numeric surface |
| Air Hockey white radial sheen | Opaque88% rink blue mixed with dark blue | Darker than the pale notch, readable with existing dark digits |
| Native sports/archery fact gradients | Host-scoped opaque darker fill | Same visual role across all36 games |

## Bounded verification

- `node --test tests/tv-information.test.cjs`:15/15 passed. `git diff --check`:passed. One Impeccable detector pass:zero findings (`output/playwright/polish123-hud/impeccable.json`).
- Actual managed launcher matches with human controller pages plus bots:36 TV playing originals at1280×720,13 representative TV originals at1920×1080. All49 full originals opened and individually reviewed. No state seeding. Finite entrance animations settled before capture.
- All53 visible backed numeric tiles report `background-image:none` and an opaque computed color. Secondary text values without backing intentionally remain plain. Shared capsules are48px high at720 and72px high at1080; native sports tiles69.69/104.55px and Bow44.80/67.19px. No new digit clipping or layout overlap in reviewed originals.
- Both owned source hashes stayed identical from capture start to end. Other lanes changed unrelated files during capture; these HUD originals are not a whole-tree freeze or a replacement for final integration review.
- Captures completed and browser/server processes closed. No second capture/repair pass was needed.

## Runtime limitations recorded, not accepted as clean gameplay

- Capture exit assertion failed on one `ResizeObserver loop completed with undelivered notifications` warning per pass: DrawGuess720 and Mines1080. Both frames rendered; paint-only changes did not alter their geometry. Full manifests retain the warnings.
- BowClub720 has two410 responses for `/games/bow_club/assets/atlas-misc/bow-prop.webp`.1080 recorded one WebGL texture-offset warning; reviewed fields rendered. Socket-close console errors occurred across game teardown. No assertion of a console-clean runtime.
- Local Tanks shows0:00 while playing in both resolutions; this is outside the backing paint change and was reported to root.
- Phone appearance, physical-device gameplay and integration build are outside this lane. No build/install/commit performed.

## Source/capture consumer matrix

Every listed720 original is `output/playwright/polish123-hud/720/<id>-tv-playing.png`; representative1080 files use the same filename under`1080/`. Exact original/source hashes and computed tile records: `output/playwright/polish123-hud/hud-evidence.json`. Raw capture manifests retain all errors.

| Game | Header composition | Visible backed tiles720 |1080 original |
|---|---|---:|---|
| push | rail-cap | 1 | — |
| shrink | rail-cap | 1 | — |
| knives | rail-cap | 1 | — |
| bomb | rail-cap | 1 | — |
| western | centered-scoreboard | 1 | — |
| tanks | centered-scoreboard | 1 | Reviewed |
| tankarena | rail-cap | 1 | — |
| chaos | centered-scoreboard | 0 | — |
| kart | rail-cap | 1 | — |
| monster | content-cap | 1 | Reviewed |
| spy | content-cap | 1 | — |
| millionaire | content-cap | 1 | Reviewed |
| sinyakquiz | content-cap | 1 | Reviewed |
| warsaw | content-cap | 1 | — |
| crocodile | content-cap | 1 | — |
| jenga | rail-cap | 1 | — |
| crane | rail-cap | 1 | — |
| naval | rail-cap | 1 | Reviewed |
| drawguess | content-cap | 1 | — |
| western_duel | rail-cap | 0 | — |
| taprace | centered-scoreboard | 1 | — |
| punchmeter | centered-scoreboard | 0 | — |
| flappy | centered-scoreboard | 1 | — |
| hungry | centered-scoreboard | 1 | — |
| snakelines | centered-scoreboard | 1 | — |
| carryball | centered-scoreboard | 1 | — |
| marble_bloom | centered-scoreboard | 0 | — |
| pocket_siege | centered-scoreboard | 1 | Reviewed |
| bow_club | game-owned | 1 | Reviewed |
| poker | centered-scoreboard | 1 | — |
| airhockey | centered-scoreboard | 1 | Reviewed |
| mines | rail-cap | 1 | Reviewed |
| curling | game-owned | 2 | Reviewed |
| bowling | game-owned | 2 | Reviewed |
| swarm_gate | game-owned | 2 | Reviewed |
| peek_shoot | game-owned | 2 | Reviewed |

## Frozen source hashes

- `public/tv-information.css`: `3bc848da6c3fac470840cb808a315d6b6eb767de13e72a03ee9ac53da9bf43d3`
- `public/game-ui-polish-20261004.css`: `67e13f2d238adf5fa6b00ddf4b7ccb0f97d7eada095ac1120a3d61626151af0b`
