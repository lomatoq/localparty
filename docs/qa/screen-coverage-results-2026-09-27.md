# Screen coverage expansion — 2026-09-27

This is a capture report, not visual approval. Every screenshot remains subject to the user's numbered review and the product-design audit.

## Captured

- All 36 games: phone and TV gameplay and pause were recaptured at normal speed. All 72 waiting images were then recaptured in a dedicated pass after explicitly asserting that the startup and transition overlays were hidden, the waiting layer was visible, and at least two roster entries existed. This replaced transient title-only images without changing card numbers. Together these are 216 core images. The gameplay pass records the actual phase and refuses a waiting/countdown image as gameplay.
- All 36 games: phone page reload/reconnection was additionally captured with local storage preserved. These are post-reconnect views; they are not a full network-loss/latency test matrix.
- 35 of 36 games: actual phone and TV final screens now exist. At this report checkpoint, core coverage is 286/288 state/device combinations; only the two Chaos final views are outstanding in a separate real-input solver task.
- 56 additional numbered cards exist at this checkpoint: reconnection, intermediate reveals, countdowns and six shared-shell overlays. Counts are regenerated in `.localparty-build/screen-review/coverage-report.json` rather than hardcoded into the gallery.

## Result provenance

Previously captured `TEST_FAST` finals retain their original timestamps and are labeled as earlier captures. They are not claimed as new normal-speed validation.

The new general completion pass uses legal minimum host settings, real bots and supported host actions. A review-only worker clock accelerates long matches 12×. It does not inject state, invent score, call final-rendering functions, or modify production runtime. These images verify how final layouts render; they cannot establish normal-speed physics, timing or animation quality.

Specialized normal-speed scenarios produced several otherwise unreachable results:

- Monster: two real phone pages draw pointer strokes and submit through the normal Done/Submit buttons.
- Warsaw: two connected phone pages plus supported Reveal/Next host actions.
- Crane: actual pointer holds move the crane sideways; actual drops produce three misses and a normal match end.
- Western Duel: real pointer shots when the draw signal appears produce the tournament result.
- Naval: two connected phone pages and the existing host Finish action.

Spy's role-reveal flow uses the actual hold-on-secret-card interaction and Ready button before voting. Tanks uses the timed CTF mode; survival-specific results remain a separate mode variant to check.

## Issues discovered, not silently approved

- Normal-speed capture script completed every game but its final localization assertion failed on Bomb TV: `Сканируйте QR первым телефоном.` was registered as missing. This is separate from screenshot success and was reported to the implementation owner.
- Tanks survival TV displays `0:00` despite having no match deadline; its arena reaches the bottom edge.
- Kart phone final leaves large disabled steering/throttle controls under `RACE OVER` instead of using a focused result layout.
- Millionaire phone final wraps a long name into four narrow lines and labels equal zero scores as first/second/third.
- Monster TV final mixes translated and untranslated text (`…PARTS ХАОСА`) and the drawing extends below a 720p viewport.
- Several prior result attempts timed out because the scenario had not acknowledged roles, drawn a segment, fired, or used the appropriate host action. Those failures are retained in attempt reports; successful specialized retries have separate provenance.

## Remaining scope

“Every screen” includes more than these four core states: secret roles, permission dialogs, settings, late joins, spectators, errors, wide/narrow layouts, every game-mode variant and animation transitions still need explicit coverage. The manifest must not imply that all such variants are already approved. The spectator probe found that its entry is hidden by production CSS; it remains explicitly uncovered. Device-specific touch/motion behavior still requires physical-device checks.

Run `node scripts/sync-review-coverage.cjs` after capture jobs finish, then rebuild the gallery. This restores supplementary manifest entries from actual files and records missing reasons, capture timestamps and methods without renumbering existing user comments.

## Overlay and variant coverage register

| Surface/state | Evidence or status |
| --- | --- |
| Room roster | Actual dialog capture, new card 030 |
| Company top before a match | Actual empty-state capture, new card 031 |
| Company top after a match | Actual statistics from a TEST_FAST Flappy match; new card 032 (captured) |
| Individual player statistics | Actual dialog, new card 033 (captured) |
| Rules opened from pause | Actual dialog, new card 034 (captured) |
| Profile editing | Actual form, new card 035 (captured) |
| Spectator button | **Unavailable in current UI**: `public/ux.css` hides `#spectateButton` with `display:none!important`. Probe failed visibly, rather than unhiding it or fabricating a flow. Late-join spectator modes remain separate tests. |
| Host control panel | Earlier native-shell/browser audit images remain in cards 020–022; not newly recaptured in this pass. |
| Native Wi-Fi setup/details | Not captured in this pass; native-only UI and network joining require a dedicated review. |
| Motion/camera permission prompts | Not covered by generic screenshots; browser/OS/device dependent. |
| Native share/TV connection/physical controllers | Not covered by browser screenshots. |
| Error/offline/recovery/replaced-session states | Full variant coverage still open; captured reload state is only one recovery path. |

The shell capture report, not this table, determines which numbered overlay cards have an actual file. Failed interactions must retain their error instead of producing a placeholder image.

## Bow Club Touch flow addendum

Cards 1360–1362 are separate from the original Bow Club controller/final captures. `capture-bow-touch-review.cjs` opens two real phone clients, chooses Touch through the visible UI, then aims and holds/releases five arrows per player using real pointer events. The round ends from ten accepted arrows at normal speed; no camera or permission-denial state is fabricated. Files and report live under `.localparty-build/screen-review/bow-touch/`.

Visual review confirms the missing aiming view is now represented. After completion, the phone displays `Match complete`, score and zero arrows but keeps the mini-field and disabled Draw control with substantial unused vertical space. This remains a UX finding; the older onboarding-stuck final card is intentionally retained as a separate defect.

## Final review checkpoint

The gallery now contains 358 images across 360 numbered cards. The main real-game matrix remains 286/288: Chaos reached level12 with11 completed levels. Its two real final cards176/177 remain explicitly open. Separate cards1364/1365 display clearly marked renderer fixtures with demo data; they do not count as a completed match. Bow Touch adds1360–1362. Extras now total61, including those2 fixtures. Naval277 was recaptured after asserting API results, HUD Results and four fleets; the previous white image is preserved in the investigation report and its cause remains unconfirmed.
