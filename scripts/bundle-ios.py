#!/usr/bin/env python3
"""Synchronize the current repository into the offline app bundle on every build."""
from pathlib import Path
import shutil,json,os,hashlib
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'ios/LocalParty/Server'
def sync(source,target):
    if source.is_dir():
        target.mkdir(parents=True,exist_ok=True)
        children={p.name:p for p in source.iterdir() if not (p.name=='.DS_Store' or p.name=='.bin' or p.name.endswith(('.map','.test.js','.test.cjs')))}
        for p in target.iterdir():
            if p.name not in children:
                if p.is_dir() and not p.is_symlink():shutil.rmtree(p)
                else:p.unlink()
        for name,p in children.items():sync(p,target/name)
    elif not target.exists() or source.stat().st_size!=target.stat().st_size or source.stat().st_mtime_ns!=target.stat().st_mtime_ns:
        shutil.copy2(source,target)
def main():
    if not (ROOT/'node_modules/express').exists():raise SystemExit('Run npm ci and npm run ios:prepare before building in Xcode.')
    DEST.mkdir(parents=True,exist_ok=True)
    for name in ['server.js','catalog.json','package.json','package-lock.json','games','lib','public','node_modules']:sync(ROOT/name,DEST/name)
    sync(ROOT/'ios/bootstrap.cjs',DEST/'bootstrap.cjs')
    sync(ROOT/'ios/NODE-LICENSE',DEST/'NODE-LICENSE')
    sync(ROOT/'ios/NativePhysics/LICENSE',DEST/'WABT-LICENSE')
    # Write into the product on every build. Xcode's directory-resource copy can
    # otherwise skip changed descendants and ship the previous server.
    if os.environ.get('TARGET_BUILD_DIR') and os.environ.get('UNLOCALIZED_RESOURCES_FOLDER_PATH'):
        product=Path(os.environ['TARGET_BUILD_DIR'])/os.environ['UNLOCALIZED_RESOURCES_FOLDER_PATH']/'Server'
        sync(DEST,product)
        for source in DEST.rglob('*'):
            if source.is_file():
                target=product/source.relative_to(DEST)
                if hashlib.sha256(source.read_bytes()).digest()!=hashlib.sha256(target.read_bytes()).digest():
                    raise SystemExit('Stale bundled resource: '+str(target))
    print('iPhone bundle:',len(json.loads((ROOT/'catalog.json').read_text())),'games synchronized')
if __name__=='__main__':main()
