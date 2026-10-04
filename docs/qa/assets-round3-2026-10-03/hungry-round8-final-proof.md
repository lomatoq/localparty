# Hungry Arena final source freeze

Hungry Arena, TV only: two and sixteen real engine players; four fresh final originals, no injected states or scores, no phone or physical-device claim.

Two causes were fixed: the food animation used mutable array indexes, and large meals triggered a shake across the scene. Food now has monotonic IDs, so each remaining item retains its position, kind and animation phase. Large meals retain eater squash, CHOMP and particles without translating the scene.

A newly generated eight-color atlas replaces the gray-center field sprite. Original RGBA pixels are unchanged, all cells have complete silhouettes and clear boundaries, and native aspect is preserved. The eight existing player colors and movement, eating and respawn rules remain unchanged.

Hungry foreground clipping and tile loops now extend to the actual viewport. The camera remains uniform and movement boundaries remain canonical. Flappy countdown, Carry collision and Punch sensitivity are preserved.

All four fresh final TV originals were individually opened. No browser errors or source changes occurred; all twenty captured dependencies still match. The browser and temporary server are closed.

| Original | SHA256 | Direct observation |
|---|---|---|
| hungry-2-live-1280.png | 29050a641afe201ed1b42d9b0701c45777f866b5a63d337151ca8b1c6ce5daae | New lime and cyan creatures have colored centers and intact silhouettes at720p. Floor backing extends through the margins; the unchanged join toast is transient. |
| hungry-2-live-1920.png | 02e462b1889f935936af0a9a3f4d4a029dd04ece62f4fc1acb17b8328cc8cbb8 | At1080p, native aspect and body colors remain intact. No central rectangular field cut; header facts remain separate. |
| hungry-16-live-1280.png | e23f7f4276cd4232cd4b968f9b0c616332b15a79288c64da1dd65f849334fa33 | Sixteen real players show all eight existing colors. Actor-only impact bubbles remain; every rendered body envelope is inside the frame. |
| hungry-16-live-1920.png | 82e47a2eb3f6c813d09cf5de9868bbd50afcb99b7b47184097e1a892a39a0116 | Dense sixteen-player1080p scene: colored mouths and body shading remain intact. Actor collisions and brief impact rings remain localized. |

Focused tests:17/17 pass. The actual-source20→29 meal observer initially reproduced scene shake x=-0.679; after the one-line correction it returns zero while eater squash remains. The initial broad Flappy smoke fixture mismatch is preserved in raw history. Its owner then corrected the test to assert blocked countdown input/cooldown/movement and accepted live flaps. The current six-mode smoke and feel checks both pass.

Earlier real pointer evidence removed one food and added one, retaining all69 other objects exactly unchanged. Mass increased20→23, then reached26 at the left edge, with complete bodies at both TV sizes. Those action originals retain their older Juice hash. An exact reversible single-call source delta qualifies them as historical interaction evidence, not fresh current screenshots.

Only the current four normal-clock two- and sixteen-player captured scenes are approved by this self-review. Earlier real pointer eat and left edge at mass26 are separately source-qualified. Other maximum-mass/rim states and physical hardware remain unverified.

Exact hashes, prompts and source details: [final proof JSON](hungry-round8-final-proof.json).

This packet records the earlier art/mask/food freeze. Subsequent Hungry-only absorption changes affect simulation.js and the controller hint; current gameplay proof is captured separately in hungry-absorption-round9-confirm and documented in hungry-absorption-round9-proof.md. The generated atlas, helper and viewport clipping code are unchanged.
