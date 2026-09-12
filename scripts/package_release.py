"""Development-only ZIP builder. Portable applications contain Node.js only.

Uses previously verified cached official Node archives; never downloads runtimes.
Build output is verified before atomically replacing the corresponding release.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import stat
import tarfile
import time
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'runtime-cache'
DIST = ROOT / 'dist'
TARGETS = ['windows-x64', 'macos-arm64', 'macos-x64']
NODE_FILES = {'node.exe', 'bin/node', 'LICENSE', 'README.md', 'CHANGELOG.md'}
EXCLUDE_DIRS = {'__pycache__', '.git', '.DS_Store', 'tests', 'test', '.cache', 'data-local'}

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def info(name, mode=0o644):
    z = zipfile.ZipInfo('LOCAL_PARTY/' + name, time.localtime()[:6])
    z.create_system = 3
    z.external_attr = (stat.S_IFREG | mode) << 16
    z.compress_type = zipfile.ZIP_DEFLATED
    return z

def included(path):
    return not (any(p in EXCLUDE_DIRS for p in path.parts)
                or path.suffix.lower() in {'.py', '.pyc', '.pyo', '.whl'}
                or '.test.' in path.name or '.spec.' in path.name
                or path.name in {'requirements.txt', '.complete.json'}
                or (path.parts[0]=='games' and ('check' in path.stem.lower() or 'screenshot' in path.stem.lower()) and path.suffix.lower() in {'.png','.jpg','.webp'})
                or (path.parts[0] == 'games' and path.suffix.lower() in {'.bat', '.command', '.sh'}))

def application_files(target):
    for name in ['server.js', 'catalog.json', 'package.json', 'package-lock.json', 'README.md', 'ARCHIVE_AUDIT.md']:
        f=ROOT/name
        if f.exists():
            data=f.read_bytes()
            if name=='package.json':
                package=json.loads(data)
                package['scripts']={'start':'node server.js'}
                data=(json.dumps(package,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
            yield name,data,0o644
    launcher='START_WINDOWS.bat' if target.startswith('windows') else 'START_MAC.command'
    yield launcher,(ROOT/launcher).read_bytes(),0o755
    for name in ['public','games','lib','node_modules','licenses']:
        base=ROOT/name
        if not base.exists():
            continue
        for f in sorted(base.rglob('*')):
            rel=f.relative_to(ROOT)
            if f.is_file() and included(rel):
                yield rel.as_posix(),f.read_bytes(),0o644

def put_runtime(out, archive):
    if archive.suffix == '.zip':
        with zipfile.ZipFile(archive) as source:
            for z in source.infolist():
                rel='/'.join(PurePosixPath(z.filename).parts[1:])
                if not z.is_dir() and rel in NODE_FILES:
                    out.writestr(info('runtime/node/'+rel),source.read(z))
    else:
        with tarfile.open(archive,'r:gz') as source:
            for m in source:
                rel='/'.join(PurePosixPath(m.name).parts[1:])
                if m.isfile() and rel in NODE_FILES:
                    with source.extractfile(m) as f:
                        out.writestr(info('runtime/node/'+rel,m.mode),f.read())

def manifest_from_cache(selected):
    old=json.loads((CACHE/'manifest.json').read_text(encoding='utf-8'))
    manifest={}
    for target in selected:
        node=old[target]['node']
        path=CACHE/node['file']
        if not path.is_file() or sha(path)!=node['sha256']:
            raise RuntimeError('Missing or changed verified Node cache: '+str(path))
        manifest[target]={'node':node}
    return manifest

def verify(archive,target):
    with zipfile.ZipFile(archive) as z:
        bad=z.testzip()
        if bad:
            raise RuntimeError('CRC error: '+bad)
        names=set(z.namelist())
        node='runtime/node/node.exe' if target.startswith('windows') else 'runtime/node/bin/node'
        launcher='START_WINDOWS.bat' if target.startswith('windows') else 'START_MAC.command'
        required=[node,launcher,'server.js','catalog.json','lib/party-runtime.js','node_modules/ws/index.js',
                  'games/tankarena/server.js','games/quiz/server.js']
        for name in required:
            assert 'LOCAL_PARTY/'+name in names,name
        for name in names:
            rel=PurePosixPath(name.removeprefix('LOCAL_PARTY/'))
            assert included(rel),name
            assert not name.startswith('LOCAL_PARTY/runtime/python/'),name
        catalog=json.loads(z.read('LOCAL_PARTY/catalog.json'))
        assert len(catalog)==len(json.loads((ROOT/'catalog.json').read_text(encoding='utf-8-sig'))), 'Missing game cards'
        assert all(g['runtime']=='node' and g['min']==2 and g['max']==16 for g in catalog)
        manifest=json.loads(z.read('LOCAL_PARTY/RUNTIME_MANIFEST.json'))
        assert set(manifest)=={'node'},manifest
        assert z.read('LOCAL_PARTY/lib/party-runtime.js')==(ROOT/'lib/party-runtime.js').read_bytes()
        if target.startswith('macos'):
            for name in [node,launcher]:
                assert (z.getinfo('LOCAL_PARTY/'+name).external_attr >> 16)&0o111,name
    return {'file':str(archive),'bytes':archive.stat().st_size,'sha256':sha(archive)}

def build(selected,manifest):
    DIST.mkdir(exist_ok=True)
    results=[]
    for target in selected:
        dest=DIST/f'LOCAL_PARTY_{target}.zip'
        pending=dest.with_suffix('.building.zip')
        print('Package',dest.name,flush=True)
        with zipfile.ZipFile(pending,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as out:
            for name,data,mode in application_files(target):
                out.writestr(info(name,mode),data)
            put_runtime(out,CACHE/manifest[target]['node']['file'])
            out.writestr(info('RUNTIME_MANIFEST.json'),json.dumps(manifest[target],indent=2))
        result=verify(pending,target)
        pending.replace(dest)
        result['file']=str(dest)
        dest.with_suffix('.zip.sha256').write_text(result['sha256']+'  '+dest.name+'\n',encoding='utf-8')
        results.append(result)
        print('Verified',target,flush=True)
    print(json.dumps(results,indent=2),flush=True)
    return results

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cached',action='store_true',help='Compatibility flag: all builds are cached/offline')
    parser.add_argument('--prepare',action='store_true',help='Only verify cached Node runtimes')
    parser.add_argument('--target',action='append',choices=TARGETS)
    args=parser.parse_args()
    selected=args.target or TARGETS
    manifest=manifest_from_cache(selected)
    if not args.prepare:
        build(selected,manifest)
    else:
        print('All selected Node runtimes match their verified SHA256 hashes.',flush=True)

