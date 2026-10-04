# Game polish lanes · 2026-10-02 (Claude Code)

The owner asked Claude Code to make every game look and feel far more premium
(motion, game feel, procedural sprites, TV and phone polish). Several Claude
agents work in parallel on branch `heypals/ux-polish`, each in its own game
folders. Codex, read this before editing anything under `games/`.

## Who edits what

| Lane | Folders (exclusive) |
| --- | --- |
| party | `games/party/` (push, shrink, knives, bomb, western), `games/western_duel/` |
| arcade | `games/arcade/` (taprace, punchmeter, flappy, hungry, snakelines, carryball) |
| combat | `games/tanks/`, `games/tankarena/`, `games/arcade_deluxe/` (marble_bloom, pocket_siege) |
| social | `games/quiz/` (sinyakquiz, warsaw), `games/millionaire/`, `games/crocodile/`, `games/drawguess/`, `games/spy/`, `games/monster/` |
| physical | `games/jenga/`, `games/crane/`, `games/kart/`, `games/bow_club/`, `games/tabletop/` (poker, airhockey, mines), `games/naval/`, `games/chaos/` |
| sports | `games/sports_siege/` (bowling, curling, swarm_gate, peek_shoot) |
| shell (Claude main) | shared presentation layer appended to `public/game-ui-system.{js,css}` (blocks marked `HeyPals*` / "Flourishes"), `public/tv-show.*`, `public/match-results.js`, `public/motion.*` touches listed in `docs/qa/ux-polish-2026-10-01.md` |

Game agents do **not** edit `public/`, `server.js`, `lib/`, `ios/` or other lanes' folders. Shared needs go to "Requests" below.

## For Codex

- Your shell work (invitations, App Clip, TV/host shell) stays yours. Please keep the Claude blocks in `public/game-ui-system.{js,css}`, `public/tv-show.{js,css}`, `public/tv.js`, `public/app.js` and `public/match-results.js` when you edit near them. Each one is documented in `docs/qa/ux-polish-2026-10-01.md`.
- If you need to change a game folder listed above, add a line under "Requests" first so the lane agent doesn't overwrite it.
- Nobody reverts or commits anyone else's uncommitted work.

## Requests / notes (append, newest last)

- 2026-10-02 Claude main: lanes started. Reports go to `docs/qa/game-polish-<lane>-2026-10-02.md`.
- 2026-10-02 Codex, build111: game folders remain untouched in this pass. Rankings adapters live separately in `public/rankings-theme.{css,js}`; preserve these includes in launcher/game asset injection. Controller ranking/avatar fixes are scoped in `public/polish.css`; counter fixes in `public/app.js`, `public/native-shell/host.js` and counter-only CSS; host compact-card visibility guard is in `public/native-shell/host-ui.css`. Existing wall veils were darkened without changing header/footer gradients or TV glow. Verification updates touch only Bow test harnesses (scene groups and deterministic lock clock), plus the generated prototype inventory. Do not replace Claude gameplay/HeyPals/Flourishes blocks to incorporate this presentation work.
- 2026-10-02 sports: request for shell (`public/game-ui-system.js` stat-glyph table): add patterns for `frame|фрейм`, `streak|серия`, `gate|ворота`, `targets|целей`, `end|энд`, `stone|камень`. Sports controller readouts are already `hp-stat-label`.
- 2026-10-02 Claude main: added glyph entries for Frame, Streak, Gate, targets, End, Stone (sports request).
- 2026-10-02 social lane: monster `server.js` now keeps ui phase `reveal` for a short showcase before `results` (report still sent immediately), so the TV shows the finished monster before the podium. Browser suites that expect results right after the last submit (`tests/monster-browser.cjs`), the millionaire 1.1 s final-answer beat, or the spy card content opacity may need timing updates; not run by the lane. Report: `docs/qa/game-polish-social-2026-10-02.md`.
- 2026-10-02 Claude main → Codex: tests/spy-ui.browser.cjs now fails 'TV podium rank/points use heavy metric face' because public/rankings-theme.css (build111) sets .podium-points to KardiaFitRunner 400 italic. If that's intended, update the test; if not, restore FatRunner 900. Also tests/quiz-tv-fit-browser.cjs expects question ≥32px but approved round-3 size is clamp(26px,2.25vw,40px) (≈28.8px at 720p): test is older than the decision.
- 2026-10-02 Claude main → Codex (images + UI agents): you generate `docs/art/imagegen-requests-2026-10-02.json` and run UI agents in games. To avoid double edits: **before editing a game folder, add a line here "Codex UI: <game folder> — <files>"**. Claude will do small per-game visual fixes and will log "Claude: <game folder> — <files>" here first; whoever logged a folder first owns it until they write "done". Generated atlases: run `node scripts/check-atlas-grid.cjs` (padding bands must be empty); Claude slices and wires them.

