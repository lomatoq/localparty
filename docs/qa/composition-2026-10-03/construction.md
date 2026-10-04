# Construction and deluxe composition — 2026-10-03

Status: approved family implemented and one named correction batch confirmed. All 20 confirmation originals opened individually; scoped live composition review complete.

## Scope and invariants

Owned presentation: `games/western_duel/public`, `games/jenga/public`, `games/crane/public`, `games/arcade_deluxe/public` for western_duel, jenga, crane, marble_bloom, pocket_siege. Shared parent HUD and native bridge belong to shared_hud. No parent CSS injection, mechanics, input mapping, scoring, localization, footer or asset edits.

Retain entire actors and field bounds, Jenga's borderless warm floating gradient rail, full-width phone support selection and large rounded preview, actual Stability and tied places, Crane's grounded base/boom/hooks and competition places, Pocket's 44px input targets and private weapon deck, Marble's actual patterned preview. Dirty files present before this pass are retained.

The incumbent family uses violet/lime and Kardia typography; physical-device validation is distinct from browser evidence. Space follows the 4/8/12/16/24/32 rhythm. Materials paint existing semantic surfaces; decorations must not become new wrapper boxes.

## Original evidence opened

All ten original images below were opened and visually inspected from `output/playwright/ui-rework-2026-10-02/final-catalog-1734/`. These establish the baseline only.

| Game | TV original | Phone original | Spatial observation |
| --- | --- | --- | --- |
| Two at Sunset | western_duel-tv-live-1920.png | western_duel-phone-live-402.png | Stats extend over arena from x1254, beyond crew x1548. Queue begins y180; standings y317; field signal/title/stats have different anchors. Phone task path is legible and Shoot dominates. |
| Jenga | jenga-tv-live-1920.png | jenga-phone-live-402.png | Whole tower and table lead correctly. Force/selection/crew stack below HUD is detached, with crew too low relative to remaining height. The warm fading outer paint is preserved. Phone support and preview already have the required proportions. |
| Crane | crane-tv-live-1920.png | crane-phone-live-402.png | Whole grounded crane/base and hook lead correctly. Right task then blocks/lives then crew starts as separate islands on generic violet. Phone currently has large empty upper gap before turn/status, then practical controls. |
| Marble Bloom | marble_bloom-tv-live-1920.png | marble_bloom-phone-live-402.png | Whole track/garden reads correctly. Three score chips cluster against bottom-left instead of field center. Phone phase/now-next are above pad, but excessive separation makes ammo feel detached. Pattern glyphs already visible. |
| Pocket Siege | pocket_siege-tv-live-1920.png | pocket_siege-phone-live-402.png | Full-width field preserves terrain/tanks and sky trajectory. Weapon y184 left and roster y183 right already share rough anchor; improve their relationship/material, do not allocate an intrusive new sidebar. Phone deck task order works; direction/power muddy green surfaces weaken instrument identity. |

## Five spatial theses

### Two at Sunset: match cap, arena, tournament wing

Primary path: match phase → duel signal/actors → next pair → standings. Stage stays about 77–80% of usable width; tournament wing 20–23%, bounded to 360 CSS px at current TVs. Approved family choice puts title, state/time and metrics together in the actual rail cap. The readout must never project over the arena. Existing signal remains clear over the arena, with no unrelated global top reservation. Queue and standings have one tight 12–16px rhythm within the wing, with roster the only region that scrolls for 16 players.

Material: one dark saloon ledger plane behind the wing, warm leather/paper grain, fine cream/brass edge and quiet engraved divider. Inner rows retain clear gaps, no second heavy card around queue. Use CSS layers on the existing rail, no new bitmap. Phone Shoot and full-width stage stay in their present order; warm edge treatment belongs to stage/next pairing, not an extra card around every label.

### Jenga: tower first, one floating warm information column

