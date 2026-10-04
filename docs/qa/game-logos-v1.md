# Game wordmarks — design round2

All36 catalog games have an individual transparent PNG, including Pocket Siege. [Manifest](../../public/assets/game-logos-v1/manifest.json) records exact names, original source rectangles, native dimensions and SHA256 hashes. No logo was upscaled. Native content width is at least1014px, with24px transparent padding.

Eighteen1254×1254 original two-logo images are retained. Built-in image generation created the art; the original clipped Pocket Siege explosion received a documented built-in edit in source14-v2. The approved originals were not regenerated to address the later display complaint. Cutting copies the source pixels into a transparent padded canvas without resizing. The independent asset audit compared every inner RGBA crop byte-for-byte against its source rectangle and found36/36 matches, zero-alpha padding and matching manifest hashes.

Three7168×3456 atlas pages use4×3 cells. The10752×6912 master uses6×6 cells. Every logo has at least262px clear space to each cell edge. Atlases contain native pixels; the game requests the individual PNGs.

## The display defect and its correction

The initial gallery renderer was served by the review server, but the main launcher’s explicit file allowlist omitted `/game-logo-renderer.js`. It returned404, leaving matchmaking outside the new renderer. Earlier144DPR1 screenshots also looked pixelated when enlarged. Those captures are historical evidence and are not accepted as final logo quality.

The launcher now serves the renderer. It downsamples in stages with Canvas2D smoothing into a backing bitmap matched to the CSS box and device density. Local layout coordinates keep the painted copy aligned during ancestor entrance/FLIP transforms. Source image pixels remain unchanged. Unsupported Canvas retains the original image; replacement/removal releases its observer and painted copy.

Fresh actual matchmaking captures at320×568 and393×852, closed/open, cover all36 games:144DPR3 PNGs. The browser check requires the actual painted canvas, expected backing density, source opacity, alignment and successful rule scrolling. [Fresh evidence](../../.localparty-build/design-round2/integration/report.json). [Historical rejected captures](../../.localparty-build/design-round2/integration/historical-before-renderer-route/).

The actual gallery was checked for all36 atDPR2, plus Push Pit/Pocket Siege/Millionaire atDPR1 and3. Fallback and remove/reattach checks pass. Every individual source hash still matches the manifest. Root manually viewed all36 actual gallery captures in12 unscaled montages, then viewed fresh actual matchmaking and the tiny320px expanded state after correcting the missing route. [Renderer evidence](../../.localparty-build/design-round2/logo-rendering/report.json) · [Fresh Push Pit crop, without resizing](../../.localparty-build/design-round2/logo-rendering/push-matchmaking-fixed.png).

These are WebKit browser checks. This iteration has not been installed on a physical iPhone. `verify-ios-product.py` now includes the renderer, index and shared effect resources to catch an old staged bundle before a later build.
