# HeyPals — integrated typography and hierarchy

The user chose all three display families, divided by purpose. Latest clarification: **game names, mode names, state titles, large headlines and main actions are CAPS + true-italic Anybody**. Earlier A-only and upright Unbounded headline recommendations are superseded.

## Production roles

| Role | Typeface | Treatment |
|---|---|---|
| Game/card/mode/state title, large headline, primary action | Anybody | True italic750, CAPS |
| Timer, score, numeric readout | Oxanium | Upright650, tabular figures |
| Moderate section label / editorial caption | Unbounded | Upright500; not game names |
| Player names, instructions, long descriptions | Onest | Upright400–550, natural case |
| Secondary action | Onest | Upright550–600 |

Tokens: `--hp-font-action`, `--hp-font-numeric`, `--hp-font-section`, `--hp-font-body`. Compatibility tokens `--hp-font-display` and `--hp-font-celebration` resolve to the action family. Fonts and OFL licences are bundled under `public/assets/fonts/`.

TV actor names keep the body role via existing `data-no-translate`. Pure numbers/time/scores use Oxanium; mixed progress such as `Round 1 / 7` uses the state voice. CSS does not replace canvas-renderer font declarations.

## Actual size hierarchy

Live WebKit measurements in `production/report.json`:

| Phone role | 320×568 | 375×667 |
|---|---:|---:|
| Knives main action, Anybody italic750 | 28px | 30px |
| Knives remaining count, Oxanium650 | 36px | 36px |
| Knives button support, Onest400 | 12px | 12px |
| Punch state heading, Anybody italic750 | 20px | 22.5px |
| Punch main action, Anybody italic750 | 18px | 18.75px |
| Punch counters, Oxanium650 | 25.6px | 30px |
| Punch instruction, upright Onest | 13px | 13px |
| Shared result name, Onest550 | 16px | 16px |
| Shared result score, Oxanium650 | 27px | 27px |
| Shared result heading, Anybody italic750 | 24px | 24.75px |

Native cards preserve the existing18–20px title scale and12px descriptions. Actual catalogue checks cover every visible card at320/375: Anybody italic titles, Onest descriptions and no title overflow. Native host supporting copy is Onest normal400. Catalogue geometry, native tab logic and CSP remain unchanged.

Sports roles were corrected from a large italic player name and tiny task: player identity17px Onest, state20px Anybody, gesture action19px Anybody, power30px Oxanium, supporting lines13px and slider/gesture labels12px. Jenga notice14px upright. Mines timer18px Oxanium, word states18px Anybody. Controls keep their hit areas; the independent audit separately fixed Mines short-screen spacing.

TV uses the existing1280×720 base stage, scaled at1920×1080:

| TV role | Size / line-height |
|---|---|
| Generic phase (`GAME`) | 16px /1.2, Anybody italic CAPS |
| Objective | 16px /1.35, Onest |
| Actual game context title | 22px /1.15, Anybody italic CAPS |
| Main timer or score | 30px /1.1, Oxanium |
| Separate `Time left` value alongside team score | 28px /1, Oxanium |
| `Time left` label | 12px /1.1, Onest |
| Other right progress / metric | 15px /1.2;14px with the large timer |

The original64px wings and104px tapered notch are preserved. Left wing padding8px, gap5px, centred group gives **9.109px above and below**, independently measured in WebKit at1280/1920. Centre padding10px top/14px bottom and6px gap. Separate timer uses an8px horizontal label/value gap,3px vertical gap to the secondary metric, retaining the64px wing. The final timer version is covered by the independent hockey header audit.

## Visual hierarchy

Stats use a single quiet tinted strip with separators rather than separate cards. A winner receives a restrained lime/pink tint and small `You` marker; other result rows are quiet. All16 result rows remain scrollable, full names wrap, and the footer stays outside the scrolling region. Main controls retain tactile shape, dimensions and game/player colour.

Gameplay backgrounds now remove generic shared halos instead of substituting another glow. Exact removed sources: `public/game-polish.css` host-root pseudo-element halos around line518, and the TV `#tvStage>.ambient` layer from `public/tv.css` while the play surface is visible. The known party-engine/hockey body radial fills receive a solid#0c1016 stage. Canvas art, rink texture, team colours and event FX are preserved. Lobby and result celebration surfaces keep their separate state design.

## Implementation and evidence

Changed: shared `game-ui-system.css/js`, self-hosted font/OFL files, native shell CSS/JS inclusion, and the old native forced-Rubik copy rule gated behind `:not(.hp-ui)`. The parent owns `tv.js` timer spans and original phase sizing; the other agent owns the Hockey rail and independent layout audit.

- `capture-production.cjs`: real launcher +2 browser players, normal-speed Knives/Punch, WebKit320/375 andTV720/1080; no injected state. Semantic font family/style, visible primary action, stats/footer bounds and horizontal overflow pass. Intended variable font faces report `loaded`.
- `capture-results.cjs`: real16-player Tap Race, shortened duration only; no injected score/result. Ranks/ties,16 rows, full names, scroll to last player, footer bounds and TV name clipping pass,720/1080 captured.
- `capture-native.cjs`: actual native shell populated through its public snapshot API with real catalogue data.320/375 catalogue and host-copy checks pass.
- Independent header audit measures spacing, clipping, title hierarchy and `document.fonts.check`; parent runs the full36-game sweep.

