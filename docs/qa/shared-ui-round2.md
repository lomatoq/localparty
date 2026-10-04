# Shared UI round 2 — 2026-09-30

Agent handoff. Root owns the final integration and second visual review. The game
logos and their later high-quality display scaling belong to the root/logo agent.

## Applied changes

- Mobile matchmaking has a quieter wall/background and artwork opacity reduced
  from .35 to .27. The game illustration stays centered and softly faded.
- Closed Rules & Controls is centered and at most 256px wide. A real summary
  activation unfolds it over 300ms to the full content width, moves the game
  heading and description upward, and reveals the rules downward. Lettering is
  translated rather than scaled. Keyboard activation, reversals and reduced
  motion use the same production handler.
- The roster is visually raised by 15px, with space reserved so the open reading
  surface does not collide with it. Its existing bubble treatment gains a quiet
  rim/depth. Getting Ready is 16px with a restrained shadow.
- Open rules, Ready and Pause/Lobby use the same 16px outer edges. The deliberately
  narrower closed reading control is the exception requested by the user.
- The waiting masthead remains a gradient bounded to its own height. Root found
  the same backing overlapping the shared result title; `hp-has-match-result`
  receives the same bounded gradient. Gameplay iframe headers are unaffected by
  this scoped rule.
- Shared HTML dialogs retain their real top-layer DOM during a 220ms alpha/scale
  exit. Escape, `method=dialog` values, same-frame reopen and modal/nonmodal swaps
  retain their behavior. The exit stylesheet is in motion.css as well as the
  launcher layer so proxied game dialogs have an actual exit animation.
- Native Game Settings returns to its expanded active-game panel. The nonmodal
  Host tab remains owned by the native navigation transition rather than popup
  timing. Bot popovers and the pause card use the shared exit lifecycle.
- The profile sheet now exits using its original DOM and a simultaneous backdrop
  fade. Its data writes and lobby messages happen immediately. Save, the existing
  backdrop-save behavior, Cancel, Escape, reduced motion and rapid reopen were
  exercised. Escape cancels unsaved edits. Input is not held for the visual exit.

The source changes are in public/app.js, public/background-scene.css,
public/motion.js, public/motion.css and public/native-shell/host.js. Existing
approved Kardia body roles, English text, footer capsule appearance and the
native controller bridge were preserved. Root added the illustrated title
through the `waiting-game-title` fallback wrapper. The subsequent explicit user
request sets Rules & Controls and green inner headings to KardiaFatRunner italic
900, with centered inner headings and a strictly vertical chevron (instant
`scaleY(-1)` when open, no rotating transition). The fully reviewed capture
version below uses 20px outer/16px inner headings; the later user-requested
18px outer action and increased body gap are a separate root revision.

## Verification completed by this agent

- `node --check` passed for app.js, motion.js and native-shell/host.js.
- 28 targeted unit tests passed: motion-system, fresh-lobby, profile-photo and
  invite-polish.
- `tests/shared-ui-round2.browser.cjs` passed its final agent run with 24 captures:
  actual WebKit phone 320×568, 375×667 and 393×852, actual UI interactions, the
  real ephemeral launcher/iframe waiting state, and explicitly labeled native
  bridge/safe-area fixtures. Rules trajectories include intermediate widths,
  upward title/goal movement and full-width edge alignment.
- Native safe-area fixtures use the shipped controller script with explicit
  59px top/34px bottom CSS reserves. They verify Ready and Pause/Lobby above the
  native Menu dock and the masthead gradient within its measured height. These
  are browser fixtures, not physical-phone evidence.
- The Host fixture uses current launcher state with the production native shell
  DOM and a mocked message bridge. Settings returns to the previous active panel;
  a modal Host popup can become the nonmodal Host tab without InvalidStateError.

The images reviewed by this agent are preserved separately at
`.localparty-build/design-round2/ui/agent-reviewed-captures/`. Its
`acceptance.json` records each image's hash, capture run time and individual
observation. All 24 images were visually opened. The working `ui/after/`
directory can be recaptured by root; its later images do not inherit this review.

Useful images:

