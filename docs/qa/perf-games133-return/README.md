# WebKit TV return spike — causal diagnostics

2026-10-05. Final frozen production guard measured opening maximum18ms for direct launch and17ms for preselected launch, with no >40ms opening/idle frames in these final samples. Covered preparation still has125–177ms gaps. Earlier diagnostic and intermediate regression evidence is retained below. Product integration is root-owned; this lane changed only its profiling harness/report.

`scripts/qa-perf-games133-return.cjs` launches actual TV/controller/server, starts Hungry Arena, and measures individual stop-transition RAF gaps at1920×1080. It does not take a screenshot before stop or construct Error stacks on style reads. Browser variants run sequentially. Diagnostic CSS/source substitutions are injected into the browser, not saved into product files.

## Controls

Plain baseline runs reproduce the return spike: closed/revealing gaps of237–275ms then377–447ms, followed by79–112ms opening. Thus the original style-stack probe and screenshots are not required for this failure.

Horizontal viewport filtering in `inView`, bypassing return entrances, and retiring the outgoing game before stop do not eliminate it. The interaction partner's separate qualitative check confirms eight actually visible entrance targets; offscreen Fresh cards are not involved in this specific return.

Verified effects controls use stronger diagnostic specificity than production's repeated-ID selectors. Computed styles are inspected outside the timing sample:

| Variant | Masked elements/pseudo-elements | Backdrop elements/pseudo-elements | >40ms gaps (ms) |
| --- | ---: | ---: | --- |
| Baseline | 155–156 | 43 | 266,408 revealing;97 opening |
| No backdrop | 156 | 0 | 234,414 revealing;114 opening |
| No mask | 0 | 43 | 230,503 revealing;131 opening |
| No lobby grid transition | 156 | 43 | 237,418 revealing;124 opening |
| Retained hidden lobby layout, opacity0 | 156 | 43 | 169 revealing |
| Baseline repeat | 156 | 43 | 247,377 revealing;112 opening |

Source: `output/playwright/perf-games133-return-verified/report.json`. The earlier unverified mask/backdrop override had insufficient specificity and is not used for attribution.

## Callback attribution

A separate run instruments RAF, timeout, MutationObserver and WebSocket onmessage callbacks in top and game documents. It does not capture stacks in hot calls. Baseline reproduced256+432ms revealing and101ms opening. Largest measured top-document callback: railBounds20ms, performFitScreen15ms, mask update3ms, transition timeout2ms. No instrumented callback approaches the432ms gap.

The retained lobby repeats at178ms revealing, plus one66ms closing frame. Top-document callbacks peak at3ms. Source: `output/playwright/perf-games133-return-callbacks/report.json`.

Inference: the dominant cost follows complete hidden-menu layout/surface restoration and sits mostly outside these JS callbacks; evidence supports browser rendering work rather than a400ms JS handler. This is not an engine-native compositor allocation trace and does not distinguish every rendering pipeline substage.

## Safety boundary

The initial diagnostic `#tvStage #lobby[hidden]{display:grid!important;opacity:0!important;pointer-events:none!important}` retains in-flow layout and is not safe as a general product patch: games using relative `#play` can be shifted. The follow-up geometry batch tests absolute parking, visibility-hidden parking and header retention; product integration remains root-owned. No effects/resolution/asset downgrade is proposed. Physical iPhone/AirPlay acceptance remains separate.

## Absolute parking geometry

Before the product patch, absolute opacity0 parking reproduces the gain: one176ms revealing gap versus245+375ms revealing /93ms opening baseline. Hungry `#play` and `#gameFrame` are exactly x0,y0,width1920,height1080 in baseline, retained in-flow and absolute parked variants. The parked menu preserves its measured pregame rectangle. Root owns the subsequent product implementation with logical hidden and inert semantics.

Later geometry variants overlapped the root's integration window and are not treated as authoritative old/new comparisons. Final evaluation uses snapshot-pinned CSS/TV JS and fresh servers for each case, explicitly stripping only the retention patch for old-source controls.

## Final product comparison (snapshot-pinned, fresh server per case)

After the root's product retention patch, four serial WebKit runs use saved source strings for TV JS, motion JS and motion CSS. Old-source controls remove only retention CSS and the inert assignment. Each JSON records SHA256 hashes. No callback instrumentation, screenshots or style reads occur in the timed sample; screenshots are taken afterward.

