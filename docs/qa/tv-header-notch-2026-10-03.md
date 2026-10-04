# TV header / notch: premium material, 2026-10-03 (Claude header agent)

> **Superseded in part by Pass 2 (bolder) below.** The owner asked for "смелее и гораздо красивее". The Pass 1 CSS block was replaced. Pass 1 captures are kept in `pass1/` (renamed from `after/`), and the geometry contract is unchanged.

The owner asked for a more beautiful, premium shared TV in-game header. This pass changes surface, light and type only. No box size, padding, top, left, width or grid property changed, so the notch bottom line and every bridge inset (`--party-field-inset-top`, `--party-hud-*`) stay exactly where they were.

## What the header is now (read from code before editing)

The old trapezoid (`polish.css` `.gamebar #gameTitle` clip-path) is already cancelled by `tv-information.css` (`clip-path:none`). The live header is `.tv-info-dock`, which `tv.js` builds from the `.gamebar` children. Its surface is `.tv-info-dock::before`, and it has four compositions (`LocalPartyTVInformation.compositions`):

- `centered-scoreboard`: the top-centre notch (tanks, poker, flappy, carryball…), 600 logical px wide at top 0, radius 0 0 22 22.
- `rail-cap`: a card above the game's side rail (bomb, push, knives, kart, tankarena, crane, jenga…).
- `content-cap`: a bar above quiz content (sinyakquiz, millionaire, spy…).
- `game-owned`: the game draws its own header (`body.game-owns-hud`; bowling, curling…). This pass does not touch it.

## Changes

`public/tv-information.css`, a block appended at the end ("Premium header material"):

