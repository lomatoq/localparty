# Group 10 — Sports and target games

Status: prepared queue packet; not dispatched or completed by this file. Role: implement a real design overhaul for this group, preserve working behavior and concurrent Claude assets. User authorized implementation, no additional confirmation needed for routine reversible changes. No subagents are assigned by this packet; root manages the runtime's four-agent cap.

Exclusive folder ownership: `games/sports_siege/`, `games/bow_club/`. Presentation target files (relative to a single folder unless already game-prefixed):

- `games/sports_siege/public/style.css`
- `games/sports_siege/public/index.html`
- `games/sports_siege/public/controls.js`
- `games/sports_siege/public/host.js`
- `games/bow_club/public/phone.html`
- `games/bow_club/public/style.css`
- `games/bow_club/public/phone.js`
- `games/bow_club/public/tv.js`

## Required authored change

Sports retain authored lane/gallery/wall scenes and use one own HUD only. Compact useful HUD readouts, aligned bottom scoreboard rows without long text. Bowling/Curling phone task, aim/spin/sliders and release/sweep form coherent aligned group; state above input. Swarm and Peek full stage and compact HUD, phone stats above touchpad/Fire with meaningful illustrated icons. Bow keeps QR marker/tracking geometry and actual aiming behavior; improve task/status/input hierarchy instead of treating tracking plane as decoration.

## Mandatory first reads and skill workflow

Read these actual files, not memory or a summary, and tell the user briefly which relevant skills you apply:

- `/Users/hlebhlyaba/.codex/skills/impeccable/SKILL.md`; run its context loader once in the repo, then relevant layout/adapt/shape reference; read `/Users/hlebhlyaba/.codex/skills/impeccable/reference/craft-floor.md` immediately before UI edits.
- `/Users/hlebhlyaba/.codex/skills/mobile-native/SKILL.md` and `/Users/hlebhlyaba/.codex/skills/emil-design-eng/SKILL.md`; apply mobile native touch/safe-area/fading chrome and state/gesture interruption requirements. Existing brand and user brief outrank generic skill taste.
- `/Users/hlebhlyaba/.codex/skills/playwright/SKILL.md`; use its prescribed browser workflow and the existing real-engine capture harness where applicable. Do not invent a new test framework. Do not overwrite other agents' capture outputs.
- `/Users/hlebhlyaba/HeyPals/localparty/AGENTS.md`, `docs/agents/game-polish-lanes.md`, `docs/qa/design-contract-2026.md`, `docs/qa/ui-regression-rules.md`, `docs/qa/ui-rework-2026-10-02/user-comments.md` and `commander-findings.md` beside this directory. Current user scope overrides PRODUCT.md's old rankings-only scope.

## Boundary and authoring rules

Work in `/Users/hlebhlyaba/HeyPals/localparty`, branch `heypals/ux-polish`. Dirty concurrent Claude work is authoritative incumbent work to preserve. Append exact claim to lane Requests before edits. Stay inside your folders and presentation-only targets. Root owns all shared `public/`, `server.js`, `lib/`, `ios/`, atlas slicing/wiring and common geometry. Do not change those or any other group, reset/revert/commit anyone's changes, edit physics/scoring/server/protocol rules, or rename the game. Hand shared needs to root with exact cause and proposal. Claude owns gameplay/render art; coordinate a presentation render/camera adjustment before editing that path.

Root's current TV geometry: full viewport scene with 12 logical pixel outer gutters, common notch/HUD overlays scene; bridge publishes measured HUD bounds for safe labels/content. The rejected whole-notch 174px viewport reservation is obsolete. Do not reintroduce it locally. Use uniform projection; no stretched circles/sprites, clipped targets or decorative/collider/debug annotations. Fixed-aspect worlds may have intentionally blocked ground bands, but no unrelated violet side gutters or false playable terrain.