| Route/source | RAF p95 | Revealing max | Opening max | Active transition | Request to idle |
| --- | ---: | ---: | ---: | ---: | ---: |
| Direct launch, old | 23ms | 460ms | 122ms | 1568ms | 1581ms |
| Direct launch, current | 69ms | 189ms | 168ms | 1073ms | 1088ms |
| Preselected Hungry, old | 21ms | 364ms | 24ms | 1383ms | 1399ms |
| Preselected Hungry, current | 22ms | 219ms | 22ms | 1119ms | 1133ms |

Direct-launch current has additional opening gaps84,89,69ms and idle71ms. Preselected current has idle49,158,109ms. These are material residual stalls; the retained menu reduces the largest covered work and total transition duration but does **not** establish uniformly smooth return. Each case is one short desktop-browser sample, not a population estimate or device FPS claim.

Current hidden menu geometry exactly preserves pregame geometry in both routes: direct x0,y96,1920×984; preselected x0,y60,1920×1020. The Hungry play/frame remain x0,y0,1920×1080. Four post-sample screenshots were visually inspected: composition, artwork, masks, backdrop treatments and menu contents remain present. Static captures do not prove motion continuity.

Evidence: `output/playwright/perf-games133-return-final/{old-direct,current-direct,old-selected,current-selected}/report.json` and adjacent `baseline-after-return.png`. Root and interaction partner were informed of residual visible/idle gaps. No further product changes made by this lane.

## Exact remaining regression: retained grid-row transition

A subsequent snapshot-pinned run removes only the root's broad hidden-descendant CSS animation pause. Direct launch still stalls visibly; this is not fixed by that removal alone. A passive `transitionrun` listener records `grid-template-rows` on `#lobby` while revealing for direct launch. The preselected route has no transition event.

| Unpaused retained source | RAF p95 | Revealing max | Opening max | Transition |
| --- | ---: | ---: | ---: | ---: |
| Direct launch | 68ms | 130ms | 160ms | 1167ms |
| Preselected | 20ms | 181ms | 18ms | 1031ms |
| Direct launch + only lobby transition:none | 28ms | 157ms | 19ms | 1092ms |

The transition:none diagnostic has no >40ms opening or idle gaps. The ordinary direct route has84,91,160ms opening gaps. The selected sample still has one98ms idle gap; do not erase that residual finding. Source: `output/playwright/perf-games133-return-unpaused/`.

Causal interpretation: retaining layout preserves the old no-Host-Pick menu geometry. Direct launch selects Hungry while the catalog is hidden; restoration then animates the menu's grid-row change. This newly observable retained-layout transition causes repeated visible rendering stalls. Root was given the narrow implementation target: suppress that covered scene-restoration reflow only, preserving normal visible menu transitions, all effects and existing dimensions. The diagnostic removes all lobby transitions for isolation; it is not the proposed global production behavior.


## Final frozen production guard

Root integrated absolute retained-menu layout plus inert behavior and a narrow `tvm-menu-preparing` guard that disables lobby grid transitions only during covered scene preparation. The final two runs use that actual production code, with no diagnostic CSS/source override.

| Route | RAF p95 | Revealing max | Opening max | Active transition | Request to idle |
| --- | ---: | ---: | ---: | ---: | ---: |
| Direct launch | 26ms | 125ms | 18ms | 1061ms | 1084ms |
| Preselected Hungry | 19ms | 177ms | 17ms | 1050ms | 1068ms |

Neither final sample records a >40ms opening or idle frame. Direct covered gaps are69+125ms; selected covered gap is177ms. Both have zero page exceptions and zero CSS transitionrun events during scene return. This resolves the reproduced visible grid-transition stall in these samples; it does not eliminate covered preparation work or establish physical-device performance.

Compared with the pinned old-source cases above, direct largest covered frame460→125ms and opening122→18ms; preselected covered364→177ms and opening24→17ms. Whole transitions shorten1568→1061ms and1383→1050ms respectively. These are bounded single-run browser measurements, not universal speedup claims.

Final evidence: `output/playwright/perf-games133-return-guard-final/{direct,selected}/report.json`. Both runs have identical motion/TV source hashes. Their post-sample screenshots were opened and visually inspected: expected full menu, Host Pick, avatars, masks, artwork, soft backgrounds and new lime featured-description color present. Interaction/retained-menu accessibility and all-game transition regression remain the separate partner/root tests.