Primary path: tower → current extraction/force/selection → crew. Preserve whole tower/table and continuous backdrop. The task cluster and crew align to one centered column in the available wing under the compact parent readouts. Force and selected support form a compact cluster with 8–12px internal gaps; crew begins 16–24px below it. Content does not begin at an arbitrary top y and leave the lower half unused. For 16 players, task remains fixed and the crew alone scrolls.

Material: keep existing outer rail borderless and its warm fading gradient; add restrained wood grain directly in its paint, warm divider and fine highlight in existing selection surfaces. No hard outer contour or nested task card. Preserve phone support full width and large rounded preview; no size reduction without evidence of a real fit problem. Stability remains derived from live state and places retain ties.

### Crane: one worksite rail paired with a complete grounded crane

Primary path: whole boom/hook/base → active block and remaining attempts → crew. Keep field about 78–80% width and wing about 20–22%, maintaining the base and hook's complete drawing within the field. Right rail begins at the shared cap boundary; active block, blocks/attempts and crew share a common x anchor and 12–16px rhythm. Reduce empty phone space by making turn/status/meters one compact group immediately above moves/drop, with actual controls preserved.

Material: dusk-blue enamel outer surface with low contrast brushed wash, amber seam and restrained rivet/survey motifs on the existing rail. Existing player rows keep readable opaque paint and real competition places. Phone meters/move surfaces receive the same instrument family; drop remains lime. No overlays around the crane or art edits.

### Pocket Siege: battlefield led by a coordinated instrument band

Primary path: active player/turn/wind → selected weapon → whole ballistic field → standings. Preserve full field width and tank/terrain positions. Weapon task at left and roster at right share one below-cap y anchor; compact maximum height keeps both in upper sky instead of occupying ballistic terrain. Do not introduce a sidebar or enlarge these groups. On phone retain status/module/weapon → direction+power → fuel/move → fire and private deck.

Material: charcoal-violet brushed metal on existing weapon/task/score surfaces; fine lavender instrument rim, corner ticks and restrained highlights. Direction/power surfaces lose muddy green in favor of deep neutral metal, with lime reserved for active readouts/needle and power. Inputs remain at least 44px; no privacy or interaction changes.

### Marble Bloom: track and centered crew; ammunition belongs to aim

Primary path: level/chain → whole track and active turrets → crew dock. Preserve whole track and responsive canvas fit. Move crew dock to centered bottom edge with bounded inset, keeping it outside track geometry and adapting to player counts. On phone, phase/now-next/aim become a contiguous sequence (8–16px gaps); preserve large aim area and adjacent swap/fire.

Material: botanical glazed teal/ceramic on existing ammo/aim/crew surfaces, fine warm tile edge and etched concentric rings. Current color/pattern glyphs stay intact. Decorations stay in the surface margin and never compete with ammunition or aim crosshair.

## Coordination

- shared_hud: approved rail-cap for Western/Jenga/Crane and centered-scoreboard for Pocket/Marble. Local rails expose `data-tv-hud-rail` and reserve `--party-hud-height + 16px` intrinsically. Arcade arena exposes `data-tv-hud-anchor`; crew exposes `data-tv-hud-cluster`. Parent owns cap and zero global inset in rail mode.
- sports_controls: approved warm saloon leather, borderless timber, dusk enamel/amber, charcoal equipment and botanical glaze; body/rim/perimeter motifs applied directly to existing semantic surfaces.
- Local authored material surfaces expose `data-hp-theme-preserve` so the previous generic theme cascade cannot silently replace the approved paint. Crane inner scores/rules remain transparent under the single enamel rail.
- Browser budget: no process started; parent must grant a slot before fresh capture.

## First implementation batch

Western now has one warm ledger rail with intrinsic cap slot and contiguous queue/standings. Jenga keeps a borderless coral/violet transparent-edge radial backing; force and selected support sit beside each other, then the crew. Crane has one dusk enamel rail, fixed task, flexible scrollable crew, and matching existing phone meter material. Pocket left weapon and right crew share `--party-hud-bottom + 16px`; existing phone direction/power/weapon surfaces carry neutral metal paint with their input sizes retained. Marble crew dock is centered at the bottom field edge and existing ammo/aim carry ceramic/glaze material.