- `agent-reviewed-captures/web-rules-393.png` and
  `agent-reviewed-captures/web-rules-393-open.png` — closed/open hierarchy.
- `agent-reviewed-captures/waiting-expand-90.png` — the actual intermediate unfold.
- `agent-reviewed-captures/room-dialog-closing.png` — an actual dialog exit.
- `agent-reviewed-captures/host-settings-return-fixture.png` — settings return path.
- `agent-reviewed-captures/profile-open.png` and
  `agent-reviewed-captures/profile-closing-92.png` — the real profile exit for root
  second review.
- `agent-reviewed-captures/native-safearea-open-fixture.png` — bounded reading
  region with reserved native dock space.

## Existing regression-test discrepancies

The old `tests/host-panel-browser.cjs` stops at its obsolete HeyPalsDisplay family
assertion; the production helper text uses approved KardiaFitRunner. An isolated
copy, `tests/shared-host-round2-regression.cjs`, was initially updated only for
that font assertion. Root then reconciled its old 72/24px scroll scenario with
the actual 24/8px hysteresis already present in the saved baseline. The original
latency and geometry assertions were retained. The resulting root run passed
393px compaction, but its 320px expansion measured 68ms against a 55ms class
deadline. That broad Host regression is still not reported as passed.

### Controlled baseline/current timing diagnosis

The follow-up diagnostic is
`.localparty-build/design-round2/ui/compaction-diagnostic.cjs`, with raw samples
and hashes in the adjacent `compaction-diagnostic.json`. Four sequential runs
used baseline/current/current/baseline order, each at 393px then 320px. Baseline
runs served **all saved shared public files** from the round-2 baseline; other
assets and the native-shell HTML were common to both. Both modes exercised the
production Host popup open/close before the same compaction sampler. This was a
controlled compaction diagnostic, not a rerun of every broad Host scenario.

`animateDeck` and `syncStick` are byte-identical between current host.js and the
saved baseline. A passive scroll observer and a class MutationObserver were
added only to the diagnostic to separate event delivery from the RAF-based
geometry observation. The 320px expansion results were:

| Mode/run | RAF observes new class | Delivered scroll event | Actual class mutation observed | Event to mutation |
| --- | ---: | ---: | ---: | ---: |
| Baseline/1 | 74ms | 15ms | 19ms | 4ms |
| Current/1 | 64ms | 51ms | 55ms | 4ms |
| Current/2 | 73ms | 13ms | 18ms | 5ms |
| Baseline/2 | 74ms | 15ms | 20ms | 5ms |

Times in the middle three columns are measured from the same `scrollTo(0,8)`
request. The initial scroll position was 9px, so the actual threshold crossing
was also verified; synchronous `scrollY` became 8px in 0–1ms. All 24 transitions
changed the class within 4–5ms of the delivered scroll event. All 393px RAF class
observations were 33–35ms. The existing 55ms RAF class deadline failed in both
baseline 320px expansions and both current 320px expansions (plus one current
collapse-again). All observed motion starts remained at or below the existing
75ms limit; geometry settled in 199–265ms, within the existing 140–300ms range.
No page errors occurred.

This establishes a pre-existing 320px timing-test discrepancy: the field named
`classLatency` samples the class only after each RAF's geometry reads, and thus
includes deferred scroll delivery and missed/expensive measurement frames. It
does not measure just the class mutation. It does **not** establish a new round-2
source regression or prove physical-phone frame performance. The unresolved
strict 55ms result remains explicitly separate from the passed shared popup
acceptance. No production change or assertion relaxation was made for this
diagnosis.

The shared browser scenario initially caught and corrected two implementation
issues: `formmethod` must use an explicit submitter override rather than its
default IDL value, and reduced motion is read freshly for close actions. Separate
fixture bootstrap failures were corrected by loading tabs at DocumentEnd, as the
native host does; they were not production UI failures.

## Reference scope and remaining coverage

