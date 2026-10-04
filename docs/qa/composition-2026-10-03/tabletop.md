# Tabletop composition — 2026-10-03

Status: approved presentation implementation frozen. Fresh confirmation images reviewed; specific remaining coverage and shared defects are recorded below.

Scope: public host presentation for Quick Battleships, Mine Together, Poker Night and Air Hockey. Preserve every existing dirty change. Public/private state, rules, input, physics, card distribution and mine generation are outside scope.

Baseline: individually opened `output/playwright/ui-rework-2026-10-02/final-catalog-1734/{naval,mines,poker,airhockey}-tv-gameplay.png` and the corresponding available 1920 live captures. These are historical evidence, not current acceptance.

## Primary task paths and relationships

| Game | Primary path | Related secondary content | Proposed family and bounds | Visible material |
| --- | --- | --- | --- | --- |
| Quick Battleships | Captain identity → public ocean → impact | All captain health/points and latest shot events | Board + attached crew rail. `.screen-workspace` owns rail `.naval-console` and right `.stage`; remove local 148px stage pad; board formation fits remaining usable height, not whole viewport. 2–16 fleets stay one measured formation. Cap attaches to formation top; rail aligns inside same top/bottom range. | Blue water on actual `.miniOcean` cells, restrained radar lines and brushed navy bridge surface. Orange hits and pale misses preserve status contrast. |
| Mine Together | Live numbered field → cursor marker → opening result | Timer/score/leader, short rule, ranking | Board + attached rail. `#tabletop` owns `#mineSide` and `#grid`. Safe panel/board top starts below measured shell notch bottom +16px, square board sized from remaining height; intentional bottom16px. Rail aligns with board and caps rank scrolling, never crowds notch. | Graphite survey plates for covered tiles, light mineral interiors for opened cells; visible beveled rim and distinct hazard. This is a hazard survey theme, not an invented mining rule. |
| Poker Night | Active seat → pot/community → next actor | Hand/timer/current bet | Center table + match cap. Retain ellipse, attached seat identity/chips, public showdown anchors. Fit table below measured cap; avoid extra panel competing with felt. | Emerald woven velvet on actual `.felt::before`, retain supplied leather and metal edge. Card values, faces and hidden/public behavior untouched. |
| Air Hockey | Puck → team striker → goal | Score/timer, player labels, last hitter | Arena + compact match cap. Retain physical5:3 canvas and label avoidance. Shared cap stays attached above/within safe arena zone; last hitter stays away from moving puck/mallet names. | Cool perforated enamel and subtle ice sheen on real canvas, supplied mallets and puck retained. No physics or trajectory changes. |

## Evidence behind the plan

- Naval baseline has a full height overview plus148px local stage pad; at1920 the lower oceans end around1064px, while the rail is centered separately. This is structural, not an alignment nudge.
- Mines baseline square field starts around20px and the rail title around32px; both ignore the shell notch154px bottom. The old `padding:12px` final override supersedes the earlier measured-safe rule.
- Poker baseline elliptical table, public seats and attached hidden hands already form a clear physical group. Preserve these relationships.
- Hockey baseline actual rink fills approximately y30–1050 with readable team colors and separated mallet labels. Preserve this field clarity and label behavior.

## Integration contract

The shared HUD lane owns parentTV/header/bridge files. This lane will not inject parent CSS. Real selectors supplied to `/root/shared_hud`: naval `.naval-console`, `.screen-workspace>.stage`, `#oceanOverview`, `.oceanCard>b`, `.miniOcean`; mines `#mineSide`, `#grid`; poker `#tabletop .felt`; hockey `#airhockey`, `#rink`, `#hockeyHitters`.

Retain naval health-first identity cards and44px standard phone targeting cells; small iframe fit already has a deliberate36px fallback. Retain fresh Mines B1/B2/B3 markers, shared ranking identity tracks, actual Start behavior, poker reveal anchors, hockey label avoidance. Phone geometry is not changed by TV-only layout edits.

## Acceptance after approval

Root browser-slot grant required before launching browser QA; max3 simultaneous QA browsers globally. Capture fresh actual route states at1280×720 and1920×1080 for each changed host, plus402×874 and320×568 if any phone paint or geometry changes. Include Mines actual Start/matchmaking and fresh markers, naval2/4/many crew plus impact, poker community/showdown and hockey active puck/last-hitter. Open every composition-critical image individually. DOM bounds and automatic checks support screenshots; physical-device validation remains separate.

Quality workflow: Impeccable context and layout reference read. User's current all-game authorization supersedes older PRODUCT.md rankings-only scope. Read craft-floor immediately before approved production edits, then one implementation pass, one batched capture pass, one correction/confirmation pass if needed.

## Implementation and pre-browser checks

