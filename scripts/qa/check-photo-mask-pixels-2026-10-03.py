"""Check actual PNG pixels independently of DOM style declarations."""
import json
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[2]
doc=root/'docs/qa/photo-mask-all36-2026-10-03'
colors=[(232,71,74),(65,165,231),(249,195,64),(78,188,123)]
def near(c,targets=colors):
    return min(sum((a-b)**2 for a,b in zip(c,t))**.5 for t in targets)<35
rows=[]
for p in json.loads((doc/'pixel-probes.json').read_text()):
    im=Image.open(root/p['file']).convert('RGB');b=p['box'];w,h=b['width'],b['height']
    if not w or not h:continue
    sample=lambda x,y:im.getpixel((round(b['x']+w*x),round(b['y']+h*y)))
    corners=[not near(sample(x,y)) for x,y in [(.08,.08),(.92,.08),(.08,.92),(.92,.92)]]
    interior=[near(sample(x,y)) for x,y in [(.35,.35),(.65,.35),(.35,.65),(.65,.65)]]
    rows.append({**p,'cornersExcludeUploadedColors':corners,'interiorContainsUploadedColors':interior,'pass':all(corners) and all(interior)})
assert rows and all(r['pass'] for r in rows),[r for r in rows if not r['pass']]
(doc/'pixel-confirmation.json').write_text(json.dumps(rows,indent=2)+'\n')
oldcolors=[]
for n in [1,2]:
    im=Image.open(root/f'scripts/qa/fixtures/uploaded-nonsquare-{n}.png').convert('RGB')
    oldcolors.extend(im.getpixel((int(im.width*x),int(im.height*y))) for x,y in [(.25,.25),(.75,.25),(.25,.75),(.75,.75)])
control=[]
for folder in ['before-sports','final-catalog']:
    f=f'output/playwright/photo-mask-all36-2026-10-03/{folder}/bowling-tv-live-1280.png';im=Image.open(root/f).convert('RGB');corner=im.getpixel((33,657));interior=im.getpixel((44,668))
    control.append({'file':f,'manualMatchingFirstPortraitProbe':{'corner':[33,657],'interior':[44,668]},'cornerRGB':corner,'interiorRGB':interior,'cornerIsFixture':near(corner,oldcolors),'interiorIsFixture':near(interior,oldcolors)})
assert control[0]['cornerIsFixture'] and not control[1]['cornerIsFixture'];assert all(r['interiorIsFixture'] for r in control)
(doc/'pixel-negative-control.json').write_text(json.dumps({'qualification':'Same full-upload fixtures before/after. Matching first Bowling roster portrait discriminates rounded-square from circle; full geometry verified independently.','rows':control,'pass':True},indent=2)+'\n')
print(f'PASS {len(rows)} raster circle probes plus same-upload before/after negative control')
