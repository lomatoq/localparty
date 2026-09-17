"""Unit tests of product validation with synthetic resources, not an iOS build."""
import importlib.util
import json
import plistlib
import shutil
import tempfile
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('verify_ios', Path(__file__).resolve().parents[1]/'scripts/verify-ios-product.py')
verify_ios=importlib.util.module_from_spec(spec);spec.loader.exec_module(verify_ios)

class ProductValidationTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        self.server=self.root/'ios/LocalParty/Server'
        for name in ['bootstrap.cjs','server.js','lib/catalog.js','public/style.css','public/refresh.css','public/glass.css',
                     'public/ux.css','public/catalog-previews.css','public/fresh.css','public/tv.html','public/tv.js']:
            p=self.server/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('fixture')
        self.games=[{'id':'g1','title':'First','controls':'Tap','color':'#ffffff','engine':'fixture'},
                    {'id':'g2','title':'Second','controls':'Tap','color':'#ffffff','engine':'fixture'}]
        (self.server/'games/fixture').mkdir(parents=True)
        (self.server/'games/sports_siege').mkdir(parents=True)
        self.write('catalog.json',self.games[:1]);self.write('games/sports_siege/catalog.json',self.games[1:]);self.write('native-catalog.json',self.games)
        for name in verify_ios.SHELL_FILES:
            rel='public/native-shell/'+name
            for root in [self.root,self.server]:
                p=root/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('fixture '+verify_ios.REVISION)
    def tearDown(self):self.tmp.cleanup()
    def write(self,name,data):(self.server/name).write_text(json.dumps(data))
    def app(self):
        app=self.root/'LocalParty.app';app.mkdir();shutil.copytree(self.server,app/'Server')
        info={'CFBundleIdentifier':'example.localparty','CFBundleVersion':'15','DTSDKName':'iphoneos27.0',
              'UIApplicationSceneManifest':{'UIApplicationSupportsMultipleScenes':True,'UISceneConfigurations':{
                  'UIWindowSceneSessionRoleExternalDisplayNonInteractive':[{'UISceneDelegateClassName':'LocalParty.PartyExternalDisplaySceneDelegate'}]}}}
        (app/'Info.plist').write_bytes(plistlib.dumps(info,fmt=plistlib.FMT_BINARY))
        return app,info
    def test_valid_staging(self):self.assertEqual(verify_ios.verify(self.root)['catalogCount'],2)
    def test_missing_catalog(self):
        (self.server/'native-catalog.json').unlink()
        with self.assertRaisesRegex(ValueError,'Missing'):verify_ios.verify(self.root)
    def test_empty_catalog(self):
        self.write('native-catalog.json',[])
        with self.assertRaisesRegex(ValueError,'nonempty'):verify_ios.verify(self.root)
    def test_duplicate_ids(self):
        self.write('native-catalog.json',[self.games[0],self.games[0]])
        with self.assertRaisesRegex(ValueError,'Duplicate'):verify_ios.verify(self.root)
    def test_lost_extension_game(self):
        self.write('native-catalog.json',self.games[:1])
        with self.assertRaisesRegex(ValueError,'Incomplete'):verify_ios.verify(self.root)
    def test_stale_shell(self):
        (self.server/'public/native-shell/host.js').write_text('old shell')
        with self.assertRaisesRegex(ValueError,'Stale'):verify_ios.verify(self.root)
    def test_valid_product(self):
        app,info=self.app();self.assertTrue(verify_ios.verify(self.root,app)['ok'])
    def test_wrong_sdk(self):
        app,info=self.app();info['DTSDKName']='iphoneos26.0';(app/'Info.plist').write_bytes(plistlib.dumps(info))
        with self.assertRaisesRegex(ValueError,'SDK'):verify_ios.verify(self.root,app)
    def test_missing_external_scene(self):
        app,info=self.app();info['UIApplicationSceneManifest']['UISceneConfigurations']={};(app/'Info.plist').write_bytes(plistlib.dumps(info))
        with self.assertRaisesRegex(ValueError,'external-display'):verify_ios.verify(self.root,app)
    def test_missing_engine(self):
        (self.server/'games/fixture').rmdir()
        with self.assertRaisesRegex(ValueError,'engine missing'):verify_ios.verify(self.root)
    def test_invalid_native_schema(self):
        self.write('native-catalog.json',[{'id':'x','title':'Only title'}])
        with self.assertRaisesRegex(ValueError,'Swift-required'):verify_ios.verify(self.root)

if __name__=='__main__':unittest.main()
