# Sports Siege environment assets

All files in this directory are vendored locally and are loaded only by the host display.
Phone controllers do not import the host scene module or these assets.

## 3D Assets

Source: [3DAssets.dev](https://3dassets.dev/), license: [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/), attribution not required.

- `bowling/`: selected low-poly lane, gutter, wall, neon-sign and ceiling-light modules from **Bowling Alley and Pool Hall**.
- `curling/roofed-hall.glb`: **Roofed Curling Hall**, 3DAssets.dev asset `31258`, [model source](https://cdn.3dassets.dev/assets/31258/v1/model.glb) from [Curling Club and Ice Maintenance](https://3dassets.dev/packs/curling-club-and-ice-maintenance), CC0 1.0 Universal. Vendored; since the 2026-10 curling upgrade the club is built procedurally in `scene-curling.js` and this file is no longer loaded. The other curling GLBs in that folder have no recorded provenance here and are not loaded.

## Gallery 2D assets

Sources: [Kenney Shooting Gallery](https://kenney.nl/assets/shooting-gallery) and [Kenney Crosshair Pack](https://kenney.nl/assets/crosshair-pack), license: CC0.

The `gallery/` directory contains a small selected subset: seamless stall backgrounds, clouds, curtains and a monochrome tintable crosshair mask. The original Kenney license texts are included as `gallery/LICENSE-KENNEY.txt` and `gallery/LICENSE-CROSSHAIR-KENNEY.txt`.
