#!/usr/bin/env python3
"""Verify the exact new presentation/server resources in staging or a built .app.
This supplements (does not replace) verify-ios-product.py. It never edits a product.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FILES=(
 'server.js','lib/tv-director.js','public/tv-show.js','public/tv-show.css',
 'public/tv.html','public/tv.js','public/tv.css','public/tv-layout.js',
 'public/index.html','public/app.js','public/motion.js','public/motion.css',
 'public/native-shell/index.html','public/native-shell/host.js',
 'public/native-shell/host.css','public/native-shell/controller-bridge.js',
)
def verify(root:Path, app:Path|None=None)->dict:
    root=root.resolve();product=app/'Server' if app else root/'ios/LocalParty/Server'
    hashes={}
    for name in FILES:
        expected=root/name;actual=product/name
        if not expected.is_file() or not actual.is_file():
            raise ValueError(f'Missing show resource: {name}')
        content=actual.read_bytes()
        if not content or content!=expected.read_bytes():
            raise ValueError(f'Stale or empty show resource: {name}')
        hashes[name]=hashlib.sha256(content).hexdigest()
    if 'tv-show-20260918.1' not in (product/'public/tv-show.js').read_text():
        raise ValueError('Presentation revision is absent')
    return {'ok':True,'revision':'tv-show-20260918.1','resourceCount':len(hashes),'sha256':hashes}
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--app',type=Path)
    args=parser.parse_args()
    try:print(json.dumps(verify(ROOT,args.app),ensure_ascii=False,indent=2))
    except (ValueError,OSError) as exc:parser.exit(1,f'Show product validation FAILED: {exc}\n')
if __name__=='__main__':main()