- Actual naval `.naval-console` and Mines `#mineSide` marked `data-tv-hud-rail`; static intrinsic cap slot uses `calc(var(--party-hud-height,104px) + 16px)`. Mines rail exists before waiting/Start card setup, with live status/help/players/Start nodes retained.
- Naval stage removes148px local padding; formation takes only its own fitted stage height. Rail and formation share the stage center. Navy ocean/radar cells and metal bridge surfaces are visibly painted.
- Mines actual field is graphite covered plates and pale mineral open wells with dark, contrast-preserving numbered feedback. Public B1/B2/B3 cursor construction unchanged.
- Poker actual felt gains emerald woven velvet inside the retained supplied leather/metal rim; seats/cards and their public/private behavior retained.
- Hockey actual canvas gains a cool enamel sheen behind game objects; existing perforations/strikers/puck retained. Name avoidance uses measured `PARTY_HUD_EXCLUSIONS` supplied by bridge, with existing fallback.
- TV-only CSS keeps phone sizing/actions unchanged. Standard naval44px targeting cells and existing short iframe36px fallback preserved.
- JS syntax passes. `node --test tests/hockey-last-hitter.test.cjs`:2/2 pass. This is automatic evidence only.
- Impeccable detector reports two incumbent warnings: naval unrelated answer border at screen.css15 and prior mine reveal easing at arena.css154. New composition/material rules introduce no reported findings; no unrelated behavior or styles were removed to silence them.

## Fresh browser evidence

Real isolated server, actual launcher/engines, one WebKit browser, one joined controller and three real bots; normal clock and real controller actions. Native controller transport/tabs are emulated by the browser harness. This is browser evidence, not physical iPhone or TV validation.

The initial 18 captures and all 18 confirmation captures were individually opened. Shared rail percentage-padding and progress-grid defects found in the initial images were corrected by the shared HUD owner before confirmation. The final focused Naval correction has four newly captured, individually opened images and zero page errors.

| Game/state | Current image evidence | Visual outcome |
| --- | --- | --- |
| Naval battle 1280/1920 and phone402/320 | `output/playwright/composition-2026-10-03/tabletop/naval-corrected/` | Four captains fully visible, no cropped/faded fourth row. Board formation fits the stage and is centered together with its actual attached navy rail. Cap matches rail width. Health stays attached to public fleet identity. Actual fire/miss state shown; phone targeting grid and footer remain usable. |
| Mines playing and managed waiting1280/1920, phone402/320 | `output/playwright/composition-2026-10-03/tabletop/confirm/` | Graphite/mineral field and rail fit. Cap ends before rule/ranking content with intentional spacing. Fresh B1/B2/B3 cursors present. Managed waiting shows real Ready lobby; it does not prove actual Start-panel behavior. |
| Poker playing1280/1920, phone402/320 | Same confirmation directory | Emerald velvet remains inside actual supplied rim; active seat, cards, pot and chips retain clear relationships. Scoreboard/table share the central axis. Phone action surfaces remain clear. |
| Hockey playing1280/1920, phone402/320 | Same confirmation directory | Actual rink retains5:3 proportions with enamel paint behind play objects. Scoreboard follows rink axis; labels use measured cap exclusions and stay readable. Phone controls remain clear. |

Named local correction batch: fitted Naval formation width, actual Mines rail specificity, and nonshrinking captain drawer/live feed. A further focused Naval correction was explicitly approved after the user rejected the remaining1280 crop: crews up to four now use intrinsic drawer height and visible overflow, while larger crews retain bounded scrolling. The fresh `naval-corrected` images supersede previous Naval captures.

Remaining review limits:

- Shared Mines1920 metric labels Points/Leader nearly touch and leader value truncates to “Bo...”. Reported to the shared HUD owner; this lane did not inject parent styles.
- Actual Mines Start panel, Naval2/many-fleet states, Poker showdown and Hockey last-hitter after a confirmed contact were not established by this four-player gameplay capture. Existing last-hitter regression tests pass2/2, separately from visual evidence.
- Engine/input/state behavior was outside this lane's edits. Parallel work can change those sources; no catalog-wide engine hash-stability claim is made from these captures.
- Physical-device validation remains outstanding. QA slot3 was released after the final browser closed.

## User-requested Naval top/crew revision

The user rejected the prior captain/top treatment after seeing the actual1280 image. The new Naval-only presentation now uses a single authored row grid: rank and award side by side, a separate avatar, name16px and two-line public health/hits/sunk status13px, followed by an intrinsic score track26px with protected numeric ink. Rows are at least64px high with8px gaps. The bridge heading occupies28px; the18px captain summary is quiet. Two real shot events stay in a separate complete lower feed. Public board array geometry and phone inputs remain unchanged.

The shared owner implemented the specific rounded maritime trapezoid with shaded navy/cyan paint, approximately126.45 logical pixels high, plus identity-only long-leader ellipsis. This lane did not alter parent HUD source.

