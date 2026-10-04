# Final phone320 / TV720 review

The complete real WebKit sweep is `.localparty-build/final-current-320/captures`. It uses a phone viewport of320×568 and TV1280×720, a real launcher server, one actual phone and up to three bot participants. Each game passes through waiting, normal readiness/start, gameplay, pause/resume and page reload/reconnect. This is functional and layout smoke coverage, not proof of every game mechanic, roster size, winning outcome or hardware sensor.

The original36-game sweep completed with stable production asset hashes. Later user-requested and visually confirmed scoped fixes are represented by explicit recapture overlays, not by claiming the original run used the later CSS. `full-sweep-before-reconciliation.json` retains the original run. `revisionReconciliation` records each accepted overlay, timestamps, hash and failed rows that were not accepted.

## Confirmed fixes and verification

- Poker's RAISE button extended3px below the320 phone iframe. A scoped short-screen row-gap reduction preserves button height and now fits all controls.
- Chaos's initial320 layout produced213.75px-tall action grid items even after fonts and stable-layout sampling. Explicit66px rows and max-content track sizing were verified in the original TankArena→Chaos sequence; no controls extend outside the iframe.
- Push/Shrink/Bomb's stat divider was5px off center because a legacy10px gap outranked shared styling. Actual DOM measurements now report gap0 and divider offset0px in all three games.
- Shared control labels, including nested spans, are checked at a14px minimum without shrinking primary actions. Visible text ranges and all visible button bounds are reviewed for clipping.
- Session footer uses a visible gradient over a transparent surface; both20×20px icons,10px label gaps, viewport bounds and button-center hit tests are asserted.
- Final scoped action typography uses the `HeyPalsDisplay` font-face (Anybody italic) for Spy/Mines/Curling/Bow Club primary actions. Naval's player selector uses upright `HeyPalsText` (Onest).

## Retained failures and limits

The20-game intermediate recapture had one Curling waiting→playing timeout: the ready button remained enabled, readyIds was empty and startRequested was false. The original failure packet remains in `.localparty-build/final-current-reconciled/captures`. Normal-flow Curling retry passed; this isolated readiness event was not diagnosed as a production defect and no speculative production change was made.

The first five-role typography test incorrectly compared computed CSS family names with font asset names. Its report is retained in `final-current-roles`; the corrected test uses the declared font-face aliases and the verified run is separate.

Screenshots of older results states remain dated historical evidence where this sweep did not naturally finish a match. Chaos result screenshots remain missing; no state injection or synthetic result replaces them. The numbered gallery therefore must not claim every possible state was freshly captured or approved.

## Published outcome

Final accepted evidence contains36 games, with zero browser errors and zero recorded visible button-label clipping, undersized labels or out-of-viewport controls on either the phone controller or shell. The full run and each recapture have stable hashes. Reconciliation accepts19 of20 intermediate rows, then6 scoped fixes, then5 typography recaptures; the failed intermediate Curling row is superseded by successful real retries.

The gallery was rebuilt with358 screenshots across360 numbered slots. Promotion copied258 files (255 images and3 reports), retained older uncaptured result states with their original timestamps, and archived replaced images under `.localparty-build/screen-review/history/2026-09-27T22-02-21-382Z`. This is completed review evidence, not user approval of every visual.

## Catalogue correction after user review

User found blank screen003. The old shell capture waited only for the phone lobby and1500ms, while the TV startup intentionally requires at least2400ms plus its reveal. The blank PNG was real evidence of premature capture, not a blank production catalogue. `capture-catalogue-review.cjs` now waits for `tv-show-ready`, decoded images/fonts, visible card bounds, opacity of all ancestors and finite animations. Screen003 was replaced and its blank predecessor archived. Screen002 was recaptured after the phone typography update with scroll position reset, so the header is no longer accidentally above the screenshot. New screens036–039 show actual phone catalogue cards at320/375,375 lobby and the desktop host catalogue. These were visually inspected and are not blank. Gallery becomes362/364 slots; missing Chaos finals remain explicit.

The earlier broad game pass did not assert waiting-screen geometry, only its centered subtitle. Following the user's waiting-screen report, `waiting-layout-guard.cjs` now checks horizontal overflow, the header-to-card gap, button bounds/hit tests and separation from the session footer. Waiting screens are being recaptured separately after the scoped layout repair.

### Waiting review completed

All36 actual waiting states were recaptured on phone320 and TV720. The initial guard incorrectly treated the intentionally hidden optional Spectate action as required; that diagnostic run is retained separately. The corrected complete run had35 passes and one real3px Swarm Gate subtitle offset, caused by a one-sided reserved scrollbar gutter. The symmetric-gutter fix was recaptured for Swarm and reconciled explicitly. Final36 accepted waiting rows have document/card horizontal overflow0, card-to-header gap0, Ready fully visible and hit-testable above the footer. The existing35 captures retain their earlier stable revision; the Swarm row records its later revision. All72 waiting PNGs were published with prior images archived under `history/waiting-20260927T221401Z`. Report: `.localparty-build/waiting-current-320-verified/captures/waiting-report.json`.
