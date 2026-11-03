import importlib.util,json,pathlib,tempfile,unittest
root=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('p21_intake',root/'scripts/p21-jaxa-lulc-local-intake.py')
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
class BatchTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.r=json.loads((root/'research/p21-jaxa-lulc-2024-v25-04-batch01.json').read_text())
 def test_valid(self):self.assertTrue(p.validate(self.r))
 def test_water_and_nodata(self):
  self.assertEqual([t['nodata'] for t in self.r['tiles']],[None,None,0])
  self.assertEqual(self.r['tiles'][1]['count_by_class'][2],32028)
  self.assertEqual(self.r['tiles'][1]['count_by_class'][0],141661823)
 def test_forged_count(self):
  r=json.loads(json.dumps(self.r));r['tiles'][0]['count_by_class'][2]+=1
  with self.assertRaisesRegex(p.IntakeError,'TILE_COUNTS'):p.validate(r)
 def test_forged_license(self):
  r=json.loads(json.dumps(self.r));r['source_redistribution_permission_verified']=True
  with self.assertRaisesRegex(p.IntakeError,'SCOPE'):p.validate(r)
 def test_corrupt_file(self):
  with tempfile.TemporaryDirectory() as d:
   for f in p.SUPPORT:(pathlib.Path(d)/f).write_bytes(b'bad')
   with self.assertRaisesRegex(p.IntakeError,'SUPPORT_SHA'):p.replay(d,root/'research/p21-jaxa-lulc-2024-v25-04-batch01.json')
if __name__=='__main__':unittest.main()
