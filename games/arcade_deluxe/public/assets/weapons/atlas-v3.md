# Simplified weapon atlas

Generated with built-in ImageGen, then deterministically packed using scripts/pack-weapon-atlas.cjs. Reference: atlas-v2.png. New original artwork, not extracted Pocket Tanks graphics.

144 icons, 12 × 12 cells, 1536 × 1536 PNG, 128px integer cells. Every icon has at least 24px transparent padding on all sides (18.75%). Source separation follows empty alpha gutters, not assumed grid coordinates. atlas-v3.json records all crop bounds and output rectangles. check-weapon-atlas.cjs passed all 144 cells with no unsafe borders. Existing weapon indices remain unchanged.

## Exact ImageGen prompt

Edit this weapon sprite atlas. Preserve EXACTLY all 144 subjects and their exact 12 columns by 12 rows ordering. Redraw as much simpler small-size game icons: flat chunky silhouettes, 2-3 solid colors plus one broad highlight, no tiny textures, no particles, no glow, no thin protruding wisps, no small detailing, clean bold toy-like shapes readable at 32px. Most important: each equal cell has EMPTY TRANSPARENT PADDING on ALL FOUR SIDES, at least 20% of cell width on each side. Each complete icon fits within CENTRAL 60% width and height of its own cell, including all handles/projectiles/flames. Icons must never touch cell edges or overlap other cells. EXACT 12x12 evenly spaced regular square grid occupying whole image, no outer margins separate from cell padding, no text, no gridlines. Transparent background, no shadows outside silhouettes. Requested canvas 3072x3072 so each cell is 256x256. Preserve identity and row/column position of each icon from reference. This will be sliced into equal cells, so generous transparent gutters are mandatory.
