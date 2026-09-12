# Shared gameplay artwork

All 26 catalog games are mapped in `inventory.json`. This is a production asset inventory and integration guide, not a claim that every renderer has already been modified. Quiz, drawing and hidden-role games deliberately retain semantic DOM/player artwork; shared raster assets are decorative there.

Style: chunky premium toy forms, orthographic views, upper-left soft light, crisp small-scale silhouettes. Neutral actor panels accept player colors while dark outlines/materials stay legible. Fields, collision boundaries, ropes, trails, sector colors, particles and text remain procedural.

`prompts.json` preserves exact built-in ImageGen prompts. `public/assets/gameplay/sources.json` records original provenance. `scripts/build-gameplay-atlases.cjs` segments alpha-connected objects, assigns them to their intended 4×2 cells, trims and repacks with at least 16 px gutter; this corrects generated objects crossing their nominal cell boundaries. It exports atlas WebP, individual WebP sprites, PNG tint masks and precise manifest frames/pivots.

Generated PNGs contain RGB glow under fully transparent pixels; alpha is genuine. Never discard alpha or flatten against those RGB values. The production atlas is recomposited onto clear alpha. Runtime drawImage honors transparency.

Tint masks isolate bright low-saturation material rather than replacing a full silhouette. Multiply color through the mask and composite onto the source while retaining shading. For knives prefer the separate handle layer so steel remains unchanged. Tank chassis and turret are separate modular frames: rotate chassis by movement and turret by aim. Use procedural feet/wing transforms with modular parts; do not claim an AI sheet is an authored multi-frame animation.

Backgrounds should be generated in canvas from the collision geometry: grid/track/grass/desert accents, rather than stretching baked backgrounds that can misalign gameplay. Pool effect particles and cache tint canvases once per sprite/color. Avoid canvas filters and new offscreen allocations inside the draw loop.

## Integrated result

The implementation now covers 16 canvas-led games with generated gameplay sprites/materials and 10 DOM/3D-led games with unobtrusive prop accents. Authored drawings and Jenga's 3D blocks remain their original renderers. See `integration.md` for source ownership, runtime behavior and validation evidence, and `tests/game-art-browser-results.json` plus the split QA result files for actual per-game checks.

Selective masks protect white eyes and specular highlights (full protection above luminance 235, soft transition from 215), dark mechanical joints and semantic exclusions such as cowboy skin, tank tracks and knife steel. The original art and three runtime player colors are shown in `tests/atlas-tint-check.png`. This is selective material recoloring, not whole-sprite tinting.

