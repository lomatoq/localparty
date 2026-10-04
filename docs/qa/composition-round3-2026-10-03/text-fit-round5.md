# Round5 Draw Together / Bow Club text-fit confirmation

2026-10-03. Bounded correction of two independently identified 1280×720 defects. Product ownership is limited to `games/drawguess/public/screen.css` and `games/bow_club/public/style.css`. Shared headers, field geometry, gameplay, controls and other engines were not edited.

| Before | After | Why |
| --- | --- | --- |
| Draw's short-TV `#board .row` fixed height of 54 px cut the metadata beneath a two-line player name. The stronger standings name rule uses 16 px text; its two lines, metadata and padding need more height. | The short-TV row has a 68 px height/min-height and cannot shrink. The existing canvas-height rail, gaps, scrolling and fade stay in place. | Preserve the meaningful name and supporting facts together inside their own card. |
| Bow's 720p `.score-chip` reserved 52 px for the avatar, 30 px score text, two 12 px column gaps and 32 px horizontal padding, leaving numbered bot names about 30 px. | At widths ≤1400 px, the avatar track is 40 px, column gaps 8 px, horizontal padding 10 px and points 24 px. Cards remain 82 px high. | Restore the full bot number without moving the cards, arena or AR markers; human names retain intentional ellipsis. |

## Actual browser evidence

Capture used the real launcher, four connected participants, live engine states and normal clocks. The QA-only `scripts/qa/capture-round5-text-fit.cjs` adapter records text ranges, card bounds, fields and the Draw scroll region through the canonical capture harness. It asserts metadata/score ink containment, complete numbered bot names, full Bow card visibility and field containment.

Output: `output/playwright/composition-round3-2026-10-03/text-fit-round5-1807/`. Each original below was opened individually after capture.

| Original | Observed result |
| --- | --- |
| `drawguess-tv-live-1280.png` | Alexandra / LongSurname remains two lines; complete `guessed 0 · Drawings 1` has 9.4 px to the row bottom. The 68 px row does not compress. Canvas is x513.8/y196.7, 636.4×477.3, bottom674.0. The existing roster viewport is 177 px with 290 px of scroll content and its existing bottom fade; this image does **not** claim all four rows visible simultaneously. |
| `drawguess-tv-live-1920.png` | All four rows and their metadata are visible. First-row metadata has 17.7 px bottom clearance. Canvas is x664/y245.8, 1056×792, bottom1037.8. |
| `bow_club-tv-live-1280.png` | Бот 1/2/3 are whole: each 47.3 px name range fits its 78.8 px track. Name and shots retain two separate rows. All four cards are 82 px high, bottom698.4 within720. Full field remains x0/y0,1280×720. |
| `bow_club-tv-live-1920.png` | Whole numbered names and scores; bot tracks are141.1 px. Four82 px cards end at1047.6 within1080. Full field remains1920×1080. |

`report.json` contains `errors: []` and `changedFiles: []`. Source hashes match at capture start/end. Scoped whitespace and Impeccable layout checks passed. Browser was closed and SLOT1 released after capture.

## Product freeze

- `games/drawguess/public/screen.css`: `35e05d0aca31560ab61bef470e0cb75542e5eff80afeeebae7faf3e61f306249`
- `games/bow_club/public/style.css`: `fd16abf4a6412a0d9b97771ea058a36fe93a64e3a3c94304430185163c342b92`

These are TV browser proofs for the two named defects. No phone PNGs or physical-device checks were performed in this correction. The short-TV Draw roster still uses its existing scroll/fade; maximum-roster interaction was not exercised. Other engines and the final whole-catalog capture remain the director/root's scope.
