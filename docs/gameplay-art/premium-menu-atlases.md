# Premium menu art v2

20 individually generated illustrations share the art direction and ordered subject list in `premium-menu-v2.json`. Generation used the built-in image tool, followed by uniform magenta background edits where necessary. Retained PNG generation sources are under `public/assets/games/premium-v2/sources/`. Chroma extraction removes the technical background, unmattes edge pixels, and retains violet materials and white highlights. Individual lossless WebP icons are 1254 × 1254 with real alpha.

Run `node scripts/pack-premium-menu-atlases.cjs` with Sharp installed (the bundled desktop runtime is also supported). The script requires all 20 icons and never rewrites them. It produces five lossless transparent 2604 × 2604 atlases, with four native-resolution icons each, 32 px outside padding and 32 px gaps. `public/assets/games/premium-v2/atlases/frames.json` contains exact pixel frames, source dimensions, and atlas assignments. No trimming or rotation is applied.

The individual icons remain the preferred runtime assets for independent lazy loading; the atlases are reusable packaging, not a forced extra page download. These are menu illustrations, not gameplay tint-mask sprites.

Validation checks every icon for the expected size, transparent outer border, surviving solid content, and residual pure-magenta matte. Each atlas frame is decoded and compared to the source: alpha and every visible RGB pixel must match exactly. Results are in `atlases/alpha-qa.json`. Dark/light contact sheets are `tests/premium-all-contact-1.png` and `tests/premium-all-contact-2.png`.

Visual inspection of both sheets confirmed complete silhouettes, readable material highlights, preserved purple parts and no visible checkerboard or pink fringe at catalog scale. Numerical matte checks do not prove every possible antialiased edge is perfect; contacts provide the complementary visual evidence. No failed icons remained in this review.
