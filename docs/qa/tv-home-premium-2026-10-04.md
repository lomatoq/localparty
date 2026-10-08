# TV home premium pass — 2026-10-04 (Claude TV-main-screen lane)

Owner request: the TV main screen at `/tv` (header, hero, Host's Pick, catalogue, Fresh, sidebar) looked "бедненький" and had to become richer and more premium.

## Scope and ownership
- New: `public/tv-home-premium-20261004.css`, which loads last in `public/tv.html`.
- New: `public/tv-home-premium.js`, deferred and decorative only.
- `public/tv.html`: one script and one link added before `</head>`.
- `server.js`: both filenames added to the static whitelist array, next to `game-ui-polish-20261004.css`.
- New capture harness: `scripts/capture-tv-home-premium.cjs`.
- Not edited: `public/tv.js`, `public/tv-menu-polish.css` and the Host's Pick material, which root owns.
- The native host hub and controllers do not load either new file.
- The CSS only changes paint. It does not change padding, margin, size, border width, grid or position on any element that affects layout. Decorative layers live in the existing `#tvStage>.ambient`, which is already hidden while `#play` is visible, and in absolutely positioned pseudo-elements.

## Critique (before)
- A flat, near-black field. The brick and the hero had no light. Large dead zones sat around the headline and above the sidebar.
- The cards were matte, with thin grey rims. The ghost index numbers (07/01/02) read as grey smudges. The genre chips were flat.
- The sidebar used three unrelated materials (muddy green, blue-grey and brown). The QR was a plain white tile. The people rows were dull, and players without a photo got a letter only.
- The tab pill had low contrast.
- In the no-pick state, the "36 games" count sat directly on the mascot artwork and was hard to read.

## Changes
- **Atmosphere:** slowly drifting coloured light pools (violet behind the mascots, pink lower left, cyan lower right, a warm wash under the headline) with an edge vignette. A soft diagonal light sweep runs every 21 s.
- **Lobby props:** seven drifting props (`atlas-lobby-props`) sit in the free hero zone at 0.38–0.62 opacity. They fade out while browsing or when a Host's Pick is active. There are no green hotspots behind the header, and the header fade is unchanged.
- **Header:** the logo gets a depth drop shadow. The tab pill and audio button become glass with a lit top rim. The active tab is a violet lit pill.
- **Hero:** the headline gets a drop shadow for depth. The mascot artwork floats 7 px over 7.5 s. "36 games" and the other group counts sit on a glass chip.
- **Cards:**
  - Each card has a lit top rim and a rim tinted with the game's `--card` colour, plus a soft glow in that colour.
  - The ghost numbers become engraved outlines.
  - The genre chips become dark glass.
  - The art plate gets a top highlight.
  - The featured card gets a halo in its game colour and a light pass across the art every 9 s.
  - Hover, focus and focus-visible lift the card, add a colour glow and show a lime focus outline. This is inert on AirPlay, but ready for pointer or remote input.
  - The "On phones" bevel is crisper.
- **Fresh:** a lit glass shelf with a glossy badge. The glow stays inside the existing 44/48 px reserve, and there is no mask inside Fresh.
- **Sidebar:**
  - One pearl-glass family with three accent tints: lime for the invite, violet for people, gold for the ranking.
  - Each card has the contract's short soft lines centred on its top and bottom edges.
  - The QR is the hero, with a lime-lit frame. Nothing animates over the code itself.
  - People rows are glass pills with ringed avatars.
  - Players without a photo get a stable mascot (`atlas-mascots`, chosen from a hash of the name) behind the existing initial badge.
  - The leader row gets a lit gold rim and a glowing medal.
- **Motion:** easings are taken from the emil/animate tables. The global `prefers-reduced-motion` reset in `glass.css`, plus explicit rules in this file, stop every new animation.

## Regression proof
- Captures use the real launcher (non-embedded, so the live LAN QR is visible) and real `/play` joins. Some players use photos, and company standings are seeded so the ranking appears.
- The matrix covers 0, 4 and 12 players, with and without Host's Pick (`tanks`), at 1280×720, 1920×1080 and 3840×2160. Scrolled-catalogue captures cover 4 players in both pick states. That makes 24 captures each for before and after.
- Bounding boxes of the following were recorded before and after: header, logo, tabs, audio button, intro, headline, hero, preview, browse, catalogue, Fresh, featured card, sidebar, invite, QR, people, players and ranking.
- **Result:** no box differs by more than 1 px in any of the 24 states. The hero image is excluded because it intentionally floats 0–7 px through a transform.
- The idle 18 s auto-browse could fire during settle; the harness now re-applies scroll 0 and re-settles before capturing. One earlier capture hit this and was redone.
- The first eight card title/description sizes are unchanged at 23/14 px for small cards and 34/18 px for the large card, with description opacity 0.7. Card logo boxes are unchanged (×1.3 / ×2.6).
- Visible roster rows and "+N" chips are unchanged: 0, 4, 5 (+8), and 6 (+7) with a pick.
- The QR stays 128×128. Sidebar sections do not overlap and none clips. There is no horizontal overflow. There were no page errors and no HTTP status of 400 or above.
- Host's Pick geometry is unchanged.

## Captures (all viewed)
- Before: `output/playwright/tv-home-premium/before/`
- After: `output/playwright/tv-home-premium/after/`
- Reports with boxes: `report-{nopick,pick}.json` in each folder.
- Before/after montages:
  - `output/playwright/tv-home-premium/montage-before-after-1280.png`
  - `output/playwright/tv-home-premium/montage-before-after-1920.png`
  - `output/playwright/tv-home-premium/montage-before-after-3840.png`
- Iterations: `iter1/` (props too visible while browsing, invite tint lost, outline numbers too loud) and `iter2/` (dice and balloon hidden behind the hero, mascot crop too high). Both were corrected in `after/`.
- Native host hub (fixture with a stubbed bridge): `output/playwright/tv-home-premium/native/`, 8 shots, no errors. The new files are not loaded there.
- These are browser (WebKit headless) captures, not physical AirPlay or device captures.

## Tests
- `tests/catalog-reveal-browser.cjs`: PASS.
- `scripts/qa-native-shell.cjs`: OK, errors `[]`.
- `tests/tv-notch-layout.browser.cjs`: FAIL at the gameContext left-inset assertion on the in-game gamebar. It fails identically with the two new tags removed from `tv.html`, so the failure is pre-existing and not caused by this lane.
- `npm test`: 699/700 pass. The one failure is the stale prototype inventory, caused only by the new `games/sports_siege/public/bowling-deck.js` from the Claude bowling lane. A regeneration diff showed no other entries, and the inventory file was restored unchanged.
- The tests ran before the final edit (ambient pool layer inset changed from −12% to −6%, `will-change` removed for 4K memory). The final capture set and the geometry comparison include that edit.