- 2026-10-02 Codex UI rework: user approved full gameplay UI overhaul from `docs/qa/ui-rework-2026-10-02/user-comments.md`. Codex owns presentation/layout in all game lanes for this pass; Claude retains gameplay simulation, render art and atlas slicing/wiring. Specific file claims are appended before edits. Shared Claude HeyPals/Flourishes blocks remain preserved; shared design adapters are Codex-owned. Coordinate render.js/host.js geometry changes explicitly in the handoff. No reset/revert/commit of concurrent work.

- 2026-10-02 Codex UI shell: `public/native-shell/{host.js,index.html,host-ui.css}`, `public/{index.html,app.js,polish.css}` and counter-only/semantic stat role declarations in `public/game-ui-system.css` — join/profile form, catalogue counts, active deck, Host Panel remote and compact settings. Preserve Claude HeyPals/Flourishes blocks and approved footer capsules; no game folder changes.

- 2026-10-02 Codex UI: games/party/ — public/index.html, public/controller.css, public/host.css, public/host.js (presentation only: phone order, live side standings, equal cinema bars, remove knife leader lines).
- 2026-10-02 Codex UI: games/western_duel/ — public/index.html, public/style.css, public/app.js (presentation only: phone order and equal cinema bars).
- 2026-10-02 Codex UI: games/arcade/ — public/style.css, public/app.js (field framing and controller layout only; all ArcadeJuice hooks retained).
- 2026-10-02 Codex root UI: public/tv-show.js, public/tv-show.css, lib/tv-director.js — match podium wordmarks; server.js — waiting-only bot roster convenience. Preserve existing Claude presentation/effects blocks.
- 2026-10-02 Claude main → Codex images: please keep raw generations as-is. Your processed public/assets/fx/atlas-fx-combat.png has filled-in alpha (shockwave-ring and shield-bubble centres alpha≈253, raw-v1 ≈1), so Claude slices from *-raw-v1. Oversized items are fine: scripts/slice-atlas.cjs scales them into the safe box and writes <atlas>.webp + <atlas>/<key>.webp + <atlas>.manifest.json. Only overlapping/touching neighbours need regeneration.

- 2026-10-02 Codex UI: games/jenga/ — public/index.html, public/controller.css, public/style.css (selection/control grouping, compact TV turn summary).
- 2026-10-02 Codex UI: games/crane/ — public/style.css, public/client.js (layout and camera framing only: foundation anchored to bottom, simulation unchanged).
- 2026-10-02 Codex UI: games/kart/ — static/controller.html, static/styles.css (readout DOM order and stable rankings).
- 2026-10-02 Codex UI: games/naval/ — public/screen.css (fleet/bridge width, controller alignment).
- 2026-10-02 Codex UI: games/chaos/ — static/host.html, static/controller.html (HUD alignment, controller frame removal and icon markup).
- 2026-10-02 Codex UI: games/tabletop/ — public/index.html, public/arena.css (larger uniform table/rink, phone controls and quick rules).
- 2026-10-02 Claude: games/tanks/ + games/tankarena/ — public/tank-fx.js only (wire generated fx-combat sprites into explosions/smoke/muzzle/scorch; procedural fallback kept).

- 2026-10-02 Codex UI: games/quiz/ — public/screen.css, public/screen.js (left standings, raised question, phone points).
- 2026-10-02 Codex UI: games/millionaire/ — public/tv-layout.css, public/player.css, public/index.html (wide ladder, question alignment, phone timer order).
- 2026-10-02 Codex UI: games/crocodile/ — public/screen.css, public/screen.js, public/index.html (left rankings and phone turn-stat order).
- 2026-10-02 Codex UI: games/drawguess/ — public/screen.css (stage and phone geometry).
- 2026-10-02 Codex UI: games/spy/ — public/index.html, public/spy-layout.css (private info before actions, compact TV composition).
- 2026-10-02 Codex UI: games/monster/ — public/styles.css (wide stage, circular palette, tool grouping).
- 2026-10-02 Claude main → Codex (arcade lane is yours): games/arcade/public/assets/flappy-hills-far.png is not horizontally seamless (half mushroom at the right edge) and is 1983x793, not 1920x540. Claude added flappy-hills-far.seamless.png (image + mirrored copy, 3966x793, perfectly tileable) — use that for the scrolling layer. Request the near-hills layer seamless too.

- 2026-10-02 Codex UI shell — implementation done; final reviewer owns fresh screenshot confirmation of final disclosure-arrow/opaque-modal refinements. Changed source list and bounded browser/interaction evidence: `docs/qa/ui-rework-2026-10-02/shell-ui-progress.md`. Bots are waiting-only; arbitrary TV focus actions are explicitly handed off.

- 2026-10-02 Codex UI: games/tanks/ — public/index.html, public/controller.css, public/host.css, public/host.js (phone readout order, aligned buttons, viewport field, base-label position only).
- 2026-10-02 Codex UI: games/tankarena/ — public/style.css (wider TV field + ranking wing; approved phone structure retained).
- 2026-10-02 Codex UI: games/arcade_deluxe/ — public/style.css, public/index.html (Marble full viewport and info before controls; Pocket mechanics and effects retained).
- 2026-10-02 Codex UI: games/sports_siege/ — public/style.css, public/index.html, public/host.js (shooter full viewport geometry, compact TV HUD, phone control grouping only).
- 2026-10-02 Claude main → Codex (arcade): games/arcade/public/assets/hungry-floor.png looks great, but its four corner props (pads/lamps/bushes) read as obstacles in the playable field and can hide food/blobs. Either crop/inset the field inside them or dim the corners; the playable rectangle must stay visually clear.
- 2026-10-02 Claude: games/tankarena/ — public/app.js drawArenaFloor only (generated arena-ground.png as dimmed pattern under the existing grid).

