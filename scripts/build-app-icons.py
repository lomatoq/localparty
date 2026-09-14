from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources" / "localparty-app-icon-source.png"
OUTPUT = ROOT / "public" / "assets" / "branding" / "icons"
OUTPUT.mkdir(parents=True, exist_ok=True)

source = Image.open(SOURCE).convert("RGBA")
sizes = [16, 32, 48, 64, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512]


def resized(size: int) -> Image.Image:
    image = source.resize((size, size), Image.Resampling.LANCZOS)
    if size <= 64:
        image = image.filter(ImageFilter.UnsharpMask(radius=0.45, percent=75, threshold=3))
    return image


for size in sizes:
    resized(size).save(OUTPUT / f"icon-{size}x{size}.png", optimize=True)

for size in [57, 60, 72, 76, 114, 120, 144, 152, 167, 180]:
    resized(size).save(OUTPUT / f"apple-touch-icon-{size}x{size}.png", optimize=True)

resized(180).save(OUTPUT / "apple-touch-icon.png", optimize=True)
resized(180).save(OUTPUT / "apple-touch-icon-precomposed.png", optimize=True)
resized(192).save(OUTPUT / "android-chrome-192x192.png", optimize=True)
resized(512).save(OUTPUT / "android-chrome-512x512.png", optimize=True)
resized(150).save(OUTPUT / "mstile-150x150.png", optimize=True)

for size in [192, 512]:
    canvas = Image.new("RGBA", (size, size), "#c8ff2e")
    inset = round(size * 0.10)
    foreground = source.resize((size - inset * 2, size - inset * 2), Image.Resampling.LANCZOS)
    canvas.alpha_composite(foreground, (inset, inset))
    canvas.save(OUTPUT / f"maskable-{size}x{size}.png", optimize=True)

resized(16).save(OUTPUT / "favicon-16x16.png", optimize=True)
resized(32).save(OUTPUT / "favicon-32x32.png", optimize=True)
source.save(
    ROOT / "public" / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
)

print(f"Built {len(list(OUTPUT.glob('*.png')))} PNG icons and favicon.ico")
