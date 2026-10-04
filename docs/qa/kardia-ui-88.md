# Kardia UI replacement — 88

Final user-approved role mapping:

| Role | Actual face |
|---|---|
| All headings, card titles, action buttons, large catalogue ordinals | Kardia Fat Runner, uppercase |
| Body, player names, labels, numbers | Kardia Fit |
| Descriptions, instructions and rules | Kardia Fit Runner |

The shared CSS declares explicit KardiaFatRunner, KardiaFit and KardiaFitRunner families. Existing HeyPalsDisplay/Text/Numeric/Celebration/Copy and legacy Rubik/PartyRubik/Anybody/Onest/Oxanium/Unbounded/Manrope/Exo2/Inter names resolve to Kardia assets too, so existing inline and canvas references are not silently left on the old font. No synthesized weight or italic is used. Old font-face declarations were removed from shared CSS and family CSS; root removed the two Chaos HTML declarations and updated generic canvas font strings separately.

The supplied archive has eight static OTF faces. All have English alphabet and digits; none contains Cyrillic. This was reported before replacement; the user explicitly said Cyrillic is unnecessary. There are no explicit old-family Cyrillic fallbacks. Unsupported user-name glyphs use the browser's default fallback. `kardia-font-coverage.json` was produced by parsing the supplied OpenType cmap tables directly. Slim is not used anywhere in the new role mapping. WOFF2 tooling was unavailable, so original OTF files are used without conversion.

The included `iFonts-License.txt` states “Demo for Personal Use” and links to the distribution page. It is preserved verbatim at `public/assets/fonts/kardia/iFonts-License.txt`; no claim of an OFL or commercial license is made.

## Actual verification

WebKit, real launcher and game sockets, no invented scores/state:
- Knives and Punch Meter:320×568 and393×852 controllers, TV1280×720 and1920×1080. Loaded Kardia assets, primary/copy/numeric roles, horizontal bounds, stats/controls and reserved footer pass. All four phone images plus TV720 images visually inspected.
- Phone lobby320/393 and native catalogue bridge fixture320/393, first/middle/last category selections. Selection geometry remains within1px rounding tolerance. Native titles/cards/buttons and controller headings were visually inspected.
- Fully loaded TV catalogue720/1080: resource lists contain only kardia-fit.otf, kardia-fit-runner.otf and kardia-fat-runner.otf. “What shall we play?” and “Join the party” visibly use the heavy Runner face; right invite copy and main card descriptions remain subordinate.

Evidence directories: `.localparty-build/kardia88-games/`, `.localparty-build/kardia88-catalog-final/`. Corresponding reports include computed role names, styles and actual requested font assets. This is representative layout verification, not a claim that all36 games were recaptured after the font replacement. Root separately validates waiting/profile and builds the app.
