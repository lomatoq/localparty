# Group 07 — Quiz family

Status: prepared queue packet; not dispatched or completed by this file. Role: implement a real design overhaul for this group, preserve working behavior and concurrent Claude assets. User authorized implementation, no additional confirmation needed for routine reversible changes. No subagents are assigned by this packet; root manages the runtime's four-agent cap.

Exclusive folder ownership: `games/quiz/`, `games/millionaire/`. Presentation target files (relative to a single folder unless already game-prefixed):

- `games/quiz/public/screen.css`
- `games/quiz/public/screen.js`
- `games/quiz/public/index.html`
- `games/quiz/public/style.css`
- `games/millionaire/public/tv-layout.css`
- `games/millionaire/public/player.css`
- `games/millionaire/public/index.html`
- `games/millionaire/public/screen.css`
- `games/millionaire/public/screen.js`

## Required authored change

Do a real question composition, not enlarged existing empty leaderboards. Shared quiz has compact left player rail and question higher/dominant right with usable measure and answer grid. Distinct place/name/score role axes; real identity images. Phone Points large with clear top hierarchy, consistent answer card width/spacing. Millionaire progression ladder genuinely wider left with authored progression markers; question higher and clear, no tiny disconnected progress blocks. Preserve question copy, answers, turn/scoring/timer logic and reveal motion.

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

Own output: `output/playwright/ui-rework-2026-10-02/group-07/round1/` and `round2/`; own report `docs/qa/ui-rework-2026-10-02/group-07-progress.md`; own optional capture script `scripts/qa/group07-real-shots.cjs`. Reference existing `scripts/qa/capture-root-games-round3.cjs` and the running root capture setup; never stop someone else's server. Record source hashes, capture times, state, viewport, language/player count and PNG paths.

Build fully; inspect all own original images in one batched round, fix observed defects together; confirm with at most one more round. Run relevant meaningful gameplay/layout checks and the Impeccable detector once at end as its skill directs. DOM geometry and green tests do not replace image inspection. Send packet to root and independent art director with exact files, each game before/after visible delta, test evidence, limitations and unresolved blockers. Automatic/browser/physical evidence separate; do not claim device validation from screenshots. Art director will return bounded named corrections. Do not mark complete before all rows addressed.

## Exact game acceptance rows

Every row remains pending until fresh original-image inspection.

| Group | Game | Baseline evidence | Required visible delta | Additional states |
|---|---|---|---|---|
| 07 quiz | sinyakquiz | Left oversized mostly empty leaderboard; tiny question right | Compact left scoreboard, question higher and dominant; redesign row roles; larger phone Points and coherent top | answering/locked/reveal, long question |
| 07 quiz | warsaw | Same quiz topology; question text wraps into narrow column | Same shared quiz hierarchy with appropriate content measure; bold Points; answer cards consistent | answering/locked/reveal, Cyrillic |
| 07 quiz | millionaire | Left narrow ladder, right question floats high-middle | Ladder/progress genuinely wider with authored progression markers; right question raised/useful; readable phone answer hierarchy | active/eliminated/turn/long answer |
