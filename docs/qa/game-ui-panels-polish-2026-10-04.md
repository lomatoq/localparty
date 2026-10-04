# In-game UI panels: visual polish (2026-10-04)

Owner: Claude game-UI-panels agent. Scope: visual finish of in-game panels on phone controllers and TV game frames. The layout does not change. Pause/Lobby, the TV header notch (owned by the header pass), per-game theme fills and authored pressed or selected states are left as they were.

## Files

- NEW `public/game-ui-polish-20261004.css` (the only stylesheet this pass adds or changes)
- `server.js`: one `<link>` appended to the game-frame injection after `game-ui-themes.css` (it loads last), plus one entry in the static whitelist so `/game-ui-polish-20261004.css` is served
- `public/index.html`, `public/tv.html`, `public/native-shell/index.html`: one `<link>` each, last in `<head>`
- No per-game CSS or JS files were edited. Rules that target one game live in the shared file and are scoped by `[data-party-game=…]`.

## Critique of the state before this pass

All 36 games were captured at phone 393×852 and TV 1280×720 mid-game (`.localparty-build/ui-panels-20261004/baseline/`). Observations:

1. **Passive info cards and stat groups look flat.** Bomb, Push, Shrink, Knives, Western, Tank Arena, Kart and others use one approved pearlescent film. It has no light direction, the rim is faint (`#d4c0ed24`), and the shadow is a 24px haze at 14% that you cannot see on the dark brick. The cards read as a smudge rather than a tile.
2. **Hard dividers make T-joints.** In 2- and 3-up stat groups, a full-height 1px divider runs into the rim. In Knives (two columns) the divider sits exactly on the approved centred top and bottom accent lines, so they cross.
3. **Labels are low-contrast.** Stat labels use `#b9b1c9` at 12px on lilac-grey. At arm's length on a phone they are the weakest text on screen.
4. **Values have no depth.** Heavy italic numbers sit straight on the film. On themed or tinted cards (Bomb SAFE, Snake “Out”) they lose crispness.
5. **Arcade instrument cards use a different shadow language.** Tap Race, Punch Meter, Flappy, Hungry, Snake Lines and Carry Ball have a broad `0 8px 24px` haze. It does not match the other cards, and their inner dividers are also hard full-height lines.
6. **Some lime primaries are flat.** Most primary actions (Throw, Fire, Tap, Hold & Release, Shoot) have a lit top edge and a pressed lip. Crane DROP BLOCK, Charades GUESSED, Mines OPEN TILE and Siege ability are plain slabs with only a glow, so they read as less tactile than the rest.
7. **Some secondary keys are flat.** Crane LEFT/RIGHT, Charades SKIP, the Mines direction pad, Poker FOLD/CALL/RAISE, Chaos cursor keys, Marble SWAP, Tanks/Kart hand swap, Jenga layer stepper and Punch ALLOW MOTION all had `box-shadow:none`. They look like flat grey rectangles next to the sculpted primaries.
8. **TV ranking rows look like wire frames.** Rows on the TV (Kart, Charades, Draw & Guess, Naval, Tank Arena, quiz ladders) have a rim but no lit edge. Against busy fields they read as outlines rather than rows.
9. **TV live standings rows lack separation.** In Bomb Tag, Push, Last Circle and Color Knives, the metal rows sit flush on the field without a contact shadow, and the score numerals have no depth.
10. Out of scope, recorded for owners: in Spy TV “Everyone checks their phones”, player names are drawn over the avatar's lower edge. That is a layout issue, not a finish issue, so this pass left it alone.

## Treatment (one coherent material)

Tokens on `.hp-ui`:

- `--hpp-rim` `#dccaf53d`: a slightly crisper fine rim.
- `--hpp-sheen`: an inset 1px top highlight `#fff4ff33`, which lights the card from above.
- `--hpp-floor`: a quiet inset lower lip.
- `--hpp-volume`: an inset soft falloff toward the bottom, `0 -16px 24px -16px`.
- `--hpp-lift`: a tight contact shadow `0 1px 2px` plus `0 10px 20px -11px`. The negative spread keeps it inside 6px on each side, so it is never cut by a scrolling rail's clip.
- `--hpp-pearl`: the approved pearlescent layers, unchanged (two centred 38×1.5px lines and two diagonal tints), plus one vertical top-lit falloff layer underneath.
- `--hpp-label` `#cdc3de`: label ink.
- `--hpp-ink-shadow`: crisp value depth `0 1px 0` plus a soft 9px shade.

Applied to:

- Phone passive cards (`.hp-info-card`, western/combat child cards): rim, top-lit pearl, sheen, volume and lift. The approved centred top and bottom lines keep their exact size and colour.
- Stat-group dividers (`.hp-stat-group`, arcade `#arcadeStats`, `#punchResult`): they fade out 16% from each end, which removes the T-joints and the crossing with the centred accents.
- Stat labels: brighter label ink. Values: ink shadow only, with no colour change, so semantic colours such as SAFE, Out and lime stay as they were.
- Arcade instrument cards: they keep their authored game tint and rim, and take the shared sheen, volume and lift instead of the broad haze.
- TV display-only cards (the shared “passive card” finish): the same material, with a TV-distance lift.
- TV live standings: a brighter top edge, a tight contact shadow inside the 8px gap, and ink shadow on the score and rank.
- TV ranking rows: an inset top sheen and an inner falloff. Fills stay authored. Gradient place digits are untouched, because a shadow would bleed through the clipped text. The score gets ink shadow. Active and turn rows keep their authored glow.
- Flat lime primaries (Crane DROP, Charades GUESSED, Mines OPEN TILE, Siege ability): an inner top sheen and an inner lower lip, painted inside the box so the visual bounds do not grow, plus a soft lime contact shade. This applies only in the idle state; pressed and disabled states are authored.
- Flat secondary keys (list in critique item 7): one “key” finish with a lit top edge, an inner lower lip and an inner falloff. Pressed, active, selected and disabled states are excluded.

Nothing changes `width`, `height`, `padding`, `margin`, `gap`, `display`, `position`, `font-size`, `letter-spacing` or `border-width`. Radii stay inside the existing family; this pass sets no radius at all.

## Regression proof (geometry)

Method (`scratchpad/polish-toggle-sweep.cjs`, copied to `scripts/` is not needed): the real launch path is used. A phone joins with the long name “Alexandria Longname”, 3 bots, force-start, and the capture runs about 4.5s into play. In every frame of the phone page and the TV page (shell plus all game iframes), one synchronous `evaluate` does the following:

1. disables the polish sheet,
2. records the `getBoundingClientRect` of every element in `body`,
3. enables the sheet and records again,
4. disables it and records a third time.

No game JavaScript can run between these snapshots. An element counts as changed only if its box differs by more than 2px between polish-off and polish-on, while the two polish-off snapshots agree. Overflow state changes are also recorded. A CSS custom property sentinel (`--hpp-sentinel`) confirms the toggle took effect in each frame (`->on`).

Codex integration118 independently repeated the valid 36-game live phone/TV A/B sweep: 0 geometry or overflow changes and 0 browser errors. Native bridge + tabs at 320×568 additionally checked Crane, Poker and Swarm Gate. See `integration118-panels-pocket-review.md` for per-run provenance and exclusions.

## Captures and montages

Fresh TV originals for all 36 valid games were opened by the independent reviewer. Sources: `output/playwright/integration118-panels-pocket/panels-all36/` (34 valid games) and `panels-supplement/` (Swarm Gate and Peek Shoot). Two invalid fixture IDs remain documented in the raw report; they are not app failures. Gallery: `output/playwright/integration118-review/index.html`.

## Tests

Codex integration118 full suite: 679/679 passing, followed by Party/Spy integration checks. Pocket full renderer seven-family replay: 493 snapshots; amended effects test passes full/reduced motion. This is current independent integration evidence, not a claimed Claude test result.
