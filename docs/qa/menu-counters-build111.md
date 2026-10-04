# Controller and Host Hub counters — build 111

The counter pass keeps the existing Kardia composition and gives the numeric value a stronger role than its caption. It changes counter markup and scoped typography in `public/app.js`, `public/native-shell/host.js`, and `public/game-ui-system.css`. It does not change voting rules, sorting, room capacity, game behavior, native Swift, or the archived build 110.

## Inventory and applied treatment

| Surface | Numeric readout | Treatment and coverage |
| --- | --- | --- |
| Controller catalog | Filtered game count, including 36 and 0 | Prominent value with quieter translated games caption; search and category updates retain the same component. |
| Controller ballot | Votes 0/3, 1/3; stress 999/1000 | Separate current value, denominator, and caption; tie/selection explanations keep their existing full copy. |
| Controller game cards | Player range, vote total, leader vote total | Numeric range/count is emphasized; captions remain readable. Compact 320px cards wrap the caption or actions when necessary. Vote state and progress remain intact. |
| Controller room status | Players/capacity | Paired numeric markup; the existing visible online/Rooms masthead treatment is preserved. Hidden legacy status nodes are not newly exposed. |
| Host Hub | Catalog game count, group counts, game-card ranges and votes | The same hierarchy, including the catalog rerender path used by search/filter. Existing Host Pick composition remains intact. |
| Host Pick | Current players, minimum requirement, maximum limit | Numeric emphasis with the existing requirement/limit meaning. No-screen copy stays a full status sentence. |
| Host active game | Ready current/total, pending names | Strong current readiness with quieter total; waiting names remain a readable separate line. Paused/error/progress status sentences remain intact. |
| Host panel | Roster count, bots, total matches | Kardia numeric emphasis; 0 bots and 999 matches are visible fixture cases. |
| Host shared screen | Dedicated TV scenes and game screen connections | Each translated caption and value remains a separate pair; long captions wrap naturally, without loose punctuation fragments. |
| Host numeric inputs | Bot count and TV game-number input | Existing controls retained, with consistent numeric font. Physical keyboard/input interaction was not newly verified in this pass. |
| Rooms/online native heading | Existing numeric circles | Inspected as part of the surrounding screens and deliberately preserved because they already read clearly. |

Values use Kardia Fat Runner; captions use the existing quieter Kardia Fit Runner role. Counter groups do not gain their own large card backgrounds or extra rectangular containers. DOM updates use stable keys, protect numeric nodes from translation, and expose captions to the existing i18n shell. The counter observer recorded zero idle numeric DOM mutations in every tested locale/width pair.

## Skill workflow

Read the installed repository Impeccable 4.4.0 skill, typeset/polish references, and craft floor. The actual context command completed successfully for `public/game-ui-system.css`. The current user request supplies the new counter scope beyond the older bottom-ranking scope in PRODUCT.md; the established brand and code-first route remain in use.

The detector ran once on the three owned source files: 10 existing warnings, none in the new counter rules. Two legacy font declarations, four existing motion declarations, and three existing result-row accents are outside this narrow pass. The existing place-numeral gradient warning is covered by the user's explicit gradient requirement for ranking places; no new counter gradient text was added. See `.localparty-build/counters111/detector.json`.

## Verification

- `scripts/qa/check-menu-counters111.cjs`: PASS, 66 fresh DPR3 WebKit captures and 42 check records, at 320×568, 393×852, and 402×874, in EN and a QA-only enabled RU locale. Production pages/renderers and real interaction handlers are used; native host state and controller WebSocket snapshots are fixtures. Guards cover counter fit, Kardia roles, search 0→36, vote/unvote, ordering, and idle translation stability. Both shipped native controller scripts load for the native-controller fixture.
- `scripts/qa/check-menu-counters111-real.cjs`: PASS, actual isolated launcher server, real browser joins with two additional WebSocket players, vote/unvote, party filter 4, all-games 36, and search 0→36. Server ballot 1/3 matches the rendered value at all three widths. Native 402 additionally loads the shipped `controller-bridge.js` and `tabs.js`; a saved Russian locale correctly resolves to the production EN policy. Nine original captures, zero page errors.
- Both source syntax checks pass. Owned source hashes stay identical across both final runs.
- The author personally viewed 15 current original PNGs: 12 fixture captures and 3 actual-server captures, covering all three widths, both locale test routes, zero/full/large values, compact cards, readiness, roster/bots, shared screens, and actual vote/search states. This is selected visual coverage, not a claim that all 75 originals were manually reviewed.
- Parent reviewed four representative originals, and the independent `rankings_polish` agent reviewed four current originals. Both accepted the scoped hierarchy/readability, with no numeral clipping or CTA/name overlap observed.

