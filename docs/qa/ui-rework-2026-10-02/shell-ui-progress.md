# Shell UI progress · 2026-10-02

Owner: Codex shell agent. Source branch: `heypals/ux-polish`, dirty shared working tree. User comments under `docs/qa/ui-rework-2026-10-02/user-comments.md` supersede the older narrow scope in PRODUCT.md. Source baseline SHA256: `shell-source-baseline.json`.

## Changes

- `public/app.js`, `public/native-shell/host.js`: semantic catalogue counter class. Only catalogue labels use heavy authored italic; player counts and supporting counters retain their lighter roles.
- `public/game-ui-system.css`: catalogue caption variables and small count shading; semantic game stat values use Kardia Fat Runner 900 italic, 24–32px; Controls / How to Win summaries share the approved heading role. Existing HeyPals/Flourishes code remains intact.
- `public/index.html`, `public/polish.css`: join/profile form no longer reserves a column for hidden Cancel. Photo/name/help hierarchy uses supplied Kardia faces; repeated photo panel rim removed; equal form edges and existing profile save/return handlers preserved.
- `public/native-shell/index.html`, `public/native-shell/host-ui.css`, `public/native-shell/host.js`: active deck keeps game artwork, live marker and consistent contour through compact/expanded states. Controller / Bots sit together; Bots opens the real roster. Controls/How to Win are native keyboard-accessible details. Host Panel uses one outer surface and divided sections, plus a compact directional pad with centre Open and genre selection.
- `public/i18n-shell.js`: English text for waiting-only bot availability.
- `scripts/qa/capture-review-main.cjs`: QA_OUTPUT destination; optional shell interaction/phone-width checks; functional-only mode. Existing original review gallery and comment screenshots untouched.

## Browser evidence

Source changes do not alter the approved Pause/Lobby capsules or the controller header/footer styles. Both controller-bridge.js and tabs.js are loaded in the reusable real-room harness. Captures use real room/game snapshots with simulated Swift readiness/transport metadata, not a physical iPhone.

First visual round: `output/playwright/ui-rework-2026-10-02/shell-round1/` (19 real-state captures, zero page errors). Final visual round: `output/playwright/ui-rework-2026-10-02/shell-final/` (through playing Host Panel; additional 320/375/393 join and 320 settings captures). That script ended on a harness assertion that read `active.testMode` rather than the actual `active.session.testMode`; the assertion is corrected. Functional-only rerun: `output/playwright/ui-rework-2026-10-02/shell-functional/report.json`.

Opened/inspected observations:

| Capture | Observation |
| --- | --- |
| round1/main-join | Equal action edges; portrait/title/hint form one group; lighter help separated from strong labels. |
| round1/main-profile | Long player name readable; Save and Return fit one row; form sections have consistent edges. |
| round1/main-host-catalog | 36 games uses consistent heavy italic; hero and search alignment retained. |
| round1/main-host-cards | Section count typography matches hero; card actions unchanged. |
| round1/main-controller-lobby | 36 games is readable beside the heading; ballot/help retain separate typography. |
| round1/main-host-active-expanded | Game artwork/title/readiness above two-column controls; expanded Settings and match actions remain available. |
| round1/main-game-settings | Compact rules disclosures reduce repeated prose; actual Rounds selector retained. |
| round1/main-host-panel-playing | Compact centre-confirm pad and genre row; disabled navigation accurately reflects running game. |
| final/main-join-320 | No horizontal clipping; long photo hint wraps naturally. Onboarding continues by vertical scroll at this short size. |
| final/main-game-settings-320 | Collapsed rules/settings/actions all visible at 320×568. |
| final/main-game-settings-controls-320 | Complete controls text remains available; long disclosure scrolls. |
| final/main-host-active-playing | Status and artwork remain legible; primary Controller and roster shortcut share the row; match actions preserve their handlers. |
| final/main-host-panel | Existing TV overlay actions and visible genre/dpad controls fit the shared panel without a nested frame. |
| final/main-host-network | Network explanation and switch readable; flat sections use restrained internal dividers. |
| final/main-host-roster-waiting-bot | Actual third player/bot is visible with human names retained; bot plus/minus fit near count. |
| final/main-host-preferences | Haptic/display switches, language picker and statistics remain distinct and reachable in the panel scroll. |

