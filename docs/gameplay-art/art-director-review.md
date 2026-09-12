# Art-direction review, all 26 games

Evidence: `tests/art-audit-sheet-1.png` through `5.png`, plus refreshed full-size `art-host-game-{kart,crane,knives,push,shrink,bomb,western}.png`. Sheets predate the latest individual renderer passes: findings for other games are a targeted next-pass list, not assertions that uninspected later changes failed. This review concerns visual quality, not flow-test counts.

## Highest-impact corrections

1. **Crane:** new city and facade art match each other, but crane looks like a floating L. Anchor mast with a footing and ground contact shadow; add short left counterweight/cab at the boom joint. Intermediate facades need flush seams, not repeated oversized top/bottom caps. Foundation needs thickness/front face. Ghost placement should use a restrained silhouette/outline, not a full duplicate building facade. Darken the city behind the tower slightly while preserving warm windows. Root owns implementation.
2. **Western / Western Duel:** rich toy cowboys sit in placeholder polygon scenery. Use three depth bands with warm-to-cool atmospheric contrast, recognizable saloon/mesa silhouette rhythm, a contact-ground plane and restrained dust. Current vertical lines read as a flat striped board; shorten toward horizon or use perspective spacing. Keep cue typography dominant, recoil driven by actual shot.
3. **Arcade:** large catalog cutouts remain visible through the playfield, weakening gameplay separation. Increase field opacity locally while retaining translucent edge treatment. Scale small entities for readability through framing rather than changing their collision footprint. Distinct gameplay environments matter more than adding unrelated corner emoji.

| Game | Visual assessment and concrete next treatment |
|---|---|
| Push Pit | Pucks readable; huge flat floor can gain radial material, narrow platform underside and subtle center lighting. Boundary must remain exact. |
| Последний круг | Same surface language as Push, with timed contraction warning on the boundary rather than additional interior clutter. |
| Color Knives | Refreshed image is coherent: bevelled sectors, metal hub/ticks, robot launchers. Preserve this material hierarchy; hit flash should be short and local. |
| Bomb Tag | Bomb/puck art stronger than flat obstacle circles. Add restrained obstacle bevel/contact shadows. Replace debug-like `TIMER: ???` with a clear hidden-fuse instruction. |
| One Shot Western | See priority 2. Keep dead characters' rotated silhouette from covering their neighbor at high player counts. |
| Local Tanks | Tank material clearer than monochrome walls; terrain floor variation and wall top-face highlight can clarify depth without altering wall bounds. |
| Tank Arsenal | Open arena needs subtle floor zoning and a real pickup icon instead of an anonymous square. Keep weapon label outside pickup silhouette. |
| One Cursor Chaos | Preserve the varied minigames. Give calibration target/track purposeful contrast and completion feedback; do not fill the interaction area with decorative assets. |
| Wi-Fi Kart Party | Updated stadium field, road/runoff/curb hierarchy, infield stand, trees and lights now give context. Logical road geometry unchanged. Remaining letterboxing is layout outside the canvas. |
| Монстр по кругу | Illustration is welcome while waiting; player-produced drawing must become the focal point at reveal. Reduce empty card area and frame the reveal as connected paper sections, not a generic blank panel. |
| Шпион | Role cards already communicate state. A restrained private/public reveal treatment is useful; generated location/role imagery must never leak secrets on host. |
| Синяк-миллионер | Keep clear answer hierarchy. Trophy/medal accents should live in the result/ladder region, not beside every text block. |
| Синяк: квиз-компания | Sideboard dominates short question cards vertically. Let the question remain primary; winner/color feedback should be event-based and local. |
| Прикольная Варшава | Same quiz structure, use city-specific palette/landmark in quiet perimeter only. Preserve long-answer contrast. |
| Крокодил | Acting prompt panel is clear; stage spotlight/curtain-depth suggestion outside the word area would support the game identity. |
| Тихо, дженга! | Real 3D geometry is the right choice. Improve warm wood grain and contact shadows instead of substituting flat atlas blocks. Maintain subtle edge separation at 16:9/ultrawide. |
| Ночная стройка | See priority 1. Generated facades/city are now coherent, assembly/grounding is the remaining issue. |
| Быстрый морской бой | Public grids are readable but stark. Ship silhouettes only where legally visible; short ripple/explosion at actual shot cells adds broadcast energy without hiding grid state. |
| Рисуй — угадай | Blank drawing area is intentional; avoid decorating it. Paper frame/reveal stamp can sit outside user strokes. |
| Двое на закате | See priority 2. Two characters can be larger through tighter framing while maintaining the same shooting logic. |
| Tap Race | Revised robot feet and stadium lane marks help. Add foreground/background track distinction; avoid huge empty lane interiors with two players. Keep the real 2–16 lane count. |
| Punch Meter | Bag and rope now legible, but isolated against a huge catalog picture. Add quiet gym/ring plane and actual-hit burst/score pulse; turn and attempt labels remain primary. |
| Multiplayer Flappy | Bird wing/pitch and pipe caps improve the silhouette. Layered cloud/ground bands should provide speed reference; opaque enough field prevents catalog art bleeding into flight path. |
| Hungry Arena | Atlas food looks consistent. Retain colored identity ring and white name above blob. Quiet floor pattern at low contrast supports movement; food-absorption pop should reflect real mass change. |
| Snake Lines | Keep clean procedural collision trails. Subtle neon floor/grid and speed head cue are sufficient; texture must not look like another lethal trail. |
| Carry Ball | Add clearer pitch material/center circle and team goal depth. Keep player/team distinction and ball contrast stronger than ambient glow; no duplicate field score. |