- Normal four-captain current originals: `output/playwright/composition-2026-10-03/tabletop/naval-top-confirm/naval-playing-{1280,1920}.png`. Both TV images and both phone402/320 images individually opened. Actual hit/sunk and scores100/250 prove whole numeric ink and clear status grouping, not only zero-score cards.
- Fresh maximum16 current originals: `output/playwright/composition-2026-10-03/tabletop/naval-max16-final/naval-playing-{1280,1920}.png` and `naval-crew-bottom-{1280,1920}.png`. All four TV images plus both phone images individually opened. Long leader contained; all16 oceans fit; actual final rank16 visible with whole ink.
- Max16 supplemental drawer geometry: DOM scroll reaches last row at both sizes. At1280 last-bottom586.44 and drawer-bottom585.98 (within2px tolerance); at1920 last-bottom945.22 and drawer-bottom945.98. Both checks count16 real rows.
- A real mouse-wheel attempt was blocked by the managed TV parent, which intercepts pointer events above its game iframe. The successful subsequent check uses DOM scrolling and does **not** establish pointer interaction or physical-TV scrolling. No new navigation architecture was introduced.
- Current capture reports have zero page errors. JS syntax and owned-file diff-whitespace checks pass. Product source frozen and QA slot2 released; normal4 and max16 browser sessions closed.

These Naval images supersede the earlier `naval-corrected` captain-row/top evidence. The earlier Mines1920 shared metric squeeze was subsequently addressed by the shared owner; root's fresh whole-catalog capture must establish final verification.

### Dense ocean identity correction

An independent review found that16-player ocean headers shortened multiple numbered bots to identical “Bot...” labels. The named display-only correction touches Naval `broadcast.js`: actual test bots on dense boards (>8 fleets) display `B14`/`B11` in English and `Б14`/`Б11` in Russian, with the canonical full name retained in tooltip/aria text. Stored names, human ellipsis, hearts, normal four-player headers and grid geometry are unchanged.

Current maximum16 evidence is now `output/playwright/composition-2026-10-03/tabletop/naval-dense-identities/`. Both1280/1920 top originals visibly retain all B1–B15 numbers. Both drawer-bottom originals and phone402/320 originals were also individually opened, six images total. Zero page errors; both16-row DOM-scroll reachability checks still pass. Russian compact prefix is implemented but this capture used English locale. Source frozen and slot2 released.

### Actual centered-field markers and capture settling

Root's whole-catalog checker identified missing passive actual-field anchors for Poker and Hockey. `games/tabletop/public/app.js` now marks the active host `.felt` or `#rink` with `data-tv-hud-anchor`, removing any alternate hidden field marker. No geometry, art, cards, rules or phone input changed. Syntax passes; source frozen for root's fresh capture and checker rerun.

The rejected root Poker live1280/1920 originals were individually opened. Their rendered scenes disagree with adjacent measured dimensions:1280 metrics report cap x360/width560 while its PNG paints the previous1920-scale cap aroundx540;1920 metrics report a1920×1044 iframe while the PNG paints only the previous1280×708 scene. Both parent cap and child field are affected together. This is evidence of asynchronous resize paint in the short180ms root capture wait, not evidence for changing the authored felt dimensions. Root owns settling/recapturing Poker, Hockey and Naval; the old malformed originals remain rejected.

## Latest full-height brief — implementation awaiting integrated browser review

Owned IDs remain naval, poker, airhockey and mines. Latest user direction supersedes the earlier short Naval rail and local notch reserves. Impeccable layout/craft guidance and Emil design guidance were read for this revision.

| Before | After | Why |
| --- | --- | --- |
| Short centered Naval rail beside a taller board stack | Actual rail stretches to the same stack top/bottom; captain rows have72px minimum height and12px gaps, the drawer owns remaining room, two-event feed stays at bottom | Reading room follows the existing formation without stretching glyphs or avatars |
| Poker/Hockey local stage padding reserves shared header height | Actual felt/rink begin at iframe top0 with no duplicate local reserve | Shared header attaches to screen top and owns measured exclusions |
| Hockey field shrinks to make room for a lower readout | Rink uses full available iframe height with5:3 content mapping; actual last-touch readouts occupy lower corners and enter label exclusions | Field remains primary, supporting identities remain readable |
| Disabled Mines action fades its entire light-green surface | Bright lime enabled paint and a lighter muted disabled fill both use solid dark ink | State remains clear without reducing text contrast |

Only owned Naval/tabletop presentation files changed. Rules, physics, card distribution, mine generation and controls remain outside edits. Last-touch labels still appear only after actual contact; no decorative placeholder dashes were added. Declared Mines action text contrast is13.23:1 enabled and7.71:1 disabled, with opacity1; runtime styles still require browser confirmation. JS syntax passes; existing Hockey contact regression2/2 passes; Impeccable layout scan returns an empty finding list. Product source frozen awaiting root/shared header/gutter integration and a QA slot. Physical-device validation remains separate.