Final visual findings led to two narrow finishing changes: summary layout remains flex so the pack arrow is painted, and Host Panel/game settings use an opaque purple content gradient to prevent the catalogue headline showing through. These final two CSS refinements require the parent final reviewer’s fresh screenshot; earlier captures do not verify them.

## Automatic / interaction checks

- `tests/host-panel-browser.cjs`: PASS. Native supporting type, closing without reappearance, active game navigation without restart, compact status visibility, and 393/320 compaction timing/layout. Slot/catalogue movement variation ≈0.031px; transitions ≈199–219ms.
- `tests/i18n-native-source.test.js`: 5/5 PASS after English coverage addition.
- Syntax checks: `public/app.js`, `public/native-shell/host.js`, capture harness PASS.
- Real room: genre selection sends tv-focus and does not launch a match. Waiting bot connects/removes through the TV’s actual hidden controller while the game instance stays unchanged. Playing roster change is rejected. A bot-touched run retains session.testMode after removal, preserving the server statistics guard.
- One Impeccable detector pass saved as `shell-impeccable-detect.json`: warnings include legacy stylesheet fallback contrast pairs, approved gradient typography/art, unchanged decorative glow and dynamically populated image sources. It does not replace the rendered observations above. No broad cleanup of concurrent author styles was performed.

## Explicit limits / coordinated handoff

- Adding/removing bots is supported before a match starts (including launched waiting state). The server deliberately rejects roster changes during playing/results because the game engines do not support safe live simulation changes. Parent owns that server protocol and validation.
- Genre buttons constrain host remote card navigation and focus the first matching game via existing tv-focus. They do not implement a persistent TV genre filter or an arbitrary focus/activate/back protocol across every TV element. This broader console behaviour remains in CLAUDE-HANDOFF.md.
- No new arbitrary game settings invented; each game’s authoritative hostControls.settings remain available.
- No native build, installation or physical iPhone test was performed. Emulated safe areas cannot establish actual keyboard, rubber-banding or hardware touch behaviour.
- Parent fresh reviewer should inspect the two last CSS refinements and 320px profile scrolling. Final screenshots are not claimed as physical-device or all-catalog gameplay coverage.

## Focused active-card follow-up

The two findings in `shell-podium-finish-review.md` are resolved in `public/native-shell/host-ui.css` and `host.js`. This follow-up used the actual Impeccable context and craft-floor guidance, mobile-native, and Emil design engineering skills. The latest user centering direction governs short identity/status groups; lists retain their existing alignment. No second global detector ran.

| Before | After | Why |
| --- | --- | --- |
| Title, ready ratio and waiting clock had loose alignment; compact 320px truncated Push Pit. | Title and status share a centered text column beside the artwork. Ready icon/ratio form one semantic group with a consistent gap before the waiting clock. Compact 320px uses a bounded two-line title. | The identity reads as one coherent group while the original compact deck stays 58px high. |
| Native WebKit number spinner overlapped two-digit game numbers. | The existing native number input measures 100×48px, uses 20px numerals and reserves 40px for the spinner. | Numbers 1, 16 and 36 remain readable; native input semantics and direct game-focus handling are retained. |

Fresh evidence: `output/playwright/ui-rework-2026-10-02/shell-cluster-fix/report.json` records 18 final WebKit captures, zero page errors, all six number-input measurements and source hashes. Every final image was opened and inspected. Both 402×874 and 320×568 cover zero-ready, one-ready and playing states in expanded/compact cards, plus game numbers 1/16/36. Expanded waiting counters change correctly from 0/2 + clock 2 to 1/2 + clock 1; playing replaces the waiting group with round status. Artwork, Controller, More and match actions remain aligned without overlaps. Compact status stays hidden. The focused identity captures use Push Pit; they do not establish whole-catalog title coverage.

Final `tests/host-panel-browser.cjs` PASS is saved under `output/playwright/ui-rework-2026-10-02/shell-cluster-regression-final/`: active-game restart protection, native panel navigation/closing, compact visibility and reversal checks passed. At 393/320px compact height is 58px, slot/catalogue movement variation is approximately 0.031px and transitions settle in 199–216ms. The same suite passed before this follow-up; `host.js` syntax and scoped whitespace checks also pass. Source is frozen for the parent review. These are real-room browser checks with simulated Swift readiness metadata, not physical iPhone validation. No native build was performed.
