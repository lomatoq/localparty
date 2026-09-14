from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public" / "assets" / "gameplay" / "sports-siege"
OUT = ROOT / "test-results" / "sports-siege-art" / "sprite-contact-sheet.png"

GROUPS = [
    ("SWARM ENEMIES", ["swarm-termite", "swarm-runner", "swarm-tank", "swarm-boss"]),
    ("TURRETS", ["turret-head-short", "turret-head-long", "turret-pulse", "turret-shell", "turret-bolt", "turret-missile"]),
    ("PEDESTALS", ["turret-pedestal-stone", "turret-pedestal-blue", "turret-pedestal-wood", "turret-pedestal-damaged"]),
    ("GALLERY TARGETS", ["target-chicken", "target-bug", "target-beetle", "target-boss", "target-friendly", "target-bonus"]),
    ("COVERS", ["cover-wood", "cover-stone", "cover-metal", "cover-rounded"]),
    ("SHOT FX", ["shot-gold", "shot-violet", "muzzle-a", "muzzle-b", "hit-a", "hit-b", "miss-a", "miss-b"]),
    ("SWARM EXPLOSION", [f"swarm-explosion-{i}" for i in range(8)]),
    *[(f"{kind.upper()} DEATH", [f"swarm-death-{kind}-{i}" for i in range(8)]) for kind in ("termite", "runner", "tank", "boss")],
    ("GALLERY DEATH", [f"gallery-death-{i}" for i in range(8)]),
]


def checker(size):
    image = Image.new("RGBA", size, "#182134")
    draw = ImageDraw.Draw(image)
    step = 20
    for y in range(0, size[1], step):
        for x in range(0, size[0], step):
            if (x // step + y // step) % 2:
                draw.rectangle((x, y, x + step - 1, y + step - 1), fill="#24334b")
    return image


def alpha_components(alpha, threshold=16):
    width, height = alpha.size
    pixels = alpha.load()
    seen = bytearray(width * height)
    areas = []
    for y in range(height):
        for x in range(width):
            start = y * width + x
            if seen[start] or pixels[x, y] < threshold:
                continue
            stack = [start]
            seen[start] = 1
            area = 0
            while stack:
                point = stack.pop()
                px, py = point % width, point // width
                area += 1
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    index = ny * width + nx
                    if 0 <= nx < width and 0 <= ny < height and not seen[index] and pixels[nx, ny] >= threshold:
                        seen[index] = 1
                        stack.append(index)
            areas.append(area)
    return sorted(areas, reverse=True)


def main():
    manifest = json.loads((ART / "manifest.json").read_text(encoding="utf-8"))
    errors = []
    if manifest.get("version", 0) < 2:
        errors.append("manifest version must include safe bounds and camera views")
    cell_w, cell_h, columns = 260, 300, 4
    rows = sum((len(names) + columns - 1) // columns + 1 for _, names in GROUPS)
    sheet = Image.new("RGB", (columns * cell_w, rows * cell_h), "#0c111d")
    draw = ImageDraw.Draw(sheet)
    y = 0
    report = []
    for title, names in GROUPS:
        draw.text((14, y + 10), title, fill="#c8ff73")
        y += 38
        for index, name in enumerate(names):
            col, row = index % columns, index // columns
            x0, y0 = col * cell_w, y + row * cell_h
            tile = checker((cell_w - 12, cell_h - 42))
            sprite = Image.open(ART / manifest["sprites"][name]["file"]).convert("RGBA")
            alpha = sprite.getchannel("A")
            bbox = alpha.getbbox()
            border = 3
            edge_alpha = max(
                alpha.crop((0, 0, sprite.width, border)).getextrema()[1],
                alpha.crop((0, sprite.height - border, sprite.width, sprite.height)).getextrema()[1],
                alpha.crop((0, 0, border, sprite.height)).getextrema()[1],
                alpha.crop((sprite.width - border, 0, sprite.width, sprite.height)).getextrema()[1],
            )
            report.append({"name": name, "size": sprite.size, "alpha_bbox": bbox, "edge_alpha": edge_alpha})
            entry = manifest["sprites"][name]
            components = alpha_components(alpha)
            report[-1]["components"] = components[:8]
            if edge_alpha > 8:
                errors.append(f"{name}: opaque pixels touch sampling margin")
            if not entry.get("safeBounds") or min(entry["safeBounds"][:2]) < 12:
                errors.append(f"{name}: missing safe transparent padding")
            opaque = [pixel for pixel in sprite.getdata() if pixel[3] > 24]
            pink = sum(1 for red, green, blue, _ in opaque if red > 190 and blue > 105 and green < 90 and red > blue * 1.25)
            if opaque and pink / len(opaque) > .015:
                errors.append(f"{name}: chroma-key remnants remain opaque")
            sprite.thumbnail((tile.width - 28, tile.height - 28), Image.Resampling.LANCZOS)
            tile.alpha_composite(sprite, ((tile.width - sprite.width) // 2, (tile.height - sprite.height) // 2))
            sheet.paste(tile.convert("RGB"), (x0 + 6, y0 + 28))
            draw.text((x0 + 10, y0 + 6), name, fill="white")
        y += ((len(names) + columns - 1) // columns) * cell_h
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, quality=94)
    (OUT.parent / "sprite-edge-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    for kind in ("termite", "runner", "tank", "boss"):
        atlas = f"swarm-death-{kind}"
        if atlas not in manifest.get("atlases", {}):
            errors.append(f"missing separate {atlas} atlas")
        for frame in range(8):
            name = f"{atlas}-{frame}"
            entry = manifest.get("sprites", {}).get(name)
            if not entry or entry.get("atlas") != atlas or entry.get("view") != "top-down":
                errors.append(f"{name}: invalid death frame contract")
    for name in ("swarm-termite", "swarm-runner", "swarm-tank", "swarm-boss", "turret-base", "turret-head-short", "turret-head-long"):
        if manifest.get("sprites", {}).get(name, {}).get("view") != "top-down":
            errors.append(f"{name}: must be top-down")
    print(OUT.name)
    print(json.dumps({"sprites": len(report), "edge_contacts": [r["name"] for r in report if r["edge_alpha"] > 8], "errors": errors}))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
