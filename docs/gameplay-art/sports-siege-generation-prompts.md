# Sports & Siege: production prompts

## Что зафиксировано по текущей игре

- Визуальный стандарт проекта: `LocalParty soft toy arcade / orthographic / upper-left light`.
- Текущие игровые атласы имеют размер 1536×1024, сетку 4×2 и ячейку 384×512. Внутри ячейки оставляется минимум 16 px запаса.
- Защита ворот использует ортографическую камеру `(0, 30, 22) → (0, 0, -8)`: камера находится со стороны ворот, смотрит вдоль поля и вниз примерно под 45°. Ворота и стена неподвижны. Враги и башни должны вращаться в плоскости поля.
- Тир использует строго фронтальную ортографическую камеру `(0, 0, 35) → (0, 0, 0)`. Мишени и укрытия нельзя рисовать в три четверти.
- Розовый фон исходников: ровный `#FF00A8`. После генерации он удаляется, спрайты обрезаются и сохраняются с альфа-каналом.

## Общий контракт для генерации

Этот блок добавляется в каждый промпт без изменений:

```text
Match the LocalParty asset language: simple soft-toy arcade forms, orthographic projection, broad upper-left key light, soft ambient fill, clean rounded silhouettes, restrained highlights, and no texture noise. The asset must remain readable when rendered at 48–120 screen pixels. Use large color regions and at most four material regions per object. No tiny rivets, scratches, rubble, micro-panels, thin antennae, or decorative particles.

Production source background must be a perfectly uniform #FF00A8. Do not use transparency, gradients, shadows, bloom, reflected pink light, or ambient haze in the background. Keep every silhouette at least 24 pixels away from its cell boundary. No text, labels, numbers, UI, logos, watermark, checkerboard, or scenery.
```

## Защита ворот: враги сверху

Практическое применение: каждый враг — отдельный вращаемый спрайт. Нулевое направление смотрит к нижнему краю изображения, то есть к воротам. Движение создаётся кодом; ассет не содержит нарисованного следа.

```text
Create a 1536×1024 source atlas with a strict 4-column by 2-row grid, each cell 384×512. Render four enemy types in the first row and leave the second row empty hot pink for later animation variants.

CAMERA: exact 90-degree orthographic top-down view. No perspective and no visible horizon. Every enemy faces the bottom edge of its cell. The body center and contact center must be at the exact center of the cell. Lighting direction is fixed from the upper-left of the final image; do not paint a cast shadow.

CELL 1: small orange worker bug, round body, six short legs, two large dark eyes, one cream abdomen band.
CELL 2: fast yellow-and-violet winged bug, compact symmetric body, two broad readable wings, no thin wing veins.
CELL 3: heavy green-and-charcoal armored beetle, wide silhouette, two large armor plates, short horn.
CELL 4: boss bug, large dark-violet body, two red armor plates, broad front claws, red eyes.

All four must share the same body scale logic and top-down camera. Use large simple shapes, no three-quarter view, no side view, no action pose, no motion streaks, no debris, and no glow behind the silhouettes.
```

## Защита ворот: разборная пушка сверху

Практическое применение: основание стоит неподвижно; верхняя часть вращается кодом вокруг центра. Ствол всегда направлен строго к верхнему краю ячейки. Дуло имеет явную точку для появления снаряда.

```text
Create a 1536×1024 source atlas with a strict 4×2 grid, 384×512 per cell. This is a modular top-down turret rig, not a menu illustration.

CAMERA: exact 90-degree orthographic top-down view for every part. No perspective. No visible side faces. Neutral broad lighting with no cast shadow, so parts can rotate in the game without a false shadow direction.

CELL 1: turret base only, circular and rotationally symmetric, dark charcoal outer ring and one large player-color paint region. Exact pivot at cell center.
CELL 2: rotating turret head only, compact circular housing with a short wide barrel pointing exactly upward. Exact rotation pivot at cell center. The muzzle center lies on the vertical centerline near the top of the silhouette.
CELL 3: longer cannon head variant, same pivot and upward direction.
CELL 4: pulse-emitter head variant, same pivot and upward direction.
CELL 5: small gold shell, pure top view, nose pointing upward, centered.
CELL 6: violet energy bolt, pure top view, nose pointing upward, no trail.
CELL 7: compact missile, pure top view, nose pointing upward, no flame trail.
CELL 8: circular selection ring, pure top view, simple cyan outline.

Use simple chunky forms and only large readable color regions. Parts must not overlap. Do not combine the base and head. Do not tilt the cannon toward the viewer. Do not show a three-quarter product render.
```

