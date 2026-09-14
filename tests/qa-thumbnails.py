"""Review actual browser renders; this does not generate or alter game artwork."""
from pathlib import Path
import base64
from PIL import Image, ImageOps
root=Path(__file__).resolve().parents[1]/'test-results'/'polish-v2'
out=root/'thumbs'
out.mkdir(parents=True,exist_ok=True)
for file in root.glob('*.jpg'):
    with Image.open(file) as source:
        im=source.convert('RGB')
        im.thumbnail((360,500),Image.Resampling.LANCZOS)
        dest=out/file.name
        im.save(dest,quality=45,optimize=True)
        data=base64.b64encode(dest.read_bytes()).decode('ascii')
        (out/(file.stem+'.b64')).write_text('\n'.join(data[i:i+100] for i in range(0,len(data),100))+'\n')
print('Real screenshot thumbnails:',len(list(out.glob('*.jpg'))))