Reports and original captures:

- `.localparty-build/counters111/final-painted/report.json` and its 66 sibling PNGs.
- `.localparty-build/counters111/real-server/report.json` and its nine sibling PNGs.
- `.localparty-build/counters111/visual-review.json`: exact manual observations, original image hashes, source hashes, and coverage limits.
- `.localparty-build/counters111/final-freeze.json`: source freeze and automatic result summary.

## Boundaries and retained evidence

The RU enablement and 999/1000 ballot are stress fixtures, not production locale availability or a real thousand-player session. Native host readiness fixture data has a deliberately inconsistent ready count versus pending-name list; it verifies layout only and does not establish a production readiness defect. The actual-server run verifies vote/filter data independently. No new physical iPhone installation or touch validation is claimed here. Physical release/device validation belongs to the parent build 111 workflow.

Historical `before`, `inspection-*`, and `final` captures are retained as diagnostics. Early controller baseline captures lacked the launcher locale bootstrap, and early compact-card captures were taken while a reveal was still pending; those images are not accepted final evidence. `before-localized` preserves the corrected baseline. Only `final-painted` and `real-server` correspond to the accepted frozen counter sources.

Owned source freeze:

```text
public/app.js                  a9d42e9a6cc0b682aa69e9b48c96e0df43e148ca3d3e12253a360ac89675c715
public/native-shell/host.js    aed47aba5594cc2eab4d51cce2fc3f5b8a2473dda40ff42a5b1df46524d4659d
public/game-ui-system.css      dbf21511803431991a59ce1a80ee0fe31479805c97433edcf1c733f929b10e18
```

## Final host-panel guard follow-up

The combined release check initially stopped at `host-panel-browser.cjs` because it expected the old active-card caption “Open controller”; the approved current caption is “Play”. Source inspection confirmed that `launchFromCard` still returns through `controller()` for the active game before any launch, busy, player-count, or pending-launch branches. The test now expects the current caption and retains the independent strict emitted-command assertion. No production navigation code changed.

The next full run exposed a separate real fallback-header overlap at 320px: the Controller capsule ended at x112.6875 while the unchanged centered logo began at x110. The narrow correction in `public/native-shell/host-ui.css` reduces only that button's horizontal padding from 8px to 4px at widths up to 359px. Its 44px touch height, logo dimensions, pinned composition, and gradients remain unchanged. Persistent native tabs already hide this fallback button.

The complete `tests/host-panel-browser.cjs` now passes, including strict compaction timing, flow-slot stability, active-card navigation without restarting, repeated sheet close/reopen, translation, sticky stacks, insufficient-player recovery, display recovery, and Wi-Fi invitation handoff. The strict response/duration limits were not relaxed. Final report: `.localparty-build/build111/host-panel-final/report.json`; the logo is loaded, contained, and has no navigation overlap.

`scripts/qa/check-active-card111-real.cjs` separately passes eight actual active-worker cases: 320/402px, fallback/persistent native tabs, waiting/user-paused. The real launcher starts one Push worker; the host uses its real API snapshot with native readiness/display metadata supplied by the harness. A fallback card sends only `controller`; persistent tabs send only `native-tab(controller)`. The active instance and `metrics.gameStarts` remain unchanged, as does pause state. Native message handling is captured and any manage command would be forwarded to the real API. This proves the web/native navigation intent and server safety; it does not claim physical Swift view switching.

