#!/usr/bin/env python3
"""Build the offline iPhone resource bundle and reproducible native Rapier sources."""
from pathlib import Path
import hashlib,json,os,platform,shutil,subprocess,tarfile,urllib.request,zipfile
ROOT=Path(__file__).resolve().parents[1]
IOS=ROOT/'ios'; CACHE=IOS/'.cache'; VENDOR=IOS/'Vendor'; PHYSICS=IOS/'NativePhysics'
NODE_VERSION='18.20.4'; WABT_VERSION='1.0.41'
NODE_SHA='8c5ca3a0d1e38de7f182a5642593e82593b820efd375a14b3ecafc4bcfee620e'
WABT_SHA='e5269d6bbe05dfeb179e4f21111b3a641d6ccaa38b0b21d472ae5c65f8c4ff5d'
def run(*args,**options):subprocess.run(args,check=True,**options)
def download(url,target,digest):
    if not target.exists() or hashlib.sha256(target.read_bytes()).hexdigest()!=digest:
        temporary=target.with_suffix('.download');print('Downloading',url,flush=True)
        request=urllib.request.Request(url,headers={'User-Agent':'LocalParty-iOS-builder'})
        with urllib.request.urlopen(request) as response, temporary.open('wb') as out:shutil.copyfileobj(response,out)
        if hashlib.sha256(temporary.read_bytes()).hexdigest()!=digest:raise RuntimeError('Checksum mismatch: '+url)
        temporary.replace(target)
def bundle():
    run('/usr/bin/python3',str(ROOT/'scripts/bundle-ios.py'))
def main():
    if platform.system()!='Darwin':raise SystemExit('iPhone builds require macOS and Xcode.')
    CACHE.mkdir(parents=True,exist_ok=True);VENDOR.mkdir(exist_ok=True)
    if not (ROOT/'node_modules/express').exists():run('npm','ci','--ignore-scripts',cwd=ROOT)
    archive=CACHE/'node-ios.zip';download(f'https://github.com/nodejs-mobile/nodejs-mobile/releases/download/v{NODE_VERSION}/nodejs-mobile-v{NODE_VERSION}-ios.zip',archive,NODE_SHA)
    unpacked=CACHE/'node';unpacked.mkdir(exist_ok=True)
    if not (unpacked/'NodeMobile.xcframework').exists():
        with zipfile.ZipFile(archive) as z:z.extractall(unpacked)
    if not (VENDOR/'NodeMobile.xcframework').exists():shutil.copytree(unpacked/'NodeMobile.xcframework',VENDOR/'NodeMobile.xcframework')
    shutil.copytree(unpacked/'include/node',VENDOR/'include',dirs_exist_ok=True)
    if not all((PHYSICS/(name+'.c')).exists() for name in ['rapier2d','rapier3d']):
        if platform.machine()!='arm64':raise SystemExit('Native physics generation currently requires an Apple Silicon Mac. Generated C can then build for either simulator architecture.')
        archive=CACHE/'wabt.tar.gz';download(f'https://github.com/WebAssembly/wabt/releases/download/{WABT_VERSION}/wabt-{WABT_VERSION}-macos-arm64.tar.gz',archive,WABT_SHA)
        with tarfile.open(archive) as tar:
            for item in tar.getmembers():
                if not (CACHE/item.name).resolve().is_relative_to(CACHE.resolve()):raise RuntimeError('Unsafe archive path')
            tar.extractall(CACHE)
        # Official macOS wasm2c uses OpenSSL only for SHA256. CommonCrypto supplies
        # the identical digest when Homebrew OpenSSL is absent; no system changes.
        shim=CACHE/'sha256.c';shim.write_text('#include <stddef.h>\n#include <CommonCrypto/CommonDigest.h>\nunsigned char *SHA256(const unsigned char *d,size_t n,unsigned char *o){return CC_SHA256(d,(CC_LONG)n,o);}\n')
        run('clang','-dynamiclib',str(shim),'-o',str(CACHE/'libcrypto.3.dylib'),'-current_version','3.0.0','-compatibility_version','3.0.0')
        env={**os.environ,'DYLD_LIBRARY_PATH':str(CACHE)}
        for dim in ['2d','3d']:
            wasm=ROOT/f'node_modules/@dimforge/rapier{dim}-compat/dist/rapier_wasm{dim}_bg.wasm'
            run(str(CACHE/f'wabt-{WABT_VERSION}/bin/wasm2c'),str(wasm),'--module-name','rapier'+dim,'-o',str(PHYSICS/f'rapier{dim}.c'),env=env)
    run('/usr/bin/python3',str(ROOT/'scripts/patch-native-widths.py'))
    bundle()
    print('Ready:',IOS/'LocalParty.xcodeproj')
if __name__=='__main__':main()