Design visibly: hierarchy and composition must change on every rejected screen. DOM/content grouping and authored art matter; generic CSS font/padding patches retaining rejected topology are incomplete. Keep violet/lime, supplied logos/fonts, actual authored assets and approved Pause/Lobby capsules. All useful phone state/statistics above controls. Equal outside margins and aligned control icon/title/help tracks. No giant empty panel, redundant generic GAME heading or second HUD. Top/bottom mobile underlays fade to transparent including native Controller route.

## Brand assets verified separately

The new Claude derivatives `/public/assets/avatars/atlas-mascots/mascot-01.webp` through `mascot-16.webp` and `atlas-mascots.manifest.json` were independently visually inspected: all 16 complete contours, consistent manifest sizes/within-cell frames, no visible neighbour bleed. They are available for integration, not evidence of screen integration. Use stable identity seed for bot/no-photo identity; keep real uploaded photos. Preserve aspect ratio/transparency. The white wide-mouth PartyArt blob is a different creature and does not satisfy the brand mascot request. Assets inside game folders supplied by Claude remain preserved; do not reslice atlas or replace raw files.

## Required before/after and verification packet

Inspect fresh original 1920×1080 TV and standard 402×874 phone captures before changing code. `output/playwright/ui-rework-2026-10-02/final-games/` is stale baseline only; do not approve it or compare only terminal metrics. `notch-gap/` is the explicitly rejected geometry snapshot, useful anti-reference only. Observe actual app/embedded game states and real engine, no injected hand-authored state or score. Capture default 4 and 2/16 players where allowed by catalog/mechanics; record explicit N/A where not allowed. Use long Latin/Cyrillic names, zero/large stats and the listed gameplay states.

Own output: `output/playwright/ui-rework-2026-10-02/group-10/round1/` and `round2/`; own report `docs/qa/ui-rework-2026-10-02/group-10-progress.md`; own optional capture script `scripts/qa/group10-real-shots.cjs`. Reference existing `scripts/qa/capture-root-games-round3.cjs` and the running root capture setup; never stop someone else's server. Record source hashes, capture times, state, viewport, language/player count and PNG paths.

Build fully; inspect all own original images in one batched round, fix observed defects together; confirm with at most one more round. Run relevant meaningful gameplay/layout checks and the Impeccable detector once at end as its skill directs. DOM geometry and green tests do not replace image inspection. Send packet to root and independent art director with exact files, each game before/after visible delta, test evidence, limitations and unresolved blockers. Automatic/browser/physical evidence separate; do not claim device validation from screenshots. Art director will return bounded named corrections. Do not mark complete before all rows addressed.

## Exact game acceptance rows

Every row remains pending until fresh original-image inspection.

| Group | Game | Baseline evidence | Required visible delta | Additional states |
|---|---|---|---|---|
| 10 sports | bow_club | TV target world and corner codes; phone map sparse/flat | Authored aim scene/control hierarchy, all state above input; utility content compact and relevant; no invasive new header | draw/release/arrow count/handedness |
| 10 sports | curling | Full authored lane; common extra logo/own HUD; controls dense | Own-HUD only, aligned scorecards, comfortable phone sliders/sweep composition, state above controls | aim/release/sweep/team/end |
| 10 sports | bowling | Full authored lanes; duplicate common/own bar; phone widths mixed | One own-HUD, aligned player cards; coherent position/spin/throw task grouping | aim/release/spin/strike/frame |
| 10 sports | swarm_gate | Full authored wall and creatures, own HUD; phone dense | Full width no extra frame; compact useful top, phone wave/gate/heat state above aim/fire and valid illustrated utility icons | overheat/pulse/wave/damage |
| 10 sports | peek_shoot | Authored gallery and creatures; large own HUD; phone large boxed touchpad | Compact useful own header; gallery fully staged; redesign phone task/aim/Fire grouping with stats above and no redundancy | target/white prohibited/fire/streak |