## Защита ворот: стена и ворота под камерой игры

Практическое применение: это неподвижные декорации на линии `z = 0`. Они не вращаются, поэтому используют точный ракурс игровой камеры. Стена идёт слева направо; игрок видит её южный фасад и верхнюю грань, но не боковой торец.

```text
Create a 1536×1024 source atlas with a strict 4×2 grid, 384×512 per cell, containing modular fortress pieces for a fixed gameplay camera.

CAMERA: orthographic, camera located directly south of the wall, looking north and downward at 45 degrees. Camera yaw is exactly 0 degrees. Horizontal world lines remain horizontal in the image. Show the south/front face and the top cap. Do not show the left or right side face of any wall module.

CELL 1: straight stone wall module spanning the full usable cell width, flat left and right connection seams, simple top cap.
CELL 2: closed double wooden gate in a straight stone frame, perfectly centered, same baseline and camera as cell 1.
CELL 3: damaged gate using the identical outer silhouette and alignment; only two or three large cracks and one missing plank.
CELL 4: destroyed gate opening using the identical frame and baseline; a few large pieces only.
CELL 5: left end-cap tower, front and top visible, inner connection seam on the right.
CELL 6: right end-cap tower, mirrored structure, inner connection seam on the left.
CELL 7: simple wall damage decal, front-facing and flat, no perspective of its own.
CELL 8: simple repair glow decal, front-facing and flat.

Keep masonry broad and low-detail. No angled standalone wall chunk, no diagonal wall, no isometric corner, no surrounding ground, no rubble cloud, and no decorative banner covering a connection edge.
```

## Защита ворот: поле вместо детального бэка

Практическое применение: квадратная бесшовная текстура накладывается на горизонтальную плоскость. Стены, враги и пушки рисуются отдельно. Здесь не должно быть горизонта или заранее нарисованных объектов.

```text
Create one seamless 1024×1024 gameplay ground texture.

CAMERA: exact 90-degree top-down orthographic texture view. This is a tileable material map, not a landscape illustration and not a perspective background plate.

Design a dark blue-gray fortress courtyard floor made of very broad stone slabs. Use low contrast so enemies, aim lines, projectiles, and UI remain dominant. Add only subtle wide seams, two or three faint worn patches, and a restrained violet-to-blue color variation. The left edge must tile perfectly with the right edge; the top edge must tile perfectly with the bottom edge.

No horizon, sky, mountains, castle, wall, gate, turret, enemy, projectile, text, vignette, dramatic light beam, small debris, grass, cracks thinner than 8 pixels, or high-frequency texture.
```

## Защита ворот: анимируемый взрыв

Практическое применение: восемь кадров проигрываются слева направо, затем сверху вниз за 320 ms. Pivot у всех кадров `(0.5, 0.5)`. Пустой первый и последний края обеспечивают чистое появление и исчезновение.

```text
Create a 1536×1024 eight-frame VFX atlas in a strict 4×2 grid, 384×512 per frame.

CAMERA: exact top-down radial effect, orthographic, centered in every cell. Every frame must keep the exact same center, scale envelope, palette, and lighting.

Animation sequence: frame 1 tiny white-yellow ignition; frame 2 small orange star; frame 3 expanding orange disk; frame 4 peak explosion with six large lobes; frame 5 peak ring with four large debris shapes; frame 6 contracting ring; frame 7 three fading embers; frame 8 almost empty with one faint ember.

The animation must read as continuous adjacent frames. Use 5–10 large shapes per frame. No detailed smoke, no random camera changes, no different explosion design per cell, no text, and no debris crossing a cell boundary.
```