- **One material for all modes.** The existing per-game `--game-panel-fill` is now layered with:
  - a top-down light;
  - a restrained lavender/pink pearlescent diagonal sheen (from the design contract's passive-information material);
  - a lit lower lip: a radial glow plus an inset 1.5 px catch-light in the game's rim colour.
- **Rim and depth.** A fine hairline rim at 22 % rim colour, and a soft offset two-layer shadow that falls into the field (no zero-offset halo).
- **Short soft centred lines** (contract rule) on the bottom edge, and on the top edge for cards. On the notch the surface starts at `top:-2px`, so no rim line runs along the screen edge.
- **Lockup.** A small drop shadow lifts the wordmark. The clock and value `#gameTitle` get a crisp 2 px depth shadow plus a faint glow in `--game-number-ink`. Metric values get only the crisp depth shadow, so white numerals stay sharp.
- **Metric group.** In the notch, one faded vertical rule separates the title/clock lockup from the metrics. The separators between metrics now fade at both ends (40 px) instead of hard 32 px ticks. No boxes.
- **Clock urgency (last 10 s).** `[data-clock-urgent]` warms the shown clock to coral `#ff9a86`. Through the registered `@property --tv-hdr-lip`, the lip line and lip glow fade to the same coral over 240 ms. Each changed second gets one `tv-clock-tick` (scale 1.1→1, 320 ms, `cubic-bezier(.23,1,.32,1)`). Under reduced motion the tick and the transition are off and the colour stays.
- **Unchanged:** the authored exceptions (Jenga and Crane keep no surface; `::after` is also suppressed there), Naval's scaled surface, Airhockey's light material and the `tv-stat-tick` and `lp-motion-pulse` value ticks.

`public/tv.js`, in `information()`, three statements:

- `data-clock-urgent` on `.gamebar` when the shown clock is greater than 0 and at most 10 s, not paused and connected. At 0:00, for example Tanks' untimed 0:00, it stays calm.
- `data-motion-value` on `#gameTitle`, only while urgent and the clock is the primary readout, so motion.js pulses it once per second.
- The same attribute on the `#gamePlayers` timer value when the clock sits in the metric column.

Probe, sinyakquiz at 1280: `0:10 urgent` → `0:09 lp-motion-pulse / tv-clock-tick` → `0:09 none` → `0:08 tick`…, colour `rgb(255,154,134)`.

## Geometry proof (WebKit, real launch plus force-start, 1280×720)

`getBoundingClientRect` of `.tv-info-dock` and `.tv-info-center` (the notch). Before = the source before this pass; after = the final source.

| game | mode | dock w×h before → after | notch bottom before → after | frame top |
| --- | --- | --- | --- | --- |
| bomb | rail-cap | 280×132.7 → 280×132.7 | 214.5 → 214.5 | 0 → 0 |
| push | rail-cap | 280×132.7 → 280×132.7 | 214.5 → 214.5 | 0 → 0 |
| knives | rail-cap | 280×132.7 → 280×132.7 | 278.5 → 278.5 | 0 → 0 |
| kart | rail-cap | 300×149.6 → 300×149.6 | 121.7 → 121.7 | 0 → 0 |
| tankarena | rail-cap | 320×132.7 → 320×132.7 | 127.9 → 127.9 | 0 → 0 |
| crane | rail-cap | 336×151.2 → 336×151.2 | 92.5 → 92.5 | 0 → 0 |
| jenga | rail-cap | 336×151.2 → 336×151.2 | 92.5 → 92.5 | 0 → 0 |
| sinyakquiz | content-cap | 888×70.7 → 888×70.7 | n/a (y 173.3 → 173.3) | 0 → 0 |
| millionaire | content-cap | 888×84.5 → 888×84.5 | n/a | 0 → 0 |
| spy | content-cap | 600×77.2 → 600×77.2 | n/a | 0 → 0 |
| poker | centered | 600×132.1 → 600×132.1 | 97.6 → 97.6 | 0 → 0 |
| flappy | centered | 600×113.6 → 600×113.6 | 97.6 → 97.6 | 0 → 0 |
| tanks | centered | 600×113.6 → 600×113.6 | 97.6 → 97.6 | 0 → 0 |
| carryball | centered | 600×113.6 → 600×113.6 | 97.6 → 97.6 | 0 → 0 |
| curling | game-owned | hidden → hidden | — | 0 → 0 |

The millionaire content-cap y follows the game's own anchor, which moves with question length. It varied 174–196 across runs both before and after. At 1920×1080 the notch is 900×170.4 (= 1.5×). At 3840×2160 the flappy notch is 1800×340.8 (= 3×) and the bottom stays at the same logical line. The bridge publishes the field insets from the dock rectangle, so identical rectangles mean identical insets. Every property this pass touches is paint-only (background, box-shadow, text-shadow, filter, absolutely positioned pseudo-elements, transform scale).

## Captures

`output/playwright/tv-header-2026-10-03/`:

- `before/` and `pass1/` (formerly `after/`): `<game>-tv-<width>.png` full TV, `<game>-dock-<width>.png` header crop, `geom-<width>.json`.
- `pass1/` covers 15 games at 1280, plus tanks, poker, bomb, kart, sinyakquiz and millionaire at 1920, plus flappy and tankarena at 3840.
- `pass1-urgent/` (formerly `after-urgent/`): the sinyakquiz clock at 0:08 (urgent coral) and flappy at 7.5 s.

Viewed images:

- before: tanks, bomb, millionaire, poker, flappy, kart, crane, plus the tanks, tankarena, sinyakquiz and poker crops;
- after: tanks, poker, flappy, tankarena, kart, carryball and spy crops; bomb, jenga, curling, knives and flappy full; poker at 1920; the tanks 1920 full frame; tankarena and flappy at 3840; millionaire at 1920 (urgent); the sinyakquiz urgent crop.

Findings from viewing:

- Tanks' arena wall still hugs the notch contour, because the radius was kept at 22 on purpose: games draw around that shape.
- Curling's game-owned header is untouched.
- Jenga and Crane stay surface-less.
- No text clipping or ellipsis change.

## Tests

`tests/tv-notch-layout.browser.cjs` and `tests/tv-game-layout.browser.cjs` **fail identically before and after this pass**. I ran both on the untouched source first.

- **notch test:** it asserts that `#gameContext` and `#gameTitle` sit at least 9.9 % / 19.9 % inside `.tv-info-center`. The current approved dock gives the centre column 100 % width (`#gameContext` left = 0), so this is a stale assertion from the older notch layout.
- **game-layout test:** "Chaos uses available stage area" fails with the same rectangle before and after. This is Chaos field sizing, outside this lane.

I did not edit either test. Someone who owns the current dock design should update them.

## Fix round

First pass, then the fixes:

- Raised the rim, sheen and lip to visible levels.
- Removed the haze glow from white metric values.
- Urgency no longer fires at 0:00 (Tanks showed 0:00 in coral).
- Dropped a 0.01em label letter-spacing so the change is strictly paint-only.
- Hid the rim line along the notch's screen edge.
- Recaptured all games and viewed them again.


---

# Pass 2: bolder (same day, after owner feedback)

The Pass 1 block at the end of `public/tv-information.css` was replaced by "Premium header · second, bolder pass". It is still paint only: no dock size, padding, top, left, width or grid change.

## Changes

`public/tv.js` now creates one decorative `<span class="tv-info-glass" aria-hidden>` as the first child of `.tv-info-dock`. It is absolutely placed, so it takes no grid cell and does not change the dock box. The Pass 1 `data-clock-urgent` toggles are kept.

### Sculpted notch (centre mode)

- The glass extends 28 px past each side of the 600 px box.
- It is shaped by an SVG mask (`viewBox 0 0 656 114`, `preserveAspectRatio=none`):
  - concave shoulders flow out of the screen top into the sides;
  - smooth bezier lower corners;
  - the lower edge is a curve that is deepest under the centre (it touches the original bottom line) and rises 10/114 at the sides.
- The maximum bottom stays at the box bottom.
- A matching open-path SVG stroke (non-scaling, no line along the screen edge) is filled with the game rim colour, brightest at the lower centre.
- `.tv-info-dock::before` is now only a shadow caster (drop shadow plus soft outer glow in the game colour).

### Cards and bars (rail-cap, content-cap)

- Same glass at radius 18.
- A gradient stroke whose brightest points sit on the top-left and bottom-right corners (the chamfer accents), quiet in between.
- An outer drop shadow plus glow.

### Glass volume

- A top bevel light (inset 1.5 px highlight plus a soft inner light).
- A specular diagonal streak and a lavender/pink pearlescent sheen.
- A darkened lower body.
- A game-tinted lower lip (inset 2 px line, inner glow and a radial lip light).
- No backdrop-filter: the game canvas repaints every frame, so a backdrop blur would not be cheap on an AirPlay host.

### Per-game colour

- Rim, stroke corners, lip, outer glow, divider rules and label tint all derive from the existing per-game `--game-panel-rim` (one token, `--tv-hdr-rim`).
- The clock capsule derives from `--game-number-ink`.

### Title lockup (centre mode, timer or live-score primary)

- The wordmark grows from 44 to 50.6 px.
- The clock line-height drops from 39.6 to 33 px, so the column stays exactly 89.6 px.
- The clock becomes a hero capsule:
  - dark well with a number-ink rim;
  - glowing digits;
  - 18 px side padding (only width changes).
- Rail and content caps get the same capsule.
- Text states (Spy's "ASSIGNING ROLES"), Jenga and Crane get no capsule.
- Airhockey's light rink gets a light capsule.

### Wings

- Labels at weight 650, tinted towards the rim colour.
- Values get a lifted depth shadow and a rim-colour glow.
- A glowing faded rule separates the lockup from the metrics; the separators between metrics fade at both ends.

### Life

- **Entrance:** each time the header appears (countdown or game start), the glass drops in: `translateY(-14px) scaleY(.9)` to rest over 560 ms with `cubic-bezier(.23,1,.32,1)`, and the content fades in over 320 ms after 160 ms. Only the glass child and the content opacity animate, never the dock box, so the bridge and field insets never read a moving rectangle.
- **Light sweep:** a skewed light band crosses the glass once every 8 s (first after 1.4 s), clipped by the glass shape.
- **Last-10-seconds urgency is kept and is stronger:** coral digits, capsule rim glow, and the stroke, lip and outer glow all fade to coral through `@property --tv-hdr-lip`, plus one tick per changed second.
- **Reduced motion:** no entrance, no sweep and no tick; the urgency colour stays.

A probe confirms that `tv-hdr-glass-in`, `tv-hdr-sweep` and `tv-hdr-content-in` are active on spy, carryball, tanks, poker and flappy, and that the logo is 50.59 px when the capsule applies (44 px otherwise).

## Pass 2 geometry proof (WebKit, 1280×720)

Every row matches the original before value:

| game | mode | dock w×h | notch bottom |
| --- | --- | --- | --- |
| bomb / push | rail-cap | 280×132.7 | 214.5 |
| knives | rail-cap | 280×132.7 | 278.5 |
| kart | rail-cap | 300×149.6 | 121.7 |
| tankarena | rail-cap | 320×132.7 | 127.9 |
| crane / jenga | rail-cap | 336×151.2 | 92.5 |
| sinyakquiz | content-cap | 888×70.7 | — |
| millionaire | content-cap | 888×84.5 | — |
| spy | content-cap | 600×77.2 | — |
| poker | centered | 600×132.1 | 97.6 |
| flappy / tanks / carryball | centered | 600×113.6 | 97.6 |
| curling | game-owned | hidden | — |

- **Frame top** is 0 everywhere.
- **Other resolutions:** at 1920 the tanks notch is 900×170.4 and poker is 900×198.1; at 3840 flappy is 1800×340.8. These are exactly 1.5× and 3× the 1280 values.
- **Extra games, Pass 2 only:**
  - punchmeter 600×116.7, marble_bloom 600×98.2, chaos 600×113.6, airhockey 600×113.6, taprace 600×113.6, naval 320×149.6.
  - Their primary kinds do not take the resized lockup (except airhockey and taprace, where logo and line-height compensate exactly). Their sizes are unchanged by construction.
- **Millionaire y** follows the game's anchor (question length), as before.

## Pass 2 captures

`output/playwright/tv-header-2026-10-03/`:

- `pass2/`: 15 games at 1280, 6 at 1920, 2 at 3840.
- `pass2-urgent/`: sinyakquiz at 0:08.
- `pass2-extra/`: punchmeter, marble_bloom, chaos, airhockey, naval, taprace; the `airhockey/` subfolder holds the final light capsule.
- **Montage: `montage-before-pass1-pass2.png`**: before, Pass 1 and Pass 2 header crops for tanks, poker, flappy, carryball, bomb, kart, tankarena, sinyakquiz, millionaire and spy.

Viewed:

- tanks (1280 crop and wide zoom);
- poker (1280 and 1920);
- flappy (full and shoulder zoom);
- carryball, bomb, kart, crane full, spy;
- the sinyakquiz urgent crop;
- tankarena at 3840;
- airhockey, naval, marble_bloom, punchmeter;
- the montage.

Tanks' arena wall now flows into the notch shoulders and hugs the sculpted contour.

## Pass 2 iterations

1. The first shoulders (20 px, 6 px curve) were barely visible in the zoom. They were widened to 28 px with a 28 px curve; the Q control points were re-derived so the centre still touches the original bottom.
2. Fixes:
   - The capsule wrapped Spy's two-line text state, so it is now limited to timers and live scores.
   - The logo enlargement is scoped to the same kinds, so the column height is preserved for every other kind.
   - Airhockey's light material had a muddy dark capsule; it now gets a light capsule (the selector needed higher specificity).

## Tests after Pass 2

`tests/tv-notch-layout.browser.cjs` and `tests/tv-game-layout.browser.cjs` still fail on the same pre-existing assertions with the same values:

- the gameContext 9.9 % inset;
- Chaos stage area (title rectangle y 129.58, h 84.19, identical to the untouched source).

---

# Pass 3: quiz bar (content-cap), short pass

The owner asked for the bar above quiz content to match the cards. This was one iteration and one capture round, at 1280, for sinyakquiz, millionaire and spy.

## Changes

**`public/tv-information.css`: block "Pass 3 · quiz bar" appended.**

- **Glass for content-cap only:**
  - a thicker top bevel (2 px highlight plus inner light);
  - a 2.5 px lit lower edge and inner glow in the game/lip colour;
  - lit end caps (3 px glowing bars centred on the left and right ends);
  - a stronger sheen;
  - an outer drop shadow and glow.
- **A soft light band** (`.tv-info-dock::after`, outside the box, paint only) falls from the bar onto the question below and fades in after the entrance.
- **Clock:** the pass 2 hero capsule is kept.
- **Progress pips:** a 64 px segmented pip bar sits under the progress readout ("QUESTION 1 / 10", "turns 2 / 5"). Done segments are in number ink with a soft glow, remaining segments are quiet. It shows only for integer ratios with a total from 2 to 20.

**`public/tv.js`:** for a progress readout, sets `data-pips` with `--tv-pip-done` and `--tv-pip-total` on `#gamePlayers`.

**Kept:**
- last-10-seconds coral urgency (seen on millionaire at 0:10);
- reduced motion: the band fade-in is disabled, and the existing entrance and sweep rules still apply.

## Geometry (1280)

Before = pass 2 baseline, after = pass 3.

| game | box before | box after | position |
| --- | --- | --- | --- |
| sinyakquiz | 888×70.7 at (368, 173.3) | 888×70.7 at (368, 173.3) | same |
| millionaire | 888×84.5 | 888×84.5 | x 368 same; y follows the question anchor (178.9 / 145.4; varied 145–196 across runs in every pass) |
| spy | 600×77.2 at (340, 0) | 600×77.2 at (340, 0) | same |

The other bar-mode games keep their pass 2 baseline, recorded in `pass2-bar/geom-1280.json`: warsaw 888×70.7, crocodile 781.1×70.7, drawguess 636.4×70.7, monster 740×70.7.

## Captures

- `pass2-bar/`: baseline for all seven bar games.
- `pass3/`: sinyakquiz, millionaire, spy.
- `montage-before-pass1-pass2.png`: now four columns (before, pass 1, pass 2, pass 3).

Viewed: the pass 3 crops of all three games. The pips read 1/10 and 2/5, and millionaire showed coral urgency.
