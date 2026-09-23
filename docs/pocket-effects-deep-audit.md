# Pocket Siege effect-path audit

Scope:321 imported weapon definitions. This audit distinguishes handler coverage, actual shot execution, asset decoding and visual fidelity. Passing one does not prove the others.

## New direct source-node coverage

`scripts/audit-pocket-effect-paths.cjs` invokes each of2812 non-trigger nodes in a controlled game and checks its required output, rather than merely checking that execution does not throw:

| Source type | Nodes | Required output |
|---|---:|---|
| BULLET / CRUISER |1393 /40| Actual projectile, named imported animation profile when animated |
| EXPLOSION |610| Persistent visible wave and/or authored terrain job according to flags |
| FIRE / FOG / SUPERBALL |79 /9 /87| Persistent material entity, exact named renderer profile, matching lifetime and material event |
| DIRTBALL / MAGICWALL / DIRTSLINGER / DIRTMOVER |124 /45 /7 /24| Terrain build/erase job plus visual event |
| SHRAPNEL |325| Its own visual/damage path, not an invented terrain eraser |
| ZAPPER / LIGHTNING |19 /5| Named visual/beam event |
| TRACER |35| Original text label event |
| JUMPJETS |10| Jump event and existing player impulse path |

Direct invocation deliberately covers conditional nodes that the three standard firing scenarios may not reach. It does **not** assert every such branch was reached by a real shot.

## Confirmed fixes from this pass

-18 GLUE/RUBBER SPLAT_MODE material nodes previously lost their coating behavior entirely. They now deposit their authored coating and SPLAT_SIZE when contacting the ground. A resting blob does not emit identical coating events every frame. NONE/NORMAL do not become glue/rubber.
- Zero DAMAGE_RADIUS was accidentally replaced with5 by a truthy fallback. The source zero is now preserved, including Rubber Paint's damage-bearing contact material.
-35 TRACER nodes now carry original TEXT and DISPLAY_TIME to the renderer, with a specific TRACER tag; previously text was emitted but not displayed. Renderer regression belongs to the companion label change.

## Complementary checks

- `scripts/audit-pocket-runtime.cjs`:321 weapons × cannon/drop/oblique =963 actual simulations, command traces, missing/unsupported/limit checks and settled turn checks.
- `tests/pocket-runtime-browser.cjs`:321 actual cannon-shot event streams replayed into WebKit. Burn Barrel fire, Mud Pie growth and Magic Forest growth additionally receive timed pixel checks. Other318 cases are event/profile/integration coverage, **not** a pixel-by-pixel visual equivalence verdict. Persistent explosion waves are covered separately, not by this transient-event replay.
- `tests/pocket-projectile-coverage-browser.cjs`:410 animated projectile nodes; all1869 imported frames decode and enter the renderer (472 PNG and1397 indexed frames).
- `tests/pocket-material-profiles.test.cjs`: all named FIRE/FOG/SUPERBALL profiles and indexed masks exist; genuinely transparent utility masks stay transparent.
- `tests/pocket-effect-paths.test.cjs`: direct handler audit, all18 coating nodes, no-coating controls, zero-radius preservation and all35 tracer labels.
- `tests/pocket-explosion-timeline.test.cjs`: source/binary-supported Earth Mover timing and persistent waves; see its separate evidence document.

## Remaining fidelity gaps, not silently treated as solved

The runtime covers all source node types, but this is not full original-engine emulation. SHRAPNEL emitter trajectories/particle emission, ZAPPER flashing/target selection, LIGHTNING segmented paths, tank-throw forces, material bounce/drag and some fog shape/outline options remain approximations. SPLAT_THICKNESS and the exact original coating physics/lifetime are not reproduced; the new deposit uses the existing bounded coating subsystem. Generic legacy glue/rubber projectile responses are not a claim that every authored projectile responds exactly like the original.

The archive contains known malformed rows and absent helper names (BubbleGunDudExplosionBullet and RoboticWormDudBullet); those are explicitly traced compatibility no-ops, not borrowed destructive effects. Passing this audit must not be described as “every weapon is now perfectly identical to Pocket Tanks.”
