# Quiet brick backgrounds — build 90

Generated with the built-in imagegen tool using the approved rectangular HeyPals logo as a style reference. Logo artwork remains unchanged.

Assets:
- `public/assets/backgrounds/brick-wall-mobile-v1.png` — 724 × 2172, portrait 1:3.
- `public/assets/backgrounds/brick-wall-wide-v1.png` — 2172 × 724, ultrawide 3:1, desktop and TV.
- `public/background-scene.css` — static 18% opacity, 1 px blur; responsive cover crop. Dark header backing remains intact. Authored fields, game canvases and iframes are not altered. Readiness keeps blurred game artwork above the wall.

Prompt specification: front-on orthographic full-bleed dark purple-gray wall, large chunky softly rounded rectangular bricks, puffy vector-like cartoon shading matched to the logo, thin recessed grout, palette #171522 / #242133 / #2b263d with subtle lavender bevels. Sparse muted lime, pink and lavender gamepad, lightning, star and smile graffiti around outer thirds. Quiet center. Soft diffuse lighting. No typography, logo, floor, perspective, cracks, grain, small tiling, neon hotspots or dense detail. Mobile about 3 bricks across and 9–12 courses high; ultrawide about 7 across and 4 high.

Fresh captures in `.localparty-build/wall90/`: controller lobby and real two-player Push Pit readiness at 320×568 / 393×852; TV lobby at 1280×720 / 1920×1080. Each image visually inspected: wall quiet behind text, original artwork retained, headers legible, no visible scrollbar or horizontal overflow. `report.json` records actual 0.18 opacity, blur(1px), correct responsive image and zero page errors.

Native-host captures use the existing HTTP snapshot fixture with real catalog data (not a claim of physical-device validation). Captured host catalog at 320, 393 and desktop 1440 pixels wide. Preserve these scope limits when reporting QA.

Latest user correction: masthead backing now fades into complete transparency downwards on native host, controller and TV. Readiness introduction starts below the header, emoji 78 px, game artwork scaled 1.18; Rules & controls has a more opaque lavender-gray backing and a chevron anchored to its right inset. Recaptured and visually inspected controller waiting 320/393, controller lobby 393, TV lobby720, native host393/1440 after this correction. Participation actions remain visible at320×568.