## Motion and performance constraints

Animate event feedback from authoritative transitions, not random perpetual wobble. Pause freezes effects; reduced motion removes decorative travel/rotation. Cache static stadium/background artwork per display scale; cache tinted sprites by palette. Snake trails append to one retained canvas. Bound skid/particle pools. Never regenerate terrain or tint pixels inside an entity loop.

Kart validation in this pass: real-physics lap completed in 31.38 s with zero off-road frames; host/mobile readiness, pause, rules and exit passed; 676 successful kart sprite draws during sampled browser interval. Full-size screenshot inspected after the art change.

## September 13 final western, ninja, previews and Arsenal verification
- Both western variants use independent natural-aspect body/arm sprites; arm enlarged 30%, body retained requested 1.4 scale. Alpha-hull support keeps fallen body on ground. Real shot and early pistol-explosion fixtures passed; living players do not fall. Dense frames: `tests/actual-shot-*-{0,40,80,120,160,240,600,1800}.png` and `tests/early-shot-*.png`.
- Color Knives has generated ninja body/throw arm, selective cloth masks (bright highlights retained), and snapshot-authoritative release animation. `tests/ninja-throw-capture.cjs` verified knives consumed by real controller throw; captures in `tests/ninja-throw-*.png`.
- Bomb sprite preserves 312:480 source aspect; animated fuse sparks use the game clock. Holder name is above bomb. Arsenal name/health anchors stay inside arena; authoritative boundary inset reflects visual barrel extent.
- Arsenal trails persist 280ms after projectile removal; segment age controls opacity. Impact marks last 2.2s. Hard caps: 128 trails, 16 points/trail, 32 marks. Actual run observed 2–4 removed-projectile trails and 13–20 marks; `tests/arsenal-fx-counts.json`. Focused readiness/controller/pause/rules/exit browser regression passed.
- All 26 gameplay previews are refreshed from live composited scenes, 1600×900 WebP; no raw WebGL/toDataURL captures. Six fresh-game preview registrations were added. `tests/preview-media-validation.cjs` passed all 26 assets and desktop/mobile cover/no-overflow. Final contact sheet: `tests/current-preview-contact.png`.
- Browser evidence uses isolated servers; no live user game was stopped. Performance verification establishes pool bounds and cached scenery, not a measured device-wide FPS guarantee.
- Push rim follow-up: authoritative `rim-out` event, 900ms tapered angular light wave and six sparse sparks; near-edge warning uses proximity and outward speed. Refined base is a 1.5px light line over dark bevel, with no thick round-capped arcs. Human+bot real exit and lifecycle checks passed; `tests/push-rim-before.png`, `push-rim-moment.png`, `push-rim-fade.png`. Naval preview now shows actual hits/sunk cells and two remaining hull points per player after live shots.
