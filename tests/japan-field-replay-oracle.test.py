"""Independent Decimal calculations, not reproduction of original flux measurements."""
from pathlib import Path
from decimal import Decimal as D, getcontext
import json, subprocess, unittest
getcontext().prec=32
R=Path(__file__).resolve().parents[1]
class FieldPublishedIndependentTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.fixture=json.loads((R/'research/japan-field-replay-2026-10-18/published-aggregates.json').read_text())
  p=subprocess.run(['node','scripts/japan-field-replay.cjs'],cwd=R,text=True,capture_output=True,timeout=15)
  if p.returncode:raise RuntimeError(p.stderr)
  cls.result=json.loads(p.stdout)
 def test_yagi_pairwise(self):
  study=self.fixture['sources'][0]
  self.assertEqual(study['doi'],'10.1029/96GB00517')
  for original,out in zip(study['years'],self.result['yagi']['rows']):
   self.assertEqual(original['year'],out['year'])
   c=D(original['continuous_flooding_g_m2']);d=D(original['intermittent_drainage_g_m2'])
   self.assertAlmostEqual(float(c*10),out['continuous_flooding_kg_ch4_ha'],places=8)
   self.assertAlmostEqual(float(d*10),out['intermittent_drainage_kg_ch4_ha'],places=8)
   self.assertAlmostEqual(float((c-d)*10),out['paired_difference_kg_ch4_ha'],places=8)
   self.assertAlmostEqual(float((c-d)/c*100),out['arithmetic_difference_percent'],places=8)
   self.assertIsNone(out['causal_attribution'])
 def test_nishimura_annual(self):
  study=self.fixture['sources'][1]
  self.assertEqual(study['doi'],'10.1029/2003GB002207')
  model=D(study['growing_mg_m2'])+D(study['fallow_mg_m2'])
  published=D(study['published_annual_mg_m2'])
  result=self.result['nishimura']
  self.assertEqual(model,D('3129'))
  self.assertEqual(model*D('.01'),D(str(result['computed_annual_kg_ch4_ha'])))
  self.assertEqual(published*D('.01'),D(str(result['published_annual_kg_ch4_ha'])))
  self.assertEqual((published-model)*D('.01'),D(str(result['signed_reported_minus_sum_kg_ch4_ha'])))
  self.assertLessEqual(abs(published-model),D('1.5'))
  self.assertIsNone(result['inferred_cause'])
 def test_accounting_shapley(self):
  a,b,ra,rb=D('2'),D('1'),D('100'),D('90')
  delta=a*ra-b*rb
  area=(a-b)*(ra+rb)/2
  rate=(ra-rb)*(a+b)/2
  output=self.result['synthetic_shapley']
  self.assertEqual(delta,D(str(output['difference_kg_ch4'])))
  self.assertEqual(area,D(str(output['area_component_kg_ch4'])))
  self.assertEqual(rate,D(str(output['intensity_component_kg_ch4'])))
  self.assertEqual(delta,area+rate)
  self.assertIsNone(output['causal_effect'])
 def test_no_environment_overclaim(self):
  self.assertEqual(self.result['environment_mismatch_control']['status'],'BLOCKED_CONTEXT_OR_PROVENANCE')
  self.assertIsNone(self.result['environment_mismatch_control']['difference_kg_ch4'])
  self.assertEqual(self.fixture['provenance_status'],'SECONDARY_TRANSCRIPTION_ORIGINAL_TABLE_NOT_RECHECKED')
  self.assertFalse(self.fixture['raw_observation_series_available'])
 def test_no_official_claim(self):
  self.assertIsNone(self.result['yagi']['formal_jcredit_eligibility'])
  self.assertIsNone(self.result['nishimura']['formal_jcredit_eligibility'])
if __name__=='__main__':unittest.main(verbosity=2)
