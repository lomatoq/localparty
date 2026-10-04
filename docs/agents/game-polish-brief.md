# Game polish brief (lane agents) · 2026-10-02

Goal from the owner: every game must feel several times more premium and pleasant
than now: motion, juice, procedural sprites/textures, TV spectacle, tactile phone
controllers. Do it **inside your lane's folders only** (see
`docs/agents/game-polish-lanes.md`).

## Read first (in this order)

1. `AGENTS.md`, `docs/qa/ui-regression-rules.md`, `docs/qa/design-contract-2026.md`, `PRODUCT.md`.
2. `docs/qa/ux-polish-2026-10-01.md`: shared systems that already exist; use them, don't duplicate them.
3. Skills (in `/private/tmp/claude-501/-Users-hlebhlyaba-HeyPals/63e62ed4-62a2-493b-8b62-7e9e34359c08/scratchpad/skills/`):
   - `gamedev/skills/disciplines/game-feel/SKILL.md` (juice: layered feedback, hit-stop, shake, squash and stretch, tiers)
   - `gamedev/skills/disciplines/game-ui-ux/SKILL.md`, `gamedev/skills/disciplines/camera-systems/SKILL.md`
   - `emil/skills/animate/SKILL.md` + `RECIPES.md`, `emil/skills/improve-animations/AUDIT.md`, `emil/skills/mobile-native/SKILL.md`
   - `impeccable/.claude/skills/impeccable/reference/{polish,delight,animate,craft-floor}.md`
   - three.js lanes also: `threejs/skills/threejs-aaa-graphics-builder/SKILL.md`, `threejs/skills/threejs-gameplay-systems/SKILL.md`, `gamedev/skills/web-engines/threejs-materials-lighting/SKILL.md`
   - Do NOT run any asset-generator scripts (Tripo/image/audio generators): no external APIs, no API keys.

## Shared systems you can call (already loaded in every game iframe)

- `window.LocalPartyFeel.emit(type,{x,y,intensity,impactTarget,id,color})`: types hit/shot/collision/explosion/elimination/out-of-bounds/danger/score/goal/round-result. Gives bursts, edge flash, small shake and native haptics, and is deduped by `id`.
- `window.HeyPalsSprites.burst(x,y,{count,spread})`: procedural star/diamond/dot confetti.
- `window.HeyPalsAvatar.paint(node,name)`: name-seeded gradient avatar (the node gets `data-av-seed`).
- Stat glyphs: any label with class `hp-stat-label` automatically gets a meaningful Game Icon Pack icon (WINS, BOMB, HEALTH, BEST, LAP, POINTS…). Add the class to your stat labels where missing.
- `window.PartyIcons.create(name)`: 68 Game Icon Pack SVGs (crown, bomb, shield, health, target, trophy, clock, dagger, bow, rocket…).
- Primary buttons enabling → CTA wake ring (automatic for `.hp-action-primary` etc.).
- `.hp-info-card` = approved passive card surface.

## What "premium" means here

- **Juice at real events only**: server-confirmed hits, scores, eliminations, round wins. Tiered feedback (small/medium/large), exaggerate briefly, return to rest, bounded particles. Shake only on TV field visuals, never on phone controls or text.
- **TV**: idle life on the field (subtle ambient particles or light motion in the arena art), anticipation before key moments, readable impact, celebratory but short round-end beats, procedural textures/sprites in canvas instead of flat fills where it helps.
- **Phone**: instant press feedback (≤100 ms), haptic tiers via LocalPartyFeel, state transitions that don't teleport, clear "your turn / you're out / you won the round" moments.
- **Motion rules**: Emil's (strong ease-out for UI, <300 ms UI transitions, no scale(0), transform/opacity only, respect reduced motion, no persistent pulse as a substitute for hierarchy).

## three.js in 2D games (owner-approved)

The owner explicitly allows three.js (already a dependency, 0.186; see how `games/sports_siege/public/host.js` imports it) in 2D games too, when it makes the TV look clearly better and more alive: 2.5D lighting, depth, GPU particles, bloom-like glows, animated backgrounds, physical-looking objects. Keep the server state authoritative (render only from snapshots), stay at 60 fps on the TV path, dispose on exit, and keep a working fallback if WebGL is unavailable. Don't rebuild a whole game when a layer (background/particles/lighting canvas behind the existing field) gives most of the gain.

## Hard rules

- Don't change rules, scoring, balance, network protocol or authoritative simulation. Rendering and feedback only, unless you prove a real bug with a test.
- Approved designs stay as they are: Pause/Lobby footer, header gradients, TV header/notch geometry and safe area, Kardia font roles, results layout.
- The working tree holds many uncommitted changes from the owner and Codex: never `git checkout/restore/stash/reset/clean/commit`, never revert others' work, and don't reformat files. Edit with small exact replacements.
- No edits outside your lane folders. Write shared needs under "Requests" in `docs/agents/game-polish-lanes.md`.
- Don't use the iOS Simulator (the main agent owns it).

## Verification (mandatory)

- Playwright WebKit: `PARTY_PLAYWRIGHT=/Users/hlebhlyaba/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`. Pattern: `scripts/qa-controller-sweep.cjs` (env `QA_GAMES`, `QA_WIDTH`, `QA_HEIGHT`, `QA_NATIVE=1` for the native controller route, `QA_OUTPUT`). Server via `PARTY_EPHEMERAL=1 PARTY_PORT=0 PARTY_ADMIN_KEY=… node server.js`, admin `/api/manage` (`bots-set`, `launch`, `force-start`, `stop`).
- Capture real states: TV 1280×720 and 1920×1080, phone 393×852 and 320×568, plus the native route at 402×874 (`QA_NATIVE=1`). Look at every image you accept with Read, and fix what you see. Do one fix round, then confirm.
- Run your games' existing tests (`grep -l <gameid> tests/*`) and `node --test` on the relevant unit tests. Machine load is high, so don't run the full `npm test`; the main agent does.
- Write `docs/qa/game-polish-<lane>-2026-10-02.md`: changes per game, evidence folder, what's not verified.

## Images (owner decision)

Don't generate images yourself. If a raster image (sprite, texture, background, card art) would clearly help, add a request to `docs/agents/image-requests.md` in its exact format and house style, and ship a fallback (procedural or existing art) so nothing breaks before the file exists. The owner will generate them through Codex imagegen.