## Тир: враги строго анфас

Практическое применение: персонаж поднимается из-за укрытия вертикальным смещением. Поэтому нижняя точка и масштаб обязаны совпадать. Никакого наклона камеры.

```text
Create a 1536×1024 source atlas with a strict 4×2 grid, 384×512 per cell, containing shooting-gallery targets.

CAMERA: exact orthographic front view. Camera pitch 0 degrees, yaw 0 degrees, roll 0 degrees. Every character faces the viewer directly. The feet/contact baseline is identical in every cell and the body center lies on the vertical centerline. No three-quarter pose and no visible top surfaces caused by camera tilt.

CELL 1: surprised white chicken, wings close to body, large readable eyes.
CELL 2: orange bug bandit, front-facing, compact body, two large eyes.
CELL 3: violet armored beetle target, front-facing, broad simple armor.
CELL 4: large boss chicken with two simple shoulder pads.
CELL 5: friendly white chicken holding one plain white flag, clearly distinct from enemies.
CELL 6: gold bonus target, same silhouette family, one broad gold material region.
CELL 7: empty hot-pink cell.
CELL 8: empty hot-pink cell.

Use neutral standing poses because rise, bob, recoil, and death are animated by code. No weapon, projectile, crosshair, action trail, separate floating particles, background glow, or cast shadow.
```

## Тир: укрытия строго анфас

```text
Create a 1536×1024 source atlas with a strict 4×2 grid, 384×512 per cell.

CAMERA: exact orthographic front view, no top face and no side face. Every obstacle has the same bottom baseline and fills the same usable width. These assets must line up with a rectangular gameplay hitbox.

CELL 1: intact wooden crate front, broad planks and one diagonal brace.
CELL 2: cracked version with identical outer silhouette and only two large cracks.
CELL 3: low stone barricade front, broad blocks, flat rectangular outer silhouette.
CELL 4: violet metal shield front, flat rectangular outer silhouette.
CELL 5: destroyed crate animation frame A, two large separated pieces inside the original silhouette.
CELL 6: destroyed crate animation frame B, pieces lower than frame A.
CELL 7: simple round metal obstacle front.
CELL 8: empty hot-pink cell.

No perspective, no isometric view, no floor, no cast shadow, no scattered fragments outside the original obstacle bounds, and no detail smaller than 10 pixels at source size.
```

## Тир: попадание и исчезновение цели

Практическое применение: восемь последовательных кадров, 50 ms на кадр. Силуэт цели в кадрах 1–3 заменяется вспышкой и крупными частями; к кадру 8 ячейка почти пустая. Для курицы и жука нужны разные полосы, но одинаковая сетка.

```text
Create a 1536×1024 eight-frame VFX atlas in a strict 4×2 grid, 384×512 per frame, for one arcade target death animation.

CAMERA: exact orthographic front view. All frames share the same center, baseline, scale, and camera.

Animation sequence: frame 1 compact impact star at body center; frame 2 silhouette squash with one bright flash; frame 3 silhouette breaks into four large playful pieces; frame 4 pieces move outward; frame 5 pieces shrink and fade; frame 6 two remaining pieces; frame 7 one small sparkle; frame 8 nearly empty.

Keep the effect playful and non-graphic. Use only large pieces and a small fixed palette. No gore, smoke cloud, random unrelated explosion, camera movement, background glow, or particles crossing a cell boundary.
```

## Как собирать финальные атласы

Финальный runtime-атлас не нужно повторно генерировать моделью: повторная генерация меняет ракурс, размеры и дизайн. После утверждения отдельных листов их следует детерминированно вырезать по `#FF00A8`, обрезать до альфа-силуэта, сохранить pivot и упаковать скриптом в WebP-атлас. JSON рядом описывает точные задания, pivots и порядок кадров.