Existing support/preview proportions, controls, selected-state colors, data and rules retained. Presentation JS syntax checks passed. Capture and per-screen review remain pending.

Source review caught a baseline Jenga presentation inconsistency: equal Blocks used sequential `i+1` places. Host crew now displays competition place `1 + count(players with more moves)`, matching Crane's existing tied-place semantics. This changes the displayed place only, not moves, scoring or game rules. Actual Stability remains the live published value.

Impeccable detector ran once over the five affected CSS files; three warnings are in pre-existing declarations: Jenga width transition on balance, Arcade legacy retro Arial face, Arcade existing pressed-ring bounce easing. No warning points into the newly added composition/material rules. The declared invariant preserves existing motion and interaction; these warnings do not justify collateral edits in this pass. Full diagnostic saved beside this note as `construction-detector.json`.

## Required post-implementation evidence

Fresh actual launcher-route TV 1280×720 and 1920×1080 for all five. Phone 402×874 plus 320×568 for changed phone surfaces through the actual shell/bridge. Open every original capture and record individual observations. Include phase changes and maximum-player roster bounds where groups change; do not reuse earlier overlap-test passes as composition acceptance. Inspect input/privacy/stability/place invariants with existing relevant checks, run Impeccable detector once after implementation, and distinguish browser evidence from physical-device validation.

## First live pass and single correction batch

Evidence: `output/playwright/composition-2026-10-03/construction-pass1/`, all five games, real normal-clock play, native chrome, 1280×720 and 1920×1080 TV, 402×874 and 320×568 phones. One actual browser player plus built-in test bots; no injected scores/phase. All 20 originals opened individually. The first attempt hit sandbox localhost EPERM; authorized retry succeeded. No game errors. Source drift during this pass was limited to other agents' Quiz/Naval files, so this is five-game visual evidence rather than a repository-wide freeze claim.

| Game | 1280 TV | 1920 TV | 402 phone | 320 phone |
| --- | --- | --- | --- | --- |
| Jenga | Whole tower/table, floating warm column, shared cap, extraction and crew directly related | Same whole scene, enlarged cap within rail; all zero-move players display tied place 1 | Full-width support, large rounded preview, timber selection visible | All essential controls visible; Stability retained |
| Crane | Whole grounded boom/base/hook; discovered unreserved rail cap | Same local cap overlap and absent new enamel | Original meter paint/upper gap remained | Enamel visible and controls visible |
| Two at Sunset | Whole actors, unified leather rail, cue stays over field | Unified cap contains title/state/metrics without field overhang | Future queue interrupts cue→Shoot path, unnecessary lower air | Whole controls; compressed scene still readable |
| Marble Bloom | Whole track, centered cap and centered glazed crew | Same whole garden/track and centered crew | Phase and patterned now/next precede glaze pad; actions fit | Primary actions below footer; not accepted |
| Pocket Siege | Whole tanks/terrain, weapon+crew below same cap boundary | Same coordinated instrument band | Neutral metal ranges, native sliders and Fire fit | Fire falls below footer; not accepted |

Named correction batch: **rail scope and short-phone task fit**. Close Crane's preexisting <=350px media before the new rail block (the missing boundary was introduced by this agent). Hide future queue only for the active Duel controller, retain it for spectators, and center its cue/scene/Shoot group in the actual iframe height. At short <=460px iframe heights, tighten Marble phase/ammo gaps and aim pad while retaining patterned previews and 56px actions; compact Pocket tab/weapon/range/fuel grouping while retaining 44px range hit areas, 44px moves/tabs, private weapon list, and 52px Fire. The 402px composition is preserved. No scoring/input changes.

## Confirmation originals and acceptance scope

