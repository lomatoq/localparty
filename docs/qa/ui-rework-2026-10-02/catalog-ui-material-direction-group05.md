# Catalogue UI material direction — creative handoff

2026-10-02. Creative owner group05; implementation and fresh live proof owner group09. This is a material/colour/decor extension of the established HeyPals world, not a layout replacement. Preserve all current proportions, gaps, control order, hit areas, native fading chrome, typography, copy, input and gameplay. No new station, card or DOM wrapper. Existing approved world art stays untouched. Operate mode: action meaning and scanability outrank ornament.

## Practical pilot

Inspected actual existing originals for Kart, Poker, Jenga and Curling, plus their authored markup/styles. Kart currently has equal Place/Lap and large controls: asphalt belongs to current rear/control surfaces, flags remain a quiet supporting cue. Poker has deliberately unboxed status/private cards: there must be no new felt rectangle behind them. Green felt can colour existing painted betting surfaces/TV seat labels only; ivory private cards, red suits and chip numbers keep their current contrast. Jenga's tower already supplies material identity: dark timber can colour the current selection/watch surface, never the directional labels/joystick value. Curling's accepted ice drawer and controls are already being refined by its owner: exclude that drawer completely, theme only a verified still-neutral rear launch surface; do not duplicate its existing stone art.

First live comparison must show Kart/Curling/Jenga/Poker at402 and320, actual idle/held/off-turn as relevant. Copy geometry before/after and verify identical boxes; inspect originals, not only computed CSS. If a corner is not demonstrably empty, omit the decoration instead of allocating space. Do not make every game a decorated card.

## Eight material families

These are rear fills/keylines, not overrides of text, primary/selected/disabled actions, player/team identities, safety/status colours or game-world canvases. Use matte fills and at most one broad inset edge; no grain noise, glow, reflective metal, bevelled gadget dashboard, tiny texture lines, new shadow stack or repeating decorative patterns. Colour variation should be visible as actual material, not a tiny badge beside an unchanged violet panel. Brand Kardia and shared violet/lime action language remain.

| Family | Rear material | Quiet keyline | Supporting accent | Physical reference |
|---|---|---|---|---|
| Asphalt | #202a30 | #56616a | #f18165 | Kart timing/control console; sparse broad race marks only |
| Ice/enamel | #153545 | #557a8d | #7bdde9 | Smooth rink instrument, cool matte edge |
| Timber | #342719 | #886848 | #e1b06b | Dark wood rear board, broad grain only where text-free |
| Felt | #12372e | #4c7565 | #d8c99b | Deep green table cloth, clean ivory playing cards |
| Sand/leather | #362a25 | #876753 | #e7ae70 | Warm saloon/card-wallet material, no worn noisy leather |
| Naval blue | #17313f | #52798b | #72d0dd | Ship enamel with clean tide-colour edge |
| Paper/chalk | #29312f | #607970 | #d6caae | Dark drawing desk or quiz placard, no simulated handwriting |
| Tactical steel | #25302d | #596d61 | #bbcb8a | Matte field equipment; broad clean edge, no bolts everywhere |

## All36 games: named target and restraint

Selector column names existing authored surfaces verified in the corresponding engine/controller families. Implementation owner must resolve current visibility/state and skip a surface absent from a live DOM; never manufacture a wrapper to satisfy this table. Named joystick/pad targets permit rear material only, no coordinate or mark change. Popup targets are existing per-game sheets/dialogs, not shared native shell/footer.