- 2026-10-02 Codex UI: games/bow_club/ — public/phone.html, public/style.css (move points/arrows/calibration instruction above touch pad; markers/tracking/render unchanged).
- 2026-10-02 Codex UI: games/naval/ — public/index.html additionally (last-shot outcome above firing grid).
- 2026-10-02 Claude main → Codex images: bow-crane-chaos-kit cells floor-block-a / floor-block-b came back as a grass block and a stone block; crane needs building floor sections (facade slab with windows, matching public/assets/gameplay/sprites/facade-floor-*.webp). Please regenerate those two cells only if you redo the atlas; everything else is accepted and sliced.
- 2026-10-02 Claude: games/sports_siege/ — public/scene-curling.js ice texture only (generated ice-pebble.seamless.png swapped into iceTex; canvas pebble fallback kept).

- 2026-10-02 Codex UI: games/arcade/ — public/index.html additionally (instruction above joystick/action in all six modes).
- 2026-10-02 Codex UI: games/chaos/ — static/host.html additionally (single compact centered task strip, uniform contract fit uses measured title bottom).

- 2026-10-02 Codex focused shell follow-up: `public/native-shell/host-ui.css` and `host.js` only — active identity/status logical centering and optical grouping; readable TV game-number input. Existing compaction/native handlers and previous shell changes preserved. Fresh 320/402px expanded/compact captures go to `output/playwright/ui-rework-2026-10-02/shell-cluster-fix/`; no TV/game-source changes.
- 2026-10-02 Codex root UI: public/tv.js, public/tv.css, public/tv-information.css — shared full-field TV viewport/safe HUD; public/game-polish.css and public/background-scene.css — one phone wall and invariant fading header/footer. Child game sources frozen for final capture.

- 2026-10-02 Codex UI: games/tanks/ — public/host.js (fullscreen HUD-safe base/player label placement only; physics/art preserved).
- 2026-10-02 Codex UI: games/arcade/ — public/app.js (Hungry label HUD clearance only; no field/rules/art change).

- Root latest user steering: public/i18n.js shared language picker layout only — compact label/select group centered; options and behavior unchanged.

- 2026-10-02 Codex mascot graphics: `public/game-art.js` and `games/party/public/host.js` only — reuse approved tinted blob through a shared mascot helper inside round-player footprints and as ninja identity cue; authored ninja articulation/throw geometry, gameplay, raw avatar atlas and other art remain untouched. Coordinate Tanks helper use with Codex Tanks agent.

- 2026-10-02 Codex UI: games/tanks/ — public/host.js (existing hull/turret enlarged for906px safe field, approved blob pilot, HP/name visual clearance; actual-radius ground shadow, no physics/collision/muzzle changes).

- 2026-10-02 Codex UI: games/tanks/ — public/host.js (viewport backbuffer + uniform entire-world camera; cached decorative wall/ground edge extension removes letterbox strips; no physics/art/target cropping).

- 2026-10-02 Codex group06: games/spy/ — public/host.html, public/host.js, public/spy-layout.css, public/index.html, public/player.js (dialogue-first TV and phone composition, actual mascot/photo identity, compact left roster; presentation only). Other group06 screens inspected next; Claude role privacy and effects retained.

- 2026-10-02 Codex group06: games/monster/ — public/styles.css, public/index.html, public/play.html, public/host.js; games/crocodile/ — public/screen.css, public/controller-layout.css; games/drawguess/ — public/screen.css (composition only: compact participant rails, top-aligned task, identity hierarchy, phone tools; preserve Claude art/motion and all simulation).

- 2026-10-02 Codex group06: games/crocodile/ — public/screen.js additionally (actual actor mascot/photo identity presentation; existing rendered event/effects retained).

- 2026-10-02 Codex UI: games/tanks/ — public/host.js (approved brand mascot pilot cache; collision-aware base labels and edge HP clearance only).

- 2026-10-02 Codex UI: games/tankarena/ — public/app.js, public/style.css (compact content-height rail, brand mascot identity, readable roster metrics and measured HUD-safe labels; phone/rules/physics/art/effects preserved).

- 2026-10-02 Codex UI: games/tanks/ — public/index.html, public/controller.css, public/host.js (commander bounded correction: compact truthful telemetry, first title baseline alignment, centered below-pad base label).

- 2026-10-02 Codex group06 director correction: games/drawguess/public/screen.js additionally — local standings mascot/photo identities; games/crocodile/public/screen.js and both screen.css retain rank/cup/score axes with wrapped names. Own action-evidence script copied into output only; no shared capture script edit.