Actual runtime images and reports: `.localparty-build/screen-review/design-v2/production/`, `production-results/`, `production-native/`. These are distinct from the prototype images.

## Prototype

`index.html` defaults to **Combined · Production roles**; A/B/C comparisons remain. Isolated examples use `?font=combined&screen=knives&solo=1`, with `punch`, `results`, `hockey`, `type` also available. This is a local code-authored art-direction prototype, not a Superdesign-generated draft and not a live match. Production screenshots are the source of truth for current shell geometry. Build with `node scripts/build-art-direction-v2.cjs`.

## Official font sources

[Anybody](https://github.com/google/fonts/tree/main/ofl/anybody), [Oxanium](https://github.com/google/fonts/tree/main/ofl/oxanium), [Unbounded](https://github.com/google/fonts/tree/main/ofl/unbounded), [Onest](https://github.com/google/fonts/tree/main/ofl/onest). Official font metadata and OFLs accompany review assets. Onest cmap coverage includes `Пётр Ёжик Ілля Ўладзімір`; Latin display families use Onest fallback for other scripts. English is the primary design language. No inaccessible external screenshot is claimed as visually reviewed.

## Optional stage comparisons — prototype only

The Combined preview has three stage buttons: **Clean** (production baseline), **Orbit lines** (two fine curves extending the tabletop's physical travel path, with small team-colour terminals), and **Team edges** (restrained corner rails and registration ticks tied to the two sides). These are original CSS/SVG treatments authored for this review, without image generation, copied references or blurred gradients. They are **not integrated into production**. The actual game artwork remains dominant. Use `?font=combined&screen=hockey&solo=1&stage=track` or `stage=edges` for isolated comparison.


## Jenga: applied controller pattern

The Jenga screen is now a real implementation rather than a simulated drawing. Its local `controller.css`/`controller.js` group a rounded layer stepper and spatial left/middle/right blocks above the analog control in one continuous surface. Warm block colour communicates the physical pieces; soft pink identifies selection and the active knob. Secondary controls retain 14px labels and 44–48px touch targets. Layer selection still uses the existing select state and change handler; block selection and analog physics messages are unchanged. The obsolete four-row portrait layout was removed because it conflicted with the new two-part DOM.

Reusable pattern: a concise state + context preview, followed by one rounded work surface with clearly numbered stages. Keep selection visually adjacent to the action it enables. Use 24–28px outer radii, 14–18px control radii and circles for true analog controls. Do not apply this multi-stage structure to one-button games.

`capture-jenga.cjs` launches two real WebKit players, checks both unselected and spectator states at320, down/up layer stepping, server-selected block, visible geometry at320/375, nonzero analog input and server block displacement, and neutral input after release. QA goes to `.localparty-build/jenga-work`; only passing captures are copied to the served review. The Jenga tab shows actual captures, clearly labelled; it does not pretend screenshots accept input.

Host card compaction regression: `tests/host-panel-browser.cjs` now samples each animation frame at393/320, including corner radius, height, content anchor, scroll thresholds and interrupted reversal. A340ms corner transition conflicted with180ms height animation; both now180ms. Actual start32–35ms, full settlement198–203ms; anchor/slot variation0.03125px.


## Latest supporting-copy decision

Descriptions, rules and hints now use **Anybody's real italic face at weight400**, via `--hp-font-copy`, in normal case. This supersedes earlier upright-copy screenshots and notes. Large action/state titles stay uppercase italic750; names stay uprightOnest550; numeric readouts stay uprightOxanium650. Rule paragraphs get8px separation from their label and12–14px between semantic groups, without additional boxes.

Actual WebKit320/375: Knives and Punch descriptions confirmed italic400 with the loaded display face and no clipped controls; Jenga selected/unselected/spectator plus analogserver test pass; native catalogue descriptions and full Millionaire rules pass without horizontal spill. Jenga names are separate upright spans inside italic narrative. DrawGuess long-copy independent QA complements this set.


## Passive information and mixed feedback

`hp-info-card` explicitly decorates passive statistics/context containers: a thin inset rim, contained lavender/pink pearlescent shading and symmetric short centred top and bottom highlights distinguish them from filled, raised controls. The enhancer excludes buttons, form fields, application/gesture controls and canvases; it never assigns the role to every generic panel. Western uses one semantic stats group, with the surface treatment on its existing three visible cards. No dimensions or touch targets are changed by the shared information role.

Western statistics now reserve their actual height, with12px padding,14px word-wrapping labels and20–22px Oxanium values below them. Knives/Western feedback declares its semantic role from existing game state: supporting instruction400 italic, event/state750 italicCAPS, reaction time650 uprightOxanium18px. No inferred text matching or new game mechanics. Real WebKit capture verifies true throw/false-start/reaction events and all card bounds; the Western actual-build tab shows these captures.

Button icon contract: explicit `.hp-button-icon` is20px with10px gap to `.hp-button-label`; `.hp-button-stack` opts into vertical layout. Existing icon-only gesture pads are not altered.

The repeatable mixed-feedback check is saved as `capture-party-feedback.cjs`; it uses three uniquely named real browser players and measures Knives throw results plus Western false-start/reaction states. No production state is injected.
