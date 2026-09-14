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


def main():
    manifest = json.loads((ART / "manifest.json").read_text(encoding="utf-8"))
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
            sprite.thumbnail((tile.width - 28, tile.height - 28), Image.Resampling.LANCZOS)
            tile.alpha_composite(sprite, ((tile.width - sprite.width) // 2, (tile.height - sprite.height) // 2))
            sheet.paste(tile.convert("RGB"), (x0 + 6, y0 + 28))
            draw.text((x0 + 10, y0 + 6), name, fill="white")
        y += ((len(names) + columns - 1) // columns) * cell_h
    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT, quality=94)
    (OUT.parent / "sprite-edge-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(OUT.name)
    print(json.dumps({"sprites": len(report), "edge_contacts": [r["name"] for r in report if r["edge_alpha"] > 8]}))


if __name__ == "__main__":
    main()