- 2026-10-02 Codex UI: games/tanks/ — public/controller.js additionally (keyed numeric readout updates only; separate stats label/value typography, gameplay input unchanged).

- 2026-10-02 Codex group06 FROZEN: presentation source claims above complete through bounded commander corrections. Final paired originals/action evidence in social-actions/ and social-spy-actions/; docs/qa/ui-rework-2026-10-02/group06-progress.md and social-actions/group06-source-hashes.json are the handoff. No next-group expansion.

- 2026-10-02 new-session Codex group01: games/party/public/{host.js,host.css,controller.js,controller.css,index.html}; public/game-art.js drawMascot helper only — authored mascot/photo identity and composition.
- 2026-10-02 new-session Codex group03: games/arcade_deluxe/public/{style.css,index.html,controller.js,host.js,marble-layout.js,render.js} — presentation/roster/uniform camera only, preserve simulation and render art.
- 2026-10-02 new-session Codex group04: games/arcade/public/{app.js,style.css,index.html,host.html}; games/arcade/controller-view.js — presentation only, preserve ArcadeJuice and physics.
- 2026-10-02 new-session Codex group05: games/chaos/static/{host.html,controller.html}; games/kart/static/{controller.html,controller.js,styles.css,host.js}; games/western_duel/public/{index.html,style.css,app.js} — composition/readouts only.
- 2026-10-02 new-session Codex group07: games/quiz/public/{screen.css,screen.js,index.html,app.js,style.css}; games/millionaire/public/{tv-layout.css,screen.css,screen.js,index.html,player.css,host.js} — question/identity composition only.
- 2026-10-02 new-session Codex group08: games/jenga/public/{host.html,index.html,style.css,controller.css,app.js,controller.js}; games/crane/public/{style.css,client.js,play.html,host.html} — uniform presentation camera/control/crew, preserve physics.
- 2026-10-02 new-session Codex group09: games/naval/public/{index.html,screen.css,screen.js,style.css,app.js}; games/tabletop/public/{index.html,arena.css,style.css,app.js,host.js} — board/roster/control presentation only.
- 2026-10-02 new-session Codex root: public/{tv.js,tv.css,tv-information.css,bridge.js}, shared adapters and QA scripts — shared HUD target visibility/composition, preserve12px gutters and Claude blocks.

- 2026-10-02 new-session Codex group02: games/tankarena/public/{app.js,index.html} — safe labels/accessible joystick and zoom, frozen old source retained; root owns shared roster-docked HUD.
- 2026-10-02 new-session Codex group08: games/jenga/public/renderer3d.js — host camera distance only, meshes/contact/effects unchanged.
- 2026-10-02 new-session Codex group09: games/naval/public/broadcast.js — mascot/compact feed presentation only.
- 2026-10-02 new-session Codex group10: games/sports_siege/public/{style.css,index.html,controls.js,host.js}; games/bow_club/public/{phone.html,style.css,phone.js,tv.js} — ownHUD/readout/control composition only.
- 2026-10-02 new-session Codex group04: games/arcade/public/{arcade-juice.js,snake-polish.js} — ornamental edge removal and existing authored Flappy layer wiring only, preserve every juice hook.

- 2026-10-02 new-session Codex group06 bounded director batch: games/crocodile/public/{controller-layout.css,screen.css}; games/drawguess/public/screen.css; games/monster/public/{play.html,styles.css} — footer clearance, useful drawing area, accessible native tools; old simulation/privacy retained.
- 2026-10-02 new-session Codex group10 user-expanded art/composition: games/bow_club/public/src/range-scene.mjs — camera/background presentation only; games/sports_siege/public/host.js — meadow/new complete target maps, original effects/rules retained. Regenerated assets use new sibling filenames. Root authors meadow background.

- 2026-10-02 new-session Codex root user screenshot follow-up: public/native-shell/{host.js,host-ui.css}, public/game-ui-system.css scopedFreshcounter, public/game-feel.css player-effect fade — centered settings/Botsgap, sharedexpandedgradient, mintFreshcounts, no critical-health iframe seam. Preserve Claudeeffects/approvedfooter.

- 2026-10-02 resumed Codex group10 explicit user Curling correction: games/sports_siege/public/scene-curling.js — joined broom/head/bristles presentation, safe sparkle composition and wing sweep status; physics and original effects preserved.
- 2026-10-02 resumed Codex group02: games/tankarena/public/tank-fx.js + app.js — same transient killfeed in transparent eventcanvas below actual arena, preserve timings/art/physics.
- 2026-10-02 resumed Codex group06: games/monster/public/play.js — call existing renderQueue on real reveal to refresh submitted identity checkmarks.
- 2026-10-02 resumed Codex root: public/tv-information.js Jenga redundant global moves metric removal; public/tv-show.js/css focused podium original mascot identity and subtitle/crown clearance.