Fresh run: `output/playwright/composition-2026-10-03/construction-confirm/report.json`, 2026-10-03 01:30:27–01:31:08 UTC. All 20 live originals below were opened individually. `errors=[]`, no per-game errors, `changedFiles=[]` over the harness source fingerprint. This includes the approved shared continuous rounded rail heads; Jenga remains a borderless radial wash. The temporary copy of the root capture harness changes only imports to absolute paths and adds 320×568 beside 402×874; production harness unchanged. One browser process, slot released after browser/server closed.

| Game | 1280×720 original | 1920×1080 original | 402×874 original | 320×568 original | Confirmed observation |
| --- | --- | --- | --- | --- | --- |
| jenga | [TV1280](../../../output/playwright/composition-2026-10-03/construction-confirm/jenga-tv-live-1280.png) | [TV1920](../../../output/playwright/composition-2026-10-03/construction-confirm/jenga-tv-live-1920.png) | [Phone402](../../../output/playwright/composition-2026-10-03/construction-confirm/jenga-phone-live-402.png) | [Phone320](../../../output/playwright/composition-2026-10-03/construction-confirm/jenga-phone-live-320.png) | Whole tower and table at both TVs; cap, extraction and crew share the warm fading column. Actual Stability 100%, all four zero-block places tied 1. Both phones retain full-width support and large rounded preview. |
| crane | [TV1280](../../../output/playwright/composition-2026-10-03/construction-confirm/crane-tv-live-1280.png) | [TV1920](../../../output/playwright/composition-2026-10-03/construction-confirm/crane-tv-live-1920.png) | [Phone402](../../../output/playwright/composition-2026-10-03/construction-confirm/crane-phone-live-402.png) | [Phone320](../../../output/playwright/composition-2026-10-03/construction-confirm/crane-phone-live-320.png) | Complete grounded boom, base and hook at both TVs; continuous enamel rail with amber rim/rivets, cap reservation and task/crew sequence. Whole moves/Drop at both phones, matching visible enamel meters. Long crew identity remains whole but wraps three lines. |
| western_duel | [TV1280](../../../output/playwright/composition-2026-10-03/construction-confirm/western_duel-tv-live-1280.png) | [TV1920](../../../output/playwright/composition-2026-10-03/construction-confirm/western_duel-tv-live-1920.png) | [Phone402](../../../output/playwright/composition-2026-10-03/construction-confirm/western_duel-phone-live-402.png) | [Phone320](../../../output/playwright/composition-2026-10-03/construction-confirm/western_duel-phone-live-320.png) | Whole actors and field; leather rail contains unified title/state/metrics, queue and crew. Active phone queue absent; centered scene/notice/Shoot now continuous at both sizes. Shared cap still abbreviates the long primary/Leader name; full identity visible in roster/field. |
| marble_bloom | [TV1280](../../../output/playwright/composition-2026-10-03/construction-confirm/marble_bloom-tv-live-1280.png) | [TV1920](../../../output/playwright/composition-2026-10-03/construction-confirm/marble_bloom-tv-live-1920.png) | [Phone402](../../../output/playwright/composition-2026-10-03/construction-confirm/marble_bloom-phone-live-402.png) | [Phone320](../../../output/playwright/composition-2026-10-03/construction-confirm/marble_bloom-phone-live-320.png) | Whole track/garden; cap and glazed crew both centered on field. Patterned now/next visible on both phones. 320 compact pad and complete Swap/Fire remain above footer; 402 keeps large pad. |
| pocket_siege | [TV1280](../../../output/playwright/composition-2026-10-03/construction-confirm/pocket_siege-tv-live-1280.png) | [TV1920](../../../output/playwright/composition-2026-10-03/construction-confirm/pocket_siege-tv-live-1920.png) | [Phone402](../../../output/playwright/composition-2026-10-03/construction-confirm/pocket_siege-phone-live-402.png) | [Phone320](../../../output/playwright/composition-2026-10-03/construction-confirm/pocket_siege-phone-live-320.png) | Whole tanks, terrain and trajectory; metal weapon task and crew share below-cap baseline. Both phones retain status, tabs, private weapon selector, direction/power, fuel/moves and Fire. At 320 whole Fire fits; native range hit areas stay 44px. |

