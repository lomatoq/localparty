# Semantic game feedback · 2026-10-06

Scope: presentation only, shared `public/game-feel.js`, `game-feel-state.js`, `game-feel.css`. No simulation, collision, scoring, assets, camera or hit-stop changes. This is **not a claim of 36 newly authored game-specific animations**: all36 share the feedback contract; the table distinguishes existing native vocabulary from changes in this shared pass.

## New shared visual vocabulary

- Anchored hit/collision: small open impact slash,210ms. Replaces a generic circular particle burst. Authoritative renderers keep their own contact effects.
- Anchored score: lime `+` medallion settles toward its counter,400ms. No unanchored centre burst. Snapshot gains only render the mark when a real HUD target exists; existing explicit `visual:false` remains HUD-only.
- Elimination: warm yellow/violet KO stamp,500ms; bounded narrow fragments. Only an actual `elimination` event produces KO. No guessed kills from damage values.
- Round-result: a compact star beat,400ms, replacing the shared full-screen flash; no new winner assertion or results overlay. Existing native results/podium owners remain untouched.
- Turn-ready: play symbol at the player's actual turn label. Requires a changed public turnId/turnToken and local player ownership; no initial/reconnect playback or guessed turn from button enablement.
- Recovery: small return symbol for observed dead→alive state, HUD-only. It neither shortens the respawn nor reveals private state.
- Reduced motion: no particles, camera/transform accents or layered badge; short static HUD outline where a real target exists. Existing game text remains authoritative.

These are event feedback accents, not navigation delays. Longest500ms stamp includes its visible hold and exit; it never blocks input. Frequent impacts coalesce rather than repeatedly restarting the animation.

## Ownership and all36 coverage

Paths are repository-relative. “Shared” describes eligible existing hooks, not a guarantee that every listed event is emitted on both TV and phone. Existing `visual:false` / `particles:false` callers retain that authority.

| Game | Native owner and vocabulary retained | Shared contribution / limit |
|---|---|---|
| push | party/public/host.js: collisions, rim-out; current Push-specific KO presentation | Existing hit/out-of-bounds/controller elimination hooks; no second native TV KO layer added |
| shrink | party/public/host.js: shrinking field, ring contact, elimination | Personal elimination edge uses KO; native field rendering unchanged |
| knives | party/public/host.js: reliable knife-hit, throw/contact | Shared hit slash; score anchored to roundScore |
| bomb | party/public/host.js + controller.js: pass, fuse, explode | Existing explosion particles; controller actual explosion→KO; no fuse simulation |
| western | party/public/host.js: DRAW, recoil, authored falls | False-start elimination feedback; wins counter accent; no shot timing changes |
| tanks | tanks/public: muzzle, recoil, death and CTF | Health edge/hit, score/flag feedback; native visual:false deaths unchanged |
| tankarena | tankarena/public/app.js: weapons, death, score | Real score HUD +; native visual:false elimination retained |
| chaos | chaos/public/host.html: pickup, checkpoint, clear ripple | Existing score/round hooks inherit shared vocabulary; native particles untouched |
| kart | kart/static/host.js: lap, boost, overtake, skid/impact pools | Existing visual:false lap/impact remains native; finish beat where emitted |
| monster | monster/public/host.js: turn completion, progressive drawing unveil | Existing native creation reveal retained; no synthetic KO |
| spy | spy/public/spy-polish.js: ready, vote and role/results reveal | Shared timer warning remains; no new role/reveal event guessed |
| millionaire | millionaire/public: suspense, answer settle, money count-up | Public awarded money counter; suspense/native reveals unchanged |
| sinyakquiz | quiz/public/quiz-polish.js: question/reveal, correct gain, scoreboard | Actual reveal reward HUD; no secret answer inspection |
| warsaw | quiz/public/quiz-polish.js: same quiz semantic lane | Actual reveal reward HUD; no secret answer inspection |
| crocodile | crocodile/public/croc-polish.js: actor handoff, guessed chip, word flip | Existing score hooks retained; no private word visibility changes |
| jenga | jenga/public/renderer3d.js: dust, placed-block ring, collapse | New token-based local turn-ready at #turn; collapse owner retained |
| crane | crane/public/client.js: landing squash, perfect placement, impacts | Lost-life hit, existing score cues; no guessed precision threshold |
| naval | naval/public/broadcast.js: projectile arc, hit/miss rings/fragments | Personal damage slash/critical edge; native shot/miss retained |
| drawguess | drawguess/public/draw-polish.js: artist handoff, correct answer, reveal | Award counter only; no private answer inspection |
| western_duel | western_duel/public/app.js: anticipation, recoil, reaction plate | Existing score/danger visual:false preserved; no timing change |
| taprace | arcade/public/app.js: motion, leader change | Existing leader-change score becomes small local +; no effect every tap |
| punchmeter | arcade/public/arcade-juice.js: tier impact, bag recoil, rings | Existing hit becomes slash; native bag effect stays owner |
| flappy | arcade/public/arcade-juice.js: flap puff, feathers on loss | Native loss collision becomes slash; personal elimination KO |
| hungry | arcade/public/arcade-juice.js + app.js: food absorb, CHOMP | Real renderer dead edge→KO; mass gain local +; HUD-only recovery when anchor exists |
| snakelines | arcade/public/arcade-juice.js: trail, crash, winner burst | Native crash collision slash; personal elimination KO |
| carryball | arcade/public/arcade-juice.js: goal banner,40-particle native goal | Existing particles:false snapshot goal remains; native goal/pass hooks retained |
| marble_bloom | arcade_deluxe/public/render.js: marble pop, petals, combo/score | Snapshot visual:false remains; no second combo shower |
| pocket_siege | arcade_deluxe/public/pocket-juice.js: muzzle, blast, intercept, near miss, turn | Native bounded pools/callouts retained; no generic hit-stop or blast added |
| bow_club | bow_club/public/tv.js: hit rings, score labels, bullseye rays | Existing awarded score HUD; no guessed bullseye threshold |
| poker | tabletop/public/app.js: chip courier, dealing/showdown | Existing chips score HUD; no betting/turn semantics guessed without token |
| airhockey | tabletop/public/app.js: puck trail, contact sparks, goal rings | Existing goal API remains; no added per-frame geometry |
| mines | tabletop/public/fx.js + app.js: safe opens, sprite explosions | Existing visual:false safe score remains actor-specific |
| curling | sports_siege/public/curling-feel.js: launch/contact/measure | New public token own-turn symbol at #ss-turn; native stone effects retained |
| bowling | sports_siege/public/bowling-feel.js: release, streaks, pin clatter, gutter | New public token own-turn symbol at #ss-turn; native pin effects retained |
| swarm_gate | sports_siege/public/swarm-fx.js: turret/impact/gate/wave effects | Existing shared shot/explosion/score event hooks, native owners retained |
| peek_shoot | sports_siege/public/host.js and controls.js: hit/miss/kill | Existing authoritative event ID→hit/KO; no targeting or damage change |

