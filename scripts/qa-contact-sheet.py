#!/usr/bin/env python3
"""Contact sheet: python3 scripts/qa-contact-sheet.py OUT.png COLS THUMB_W img1 img2 ...
Each tile is labelled with its file name (minus extension)."""
import sys, os
from PIL import Image, ImageDraw, ImageFont

out, cols, tw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = [f for f in sys.argv[4:] if os.path.exists(f)]
if not files:
    sys.exit('no images')
thumbs = []
for f in files:
    im = Image.open(f).convert('RGB')
    h = round(im.height * tw / im.width)
    thumbs.append((os.path.splitext(os.path.basename(f))[0], im.resize((tw, h), Image.LANCZOS)))
th = max(t.height for _, t in thumbs)
label = 22
rows = (len(thumbs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 8) + 8, rows * (th + label + 8) + 8), (12, 10, 18))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 15)
except Exception:
    font = ImageFont.load_default()
for i, (name, t) in enumerate(thumbs):
    x = 8 + (i % cols) * (tw + 8)
    y = 8 + (i // cols) * (th + label + 8)
    d.text((x, y + 2), name[:40], fill=(230, 220, 255), font=font)
    sheet.paste(t, (x, y + label))
sheet.save(out)
print(out, sheet.size)