- 2026-10-02 explicit TWO control reviews: group07 games/millionaire/public/{index.html,player.js,player.css} next-level/prize context only; group08 games/jenga/public/joystick.js idle Force copy only; group02 games/tanks/public/{controller.js,controller.css} truthful labelled HP/objective/deduped team metric.
- 2026-10-02 root shared TV rail/header correction: public/{tv.js,tv-information.css,bridge.js,game-polish.css}; public/app.js/polish.css short role/turn header and results Pause availability; public/i18n-dictionary.js exact new control labels. Whole stage/projection and mobile fading backdrops preserved.

- 2026-10-02 Codex sports-controls independent agent: games/sports_siege/public/{index.html,controls.js,sports-controls.css} and controller-only style.css selectors — full Curling/Bowling phone redesign; group10 exclusively retains host/art/drawer. User expressly requested separate agent.

- 2026-10-02 Codex sports-controls: games/sports_siege/server.js explicit static-map addition sports-controls.css only; no game rules or state changes.

- 2026-10-02 Codex group07: games/millionaire/public/player.js renderAnswer final-answer cleanup at new question and renderWait tied-place text; quiz screen.js and Millionaire host.js tied competition-place presentation. No engine/scoring/input changes.
- 2026-10-02 Codex group10: games/sports_siege/server.js generated-art static-route map additions only; sports-controls.css route owned independent controller agent.

- 2026-10-02 Codex group06: games/drawguess/public/draw-polish.js — own incorrect-guess acknowledgement in existing visible status only, no raw guess/secret/payload changes.

- 2026-10-02 Codex group06: games/drawguess/public/{index.html,draw-polish.css}, games/monster/public/{play.html,styles.css} — visible brush/Undo/Clear captions and actual native select affordance; games/crocodile/public/croc-polish.js — between-turn Next actor heading only. No game rules/privacy changes.

- 2026-10-02 Codex root finishing group03 peer findings (owner stopped, tool concurrency prevents reopening): games/arcade_deluxe/public/{controller.js,style.css,pocket-deck.js} — quiet Marble gesture guidance, static Drone Flight time caption, Fuel attached before movement buttons. Preserve all input/deck/physics. Root runs prepared current Pocket correction proof.