| Game | Material / own accent | Existing target | Decoration placement and exclusion |
|---|---|---|---|
| push | Asphalt / turquoise | #joystickBase, existing waiting/status surfaces | None. Arena disc and player colours provide identity; no extra pit badge. |
| shrink | Ice/enamel / cyan | #joystickBase, existing waiting/status surfaces | None. Ring feedback belongs to current game state, not decor. |
| knives | Timber / coral | Existing knife-stats rear surface; existing controller waiting surface | None near Throw/counters; keep target sectors untouched. |
| bomb | Tactical steel / orange | #joystickBase, existing waiting/status surfaces | None. Actual bomb/holder feedback already carries the object. |
| western | Sand/leather / amber | Existing waiting/reveal passive surface | None near Shoot or WAIT/DRAW; no extra sheriff icon. |
| tanks | Tactical steel / olive | .status-card.hp-info-card, existing passive console surface | None near move/fire. Do not recolour active tank/team indicators. |
| tankarena | Tactical steel / cool sage | #status, #joy rear | None: weapon icon/pickups already supply meaningful art. |
| chaos | Paper/chalk / cyan | Existing pad rear/ring surface, current instruction region only if already painted | No additional cursor/arrow; CLICK/GRAB task and cursor mapping stay unchanged. |
| kart | Asphalt / coral | Existing statusStrip/current painted steering rear; current passive race stats | Authored racing-flag pair only within proven clear existing station corner, 24–32px each; omit320 if needed. Do not repeat Lap glyph beside Lap. |
| monster | Paper/chalk / turquoise | Existing phone-card waiting/confirm surface and tool-dock rear if already painted | drawing-pencils only waiting/confirm popup free corner; never inside drawCanvas or colour/tool hit areas. |
| spy | Paper/chalk / muted amber | Existing my-secret-mini.info-card, sheet-card | None. Role secret must retain all attention; no ornamental spy face. |
| millionaire | Felt / champagne | Existing question/passive lifeline surfaces and authored popup | None: question/options/lifelines already fill meaningful space. No new crown. |
| sinyakquiz | Paper/chalk / sage | Existing panel.stage/explanation passive surfaces | None. Answers keep correct/wrong/picked states and current letter contrast. |
| warsaw | Paper/chalk / warm stone | Existing panel.stage/explanation passive surfaces | None. Existing city art retained, no flags added to every option. |
| crocodile | Paper/chalk / leafy sage | Existing task/secret passive panel | None: secret word and actor action remain primary. |
| jenga | Timber / honey | .jenga-selection, .jenga-watch-selection | wood-blocks only existing popup/selection empty outer corner if tower not already adjacent. Never movement directions, layer number, tower canvas or support hit targets. |
| crane | Tactical steel / construction yellow | .phone-status/current existing passive station | wood-blocks only waiting/finish popup free corner; do not cover building miniature or drop/left/right controls. |
| naval | Naval blue / aqua | Existing .stage.panel/passive reload/own-fleet backing | None. Current grid and ship art provide identity; no buoy over grid. |
| drawguess | Paper/chalk / warm ivory | Existing stage.panel and passive guess/messages surface | drawing-pencils only existing rules/reveal free corner; never drawing canvas/tools/secret or guess input. |
| western_duel | Sand/leather / sunset amber | Existing duel-next-list/passive queue paint | None. Full sunset/actors already provide material identity; WAIT/DRAW/Shoot/queue numbers unchanged. |
| taprace | Asphalt / warm coral | Existing arcade-readout if painted; page material only if incumbent engine paints it | None. Actual runner cue and TAP already carry meaning. |
| punchmeter | Sand/leather / coral | Existing punch result/readout painted rear | None. Current glove/POWER feedback must stay uncontested. |
| flappy | Ice/enamel / sky cyan | Existing waiting/out readout painted rear | None. Real bird cue should remain the only illustration. |
| hungry | Felt / orchard sage | Existing joystick rear/current painted readout | None. Actual food/character art supplies the semantic accent. |
| snakelines | Felt / leaf green | #joy rear; existing out-state passive surface | None. Do not add a decorative snake that competes with actual direction. |
| carryball | Ice/enamel / turquoise | #joy rear/current painted possession surface | None. Ball possession state and PASS action colours untouched. |
| marble_bloom | Felt / mint | Existing range-card/phone-meta/aimpad rear | None. Real current/next marble previews already decorate with purpose. |
| pocket_siege | Tactical steel / sand olive | Existing range-card/phone-meta/drawer-panel | None. Weapon art stays actual selection identity; no generic crate badge. |
| bow_club | Timber / forest sage | Existing shot/passive info sheet rear | None. Camera/AR reticle and bow/target must remain unobstructed. |
| poker | Felt / warm ivory | Existing betting secondary faces/input backing, TV passive seat labels; .felt only where already visible | poker-chips only existing popup clear corner; never bankroll/bet/pot digits, private cards, raise entry, status text. Do not add a felt panel on the unboxed phone. |
| airhockey | Ice/enamel / glacier cyan | Existing passive score/stats backing | None on rink/paddle field. Puck/court are already the visual identity. |
| mines | Tactical steel / sage | Existing passive status/legend backing | None on grid; a decorative mine would imply a live hazard. Cell states untouched. |
| curling | Ice/enamel / soft cyan | Verified neutral #ss-launch-station rear only | Exclude #ss-score-drawer and accepted ice surface. No second stone if #ss-throw-art already shows one. curling-stone candidate reserved for an existing rules/finish popup clear corner. |
| bowling | Timber / honey cream | Existing #ss-launch-station rear/current passive sports status | bowling-pins only existing rules/finish clear corner; no pin over swipe line or POWER and no second pin beside existing throw art. |
| swarm_gate | Timber / warm sage | Existing passive shooter/status/finish sheet rear | None. Existing gate/turret/swarm art sufficiently identifies the game. Keep aim/cooldown/health colours. |
| peek_shoot | Sand/leather / muted coral | Existing passive shooter/status/finish sheet rear | None. Cover/target art is part of play; ornamental targets would mislead. |