Rendered cap/rail proof sampled immediately after the adjacent PNG (parent vs child local axes align because fullscreen host frame starts at y0 for rail mode):

| Game | 1280 rail/cap x,width,top | 1920 rail/cap x,width,top | Intrinsic cap → rail padding at 1280 / 1920 |
| --- | --- | --- | --- |
| Jenga | 920,336,24 | 1560,336,24 | 153.77→169.77 / 230.64→246.64 |
| Crane | 920,336,24 | 1560,336,24 | 153.77→169.77 / 251.33→267.33 |
| Two at Sunset | 908,360,12 | 1548,360,12 | 153.66→169.66 / 230.48→246.48 |
| Marble Bloom | centered cap x360,w560,top0 | centered cap x540,w840,top0 | centered field axis; no rail |
| Pocket Siege | centered cap x360,w560,top0 | centered cap x540,w840,top0 | weapon/crew share measured cap-bottom+16 |

Paint acceptance comes from the actual original pixels and screenshot-adjacent computed rail/cap material, not nominal global theme registration. Global theme proof can report `painted:0` for explicitly preserved targets; local CSS owns those glazed/metal/timber surfaces. `construction-detector.json` contains only inherited balance-width transition, retro Arial, and preview bounce findings; no added texture under names/numbers or added decorative wrapper boxes. JS syntax checked for affected presentation modules. No mechanics/input/scoring/assets/locales/footer edits; Jenga place formula is display-only tied rank.

Limitations: captures use one actual browser player plus built-in bots (four in Jenga/Crane/Duel/Pocket; catalog clamps Marble to three). Maximum 16-player scrolling, nonzero extracted Jenga Stability, private weapon drawer and alternate Pocket Drone/AA modes were not newly exercised in this bounded composition pass. Physical-device behavior is not established. Earlier overlap tests do not stand in for this review. Shared Duel actor-primary/Leader duplication and long-name ellipsis remain a known caption limitation; shared owner elected preserve its existing real readout semantics.

## Latest user brief — Jenga / Night Shift simplification

The preceding confirmation is historical for these new source edits. Latest accepted-catalog originals opened: Jenga and Crane TV1280/1920, Jenga phone402. Browser launch awaits the root slot grant. Impeccable layout/craft floor and Emil design engineering applied to a specific polish request.

| Before | After | Why |
| --- | --- | --- |
| Jenga full-height coral/violet radial and hard active row | One contained warm radial fading naturally to transparent; no row backing, border, shadow or pseudo enclosure | Warm light supports the task without reading as a stretched stain or hard card |
| Jenga cap/task/crew spread through fixed top24/bottom24 rail | Intrinsic-height rail centered vertically with bounded crew scroll; measured cap+12 reservation | Whole match group is anchored to the field's center instead of the frame's top |
| Jenga grey layer steps on a golden station | Warm timber fill #72543a, cream ink #fff1da, distinct muted brown disabled state | Steps belong to the support station; existing 44px controls, press behavior and selection proportions unchanged |
| Crane opaque dark gradient backing, amber rivets/rim and dark player cards | One blue-green #284d56→#173c42 surface, transparent rows and no perimeter ornaments | Preserve the requested attractive material without stacked dark boxes |
| Crane full-height rail and bottom-pushed rules | Centered intrinsic-height group with bounded roster | Cap, block task, crew and rules align as one group across field height |

Local changed files: `games/jenga/public/style.css`, `games/jenga/public/controller.css`, `games/crane/public/style.css`. Shared_hud owns transparent Crane cap and soft borderless Jenga cap; sports_controls owns stale global theme profiles. All three CSS brace checks pass. New geometry/materials await actual 1280/1920 TV and 402/320 phone verification; no fresh acceptance or physical-device claim.
