# Pocket Siege object projectile art

The original user-supplied Pocket Tanks archive contains the referenced BMPs. These are now imported rather than approximated with a generic triangle or brown rectangle. Source: `Pocket Tanks Deluxe/weapdata`, from `Pocket Tanks Deluxe.7z`.

The manifest now covers **all 410 explicitly animated BULLET/CRUISER nodes, 1869 unique original frames (1397 BMP +472 PNG)**, about3.2MB uncompressed, loaded once. The earlier restricted import covered only30 nodes/96frames; this left most authored objects using generic fallbacks. Lookup includes weapon ID, node type and node name. A matching weapon name alone never paints a sprite over an invisible helper or fire particle. PNG retains source alpha and is decoded lazily. BMP retains indexed palette and black-key transparency, including intentionally blank animation frames. Cached decoded images are reused.

| Source bitmap family | Original frame dimensions | Weapons |
| --- | --- | --- |
| `ac/barrel0001.bmp`… | 13×13 | Burn Barrel (airborne and rolling) |
| `qu/oilbarrel0001.bmp`… | 13×13 | Oil Slick (airborne and rolling) |
| `hmissile01.bmp`… | 9×14 | Heatseeker, Homing Missile, Nuke, Mega Nuke, Twist Rockets |
| `pw/lmissile0001.bmp`… | 20×20 | Lucky Shot |
| `na/phasemissile0001.bmp`… | 15×15 | Phase Missile |
| `bl/boostermissile.bmp` | 11×23 | Booster Rocket |
| `cannonball.bmp` | 11×11 | Cannon Ball |

Indexed RGB palette and frame order (including repeats) are retained. Index0 is transparent, matching these source images' black-key background. Authored X/Y offsets are retained: notably Burn Barrel uses(6,6) airborne and(6,9) rolling; Oil Slick uses(6,8)/(6,11). Missing offsets use the bitmap centre. Missile artwork points up in the source; rotation aligns it with the existing velocity vector. No projectile state is mutated.

One bitmap pixel is one world unit, consistent with the existing imported material renderer. This preserves bitmap dimensions; it does **not** prove pixel-equivalent screen size against every original window resolution. `DRAW_ANIM_SPEED` is used as frames/second, consistently with the existing importer; original executable timing has not been independently measured. Cruiser FACE animation direction is recorded but not inferred as a geometric flip. No claims of exact original-engine animation timing are made.

Authored trails, physics, collisions and damage remain unchanged. Unloaded assets retain the prior fallback renderer. Every explicit BMP/PNG projectile animation is included, including turret bases and tall beam images; original dimensions and offsets are retained rather than restricting all art to64px. Invisible nodes with DRAW_ANIM NONE remain invisible. This is animation asset coverage, not a claim that every source-engine visual/compositing behavior is identical.

Rebuild: `node scripts/import-pocket-projectile-art.cjs /path/to/extracted/weapdata`.

Validation: `tests/pocket-projectile-art.test.cjs`, `tests/pocket-projectile-art-browser.cjs`, and the existing `tests/siege-fx-browser.cjs`. The contact sheet `/private/tmp/pocket-projectile-original-art.png` shows source art at5× for inspection, not gameplay scale.

`tests/pocket-projectile-coverage-browser.cjs` additionally decodes all1869frames in WebKit, verifies dimensions, and draws the first frame of all410nodes through the actual renderer. Passed on development Mac; not a physical-phone frame-rate benchmark.