The new Rules width/unfold behavior and the limited spacing changes implement
the user's explicit direction. Broader game-screen proposals and their publisher
screenshots are owned by the gameplay audit agent. Official background reading
for this pass included [Overcooked! All You Can Eat](https://www.team17.com/games/overcooked-all-you-can-eat),
whose page explicitly describes scalable UI, and
[Nintendo's Jamboree tips](https://play.nintendo.com/news-tips/tips-tricks/super-mario-party-jamboree-tips-and-tricks/).
Those links are reference material; the implemented layout is not asserted to be
a reproduced in-game menu from either title.

The 24 agent-reviewed shared states above remain a separate fixed revision.
Root's later UI24 DPR3 rerun passed, but this agent does not transfer the old
24-image manual acceptance onto those replacement files. Results/fireworks and
live gameplay audit are separate evidence. No new iOS build, physical
installation, App Clip invocation or public deployment was performed by this
agent.

## All-36 waiting visual review — frozen 20/16px version

The root capture run starting `2026-09-30T16:58:03.742Z` passed all 36 games,
producing 144 actual WebKit DPR3 states: 320×568 and 393×852, each closed/open.
This agent actually opened all 36 four-state layout overviews, after the final
font/vertical-chevron and inner soft-scroll changes for that revision. Each
screen has its own observations, SHA256 and capture geometry in
`.localparty-build/design-round2/integration/historical-heading20-original/visual-review.json`.
The 144 original PNGs, capture report, layout/native/full-pixel montages and
manifest are frozen in that same directory. All source PNG hashes and the
capture-report hash were verified before freezing. No blocking layout defect
was found in this reviewed version.

Native logo quality was reviewed separately at original DPR3 pixel size:
all 144 frozen crops were actually opened. Of the final 144 crops, 141 matched
those reviewed crop hashes exactly; the differing Push Pit, Multiplayer Flappy
and Mine Together 320px closed crops were freshly opened and accepted. All 36
logos retain their side motifs/outlines and complete lettering, including
compact 320px open states. An earlier DPR1/renderer-route-404 run is historical
and excluded from HQ acceptance. QA layout overviews alone never established
logo quality.

The accepted hierarchy is 20px outer Rules & Controls, 16px centered green inner
headings, both FatRunner bold italic, with the preserved FitRunner body role.
Ready/Pause/Lobby remain aligned and reachable; the masthead gradient stays
bounded above the logo/content. English instructions are complete at 393px;
the fixture player name `Бот1` remains protected player data. At 320px the rules
use their own bounded scroll area; the capture test separately verifies the
lower edge is reachable and continuation fades disappear at the reached edge.

Two qualifications are recorded per affected screen. The existing two-line goal
clamp on 320px open states shortens longer descriptions in eleven games, while
the complete description remains visible closed/393px and the instructions are
reachable inside the rules area. In Who's Popping Up? 393px open, the final WIN
line is fully visible but very close to the lower border; an extra original-DPR3
lower-rule crop confirms no missing glyphs. Root's subsequent 18px/action-gap
refinement is **not** accepted by this frozen 20/16px review and requires fresh
captures. The strict 55ms Host discrepancy above is still not reported green.

## TV waiting wordmarks follow-up

TV-only integration is complete after the parent CSS-zoom density correction: all 36 games × 1280/1920 = 72 fresh actual waiting screenshots and 72 untouched native logo crops were manually viewed. Six fresh accepted extras cover 16 members, stable stop→lobby, HTTP404 fallback and recovery. Final capture began 2026-09-30T18:17:49.831Z. Details, SHA256, seven dependency hashes and limits are in [tv-game-logos-round2.md](tv-game-logos-round2.md) and `.localparty-build/design-round2/tv/after/visual-review.json` (zero blockers). Previous local-DPR captures remain in `tv/density-before/`, with HQ acceptance explicitly withdrawn. This accepts browser TV waiting only and does not extend historical phone heading 20 review to later root heading 18/gap/goal revisions.

Root final follow-up: after the heading 18px/body-gap 20px and shortened whole-line GOAL transfer, root manually reviewed the current all-144 phone waiting contact sheet. Root reports every layout fits, with soft continuation fades and no partially clipped line. This is root-provided current-version acceptance, separate from this agent's frozen heading-20 review. Result-only CSS selector changes do not alter the current TV waiting proof.