## Asset packet

`public/assets/game-ui-themes-20261002/provenance.json` records exact built-in prompts and every origin. `source-hashes.json` records dimensions, alpha and SHA-256. Six candidate subjects: authored racing flag (pair via existing CSS background layers only), generated curling stone, bowling pins, poker chips, wood blocks, drawing pencils. Each independent source was personally opened. Generated subjects have genuine RGBA alpha0–255; small high-resolution fringe specks on some source edges still require actual36–44px live pilot review. Do not call this source review final integration approval. Five generated candidates are matte simple objects; perspective remains modest illustrative end-face shading, not photographic. Flag generations with unwanted diffuse alpha halo were rejected and excluded from public shipping paths; authored flag is the clean fallback matching current Kart art.

Do not force six images into six live phones. Reuse a subject only where its purpose and an existing clear corner warrant it. Most of36 games intentionally have no ornament. On320 a missing clear corner means omit the asset, not shrink text or controls. Existing selected/disabled/held feedback, code-native arrows and action icons are unchanged. No new logo/font/button label.

## Review disposition

Director approved material direction for four pilots: sparse asphalt, restrained broad timber away from readouts, greenfelt with ivory contrast, readable ice and exclusion of accepted Curling drawer. First integration originals remain pending group09. Root remains final owner of whole-catalog captures/shared chrome. Creative work changed only this handoff and the new asset/provenance packet; no shared/game implementation, build, commit or publication.

Independent director source review: all36 mapping rows and all six candidate originals inspected. Geometry/omission strategy suitable. Poker chips, drawing pencils and authored flag are suitable pilot candidates. Stone/pins/wood clean-alpha approval is explicitly held: cyan handle-gap debris, white clusters between pins and yellow/red timber flecks include substantial near-transparent alpha1 at exact sampled handle/pin gaps; earlier broad alpha>=128 region measurements included true object edges and did not prove opaque debris. Actual36–44px live material proof must determine visibility; omit unused or use clean existing counterpart if visible. No extra generation loop requested. Group09/root notified; generated art is not claimed globally approved.

Director numeric correction: exact cyan handle-gap and white pin-gap samples are alpha1. Whole-source viewing exaggerates near-transparent RGB; broad regional alpha>=128 counts included actual object edges and do not establish opaque flecks. Do not regenerate on the earlier numeric interpretation. Silhouettes/materials suitable; actual36–44px live rendering remains the acceptance gate. Four group09 material pilots accepted with geometry unchanged and no cutouts forced into absent clear anchors; existing Curling stone/Jenga tower retained. All36 adapter enabled independently by group09; root canonical diagnostics pending.

Creative owner personally reopened all12 pilot originals in `output/playwright/ui-rework-2026-10-02/catalog-theme-pilots/` (four TV, four402 phones, four320 phones). Named visible deltas: Kart TV graphite/asphalt standings blend with track; current phone stays mostly incumbent because no safe passive anchor exists. Jenga TV warm timber status matches the real tower, current phone keeps authored support/tower art. Poker phone green betting/input backing supplies felt identity without a new panel and private cards retain strong contrast; initial TV pilot predates later accepted lowered table/casino backing correction, so it does not approve that newer source. Curling protects current stone/ice scene and unboxed status, no second ornament. No cutout was placed in these pilots, hence source alpha is not newly validated by them. Curling320 pilot's incumbent stone touches the helper line; group09/root notified as a current-original layout observation outside theme adapter geometry (which remained identical). This is not silently attributed to the theme or declared fixed. Root's current canonical capture remains the gate for all36/latest sources.