## Audit findings / next breadth opportunities

1. Existing native vocabulary is much richer than the original shared taxonomy. Kart already has boost/overtake/lap; Pocket already has intercept/near miss; Crane already has perfect landing; social games already have correct-answer and role reveals. Adding a universal KO shower would duplicate them. This pass changes shared accents only and respects explicit native visual ownership flags.
2. The meaningful missing shared cue is a public-token handoff to the local player. Implemented only where the public state proves a new turn; reconnect establishes a silent baseline. Other handoffs need an authoritative identity before expansion.
3. Shared temporaryClass previously forced offsetWidth for every retrigger. It now coalesces an active accent, with no layout flush. Snapshot feedback resolves element geometry once before writes, never in a new per-frame loop.
4. Lifecycle previously left removal timers and already queued observer microtasks alive after reset. Tracked timers plus a generation guard now retire them, including detached targets and BFCache pagehide. Stealing a capped overlay also cancels its removal timer.
5. Native overlap remains a review item, not justification to delete authored art: Arcade has both drawFeedback and ArcadeJuice; Sports invokes view.effect before shared feel. Any future engine additions should declare their native owner and opt out of duplicate generic particles.

## Budgets and event contract

Layer cap16 instances; particle cap48 DOM particles; duplicate ID window128; cooldown key window64;160ms per type/actor. Oldest optional layer is stolen at cap, with its timer cancelled. No new RAF. Shape movement uses transform/opacity. Data/scoring classes remain unmodified. Short class accents have one live timer each and are cleared on reset, phase retirement, hidden document, pagehide and reduced-motion activation. Snapshot microtasks carry a scene generation and cannot recreate effects after teardown.

## Verification

`node --test tests/semantic-feel133.test.cjs tests/game-feel-state.test.js tests/game-feel.test.js`:25 tests. Includes catalog36 membership, immutable snapshots, genuine dead/alive edges, public token handoff/repeated own turn, spectator gating, initial join/reconnect baseline, existing goal/critical-score invariants.

`tests/browser/semantic-feel133.cjs`: Chrome and WebKit. Live runtime caps/duplicate/reset/pagehide/microtask/calm reduced checks and immutable game state. Named injected event captures over a real Hungry canvas are explicitly **presentation fixtures**, not fabricated gameplay proof. Additional `*-hungry-real-ko.png` follows a controlled valid initial overlap resolved by the unchanged Arcade simulation; the real app.js render event hook emits KO using its arcade event ID. Videos accompany each engine. Captures: `output/playwright/semantic-feel133/`. This is not a36-game visual acceptance matrix or physical iPhone/AirPlay certification.

## References used

Local animate skill: transform/opacity, coalescing rapid feedback, calm reduced-motion fallback. External [Juice/VFX event contract](https://github.com/jammyfu/open-game-skills/blob/main/skills/disciplines/juice-vfx/SKILL.md): authoritative identity/anchor, bounded lifetime, stacking/cleanup and unchanged simulation trace. Requested YouTube reference could not be fetched by the browsing tool; no claim of watching it.
