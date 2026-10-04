# Final visual review — 27 September 2026

Reviewed all 36 real-state 320×568 WebKit phone screenshots from `.localparty-build/final-current-320/captures/states-report.json` (finished 21:48:28.998Z, stable assets). Contact sheets are in `.localparty-build/final-current-320/art-review/sheet-{1,2,3,4}.png`. This is a visual review of captured states, not a claim that every possible game state has been inspected.

All captured primary controls and Pause/Lobby controls fit. No additional critical overlaps or clipped action labels were found. The original capture exposed escaping information-card accents in Push/Shrink/Bomb and an unwanted outer rectangle in TankArena; these were corrected in the subsequent bounded shared patch. Poker spacing was separately corrected and recaptured by the gameplay owner.

## Final decoration verification

- Fresh reconciled Push, TankArena and Western screenshots visually reviewed together in `art-review/decor-final.png`: accents stay inside the intended surfaces; TankArena has three independent rounded cards without a new surrounding box; Western labels and values retain their inner padding.
- `capture-party-feedback.cjs`: real Knives instruction/state at 320/375 and Western instruction/state/numeric at 320 pass. Western cards have 12px inner padding, labels at least 14px, label-to-value separation at least 6px. Computed card paint has four layers, with centered 38×1.5px top/bottom accents, no generated pseudo-elements.
- `capture-jenga.cjs`: real 320/375 controllers and TV 1280×720/1920×1080 pass. `.block-info` is no longer an information card. `.arena-status` has the four expected background layers; no generated pseudo-elements, interactive descendants or viewport overflow. Analog input reached real server physics and reset on release.
- `capture-info-cards.cjs` checks computed Push card and TankArena child-card background size/position, absence of generated pseudo-elements, and no painted outline/background on the TankArena grid wrapper. A visible outline requires an outline style; WebKit can report a default nonzero outline width while style is `none`.

## Resolved role consistency findings

The initial capture exposed the following differences. A subsequent authorized, bounded patch changed only the five family stylesheets; actual 320px recaptures now verify all five roles:

| Game | Selector | Captured difference | Evidence |
| --- | --- | --- | --- |
| Spy | `#readyBtn` | Large Ready action appears upright; the principal action role is Anybody italic CAPS. | `captures/spy.png`, sheet 2 |
| Mines | `#mineOpen` | OPEN TILE action appears upright. | `captures/mines.png`, sheet 4 |
| Curling | `#ss-sweep` | HOLD TO SWEEP action appears upright. | `captures/curling.png`, sheet 4 |
| Bow Club | `#start` | Open camera primary action remains upright and sentence case. | `captures/bow_club.png`, sheet 4 |
| Naval | `#target` | Player name in target select appears italic; player-name role should stay upright. | `captures/naval.png`, sheet 2 |

Final evidence: `.localparty-build/final-current-roles-verified/captures/states-report.json`, finished 2026-09-27T22:01:59.674Z, assetsStable true, no errors. Spy Ready is true Anybody italic750 CAPS at15px; Bow Club Open camera14px; Mines Open tile20px; Curling Hold to sweep16px. Naval target is Onest normal550, natural case,16px. All five fresh PNGs were visually inspected (`art-review/roles-five.png`): labels fit, no overlaps, full footer. Disabled Spy/Curling controls keep their disabled appearance. Gameplay merged these five captures into the current36 report and preserved prior provenance. No production changes remain pending for this bounded list.

The combined prototype now reflects the current rounded information-card paint and approved footer capsules: real SVG icons at 20px, 10px icon/label gap, upright 14px Pause/Lobby labels. It remains a design specimen; the Jenga and Western tabs explicitly show actual gameplay captures.

## Mobile lobby hierarchy correction — 28 September

A separate actual joined-lobby WebKit pass measured the hierarchy at320,375 and393px before and after the scoped lobby correction. It does not change in-game, waiting, TV or native-host styles.

| Role | Before | After |
| --- | --- | --- |
| Catalogue heading |24px Unbounded upright500 |26–27.51px Anybody italic750 CAPS |
| Games count |10px, wrapping onto two lines |13px Onest500, one line |
| Search |16px Onest500 |16px Onest400 |
| Filter tabs |14px Onest600 |14px Onest550 |
| Voting help |14px Onest800 |14px Anybody italic450 |
| Return without QR utility |14px Onest600 |14px Anybody italic450 |
| Game card titles |Rubik italic900;16/19/26px |Anybody italic750 CAPS;20/22/26px |

Evidence: `.localparty-build/lobby-hierarchy-final/{before,after}/report.json`; real full viewport and scrolled catalogue PNGs in the same directories. `capture-lobby-hierarchy.cjs` verifies no horizontal overflow, text bounds, font roles, search results and category filtering. These captures preserve the existing catalogue layout and hero artwork.
