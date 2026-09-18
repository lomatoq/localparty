import unittest,tempfile,importlib.util,shutil
from pathlib import Path
spec=importlib.util.spec_from_file_location('show_product',Path(__file__).resolve().parents[1]/'scripts/verify-show-product.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class Product(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name);self.app=self.root/'Build/LocalParty.app';self.server=self.app/'Server'
  for name in module.FILES:
   p=self.root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('tv-show-20260918.1\nfixture '+name)
   d=self.server/name;d.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,d)
 def test_exact_product(self):self.assertEqual(module.verify(self.root,self.app)['resourceCount'],16)
 def test_missing_asset(self):
  (self.server/'public/tv-show.js').unlink()
  with self.assertRaisesRegex(ValueError,'Missing'):module.verify(self.root,self.app)
 def test_stale_server(self):
  (self.server/'server.js').write_text('old')
  with self.assertRaisesRegex(ValueError,'Stale'):module.verify(self.root,self.app)
 def test_stale_style(self):
  (self.server/'public/motion.css').write_text('old')
  with self.assertRaisesRegex(ValueError,'Stale'):module.verify(self.root,self.app)
 def test_staging(self):
  p=self.root/'ios/LocalParty/Server';p.parent.mkdir(parents=True);shutil.copytree(self.server,p)
  self.assertTrue(module.verify(self.root)['ok'])
if __name__=='__main__':unittest.main()
