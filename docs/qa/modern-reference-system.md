# References checked — 27 September 2026

Readability and reliable controls take priority over the publication year. No third-party artwork/code was copied into HeyPals. The table distinguishes verified source metadata from visual review; opening a catalogue is not inspecting an animation.

| Reference | Date and verification | Adaptation for HeyPals |
|---|---|---|
| [Osmo: Morphing Play/Pause](https://codepen.io/osmosupply/full/yyyzMee), indexed by [Codrops](https://tympanus.net/codrops/hub/author/osmo/) | Codrops listing dated **28 April 2025**; live demo URL resolved. Animation not visually verified in this run. | Candidate for one stable pause/resume button: change symbol in place, preserve hit target and accessible label; no delayed input. Reduced-motion uses an immediate icon change. |
| [Osmo: Interactive Tab System with GSAP](https://tympanus.net/codrops/hub/author/osmo/) | Listing dated **30 December 2024**; catalogue description verified, not interactive inspection. | Selected tab should retain its slot; selection indicator moves, text and surrounding layout do not. Apply concept to catalogue categories, not game controls. |
| [Osmo: Draw Random Underline](https://tympanus.net/codrops/hub/author/osmo/) | Listing dated **6 May 2025**; catalogue description verified, not hover inspection. | Restrained highlight for optional desktop navigation; touch and keyboard have equivalent persistent selected/focus states. No hover-only essential information. |
| [BALL x PIT UI collection](https://interfaceingame.com/games/ball-x-pit/) | Catalogue labels title **15 October 2025**; this is the date displayed for the game, not a verified screenshot upload date. Available categories include character selection, audio settings, stats and game over. Image requests returned cache-miss/inaccessible responses. **No visual conclusions claimed.** | Use named screen categories as review coverage: character choice, settings, active HUD and final outcome each need separate captures. Specific composition borrowing awaits visible screenshots. |
| [Reddit: “Hover effect on grid menu … mini Snake game”](https://www.reddit.com/r/webdev/comments/1i23959) | Search discovery dated **15 January 2025**; community discussion, not a primary design standard or a validated usability study. | Discovery prompt only: playful hover must not require users to dwell before recognising or activating a category. No quantitative claims based on votes. |

## Why these libraries

The initial discovery pass included community discussions: [game UI resources, November2025](https://www.reddit.com/r/UXDesign/comments/1p1q9vw/game_uiux_resources/) and [where designers find inspiration, November2025](https://www.reddit.com/r/UI_Design/comments/1otwox1/here_do_you_actually_find_ui_inspiration_that/). These help find sources; votes are not evidence that a pattern works.

- [Interface In Game](https://interfaceingame.com/): real game screens organised by state. Useful for multiplayer HUD, lobby and results coverage.
- [Game UI Database](https://www.gameuidatabase.com/): another game-specific candidate. Automated access was blocked, so its individual examples were not reviewed.
- [Mobbin](https://mobbin.com/): real product flows rather than isolated concept art. Relevant to joining, settings and recovery; mobile productivity layouts are not automatically suitable for a party controller.
- [Codrops](https://tympanus.net/codrops/): dated interactive examples. Useful for restrained transitions and selected states, with separate touch/reduced-motion testing.
- [Hoverstat.es](https://www.hoverstat.es/): exploratory visual directions. No individual example is accepted as a HeyPals usability rule from this pass.

## Primary guidance: Material3 Expressive

[Google’s research overview](https://design.google/library/expressive-material-design-google-research) explains how colour, size, shape and grouping draw attention to important actions. It also reports that removing labels or replacing familiar lists with an unstructured composition can damage usability. For HeyPals, this supports a prominent main action, bounded groups and visible labels—not adopting the Android visual identity. Its research results are not measurements of HeyPals. Article text was reviewed; linked image responses were inaccessible for dependable visual inspection.

## Font shortlist with primary verification

Manrope + real-italic Exo 2 are already installed locally. These additional candidates are **not installed or silently substituted**:

- **Onest**, upright variable100–900. Official [Google Fonts metadata](https://raw.githubusercontent.com/google/fonts/main/ofl/onest/METADATA.pb) lists Cyrillic and Cyrillic-ext, added6 September2023. [OFL1.1](https://raw.githubusercontent.com/google/fonts/main/ofl/onest/OFL.txt). Candidate for compact names, settings and explanatory text alongside Exo 2 accents. Its age does not make it unsuitable; it is not presented as a2026 release.
- **Golos Text**, upright variable400–900. Official [metadata](https://raw.githubusercontent.com/google/fonts/main/ofl/golostext/METADATA.pb) lists Cyrillic/Cyrillic-ext, added6 January2023. [OFL1.1](https://raw.githubusercontent.com/google/fonts/main/ofl/golostext/OFL.txt). Candidate for especially text-heavy rules and multiplayer lists.

Before either replacement, compare actual `Пётр · Ёжик · Ілля · Ўладзімір · 0:59 · 1000` at320px and TV720p/1080p; metadata coverage is not a substitute for rendering individual glyphs. Do not synthesize italic for fonts with only upright files. Preserve the licence when bundling.

## Verification limitation

The CUA in-app browser was unavailable. Native Chrome discovery took408 seconds; a subsequent navigation failed to enter the URL correctly and its temporary tab was closed. Direct source-image requests also failed. Consequently this pass establishes a small, dated source shortlist and explicit adaptation hypotheses, **not a visual approval of those external examples**. The local HeyPals shared-result component itself was visually inspected and layout-tested separately, as documented in `shared-ui-implementation.md`.