Fresh originals were personally viewed: the before/after 320px fallback header, final active top card, and final real-worker 320px paused persistent-tab / 402px waiting fallback states. The targeted Impeccable detector ran once for the newly changed host stylesheet and returned zero warnings. Exact current source gates and selected image hashes are in `.localparty-build/build111/active-card-final.json`.

The parent separately applied the user's darker wall veil to the existing three shared background declarations. Consequently the current shared stylesheet hash is `e2ddf05eedc7a123a8f168f9fc3e39c4ca67104d21fad0a381c808eb1a8c9598`; the earlier counter-only capture revision above remains historical and is not overwritten. The final active-card run records that current stylesheet, the new host stylesheet `a6c0e2524170f0318bb4c766685765afca93f3be0c4b4fb63b4e8b5118b096f6`, and all relevant source hashes unchanged from run start to end. App and host JavaScript retain their earlier freeze hashes.

## Subsequent active-card correction and final sources

The user's later screenshots identified two separate active-card problems. In compact mode, shared counter `display:inline-flex!important` overrode the earlier local hide rule, so Ready and long waiting names remained in a narrow column. A scoped `display:none!important` guard now wins for compact status. Real Push-worker/native screenshots prove the compact endpoint falls from the diagnostic 232px/120px heights to the approved 58px at both 320px and 402px.

For the subsequently confirmed expanded state, the visible full-name list is replaced by the existing Game Icon Pack tick beside the ready ratio and clock beside the awaiting count. Both groups fit one 24px horizontal row. Full names remain in the tooltip and accessible status description; they are not lost from the room roster. The icon-unavailable fallback retains short translated labels. Actions, launch conditions, pause semantics, native controller routing, and the existing static expanded/compact composition are preserved.

The exact final `host.js` hash is `53b248a276673c18c7794f02b9670685aaf4caa717d054c9d60c2fb2a30e42eb`; `host-ui.css` is `139acb7d0cee78ac3647710a89cbf9edecf51c42f92cd6a588ee3dadaad7eb35`. The app/shared-wall hashes remain as recorded above. Final proof is `.localparty-build/build111/active-deck-icons-final/final-freeze.json` with source gates, eight personally viewed raw originals, all 34 captured states, and two reviewed transition overviews. These replace the earlier active-card visual acceptance for the changed waiting/compact states.

Fresh WebKit320/402 DPR3 captures use a real isolated launcher, Push worker and two actual lobby WebSocket players with long names. The shipped persistent-tab bridge is loaded; native readiness/display metadata is supplied by the harness. Eight natural rAF traces preserve flow-slot/catalogue anchoring and avoid opacity flicker. Thirty visual keyframes hold the **real scroll-created animations** at local 0/60/100/180/300ms for collapse, expansion and interrupted reversal. These are local animation times, not exact wall-clock screenshot timings. The start of an expanding height reveal intentionally masks incoming content until the card opens; all final content fits, and the 60ms captures have readable status/actions without overlap.

The final full strict Host suite passes at `.localparty-build/build111/host-panel-icons-confirm/report.json`: all six 320/393 transitions begin visible motion/class observation in 33–35ms, settle in 200–212ms, and keep flow-slot/catalogue variation at 0.03125px. The original 55ms class / 75ms motion / 140–300ms settlement requirements are unchanged. Test-only scroll and class observers record delivered events at 13–14ms, class mutations at 17–18ms, and event-to-mutation response at 4–5ms. `animateDeck` and `syncStick` remain byte-identical to the counter baseline.

Two earlier strict runs failed at 83ms and 64ms RAF class observation; their reports remain retained and are not labelled passes. The first overlapped image composition, and neither recorded exact event/mutation delivery, so a specific cause for those individual delays is not established. The final instrumented serial run passed the unchanged strict assertions. Eight real active-worker navigation cases were also repeated on the final sources and passed; no extra launcher start, active-instance change, or pause-state change occurred. The detector ran once on the final owned host sources and reported zero findings.

No build, installation, public upload, physical Swift switching, or broad all-game/all-popup copy audit is claimed by this pass. The parent controls the unified screenshot review and release decision; the broader icon/copy audit is a separate next pass.