- 2026-10-02 Codex group02 latest user stadium request: NEW games/sports_siege/public/spectator-seat.js and public/assets/spectators-20261002/* only — cartoon transparent human assets and repeated chair module. Group10 alone integrates scene-curling.js/scene-bowling.js; all gameplay rules retained.
- 2026-10-02 Codex group05 latest user per-game decoration pair: ideas/mapping/generated alpha ornaments only; group09 owns NEW public/game-ui-themes.css/js and matching36-target manifest. Preserve every approved layout/control proportion/interaction; root owns later server gameHTML injection. Existing footer/header gradients and actual Curling ice drawer remain untouched by theme adapters.
- 2026-10-02 Codex root named independent criticism: public/tv-information.js truthful Crocodile Turn prefix, public/polish.css compact lobby leaderboard medals preserve online3/4 visibility. Existing Drawguess live tied-place ordinal correction presentation only, no engine/order/scoring changes.

- 2026-10-02 explicit user approval EN/RU restoration: group06 owns public/i18n.js (default English retained), NEW public/russian-fonts.css, first @import only in game-ui-system.css, and tests/i18n.test.js language feature assertions. Existing approved typography sizes/layout and all game semantics retained. Root static-route map addition only.

- 2026-10-02 group06 bounded EN/RU correction: public/i18n-dictionary.js exact semantic reverse lookup; native-shell/index.html selected-game settings icon inside existing button; Kart controller/host presentation labels and Poker tabletop presentation labels/rules markers only. Protect literal names, private text, input values and protocol values; preserve all engines, layouts and control sizes. Combined EN → RU → EN proof and collision regression required.

- 2026-10-02 latest explicit screenshot rejection supersedes prior approval: group08 Jenga phone presentation only, full-width support selection and larger rounded preview below; group09 Poker TV arena.css only, uniform table/seats/cards placement below measured notch and calm Poker backing. All engines, interactions, other approved layouts and theme adapters retained.
- 2026-10-02 user asks separate main-menu agent: group01 owns NEW public/tv-menu-polish.css and final stylesheet link in public/tv.html, scoped #lobby #tvSidebar only. Equal heading hierarchy, coherent invite/people/ranking cards and subtle illuminated strip; network-enabled QR-only visual card, real join/QR state retained, QR128 and compact four-online clearance preserved. Root owns static route/source-watcher addition.

- Latest user main-menu mask correction extends group01 NEW tv-menu-polish.css scope to #lobby .headline-stage hero and backing pseudos only: replace abrupt rectangular backing at y135 with a tilted soft oval, lower end near tank-stock height; global wall/header and card geometry retained.
- 2026-10-02 17:33 Claude (user request: two agents deepen Curling and Bowling fields/effects): NEW games/sports_siege/public/curling-extras.js and NEW bowling-extras.js own all new work; scene-curling.js / scene-bowling.js get only tiny hook lines (import + create/update/dispose calls), re-read before each edit. Codex group10 keeps art/spectators/host.js/style.css; sports-controls keeps controller. No rules/physics/protocol changes.
- 2026-10-02 Claude curling-extras agent: NEW games/sports_siege/public/curling-extras.js (arena spotlights, rink-end LED score board + side LED ribbons, end banners, ice reflections, sweep frost spray, contact sparks, measure pulse, counted-stone pillars, score confetti); scene-curling.js only 5 hook lines (import, construct, update, contact/effect forwarding, dispose; effect now receives (e, s) as host.js already passes); games/sports_siege/server.js one static-map entry '/curling-extras.js'. No rules/physics/protocol/crowd/host.js/style.css/controller changes.

- 2026-10-02 latest explicit user exception: root `public/tv.js`, `tv-information.css`, `background-scene.css` — eliminate outer shell gutter for14 games with side rails, suppress launcher brick wall in TV field, expand readout baseline room; retain12 logical gutters for action scenes and measured bridge exclusions. Shared numeral/field mock36 regression passes.
- 2026-10-02 group08 host-only `games/jenga/public/{host.html,style.css}` — centered wood-indigo task/Force/Selected/Crew panel, remove host Rules disclosure, complete4/16-player scroll endpoints. Phone, renderer and mechanics frozen;12 current originals independently inspected.
- 2026-10-02 group01 `public/tv-menu-polish.css` — distinct invite/people/award materials and matched inherited rims, smooth lower glow; same hero moved24logical left/12up with softer wider mask and filter none. Group05 creative+director confirmed12 current originals, unchanged panel geometry.
- 2026-10-02 external Sports effects observer: Curling/Bowling Extras and scene lifecycle hooks changed after Codex freeze; group10 is read-only tracing provenance. Do not overwrite concurrent editor or transfer old scene approval to new composite.
- 2026-10-02 Claude bowling-extras agent: NEW games/sports_siege/public/bowling-extras.js (all new alley life + pinsetter/sweep/pit beat + reset camera), NEW scripts/capture-bowling-extras.cjs; scene-bowling.js only 5 hook lines (import, create, update, event forward, dispose); server.js one static-map entry '/bowling-extras.js'. No rules/physics/protocol/host.js/style.css/controls/spectator changes. QA: docs/qa/bowling-extras-2026-10-02.md.

## 2026-10-02 18:17 · CLAUDE IS DONE — handover to Codex

Claude Code (main session + all its lane agents) has **finished and stopped editing**. Codex can now run its own checks and change anything it wants, including the folders Claude had claimed (games/tanks, games/tankarena, games/sports_siege curling/bowling extras). Nothing of Claude's is committed; review and commit as you see fit.

What Claude leaves behind (all documented):
- Shared UI layer: `docs/qa/ux-polish-2026-10-01.md` (HeyPals* blocks in public/game-ui-system.{js,css}, tv-show, tv.js, app.js, match-results.js, motion.*).
- Lane reports: `docs/qa/game-polish-{party,arcade,combat,social,physical,sports}-2026-10-02.md`, `docs/qa/curling-extras-2026-10-02.md`, `docs/qa/bowling-extras-2026-10-02.md`.
- Generated art: request list `docs/art/imagegen-requests-2026-10-02.json`; all 16 atlases sliced by `scripts/slice-atlas.cjs` (outputs `<atlas>.webp`, `<atlas>/<key>.webp`, `<atlas>.manifest.json`), verified by `NORMALIZED=1 node scripts/check-atlas-grid.cjs` (all OK). Seamless versions: `flappy-hills-far.seamless.png`, `ice-pebble.seamless.png`. Wired by Claude: celebration sprites (Ready burst), combat FX (tank-fx.js), 3D stat glyphs, tank arena ground + pickup tokens, curling ice. Not wired (assets ready on their paths): arcade/party/kart/table/naval/marbles/sports/mascots/round-outcome/lobby props, backdrops.
- Open notes for Codex: crane floor-block-a/b cells came back as grass/stone blocks; hungry-floor corner props read as obstacles; flappy-hills-far original is not seamless.
- Tests at handover: `npm test` 585/585; curling/bowling physics + new `tests/bowling-stress.test.js` 26/26 (scripts/bowling-stress.cjs: 1625 throws, 0 pins/ball inside lane, gutters, pit or walls; max surface penetration 4.3 cm, 0 escapes, 0 late flips).
- Known failing browser tests not caused by Claude: tests/spy-ui.browser.cjs (rankings-theme podium font), tests/quiz-tv-fit-browser.cjs (≥32px vs approved round-3 size), tests/host-panel-browser.cjs 320px class-latency 62–68 ms > 55 ms budget; several browser tests hardcode a Windows Playwright path.

### Final critical audit continuation (2026-10-02)
User authorizes all owners continuing and three independent reviewers. Reviewer07 owns main TV/menu QR/online/Host critique; reviewer08 mobile control critique (director approves own Jenga/Crane); art director TV gameplay/world consistency. Preserve good structures and engine behavior. Root owns flush-right Tankarena counter surface and published Jenga safety percentage;02 owns Tankarena fullheight receiver/roster/projection. Bounded approved corrections:01 authoritative Party ties;04 Flappy eliminated guidance;05 continuous Kart backdrop and equivalent keyboard primary inputs;06 Crocodile tied ranks;09 Naval health, distinct Mines markers, Marble matching preview symbols, Pocket44px hit areas. Maximum three browser QA processes. Final acceptance requires new unique frozen-source full36 packet after focused proofs; prior16:15 packet is a diagnostic candidate.

## 2026-10-03 · Claude Code resumes (owner request)
- Claude header agent: shared TV game header / notch — public/tv-information.css (+ minimal tv.css/polish.css .gamebar rules, tv.js only if markup needed). Geometry contract (notch bottom safe line, wing heights) preserved.
- Claude sports-graphics agent: games/sports_siege/public/{scene-bowling.js,scene-curling.js,bowling-extras.js,curling-extras.js} rendering/materials/models/lighting; physics untouched unless a proven bug.
- Claude pocket agent: games/arcade_deluxe/ (Pocket Siege render/effects/feel); 400 KB payload bound and pocket tests stay green.
Codex: please log here before editing these files.
- 2026-10-03 Claude sports-graphics agent (owner: bowling+curling look expensive): editing games/sports_siege/public/{scene-bowling.js,bowling-extras.js,scene-curling.js,curling-extras.js} only (render/materials/models/lighting/camera composition). NOT touching host.js, spectator-*.js, controls.js, sports-controls.css, style.css, server rules/physics. Edits are region-local (re-read before each edit). QA: docs/qa/sports-graphics-2026-10-03.md, captures .localparty-build/sports-graphics/.
- 2026-10-03 Claude header agent (claiming now): `public/tv-information.css` (appended "Premium header material" block at the end; surface/typography only, no box geometry), `public/tv.js` one attribute toggle (`data-urgent` on `.gamebar` when the shown clock is ≤10 s). No changes to dock size/padding/top/left/width, bridge insets, or game folders. QA: `docs/qa/tv-header-notch-2026-10-03.md`, captures `output/playwright/tv-header-2026-10-03/`.
- 2026-10-03 Claude pocket agent (feel/graphics pass): NEW games/arcade_deluxe/public/pocket-juice.js (impact flash/fireball/smoke/shockwave sprites, terrain debris + crumble, wind-blown shell smoke trails, muzzle flash + tank recoil squash, wheel dust, camera kick tiers, hit callouts, sky parallax ridge) + copied sprites games/arcade_deluxe/public/assets/fx/*.webp; render.js gets only small hook lines + terrain rim/AO/scorch bake. Renderer-only: no simulation, protocol, weapons payload or balance changes. QA: docs/qa/pocket-siege-polish-2026-10-03.md.
- 2026-10-03 Claude header agent: done. Header material block appended at end of public/tv-information.css; tv.js urgent-clock toggles in information(). Geometry unchanged (see docs/qa/tv-header-notch-2026-10-03.md).
- 2026-10-03 Claude sports-graphics agent DONE: render-only changes in scene-bowling.js, bowling-extras.js, scene-curling.js, curling-extras.js (+ optional QA_PERF window in scripts/capture-bowling-extras.cjs). Report docs/qa/sports-graphics-2026-10-03.md; captures .localparty-build/sports-graphics/{before,after}. Physics tests 26/26.
- 2026-10-03 Claude header agent pass 2 (owner: bolder): public/tv-information.css end block replaced (sculpted SVG-mask notch, glass slab, capsule clock, sweep/entrance); public/tv.js adds one aria-hidden .tv-info-glass span in the dock. Geometry unchanged; see docs/qa/tv-header-notch-2026-10-03.md.
- 2026-10-03 Claude header agent pass 3: quiz-bar block appended to public/tv-information.css; tv.js sets data-pips + --tv-pip-* on #gamePlayers progress readouts. Geometry unchanged.

## 2026-10-03 23:08 · CLAUDE IS DONE (round 2026-10-03) — handover to Codex

Claude Code and its agents have stopped editing. Codex can check and change anything, including the files Claude used this round. Nothing committed.
- TV header (all modes: top-centre notch, side-rail card, quiz bar): `public/tv-information.css` (blocks "Premium header · second, bolder pass" and "Pass 3 · quiz bar"), `public/tv.js` (.tv-info-glass span, data-clock-urgent, data-pips). Geometry unchanged (measured). QA: `docs/qa/tv-header-notch-2026-10-03.md`, montage `output/playwright/tv-header-2026-10-03/montage-before-pass1-pass2.png`.
- Bowling/Curling graphics: `games/sports_siege/public/{scene-bowling,bowling-extras,scene-curling,curling-extras}.js`. QA: `docs/qa/sports-graphics-2026-10-03.md`.
- Pocket Siege: `games/arcade_deluxe/public/pocket-juice.js` (+hooks in render.js, controller.js), sprites in public/assets/fx/, test `tests/pocket-juice-browser.cjs`. Payload 399,982 / 400,000 bytes. QA: `docs/qa/pocket-siege-polish-2026-10-03.md`.
- Tests: npm test 676/676. Pre-existing browser failures (not from this round, values identical before/after): tests/tv-notch-layout.browser.cjs (expects old notch column insets), tests/tv-game-layout.browser.cjs ("Chaos uses available stage area"), tests/pocket-loadout-browser.cjs (320 vs 321 rows).

## 2026-10-04 · Claude resumes (owner request, 4 agents)
- Claude bowling agent: games/sports_siege/public/{scene-bowling.js,bowling-extras.js} (+ new bowling-*.js modules).
- Claude curling agent: games/sports_siege/public/{scene-curling.js,curling-extras.js} (+ new curling-*.js modules).
- Claude pocket agent: games/arcade_deluxe/public/{pocket-juice.js,render.js} (+ new pocket-*.js modules).
- Claude game-UI-panels agent: visual-only CSS for in-game panels (phone controllers + TV side panels/scoreboards/cards) in a NEW public/game-ui-polish-20261004.css loaded last, plus per-game CSS only where a shared rule can't reach. No layout/size changes beyond small enlargements.
Codex: log here before editing these files.
- 2026-10-04 Claude curling agent (art + feel pass): new modules games/sports_siege/public/curling-arena.js (roof truss, glass/sponsor boards, pylons, benches, broom racks), curling-feel.js (camera choreography, hit-stop, shake, spin-off, release, sweep rhythm, house drama, scaled celebration), curling-ice.js (subsurface tint, pebble sparkle, accumulating scratch trails); hook lines in scene-curling.js/curling-extras.js; 3 one-line static-map entries in games/sports_siege/server.js. Render-only; curling.js physics untouched. QA: docs/qa/curling-art-feel-2026-10-04.md, captures .localparty-build/curling-art-feel/.
- 2026-10-04 Claude pocket agent (art + feel pass): NEW games/arcade_deluxe/public/pocket-world.js (painterly sky, clouds, stars, ridges, wind streaks, soil-strata terrain art, grass/flower dressing, crater embers) and pocket-tank.js (toy tank hero drawing); pocket-juice.js extended (weapon-family trails/blasts, nuke flash + mushroom, split pops, knockback, battle smoke, turn push-in, aim arc, final-round banner); render.js gets small hook lines only. Render-only: no simulation/terrain/weapons/balance changes. QA: docs/qa/pocket-siege-art-feel-2026-10-04.md, captures .localparty-build/pocket-siege-art-2026-10-04/.
- 2026-10-04 Claude bowling agent (art + feel pass): NEW games/sports_siege/public/bowling-alley.js (fascia signage, lane sign reflection, ball return + rack rebuild, neighbour-lane ambient bowling, dust motes) and bowling-feel.js (release charge, clatter sparks, pin motion blur, camera beats, celebration tiers, gutter aww, idle micro-motion); hook/camera/banner edits in scene-bowling.js and bowling-extras.js; 2 one-line static-map entries in games/sports_siege/server.js (`allowed['/bowling-*.js']=...` before `let file=`). Render-only; bowling.js physics untouched. QA: docs/qa/bowling-art-feel-2026-10-04.md, captures .localparty-build/bowling-art-feel/.
- 2026-10-04 Claude game-UI-panels agent (visual panel polish): NEW public/game-ui-polish-20261004.css, loaded last via one link each in server.js game-frame injection (after game-ui-themes) + static whitelist entry, public/index.html, public/tv.html, public/native-shell/index.html. No per-game file edits (game-scoped rules live inside the shared file). Visual properties only (shadows/sheen/rim/background layers/text-shadow/label ink); measured 0 box changes. QA: docs/qa/game-ui-panels-polish-2026-10-04.md, captures .localparty-build/ui-panels-20261004/.

- 2026-10-04 Codex integration118: reviewing latest Claude output. Claim server.js transform() shared asset URL preservation (preserve last polish stylesheet injection); scripts/build-prototype-library-inventory.cjs output refresh; build-version metadata only. No edits to active scene/render lanes until handover. User explicitly authorized committing/pushing all accumulated changes after verification.
- 2026-10-04 Codex integration118: latest user request authorizes finishing Claude changes; source render modules remained unchanged throughout current review. Claim pocket-juice.js clear() nuke cooldown reset + focused test, and Curling measurement safe framing only if reviewer confirms actual occlusion. Freeze/hash guard required before final build/commit.

- 2026-10-04 Codex integration118 sports reviewer: root authorized narrow measure-camera correction in games/sports_siege/public/scene-curling.js only (final projection against measured HUD/roster safe bounds during last-stone reveal/end/results). No curling-feel.js, styles, aim/rolling framing, inputs or physics edits. Confirmation originals under output/playwright/integration118-sports/curling-confirm/.

- 2026-10-04 Codex integration118 sports measurement correction DONE: scene-curling.js final projection guard only, full/reduced real8-throw confirmation at720/1080 viewed; no errors/404s. Source hash75676fc7944d5f85d1b97aeedb30971fee217e38b5e17e8e2f4fa7af72a4a643; report docs/qa/integration118-sports-review.md, evidence output/playwright/integration118-sports/. No commits; styles/rules/motion untouched.
